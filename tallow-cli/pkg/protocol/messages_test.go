package protocol

import (
	"bytes"
	"crypto/rand"
	"testing"
)

func TestMessageEncode(t *testing.T) {
	tests := []struct {
		name    string
		msgType uint8
		payload []byte
	}{
		{"empty payload", MsgTypeHello, []byte{}},
		{"small payload", MsgTypeChunk, []byte("hello")},
		{"medium payload", MsgTypeFileInfo, bytes.Repeat([]byte("x"), 1000)},
		{"large payload", MsgTypeComplete, bytes.Repeat([]byte("y"), 100000)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			msg := &Message{
				Type:    tt.msgType,
				Payload: tt.payload,
			}

			encoded := msg.Encode()

			// Check header
			if encoded[0] != tt.msgType {
				t.Errorf("type = %v, want %v", encoded[0], tt.msgType)
			}

			// Check length
			expectedLen := HeaderSize + len(tt.payload)
			if len(encoded) != expectedLen {
				t.Errorf("encoded len = %v, want %v", len(encoded), expectedLen)
			}
		})
	}
}

func TestReadMessage(t *testing.T) {
	tests := []struct {
		name    string
		msgType uint8
		payload []byte
	}{
		{"empty payload", MsgTypeHelloAck, []byte{}},
		{"small payload", MsgTypeChunkAck, []byte("test")},
		{"binary payload", MsgTypeKeyExchange, []byte{0x00, 0xff, 0x80}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			original := &Message{
				Type:    tt.msgType,
				Payload: tt.payload,
			}

			encoded := original.Encode()
			reader := bytes.NewReader(encoded)

			decoded, err := ReadMessage(reader)
			if err != nil {
				t.Fatalf("ReadMessage failed: %v", err)
			}

			if decoded.Type != original.Type {
				t.Errorf("type = %v, want %v", decoded.Type, original.Type)
			}

			if !bytes.Equal(decoded.Payload, original.Payload) {
				t.Error("payload mismatch")
			}
		})
	}
}

func TestReadMessageTooLarge(t *testing.T) {
	// Create a message with length > MaxMessageSize
	header := make([]byte, HeaderSize)
	header[0] = MsgTypeChunk
	// Set length to MaxMessageSize + 1
	length := uint32(MaxMessageSize + 1)
	header[1] = byte(length >> 24)
	header[2] = byte(length >> 16)
	header[3] = byte(length >> 8)
	header[4] = byte(length)

	reader := bytes.NewReader(header)

	_, err := ReadMessage(reader)
	if err != ErrMessageTooLarge {
		t.Errorf("Expected ErrMessageTooLarge, got %v", err)
	}
}

func TestReadMessageShortRead(t *testing.T) {
	// Truncated header
	reader := bytes.NewReader([]byte{0x01, 0x00})

	_, err := ReadMessage(reader)
	if err == nil {
		t.Error("Expected error for truncated header")
	}
}

func TestReadMessageTruncatedPayload(t *testing.T) {
	// Header says 100 bytes, but only provide 50
	header := make([]byte, HeaderSize+50)
	header[0] = MsgTypeChunk
	header[4] = 100 // length = 100

	reader := bytes.NewReader(header)

	_, err := ReadMessage(reader)
	if err == nil {
		t.Error("Expected error for truncated payload")
	}
}

func TestWriteMessage(t *testing.T) {
	msg := &Message{
		Type:    MsgTypeFileInfo,
		Payload: []byte("test payload"),
	}

	var buf bytes.Buffer
	err := WriteMessage(&buf, msg)
	if err != nil {
		t.Fatalf("WriteMessage failed: %v", err)
	}

	// Verify we can read it back
	decoded, err := ReadMessage(&buf)
	if err != nil {
		t.Fatalf("ReadMessage failed: %v", err)
	}

	if decoded.Type != msg.Type {
		t.Error("type mismatch")
	}

	if !bytes.Equal(decoded.Payload, msg.Payload) {
		t.Error("payload mismatch")
	}
}

func TestHelloMessage(t *testing.T) {
	original := &HelloMessage{
		Version:   ProtocolVersion,
		RoomCode:  "alpha-beta-gamma",
		PublicKey: make([]byte, 100),
	}
	rand.Read(original.PublicKey)

	encoded := original.Encode()

	decoded, err := DecodeHelloMessage(encoded)
	if err != nil {
		t.Fatalf("DecodeHelloMessage failed: %v", err)
	}

	if decoded.Version != original.Version {
		t.Errorf("Version = %v, want %v", decoded.Version, original.Version)
	}

	if decoded.RoomCode != original.RoomCode {
		t.Errorf("RoomCode = %v, want %v", decoded.RoomCode, original.RoomCode)
	}

	if !bytes.Equal(decoded.PublicKey, original.PublicKey) {
		t.Error("PublicKey mismatch")
	}
}

func TestDecodeHelloMessageInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"too short", []byte{0x01, 0x00, 0x00, 0x00}},
		{"invalid code length", []byte{0x01, 0xff, 0xff}}, // code len > data
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeHelloMessage(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestFileInfo(t *testing.T) {
	original := &FileInfo{
		Name:       "test-file.pdf",
		Size:       1234567890,
		Hash:       make([]byte, 32),
		Compressed: true,
		ChunkSize:  65536,
		NumChunks:  100,
	}
	rand.Read(original.Hash)

	encoded := original.Encode()

	decoded, err := DecodeFileInfo(encoded)
	if err != nil {
		t.Fatalf("DecodeFileInfo failed: %v", err)
	}

	if decoded.Name != original.Name {
		t.Errorf("Name = %v, want %v", decoded.Name, original.Name)
	}

	if decoded.Size != original.Size {
		t.Errorf("Size = %v, want %v", decoded.Size, original.Size)
	}

	if !bytes.Equal(decoded.Hash, original.Hash) {
		t.Error("Hash mismatch")
	}

	if decoded.Compressed != original.Compressed {
		t.Errorf("Compressed = %v, want %v", decoded.Compressed, original.Compressed)
	}

	if decoded.ChunkSize != original.ChunkSize {
		t.Errorf("ChunkSize = %v, want %v", decoded.ChunkSize, original.ChunkSize)
	}

	if decoded.NumChunks != original.NumChunks {
		t.Errorf("NumChunks = %v, want %v", decoded.NumChunks, original.NumChunks)
	}
}

func TestFileInfoUncompressed(t *testing.T) {
	original := &FileInfo{
		Name:       "data.bin",
		Size:       1000,
		Hash:       make([]byte, 32),
		Compressed: false,
		ChunkSize:  1024,
		NumChunks:  1,
	}

	encoded := original.Encode()
	decoded, err := DecodeFileInfo(encoded)
	if err != nil {
		t.Fatalf("DecodeFileInfo failed: %v", err)
	}

	if decoded.Compressed != false {
		t.Error("Compressed should be false")
	}
}

func TestDecodeFileInfoInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"too short for name length", []byte{0x00}},
		{"truncated name", []byte{0x00, 0x10, 'a', 'b'}}, // says 16 bytes, only 2
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeFileInfo(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestChunkHeader(t *testing.T) {
	original := &ChunkHeader{
		Index: 12345,
		Size:  67890,
	}

	encoded := original.Encode()

	if len(encoded) != 8 {
		t.Errorf("encoded len = %v, want 8", len(encoded))
	}

	decoded, err := DecodeChunkHeader(encoded)
	if err != nil {
		t.Fatalf("DecodeChunkHeader failed: %v", err)
	}

	if decoded.Index != original.Index {
		t.Errorf("Index = %v, want %v", decoded.Index, original.Index)
	}

	if decoded.Size != original.Size {
		t.Errorf("Size = %v, want %v", decoded.Size, original.Size)
	}
}

func TestDecodeChunkHeaderInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, 7)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeChunkHeader(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestErrorMessage(t *testing.T) {
	original := &ErrorMessage{
		Code:    ErrCodeAuth,
		Message: "Authentication failed: wrong password",
	}

	encoded := original.Encode()

	decoded, err := DecodeErrorMessage(encoded)
	if err != nil {
		t.Fatalf("DecodeErrorMessage failed: %v", err)
	}

	if decoded.Code != original.Code {
		t.Errorf("Code = %v, want %v", decoded.Code, original.Code)
	}

	if decoded.Message != original.Message {
		t.Errorf("Message = %v, want %v", decoded.Message, original.Message)
	}
}

func TestErrorMessageEmptyMessage(t *testing.T) {
	original := &ErrorMessage{
		Code:    ErrCodeUnknown,
		Message: "",
	}

	encoded := original.Encode()
	decoded, err := DecodeErrorMessage(encoded)
	if err != nil {
		t.Fatalf("DecodeErrorMessage failed: %v", err)
	}

	if decoded.Message != "" {
		t.Errorf("Message = %v, want empty", decoded.Message)
	}
}

func TestDecodeErrorMessageInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"too short", []byte{0x00, 0x01, 0x00}}, // need at least 4 bytes
		{"truncated message", []byte{0x00, 0x01, 0x00, 0x10}}, // says 16 bytes, none provided
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DecodeErrorMessage(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestErrorCodes(t *testing.T) {
	// Verify error codes have expected values
	codes := map[string]uint16{
		"ErrCodeUnknown":      0,
		"ErrCodeVersion":      1,
		"ErrCodeAuth":         2,
		"ErrCodeTransfer":     3,
		"ErrCodeHash":         4,
		"ErrCodeCancelled":    5,
		"ErrCodeRoomNotFound": 6,
		"ErrCodeRoomFull":     7,
	}

	if ErrCodeUnknown != codes["ErrCodeUnknown"] {
		t.Errorf("ErrCodeUnknown = %v, want %v", ErrCodeUnknown, codes["ErrCodeUnknown"])
	}
	if ErrCodeVersion != codes["ErrCodeVersion"] {
		t.Errorf("ErrCodeVersion = %v, want %v", ErrCodeVersion, codes["ErrCodeVersion"])
	}
	if ErrCodeAuth != codes["ErrCodeAuth"] {
		t.Errorf("ErrCodeAuth = %v, want %v", ErrCodeAuth, codes["ErrCodeAuth"])
	}
	if ErrCodeTransfer != codes["ErrCodeTransfer"] {
		t.Errorf("ErrCodeTransfer = %v, want %v", ErrCodeTransfer, codes["ErrCodeTransfer"])
	}
	if ErrCodeHash != codes["ErrCodeHash"] {
		t.Errorf("ErrCodeHash = %v, want %v", ErrCodeHash, codes["ErrCodeHash"])
	}
	if ErrCodeCancelled != codes["ErrCodeCancelled"] {
		t.Errorf("ErrCodeCancelled = %v, want %v", ErrCodeCancelled, codes["ErrCodeCancelled"])
	}
	if ErrCodeRoomNotFound != codes["ErrCodeRoomNotFound"] {
		t.Errorf("ErrCodeRoomNotFound = %v, want %v", ErrCodeRoomNotFound, codes["ErrCodeRoomNotFound"])
	}
	if ErrCodeRoomFull != codes["ErrCodeRoomFull"] {
		t.Errorf("ErrCodeRoomFull = %v, want %v", ErrCodeRoomFull, codes["ErrCodeRoomFull"])
	}
}

func TestProtocolConstants(t *testing.T) {
	if ProtocolVersion != 1 {
		t.Errorf("ProtocolVersion = %v, want 1", ProtocolVersion)
	}

	if MaxMessageSize != 1<<20 {
		t.Errorf("MaxMessageSize = %v, want %v", MaxMessageSize, 1<<20)
	}

	if HeaderSize != 5 {
		t.Errorf("HeaderSize = %v, want 5", HeaderSize)
	}
}

func TestMessageTypes(t *testing.T) {
	// Verify message types don't overlap
	types := map[uint8]string{
		MsgTypeHello:          "Hello",
		MsgTypeHelloAck:       "HelloAck",
		MsgTypePAKEInit:       "PAKEInit",
		MsgTypePAKEResponse:   "PAKEResponse",
		MsgTypePAKEConfirm:    "PAKEConfirm",
		MsgTypeKeyExchange:    "KeyExchange",
		MsgTypeKeyExchangeAck: "KeyExchangeAck",
		MsgTypeFileInfo:       "FileInfo",
		MsgTypeFileInfoAck:    "FileInfoAck",
		MsgTypeChunk:          "Chunk",
		MsgTypeChunkAck:       "ChunkAck",
		MsgTypeComplete:       "Complete",
		MsgTypeCompleteAck:    "CompleteAck",
		MsgTypeError:          "Error",
		MsgTypeCancel:         "Cancel",
	}

	if len(types) != 15 {
		t.Errorf("Expected 15 unique message types, got %d", len(types))
	}
}

func BenchmarkMessageEncode(b *testing.B) {
	msg := &Message{
		Type:    MsgTypeChunk,
		Payload: make([]byte, 65536),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		msg.Encode()
	}
}

func BenchmarkReadMessage(b *testing.B) {
	msg := &Message{
		Type:    MsgTypeChunk,
		Payload: make([]byte, 65536),
	}
	encoded := msg.Encode()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		reader := bytes.NewReader(encoded)
		ReadMessage(reader)
	}
}

func BenchmarkFileInfoEncode(b *testing.B) {
	info := &FileInfo{
		Name:       "testfile.bin",
		Size:       1000000,
		Hash:       make([]byte, 32),
		Compressed: true,
		ChunkSize:  65536,
		NumChunks:  16,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		info.Encode()
	}
}
