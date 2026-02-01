// Package onion provides cryptographic operations for onion routing.
package onion

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"golang.org/x/crypto/chacha20poly1305"
	"golang.org/x/crypto/hkdf"
	"io"
)

// KeyManager manages ML-KEM-768 keys for onion routing
type KeyManager struct {
	privateKey []byte
	publicKey  []byte
	mu         sync.RWMutex
	storePath  string
}

// ML-KEM-768 constants (NIST PQC standard)
const (
	MLKEMPublicKeySize  = 1184  // ML-KEM-768 public key size
	MLKEMPrivateKeySize = 2400  // ML-KEM-768 private key size
	MLKEMCiphertextSize = 1088  // ML-KEM-768 ciphertext size
	MLKEMSharedSecretSize = 32  // Shared secret size
)

// Session key derivation constants
const (
	SessionKeySize = 32
	NonceSize      = 12
	TagSize        = 16
)

// HKDF info strings for key derivation
var (
	infoSessionKey = []byte("tallow-onion-session-v1")
	infoLayerKey   = []byte("tallow-onion-layer-v1")
)

// NewKeyManager creates a new key manager
func NewKeyManager(storePath string) (*KeyManager, error) {
	km := &KeyManager{
		storePath: storePath,
	}

	// Try to load existing keys
	if storePath != "" {
		if err := km.loadKeys(); err == nil {
			return km, nil
		}
	}

	// Generate new keys
	if err := km.generateKeys(); err != nil {
		return nil, fmt.Errorf("failed to generate keys: %w", err)
	}

	// Save keys if store path provided
	if storePath != "" {
		if err := km.saveKeys(); err != nil {
			return nil, fmt.Errorf("failed to save keys: %w", err)
		}
	}

	return km, nil
}

// generateKeys generates a new ML-KEM-768 key pair
// NOTE: This is a placeholder implementation. In production, use a proper
// ML-KEM implementation like liboqs-go or circl
func (km *KeyManager) generateKeys() error {
	km.mu.Lock()
	defer km.mu.Unlock()

	// Placeholder: Generate random bytes as keys
	// In production, use proper ML-KEM-768 key generation
	km.privateKey = make([]byte, MLKEMPrivateKeySize)
	km.publicKey = make([]byte, MLKEMPublicKeySize)

	if _, err := rand.Read(km.privateKey); err != nil {
		return err
	}
	if _, err := rand.Read(km.publicKey); err != nil {
		return err
	}

	// Derive public key from private key (simplified)
	// In production, use proper ML-KEM key derivation
	h := sha256.New()
	h.Write(km.privateKey)
	copy(km.publicKey[:32], h.Sum(nil))

	return nil
}

// loadKeys loads keys from disk
func (km *KeyManager) loadKeys() error {
	km.mu.Lock()
	defer km.mu.Unlock()

	privPath := filepath.Join(km.storePath, "relay.key")
	pubPath := filepath.Join(km.storePath, "relay.pub")

	privKey, err := os.ReadFile(privPath)
	if err != nil {
		return err
	}

	pubKey, err := os.ReadFile(pubPath)
	if err != nil {
		return err
	}

	if len(privKey) != MLKEMPrivateKeySize || len(pubKey) != MLKEMPublicKeySize {
		return errors.New("invalid key sizes")
	}

	km.privateKey = privKey
	km.publicKey = pubKey
	return nil
}

// saveKeys saves keys to disk
func (km *KeyManager) saveKeys() error {
	km.mu.RLock()
	defer km.mu.RUnlock()

	if err := os.MkdirAll(km.storePath, 0700); err != nil {
		return err
	}

	privPath := filepath.Join(km.storePath, "relay.key")
	pubPath := filepath.Join(km.storePath, "relay.pub")

	if err := os.WriteFile(privPath, km.privateKey, 0600); err != nil {
		return err
	}

	return os.WriteFile(pubPath, km.publicKey, 0644)
}

// GetPublicKey returns a copy of the public key
func (km *KeyManager) GetPublicKey() []byte {
	km.mu.RLock()
	defer km.mu.RUnlock()

	key := make([]byte, len(km.publicKey))
	copy(key, km.publicKey)
	return key
}

// GetPublicKeyBytes returns the public key as bytes
func (km *KeyManager) GetPublicKeyBytes() []byte {
	return km.GetPublicKey()
}

