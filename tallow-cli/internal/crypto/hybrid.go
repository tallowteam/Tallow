package crypto

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/curve25519"
)

const (
	// X25519KeySize is the size of X25519 keys
	X25519KeySize = 32
	// HybridSharedKeySize is the combined shared key size
	HybridSharedKeySize = 32
)

var (
	// ErrX25519KeyGeneration indicates X25519 key generation failure
	ErrX25519KeyGeneration = errors.New("X25519 key generation failed")
	// ErrX25519ECDH indicates X25519 ECDH failure
	ErrX25519ECDH = errors.New("X25519 ECDH failed")
)

// X25519KeyPair holds an X25519 key pair
type X25519KeyPair struct {
	PublicKey  [X25519KeySize]byte
	PrivateKey [X25519KeySize]byte
}

// GenerateX25519KeyPair generates a new X25519 key pair
func GenerateX25519KeyPair() (*X25519KeyPair, error) {
	var privateKey [X25519KeySize]byte
	if _, err := io.ReadFull(rand.Reader, privateKey[:]); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrX25519KeyGeneration, err)
	}

	// Clamp private key per RFC 7748
	privateKey[0] &= 248
	privateKey[31] &= 127
	privateKey[31] |= 64

	var publicKey [X25519KeySize]byte
	curve25519.ScalarBaseMult(&publicKey, &privateKey)

	return &X25519KeyPair{
		PublicKey:  publicKey,
		PrivateKey: privateKey,
	}, nil
}

// X25519ECDH performs X25519 ECDH
func X25519ECDH(privateKey, peerPublicKey []byte) ([]byte, error) {
	if len(privateKey) != X25519KeySize || len(peerPublicKey) != X25519KeySize {
		return nil, ErrX25519ECDH
	}

	var priv, pub [X25519KeySize]byte
	copy(priv[:], privateKey)
	copy(pub[:], peerPublicKey)

	shared, err := curve25519.X25519(priv[:], pub[:])
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrX25519ECDH, err)
	}

	return shared, nil
}

// HybridKeyPair combines ML-KEM-768 and X25519 key pairs
type HybridKeyPair struct {
	MLKEM   *MLKEMKeyPair
	X25519  *X25519KeyPair
}

// GenerateHybridKeyPair generates both ML-KEM-768 and X25519 key pairs
func GenerateHybridKeyPair() (*HybridKeyPair, error) {
	mlkem, err := GenerateMLKEMKeyPair()
	if err != nil {
		return nil, fmt.Errorf("failed to generate ML-KEM key pair: %w", err)
	}

	x25519, err := GenerateX25519KeyPair()
	if err != nil {
		return nil, fmt.Errorf("failed to generate X25519 key pair: %w", err)
	}

	return &HybridKeyPair{
		MLKEM:  mlkem,
		X25519: x25519,
	}, nil
}

// HybridPublicKey returns the combined public key
type HybridPublicKey struct {
	MLKEM   []byte // ML-KEM-768 public key
	X25519  []byte // X25519 public key
}

// PublicKey returns the hybrid public key
func (h *HybridKeyPair) PublicKey() *HybridPublicKey {
	return &HybridPublicKey{
		MLKEM:  h.MLKEM.PublicKeyBytes(),
		X25519: h.X25519.PublicKey[:],
	}
}

// Bytes serializes the hybrid public key
func (pk *HybridPublicKey) Bytes() []byte {
	// Format: [2 bytes MLKEM len][MLKEM pubkey][X25519 pubkey]
	result := make([]byte, 2+len(pk.MLKEM)+len(pk.X25519))
	result[0] = byte(len(pk.MLKEM) >> 8)
	result[1] = byte(len(pk.MLKEM))
	copy(result[2:], pk.MLKEM)
	copy(result[2+len(pk.MLKEM):], pk.X25519)
	return result
}

