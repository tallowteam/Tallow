package crypto

import (
	"bytes"
	"crypto/rand"
	"testing"
)

func TestNewAESGCMCipher(t *testing.T) {
	tests := []struct {
		name    string
		keyLen  int
		wantErr bool
	}{
		{"valid 32-byte key", 32, false},
		{"invalid 16-byte key", 16, true},
		{"invalid 24-byte key", 24, true},
		{"invalid 31-byte key", 31, true},
		{"invalid 33-byte key", 33, true},
		{"invalid empty key", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key := make([]byte, tt.keyLen)
			rand.Read(key)

			cipher, err := NewAESGCMCipher(key)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewAESGCMCipher() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && cipher == nil {
				t.Error("NewAESGCMCipher() returned nil cipher")
			}
		})
	}
}

func TestAESGCMEncryptDecrypt(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, err := NewAESGCMCipher(key)
	if err != nil {
		t.Fatalf("NewAESGCMCipher failed: %v", err)
	}

	tests := []struct {
		name      string
		plaintext []byte
		aad       []byte
	}{
		{"empty plaintext", []byte{}, nil},
		{"short plaintext", []byte("hello"), nil},
		{"medium plaintext", bytes.Repeat([]byte("a"), 1000), nil},
		{"large plaintext", bytes.Repeat([]byte("b"), 100000), nil},
		{"with AAD", []byte("secret data"), []byte("additional data")},
		{"empty with AAD", []byte{}, []byte("aad only")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ciphertext, err := cipher.Encrypt(tt.plaintext, tt.aad)
			if err != nil {
				t.Fatalf("Encrypt failed: %v", err)
			}

			// Ciphertext should be nonce + ciphertext + tag
			expectedLen := GCMNonceSize + len(tt.plaintext) + GCMTagSize
			if len(ciphertext) != expectedLen {
				t.Errorf("ciphertext len = %v, want %v", len(ciphertext), expectedLen)
			}

			decrypted, err := cipher.Decrypt(ciphertext, tt.aad)
			if err != nil {
				t.Fatalf("Decrypt failed: %v", err)
			}

			if !bytes.Equal(decrypted, tt.plaintext) {
				t.Error("decrypted does not match plaintext")
			}
		})
	}
}

func TestAESGCMDecryptWrongKey(t *testing.T) {
	key1 := make([]byte, AES256KeySize)
	key2 := make([]byte, AES256KeySize)
	rand.Read(key1)
	rand.Read(key2)

	cipher1, _ := NewAESGCMCipher(key1)
	cipher2, _ := NewAESGCMCipher(key2)

	plaintext := []byte("secret message")
	ciphertext, _ := cipher1.Encrypt(plaintext, nil)

	_, err := cipher2.Decrypt(ciphertext, nil)
	if err == nil {
		t.Error("Decrypt with wrong key should fail")
	}
}

func TestAESGCMDecryptWrongAAD(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	plaintext := []byte("secret message")
	aad1 := []byte("correct aad")
	aad2 := []byte("wrong aad")

	ciphertext, _ := cipher.Encrypt(plaintext, aad1)

	_, err := cipher.Decrypt(ciphertext, aad2)
	if err == nil {
		t.Error("Decrypt with wrong AAD should fail")
	}
}

func TestAESGCMDecryptTamperedCiphertext(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	plaintext := []byte("secret message")
	ciphertext, _ := cipher.Encrypt(plaintext, nil)

	// Tamper with ciphertext
	ciphertext[len(ciphertext)-1] ^= 0xff

	_, err := cipher.Decrypt(ciphertext, nil)
	if err == nil {
		t.Error("Decrypt with tampered ciphertext should fail")
	}
}

