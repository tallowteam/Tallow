package crypto

import (
	"bytes"
	"crypto/rand"
	"io"
	"strings"
	"testing"
)

func TestBlake3Hash(t *testing.T) {
	tests := []struct {
		name     string
		input    []byte
		wantLen  int
	}{
		{
			name:    "empty input",
			input:   []byte{},
			wantLen: 32,
		},
		{
			name:    "short input",
			input:   []byte("hello"),
			wantLen: 32,
		},
		{
			name:    "long input",
			input:   bytes.Repeat([]byte("a"), 10000),
			wantLen: 32,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash := Blake3Hash(tt.input)
			if len(hash) != tt.wantLen {
				t.Errorf("Blake3Hash() len = %v, want %v", len(hash), tt.wantLen)
			}
		})
	}
}

func TestBlake3HashDeterministic(t *testing.T) {
	input := []byte("test data for hashing")

	hash1 := Blake3Hash(input)
	hash2 := Blake3Hash(input)

	if !bytes.Equal(hash1, hash2) {
		t.Error("Blake3Hash() should be deterministic")
	}
}

func TestBlake3HashUnique(t *testing.T) {
	input1 := []byte("input one")
	input2 := []byte("input two")

	hash1 := Blake3Hash(input1)
	hash2 := Blake3Hash(input2)

	if bytes.Equal(hash1, hash2) {
		t.Error("Blake3Hash() different inputs should produce different hashes")
	}
}

func TestBlake3HashSize(t *testing.T) {
	tests := []struct {
		name string
		size int
	}{
		{"16 bytes", 16},
		{"32 bytes", 32},
		{"64 bytes", 64},
		{"128 bytes", 128},
	}

	input := []byte("test input")
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash := Blake3HashSize(input, tt.size)
			if len(hash) != tt.size {
				t.Errorf("Blake3HashSize() len = %v, want %v", len(hash), tt.size)
			}
		})
	}
}

func TestBlake3DeriveKey(t *testing.T) {
	context := "test-context-v1"
	material := []byte("key material")

	// Test different sizes
	sizes := []int{16, 32, 64}
	for _, size := range sizes {
		key := Blake3DeriveKey(context, material, size)
		if len(key) != size {
			t.Errorf("Blake3DeriveKey() len = %v, want %v", len(key), size)
		}
	}
}

func TestBlake3DeriveKeyDeterministic(t *testing.T) {
	context := "test-context"
	material := []byte("key material")

	key1 := Blake3DeriveKey(context, material, 32)
	key2 := Blake3DeriveKey(context, material, 32)

	if !bytes.Equal(key1, key2) {
		t.Error("Blake3DeriveKey() should be deterministic")
	}
}

func TestBlake3DeriveKeyContextSeparation(t *testing.T) {
	material := []byte("same material")

	key1 := Blake3DeriveKey("context-one", material, 32)
	key2 := Blake3DeriveKey("context-two", material, 32)

	if bytes.Equal(key1, key2) {
		t.Error("Blake3DeriveKey() different contexts should produce different keys")
	}
}

func TestBlake3MAC(t *testing.T) {
	key := make([]byte, 32)
	rand.Read(key)
	message := []byte("message to authenticate")

	mac := Blake3MAC(key, message)
	if len(mac) != 32 {
		t.Errorf("Blake3MAC() len = %v, want 32", len(mac))
	}
}

func TestBlake3MACDeterministic(t *testing.T) {
	key := make([]byte, 32)
	rand.Read(key)
	message := []byte("message")

	mac1 := Blake3MAC(key, message)
	mac2 := Blake3MAC(key, message)

	if !bytes.Equal(mac1, mac2) {
		t.Error("Blake3MAC() should be deterministic")
	}
}

