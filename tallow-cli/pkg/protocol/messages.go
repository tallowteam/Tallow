// Package protocol defines the wire protocol for tallow transfers.
package protocol

import (
	"encoding/binary"
	"errors"
	"io"
)

// Message types
const (
	MsgTypeHello         uint8 = 0x01
	MsgTypeHelloAck      uint8 = 0x02
	MsgTypePAKEInit      uint8 = 0x10
	MsgTypePAKEResponse  uint8 = 0x11
	MsgTypePAKEConfirm   uint8 = 0x12
	MsgTypeKeyExchange   uint8 = 0x20
	MsgTypeKeyExchangeAck uint8 = 0x21
	MsgTypeFileInfo      uint8 = 0x30
	MsgTypeFileInfoAck   uint8 = 0x31
	MsgTypeChunk         uint8 = 0x40
	MsgTypeChunkAck      uint8 = 0x41
	MsgTypeComplete      uint8 = 0x50
	MsgTypeCompleteAck   uint8 = 0x51
	MsgTypeError         uint8 = 0xF0
	MsgTypeCancel        uint8 = 0xFF
)

// Protocol constants
const (
	ProtocolVersion = 1
	MaxMessageSize  = 1 << 20 // 1 MB max message size
	HeaderSize      = 5       // 1 byte type + 4 bytes length
)

var (
	// ErrMessageTooLarge indicates a message exceeds the maximum size
	ErrMessageTooLarge = errors.New("message too large")
	// ErrInvalidMessage indicates a malformed message
	ErrInvalidMessage = errors.New("invalid message format")
	// ErrUnexpectedMessage indicates an unexpected message type
	ErrUnexpectedMessage = errors.New("unexpected message type")
)

// Message represents a protocol message
type Message struct {
	Type    uint8
	Payload []byte
}

// Encode serializes a message to bytes
func (m *Message) Encode() []byte {
	length := uint32(len(m.Payload))
	buf := make([]byte, HeaderSize+length)
	buf[0] = m.Type
	binary.BigEndian.PutUint32(buf[1:5], length)
	copy(buf[5:], m.Payload)
	return buf
}

// ReadMessage reads a message from a reader
func ReadMessage(r io.Reader) (*Message, error) {
	header := make([]byte, HeaderSize)
	if _, err := io.ReadFull(r, header); err != nil {
		return nil, err
	}

	msgType := header[0]
	length := binary.BigEndian.Uint32(header[1:5])

	if length > MaxMessageSize {
		return nil, ErrMessageTooLarge
	}

	payload := make([]byte, length)
	if length > 0 {
		if _, err := io.ReadFull(r, payload); err != nil {
			return nil, err
		}
	}

	return &Message{
		Type:    msgType,
		Payload: payload,
	}, nil
}

// WriteMessage writes a message to a writer
func WriteMessage(w io.Writer, m *Message) error {
	_, err := w.Write(m.Encode())
	return err
}

// HelloMessage is the initial handshake message
type HelloMessage struct {
	Version   uint8
	RoomCode  string
	PublicKey []byte // Hybrid public key
}

// Encode serializes a HelloMessage
func (h *HelloMessage) Encode() []byte {
	codeLen := len(h.RoomCode)
	keyLen := len(h.PublicKey)
	buf := make([]byte, 1+2+codeLen+2+keyLen)

	buf[0] = h.Version
	binary.BigEndian.PutUint16(buf[1:3], uint16(codeLen))
	copy(buf[3:3+codeLen], h.RoomCode)
	binary.BigEndian.PutUint16(buf[3+codeLen:5+codeLen], uint16(keyLen))
	copy(buf[5+codeLen:], h.PublicKey)

	return buf
}

// DecodeHelloMessage deserializes a HelloMessage
func DecodeHelloMessage(data []byte) (*HelloMessage, error) {
	if len(data) < 5 {
		return nil, ErrInvalidMessage
	}

	version := data[0]
	codeLen := binary.BigEndian.Uint16(data[1:3])

	if len(data) < 5+int(codeLen) {
		return nil, ErrInvalidMessage
	}

	code := string(data[3 : 3+codeLen])
	keyLen := binary.BigEndian.Uint16(data[3+codeLen : 5+codeLen])

	if len(data) < 5+int(codeLen)+int(keyLen) {
		return nil, ErrInvalidMessage
	}

	pubKey := data[5+codeLen : 5+int(codeLen)+int(keyLen)]

	return &HelloMessage{
		Version:   version,
		RoomCode:  code,
		PublicKey: pubKey,
	}, nil
}

