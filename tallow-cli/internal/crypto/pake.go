package crypto

import (
	"crypto/rand"
	"crypto/subtle"
	"errors"
	"fmt"
	"io"

	"golang.org/x/crypto/curve25519"
)

// CPACE implements the CPace PAKE protocol
// Based on draft-irtf-cfrg-cpace

const (
	// CPaceIDSize is the size of the session ID
	CPaceIDSize = 32
	// CPaceElementSize is the size of curve points
	CPaceElementSize = 32
)

var (
	// ErrCPaceInvalidPeer indicates the peer sent invalid data
	ErrCPaceInvalidPeer = errors.New("CPace: invalid peer data")
	// ErrCPaceAuthFailed indicates authentication failed
	ErrCPaceAuthFailed = errors.New("CPace: authentication failed")
)

// CPaceSession represents a CPace session
type CPaceSession struct {
	password    []byte
	sessionID   []byte
	privateKey  [32]byte
	publicKey   [32]byte
	isInitiator bool
}

// NewCPaceInitiator creates a new CPace initiator (sender)
func NewCPaceInitiator(password []byte) (*CPaceSession, error) {
	session := &CPaceSession{
		password:    password,
		isInitiator: true,
	}

	// Generate session ID
	session.sessionID = make([]byte, CPaceIDSize)
	if _, err := io.ReadFull(rand.Reader, session.sessionID); err != nil {
		return nil, fmt.Errorf("failed to generate session ID: %w", err)
	}

	// Generate key pair
	if err := session.generateKeyPair(); err != nil {
		return nil, err
	}

	return session, nil
}

// NewCPaceResponder creates a new CPace responder (receiver)
func NewCPaceResponder(password, sessionID []byte) (*CPaceSession, error) {
	if len(sessionID) != CPaceIDSize {
		return nil, errors.New("invalid session ID length")
	}

	session := &CPaceSession{
		password:    password,
		sessionID:   sessionID,
		isInitiator: false,
	}

	// Generate key pair
	if err := session.generateKeyPair(); err != nil {
		return nil, err
	}

	return session, nil
}

// generateKeyPair generates the CPace key pair using password and session ID
func (s *CPaceSession) generateKeyPair() error {
	// Derive generator point from password and session ID
	// H(password || sessionID || "CPace-generator")
	generatorInput := append(s.password, s.sessionID...)
	generatorInput = append(generatorInput, []byte("CPace-generator")...)
	generator := Blake3HashSize(generatorInput, 64)

	// Generate random scalar
	var scalar [32]byte
	if _, err := io.ReadFull(rand.Reader, scalar[:]); err != nil {
		return fmt.Errorf("failed to generate scalar: %w", err)
	}

	// Clamp scalar
	scalar[0] &= 248
	scalar[31] &= 127
	scalar[31] |= 64

	s.privateKey = scalar

	// Compute public key: generator^scalar
	// Use the generator as a pseudo-basepoint
	// First hash to a point on the curve
	var basePoint [32]byte
	copy(basePoint[:], generator[:32])

	// Make it a valid curve point by clearing/setting bits
	basePoint[0] &= 248
	basePoint[31] &= 127
	basePoint[31] |= 64

	// Scalar multiplication
	public, err := curve25519.X25519(scalar[:], basePoint[:])
	if err != nil {
		return fmt.Errorf("scalar multiplication failed: %w", err)
	}
	copy(s.publicKey[:], public)

	return nil
}

// SessionID returns the session ID (initiator sends this to responder)
func (s *CPaceSession) SessionID() []byte {
	return s.sessionID
}

// PublicKey returns the public key to send to the peer
func (s *CPaceSession) PublicKey() []byte {
	return s.publicKey[:]
}