func TestAESGCMDecryptTruncated(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	tests := []struct {
		name       string
		ciphertext []byte
	}{
		{"empty", []byte{}},
		{"too short", make([]byte, GCMNonceSize)},
		{"missing tag", make([]byte, GCMNonceSize+5)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := cipher.Decrypt(tt.ciphertext, nil)
			if err == nil {
				t.Error("Decrypt with truncated ciphertext should fail")
			}
		})
	}
}

func TestAESGCMNonceUniqueness(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	plaintext := []byte("same message")

	// Encrypt same plaintext multiple times
	nonces := make(map[string]bool)
	for i := 0; i < 100; i++ {
		ciphertext, _ := cipher.Encrypt(plaintext, nil)
		nonce := string(ciphertext[:GCMNonceSize])
		if nonces[nonce] {
			t.Error("Nonce reuse detected")
		}
		nonces[nonce] = true
	}
}

func TestAESGCMEncryptWithNonce(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	nonce := make([]byte, GCMNonceSize)
	rand.Read(nonce)

	plaintext := []byte("test message")

	ciphertext := cipher.EncryptWithNonce(nonce, plaintext, nil)

	// Should be plaintext + tag (no nonce prepended)
	expectedLen := len(plaintext) + GCMTagSize
	if len(ciphertext) != expectedLen {
		t.Errorf("ciphertext len = %v, want %v", len(ciphertext), expectedLen)
	}

	decrypted, err := cipher.DecryptWithNonce(nonce, ciphertext, nil)
	if err != nil {
		t.Fatalf("DecryptWithNonce failed: %v", err)
	}

	if !bytes.Equal(decrypted, plaintext) {
		t.Error("decrypted does not match plaintext")
	}
}

func TestAESGCMDecryptWithNonceWrongNonce(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	nonce1 := make([]byte, GCMNonceSize)
	nonce2 := make([]byte, GCMNonceSize)
	rand.Read(nonce1)
	rand.Read(nonce2)

	plaintext := []byte("test message")
	ciphertext := cipher.EncryptWithNonce(nonce1, plaintext, nil)

	_, err := cipher.DecryptWithNonce(nonce2, ciphertext, nil)
	if err == nil {
		t.Error("DecryptWithNonce with wrong nonce should fail")
	}
}

func TestIncrementNonce(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		expected []byte
	}{
		{
			"simple increment",
			[]byte{0, 0, 0, 0},
			[]byte{0, 0, 0, 1},
		},
		{
			"carry over",
			[]byte{0, 0, 0, 255},
			[]byte{0, 0, 1, 0},
		},
		{
			"multiple carry",
			[]byte{0, 0, 255, 255},
			[]byte{0, 1, 0, 0},
		},
		{
			"overflow",
			[]byte{255, 255, 255, 255},
			[]byte{0, 0, 0, 0},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			nonce := make([]byte, len(tt.input))
			copy(nonce, tt.input)

			IncrementNonce(nonce)

			if !bytes.Equal(nonce, tt.expected) {
				t.Errorf("IncrementNonce() = %v, want %v", nonce, tt.expected)
			}
		})
	}
}

func TestGenerateAESKey(t *testing.T) {
	key, err := GenerateAESKey()
	if err != nil {
		t.Fatalf("GenerateAESKey failed: %v", err)
	}

	if len(key) != AES256KeySize {
		t.Errorf("key len = %v, want %v", len(key), AES256KeySize)
	}

	// Verify key is usable
	cipher, err := NewAESGCMCipher(key)
	if err != nil {
		t.Fatalf("Generated key not usable: %v", err)
	}

	// Encrypt and decrypt
	plaintext := []byte("test")
	ciphertext, _ := cipher.Encrypt(plaintext, nil)
	decrypted, _ := cipher.Decrypt(ciphertext, nil)

	if !bytes.Equal(decrypted, plaintext) {
		t.Error("Generated key encryption/decryption failed")
	}
}

