// Package crypto provides cryptographic primitives for tallow.
package crypto

import (
	"io"

	"lukechampine.com/blake3"
)

// Blake3Hash computes a BLAKE3 hash of the given data
func Blake3Hash(data []byte) []byte {
	h := blake3.Sum256(data)
	return h[:]
}

// Blake3HashSize returns a BLAKE3 hash with custom size
func Blake3HashSize(data []byte, size int) []byte {
	h := blake3.New(size, nil)
	h.Write(data)
	return h.Sum(nil)
}

// Blake3DeriveKey derives a key using BLAKE3's key derivation
func Blake3DeriveKey(context string, material []byte, size int) []byte {
	h := blake3.New(size, nil)
	// Write context as domain separator
	h.Write([]byte(context))
	h.Write(material)
	return h.Sum(nil)
}

// Blake3MAC creates a keyed MAC using BLAKE3
func Blake3MAC(key, message []byte) []byte {
	h := blake3.New(32, key)
	h.Write(message)
	return h.Sum(nil)
}

// Blake3Reader creates a streaming BLAKE3 hasher
type Blake3Reader struct {
	hasher *blake3.Hasher
	reader io.Reader
}

// NewBlake3Reader creates a new streaming BLAKE3 hasher
func NewBlake3Reader(r io.Reader) *Blake3Reader {
	return &Blake3Reader{
		hasher: blake3.New(32, nil),
		reader: r,
	}
}

// Read implements io.Reader, hashing data as it passes through
func (b *Blake3Reader) Read(p []byte) (n int, err error) {
	n, err = b.reader.Read(p)
	if n > 0 {
		b.hasher.Write(p[:n])
	}
	return n, err
}

// Sum returns the current hash
func (b *Blake3Reader) Sum() []byte {
	return b.hasher.Sum(nil)
}

// Blake3Writer creates a streaming BLAKE3 hasher for writers
type Blake3Writer struct {
	hasher *blake3.Hasher
	writer io.Writer
}

// NewBlake3Writer creates a new streaming BLAKE3 hasher
func NewBlake3Writer(w io.Writer) *Blake3Writer {
	return &Blake3Writer{
		hasher: blake3.New(32, nil),
		writer: w,
	}
}

// Write implements io.Writer, hashing data as it passes through
func (b *Blake3Writer) Write(p []byte) (n int, err error) {
	n, err = b.writer.Write(p)
	if n > 0 {
		b.hasher.Write(p[:n])
	}
	return n, err
}

// Sum returns the current hash
func (b *Blake3Writer) Sum() []byte {
	return b.hasher.Sum(nil)
}

// HashFile hashes a file using BLAKE3
func HashFile(r io.Reader) ([]byte, error) {
	h := blake3.New(32, nil)
	if _, err := io.Copy(h, r); err != nil {
		return nil, err
	}
	return h.Sum(nil), nil
}
