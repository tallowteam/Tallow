package transfer

import (
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

// SenderConfig configures the sender
type SenderConfig struct {
	FilePath    string
	ChunkSize   int
	Compress    bool
	RoomCode    string
	RelayURL    string
	LocalFirst  bool
	Timeout     time.Duration
}

// Sender handles file sending
type Sender struct {
	config      SenderConfig
	conn        io.ReadWriteCloser
	cipher      *crypto.AESGCMCipher
	chunker     *Chunker
	progress    *ProgressTracker
	fileInfo    *protocol.FileInfo
	fileHash    []byte
	hybridKey   *crypto.HybridKeyPair
	sessionKey  []byte
}

// NewSender creates a new Sender
func NewSender(config SenderConfig) (*Sender, error) {
	if config.ChunkSize <= 0 {
		config.ChunkSize = DefaultChunkSize
	}
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Minute
	}

	// Verify file exists
	stat, err := os.Stat(config.FilePath)
	if err != nil {
		return nil, fmt.Errorf("cannot access file: %w", err)
	}
	if stat.IsDir() {
		return nil, errors.New("directories not yet supported, please zip first")
	}

	// Generate hybrid key pair
	hybridKey, err := crypto.GenerateHybridKeyPair()
	if err != nil {
		return nil, fmt.Errorf("failed to generate key pair: %w", err)
	}

	return &Sender{
		config:    config,
		hybridKey: hybridKey,
	}, nil
}

// Prepare prepares the file for transfer (hashing, chunking setup)
func (s *Sender) Prepare() error {
	// Open file for hashing
	file, err := os.Open(s.config.FilePath)
	if err != nil {
		return err
	}

	// Compute file hash
	hash, err := crypto.HashFile(file)
	if err != nil {
		file.Close()
		return fmt.Errorf("failed to hash file: %w", err)
	}
	file.Close()
	s.fileHash = hash

	// Get file info
	stat, err := os.Stat(s.config.FilePath)
	if err != nil {
		return err
	}

	// Determine compression
	compress := s.config.Compress && ShouldCompress(s.config.FilePath)

	// Create file info
	numChunks := uint32((stat.Size() + int64(s.config.ChunkSize) - 1) / int64(s.config.ChunkSize))
	if stat.Size() == 0 {
		numChunks = 1
	}

	s.fileInfo = &protocol.FileInfo{
		Name:       filepath.Base(s.config.FilePath),
		Size:       stat.Size(),
		Hash:       hash,
		Compressed: compress,
		ChunkSize:  uint32(s.config.ChunkSize),
		NumChunks:  numChunks,
	}

	// Create chunker
	chunker, err := NewChunker(s.config.FilePath, s.config.ChunkSize)
	if err != nil {
		return fmt.Errorf("failed to create chunker: %w", err)
	}
	s.chunker = chunker

	// Create progress tracker
	s.progress = NewProgressTracker(stat.Size(), "Sending")

	return nil
}

// SetConnection sets the network connection
func (s *Sender) SetConnection(conn io.ReadWriteCloser) {
	s.conn = conn
}

// SetSessionKey sets the encryption key after PAKE
func (s *Sender) SetSessionKey(key []byte) error {
	cipher, err := crypto.NewAESGCMCipher(key)
	if err != nil {
		return fmt.Errorf("failed to create cipher: %w", err)
	}
	s.cipher = cipher
	s.sessionKey = key
	return nil
}

// PublicKey returns the hybrid public key
func (s *Sender) PublicKey() *crypto.HybridPublicKey {
	return s.hybridKey.PublicKey()
}

// FileInfo returns the file information
func (s *Sender) FileInfo() *protocol.FileInfo {
	return s.fileInfo
}