// FileInfo describes a file being transferred
type FileInfo struct {
	Name       string
	Size       int64
	Hash       []byte // BLAKE3 hash
	Compressed bool
	ChunkSize  uint32
	NumChunks  uint32
}

// Encode serializes a FileInfo
func (f *FileInfo) Encode() []byte {
	nameLen := len(f.Name)
	hashLen := len(f.Hash)

	buf := make([]byte, 2+nameLen+8+2+hashLen+1+4+4)
	offset := 0

	binary.BigEndian.PutUint16(buf[offset:], uint16(nameLen))
	offset += 2
	copy(buf[offset:], f.Name)
	offset += nameLen

	binary.BigEndian.PutUint64(buf[offset:], uint64(f.Size))
	offset += 8

	binary.BigEndian.PutUint16(buf[offset:], uint16(hashLen))
	offset += 2
	copy(buf[offset:], f.Hash)
	offset += hashLen

	if f.Compressed {
		buf[offset] = 1
	} else {
		buf[offset] = 0
	}
	offset++

	binary.BigEndian.PutUint32(buf[offset:], f.ChunkSize)
	offset += 4

	binary.BigEndian.PutUint32(buf[offset:], f.NumChunks)

	return buf
}

// DecodeFileInfo deserializes a FileInfo
func DecodeFileInfo(data []byte) (*FileInfo, error) {
	if len(data) < 2 {
		return nil, ErrInvalidMessage
	}

	offset := 0
	nameLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2

	if len(data) < offset+int(nameLen)+8+2 {
		return nil, ErrInvalidMessage
	}

	name := string(data[offset : offset+int(nameLen)])
	offset += int(nameLen)

	size := int64(binary.BigEndian.Uint64(data[offset:]))
	offset += 8

	hashLen := binary.BigEndian.Uint16(data[offset:])
	offset += 2

	if len(data) < offset+int(hashLen)+9 {
		return nil, ErrInvalidMessage
	}

	hash := data[offset : offset+int(hashLen)]
	offset += int(hashLen)

	compressed := data[offset] == 1
	offset++

	chunkSize := binary.BigEndian.Uint32(data[offset:])
	offset += 4

	numChunks := binary.BigEndian.Uint32(data[offset:])

	return &FileInfo{
		Name:       name,
		Size:       size,
		Hash:       hash,
		Compressed: compressed,
		ChunkSize:  chunkSize,
		NumChunks:  numChunks,
	}, nil
}

// ChunkHeader describes a chunk being sent
type ChunkHeader struct {
	Index uint32
	Size  uint32
}

// Encode serializes a ChunkHeader
func (c *ChunkHeader) Encode() []byte {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint32(buf[0:4], c.Index)
	binary.BigEndian.PutUint32(buf[4:8], c.Size)
	return buf
}

// DecodeChunkHeader deserializes a ChunkHeader
func DecodeChunkHeader(data []byte) (*ChunkHeader, error) {
	if len(data) < 8 {
		return nil, ErrInvalidMessage
	}

	return &ChunkHeader{
		Index: binary.BigEndian.Uint32(data[0:4]),
		Size:  binary.BigEndian.Uint32(data[4:8]),
	}, nil
}

// ErrorMessage describes a protocol error
type ErrorMessage struct {
	Code    uint16
	Message string
}

// Error codes
const (
	ErrCodeUnknown       uint16 = 0
	ErrCodeVersion       uint16 = 1
	ErrCodeAuth          uint16 = 2
	ErrCodeTransfer      uint16 = 3
	ErrCodeHash          uint16 = 4
	ErrCodeCancelled     uint16 = 5
	ErrCodeRoomNotFound  uint16 = 6
	ErrCodeRoomFull      uint16 = 7
)

// Encode serializes an ErrorMessage
func (e *ErrorMessage) Encode() []byte {
	msgLen := len(e.Message)
	buf := make([]byte, 2+2+msgLen)
	binary.BigEndian.PutUint16(buf[0:2], e.Code)
	binary.BigEndian.PutUint16(buf[2:4], uint16(msgLen))
	copy(buf[4:], e.Message)
	return buf
}

// DecodeErrorMessage deserializes an ErrorMessage
func DecodeErrorMessage(data []byte) (*ErrorMessage, error) {
	if len(data) < 4 {
		return nil, ErrInvalidMessage
	}

	code := binary.BigEndian.Uint16(data[0:2])
	msgLen := binary.BigEndian.Uint16(data[2:4])

	if len(data) < 4+int(msgLen) {
		return nil, ErrInvalidMessage
	}

	return &ErrorMessage{
		Code:    code,
		Message: string(data[4 : 4+msgLen]),
	}, nil
}