// GetPublicKeyFingerprint returns a fingerprint of the public key
func (km *KeyManager) GetPublicKeyFingerprint() string {
	km.mu.RLock()
	defer km.mu.RUnlock()

	h := sha256.Sum256(km.publicKey)
	return hex.EncodeToString(h[:8])
}

// Encapsulate creates a shared secret using the recipient's public key
// Returns the ciphertext and shared secret
func (km *KeyManager) Encapsulate(recipientPublicKey []byte) (ciphertext []byte, sharedSecret []byte, err error) {
	if len(recipientPublicKey) != MLKEMPublicKeySize {
		return nil, nil, errors.New("invalid public key size")
	}

	// Placeholder: In production, use proper ML-KEM encapsulation
	// This generates a random shared secret and "encrypts" it
	sharedSecret = make([]byte, MLKEMSharedSecretSize)
	if _, err := rand.Read(sharedSecret); err != nil {
		return nil, nil, err
	}

	// Create ciphertext (placeholder: XOR with public key hash)
	ciphertext = make([]byte, MLKEMCiphertextSize)
	if _, err := rand.Read(ciphertext); err != nil {
		return nil, nil, err
	}

	// Embed shared secret in ciphertext (simplified)
	h := sha256.Sum256(recipientPublicKey)
	for i := 0; i < MLKEMSharedSecretSize; i++ {
		ciphertext[i] = sharedSecret[i] ^ h[i]
	}

	return ciphertext, sharedSecret, nil
}

// Decapsulate extracts the shared secret from a ciphertext using our private key
func (km *KeyManager) Decapsulate(ciphertext []byte) ([]byte, error) {
	km.mu.RLock()
	defer km.mu.RUnlock()

	if len(ciphertext) != MLKEMCiphertextSize {
		return nil, errors.New("invalid ciphertext size")
	}

	// Placeholder: In production, use proper ML-KEM decapsulation
	// Extract shared secret using our public key hash
	h := sha256.Sum256(km.publicKey)
	sharedSecret := make([]byte, MLKEMSharedSecretSize)
	for i := 0; i < MLKEMSharedSecretSize; i++ {
		sharedSecret[i] = ciphertext[i] ^ h[i]
	}

	return sharedSecret, nil
}

// Close securely wipes keys from memory
func (km *KeyManager) Close() {
	km.mu.Lock()
	defer km.mu.Unlock()

	// Secure wipe
	if km.privateKey != nil {
		for i := range km.privateKey {
			km.privateKey[i] = 0
		}
		km.privateKey = nil
	}
	if km.publicKey != nil {
		for i := range km.publicKey {
			km.publicKey[i] = 0
		}
		km.publicKey = nil
	}
}

// DeriveSessionKey derives a session key from shared secret and circuit ID
func DeriveSessionKey(sharedSecret []byte, circuitID []byte) []byte {
	reader := hkdf.New(sha256.New, sharedSecret, circuitID, infoSessionKey)
	key := make([]byte, SessionKeySize)
	if _, err := io.ReadFull(reader, key); err != nil {
		// This should never fail with proper inputs
		panic("HKDF failed: " + err.Error())
	}
	return key
}

// DeriveLayerKey derives a layer key for onion encryption
func DeriveLayerKey(sharedSecret []byte, layerIndex int) []byte {
	salt := make([]byte, 4)
	binary.BigEndian.PutUint32(salt, uint32(layerIndex))

	reader := hkdf.New(sha256.New, sharedSecret, salt, infoLayerKey)
	key := make([]byte, SessionKeySize)
	if _, err := io.ReadFull(reader, key); err != nil {
		panic("HKDF failed: " + err.Error())
	}
	return key
}

// OnionCrypto handles onion encryption/decryption
type OnionCrypto struct {
	// Use ChaCha20-Poly1305 for authenticated encryption
	aead cipher.AEAD
	key  []byte
}

// NewOnionCrypto creates a new onion crypto instance
func NewOnionCrypto(key []byte) (*OnionCrypto, error) {
	if len(key) != SessionKeySize {
		return nil, errors.New("invalid key size")
	}

	aead, err := chacha20poly1305.New(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AEAD: %w", err)
	}

	return &OnionCrypto{
		aead: aead,
		key:  key,
	}, nil
}

