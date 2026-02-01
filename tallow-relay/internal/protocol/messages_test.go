package protocol

import (
	"encoding/json"
	"testing"
	"time"
)

func TestMessageTypeConstants(t *testing.T) {
	// Verify all message types are defined
	types := []string{
		MsgTypeCreateRoom,
		MsgTypeRoomCreated,
		MsgTypeJoinRoom,
		MsgTypeRoomJoined,
		MsgTypePeerJoined,
		MsgTypePeerLeft,
		MsgTypeClose,
		MsgTypeError,
		MsgTypePing,
		MsgTypePong,
		MsgTypeData,
		MsgTypeSignal,
		MsgTypePAKE,
		MsgTypeEncrypt,
	}

	for _, msgType := range types {
		if msgType == "" {
			t.Error("Empty message type constant")
		}
	}
}

func TestErrorCodeConstants(t *testing.T) {
	// Verify all error codes are defined
	codes := []string{
		ErrorCodeUnknown,
		ErrorCodeRoomNotFound,
		ErrorCodeRoomFull,
		ErrorCodeRoomExpired,
		ErrorCodeRateLimited,
		ErrorCodeInvalidMessage,
		ErrorCodeHandshakeFailed,
		ErrorCodeTransferFailed,
		ErrorCodeInternalError,
		ErrorCodeMaxRooms,
	}

	for _, code := range codes {
		if code == "" {
			t.Error("Empty error code constant")
		}
	}
}

func TestNewMessage(t *testing.T) {
	tests := []struct {
		name    string
		msgType string
		payload interface{}
		wantErr bool
	}{
		{
			name:    "nil payload",
			msgType: MsgTypePing,
			payload: nil,
			wantErr: false,
		},
		{
			name:    "string payload",
			msgType: MsgTypeData,
			payload: "test data",
			wantErr: false,
		},
		{
			name:    "struct payload",
			msgType: MsgTypeCreateRoom,
			payload: CreateRoomRequest{ExpiryMinutes: 30},
			wantErr: false,
		},
		{
			name:    "map payload",
			msgType: MsgTypeData,
			payload: map[string]string{"key": "value"},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			before := time.Now().UnixMilli()
			msg, err := NewMessage(tt.msgType, tt.payload)
			after := time.Now().UnixMilli()

			if (err != nil) != tt.wantErr {
				t.Errorf("NewMessage() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil {
				return
			}

			if msg.Type != tt.msgType {
				t.Errorf("Type = %s, want %s", msg.Type, tt.msgType)
			}

			if msg.Timestamp < before || msg.Timestamp > after {
				t.Errorf("Timestamp out of range: %d not in [%d, %d]", msg.Timestamp, before, after)
			}

			if tt.payload == nil && msg.Payload != nil {
				t.Error("Payload should be nil for nil input")
			}

			if tt.payload != nil && msg.Payload == nil {
				t.Error("Payload should not be nil for non-nil input")
			}
		})
	}
}

func TestNewMessageUnmarshalablePayload(t *testing.T) {
	// Functions cannot be marshaled to JSON
	_, err := NewMessage(MsgTypeData, func() {})
	if err == nil {
		t.Error("Expected error for unmarshalable payload")
	}
}

func TestMessageParsePayload(t *testing.T) {
	// Create message with CreateRoomRequest payload
	original := CreateRoomRequest{
		ExpiryMinutes: 30,
		Metadata:      "test metadata",
	}

	msg, err := NewMessage(MsgTypeCreateRoom, original)
	if err != nil {
		t.Fatalf("NewMessage failed: %v", err)
	}

	// Parse back
	var parsed CreateRoomRequest
	err = msg.ParsePayload(&parsed)
	if err != nil {
		t.Fatalf("ParsePayload failed: %v", err)
	}

	if parsed.ExpiryMinutes != original.ExpiryMinutes {
		t.Errorf("ExpiryMinutes = %d, want %d", parsed.ExpiryMinutes, original.ExpiryMinutes)
	}
	if parsed.Metadata != original.Metadata {
		t.Errorf("Metadata = %s, want %s", parsed.Metadata, original.Metadata)
	}
}

func TestMessageParsePayloadNil(t *testing.T) {
	msg := &Message{Type: MsgTypePing, Payload: nil}

	var payload interface{}
	err := msg.ParsePayload(&payload)
	if err != nil {
		t.Errorf("ParsePayload with nil payload should not error: %v", err)
	}
}