// ComputeSharedSecret computes the shared secret from the peer's public key
func (s *CPaceSession) ComputeSharedSecret(peerPublicKey []byte) ([]byte, error) {
	if len(peerPublicKey) != CPaceElementSize {
		return nil, ErrCPaceInvalidPeer
	}

	// Perform ECDH: peer_public^private
	shared, err := curve25519.X25519(s.privateKey[:], peerPublicKey)
	if err != nil {
		return nil, fmt.Errorf("ECDH failed: %w", err)
	}

	// Check for low-order points
	var zero [32]byte
	if subtle.ConstantTimeCompare(shared, zero[:]) == 1 {
		return nil, ErrCPaceInvalidPeer
	}

	// Derive session key from shared secret
	// Include both public keys and session ID for transcript binding
	transcript := make([]byte, 0, len(shared)+2*CPaceElementSize+CPaceIDSize)
	transcript = append(transcript, shared...)
	if s.isInitiator {
		transcript = append(transcript, s.publicKey[:]...)
		transcript = append(transcript, peerPublicKey...)
	} else {
		transcript = append(transcript, peerPublicKey...)
		transcript = append(transcript, s.publicKey[:]...)
	}
	transcript = append(transcript, s.sessionID...)

	sessionKey := Blake3DeriveKey("CPace-session-key-v1", transcript, 32)
	return sessionKey, nil
}

// CPaceExchange performs a complete CPace exchange
type CPaceExchange struct {
	session    *CPaceSession
	sharedKey  []byte
	confirmKey []byte
}

// InitiatorStart begins a CPace exchange as the initiator
func InitiatorStart(password []byte) (*CPaceExchange, []byte, error) {
	session, err := NewCPaceInitiator(password)
	if err != nil {
		return nil, nil, err
	}

	// Message 1: session_id || public_key
	msg1 := make([]byte, CPaceIDSize+CPaceElementSize)
	copy(msg1[:CPaceIDSize], session.SessionID())
	copy(msg1[CPaceIDSize:], session.PublicKey())

	return &CPaceExchange{session: session}, msg1, nil
}

// ResponderRespond processes initiator's message and responds
func ResponderRespond(password, msg1 []byte) (*CPaceExchange, []byte, error) {
	if len(msg1) != CPaceIDSize+CPaceElementSize {
		return nil, nil, ErrCPaceInvalidPeer
	}

	sessionID := msg1[:CPaceIDSize]
	peerPublicKey := msg1[CPaceIDSize:]

	session, err := NewCPaceResponder(password, sessionID)
	if err != nil {
		return nil, nil, err
	}

	// Compute shared secret
	sharedKey, err := session.ComputeSharedSecret(peerPublicKey)
	if err != nil {
		return nil, nil, err
	}

	// Derive confirm keys
	confirmKey := Blake3DeriveKey("CPace-confirm-key-v1", sharedKey, 32)

	exchange := &CPaceExchange{
		session:    session,
		sharedKey:  sharedKey,
		confirmKey: confirmKey,
	}

	// Message 2: public_key || confirmation
	confirmation := Blake3MAC(confirmKey, []byte("responder"))
	msg2 := make([]byte, CPaceElementSize+32)
	copy(msg2[:CPaceElementSize], session.PublicKey())
	copy(msg2[CPaceElementSize:], confirmation)

	return exchange, msg2, nil
}

// InitiatorFinish completes the exchange for the initiator
func (e *CPaceExchange) InitiatorFinish(msg2 []byte) ([]byte, error) {
	if len(msg2) != CPaceElementSize+32 {
		return nil, ErrCPaceInvalidPeer
	}

	peerPublicKey := msg2[:CPaceElementSize]
	peerConfirmation := msg2[CPaceElementSize:]

	// Compute shared secret
	sharedKey, err := e.session.ComputeSharedSecret(peerPublicKey)
	if err != nil {
		return nil, err
	}

	// Derive confirm key
	confirmKey := Blake3DeriveKey("CPace-confirm-key-v1", sharedKey, 32)

	// Verify responder's confirmation
	expectedConfirmation := Blake3MAC(confirmKey, []byte("responder"))
	if subtle.ConstantTimeCompare(peerConfirmation, expectedConfirmation) != 1 {
		return nil, ErrCPaceAuthFailed
	}

	e.sharedKey = sharedKey
	e.confirmKey = confirmKey

	// Return initiator's confirmation
	return Blake3MAC(confirmKey, []byte("initiator")), nil
}

// ResponderVerify verifies the initiator's confirmation
func (e *CPaceExchange) ResponderVerify(initiatorConfirmation []byte) error {
	expectedConfirmation := Blake3MAC(e.confirmKey, []byte("initiator"))
	if subtle.ConstantTimeCompare(initiatorConfirmation, expectedConfirmation) != 1 {
		return ErrCPaceAuthFailed
	}
	return nil
}

// SharedKey returns the derived shared key
func (e *CPaceExchange) SharedKey() []byte {
	return e.sharedKey
}
