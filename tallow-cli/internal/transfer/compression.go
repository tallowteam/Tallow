package transfer

import (
	"bytes"
	"compress/gzip"
	"io"
)

// CompressionLevel defines compression levels
type CompressionLevel int

const (
	// NoCompression disables compression
	NoCompression CompressionLevel = gzip.NoCompression
	// BestSpeed provides fastest compression
	BestSpeed CompressionLevel = gzip.BestSpeed
	// BestCompression provides best compression ratio
	BestCompression CompressionLevel = gzip.BestCompression
	// DefaultCompression provides a balance
	DefaultCompression CompressionLevel = gzip.DefaultCompression
)

// Compressor provides gzip compression
type Compressor struct {
	level CompressionLevel
}

// NewCompressor creates a new Compressor
func NewCompressor(level CompressionLevel) *Compressor {
	return &Compressor{level: level}
}

// Compress compresses data using gzip
func (c *Compressor) Compress(data []byte) ([]byte, error) {
	var buf bytes.Buffer

	writer, err := gzip.NewWriterLevel(&buf, int(c.level))
	if err != nil {
		return nil, err
	}

	if _, err := writer.Write(data); err != nil {
		writer.Close()
		return nil, err
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// Decompress decompresses gzip data
func (c *Compressor) Decompress(data []byte) ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	return io.ReadAll(reader)
}

// CompressStream creates a streaming compressor
func CompressStream(w io.Writer, level CompressionLevel) (*gzip.Writer, error) {
	return gzip.NewWriterLevel(w, int(level))
}

// DecompressStream creates a streaming decompressor
func DecompressStream(r io.Reader) (*gzip.Reader, error) {
	return gzip.NewReader(r)
}

// ShouldCompress determines if a file should be compressed based on extension
func ShouldCompress(filename string) bool {
	// Skip already compressed formats
	skipExtensions := map[string]bool{
		".gz":   true,
		".zip":  true,
		".7z":   true,
		".rar":  true,
		".bz2":  true,
		".xz":   true,
		".lz":   true,
		".lzma": true,
		".zst":  true,
		// Compressed media
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
		".mp3":  true,
		".mp4":  true,
		".m4a":  true,
		".m4v":  true,
		".mov":  true,
		".avi":  true,
		".mkv":  true,
		".webm": true,
		".flac": true,
		".aac":  true,
		".ogg":  true,
		".opus": true,
	}

	// Get extension
	ext := ""
	for i := len(filename) - 1; i >= 0; i-- {
		if filename[i] == '.' {
			ext = filename[i:]
			break
		}
	}

	// Convert to lowercase
	extLower := ""
	for _, c := range ext {
		if c >= 'A' && c <= 'Z' {
			extLower += string(c + 32)
		} else {
			extLower += string(c)
		}
	}

	return !skipExtensions[extLower]
}

// CompressChunk compresses a single chunk if beneficial
func CompressChunk(data []byte) ([]byte, bool, error) {
	comp := NewCompressor(BestSpeed)
	compressed, err := comp.Compress(data)
	if err != nil {
		return nil, false, err
	}

	// Only use compression if it actually reduces size
	if len(compressed) < len(data) {
		return compressed, true, nil
	}

	return data, false, nil
}

// DecompressChunk decompresses a chunk if it was compressed
func DecompressChunk(data []byte, wasCompressed bool) ([]byte, error) {
	if !wasCompressed {
		return data, nil
	}

	comp := NewCompressor(DefaultCompression)
	return comp.Decompress(data)
}
