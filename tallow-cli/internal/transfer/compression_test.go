package transfer

import (
	"bytes"
	"crypto/rand"
	"testing"
)

func TestNewCompressor(t *testing.T) {
	tests := []struct {
		name  string
		level CompressionLevel
	}{
		{"best speed", BestSpeed},
		{"default", DefaultCompression},
		{"best compression", BestCompression},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := NewCompressor(tt.level)
			if c == nil {
				t.Fatal("NewCompressor returned nil")
			}
		})
	}
}

func TestCompressorCompressDecompress(t *testing.T) {
	c := NewCompressor(DefaultCompression)

	tests := []struct {
		name string
		data []byte
	}{
		{"empty", []byte{}},
		{"small", []byte("hello world")},
		{"repetitive", bytes.Repeat([]byte("abcd"), 1000)},
		{"random", randomBytes(t, 1000)},
		{"large", bytes.Repeat([]byte("test data "), 10000)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			compressed, err := c.Compress(tt.data)
			if err != nil {
				t.Fatalf("Compress failed: %v", err)
			}

			decompressed, err := c.Decompress(compressed)
			if err != nil {
				t.Fatalf("Decompress failed: %v", err)
			}

			if !bytes.Equal(decompressed, tt.data) {
				t.Error("Decompressed data doesn't match original")
			}
		})
	}
}

func TestCompressorCompressionRatio(t *testing.T) {
	c := NewCompressor(BestCompression)

	// Highly compressible data
	repetitive := bytes.Repeat([]byte("a"), 10000)
	compressed, _ := c.Compress(repetitive)

	ratio := float64(len(compressed)) / float64(len(repetitive))
	if ratio > 0.1 {
		t.Errorf("Compression ratio too high for repetitive data: %.2f", ratio)
	}

	t.Logf("Repetitive data compression ratio: %.4f", ratio)
}

func TestCompressorRandomDataNoExpansion(t *testing.T) {
	c := NewCompressor(DefaultCompression)

	// Random data doesn't compress well
	random := randomBytes(t, 1000)
	compressed, _ := c.Compress(random)

	// Compressed shouldn't be much larger than original
	maxExpansion := 1.1 // Allow 10% expansion for incompressible data
	ratio := float64(len(compressed)) / float64(len(random))
	if ratio > maxExpansion {
		t.Errorf("Excessive expansion for random data: %.2f", ratio)
	}
}

func TestDecompressInvalidData(t *testing.T) {
	c := NewCompressor(DefaultCompression)

	tests := []struct {
		name string
		data []byte
	}{
		{"random bytes", randomBytes(t, 100)},
		{"truncated", []byte{0x78, 0x9c}}, // zlib header but no data
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := c.Decompress(tt.data)
			if err == nil {
				t.Error("Expected error for invalid compressed data")
			}
		})
	}
}

func TestCompressionLevels(t *testing.T) {
	data := bytes.Repeat([]byte("test data for compression "), 1000)

	levels := []CompressionLevel{BestSpeed, DefaultCompression, BestCompression}
	var sizes []int

	for _, level := range levels {
		c := NewCompressor(level)
		compressed, err := c.Compress(data)
		if err != nil {
			t.Fatalf("Compress at level %d failed: %v", level, err)
		}
		sizes = append(sizes, len(compressed))

		// Verify decompression works
		decompressed, err := c.Decompress(compressed)
		if err != nil {
			t.Fatalf("Decompress at level %d failed: %v", level, err)
		}
		if !bytes.Equal(decompressed, data) {
			t.Errorf("Data mismatch at level %d", level)
		}
	}

	// Best compression should produce smallest output
	if sizes[2] > sizes[0] {
		t.Logf("Warning: BestCompression (%d) not better than BestSpeed (%d)", sizes[2], sizes[0])
	}

	t.Logf("Sizes - BestSpeed: %d, Default: %d, BestCompression: %d", sizes[0], sizes[1], sizes[2])
}

