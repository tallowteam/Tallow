package crypto

import (
	"bytes"
	"testing"
)

func TestGenerateMLKEMKeyPair(t *testing.T) {
	kp, err := GenerateMLKEMKeyPair()
	if err != nil {
		t.Fatalf("GenerateMLKEMKeyPair failed: %v", err)
	}

	if kp.PublicKey == nil {
		t.Error("PublicKey is nil")
	}
	if kp.PrivateKey == nil {
		t.Error("PrivateKey is nil")
	}
}

func TestMLKEMKeyPairBytes(t *testing.T) {
	kp, err := GenerateMLKEMKeyPair()
	if err != nil {
		t.Fatalf("GenerateMLKEMKeyPair failed: %v", err)
	}

	pubBytes := kp.PublicKeyBytes()
	if len(pubBytes) != MLKEMPublicKeySize {
		t.Errorf("PublicKeyBytes len = %v, want %v", len(pubBytes), MLKEMPublicKeySize)
	}

	privBytes := kp.PrivateKeyBytes()
	if len(privBytes) != MLKEMPrivateKeySize {
		t.Errorf("PrivateKeyBytes len = %v, want %v", len(privBytes), MLKEMPrivateKeySize)
	}
}

func TestMLKEMKeyPairUniqueness(t *testing.T) {
	kp1, _ := GenerateMLKEMKeyPair()
	kp2, _ := GenerateMLKEMKeyPair()

	if bytes.Equal(kp1.PublicKeyBytes(), kp2.PublicKeyBytes()) {
		t.Error("Key pairs should be unique")
	}

	if bytes.Equal(kp1.PrivateKeyBytes(), kp2.PrivateKeyBytes()) {
		t.Error("Key pairs should be unique")
	}
}

func TestMLKEMEncapsulateDecapsulate(t *testing.T) {
	kp, err := GenerateMLKEMKeyPair()
	if err != nil {
		t.Fatalf("GenerateMLKEMKeyPair failed: %v", err)
	}

	// Encapsulate
	ciphertext, sharedSecret1, err := MLKEMEncapsulate(kp.PublicKeyBytes())
	if err != nil {
		t.Fatalf("MLKEMEncapsulate failed: %v", err)
	}

	if len(ciphertext) != MLKEMCiphertextSize {
		t.Errorf("ciphertext len = %v, want %v", len(ciphertext), MLKEMCiphertextSize)
	}

	if len(sharedSecret1) != MLKEMSharedKeySize {
		t.Errorf("sharedSecret len = %v, want %v", len(sharedSecret1), MLKEMSharedKeySize)
	}

	// Decapsulate
	sharedSecret2, err := MLKEMDecapsulate(kp.PrivateKey, ciphertext)
	if err != nil {
		t.Fatalf("MLKEMDecapsulate failed: %v", err)
	}

	if !bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Shared secrets do not match")
	}
}

func TestMLKEMDecapsulateFromBytes(t *testing.T) {
	kp, err := GenerateMLKEMKeyPair()
	if err != nil {
		t.Fatalf("GenerateMLKEMKeyPair failed: %v", err)
	}

	ciphertext, sharedSecret1, err := MLKEMEncapsulate(kp.PublicKeyBytes())
	if err != nil {
		t.Fatalf("MLKEMEncapsulate failed: %v", err)
	}

	// Decapsulate from bytes
	sharedSecret2, err := MLKEMDecapsulateFromBytes(kp.PrivateKeyBytes(), ciphertext)
	if err != nil {
		t.Fatalf("MLKEMDecapsulateFromBytes failed: %v", err)
	}

	if !bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Shared secrets do not match")
	}
}

func TestMLKEMEncapsulateInvalidPublicKey(t *testing.T) {
	tests := []struct {
		name   string
		pubKey []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, MLKEMPublicKeySize-1)},
		{"too long", make([]byte, MLKEMPublicKeySize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := MLKEMEncapsulate(tt.pubKey)
			if err == nil {
				t.Error("Expected error for invalid public key")
			}
		})
	}
}

func TestMLKEMDecapsulateInvalidCiphertext(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()

	tests := []struct {
		name       string
		ciphertext []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, MLKEMCiphertextSize-1)},
		{"too long", make([]byte, MLKEMCiphertextSize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := MLKEMDecapsulate(kp.PrivateKey, tt.ciphertext)
			if err == nil {
				t.Error("Expected error for invalid ciphertext")
			}
		})
	}
}

func TestMLKEMDecapsulateFromBytesInvalidPrivateKey(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()
	ciphertext, _, _ := MLKEMEncapsulate(kp.PublicKeyBytes())

	tests := []struct {
		name    string
		privKey []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, MLKEMPrivateKeySize-1)},
		{"too long", make([]byte, MLKEMPrivateKeySize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := MLKEMDecapsulateFromBytes(tt.privKey, ciphertext)
			if err == nil {
				t.Error("Expected error for invalid private key")
			}
		})
	}
}

func TestMLKEMDecapsulateWrongKey(t *testing.T) {
	kp1, _ := GenerateMLKEMKeyPair()
	kp2, _ := GenerateMLKEMKeyPair()

	// Encapsulate to kp1's public key
	ciphertext, sharedSecret1, _ := MLKEMEncapsulate(kp1.PublicKeyBytes())

	// Try to decapsulate with kp2's private key
	sharedSecret2, err := MLKEMDecapsulate(kp2.PrivateKey, ciphertext)

	// ML-KEM doesn't fail on wrong key, but produces wrong shared secret
	if err == nil && bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Wrong key should produce different shared secret")
	}
}

