package transfer

import (
	"bytes"
	"io"
	"os"
	"path/filepath"
	"testing"
)

func createChunkerTestFile(t *testing.T, size int) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "testfile.bin")

	data := make([]byte, size)
	for i := range data {
		data[i] = byte(i % 256)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	return path
}

func TestNewChunker(t *testing.T) {
	path := createChunkerTestFile(t, 1000)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	if chunker.FileSize() != 1000 {
		t.Errorf("FileSize() = %v, want 1000", chunker.FileSize())
	}

	if chunker.ChunkSize() != 100 {
		t.Errorf("ChunkSize() = %v, want 100", chunker.ChunkSize())
	}

	if chunker.NumChunks() != 10 {
		t.Errorf("NumChunks() = %v, want 10", chunker.NumChunks())
	}
}

func TestNewChunkerDefaultChunkSize(t *testing.T) {
	path := createChunkerTestFile(t, 100)

	chunker, err := NewChunker(path, 0)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	if chunker.ChunkSize() != DefaultChunkSize {
		t.Errorf("ChunkSize() = %v, want %v", chunker.ChunkSize(), DefaultChunkSize)
	}
}

func TestNewChunkerNonExistentFile(t *testing.T) {
	_, err := NewChunker("/nonexistent/path/file.bin", 100)
	if err == nil {
		t.Error("Expected error for non-existent file")
	}
}

func TestNewChunkerEmptyFile(t *testing.T) {
	path := createChunkerTestFile(t, 0)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	if chunker.FileSize() != 0 {
		t.Errorf("FileSize() = %v, want 0", chunker.FileSize())
	}

	// Empty file should have at least 1 chunk
	if chunker.NumChunks() != 1 {
		t.Errorf("NumChunks() = %v, want 1", chunker.NumChunks())
	}
}

func TestChunkerReadChunk(t *testing.T) {
	path := createChunkerTestFile(t, 250)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	// Read first chunk
	chunk0, err := chunker.ReadChunk(0)
	if err != nil {
		t.Fatalf("ReadChunk(0) failed: %v", err)
	}
	if len(chunk0) != 100 {
		t.Errorf("chunk 0 len = %v, want 100", len(chunk0))
	}

	// Read second chunk
	chunk1, err := chunker.ReadChunk(1)
	if err != nil {
		t.Fatalf("ReadChunk(1) failed: %v", err)
	}
	if len(chunk1) != 100 {
		t.Errorf("chunk 1 len = %v, want 100", len(chunk1))
	}

	// Read last chunk (should be smaller)
	chunk2, err := chunker.ReadChunk(2)
	if err != nil {
		t.Fatalf("ReadChunk(2) failed: %v", err)
	}
	if len(chunk2) != 50 {
		t.Errorf("chunk 2 len = %v, want 50", len(chunk2))
	}
}

func TestChunkerReadChunkOutOfRange(t *testing.T) {
	path := createChunkerTestFile(t, 100)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	_, err = chunker.ReadChunk(1)
	if err != ErrChunkOutOfRange {
		t.Errorf("Expected ErrChunkOutOfRange, got %v", err)
	}

	_, err = chunker.ReadChunk(100)
	if err != ErrChunkOutOfRange {
		t.Errorf("Expected ErrChunkOutOfRange, got %v", err)
	}
}

func TestChunkerNext(t *testing.T) {
	path := createChunkerTestFile(t, 250)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	// Read all chunks
	var allData []byte
	for i := 0; ; i++ {
		chunk, idx, err := chunker.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Next() failed: %v", err)
		}

		if int(idx) != i {
			t.Errorf("chunk index = %v, want %v", idx, i)
		}

		allData = append(allData, chunk...)
	}

	if len(allData) != 250 {
		t.Errorf("total data len = %v, want 250", len(allData))
	}
}

func TestChunkerNextEmptyFile(t *testing.T) {
	path := createChunkerTestFile(t, 0)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	// First read should return empty chunk
	chunk, idx, err := chunker.Next()
	if err != nil {
		t.Fatalf("Next() failed: %v", err)
	}
	if idx != 0 {
		t.Errorf("chunk index = %v, want 0", idx)
	}
	if len(chunk) != 0 {
		t.Errorf("chunk len = %v, want 0", len(chunk))
	}

	// Second read should return EOF
	_, _, err = chunker.Next()
	if err != io.EOF {
		t.Errorf("Expected EOF, got %v", err)
	}
}

