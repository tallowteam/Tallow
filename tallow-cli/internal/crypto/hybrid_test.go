package crypto

import (
	"bytes"
	"testing"
)

func TestGenerateX25519KeyPair(t *testing.T) {
	kp, err := GenerateX25519KeyPair()
	if err != nil {
		t.Fatalf("GenerateX25519KeyPair failed: %v", err)
	}

	if len(kp.PublicKey) != X25519KeySize {
		t.Errorf("PublicKey len = %v, want %v", len(kp.PublicKey), X25519KeySize)
	}

	if len(kp.PrivateKey) != X25519KeySize {
		t.Errorf("PrivateKey len = %v, want %v", len(kp.PrivateKey), X25519KeySize)
	}
}

func TestX25519KeyPairUniqueness(t *testing.T) {
	kp1, _ := GenerateX25519KeyPair()
	kp2, _ := GenerateX25519KeyPair()

	if bytes.Equal(kp1.PublicKey[:], kp2.PublicKey[:]) {
		t.Error("X25519 key pairs should be unique")
	}
}

func TestX25519ECDH(t *testing.T) {
	kp1, _ := GenerateX25519KeyPair()
	kp2, _ := GenerateX25519KeyPair()

	// Both sides derive the same shared secret
	shared1, err := X25519ECDH(kp1.PrivateKey[:], kp2.PublicKey[:])
	if err != nil {
		t.Fatalf("X25519ECDH failed: %v", err)
	}

	shared2, err := X25519ECDH(kp2.PrivateKey[:], kp1.PublicKey[:])
	if err != nil {
		t.Fatalf("X25519ECDH failed: %v", err)
	}

	if !bytes.Equal(shared1, shared2) {
		t.Error("X25519 shared secrets do not match")
	}

	if len(shared1) != X25519KeySize {
		t.Errorf("shared secret len = %v, want %v", len(shared1), X25519KeySize)
	}
}

func TestX25519ECDHInvalidInputs(t *testing.T) {
	kp, _ := GenerateX25519KeyPair()

	tests := []struct {
		name      string
		priv      []byte
		pub       []byte
		wantError bool
	}{
		{"nil private key", nil, kp.PublicKey[:], true},
		{"nil public key", kp.PrivateKey[:], nil, true},
		{"short private key", make([]byte, 31), kp.PublicKey[:], true},
		{"short public key", kp.PrivateKey[:], make([]byte, 31), true},
		{"long private key", make([]byte, 33), kp.PublicKey[:], true},
		{"long public key", kp.PrivateKey[:], make([]byte, 33), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := X25519ECDH(tt.priv, tt.pub)
			if (err != nil) != tt.wantError {
				t.Errorf("X25519ECDH() error = %v, wantError %v", err, tt.wantError)
			}
		})
	}
}

func TestGenerateHybridKeyPair(t *testing.T) {
	kp, err := GenerateHybridKeyPair()
	if err != nil {
		t.Fatalf("GenerateHybridKeyPair failed: %v", err)
	}

	if kp.MLKEM == nil {
		t.Error("MLKEM key pair is nil")
	}

	if kp.X25519 == nil {
		t.Error("X25519 key pair is nil")
	}
}

func TestHybridPublicKey(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	if pubKey == nil {
		t.Fatal("PublicKey() returned nil")
	}

	if len(pubKey.MLKEM) != MLKEMPublicKeySize {
		t.Errorf("MLKEM key len = %v, want %v", len(pubKey.MLKEM), MLKEMPublicKeySize)
	}

	if len(pubKey.X25519) != X25519KeySize {
		t.Errorf("X25519 key len = %v, want %v", len(pubKey.X25519), X25519KeySize)
	}
}

func TestHybridPublicKeySerialize(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	// Serialize
	serialized := pubKey.Bytes()
	expectedLen := 2 + MLKEMPublicKeySize + X25519KeySize
	if len(serialized) != expectedLen {
		t.Errorf("Bytes() len = %v, want %v", len(serialized), expectedLen)
	}

	// Deserialize
	parsed, err := HybridPublicKeyFromBytes(serialized)
	if err != nil {
		t.Fatalf("HybridPublicKeyFromBytes failed: %v", err)
	}

	if !bytes.Equal(parsed.MLKEM, pubKey.MLKEM) {
		t.Error("MLKEM key mismatch after deserialize")
	}

	if !bytes.Equal(parsed.X25519, pubKey.X25519) {
		t.Error("X25519 key mismatch after deserialize")
	}
}

func TestHybridPublicKeyFromBytesInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short for header", []byte{0}},
		{"invalid length in header", []byte{0xff, 0xff}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := HybridPublicKeyFromBytes(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestHybridEncapsulate(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	encap, sharedSecret, err := HybridEncapsulate(pubKey)
	if err != nil {
		t.Fatalf("HybridEncapsulate failed: %v", err)
	}

	if encap == nil {
		t.Error("encapsulation is nil")
	}

	if len(sharedSecret) != HybridSharedKeySize {
		t.Errorf("sharedSecret len = %v, want %v", len(sharedSecret), HybridSharedKeySize)
	}

	if len(encap.MLKEMCiphertext) != MLKEMCiphertextSize {
		t.Errorf("MLKEMCiphertext len = %v, want %v", len(encap.MLKEMCiphertext), MLKEMCiphertextSize)
	}

	if len(encap.X25519PublicKey) != X25519KeySize {
		t.Errorf("X25519PublicKey len = %v, want %v", len(encap.X25519PublicKey), X25519KeySize)
	}
}

func TestHybridEncapsulationSerialize(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	encap, _, _ := HybridEncapsulate(pubKey)

	// Serialize
	serialized := encap.Bytes()
	expectedLen := 2 + MLKEMCiphertextSize + X25519KeySize
	if len(serialized) != expectedLen {
		t.Errorf("Bytes() len = %v, want %v", len(serialized), expectedLen)
	}

	// Deserialize
	parsed, err := HybridEncapsulationFromBytes(serialized)
	if err != nil {
		t.Fatalf("HybridEncapsulationFromBytes failed: %v", err)
	}

	if !bytes.Equal(parsed.MLKEMCiphertext, encap.MLKEMCiphertext) {
		t.Error("MLKEMCiphertext mismatch after deserialize")
	}

	if !bytes.Equal(parsed.X25519PublicKey, encap.X25519PublicKey) {
		t.Error("X25519PublicKey mismatch after deserialize")
	}
}

func TestHybridEncapsulationFromBytesInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short for header", []byte{0}},
		{"invalid length in header", []byte{0xff, 0xff}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := HybridEncapsulationFromBytes(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestHybridDecapsulate(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	encap, sharedSecret1, err := HybridEncapsulate(pubKey)
	if err != nil {
		t.Fatalf("HybridEncapsulate failed: %v", err)
	}

	sharedSecret2, err := kp.HybridDecapsulate(encap)
	if err != nil {
		t.Fatalf("HybridDecapsulate failed: %v", err)
	}

	if !bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Shared secrets do not match")
	}
}

func TestHybridDecapsulateWrongKey(t *testing.T) {
	kp1, _ := GenerateHybridKeyPair()
	kp2, _ := GenerateHybridKeyPair()

	encap, sharedSecret1, _ := HybridEncapsulate(kp1.PublicKey())

	// Try to decapsulate with wrong key pair
	sharedSecret2, err := kp2.HybridDecapsulate(encap)

	// Should either fail or produce different shared secret
	if err == nil && bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Decapsulate with wrong key should fail or produce different secret")
	}
}

func TestHybridEncapsulateDecapsulateRoundtrip(t *testing.T) {
	// Test multiple iterations for consistency
	for i := 0; i < 10; i++ {
		kp, err := GenerateHybridKeyPair()
		if err != nil {
			t.Fatalf("Iteration %d: GenerateHybridKeyPair failed: %v", i, err)
		}

		encap, secret1, err := HybridEncapsulate(kp.PublicKey())
		if err != nil {
			t.Fatalf("Iteration %d: HybridEncapsulate failed: %v", i, err)
		}

		secret2, err := kp.HybridDecapsulate(encap)
		if err != nil {
			t.Fatalf("Iteration %d: HybridDecapsulate failed: %v", i, err)
		}

		if !bytes.Equal(secret1, secret2) {
			t.Errorf("Iteration %d: Shared secrets don't match", i)
		}
	}
}

func TestHybridSecretUniqueness(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	secrets := make(map[string]bool)
	for i := 0; i < 100; i++ {
		_, secret, err := HybridEncapsulate(pubKey)
		if err != nil {
			t.Fatalf("HybridEncapsulate failed: %v", err)
		}

		secretStr := string(secret)
		if secrets[secretStr] {
			t.Error("Duplicate shared secret generated")
		}
		secrets[secretStr] = true
	}
}

func TestHybridEncapsulationUniqueness(t *testing.T) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	encaps := make(map[string]bool)
	for i := 0; i < 100; i++ {
		encap, _, err := HybridEncapsulate(pubKey)
		if err != nil {
			t.Fatalf("HybridEncapsulate failed: %v", err)
		}

		encapStr := string(encap.Bytes())
		if encaps[encapStr] {
			t.Error("Duplicate encapsulation generated")
		}
		encaps[encapStr] = true
	}
}

func BenchmarkGenerateHybridKeyPair(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GenerateHybridKeyPair()
	}
}

func BenchmarkHybridEncapsulate(b *testing.B) {
	kp, _ := GenerateHybridKeyPair()
	pubKey := kp.PublicKey()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		HybridEncapsulate(pubKey)
	}
}

func BenchmarkHybridDecapsulate(b *testing.B) {
	kp, _ := GenerateHybridKeyPair()
	encap, _, _ := HybridEncapsulate(kp.PublicKey())

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		kp.HybridDecapsulate(encap)
	}
}

func BenchmarkHybridFullExchange(b *testing.B) {
	for i := 0; i < b.N; i++ {
		kp, _ := GenerateHybridKeyPair()
		encap, _, _ := HybridEncapsulate(kp.PublicKey())
		kp.HybridDecapsulate(encap)
	}
}

func BenchmarkX25519ECDH(b *testing.B) {
	kp1, _ := GenerateX25519KeyPair()
	kp2, _ := GenerateX25519KeyPair()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		X25519ECDH(kp1.PrivateKey[:], kp2.PublicKey[:])
	}
}