// HybridPublicKeyFromBytes deserializes a hybrid public key
func HybridPublicKeyFromBytes(data []byte) (*HybridPublicKey, error) {
	if len(data) < 2 {
		return nil, errors.New("hybrid public key too short")
	}

	mlkemLen := int(data[0])<<8 | int(data[1])
	if len(data) < 2+mlkemLen+X25519KeySize {
		return nil, errors.New("hybrid public key invalid length")
	}

	return &HybridPublicKey{
		MLKEM:  data[2 : 2+mlkemLen],
		X25519: data[2+mlkemLen : 2+mlkemLen+X25519KeySize],
	}, nil
}

// HybridEncapsulation holds the result of hybrid encapsulation
type HybridEncapsulation struct {
	MLKEMCiphertext []byte
	X25519PublicKey []byte
}

// Bytes serializes the encapsulation
func (he *HybridEncapsulation) Bytes() []byte {
	// Format: [2 bytes MLKEM ct len][MLKEM ct][X25519 pubkey]
	result := make([]byte, 2+len(he.MLKEMCiphertext)+len(he.X25519PublicKey))
	result[0] = byte(len(he.MLKEMCiphertext) >> 8)
	result[1] = byte(len(he.MLKEMCiphertext))
	copy(result[2:], he.MLKEMCiphertext)
	copy(result[2+len(he.MLKEMCiphertext):], he.X25519PublicKey)
	return result
}

// HybridEncapsulationFromBytes deserializes a hybrid encapsulation
func HybridEncapsulationFromBytes(data []byte) (*HybridEncapsulation, error) {
	if len(data) < 2 {
		return nil, errors.New("hybrid encapsulation too short")
	}

	mlkemLen := int(data[0])<<8 | int(data[1])
	if len(data) < 2+mlkemLen+X25519KeySize {
		return nil, errors.New("hybrid encapsulation invalid length")
	}

	return &HybridEncapsulation{
		MLKEMCiphertext: data[2 : 2+mlkemLen],
		X25519PublicKey: data[2+mlkemLen : 2+mlkemLen+X25519KeySize],
	}, nil
}

// HybridEncapsulate performs hybrid encapsulation to a peer's public key
// Returns the encapsulation data and the combined shared secret
func HybridEncapsulate(peerPublicKey *HybridPublicKey) (*HybridEncapsulation, []byte, error) {
	// ML-KEM encapsulation
	mlkemCt, mlkemSS, err := MLKEMEncapsulate(peerPublicKey.MLKEM)
	if err != nil {
		return nil, nil, fmt.Errorf("ML-KEM encapsulation failed: %w", err)
	}

	// X25519 ephemeral key exchange
	ephemeral, err := GenerateX25519KeyPair()
	if err != nil {
		return nil, nil, fmt.Errorf("X25519 key generation failed: %w", err)
	}

	x25519SS, err := X25519ECDH(ephemeral.PrivateKey[:], peerPublicKey.X25519)
	if err != nil {
		return nil, nil, fmt.Errorf("X25519 ECDH failed: %w", err)
	}

	// Combine shared secrets using BLAKE3
	combined := Blake3DeriveKey(
		"tallow-hybrid-kem-v1",
		append(mlkemSS, x25519SS...),
		HybridSharedKeySize,
	)

	encap := &HybridEncapsulation{
		MLKEMCiphertext: mlkemCt,
		X25519PublicKey: ephemeral.PublicKey[:],
	}

	return encap, combined, nil
}

// HybridDecapsulate performs hybrid decapsulation
func (h *HybridKeyPair) HybridDecapsulate(encap *HybridEncapsulation) ([]byte, error) {
	// ML-KEM decapsulation
	mlkemSS, err := MLKEMDecapsulate(h.MLKEM.PrivateKey, encap.MLKEMCiphertext)
	if err != nil {
		return nil, fmt.Errorf("ML-KEM decapsulation failed: %w", err)
	}

	// X25519 ECDH
	x25519SS, err := X25519ECDH(h.X25519.PrivateKey[:], encap.X25519PublicKey)
	if err != nil {
		return nil, fmt.Errorf("X25519 ECDH failed: %w", err)
	}

	// Combine shared secrets using BLAKE3
	combined := Blake3DeriveKey(
		"tallow-hybrid-kem-v1",
		append(mlkemSS, x25519SS...),
		HybridSharedKeySize,
	)

	return combined, nil
}
