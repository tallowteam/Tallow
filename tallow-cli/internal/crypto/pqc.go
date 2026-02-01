package crypto

import (
	"crypto/rand"
	"errors"
	"fmt"

	"github.com/cloudflare/circl/kem/mlkem/mlkem768"
)

// ML-KEM-768 constants
const (
	MLKEMPublicKeySize  = mlkem768.PublicKeySize
	MLKEMPrivateKeySize = mlkem768.PrivateKeySize
	MLKEMCiphertextSize = mlkem768.CiphertextSize
	MLKEMSharedKeySize  = mlkem768.SharedKeySize
)

var (
	// ErrMLKEMKeyGeneration indicates key generation failure
	ErrMLKEMKeyGeneration = errors.New("ML-KEM key generation failed")
	// ErrMLKEMEncapsulation indicates encapsulation failure
	ErrMLKEMEncapsulation = errors.New("ML-KEM encapsulation failed")
	// ErrMLKEMDecapsulation indicates decapsulation failure
	ErrMLKEMDecapsulation = errors.New("ML-KEM decapsulation failed")
	// ErrInvalidPublicKey indicates an invalid public key
	ErrInvalidPublicKey = errors.New("invalid ML-KEM public key")
	// ErrInvalidCiphertext indicates an invalid ciphertext
	ErrInvalidCiphertext = errors.New("invalid ML-KEM ciphertext")
)

// MLKEMKeyPair holds an ML-KEM-768 key pair
type MLKEMKeyPair struct {
	PublicKey  *mlkem768.PublicKey
	PrivateKey *mlkem768.PrivateKey
}

// GenerateMLKEMKeyPair generates a new ML-KEM-768 key pair
func GenerateMLKEMKeyPair() (*MLKEMKeyPair, error) {
	pub, priv, err := mlkem768.GenerateKeyPair(rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrMLKEMKeyGeneration, err)
	}

	return &MLKEMKeyPair{
		PublicKey:  pub,
		PrivateKey: priv,
	}, nil
}

// PublicKeyBytes returns the public key as bytes
func (kp *MLKEMKeyPair) PublicKeyBytes() []byte {
	data, _ := kp.PublicKey.MarshalBinary()
	return data
}

// PrivateKeyBytes returns the private key as bytes
func (kp *MLKEMKeyPair) PrivateKeyBytes() []byte {
	data, _ := kp.PrivateKey.MarshalBinary()
	return data
}

// MLKEMEncapsulate encapsulates a shared secret to a public key
// Returns the ciphertext and shared secret
func MLKEMEncapsulate(publicKeyBytes []byte) (ciphertext, sharedSecret []byte, err error) {
	if len(publicKeyBytes) != MLKEMPublicKeySize {
		return nil, nil, ErrInvalidPublicKey
	}

	pub := new(mlkem768.PublicKey)
	if err := pub.Unpack(publicKeyBytes); err != nil {
		return nil, nil, fmt.Errorf("%w: %v", ErrInvalidPublicKey, err)
	}

	// Generate random seed for encapsulation
	seed := make([]byte, 32)
	if _, err := rand.Read(seed); err != nil {
		return nil, nil, fmt.Errorf("%w: failed to generate seed", ErrMLKEMEncapsulation)
	}

	ct := make([]byte, MLKEMCiphertextSize)
	ss := make([]byte, MLKEMSharedKeySize)
	pub.EncapsulateTo(ct, ss, seed)

	return ct, ss, nil
}

// MLKEMDecapsulate decapsulates a ciphertext using a private key
// Returns the shared secret
func MLKEMDecapsulate(privateKey *mlkem768.PrivateKey, ciphertext []byte) ([]byte, error) {
	if len(ciphertext) != MLKEMCiphertextSize {
		return nil, ErrInvalidCiphertext
	}

	ss := make([]byte, MLKEMSharedKeySize)
	privateKey.DecapsulateTo(ss, ciphertext)

	return ss, nil
}

// MLKEMDecapsulateFromBytes decapsulates using private key bytes
func MLKEMDecapsulateFromBytes(privateKeyBytes, ciphertext []byte) ([]byte, error) {
	if len(privateKeyBytes) != MLKEMPrivateKeySize {
		return nil, errors.New("invalid private key size")
	}

	priv := new(mlkem768.PrivateKey)
	if err := priv.Unpack(privateKeyBytes); err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}

	return MLKEMDecapsulate(priv, ciphertext)
}

// MLKEMPublicKeyFromBytes parses a public key from bytes
func MLKEMPublicKeyFromBytes(data []byte) (*mlkem768.PublicKey, error) {
	if len(data) != MLKEMPublicKeySize {
		return nil, ErrInvalidPublicKey
	}

	pub := new(mlkem768.PublicKey)
	if err := pub.Unpack(data); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidPublicKey, err)
	}
	return pub, nil
}

// MLKEMPrivateKeyFromBytes parses a private key from bytes
func MLKEMPrivateKeyFromBytes(data []byte) (*mlkem768.PrivateKey, error) {
	if len(data) != MLKEMPrivateKeySize {
		return nil, errors.New("invalid private key size")
	}

	priv := new(mlkem768.PrivateKey)
	if err := priv.Unpack(data); err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	return priv, nil
}
