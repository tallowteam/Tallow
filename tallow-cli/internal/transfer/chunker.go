// Package transfer implements file transfer logic.
package transfer

import (
	"errors"
	"io"
	"os"
)

// Default chunk size: 64 KB
const DefaultChunkSize = 64 * 1024

var (
	// ErrChunkOutOfRange indicates an invalid chunk index
	ErrChunkOutOfRange = errors.New("chunk index out of range")
	// ErrInvalidChunkSize indicates an invalid chunk size
	ErrInvalidChunkSize = errors.New("invalid chunk size")
)

// Chunker provides chunked file reading
type Chunker struct {
	file      *os.File
	fileSize  int64
	chunkSize int64
	numChunks uint32
	current   uint32
}

// NewChunker creates a new Chunker for a file
func NewChunker(path string, chunkSize int) (*Chunker, error) {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}

	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	stat, err := file.Stat()
	if err != nil {
		file.Close()
		return nil, err
	}

	fileSize := stat.Size()
	numChunks := uint32((fileSize + int64(chunkSize) - 1) / int64(chunkSize))
	if fileSize == 0 {
		numChunks = 1 // At least one chunk for empty files
	}

	return &Chunker{
		file:      file,
		fileSize:  fileSize,
		chunkSize: int64(chunkSize),
		numChunks: numChunks,
		current:   0,
	}, nil
}

// NewChunkerFromReader creates a Chunker from an io.Reader (must know size)
func NewChunkerFromReader(r io.ReadSeeker, size int64, chunkSize int) (*Chunker, error) {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}

	numChunks := uint32((size + int64(chunkSize) - 1) / int64(chunkSize))
	if size == 0 {
		numChunks = 1
	}

	// Wrap reader in a File-like interface
	f, ok := r.(*os.File)
	if !ok {
		return nil, errors.New("reader must be a file")
	}

	return &Chunker{
		file:      f,
		fileSize:  size,
		chunkSize: int64(chunkSize),
		numChunks: numChunks,
		current:   0,
	}, nil
}

// FileSize returns the total file size
func (c *Chunker) FileSize() int64 {
	return c.fileSize
}

// ChunkSize returns the chunk size
func (c *Chunker) ChunkSize() int {
	return int(c.chunkSize)
}

// NumChunks returns the total number of chunks
func (c *Chunker) NumChunks() uint32 {
	return c.numChunks
}

// ReadChunk reads a specific chunk by index
func (c *Chunker) ReadChunk(index uint32) ([]byte, error) {
	if index >= c.numChunks {
		return nil, ErrChunkOutOfRange
	}

	offset := int64(index) * c.chunkSize
	if _, err := c.file.Seek(offset, io.SeekStart); err != nil {
		return nil, err
	}

	// Calculate chunk size (last chunk may be smaller)
	size := c.chunkSize
	if offset+size > c.fileSize {
		size = c.fileSize - offset
	}

	if size <= 0 {
		// Empty file case
		return []byte{}, nil
	}

	buf := make([]byte, size)
	n, err := io.ReadFull(c.file, buf)
	if err != nil && err != io.EOF && err != io.ErrUnexpectedEOF {
		return nil, err
	}

	return buf[:n], nil
}

// Next reads the next chunk
func (c *Chunker) Next() ([]byte, uint32, error) {
	if c.current >= c.numChunks {
		return nil, 0, io.EOF
	}

	chunk, err := c.ReadChunk(c.current)
	if err != nil {
		return nil, 0, err
	}

	index := c.current
	c.current++
	return chunk, index, nil
}

// Reset resets the chunker to the beginning
func (c *Chunker) Reset() error {
	c.current = 0
	_, err := c.file.Seek(0, io.SeekStart)
	return err
}

// Close closes the underlying file
func (c *Chunker) Close() error {
	return c.file.Close()
}

// ChunkWriter reassembles chunks into a file
type ChunkWriter struct {
	file      *os.File
	chunkSize int64
	received  []bool
	numChunks uint32
}

// NewChunkWriter creates a new ChunkWriter
func NewChunkWriter(path string, numChunks uint32, chunkSize int) (*ChunkWriter, error) {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}

	file, err := os.Create(path)
	if err != nil {
		return nil, err
	}

	return &ChunkWriter{
		file:      file,
		chunkSize: int64(chunkSize),
		received:  make([]bool, numChunks),
		numChunks: numChunks,
	}, nil
}

// WriteChunk writes a chunk at the specified index
func (w *ChunkWriter) WriteChunk(index uint32, data []byte) error {
	if index >= w.numChunks {
		return ErrChunkOutOfRange
	}

	offset := int64(index) * w.chunkSize
	if _, err := w.file.Seek(offset, io.SeekStart); err != nil {
		return err
	}

	if _, err := w.file.Write(data); err != nil {
		return err
	}

	w.received[index] = true
	return nil
}

// MissingChunks returns a list of missing chunk indices
func (w *ChunkWriter) MissingChunks() []uint32 {
	missing := make([]uint32, 0)
	for i, received := range w.received {
		if !received {
			missing = append(missing, uint32(i))
		}
	}
	return missing
}

// IsComplete returns true if all chunks have been received
func (w *ChunkWriter) IsComplete() bool {
	for _, received := range w.received {
		if !received {
			return false
		}
	}
	return true
}

// Progress returns the completion percentage (0-100)
func (w *ChunkWriter) Progress() float64 {
	count := 0
	for _, received := range w.received {
		if received {
			count++
		}
	}
	return float64(count) / float64(len(w.received)) * 100
}

// Truncate truncates the file to the specified size
func (w *ChunkWriter) Truncate(size int64) error {
	return w.file.Truncate(size)
}

// Close closes the file
func (w *ChunkWriter) Close() error {
	return w.file.Close()
}

// Path returns the file path
func (w *ChunkWriter) Path() string {
	return w.file.Name()
}
