package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
)

const (
	// AES256KeySize is the key size for AES-256
	AES256KeySize = 32
	// GCMNonceSize is the standard GCM nonce size
	GCMNonceSize = 12
	// GCMTagSize is the GCM authentication tag size
	GCMTagSize = 16
)

var (
	// ErrInvalidKeySize indicates the key is not 32 bytes
	ErrInvalidKeySize = errors.New("invalid key size: must be 32 bytes for AES-256")
	// ErrCiphertextTooShort indicates the ciphertext is too short
	ErrCiphertextTooShort = errors.New("ciphertext too short")
	// ErrDecryptionFailed indicates decryption or authentication failed
	ErrDecryptionFailed = errors.New("decryption failed: authentication error")
)

// AESGCMCipher provides AES-256-GCM encryption and decryption
type AESGCMCipher struct {
	aead cipher.AEAD
}

// NewAESGCMCipher creates a new AES-256-GCM cipher from a 32-byte key
func NewAESGCMCipher(key []byte) (*AESGCMCipher, error) {
	if len(key) != AES256KeySize {
		return nil, ErrInvalidKeySize
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM cipher: %w", err)
	}

	return &AESGCMCipher{aead: aead}, nil
}

// Encrypt encrypts plaintext with optional additional authenticated data
func (c *AESGCMCipher) Encrypt(plaintext, additionalData []byte) ([]byte, error) {
	nonce := make([]byte, GCMNonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Seal appends the ciphertext and tag to nonce
	ciphertext := c.aead.Seal(nonce, nonce, plaintext, additionalData)
	return ciphertext, nil
}

// Decrypt decrypts ciphertext with optional additional authenticated data
func (c *AESGCMCipher) Decrypt(ciphertext, additionalData []byte) ([]byte, error) {
	if len(ciphertext) < GCMNonceSize+GCMTagSize {
		return nil, ErrCiphertextTooShort
	}

	nonce := ciphertext[:GCMNonceSize]
	ciphertext = ciphertext[GCMNonceSize:]

	plaintext, err := c.aead.Open(nil, nonce, ciphertext, additionalData)
	if err != nil {
		return nil, ErrDecryptionFailed
	}

	return plaintext, nil
}

// EncryptWithNonce encrypts with a provided nonce (for streaming)
func (c *AESGCMCipher) EncryptWithNonce(nonce, plaintext, additionalData []byte) []byte {
	return c.aead.Seal(nil, nonce, plaintext, additionalData)
}

// DecryptWithNonce decrypts with a provided nonce (for streaming)
func (c *AESGCMCipher) DecryptWithNonce(nonce, ciphertext, additionalData []byte) ([]byte, error) {
	plaintext, err := c.aead.Open(nil, nonce, ciphertext, additionalData)
	if err != nil {
		return nil, ErrDecryptionFailed
	}
	return plaintext, nil
}

// NonceSize returns the required nonce size
func (c *AESGCMCipher) NonceSize() int {
	return c.aead.NonceSize()
}

// Overhead returns the maximum ciphertext overhead (tag size)
func (c *AESGCMCipher) Overhead() int {
	return c.aead.Overhead()
}

// IncrementNonce safely increments a nonce for counter mode
func IncrementNonce(nonce []byte) {
	for i := len(nonce) - 1; i >= 0; i-- {
		nonce[i]++
		if nonce[i] != 0 {
			break
		}
	}
}

// GenerateKey generates a random AES-256 key
func GenerateAESKey() ([]byte, error) {
	key := make([]byte, AES256KeySize)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("failed to generate key: %w", err)
	}
	return key, nil
}

// StreamEncryptor provides streaming encryption
type StreamEncryptor struct {
	cipher *AESGCMCipher
	nonce  []byte
}

// NewStreamEncryptor creates a streaming encryptor
func NewStreamEncryptor(key []byte) (*StreamEncryptor, error) {
	cipher, err := NewAESGCMCipher(key)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, GCMNonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	return &StreamEncryptor{
		cipher: cipher,
		nonce:  nonce,
	}, nil
}

// InitialNonce returns the initial nonce (must be sent to receiver)
func (s *StreamEncryptor) InitialNonce() []byte {
	return append([]byte(nil), s.nonce...)
}

// EncryptChunk encrypts a single chunk, incrementing the nonce
func (s *StreamEncryptor) EncryptChunk(plaintext []byte, chunkIndex uint64) []byte {
	// Create chunk-specific nonce
	nonce := append([]byte(nil), s.nonce...)
	// XOR chunk index into last 8 bytes
	for i := 0; i < 8 && i < len(nonce); i++ {
		nonce[len(nonce)-1-i] ^= byte(chunkIndex >> (8 * i))
	}

	return s.cipher.EncryptWithNonce(nonce, plaintext, nil)
}

// StreamDecryptor provides streaming decryption
type StreamDecryptor struct {
	cipher *AESGCMCipher
	nonce  []byte
}

// NewStreamDecryptor creates a streaming decryptor
func NewStreamDecryptor(key, initialNonce []byte) (*StreamDecryptor, error) {
	cipher, err := NewAESGCMCipher(key)
	if err != nil {
		return nil, err
	}

	return &StreamDecryptor{
		cipher: cipher,
		nonce:  append([]byte(nil), initialNonce...),
	}, nil
}

// DecryptChunk decrypts a single chunk
func (s *StreamDecryptor) DecryptChunk(ciphertext []byte, chunkIndex uint64) ([]byte, error) {
	// Create chunk-specific nonce
	nonce := append([]byte(nil), s.nonce...)
	// XOR chunk index into last 8 bytes
	for i := 0; i < 8 && i < len(nonce); i++ {
		nonce[len(nonce)-1-i] ^= byte(chunkIndex >> (8 * i))
	}

	return s.cipher.DecryptWithNonce(nonce, ciphertext, nil)
}