func TestChunkerReset(t *testing.T) {
	path := createChunkerTestFile(t, 200)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	// Read first chunk
	chunk1a, _, _ := chunker.Next()

	// Reset
	if err := chunker.Reset(); err != nil {
		t.Fatalf("Reset failed: %v", err)
	}

	// Read first chunk again
	chunk1b, idx, err := chunker.Next()
	if err != nil {
		t.Fatalf("Next() failed: %v", err)
	}

	if idx != 0 {
		t.Errorf("After reset, index = %v, want 0", idx)
	}

	if !bytes.Equal(chunk1a, chunk1b) {
		t.Error("Chunks after reset should match")
	}
}

func TestChunkerDataIntegrity(t *testing.T) {
	size := 1234
	path := createChunkerTestFile(t, size)

	// Read original file
	original, _ := os.ReadFile(path)

	chunker, err := NewChunker(path, 100)
	if err != nil {
		t.Fatalf("NewChunker failed: %v", err)
	}
	defer chunker.Close()

	// Reconstruct from chunks
	var reconstructed []byte
	for {
		chunk, _, err := chunker.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Next() failed: %v", err)
		}
		reconstructed = append(reconstructed, chunk...)
	}

	if !bytes.Equal(original, reconstructed) {
		t.Error("Reconstructed data doesn't match original")
	}
}

func TestNewChunkWriter(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, err := NewChunkWriter(path, 5, 100)
	if err != nil {
		t.Fatalf("NewChunkWriter failed: %v", err)
	}
	defer writer.Close()

	if writer.Path() != path {
		t.Errorf("Path() = %v, want %v", writer.Path(), path)
	}
}

func TestChunkWriterWriteChunk(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, err := NewChunkWriter(path, 3, 100)
	if err != nil {
		t.Fatalf("NewChunkWriter failed: %v", err)
	}

	// Write chunks
	chunk0 := bytes.Repeat([]byte{0}, 100)
	chunk1 := bytes.Repeat([]byte{1}, 100)
	chunk2 := bytes.Repeat([]byte{2}, 50)

	if err := writer.WriteChunk(0, chunk0); err != nil {
		t.Fatalf("WriteChunk(0) failed: %v", err)
	}

	if err := writer.WriteChunk(1, chunk1); err != nil {
		t.Fatalf("WriteChunk(1) failed: %v", err)
	}

	if err := writer.WriteChunk(2, chunk2); err != nil {
		t.Fatalf("WriteChunk(2) failed: %v", err)
	}

	writer.Close()

	// Verify file contents
	data, _ := os.ReadFile(path)
	expected := append(append(chunk0, chunk1...), chunk2...)
	if !bytes.Equal(data, expected) {
		t.Error("Written data doesn't match expected")
	}
}

func TestChunkWriterWriteChunkOutOfOrder(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, err := NewChunkWriter(path, 3, 100)
	if err != nil {
		t.Fatalf("NewChunkWriter failed: %v", err)
	}

	// Write chunks out of order
	chunk2 := bytes.Repeat([]byte{2}, 50)
	chunk0 := bytes.Repeat([]byte{0}, 100)
	chunk1 := bytes.Repeat([]byte{1}, 100)

	if err := writer.WriteChunk(2, chunk2); err != nil {
		t.Fatalf("WriteChunk(2) failed: %v", err)
	}

	if err := writer.WriteChunk(0, chunk0); err != nil {
		t.Fatalf("WriteChunk(0) failed: %v", err)
	}

	if err := writer.WriteChunk(1, chunk1); err != nil {
		t.Fatalf("WriteChunk(1) failed: %v", err)
	}

	writer.Close()

	// Verify file contents
	data, _ := os.ReadFile(path)
	expected := append(append(chunk0, chunk1...), chunk2...)
	if !bytes.Equal(data[:len(expected)], expected) {
		t.Error("Written data doesn't match expected")
	}
}

func TestChunkWriterWriteChunkOutOfRange(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, _ := NewChunkWriter(path, 3, 100)
	defer writer.Close()

	err := writer.WriteChunk(3, []byte{})
	if err != ErrChunkOutOfRange {
		t.Errorf("Expected ErrChunkOutOfRange, got %v", err)
	}

	err = writer.WriteChunk(100, []byte{})
	if err != ErrChunkOutOfRange {
		t.Errorf("Expected ErrChunkOutOfRange, got %v", err)
	}
}

