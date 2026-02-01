package protocol

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

// HandshakeState tracks the state of a connection handshake
type HandshakeState int

const (
	HandshakeStateInit HandshakeState = iota
	HandshakeStateCreating
	HandshakeStateWaitingForPeer
	HandshakeStateJoining
	HandshakeStatePeerConnected
	HandshakeStateReady
	HandshakeStateFailed
)

// String returns the string representation of the handshake state
func (s HandshakeState) String() string {
	switch s {
	case HandshakeStateInit:
		return "INIT"
	case HandshakeStateCreating:
		return "CREATING"
	case HandshakeStateWaitingForPeer:
		return "WAITING_FOR_PEER"
	case HandshakeStateJoining:
		return "JOINING"
	case HandshakeStatePeerConnected:
		return "PEER_CONNECTED"
	case HandshakeStateReady:
		return "READY"
	case HandshakeStateFailed:
		return "FAILED"
	default:
		return "UNKNOWN"
	}
}

// Handshake manages the connection handshake process
type Handshake struct {
	ID        string
	State     HandshakeState
	RoomID    string
	RoomCode  string
	IsCreator bool
	StartTime time.Time
	Error     error
}

// NewHandshake creates a new handshake tracker
func NewHandshake() (*Handshake, error) {
	id, err := generateHandshakeID()
	if err != nil {
		return nil, err
	}

	return &Handshake{
		ID:        id,
		State:     HandshakeStateInit,
		StartTime: time.Now(),
	}, nil
}

// Transition moves the handshake to a new state
func (h *Handshake) Transition(newState HandshakeState) error {
	// Validate state transitions
	valid := false
	switch h.State {
	case HandshakeStateInit:
		valid = newState == HandshakeStateCreating || newState == HandshakeStateJoining || newState == HandshakeStateFailed
	case HandshakeStateCreating:
		valid = newState == HandshakeStateWaitingForPeer || newState == HandshakeStateFailed
	case HandshakeStateWaitingForPeer:
		valid = newState == HandshakeStatePeerConnected || newState == HandshakeStateFailed
	case HandshakeStateJoining:
		valid = newState == HandshakeStatePeerConnected || newState == HandshakeStateFailed
	case HandshakeStatePeerConnected:
		valid = newState == HandshakeStateReady || newState == HandshakeStateFailed
	case HandshakeStateReady:
		valid = newState == HandshakeStateFailed
	case HandshakeStateFailed:
		valid = false
	}

	if !valid {
		return fmt.Errorf("invalid state transition: %s -> %s", h.State, newState)
	}

	h.State = newState
	return nil
}

// SetRoom sets the room information
func (h *Handshake) SetRoom(roomID, roomCode string, isCreator bool) {
	h.RoomID = roomID
	h.RoomCode = roomCode
	h.IsCreator = isCreator
}

// Fail marks the handshake as failed
func (h *Handshake) Fail(err error) {
	h.State = HandshakeStateFailed
	h.Error = err
}

// IsComplete returns true if the handshake is complete
func (h *Handshake) IsComplete() bool {
	return h.State == HandshakeStateReady
}

// IsFailed returns true if the handshake failed
func (h *Handshake) IsFailed() bool {
	return h.State == HandshakeStateFailed
}

// Duration returns how long the handshake has taken
func (h *Handshake) Duration() time.Duration {
	return time.Since(h.StartTime)
}

// generateHandshakeID generates a random handshake ID
func generateHandshakeID() (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ValidateCreateRequest validates a create room request
func ValidateCreateRequest(req *CreateRoomRequest) error {
	if req.ExpiryMinutes < 0 {
		return fmt.Errorf("expiry cannot be negative")
	}
	if req.ExpiryMinutes > 4320 { // 72 hours max
		return fmt.Errorf("expiry cannot exceed 72 hours")
	}
	return nil
}

// ValidateJoinRequest validates a join room request
func ValidateJoinRequest(req *JoinRoomRequest) error {
	if req.Code == "" {
		return fmt.Errorf("room code is required")
	}
	if len(req.Code) < 5 {
		return fmt.Errorf("room code too short")
	}
	if len(req.Code) > 100 {
		return fmt.Errorf("room code too long")
	}
	return nil
}
