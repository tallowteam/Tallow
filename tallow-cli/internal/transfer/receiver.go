package transfer

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/tallow/tallow-cli/internal/crypto"
	"github.com/tallow/tallow-cli/pkg/protocol"
)

// ReceiverConfig configures the receiver
type ReceiverConfig struct {
	OutputDir   string
	RoomCode    string
	RelayURL    string
	Timeout     time.Duration
	Overwrite   bool
}

// Receiver handles file receiving
type Receiver struct {
	config      ReceiverConfig
	conn        io.ReadWriteCloser
	cipher      *crypto.AESGCMCipher
	writer      *ChunkWriter
	progress    *ProgressTracker
	fileInfo    *protocol.FileInfo
	hybridKey   *crypto.HybridKeyPair
	sessionKey  []byte
	outputPath  string
}

// NewReceiver creates a new Receiver
func NewReceiver(config ReceiverConfig) (*Receiver, error) {
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Minute
	}
	if config.OutputDir == "" {
		config.OutputDir = "."
	}

	// Ensure output directory exists
	if err := os.MkdirAll(config.OutputDir, 0755); err != nil {
		return nil, fmt.Errorf("cannot create output directory: %w", err)
	}

	// Generate hybrid key pair
	hybridKey, err := crypto.GenerateHybridKeyPair()
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	return &Receiver{
		config:    config,
		hybridKey: hybridKey,
	}, nil
}

// SetConnection sets the network connection
func (r *Receiver) SetConnection(conn io.ReadWriteCloser) {
	r.conn = conn
}

// SetSessionKey sets the encryption key after PAKE
func (r *Receiver) SetSessionKey(key []byte) error {
	cipher, err := crypto.NewAESGCMCipher(key)
	if err != nil {
		return fmt.Errorf("failed to create cipher: %w", err)
	}
	r.cipher = cipher
	r.sessionKey = key
	return nil
}

// PublicKey returns the hybrid public key
func (r *Receiver) PublicKey() *crypto.HybridPublicKey {
	return r.hybridKey.PublicKey()
}

// DecapsulateKey decapsulates a key from the sender
func (r *Receiver) DecapsulateKey(encap *crypto.HybridEncapsulation) ([]byte, error) {
	return r.hybridKey.HybridDecapsulate(encap)
}

