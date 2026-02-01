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
	"github.com/tallow/tallow-cli/internal/network"
	"github.com/tallow/tallow-cli/internal/transfer"
	"github.com/tallow/tallow-cli/pkg/protocol"
)

var (
	batchCompress  bool
	batchLocal     bool
	batchCode      string
	batchCodeWords int
	batchOutput    string
	batchOverwrite bool
)

// sendMultiCmd handles sending multiple files/folders (drag-and-drop support)
var sendMultiCmd = &cobra.Command{
	Use:   "send-all <files/folders...>",
	Short: "Send multiple files and folders",
	Long: `Send multiple files and folders securely using post-quantum encryption.

Supports drag-and-drop: simply drop files/folders onto the terminal.
All files will be archived together and sent as one transfer.

Examples:
  # Send multiple files
  tallow send-all file1.pdf file2.jpg file3.doc

  # Send a folder
  tallow send-all ./my-folder

  # Send mixed files and folders
  tallow send-all ./project document.pdf ./images

  # Send with custom code
  tallow send-all --code my-secret ./folder`,
	Args: cobra.MinimumNArgs(1),
	RunE: runSendMulti,
}

// receiveAllCmd handles receiving all files at once
var receiveAllCmd = &cobra.Command{
	Use:   "receive-all <code>",
	Short: "Receive all files and folders",
	Long: `Receive all files and folders from a batch transfer.

Downloads and extracts the complete transfer to the specified directory.

Examples:
  # Receive to current directory
  tallow receive-all alpha-bear-cat

  # Receive to specific directory
  tallow receive-all -o ~/Downloads alpha-bear-cat

  # Overwrite existing files
  tallow receive-all --overwrite alpha-bear-cat`,
	Args: cobra.ExactArgs(1),
	RunE: runReceiveAll,
}

func init() {
	rootCmd.AddCommand(sendMultiCmd)
	rootCmd.AddCommand(receiveAllCmd)

	// send-all flags
	sendMultiCmd.Flags().BoolVar(&batchCompress, "compress", true, "enable compression")
	sendMultiCmd.Flags().BoolVar(&batchLocal, "local", true, "prefer local network discovery")
	sendMultiCmd.Flags().StringVar(&batchCode, "code", "", "use custom code")
	sendMultiCmd.Flags().IntVar(&batchCodeWords, "words", 3, "number of words in generated code")

	// receive-all flags
	receiveAllCmd.Flags().StringVarP(&batchOutput, "output", "o", ".", "output directory")
	receiveAllCmd.Flags().BoolVar(&batchOverwrite, "overwrite", false, "overwrite existing files")
	receiveAllCmd.Flags().BoolVar(&batchLocal, "local", true, "prefer local network discovery")
}

func runSendMulti(cmd *cobra.Command, args []string) error {
	// Parse all paths (drag-and-drop support)
	parser := transfer.NewDragDropParser()
	if err := parser.AddPaths(args); err != nil {
		return fmt.Errorf("invalid path: %w", err)
	}

	// Get statistics
	files, dirs, totalSize, err := parser.TotalItems()
	if err != nil {
		return fmt.Errorf("failed to scan paths: %w", err)
	}

	// Generate or use provided code
	code := batchCode
	if code == "" {
		code, err = protocol.GenerateRoomCode(batchCodeWords)
		if err != nil {
			return fmt.Errorf("failed to generate code: %w", err)
		}
	}

	// Display info
	green := color.New(color.FgGreen, color.Bold)
	cyan := color.New(color.FgCyan)
	yellow := color.New(color.FgYellow)
	white := color.New(color.FgWhite)

	fmt.Println()
	green.Printf("Code: %s\n", code)
	fmt.Println()
	cyan.Printf("Files: %d | Folders: %d | Total: %s\n", files, dirs, formatSize(totalSize))
	fmt.Println()

	// List items
	white.Println("Contents:")
	for i, p := range parser.Paths() {
		info, _ := os.Stat(p)
		if info.IsDir() {
			fmt.Printf("  [DIR]  %s\n", filepath.Base(p))
		} else {
			fmt.Printf("  [FILE] %s (%s)\n", filepath.Base(p), formatSize(info.Size()))
		}
		if i > 9 && len(parser.Paths()) > 12 {
			fmt.Printf("  ... and %d more items\n", len(parser.Paths())-10)
			break
		}
	}
	fmt.Println()

	// Create batch sender
	batchSender, err := transfer.NewBatchSender(transfer.BatchConfig{
		Paths:     parser.Paths(),
		ChunkSize: viper.GetInt("chunk_size"),
		Compress:  batchCompress,
		RoomCode:  code,
		RelayURL:  GetRelayServer(),
		LocalFirst: batchLocal,
		Timeout:   60 * time.Minute,
	})
	if err != nil {
		return err
	}

	// Create archive
	fmt.Print("Creating archive...")
	archivePath, err := batchSender.CreateArchive()
	if err != nil {
		return fmt.Errorf("failed to create archive: %w", err)
	}
	defer batchSender.CleanupArchive()

	archiveInfo, _ := os.Stat(archivePath)
	fmt.Printf(" done (%s)\n", formatSize(archiveInfo.Size()))
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

	// Create sender with archive
	sender, err := transfer.NewSender(transfer.SenderConfig{
		FilePath:   archivePath,
		ChunkSize:  viper.GetInt("chunk_size"),
		Compress:   false, // Already compressed as tar.gz
		RoomCode:   code,
		RelayURL:   GetRelayServer(),
		LocalFirst: batchLocal,
		Timeout:    60 * time.Minute,
	})
	if err != nil {
		return err
	}
	defer sender.Close()

	// Prepare file
	fmt.Print("Preparing transfer...")
	if err := sender.Prepare(); err != nil {
		return err
	}
	fmt.Println(" done")

	// Connect
	var conn network.ReadWriteCloserWithDeadline
	if batchLocal {
		conn, err = tryLocalDiscovery(ctx, code, sender)
		if err != nil && IsVerbose() {
			fmt.Printf("Local discovery: %v\n", err)
		}
	}

	if conn == nil {
		conn, err = connectToRelay(ctx, code, true)
		if err != nil {
			return fmt.Errorf("failed to connect: %w", err)
		}
	}

	// PAKE key exchange
	sessionKey, err := performPAKESender(conn, code)
	if err != nil {
		return fmt.Errorf("key exchange failed: %w", err)
	}

	if err := sender.SetSessionKey(sessionKey); err != nil {
		return err
	}
	sender.SetConnection(conn)

	// Hybrid key exchange
	hybridKey, err := performHybridExchange(conn, sender.PublicKey())
	if err != nil {
		return fmt.Errorf("hybrid key exchange failed: %w", err)
	}

	finalKey := crypto.Blake3DeriveKey("tallow-final-key-v1",
		append(sessionKey, hybridKey...), 32)
	if err := sender.SetSessionKey(finalKey); err != nil {
		return err
	}

	// Send
	fmt.Println()
	if err := sender.Send(ctx); err != nil {
		return fmt.Errorf("transfer failed: %w", err)
	}

	fmt.Println()
	green.Printf("Transfer complete! Sent %d files and %d folders.\n", files, dirs)
	return nil
}