func TestMessageParsePayloadInvalid(t *testing.T) {
	msg := &Message{
		Type:    MsgTypeData,
		Payload: json.RawMessage(`not valid json`),
	}

	var payload map[string]string
	err := msg.ParsePayload(&payload)
	if err == nil {
		t.Error("Expected error for invalid JSON payload")
	}
}

func TestMessageJSONRoundtrip(t *testing.T) {
	original := &Message{
		Type:      MsgTypeCreateRoom,
		Timestamp: time.Now().UnixMilli(),
	}
	original.Payload, _ = json.Marshal(CreateRoomRequest{ExpiryMinutes: 30})

	// Marshal
	data, err := json.Marshal(original)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	// Unmarshal
	var parsed Message
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.Type != original.Type {
		t.Errorf("Type = %s, want %s", parsed.Type, original.Type)
	}
	if parsed.Timestamp != original.Timestamp {
		t.Errorf("Timestamp = %d, want %d", parsed.Timestamp, original.Timestamp)
	}
}

func TestCreateRoomRequest(t *testing.T) {
	req := CreateRoomRequest{
		ExpiryMinutes: 60,
		Metadata:      "encrypted data",
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed CreateRoomRequest
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.ExpiryMinutes != req.ExpiryMinutes {
		t.Error("ExpiryMinutes mismatch")
	}
	if parsed.Metadata != req.Metadata {
		t.Error("Metadata mismatch")
	}
}

func TestRoomCreatedResponse(t *testing.T) {
	resp := RoomCreatedResponse{
		RoomID:    "abc123",
		Code:      "alpha-beta-gamma",
		ExpiresAt: time.Now().Add(time.Hour).UnixMilli(),
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed RoomCreatedResponse
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.RoomID != resp.RoomID {
		t.Error("RoomID mismatch")
	}
	if parsed.Code != resp.Code {
		t.Error("Code mismatch")
	}
	if parsed.ExpiresAt != resp.ExpiresAt {
		t.Error("ExpiresAt mismatch")
	}
}

func TestJoinRoomRequest(t *testing.T) {
	req := JoinRoomRequest{
		Code: "delta-echo-foxtrot",
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed JoinRoomRequest
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.Code != req.Code {
		t.Error("Code mismatch")
	}
}

func TestRoomJoinedResponse(t *testing.T) {
	resp := RoomJoinedResponse{
		RoomID:    "xyz789",
		ExpiresAt: time.Now().Add(30 * time.Minute).UnixMilli(),
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed RoomJoinedResponse
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.RoomID != resp.RoomID {
		t.Error("RoomID mismatch")
	}
}

func TestPeerJoinedNotification(t *testing.T) {
	notif := PeerJoinedNotification{
		PeerID: "peer123",
	}

	data, err := json.Marshal(notif)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed PeerJoinedNotification
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.PeerID != notif.PeerID {
		t.Error("PeerID mismatch")
	}
}

func TestPeerLeftNotification(t *testing.T) {
	notif := PeerLeftNotification{
		PeerID: "peer456",
		Reason: "disconnect",
	}

	data, err := json.Marshal(notif)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed PeerLeftNotification
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.PeerID != notif.PeerID {
		t.Error("PeerID mismatch")
	}
	if parsed.Reason != notif.Reason {
		t.Error("Reason mismatch")
	}
}

func TestErrorResponse(t *testing.T) {
	resp := ErrorResponse{
		Code:    ErrorCodeRoomNotFound,
		Message: "Room not found",
		Details: "Room with code 'xyz' does not exist",
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed ErrorResponse
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.Code != resp.Code {
		t.Error("Code mismatch")
	}
	if parsed.Message != resp.Message {
		t.Error("Message mismatch")
	}
	if parsed.Details != resp.Details {
		t.Error("Details mismatch")
	}
}

func TestCloseRequest(t *testing.T) {
	req := CloseRequest{
		Reason: "transfer complete",
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed CloseRequest
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.Reason != req.Reason {
		t.Error("Reason mismatch")
	}
}

func TestDataMessage(t *testing.T) {
	msg := DataMessage{
		Data: []byte("encrypted file chunk"),
		Seq:  42,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed DataMessage
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if string(parsed.Data) != string(msg.Data) {
		t.Error("Data mismatch")
	}
	if parsed.Seq != msg.Seq {
		t.Error("Seq mismatch")
	}
}

func TestSignalMessage(t *testing.T) {
	signalData := map[string]interface{}{
		"type": "offer",
		"sdp":  "v=0...",
	}
	signalBytes, _ := json.Marshal(signalData)

	msg := SignalMessage{
		Signal: signalBytes,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed SignalMessage
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	// Parse the signal
	var parsedSignal map[string]interface{}
	err = json.Unmarshal(parsed.Signal, &parsedSignal)
	if err != nil {
		t.Fatalf("Failed to parse signal: %v", err)
	}

	if parsedSignal["type"] != "offer" {
		t.Error("Signal type mismatch")
	}
}

func TestPAKEMessage(t *testing.T) {
	msg := PAKEMessage{
		Step: 1,
		Data: []byte("pake public key data"),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed PAKEMessage
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.Step != msg.Step {
		t.Error("Step mismatch")
	}
	if string(parsed.Data) != string(msg.Data) {
		t.Error("Data mismatch")
	}
}

func TestStatsResponse(t *testing.T) {
	resp := StatsResponse{
		ActiveRooms:      10,
		TotalRooms:       1000,
		ActiveConns:      20,
		BytesTransferred: 1073741824,
		Uptime:           3600,
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var parsed StatsResponse
	err = json.Unmarshal(data, &parsed)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if parsed.ActiveRooms != resp.ActiveRooms {
		t.Error("ActiveRooms mismatch")
	}
	if parsed.TotalRooms != resp.TotalRooms {
		t.Error("TotalRooms mismatch")
	}
	if parsed.ActiveConns != resp.ActiveConns {
		t.Error("ActiveConns mismatch")
	}
	if parsed.BytesTransferred != resp.BytesTransferred {
		t.Error("BytesTransferred mismatch")
	}
	if parsed.Uptime != resp.Uptime {
		t.Error("Uptime mismatch")
	}
}

func TestEmptyPayloads(t *testing.T) {
	tests := []struct {
		name    string
		msgType string
	}{
		{"ping", MsgTypePing},
		{"pong", MsgTypePong},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			msg, err := NewMessage(tt.msgType, nil)
			if err != nil {
				t.Fatalf("NewMessage failed: %v", err)
			}

			data, err := json.Marshal(msg)
			if err != nil {
				t.Fatalf("Marshal failed: %v", err)
			}

			var parsed Message
			err = json.Unmarshal(data, &parsed)
			if err != nil {
				t.Fatalf("Unmarshal failed: %v", err)
			}

			if parsed.Type != tt.msgType {
				t.Errorf("Type = %s, want %s", parsed.Type, tt.msgType)
			}
		})
	}
}

func TestComplexMessageFlow(t *testing.T) {
	// Simulate creating a room
	createReq := CreateRoomRequest{ExpiryMinutes: 30}
	createMsg, _ := NewMessage(MsgTypeCreateRoom, createReq)

	// Parse and respond
	var parsedCreate CreateRoomRequest
	createMsg.ParsePayload(&parsedCreate)

	createResp := RoomCreatedResponse{
		RoomID:    "room123",
		Code:      "alpha-beta",
		ExpiresAt: time.Now().Add(30 * time.Minute).UnixMilli(),
	}
	respMsg, _ := NewMessage(MsgTypeRoomCreated, createResp)

	var parsedResp RoomCreatedResponse
	respMsg.ParsePayload(&parsedResp)

	if parsedResp.Code != "alpha-beta" {
		t.Error("Response parsing failed")
	}
}

func BenchmarkNewMessage(b *testing.B) {
	payload := CreateRoomRequest{ExpiryMinutes: 30}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		NewMessage(MsgTypeCreateRoom, payload)
	}
}

func BenchmarkMessageParse(b *testing.B) {
	msg, _ := NewMessage(MsgTypeCreateRoom, CreateRoomRequest{ExpiryMinutes: 30})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var req CreateRoomRequest
		msg.ParsePayload(&req)
	}
}

func BenchmarkMessageMarshal(b *testing.B) {
	msg, _ := NewMessage(MsgTypeCreateRoom, CreateRoomRequest{ExpiryMinutes: 30})

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		json.Marshal(msg)
	}
}

func BenchmarkMessageUnmarshal(b *testing.B) {
	msg, _ := NewMessage(MsgTypeCreateRoom, CreateRoomRequest{ExpiryMinutes: 30})
	data, _ := json.Marshal(msg)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		var parsed Message
		json.Unmarshal(data, &parsed)
	}
}
