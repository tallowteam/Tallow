package crypto

import (
	"bytes"
	"crypto/rand"
	"testing"
)

func TestNewCPaceInitiator(t *testing.T) {
	password := []byte("test-password")

	session, err := NewCPaceInitiator(password)
	if err != nil {
		t.Fatalf("NewCPaceInitiator failed: %v", err)
	}

	if session == nil {
		t.Fatal("session is nil")
	}

	if len(session.SessionID()) != CPaceIDSize {
		t.Errorf("SessionID len = %v, want %v", len(session.SessionID()), CPaceIDSize)
	}

	if len(session.PublicKey()) != CPaceElementSize {
		t.Errorf("PublicKey len = %v, want %v", len(session.PublicKey()), CPaceElementSize)
	}

	if !session.isInitiator {
		t.Error("session should be marked as initiator")
	}
}

func TestNewCPaceResponder(t *testing.T) {
	password := []byte("test-password")
	sessionID := make([]byte, CPaceIDSize)
	rand.Read(sessionID)

	session, err := NewCPaceResponder(password, sessionID)
	if err != nil {
		t.Fatalf("NewCPaceResponder failed: %v", err)
	}

	if session == nil {
		t.Fatal("session is nil")
	}

	if !bytes.Equal(session.SessionID(), sessionID) {
		t.Error("SessionID mismatch")
	}

	if len(session.PublicKey()) != CPaceElementSize {
		t.Errorf("PublicKey len = %v, want %v", len(session.PublicKey()), CPaceElementSize)
	}

	if session.isInitiator {
		t.Error("session should not be marked as initiator")
	}
}

func TestNewCPaceResponderInvalidSessionID(t *testing.T) {
	password := []byte("test-password")

	tests := []struct {
		name      string
		sessionID []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, CPaceIDSize-1)},
		{"too long", make([]byte, CPaceIDSize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewCPaceResponder(password, tt.sessionID)
			if err == nil {
				t.Error("Expected error for invalid session ID")
			}
		})
	}
}

func TestCPaceComputeSharedSecret(t *testing.T) {
	password := []byte("shared-password")

	// Create initiator
	initiator, _ := NewCPaceInitiator(password)

	// Create responder with initiator's session ID
	responder, _ := NewCPaceResponder(password, initiator.SessionID())

	// Compute shared secrets
	secret1, err := initiator.ComputeSharedSecret(responder.PublicKey())
	if err != nil {
		t.Fatalf("Initiator ComputeSharedSecret failed: %v", err)
	}

	secret2, err := responder.ComputeSharedSecret(initiator.PublicKey())
	if err != nil {
		t.Fatalf("Responder ComputeSharedSecret failed: %v", err)
	}

	if !bytes.Equal(secret1, secret2) {
		t.Error("Shared secrets do not match")
	}

	if len(secret1) != 32 {
		t.Errorf("shared secret len = %v, want 32", len(secret1))
	}
}

func TestCPaceComputeSharedSecretInvalidPeerKey(t *testing.T) {
	password := []byte("test-password")
	initiator, _ := NewCPaceInitiator(password)

	tests := []struct {
		name string
		key  []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, CPaceElementSize-1)},
		{"too long", make([]byte, CPaceElementSize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := initiator.ComputeSharedSecret(tt.key)
			if err == nil {
				t.Error("Expected error for invalid peer key")
			}
		})
	}
}

func TestCPaceWrongPassword(t *testing.T) {
	password1 := []byte("password-one")
	password2 := []byte("password-two")

	initiator, _ := NewCPaceInitiator(password1)
	responder, _ := NewCPaceResponder(password2, initiator.SessionID())

	secret1, _ := initiator.ComputeSharedSecret(responder.PublicKey())
	secret2, _ := responder.ComputeSharedSecret(initiator.PublicKey())

	if bytes.Equal(secret1, secret2) {
		t.Error("Different passwords should produce different secrets")
	}
}