func TestGenerateAESKeyUniqueness(t *testing.T) {
	keys := make(map[string]bool)
	for i := 0; i < 100; i++ {
		key, err := GenerateAESKey()
		if err != nil {
			t.Fatalf("GenerateAESKey failed: %v", err)
		}

		keyStr := string(key)
		if keys[keyStr] {
			t.Error("Duplicate key generated")
		}
		keys[keyStr] = true
	}
}

func TestStreamEncryptorDecryptor(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	encryptor, err := NewStreamEncryptor(key)
	if err != nil {
		t.Fatalf("NewStreamEncryptor failed: %v", err)
	}

	initialNonce := encryptor.InitialNonce()
	if len(initialNonce) != GCMNonceSize {
		t.Errorf("InitialNonce len = %v, want %v", len(initialNonce), GCMNonceSize)
	}

	decryptor, err := NewStreamDecryptor(key, initialNonce)
	if err != nil {
		t.Fatalf("NewStreamDecryptor failed: %v", err)
	}

	// Test multiple chunks
	chunks := [][]byte{
		[]byte("chunk zero"),
		[]byte("chunk one with more data"),
		[]byte("chunk two"),
		bytes.Repeat([]byte("x"), 10000),
	}

	for i, chunk := range chunks {
		encrypted := encryptor.EncryptChunk(chunk, uint64(i))
		decrypted, err := decryptor.DecryptChunk(encrypted, uint64(i))
		if err != nil {
			t.Fatalf("DecryptChunk %d failed: %v", i, err)
		}

		if !bytes.Equal(decrypted, chunk) {
			t.Errorf("chunk %d mismatch", i)
		}
	}
}

func TestStreamEncryptorChunkIndexUniqueness(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	encryptor, _ := NewStreamEncryptor(key)

	plaintext := []byte("same content")

	// Same plaintext with different indices should produce different ciphertext
	ct0 := encryptor.EncryptChunk(plaintext, 0)
	ct1 := encryptor.EncryptChunk(plaintext, 1)

	if bytes.Equal(ct0, ct1) {
		t.Error("Different chunk indices should produce different ciphertext")
	}
}

func TestStreamDecryptorWrongIndex(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	encryptor, _ := NewStreamEncryptor(key)
	decryptor, _ := NewStreamDecryptor(key, encryptor.InitialNonce())

	plaintext := []byte("test chunk")
	encrypted := encryptor.EncryptChunk(plaintext, 0)

	// Try to decrypt with wrong index
	_, err := decryptor.DecryptChunk(encrypted, 1)
	if err == nil {
		t.Error("DecryptChunk with wrong index should fail")
	}
}

func TestNonceSizeAndOverhead(t *testing.T) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)

	cipher, _ := NewAESGCMCipher(key)

	if cipher.NonceSize() != GCMNonceSize {
		t.Errorf("NonceSize() = %v, want %v", cipher.NonceSize(), GCMNonceSize)
	}

	if cipher.Overhead() != GCMTagSize {
		t.Errorf("Overhead() = %v, want %v", cipher.Overhead(), GCMTagSize)
	}
}

func BenchmarkAESGCMEncrypt(b *testing.B) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)
	cipher, _ := NewAESGCMCipher(key)

	plaintext := make([]byte, 1024)
	rand.Read(plaintext)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cipher.Encrypt(plaintext, nil)
	}
}

func BenchmarkAESGCMDecrypt(b *testing.B) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)
	cipher, _ := NewAESGCMCipher(key)

	plaintext := make([]byte, 1024)
	rand.Read(plaintext)
	ciphertext, _ := cipher.Encrypt(plaintext, nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cipher.Decrypt(ciphertext, nil)
	}
}

func BenchmarkStreamEncrypt(b *testing.B) {
	key := make([]byte, AES256KeySize)
	rand.Read(key)
	encryptor, _ := NewStreamEncryptor(key)

	plaintext := make([]byte, 65536) // 64KB chunk
	rand.Read(plaintext)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		encryptor.EncryptChunk(plaintext, uint64(i))
	}
}