// Send performs the file transfer
func (s *Sender) Send(ctx context.Context) error {
	if s.conn == nil {
		return errors.New("no connection set")
	}
	if s.cipher == nil {
		return errors.New("no session key set")
	}

	// Create stream encryptor
	encryptor, err := crypto.NewStreamEncryptor(s.sessionKey)
	if err != nil {
		return fmt.Errorf("failed to create encryptor: %w", err)
	}

	// Send file info
	fileInfoData := s.fileInfo.Encode()
	encrypted, err := s.cipher.Encrypt(fileInfoData, nil)
	if err != nil {
		return fmt.Errorf("failed to encrypt file info: %w", err)
	}

	err = protocol.WriteMessage(s.conn, &protocol.Message{
		Type:    protocol.MsgTypeFileInfo,
		Payload: encrypted,
	})
	if err != nil {
		return fmt.Errorf("failed to send file info: %w", err)
	}

	// Wait for acknowledgment
	msg, err := protocol.ReadMessage(s.conn)
	if err != nil {
		return fmt.Errorf("failed to read file info ack: %w", err)
	}
	if msg.Type != protocol.MsgTypeFileInfoAck {
		return protocol.ErrUnexpectedMessage
	}

	// Send initial nonce
	nonce := encryptor.InitialNonce()
	encrypted, err = s.cipher.Encrypt(nonce, nil)
	if err != nil {
		return fmt.Errorf("failed to encrypt nonce: %w", err)
	}
	if _, err := s.conn.Write(encrypted); err != nil {
		return fmt.Errorf("failed to send nonce: %w", err)
	}

	// Create compressor if needed
	var compressor *Compressor
	if s.fileInfo.Compressed {
		compressor = NewCompressor(BestSpeed)
	}

	// Send chunks
	var chunkIndex uint64
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		chunk, idx, err := s.chunker.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read chunk: %w", err)
		}

		// Compress if enabled
		chunkData := chunk
		if compressor != nil {
			compressed, err := compressor.Compress(chunk)
			if err != nil {
				return fmt.Errorf("compression failed: %w", err)
			}
			// Only use compression if smaller
			if len(compressed) < len(chunk) {
				chunkData = compressed
			}
		}

		// Encrypt chunk
		encryptedChunk := encryptor.EncryptChunk(chunkData, chunkIndex)

		// Build chunk message
		header := &protocol.ChunkHeader{
			Index: idx,
			Size:  uint32(len(encryptedChunk)),
		}

		payload := append(header.Encode(), encryptedChunk...)

		err = protocol.WriteMessage(s.conn, &protocol.Message{
			Type:    protocol.MsgTypeChunk,
			Payload: payload,
		})
		if err != nil {
			return fmt.Errorf("failed to send chunk %d: %w", idx, err)
		}

		// Update progress
		s.progress.Add(int64(len(chunk)))
		chunkIndex++

		// Read acknowledgment
		ack, err := protocol.ReadMessage(s.conn)
		if err != nil {
			return fmt.Errorf("failed to read chunk ack: %w", err)
		}
		if ack.Type != protocol.MsgTypeChunkAck {
			if ack.Type == protocol.MsgTypeError {
				errMsg, _ := protocol.DecodeErrorMessage(ack.Payload)
				return fmt.Errorf("receiver error: %s", errMsg.Message)
			}
			return protocol.ErrUnexpectedMessage
		}
	}

	// Send completion message
	s.progress.Finish()

	err = protocol.WriteMessage(s.conn, &protocol.Message{
		Type:    protocol.MsgTypeComplete,
		Payload: s.fileHash,
	})
	if err != nil {
		return fmt.Errorf("failed to send completion: %w", err)
	}

	// Wait for completion acknowledgment
	msg, err = protocol.ReadMessage(s.conn)
	if err != nil {
		return fmt.Errorf("failed to read completion ack: %w", err)
	}
	if msg.Type != protocol.MsgTypeCompleteAck {
		if msg.Type == protocol.MsgTypeError {
			errMsg, _ := protocol.DecodeErrorMessage(msg.Payload)
			return fmt.Errorf("receiver error: %s", errMsg.Message)
		}
		return protocol.ErrUnexpectedMessage
	}

	return nil
}

// Close cleans up resources
func (s *Sender) Close() error {
	var errs []error

	if s.chunker != nil {
		if err := s.chunker.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if s.conn != nil {
		if err := s.conn.Close(); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return errs[0]
	}
	return nil
}

// Progress returns the current progress tracker
func (s *Sender) Progress() *ProgressTracker {
	return s.progress
}
