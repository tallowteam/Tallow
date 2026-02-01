// Package protocol defines the relay protocol messages and types.
package protocol

import (
	"encoding/json"
	"time"
)

// Message types
const (
	// Control messages
	MsgTypeCreateRoom  = "CREATE_ROOM"
	MsgTypeRoomCreated = "ROOM_CREATED"
	MsgTypeJoinRoom    = "JOIN_ROOM"
	MsgTypeRoomJoined  = "ROOM_JOINED"
	MsgTypePeerJoined  = "PEER_JOINED"
	MsgTypePeerLeft    = "PEER_LEFT"
	MsgTypeClose       = "CLOSE"
	MsgTypeError       = "ERROR"
	MsgTypePing        = "PING"
	MsgTypePong        = "PONG"

	// Data messages (relayed opaque)
	MsgTypeData    = "DATA"
	MsgTypeSignal  = "SIGNAL"  // WebRTC signaling
	MsgTypePAKE    = "PAKE"    // PAKE key exchange
	MsgTypeEncrypt = "ENCRYPT" // Encrypted data
)

// Error codes
const (
	ErrorCodeUnknown         = "UNKNOWN_ERROR"
	ErrorCodeRoomNotFound    = "ROOM_NOT_FOUND"
	ErrorCodeRoomFull        = "ROOM_FULL"
	ErrorCodeRoomExpired     = "ROOM_EXPIRED"
	ErrorCodeRateLimited     = "RATE_LIMITED"
	ErrorCodeInvalidMessage  = "INVALID_MESSAGE"
	ErrorCodeHandshakeFailed = "HANDSHAKE_FAILED"
	ErrorCodeTransferFailed  = "TRANSFER_FAILED"
	ErrorCodeInternalError   = "INTERNAL_ERROR"
	ErrorCodeMaxRooms        = "MAX_ROOMS_REACHED"
)

// Message is the base protocol message
type Message struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	Timestamp int64           `json:"ts"`
}

// NewMessage creates a new message with timestamp
func NewMessage(msgType string, payload interface{}) (*Message, error) {
	var payloadBytes json.RawMessage
	if payload != nil {
		var err error
		payloadBytes, err = json.Marshal(payload)
		if err != nil {
			return nil, err
		}
	}

	return &Message{
		Type:      msgType,
		Payload:   payloadBytes,
		Timestamp: time.Now().UnixMilli(),
	}, nil
}

// ParsePayload unmarshals the payload into the given struct
func (m *Message) ParsePayload(v interface{}) error {
	if m.Payload == nil {
		return nil
	}
	return json.Unmarshal(m.Payload, v)
}

// CreateRoomRequest is sent to create a new room
type CreateRoomRequest struct {
	ExpiryMinutes int    `json:"expiry_minutes,omitempty"`
	Metadata      string `json:"metadata,omitempty"` // Optional encrypted metadata
}

// RoomCreatedResponse is sent when a room is created
type RoomCreatedResponse struct {
	RoomID    string `json:"room_id"`
	Code      string `json:"code"`
	ExpiresAt int64  `json:"expires_at"`
}

// JoinRoomRequest is sent to join an existing room
type JoinRoomRequest struct {
	Code string `json:"code"`
}

// RoomJoinedResponse is sent when successfully joined a room
type RoomJoinedResponse struct {
	RoomID    string `json:"room_id"`
	ExpiresAt int64  `json:"expires_at"`
}

// PeerJoinedNotification is sent to room creator when peer joins
type PeerJoinedNotification struct {
	PeerID string `json:"peer_id,omitempty"`
}

// PeerLeftNotification is sent when a peer leaves
type PeerLeftNotification struct {
	PeerID string `json:"peer_id,omitempty"`
	Reason string `json:"reason,omitempty"`
}

// ErrorResponse is sent when an error occurs
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// CloseRequest is sent to close a connection
type CloseRequest struct {
	Reason string `json:"reason,omitempty"`
}

// DataMessage wraps opaque data for relay
// The relay does NOT inspect the contents - it's encrypted by the clients
type DataMessage struct {
	Data []byte `json:"data"`
	Seq  uint64 `json:"seq,omitempty"` // Optional sequence number
}

// SignalMessage wraps WebRTC signaling data
type SignalMessage struct {
	Signal json.RawMessage `json:"signal"`
}

// PAKEMessage wraps PAKE key exchange data
type PAKEMessage struct {
	Step int    `json:"step"`
	Data []byte `json:"data"`
}

// Stats response for admin endpoints
type StatsResponse struct {
	ActiveRooms     int   `json:"active_rooms"`
	TotalRooms      int64 `json:"total_rooms"`
	ActiveConns     int   `json:"active_connections"`
	BytesTransferred int64 `json:"bytes_transferred"`
	Uptime          int64 `json:"uptime_seconds"`
}