func runReceiveAll(cmd *cobra.Command, args []string) error {
	code := protocol.NormalizeRoomCode(args[0])

	if !protocol.ValidateRoomCode(code) {
		return fmt.Errorf("invalid code format")
	}

	green := color.New(color.FgGreen, color.Bold)
	cyan := color.New(color.FgCyan)
	yellow := color.New(color.FgYellow)

	fmt.Println()
	cyan.Printf("Code: %s\n", code)
	cyan.Printf("Output: %s\n", batchOutput)
	fmt.Println()
	yellow.Println("Connecting to sender...")
	fmt.Println()

	// Setup context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigCh
		fmt.Println("\nCancelled.")
		cancel()
	}()

	// Create temp file for archive
	tempFile, err := os.CreateTemp("", "tallow-receive-*.tar.gz")
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	tempPath := tempFile.Name()
	tempFile.Close()
	defer os.Remove(tempPath)

	// Create receiver to download to temp file
	receiver, err := transfer.NewReceiver(transfer.ReceiverConfig{
		OutputDir: filepath.Dir(tempPath),
		RoomCode:  code,
		RelayURL:  GetRelayServer(),
		Timeout:   60 * time.Minute,
		Overwrite: true,
	})
	if err != nil {
		return err
	}
	defer receiver.Close()

	// Connect
	var conn network.ReadWriteCloserWithDeadline
	if batchLocal {
		conn, err = tryLocalConnection(ctx, code)
		if err != nil && IsVerbose() {
			fmt.Printf("Local discovery: %v\n", err)
		}
	}

	if conn == nil {
		conn, err = connectToRelay(ctx, code, false)
		if err != nil {
			return fmt.Errorf("failed to connect: %w", err)
		}
	}

	// PAKE
	sessionKey, err := performPAKEReceiver(conn, code)
	if err != nil {
		return fmt.Errorf("key exchange failed: %w", err)
	}

	if err := receiver.SetSessionKey(sessionKey); err != nil {
		return err
	}
	receiver.SetConnection(conn)

	// Hybrid exchange
	hybridKey, err := performHybridExchangeReceiver(conn, receiver)
	if err != nil {
		return fmt.Errorf("hybrid key exchange failed: %w", err)
	}

	finalKey := crypto.Blake3DeriveKey("tallow-final-key-v1",
		append(sessionKey, hybridKey...), 32)
	if err := receiver.SetSessionKey(finalKey); err != nil {
		return err
	}

	// Receive archive
	fmt.Println()
	if err := receiver.Receive(ctx); err != nil {
		return fmt.Errorf("transfer failed: %w", err)
	}

	// Extract archive
	fmt.Println()
	fmt.Print("Extracting files...")

	batchReceiver, err := transfer.NewBatchReceiver(transfer.BatchConfig{
		OutputDir: batchOutput,
		Overwrite: batchOverwrite,
	})
	if err != nil {
		return fmt.Errorf("failed to create extractor: %w", err)
	}

	if err := batchReceiver.ExtractArchive(receiver.OutputPath()); err != nil {
		return fmt.Errorf("failed to extract: %w", err)
	}

	// Clean up received archive
	os.Remove(receiver.OutputPath())

	items := batchReceiver.ExtractedItems()
	files := 0
	dirs := 0
	for _, item := range items {
		if item.IsDir {
			dirs++
		} else {
			files++
		}
	}

	fmt.Printf(" done\n")
	fmt.Println()

	// Display extracted items
	fmt.Println("Extracted:")
	displayCount := 0
	for _, item := range items {
		if item.IsDir {
			continue // Skip directories in listing
		}
		fmt.Printf("  %s (%s)\n", item.RelativePath, formatSize(item.Size))
		displayCount++
		if displayCount > 9 && len(items) > 12 {
			remaining := 0
			for _, i := range items {
				if !i.IsDir {
					remaining++
				}
			}
			fmt.Printf("  ... and %d more files\n", remaining-displayCount)
			break
		}
	}
	fmt.Println()

	green.Printf("Complete! Received %d files in %d folders.\n", files, dirs)
	green.Printf("Saved to: %s\n", batchOutput)

	return nil
}