func TestBlake3MACKeyDependence(t *testing.T) {
	key1 := make([]byte, 32)
	key2 := make([]byte, 32)
	rand.Read(key1)
	rand.Read(key2)

	message := []byte("message")

	mac1 := Blake3MAC(key1, message)
	mac2 := Blake3MAC(key2, message)

	if bytes.Equal(mac1, mac2) {
		t.Error("Blake3MAC() different keys should produce different MACs")
	}
}

func TestBlake3Reader(t *testing.T) {
	data := []byte("test data for streaming hash")
	reader := NewBlake3Reader(bytes.NewReader(data))

	// Read all data
	buf := make([]byte, len(data))
	n, err := io.ReadFull(reader, buf)
	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}
	if n != len(data) {
		t.Errorf("Read() n = %v, want %v", n, len(data))
	}

	// Verify data passed through correctly
	if !bytes.Equal(buf, data) {
		t.Error("Blake3Reader should pass through data unchanged")
	}

	// Check hash
	hash := reader.Sum()
	expectedHash := Blake3Hash(data)
	if !bytes.Equal(hash, expectedHash) {
		t.Error("Blake3Reader hash mismatch")
	}
}

func TestBlake3ReaderChunked(t *testing.T) {
	data := bytes.Repeat([]byte("chunk"), 1000)
	reader := NewBlake3Reader(bytes.NewReader(data))

	// Read in small chunks
	var result []byte
	buf := make([]byte, 128)
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			result = append(result, buf[:n]...)
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Read failed: %v", err)
		}
	}

	// Verify hash matches
	hash := reader.Sum()
	expectedHash := Blake3Hash(data)
	if !bytes.Equal(hash, expectedHash) {
		t.Error("Blake3Reader chunked hash mismatch")
	}
}

func TestBlake3Writer(t *testing.T) {
	data := []byte("test data for streaming hash")
	var buf bytes.Buffer
	writer := NewBlake3Writer(&buf)

	// Write data
	n, err := writer.Write(data)
	if err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if n != len(data) {
		t.Errorf("Write() n = %v, want %v", n, len(data))
	}

	// Verify data passed through correctly
	if !bytes.Equal(buf.Bytes(), data) {
		t.Error("Blake3Writer should pass through data unchanged")
	}

	// Check hash
	hash := writer.Sum()
	expectedHash := Blake3Hash(data)
	if !bytes.Equal(hash, expectedHash) {
		t.Error("Blake3Writer hash mismatch")
	}
}

func TestHashFile(t *testing.T) {
	data := []byte("file content for hashing")
	reader := strings.NewReader(string(data))

	hash, err := HashFile(reader)
	if err != nil {
		t.Fatalf("HashFile failed: %v", err)
	}

	expectedHash := Blake3Hash(data)
	if !bytes.Equal(hash, expectedHash) {
		t.Error("HashFile hash mismatch")
	}
}

func TestHashFileLarge(t *testing.T) {
	// Test with 1MB of data
	data := make([]byte, 1024*1024)
	rand.Read(data)
	reader := bytes.NewReader(data)

	hash, err := HashFile(reader)
	if err != nil {
		t.Fatalf("HashFile failed: %v", err)
	}

	if len(hash) != 32 {
		t.Errorf("HashFile() len = %v, want 32", len(hash))
	}
}

func BenchmarkBlake3Hash(b *testing.B) {
	data := make([]byte, 1024)
	rand.Read(data)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Blake3Hash(data)
	}
}

func BenchmarkBlake3HashLarge(b *testing.B) {
	data := make([]byte, 1024*1024) // 1MB
	rand.Read(data)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Blake3Hash(data)
	}
}

func BenchmarkBlake3DeriveKey(b *testing.B) {
	material := make([]byte, 64)
	rand.Read(material)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Blake3DeriveKey("bench-context", material, 32)
	}
}

func BenchmarkBlake3MAC(b *testing.B) {
	key := make([]byte, 32)
	message := make([]byte, 1024)
	rand.Read(key)
	rand.Read(message)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		Blake3MAC(key, message)
	}
}