func TestMLKEMPublicKeyFromBytes(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()
	pubBytes := kp.PublicKeyBytes()

	pub, err := MLKEMPublicKeyFromBytes(pubBytes)
	if err != nil {
		t.Fatalf("MLKEMPublicKeyFromBytes failed: %v", err)
	}

	if pub == nil {
		t.Error("Returned public key is nil")
	}

	// Verify the key works
	parsedPubBytes, _ := pub.MarshalBinary()
	ciphertext, _, err := MLKEMEncapsulate(parsedPubBytes)
	if err != nil {
		t.Fatalf("Encapsulate with parsed key failed: %v", err)
	}

	if len(ciphertext) != MLKEMCiphertextSize {
		t.Error("Parsed key produced invalid encapsulation")
	}
}

func TestMLKEMPublicKeyFromBytesInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, MLKEMPublicKeySize-1)},
		{"too long", make([]byte, MLKEMPublicKeySize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := MLKEMPublicKeyFromBytes(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestMLKEMPrivateKeyFromBytes(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()
	privBytes := kp.PrivateKeyBytes()

	priv, err := MLKEMPrivateKeyFromBytes(privBytes)
	if err != nil {
		t.Fatalf("MLKEMPrivateKeyFromBytes failed: %v", err)
	}

	if priv == nil {
		t.Error("Returned private key is nil")
	}

	// Verify the key works
	ciphertext, sharedSecret1, _ := MLKEMEncapsulate(kp.PublicKeyBytes())
	sharedSecret2, err := MLKEMDecapsulate(priv, ciphertext)
	if err != nil {
		t.Fatalf("Decapsulate with parsed key failed: %v", err)
	}

	if !bytes.Equal(sharedSecret1, sharedSecret2) {
		t.Error("Parsed key produced wrong shared secret")
	}
}

func TestMLKEMPrivateKeyFromBytesInvalid(t *testing.T) {
	tests := []struct {
		name string
		data []byte
	}{
		{"nil", nil},
		{"empty", []byte{}},
		{"too short", make([]byte, MLKEMPrivateKeySize-1)},
		{"too long", make([]byte, MLKEMPrivateKeySize+1)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := MLKEMPrivateKeyFromBytes(tt.data)
			if err == nil {
				t.Error("Expected error for invalid data")
			}
		})
	}
}

func TestMLKEMSharedSecretUniqueness(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()

	// Multiple encapsulations should produce different shared secrets
	secrets := make(map[string]bool)
	for i := 0; i < 100; i++ {
		_, ss, err := MLKEMEncapsulate(kp.PublicKeyBytes())
		if err != nil {
			t.Fatalf("MLKEMEncapsulate failed: %v", err)
		}

		ssStr := string(ss)
		if secrets[ssStr] {
			t.Error("Duplicate shared secret generated")
		}
		secrets[ssStr] = true
	}
}

func TestMLKEMCiphertextUniqueness(t *testing.T) {
	kp, _ := GenerateMLKEMKeyPair()

	// Multiple encapsulations should produce different ciphertexts
	cts := make(map[string]bool)
	for i := 0; i < 100; i++ {
		ct, _, err := MLKEMEncapsulate(kp.PublicKeyBytes())
		if err != nil {
			t.Fatalf("MLKEMEncapsulate failed: %v", err)
		}

		ctStr := string(ct)
		if cts[ctStr] {
			t.Error("Duplicate ciphertext generated")
		}
		cts[ctStr] = true
	}
}

func TestMLKEMConstants(t *testing.T) {
	// Verify constants match ML-KEM-768 specifications
	if MLKEMPublicKeySize != 1184 {
		t.Errorf("MLKEMPublicKeySize = %v, want 1184", MLKEMPublicKeySize)
	}
	if MLKEMPrivateKeySize != 2400 {
		t.Errorf("MLKEMPrivateKeySize = %v, want 2400", MLKEMPrivateKeySize)
	}
	if MLKEMCiphertextSize != 1088 {
		t.Errorf("MLKEMCiphertextSize = %v, want 1088", MLKEMCiphertextSize)
	}
	if MLKEMSharedKeySize != 32 {
		t.Errorf("MLKEMSharedKeySize = %v, want 32", MLKEMSharedKeySize)
	}
}

func BenchmarkMLKEMKeyGen(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GenerateMLKEMKeyPair()
	}
}

func BenchmarkMLKEMEncapsulate(b *testing.B) {
	kp, _ := GenerateMLKEMKeyPair()
	pubBytes := kp.PublicKeyBytes()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		MLKEMEncapsulate(pubBytes)
	}
}

func BenchmarkMLKEMDecapsulate(b *testing.B) {
	kp, _ := GenerateMLKEMKeyPair()
	ciphertext, _, _ := MLKEMEncapsulate(kp.PublicKeyBytes())

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		MLKEMDecapsulate(kp.PrivateKey, ciphertext)
	}
}

func BenchmarkMLKEMFullExchange(b *testing.B) {
	for i := 0; i < b.N; i++ {
		kp, _ := GenerateMLKEMKeyPair()
		ct, _, _ := MLKEMEncapsulate(kp.PublicKeyBytes())
		MLKEMDecapsulate(kp.PrivateKey, ct)
	}
}

// Fuzz testing
func FuzzMLKEMDecapsulate(f *testing.F) {
	kp, _ := GenerateMLKEMKeyPair()
	validCt, _, _ := MLKEMEncapsulate(kp.PublicKeyBytes())

	f.Add(validCt)
	f.Add(make([]byte, MLKEMCiphertextSize))
	f.Add([]byte{})

	f.Fuzz(func(t *testing.T, ct []byte) {
		// Should not panic
		_, _ = MLKEMDecapsulate(kp.PrivateKey, ct)
	})
}