func TestInitiatorStart(t *testing.T) {
	password := []byte("test-password")

	exchange, msg1, err := InitiatorStart(password)
	if err != nil {
		t.Fatalf("InitiatorStart failed: %v", err)
	}

	if exchange == nil {
		t.Error("exchange is nil")
	}

	expectedLen := CPaceIDSize + CPaceElementSize
	if len(msg1) != expectedLen {
		t.Errorf("msg1 len = %v, want %v", len(msg1), expectedLen)
	}
}

func TestResponderRespond(t *testing.T) {
	password := []byte("test-password")

	_, msg1, _ := InitiatorStart(password)

	exchange, msg2, err := ResponderRespond(password, msg1)
	if err != nil {
		t.Fatalf("ResponderRespond failed: %v", err)
	}

	if exchange == nil {
		t.Error("exchange is nil")
	}

	expectedLen := CPaceElementSize + 32 // public key + confirmation
	if len(msg2) != expectedLen {
		t.Errorf("msg2 len = %v, want %v", len(msg2), expectedLen)
	}

	if exchange.sharedKey == nil {
		t.Error("sharedKey is nil")
	}
}

func TestResponderRespondInvalidMsg1(t *testing.T) {
	password := []byte("test-password")

	tests := []struct {
		name string
		msg1 []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, CPaceIDSize)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := ResponderRespond(password, tt.msg1)
			if err == nil {
				t.Error("Expected error for invalid msg1")
			}
		})
	}
}

func TestInitiatorFinish(t *testing.T) {
	password := []byte("test-password")

	initiator, msg1, _ := InitiatorStart(password)
	_, msg2, _ := ResponderRespond(password, msg1)

	confirmation, err := initiator.InitiatorFinish(msg2)
	if err != nil {
		t.Fatalf("InitiatorFinish failed: %v", err)
	}

	if len(confirmation) != 32 {
		t.Errorf("confirmation len = %v, want 32", len(confirmation))
	}

	if initiator.sharedKey == nil {
		t.Error("sharedKey is nil after InitiatorFinish")
	}
}

func TestInitiatorFinishInvalidMsg2(t *testing.T) {
	password := []byte("test-password")
	initiator, _, _ := InitiatorStart(password)

	tests := []struct {
		name string
		msg2 []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, CPaceElementSize)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := initiator.InitiatorFinish(tt.msg2)
			if err == nil {
				t.Error("Expected error for invalid msg2")
			}
		})
	}
}

func TestInitiatorFinishWrongPassword(t *testing.T) {
	password1 := []byte("password-one")
	password2 := []byte("password-two")

	initiator, msg1, _ := InitiatorStart(password1)
	_, msg2, _ := ResponderRespond(password2, msg1)

	_, err := initiator.InitiatorFinish(msg2)
	if err == nil {
		t.Error("InitiatorFinish with wrong password should fail")
	}
}

func TestResponderVerify(t *testing.T) {
	password := []byte("test-password")

	initiator, msg1, _ := InitiatorStart(password)
	responder, msg2, _ := ResponderRespond(password, msg1)
	confirmation, _ := initiator.InitiatorFinish(msg2)

	err := responder.ResponderVerify(confirmation)
	if err != nil {
		t.Fatalf("ResponderVerify failed: %v", err)
	}
}

func TestResponderVerifyWrongConfirmation(t *testing.T) {
	password := []byte("test-password")

	initiator, msg1, _ := InitiatorStart(password)
	responder, msg2, _ := ResponderRespond(password, msg1)
	initiator.InitiatorFinish(msg2)

	// Wrong confirmation
	wrongConfirmation := make([]byte, 32)
	rand.Read(wrongConfirmation)

	err := responder.ResponderVerify(wrongConfirmation)
	if err == nil {
		t.Error("ResponderVerify with wrong confirmation should fail")
	}
}

