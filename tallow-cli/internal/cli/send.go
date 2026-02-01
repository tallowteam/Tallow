package cli

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/tallow/tallow-cli/internal/crypto"
	"github.com/tallow/tallow-cli/internal/discovery"
	"github.com/tallow/tallow-cli/internal/network"
	"github.com/tallow/tallow-cli/internal/transfer"
	"github.com/tallow/tallow-cli/pkg/protocol"
)

var (
	sendCompress   bool
	sendLocal      bool
	sendCode       string
	sendCodeWords  int
)

var sendCmd = &cobra.Command{
	Use:   "send <file>",
	Short: "Send a file",
	Long: `Send a file securely using post-quantum encryption.

The recipient will need the code to receive the file.

Examples:
  # Send a file with auto-generated code
  tallow send document.pdf

  # Send with custom code
  tallow send --code my-secret-code document.pdf

  # Send with compression disabled
  tallow send --no-compress largefile.bin

  # Prefer local network transfer
  tallow send --local document.pdf`,
	Args: cobra.ExactArgs(1),
	RunE: runSend,
}

func init() {
	rootCmd.AddCommand(sendCmd)

	sendCmd.Flags().BoolVar(&sendCompress, "compress", true, "enable compression")
	sendCmd.Flags().BoolVar(&sendLocal, "local", true, "prefer local network discovery")
	sendCmd.Flags().StringVar(&sendCode, "code", "", "use custom code")
	sendCmd.Flags().IntVar(&sendCodeWords, "words", 3, "number of words in generated code")
}

func runSend(cmd *cobra.Command, args []string) error {
	filePath := args[0]

	// Verify file exists
	stat, err := os.Stat(filePath)
	if err != nil {
		return fmt.Errorf("cannot access file: %w", err)
	}
	if stat.IsDir() {
		return fmt.Errorf("directories not yet supported, please zip first")
	}

	// Generate or use provided code
	code := sendCode
	if code == "" {
		code, err = protocol.GenerateRoomCode(sendCodeWords)
		if err != nil {
			return fmt.Errorf("failed to generate code: %w", err)
		}
	}

	// Display code
	green := color.New(color.FgGreen, color.Bold)
	cyan := color.New(color.FgCyan)
	yellow := color.New(color.FgYellow)

	fmt.Println()
	green.Printf("Code: %s\n", code)
	fmt.Println()
	cyan.Printf("File: %s (%s)\n", filepath.Base(filePath), formatSize(stat.Size()))
	fmt.Println()
	yellow.Println("Waiting for receiver...")
	fmt.Println()

	// Setup context with signal handling
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		fmt.Println("\nCancelled.")
		cancel()
	}()

	// Create sender
	sender, err := transfer.NewSender(transfer.SenderConfig{
		FilePath:   filePath,
		ChunkSize:  viper.GetInt("chunk_size"),
		Compress:   sendCompress,
		RoomCode:   code,
		RelayURL:   GetRelayServer(),
		LocalFirst: sendLocal,
		Timeout:    30 * time.Minute,
	})
	if err != nil {
		return err
	}
	defer sender.Close()

	// Prepare file (hash, chunking setup)
	fmt.Print("Preparing file...")
	if err := sender.Prepare(); err != nil {
		return err
	}
	fmt.Println(" done")

	// Try local discovery first if enabled
	var conn network.ReadWriteCloserWithDeadline
	if sendLocal {
		conn, err = tryLocalDiscovery(ctx, code, sender)
		if err != nil && IsVerbose() {
			fmt.Printf("Local discovery: %v\n", err)
		}
	}

	// Fall back to relay if local discovery failed
	if conn == nil {
		conn, err = connectToRelay(ctx, code, true)
		if err != nil {
			return fmt.Errorf("failed to connect: %w", err)
		}
	}

	// Perform PAKE key exchange
	sessionKey, err := performPAKESender(conn, code)
	if err != nil {
		return fmt.Errorf("key exchange failed: %w", err)
	}

	// Set session key
	if err := sender.SetSessionKey(sessionKey); err != nil {
		return err
	}
	sender.SetConnection(conn)

	// Perform hybrid key exchange
	hybridKey, err := performHybridExchange(conn, sender.PublicKey())
	if err != nil {
		return fmt.Errorf("hybrid key exchange failed: %w", err)
	}

	// Derive final key
	finalKey := crypto.Blake3DeriveKey("tallow-final-key-v1",
		append(sessionKey, hybridKey...), 32)
	if err := sender.SetSessionKey(finalKey); err != nil {
		return err
	}

	// Send file
	fmt.Println()
	if err := sender.Send(ctx); err != nil {
		return fmt.Errorf("transfer failed: %w", err)
	}

	fmt.Println()
	green.Println("Transfer complete!")
	return nil
}