func TestChunkWriterMissingChunks(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, _ := NewChunkWriter(path, 5, 100)
	defer writer.Close()

	// Write some chunks
	writer.WriteChunk(0, []byte{})
	writer.WriteChunk(2, []byte{})
	writer.WriteChunk(4, []byte{})

	missing := writer.MissingChunks()
	expected := []uint32{1, 3}

	if len(missing) != len(expected) {
		t.Errorf("MissingChunks() len = %v, want %v", len(missing), len(expected))
	}

	for i, idx := range missing {
		if idx != expected[i] {
			t.Errorf("MissingChunks()[%d] = %v, want %v", i, idx, expected[i])
		}
	}
}

func TestChunkWriterIsComplete(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, _ := NewChunkWriter(path, 3, 100)
	defer writer.Close()

	if writer.IsComplete() {
		t.Error("IsComplete() should be false initially")
	}

	writer.WriteChunk(0, []byte{})
	if writer.IsComplete() {
		t.Error("IsComplete() should be false with 1/3 chunks")
	}

	writer.WriteChunk(1, []byte{})
	if writer.IsComplete() {
		t.Error("IsComplete() should be false with 2/3 chunks")
	}

	writer.WriteChunk(2, []byte{})
	if !writer.IsComplete() {
		t.Error("IsComplete() should be true with 3/3 chunks")
	}
}

func TestChunkWriterProgress(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, _ := NewChunkWriter(path, 4, 100)
	defer writer.Close()

	if writer.Progress() != 0 {
		t.Errorf("Progress() = %v, want 0", writer.Progress())
	}

	writer.WriteChunk(0, []byte{})
	if writer.Progress() != 25 {
		t.Errorf("Progress() = %v, want 25", writer.Progress())
	}

	writer.WriteChunk(1, []byte{})
	if writer.Progress() != 50 {
		t.Errorf("Progress() = %v, want 50", writer.Progress())
	}

	writer.WriteChunk(2, []byte{})
	if writer.Progress() != 75 {
		t.Errorf("Progress() = %v, want 75", writer.Progress())
	}

	writer.WriteChunk(3, []byte{})
	if writer.Progress() != 100 {
		t.Errorf("Progress() = %v, want 100", writer.Progress())
	}
}

func TestChunkWriterTruncate(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "output.bin")

	writer, _ := NewChunkWriter(path, 2, 100)

	// Write full chunks
	writer.WriteChunk(0, bytes.Repeat([]byte{1}, 100))
	writer.WriteChunk(1, bytes.Repeat([]byte{2}, 100))

	// Truncate to actual size
	if err := writer.Truncate(150); err != nil {
		t.Fatalf("Truncate failed: %v", err)
	}

	writer.Close()

	// Check file size
	stat, _ := os.Stat(path)
	if stat.Size() != 150 {
		t.Errorf("File size = %v, want 150", stat.Size())
	}
}

func TestChunkerWriterRoundtrip(t *testing.T) {
	// Create source file
	srcPath := createChunkerTestFile(t, 1234)
	srcData, _ := os.ReadFile(srcPath)

	// Read with chunker
	chunker, _ := NewChunker(srcPath, 100)
	defer chunker.Close()

	// Write with chunk writer
	dir := t.TempDir()
	dstPath := filepath.Join(dir, "output.bin")
	writer, _ := NewChunkWriter(dstPath, chunker.NumChunks(), chunker.ChunkSize())

	for {
		chunk, idx, err := chunker.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Next() failed: %v", err)
		}

		if err := writer.WriteChunk(idx, chunk); err != nil {
			t.Fatalf("WriteChunk failed: %v", err)
		}
	}

	writer.Truncate(chunker.FileSize())
	writer.Close()

	// Compare files
	dstData, _ := os.ReadFile(dstPath)
	if !bytes.Equal(srcData, dstData) {
		t.Error("Roundtrip data mismatch")
	}
}

func BenchmarkChunkerRead(b *testing.B) {
	dir := b.TempDir()
	path := filepath.Join(dir, "testfile.bin")

	// Create 10MB file
	data := make([]byte, 10*1024*1024)
	os.WriteFile(path, data, 0644)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		chunker, _ := NewChunker(path, 65536)
		for {
			_, _, err := chunker.Next()
			if err == io.EOF {
				break
			}
		}
		chunker.Close()
	}
}

func BenchmarkChunkWriter(b *testing.B) {
	chunk := make([]byte, 65536)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		dir := b.TempDir()
		path := filepath.Join(dir, "output.bin")
		writer, _ := NewChunkWriter(path, 100, 65536)
		for j := uint32(0); j < 100; j++ {
			writer.WriteChunk(j, chunk)
		}
		writer.Close()
	}
}
