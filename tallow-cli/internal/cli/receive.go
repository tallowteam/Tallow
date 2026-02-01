package cli

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/tallow/tallow-cli/internal/crypto"
	"github.com/tallow/tallow-cli/internal/discovery"
	"github.com/tallow/tallow-cli/internal/network"
	"github.com/tallow/tallow-cli/internal/transfer"
	"github.com/tallow/tallow-cli/pkg/protocol"
)

var (
	receiveOutput    string
	receiveOverwrite bool
	receiveLocal     bool
)

var receiveCmd = &cobra.Command{
	Use:   "receive <code>",
	Short: "Receive a file",
	Long: `Receive a file using the code provided by the sender.

Examples:
  # Receive a file
  tallow receive alpha-beta-gamma

  # Save to specific directory
  tallow receive -o ~/Downloads alpha-beta-gamma

  # Allow overwriting existing files
  tallow receive --overwrite alpha-beta-gamma`,
	Args: cobra.ExactArgs(1),
	RunE: runReceive,
}

func init() {
	rootCmd.AddCommand(receiveCmd)

	receiveCmd.Flags().StringVarP(&receiveOutput, "output", "o", ".", "output directory")
	receiveCmd.Flags().BoolVar(&receiveOverwrite, "overwrite", false, "overwrite existing files")
	receiveCmd.Flags().BoolVar(&receiveLocal, "local", true, "prefer local network discovery")
}

func runReceive(cmd *cobra.Command, args []string) error {
	code := protocol.NormalizeRoomCode(args[0])

	// Validate code
	if !protocol.ValidateRoomCode(code) {
		return fmt.Errorf("invalid code format")
	}

	green := color.New(color.FgGreen, color.Bold)
	cyan := color.New(color.FgCyan)
	yellow := color.New(color.FgYellow)

	fmt.Println()
	cyan.Printf("Code: %s\n", code)
	fmt.Println()
	yellow.Println("Connecting to sender...")
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

	// Create receiver
	receiver, err := transfer.NewReceiver(transfer.ReceiverConfig{
		OutputDir: receiveOutput,
		RoomCode:  code,
		RelayURL:  GetRelayServer(),
		Timeout:   30 * time.Minute,
		Overwrite: receiveOverwrite,
	})
	if err != nil {
		return err
	}
	defer receiver.Close()

	// Try local discovery first if enabled
	var conn network.ReadWriteCloserWithDeadline
	if receiveLocal {
		conn, err = tryLocalConnection(ctx, code)
		if err != nil && IsVerbose() {
			fmt.Printf("Local discovery: %v\n", err)
		}
	}

	// Fall back to relay if local discovery failed
	if conn == nil {
		conn, err = connectToRelay(ctx, code, false)
		if err != nil {
			return fmt.Errorf("failed to connect: %w", err)
		}
	}

	// Perform PAKE key exchange
	sessionKey, err := performPAKEReceiver(conn, code)
	if err != nil {
		return fmt.Errorf("key exchange failed: %w", err)
	}

	// Set session key
	if err := receiver.SetSessionKey(sessionKey); err != nil {
		return err
	}
	receiver.SetConnection(conn)

	// Perform hybrid key exchange
	hybridKey, err := performHybridExchangeReceiver(conn, receiver)
	if err != nil {
		return fmt.Errorf("hybrid key exchange failed: %w", err)
	}

	// Derive final key
	finalKey := crypto.Blake3DeriveKey("tallow-final-key-v1",
		append(sessionKey, hybridKey...), 32)
	if err := receiver.SetSessionKey(finalKey); err != nil {
		return err
	}

	// Receive file
	fmt.Println()
	if err := receiver.Receive(ctx); err != nil {
		return fmt.Errorf("transfer failed: %w", err)
	}

	fmt.Println()
	green.Printf("Saved: %s\n", receiver.OutputPath())
	return nil
}

func tryLocalConnection(ctx context.Context, code string) (network.ReadWriteCloserWithDeadline, error) {
	if IsVerbose() {
		fmt.Println("Looking for sender on local network...")
	}

	// Use mDNS discovery to find sender
	resolver := discovery.NewResolver(3 * time.Second)
	peer, err := resolver.ResolveByRoom(ctx, code)
	if err != nil {
		return nil, err
	}

	if IsVerbose() {
		fmt.Printf("Found sender at %s:%d\n", peer.IP, peer.Port)
	}

	// Connect to sender
	addr := fmt.Sprintf("%s:%d", peer.IP, peer.Port)
	conn, err := network.DialWithTimeout(addr, 10*time.Second)
	if err != nil {
		return nil, err
	}

	return conn, nil
}

func performPAKEReceiver(conn network.ReadWriteCloserWithDeadline, code string) ([]byte, error) {
	password := protocol.CodeToKeyMaterial(code)

	// Read message 1 from initiator
	msg1 := make([]byte, crypto.CPaceIDSize+crypto.CPaceElementSize)
	if _, err := conn.Read(msg1); err != nil {
		return nil, err
	}

	// Respond as responder
	exchange, msg2, err := crypto.ResponderRespond(password, msg1)
	if err != nil {
		return nil, err
	}

	// Send message 2
	if _, err := conn.Write(msg2); err != nil {
		return nil, err
	}

	// Read initiator's confirmation
	confirmation := make([]byte, 32)
	if _, err := conn.Read(confirmation); err != nil {
		return nil, err
	}

	// Verify confirmation
	if err := exchange.ResponderVerify(confirmation); err != nil {
		return nil, fmt.Errorf("authentication failed: wrong code")
	}

	return exchange.SharedKey(), nil
}

func performHybridExchangeReceiver(conn network.ReadWriteCloserWithDeadline, receiver *transfer.Receiver) ([]byte, error) {
	// Read sender's public key
	pubKeyBuf := make([]byte, 4096)
	n, err := conn.Read(pubKeyBuf)
	if err != nil {
		return nil, err
	}

	peerPubKey, err := crypto.HybridPublicKeyFromBytes(pubKeyBuf[:n])
	if err != nil {
		return nil, err
	}

	// Encapsulate to sender's public key
	encap, sharedSecret, err := crypto.HybridEncapsulate(peerPubKey)
	if err != nil {
		return nil, err
	}

	// Send encapsulation
	if _, err := conn.Write(encap.Bytes()); err != nil {
		return nil, err
	}

	return sharedSecret, nil
}