func TestCPaceFullExchange(t *testing.T) {
	password := []byte("secure-password-123")

	// Initiator starts
	initiator, msg1, err := InitiatorStart(password)
	if err != nil {
		t.Fatalf("InitiatorStart failed: %v", err)
	}

	// Responder responds
	responder, msg2, err := ResponderRespond(password, msg1)
	if err != nil {
		t.Fatalf("ResponderRespond failed: %v", err)
	}

	// Initiator finishes
	confirmation, err := initiator.InitiatorFinish(msg2)
	if err != nil {
		t.Fatalf("InitiatorFinish failed: %v", err)
	}

	// Responder verifies
	err = responder.ResponderVerify(confirmation)
	if err != nil {
		t.Fatalf("ResponderVerify failed: %v", err)
	}

	// Both should have same shared key
	if !bytes.Equal(initiator.SharedKey(), responder.SharedKey()) {
		t.Error("Shared keys do not match")
	}
}

func TestCPaceFullExchangeWrongPassword(t *testing.T) {
	password1 := []byte("password-one")
	password2 := []byte("password-two")

	initiator, msg1, _ := InitiatorStart(password1)
	responder, msg2, _ := ResponderRespond(password2, msg1)

	// Initiator should fail to verify responder's confirmation
	_, err := initiator.InitiatorFinish(msg2)
	if err == nil {
		t.Error("InitiatorFinish should fail with wrong password")
	}

	// Even if we skip that check, shared keys would differ
	_ = responder // responder has different key
}

func TestCPaceSharedKey(t *testing.T) {
	password := []byte("test-password")

	initiator, msg1, _ := InitiatorStart(password)
	responder, msg2, _ := ResponderRespond(password, msg1)
	initiator.InitiatorFinish(msg2)

	key1 := initiator.SharedKey()
	key2 := responder.SharedKey()

	if len(key1) != 32 {
		t.Errorf("SharedKey len = %v, want 32", len(key1))
	}

	if !bytes.Equal(key1, key2) {
		t.Error("Shared keys do not match")
	}
}

func TestCPaceSessionIDUniqueness(t *testing.T) {
	password := []byte("test-password")
	sessionIDs := make(map[string]bool)

	for i := 0; i < 100; i++ {
		session, _ := NewCPaceInitiator(password)
		idStr := string(session.SessionID())
		if sessionIDs[idStr] {
			t.Error("Duplicate session ID generated")
		}
		sessionIDs[idStr] = true
	}
}

func TestCPacePublicKeyUniqueness(t *testing.T) {
	password := []byte("test-password")
	pubKeys := make(map[string]bool)

	for i := 0; i < 100; i++ {
		session, _ := NewCPaceInitiator(password)
		keyStr := string(session.PublicKey())
		if pubKeys[keyStr] {
			t.Error("Duplicate public key generated")
		}
		pubKeys[keyStr] = true
	}
}

func TestCPaceConstants(t *testing.T) {
	if CPaceIDSize != 32 {
		t.Errorf("CPaceIDSize = %v, want 32", CPaceIDSize)
	}

	if CPaceElementSize != 32 {
		t.Errorf("CPaceElementSize = %v, want 32", CPaceElementSize)
	}
}

func BenchmarkCPaceInitiator(b *testing.B) {
	password := []byte("benchmark-password")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		NewCPaceInitiator(password)
	}
}

func BenchmarkCPaceResponder(b *testing.B) {
	password := []byte("benchmark-password")
	initiator, _ := NewCPaceInitiator(password)
	sessionID := initiator.SessionID()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		NewCPaceResponder(password, sessionID)
	}
}

func BenchmarkCPaceComputeSharedSecret(b *testing.B) {
	password := []byte("benchmark-password")
	initiator, _ := NewCPaceInitiator(password)
	responder, _ := NewCPaceResponder(password, initiator.SessionID())
	peerKey := responder.PublicKey()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		initiator.ComputeSharedSecret(peerKey)
	}
}

func BenchmarkCPaceFullExchange(b *testing.B) {
	password := []byte("benchmark-password")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		initiator, msg1, _ := InitiatorStart(password)
		responder, msg2, _ := ResponderRespond(password, msg1)
		confirmation, _ := initiator.InitiatorFinish(msg2)
		responder.ResponderVerify(confirmation)
	}
}
