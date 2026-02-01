package protocol

import (
	"encoding/binary"
	"errors"
	"io"
)

// Frame types for binary framing
const (
	FrameTypeControl byte = 0x01
	FrameTypeData    byte = 0x02
	FrameTypePing    byte = 0x03
	FrameTypePong    byte = 0x04
)

// Frame size limits
const (
	MaxFrameSize     = 64 * 1024 * 1024 // 64MB
	MinFrameSize     = 5                 // 1 byte type + 4 bytes length
	FrameHeaderSize  = 5
)

var (
	// ErrFrameTooLarge is returned when a frame exceeds the maximum size
	ErrFrameTooLarge = errors.New("frame too large")
	// ErrInvalidFrame is returned when a frame is malformed
	ErrInvalidFrame = errors.New("invalid frame")
	// ErrUnknownFrameType is returned for unknown frame types
	ErrUnknownFrameType = errors.New("unknown frame type")
)

// Frame represents a binary protocol frame
type Frame struct {
	Type    byte
	Length  uint32
	Payload []byte
}

// NewFrame creates a new frame
func NewFrame(frameType byte, payload []byte) *Frame {
	return &Frame{
		Type:    frameType,
		Length:  uint32(len(payload)),
		Payload: payload,
	}
}

// NewControlFrame creates a control frame from a message
func NewControlFrame(msg *Message) (*Frame, error) {
	data, err := EncodeMessage(msg)
	if err != nil {
		return nil, err
	}
	return NewFrame(FrameTypeControl, data), nil
}

// NewDataFrame creates a data frame
func NewDataFrame(data []byte) *Frame {
	return NewFrame(FrameTypeData, data)
}

// NewPingFrame creates a ping frame
func NewPingFrame() *Frame {
	return NewFrame(FrameTypePing, nil)
}

// NewPongFrame creates a pong frame
func NewPongFrame() *Frame {
	return NewFrame(FrameTypePong, nil)
}

// Encode serializes the frame to bytes
func (f *Frame) Encode() []byte {
	buf := make([]byte, FrameHeaderSize+len(f.Payload))
	buf[0] = f.Type
	binary.BigEndian.PutUint32(buf[1:5], uint32(len(f.Payload)))
	if len(f.Payload) > 0 {
		copy(buf[5:], f.Payload)
	}
	return buf
}

// DecodeFrame reads a frame from a reader
func DecodeFrame(r io.Reader) (*Frame, error) {
	header := make([]byte, FrameHeaderSize)
	if _, err := io.ReadFull(r, header); err != nil {
		return nil, err
	}

	frameType := header[0]
	length := binary.BigEndian.Uint32(header[1:5])

	if length > MaxFrameSize {
		return nil, ErrFrameTooLarge
	}

	payload := make([]byte, length)
	if length > 0 {
		if _, err := io.ReadFull(r, payload); err != nil {
			return nil, err
		}
	}

	return &Frame{
		Type:    frameType,
		Length:  length,
		Payload: payload,
	}, nil
}

// IsControl returns true if this is a control frame
func (f *Frame) IsControl() bool {
	return f.Type == FrameTypeControl
}

// IsData returns true if this is a data frame
func (f *Frame) IsData() bool {
	return f.Type == FrameTypeData
}

// IsPing returns true if this is a ping frame
func (f *Frame) IsPing() bool {
	return f.Type == FrameTypePing
}

// IsPong returns true if this is a pong frame
func (f *Frame) IsPong() bool {
	return f.Type == FrameTypePong
}

// ToMessage parses the payload as a protocol message
func (f *Frame) ToMessage() (*Message, error) {
	if f.Type != FrameTypeControl {
		return nil, ErrInvalidFrame
	}
	return DecodeMessage(f.Payload)
}

// FrameReader reads frames from a connection
type FrameReader struct {
	reader io.Reader
	maxSize uint32
}

// NewFrameReader creates a new frame reader
func NewFrameReader(r io.Reader, maxSize uint32) *FrameReader {
	if maxSize == 0 {
		maxSize = MaxFrameSize
	}
	return &FrameReader{
		reader:  r,
		maxSize: maxSize,
	}
}

// Read reads the next frame
func (fr *FrameReader) Read() (*Frame, error) {
	return DecodeFrame(fr.reader)
}

// FrameWriter writes frames to a connection
type FrameWriter struct {
	writer io.Writer
}

// NewFrameWriter creates a new frame writer
func NewFrameWriter(w io.Writer) *FrameWriter {
	return &FrameWriter{writer: w}
}

// Write writes a frame
func (fw *FrameWriter) Write(f *Frame) error {
	_, err := fw.writer.Write(f.Encode())
	return err
}

// WriteControl writes a control message
func (fw *FrameWriter) WriteControl(msg *Message) error {
	frame, err := NewControlFrame(msg)
	if err != nil {
		return err
	}
	return fw.Write(frame)
}

// WriteData writes data
func (fw *FrameWriter) WriteData(data []byte) error {
	return fw.Write(NewDataFrame(data))
}

// WritePing writes a ping frame
func (fw *FrameWriter) WritePing() error {
	return fw.Write(NewPingFrame())
}

// WritePong writes a pong frame
func (fw *FrameWriter) WritePong() error {
	return fw.Write(NewPongFrame())
}