func TestShouldCompress(t *testing.T) {
	tests := []struct {
		name     string
		filename string
		expected bool
	}{
		// Should compress
		{"text file", "document.txt", true},
		{"log file", "app.log", true},
		{"json file", "data.json", true},
		{"xml file", "config.xml", true},
		{"csv file", "data.csv", true},
		{"html file", "index.html", true},
		{"css file", "styles.css", true},
		{"javascript", "app.js", true},

		// Should not compress (already compressed)
		{"zip file", "archive.zip", false},
		{"gzip file", "data.gz", false},
		{"7z file", "archive.7z", false},
		{"rar file", "archive.rar", false},
		{"jpeg image", "photo.jpg", false},
		{"jpeg image 2", "photo.jpeg", false},
		{"png image", "image.png", false},
		{"gif image", "animation.gif", false},
		{"webp image", "image.webp", false},
		{"mp4 video", "video.mp4", false},
		{"mkv video", "movie.mkv", false},
		{"mp3 audio", "song.mp3", false},
		{"aac audio", "audio.aac", false},
		{"flac audio", "music.flac", false},

		// Edge cases
		{"no extension", "README", true},
		{"hidden file", ".gitignore", true},
		{"uppercase", "FILE.TXT", true},
		{"mixed case jpg", "Photo.JPG", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ShouldCompress(tt.filename)
			if result != tt.expected {
				t.Errorf("ShouldCompress(%q) = %v, want %v", tt.filename, result, tt.expected)
			}
		})
	}
}

func TestCompressEmpty(t *testing.T) {
	c := NewCompressor(DefaultCompression)

	compressed, err := c.Compress([]byte{})
	if err != nil {
		t.Fatalf("Compress empty failed: %v", err)
	}

	decompressed, err := c.Decompress(compressed)
	if err != nil {
		t.Fatalf("Decompress empty failed: %v", err)
	}

	if len(decompressed) != 0 {
		t.Errorf("Expected empty result, got %d bytes", len(decompressed))
	}
}

func TestCompressLargeData(t *testing.T) {
	c := NewCompressor(BestSpeed)

	// 10MB of compressible data
	data := bytes.Repeat([]byte("large data chunk "), 625000)

	compressed, err := c.Compress(data)
	if err != nil {
		t.Fatalf("Compress large data failed: %v", err)
	}

	t.Logf("Large data: %d bytes -> %d bytes (%.2f%%)",
		len(data), len(compressed), float64(len(compressed))/float64(len(data))*100)

	decompressed, err := c.Decompress(compressed)
	if err != nil {
		t.Fatalf("Decompress large data failed: %v", err)
	}

	if !bytes.Equal(decompressed, data) {
		t.Error("Large data mismatch after roundtrip")
	}
}

func randomBytes(t *testing.T, n int) []byte {
	t.Helper()
	data := make([]byte, n)
	if _, err := rand.Read(data); err != nil {
		t.Fatalf("Failed to generate random bytes: %v", err)
	}
	return data
}

func BenchmarkCompressBestSpeed(b *testing.B) {
	c := NewCompressor(BestSpeed)
	data := bytes.Repeat([]byte("benchmark data "), 1000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Compress(data)
	}
}

func BenchmarkCompressDefault(b *testing.B) {
	c := NewCompressor(DefaultCompression)
	data := bytes.Repeat([]byte("benchmark data "), 1000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Compress(data)
	}
}

func BenchmarkCompressBestCompression(b *testing.B) {
	c := NewCompressor(BestCompression)
	data := bytes.Repeat([]byte("benchmark data "), 1000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Compress(data)
	}
}

func BenchmarkDecompress(b *testing.B) {
	c := NewCompressor(DefaultCompression)
	data := bytes.Repeat([]byte("benchmark data "), 1000)
	compressed, _ := c.Compress(data)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Decompress(compressed)
	}
}

func BenchmarkCompressLarge(b *testing.B) {
	c := NewCompressor(BestSpeed)
	data := bytes.Repeat([]byte("benchmark "), 100000) // 1MB

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		c.Compress(data)
	}
}