// Encrypt encrypts data with the session key
func (oc *OnionCrypto) Encrypt(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, NonceSize)
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}

	// Encrypt and append nonce
	ciphertext := oc.aead.Seal(nil, nonce, plaintext, nil)

	// Prepend nonce to ciphertext
	result := make([]byte, NonceSize+len(ciphertext))
	copy(result[:NonceSize], nonce)
	copy(result[NonceSize:], ciphertext)

	return result, nil
}

// Decrypt decrypts data with the session key
func (oc *OnionCrypto) Decrypt(data []byte) ([]byte, error) {
	if len(data) < NonceSize+TagSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce := data[:NonceSize]
	ciphertext := data[NonceSize:]

	plaintext, err := oc.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed: %w", err)
	}

	return plaintext, nil
}

// WrapOnionLayer wraps data in an onion layer
func WrapOnionLayer(data []byte, nextHop string, sessionKey []byte) ([]byte, error) {
	crypto, err := NewOnionCrypto(sessionKey)
	if err != nil {
		return nil, err
	}

	// Create layer header
	header := OnionLayer{
		NextHop:     nextHop,
		PayloadSize: len(data),
	}
	headerBytes, err := json.Marshal(header)
	if err != nil {
		return nil, err
	}

	// Combine header length + header + payload
	headerLen := make([]byte, 4)
	binary.BigEndian.PutUint32(headerLen, uint32(len(headerBytes)))

	combined := make([]byte, 4+len(headerBytes)+len(data))
	copy(combined[:4], headerLen)
	copy(combined[4:4+len(headerBytes)], headerBytes)
	copy(combined[4+len(headerBytes):], data)

	// Encrypt the combined data
	return crypto.Encrypt(combined)
}

// UnwrapOnionLayer unwraps one layer of onion encryption
func UnwrapOnionLayer(encryptedData []byte, sessionKey []byte) (nextHop string, innerPayload []byte, err error) {
	crypto, err := NewOnionCrypto(sessionKey)
	if err != nil {
		return "", nil, err
	}

	// Decrypt
	decrypted, err := crypto.Decrypt(encryptedData)
	if err != nil {
		return "", nil, err
	}

	if len(decrypted) < 4 {
		return "", nil, errors.New("decrypted data too short")
	}

	// Parse header length
	headerLen := binary.BigEndian.Uint32(decrypted[:4])
	if int(headerLen) > len(decrypted)-4 {
		return "", nil, errors.New("invalid header length")
	}

	// Parse header
	var header OnionLayer
	if err := json.Unmarshal(decrypted[4:4+headerLen], &header); err != nil {
		return "", nil, fmt.Errorf("failed to parse header: %w", err)
	}

	// Extract payload
	payloadStart := 4 + headerLen
	if int(payloadStart)+header.PayloadSize > len(decrypted) {
		return "", nil, errors.New("invalid payload size")
	}

	innerPayload = decrypted[payloadStart : int(payloadStart)+header.PayloadSize]
	return header.NextHop, innerPayload, nil
}

// AESOnionCrypto provides AES-GCM based encryption (alternative to ChaCha20)
type AESOnionCrypto struct {
	aead cipher.AEAD
	key  []byte
}

// NewAESOnionCrypto creates a new AES-GCM onion crypto instance
func NewAESOnionCrypto(key []byte) (*AESOnionCrypto, error) {
	if len(key) != SessionKeySize {
		return nil, errors.New("invalid key size")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	return &AESOnionCrypto{
		aead: aead,
		key:  key,
	}, nil
}

// Encrypt encrypts data with AES-GCM
func (ac *AESOnionCrypto) Encrypt(plaintext []byte) ([]byte, error) {
	nonce := make([]byte, ac.aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}

	ciphertext := ac.aead.Seal(nil, nonce, plaintext, nil)

	result := make([]byte, len(nonce)+len(ciphertext))
	copy(result[:len(nonce)], nonce)
	copy(result[len(nonce):], ciphertext)

	return result, nil
}

// Decrypt decrypts data with AES-GCM
func (ac *AESOnionCrypto) Decrypt(data []byte) ([]byte, error) {
	nonceSize := ac.aead.NonceSize()
	if len(data) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	return ac.aead.Open(nil, nonce, ciphertext, nil)
}

// SecureWipe securely wipes a byte slice
func SecureWipe(data []byte) {
	for i := range data {
		data[i] = 0
	}
	// Additional pass with random data to prevent memory analysis
	rand.Read(data)
	for i := range data {
		data[i] = 0
	}
}
