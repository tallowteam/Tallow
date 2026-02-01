// Package onion provides types and utilities for onion routing.
package onion

import (
	"time"
)

// RelayMessage is the base message type for onion routing protocol
type RelayMessage struct {
	Type      MessageType `json:"type"`
	CircuitID string      `json:"circuit_id"`
	Data      []byte      `json:"data,omitempty"`
	NextHop   string      `json:"next_hop,omitempty"`
	Timestamp int64       `json:"ts"`
}

// MessageType defines the type of relay message
type MessageType string

const (
	// Circuit management messages
	MsgCreateCircuit  MessageType = "create_circuit"
	MsgCircuitCreated MessageType = "circuit_created"
	MsgExtendCircuit  MessageType = "extend_circuit"
	MsgCircuitExtended MessageType = "circuit_extended"
	MsgDestroyCircuit MessageType = "destroy_circuit"
	MsgCircuitDestroyed MessageType = "circuit_destroyed"

	// Data relay messages
	MsgRelayData     MessageType = "relay_data"
	MsgRelayAck      MessageType = "relay_ack"

	// Key exchange messages
	MsgKeyExchange   MessageType = "key_exchange"
	MsgKeyExchangeReply MessageType = "key_exchange_reply"

	// Control messages
	MsgPing          MessageType = "ping"
	MsgPong          MessageType = "pong"
	MsgError         MessageType = "error"
)

// Circuit represents an onion routing circuit
type Circuit struct {
	// ID is the unique circuit identifier
	ID string `json:"id"`

	// PrevHop is the previous relay in the circuit (nil for entry)
	PrevHop *CircuitHop `json:"prev_hop,omitempty"`

	// NextHop is the next relay in the circuit (nil for exit)
	NextHop *CircuitHop `json:"next_hop,omitempty"`

	// SessionKey is the shared secret for this circuit leg
	SessionKey []byte `json:"-"`

	// State is the current circuit state
	State CircuitState `json:"state"`

	// CreatedAt is when the circuit was created
	CreatedAt time.Time `json:"created_at"`

	// LastActivity is when the circuit was last used
	LastActivity time.Time `json:"last_activity"`

	// BytesForwarded is the total bytes forwarded on this circuit
	BytesForwarded int64 `json:"bytes_forwarded"`

	// MessagesForwarded is the total messages forwarded
	MessagesForwarded int64 `json:"messages_forwarded"`
}

// CircuitHop represents a hop in a circuit
type CircuitHop struct {
	// RelayID is the relay's unique identifier
	RelayID string `json:"relay_id"`

	// Endpoint is the WebSocket URL of the relay
	Endpoint string `json:"endpoint"`

	// PublicKey is the relay's ML-KEM-768 public key
	PublicKey []byte `json:"public_key,omitempty"`
}

// CircuitState represents the state of a circuit
type CircuitState int

const (
	CircuitStatePending CircuitState = iota
	CircuitStateEstablishing
	CircuitStateActive
	CircuitStateTearingDown
	CircuitStateClosed
)

func (s CircuitState) String() string {
	switch s {
	case CircuitStatePending:
		return "pending"
	case CircuitStateEstablishing:
		return "establishing"
	case CircuitStateActive:
		return "active"
	case CircuitStateTearingDown:
		return "tearing_down"
	case CircuitStateClosed:
		return "closed"
	default:
		return "unknown"
	}
}

// CreateCircuitRequest is sent to create a new circuit
type CreateCircuitRequest struct {
	// CircuitID is the requested circuit ID
	CircuitID string `json:"circuit_id"`

	// Ciphertext is the ML-KEM encapsulated key
	Ciphertext []byte `json:"ciphertext"`

	// ClientInfo is optional client metadata (encrypted)
	ClientInfo []byte `json:"client_info,omitempty"`
}

// CreateCircuitResponse is sent when circuit is created
type CreateCircuitResponse struct {
	// CircuitID is the confirmed circuit ID
	CircuitID string `json:"circuit_id"`

	// Success indicates if circuit was created
	Success bool `json:"success"`

	// Error is set if Success is false
	Error string `json:"error,omitempty"`
}

// ExtendCircuitRequest is sent to extend circuit to next hop
type ExtendCircuitRequest struct {
	// CircuitID is the circuit to extend
	CircuitID string `json:"circuit_id"`

	// NextHop is the next relay endpoint
	NextHop string `json:"next_hop"`

	// EncryptedExtend is the encrypted extend request for next hop
	EncryptedExtend []byte `json:"encrypted_extend"`
}

// RelayDataMessage wraps encrypted data for relay
type RelayDataMessage struct {
	// CircuitID identifies the circuit
	CircuitID string `json:"circuit_id"`

	// StreamID allows multiplexing within a circuit
	StreamID uint16 `json:"stream_id"`

	// Sequence number for ordering
	Sequence uint64 `json:"seq"`

	// EncryptedData is the onion-encrypted payload
	EncryptedData []byte `json:"data"`

	// Direction indicates forward or backward on circuit
	Direction Direction `json:"dir"`
}

// Direction indicates data flow direction
type Direction int

const (
	DirectionForward  Direction = 0 // Toward exit
	DirectionBackward Direction = 1 // Toward entry
)

// DestroyCircuitRequest tears down a circuit
type DestroyCircuitRequest struct {
	// CircuitID to destroy
	CircuitID string `json:"circuit_id"`

	// Reason for destruction
	Reason string `json:"reason,omitempty"`
}

// OnionLayer represents a single layer of onion encryption
type OnionLayer struct {
	// NextHop is the endpoint to forward to
	NextHop string `json:"next_hop"`

	// PayloadSize is the size of the inner payload
	PayloadSize int `json:"payload_size"`
}

// RelayStats holds statistics for a relay
type RelayStats struct {
	// Active circuits
	ActiveCircuits int `json:"active_circuits"`

	// Total circuits created
	TotalCircuits int64 `json:"total_circuits"`

	// Bytes forwarded
	BytesForwarded int64 `json:"bytes_forwarded"`

	// Messages forwarded
	MessagesForwarded int64 `json:"messages_forwarded"`

	// Current bandwidth (bytes/sec)
	CurrentBandwidth float64 `json:"current_bandwidth"`

	// Uptime in seconds
	Uptime int64 `json:"uptime"`
}

// ErrorCode defines relay error codes
type ErrorCode string

const (
	ErrCircuitNotFound   ErrorCode = "CIRCUIT_NOT_FOUND"
	ErrCircuitExists     ErrorCode = "CIRCUIT_EXISTS"
	ErrInvalidCircuitID  ErrorCode = "INVALID_CIRCUIT_ID"
	ErrKeyExchangeFailed ErrorCode = "KEY_EXCHANGE_FAILED"
	ErrDecryptionFailed  ErrorCode = "DECRYPTION_FAILED"
	ErrRelayFailed       ErrorCode = "RELAY_FAILED"
	ErrCircuitClosed     ErrorCode = "CIRCUIT_CLOSED"
	ErrRateLimited       ErrorCode = "RATE_LIMITED"
	ErrInternalError     ErrorCode = "INTERNAL_ERROR"
)

// RelayError is an error response
type RelayError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Details string    `json:"details,omitempty"`
}

func (e *RelayError) Error() string {
	return string(e.Code) + ": " + e.Message
}

// NewRelayError creates a new relay error
func NewRelayError(code ErrorCode, message string) *RelayError {
	return &RelayError{
		Code:    code,
		Message: message,
	}
}