// Receive performs the file transfer
func (r *Receiver) Receive(ctx context.Context) error {
	if r.conn == nil {
		return errors.New("no connection set")
	}
	if r.cipher == nil {
		return errors.New("no session key set")
	}

	// Read file info
	msg, err := protocol.ReadMessage(r.conn)
	if err != nil {
		return fmt.Errorf("failed to read file info: %w", err)
	}
	if msg.Type != protocol.MsgTypeFileInfo {
		return protocol.ErrUnexpectedMessage
	}

	// Decrypt file info
	decrypted, err := r.cipher.Decrypt(msg.Payload, nil)
	if err != nil {
		return fmt.Errorf("failed to decrypt file info: %w", err)
	}

	fileInfo, err := protocol.DecodeFileInfo(decrypted)
	if err != nil {
		return fmt.Errorf("invalid file info: %w", err)
	}
	r.fileInfo = fileInfo

	// Determine output path
	outputPath := filepath.Join(r.config.OutputDir, fileInfo.Name)

	// Check if file exists
	if !r.config.Overwrite {
		if _, err := os.Stat(outputPath); err == nil {
			// Add suffix to avoid overwrite
			ext := filepath.Ext(outputPath)
			base := outputPath[:len(outputPath)-len(ext)]
			for i := 1; ; i++ {
				outputPath = fmt.Sprintf("%s_%d%s", base, i, ext)
				if _, err := os.Stat(outputPath); os.IsNotExist(err) {
					break
				}
			}
		}
	}
	r.outputPath = outputPath

	// Send file info acknowledgment
	err = protocol.WriteMessage(r.conn, &protocol.Message{
		Type:    protocol.MsgTypeFileInfoAck,
		Payload: nil,
	})
	if err != nil {
		return fmt.Errorf("failed to send file info ack: %w", err)
	}

	// Read initial nonce (encrypted with session key)
	nonceBuf := make([]byte, crypto.GCMNonceSize+crypto.GCMTagSize+crypto.GCMNonceSize)
	if _, err := io.ReadFull(r.conn, nonceBuf); err != nil {
		return fmt.Errorf("failed to read nonce: %w", err)
	}

	nonce, err := r.cipher.Decrypt(nonceBuf, nil)
	if err != nil {
		return fmt.Errorf("failed to decrypt nonce: %w", err)
	}

	// Create stream decryptor
	decryptor, err := crypto.NewStreamDecryptor(r.sessionKey, nonce)
	if err != nil {
		return fmt.Errorf("failed to create decryptor: %w", err)
	}

	// Create chunk writer
	writer, err := NewChunkWriter(outputPath, fileInfo.NumChunks, int(fileInfo.ChunkSize))
	if err != nil {
		return fmt.Errorf("failed to create writer: %w", err)
	}
	r.writer = writer
	defer func() {
		if r.writer != nil {
			r.writer.Close()
		}
	}()

	// Create progress tracker
	r.progress = NewProgressTracker(fileInfo.Size, "Receiving")

	// Create decompressor if needed
	var decompressor *Compressor
	if fileInfo.Compressed {
		decompressor = NewCompressor(DefaultCompression)
	}

	// Receive chunks
	var chunkIndex uint64
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		msg, err := protocol.ReadMessage(r.conn)
		if err != nil {
			return fmt.Errorf("failed to read message: %w", err)
		}

		if msg.Type == protocol.MsgTypeComplete {
			// Verify final hash
			expectedHash := msg.Payload
			r.progress.Finish()

			// Truncate file to exact size
			if err := writer.Truncate(fileInfo.Size); err != nil {
				return fmt.Errorf("failed to truncate file: %w", err)
			}

			// Close writer before hashing
			writer.Close()
			r.writer = nil

			// Verify hash
			file, err := os.Open(outputPath)
			if err != nil {
				return fmt.Errorf("failed to open file for verification: %w", err)
			}
			actualHash, err := crypto.HashFile(file)
			file.Close()
			if err != nil {
				return fmt.Errorf("failed to hash file: %w", err)
			}

			if !bytes.Equal(actualHash, expectedHash) {
				os.Remove(outputPath)
				return errors.New("file hash mismatch - transfer corrupted")
			}

			// Send completion acknowledgment
			err = protocol.WriteMessage(r.conn, &protocol.Message{
				Type:    protocol.MsgTypeCompleteAck,
				Payload: nil,
			})
			if err != nil {
				return fmt.Errorf("failed to send completion ack: %w", err)
			}

			return nil
		}

		if msg.Type != protocol.MsgTypeChunk {
			if msg.Type == protocol.MsgTypeError {
				errMsg, _ := protocol.DecodeErrorMessage(msg.Payload)
				return fmt.Errorf("sender error: %s", errMsg.Message)
			}
			return protocol.ErrUnexpectedMessage
		}

		// Parse chunk header
		if len(msg.Payload) < 8 {
			return errors.New("invalid chunk message")
		}

		header, err := protocol.DecodeChunkHeader(msg.Payload[:8])
		if err != nil {
			return fmt.Errorf("invalid chunk header: %w", err)
		}

		encryptedChunk := msg.Payload[8:]

		// Decrypt chunk
		decryptedChunk, err := decryptor.DecryptChunk(encryptedChunk, chunkIndex)
		if err != nil {
			r.sendError(protocol.ErrCodeTransfer, "decryption failed")
			return fmt.Errorf("failed to decrypt chunk %d: %w", header.Index, err)
		}

		// Decompress if needed
		chunkData := decryptedChunk
		if decompressor != nil {
			decompressed, err := decompressor.Decompress(decryptedChunk)
			if err == nil {
				chunkData = decompressed
			}
			// If decompression fails, assume chunk wasn't compressed
		}

		// Write chunk
		if err := writer.WriteChunk(header.Index, chunkData); err != nil {
			r.sendError(protocol.ErrCodeTransfer, "write failed")
			return fmt.Errorf("failed to write chunk %d: %w", header.Index, err)
		}

		// Update progress
		r.progress.Add(int64(len(chunkData)))
		chunkIndex++

		// Send acknowledgment
		err = protocol.WriteMessage(r.conn, &protocol.Message{
			Type:    protocol.MsgTypeChunkAck,
			Payload: nil,
		})
		if err != nil {
			return fmt.Errorf("failed to send chunk ack: %w", err)
		}
	}
}

// sendError sends an error message to the peer
func (r *Receiver) sendError(code uint16, message string) {
	errMsg := &protocol.ErrorMessage{
		Code:    code,
		Message: message,
	}
	protocol.WriteMessage(r.conn, &protocol.Message{
		Type:    protocol.MsgTypeError,
		Payload: errMsg.Encode(),
	})
}

// OutputPath returns the path where the file will be saved
func (r *Receiver) OutputPath() string {
	return r.outputPath
}

// FileInfo returns the received file information
func (r *Receiver) FileInfo() *protocol.FileInfo {
	return r.fileInfo
}

// Close cleans up resources
func (r *Receiver) Close() error {
	var errs []error

	if r.writer != nil {
		if err := r.writer.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if r.conn != nil {
		if err := r.conn.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return errs[0]
	}
	return nil
}

// Progress returns the current progress tracker
func (r *Receiver) Progress() *ProgressTracker {
	return r.progress
}