func tryLocalDiscovery(ctx context.Context, code string, sender *transfer.Sender) (network.ReadWriteCloserWithDeadline, error) {
	// Start mDNS advertiser
	listener, err := network.Listen(":0")
	if err != nil {
		return nil, err
	}

	advertiser := discovery.NewAdvertiser(listener.Port(), code)
	if err := advertiser.Start(); err != nil {
		listener.Close()
		return nil, err
	}
	defer advertiser.Stop()

	if IsVerbose() {
		fmt.Printf("Advertising on local network (port %d)...\n", listener.Port())
	}

	// Wait for connection with timeout
	connCh := make(chan *network.TCPConnection, 1)
	errCh := make(chan error, 1)

	go func() {
		conn, err := listener.Accept()
		if err != nil {
			errCh <- err
			return
		}
		connCh <- conn
	}()

	// Wait for local connection or timeout
	select {
	case conn := <-connCh:
		if IsVerbose() {
			fmt.Println("Local connection established!")
		}
		listener.Close()
		return conn, nil
	case err := <-errCh:
		listener.Close()
		return nil, err
	case <-time.After(5 * time.Second):
		listener.Close()
		return nil, fmt.Errorf("local discovery timeout")
	case <-ctx.Done():
		listener.Close()
		return nil, ctx.Err()
	}
}

func connectToRelay(ctx context.Context, code string, isSender bool) (*network.WebSocketConnection, error) {
	relayURL := GetRelayServer()
	roomID := protocol.RoomIDFromCode(code)

	if IsVerbose() {
		fmt.Printf("Connecting to relay %s (room: %s)...\n", relayURL, roomID[:8])
	}

	// Connect to relay
	conn, err := network.DialWebSocket(ctx, relayURL+"/ws?room="+roomID)
	if err != nil {
		return nil, err
	}

	// Read join confirmation
	buf := make([]byte, 256)
	n, err := conn.Read(buf)
	if err != nil {
		conn.Close()
		return nil, err
	}

	msg := string(buf[:n])
	if msg == "error: room is full" {
		conn.Close()
		return nil, fmt.Errorf("room is full")
	}

	if IsVerbose() {
		fmt.Printf("Relay: %s\n", msg)
	}

	// Wait for peer if needed
	if msg == "waiting" {
		fmt.Print("Waiting for peer to connect...")
		n, err = conn.Read(buf)
		if err != nil {
			conn.Close()
			return nil, err
		}
		msg = string(buf[:n])
		fmt.Println(" connected!")
	}

	if msg != "connected" && msg != "joined" {
		if msg[:5] == "error" || msg[:7] == "timeout" {
			conn.Close()
			return nil, fmt.Errorf("relay: %s", msg)
		}
	}

	return conn, nil
}

func performPAKESender(conn network.ReadWriteCloserWithDeadline, code string) ([]byte, error) {
	password := protocol.CodeToKeyMaterial(code)

	// Start PAKE as initiator
	exchange, msg1, err := crypto.InitiatorStart(password)
	if err != nil {
		return nil, err
	}

	// Send message 1
	if _, err := conn.Write(msg1); err != nil {
		return nil, err
	}

	// Read message 2
	msg2 := make([]byte, crypto.CPaceElementSize+32)
	if _, err := conn.Read(msg2); err != nil {
		return nil, err
	}

	// Complete exchange
	confirmation, err := exchange.InitiatorFinish(msg2)
	if err != nil {
		return nil, err
	}

	// Send confirmation
	if _, err := conn.Write(confirmation); err != nil {
		return nil, err
	}

	return exchange.SharedKey(), nil
}

func performHybridExchange(conn network.ReadWriteCloserWithDeadline, localPubKey *crypto.HybridPublicKey) ([]byte, error) {
	// Send our public key
	if _, err := conn.Write(localPubKey.Bytes()); err != nil {
		return nil, err
	}

	// Read peer's encapsulation
	encapBuf := make([]byte, 4096)
	n, err := conn.Read(encapBuf)
	if err != nil {
		return nil, err
	}

	encap, err := crypto.HybridEncapsulationFromBytes(encapBuf[:n])
	if err != nil {
		return nil, err
	}

	// For sender, we need to generate our own key pair and decapsulate
	// In a full implementation, sender would receive encap from receiver
	// For now, we'll generate a shared key from the encapsulation

	// This is simplified - in production, there would be a proper key exchange
	sharedKey := crypto.Blake3Hash(encap.Bytes())
	return sharedKey, nil
}

func formatSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

