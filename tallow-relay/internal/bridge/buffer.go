package bridge

import (
	"io"
	"sync"
)

// BufferedCopier provides efficient buffered copying between readers and writers
type BufferedCopier struct {
	bufferSize int
	pool       *sync.Pool
}

// NewBufferedCopier creates a new buffered copier with the given buffer size
func NewBufferedCopier(bufferSize int) *BufferedCopier {
	if bufferSize <= 0 {
		bufferSize = 32 * 1024 // 32KB default
	}

	return &BufferedCopier{
		bufferSize: bufferSize,
		pool: &sync.Pool{
			New: func() interface{} {
				buf := make([]byte, bufferSize)
				return &buf
			},
		},
	}
}

// Copy copies from src to dst using a pooled buffer
func (bc *BufferedCopier) Copy(dst io.Writer, src io.Reader) (int64, error) {
	bufPtr := bc.pool.Get().(*[]byte)
	defer bc.pool.Put(bufPtr)
	buf := *bufPtr

	var written int64
	for {
		nr, readErr := src.Read(buf)
		if nr > 0 {
			nw, writeErr := dst.Write(buf[0:nr])
			if nw < 0 || nr < nw {
				nw = 0
				if writeErr == nil {
					writeErr = io.ErrShortWrite
				}
			}
			written += int64(nw)
			if writeErr != nil {
				return written, writeErr
			}
			if nr != nw {
				return written, io.ErrShortWrite
			}
		}
		if readErr != nil {
			if readErr == io.EOF {
				return written, nil
			}
			return written, readErr
		}
	}
}

// CopyN copies exactly n bytes from src to dst
func (bc *BufferedCopier) CopyN(dst io.Writer, src io.Reader, n int64) (int64, error) {
	written, err := bc.Copy(dst, io.LimitReader(src, n))
	if written == n {
		return n, nil
	}
	if written < n && err == nil {
		// src stopped early; must have been EOF.
		err = io.EOF
	}
	return written, err
}

// RingBuffer is a circular buffer for streaming data
type RingBuffer struct {
	buf      []byte
	size     int
	readPos  int
	writePos int
	count    int
	mu       sync.Mutex
	notEmpty *sync.Cond
	notFull  *sync.Cond
	closed   bool
}

// NewRingBuffer creates a new ring buffer with the given size
func NewRingBuffer(size int) *RingBuffer {
	rb := &RingBuffer{
		buf:  make([]byte, size),
		size: size,
	}
	rb.notEmpty = sync.NewCond(&rb.mu)
	rb.notFull = sync.NewCond(&rb.mu)
	return rb
}

// Write writes data to the buffer, blocking if full
func (rb *RingBuffer) Write(data []byte) (int, error) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	written := 0
	for len(data) > 0 {
		// Wait for space
		for rb.count == rb.size && !rb.closed {
			rb.notFull.Wait()
		}
		if rb.closed {
			return written, io.ErrClosedPipe
		}

		// Calculate how much we can write
		available := rb.size - rb.count
		toWrite := len(data)
		if toWrite > available {
			toWrite = available
		}

		// Write in one or two chunks (wrap around)
		firstChunk := rb.size - rb.writePos
		if firstChunk > toWrite {
			firstChunk = toWrite
		}
		copy(rb.buf[rb.writePos:], data[:firstChunk])

		secondChunk := toWrite - firstChunk
		if secondChunk > 0 {
			copy(rb.buf[:secondChunk], data[firstChunk:toWrite])
		}

		rb.writePos = (rb.writePos + toWrite) % rb.size
		rb.count += toWrite
		written += toWrite
		data = data[toWrite:]

		rb.notEmpty.Signal()
	}

	return written, nil
}

// Read reads data from the buffer, blocking if empty
func (rb *RingBuffer) Read(data []byte) (int, error) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	// Wait for data
	for rb.count == 0 && !rb.closed {
		rb.notEmpty.Wait()
	}
	if rb.count == 0 && rb.closed {
		return 0, io.EOF
	}

	// Calculate how much we can read
	toRead := len(data)
	if toRead > rb.count {
		toRead = rb.count
	}

	// Read in one or two chunks (wrap around)
	firstChunk := rb.size - rb.readPos
	if firstChunk > toRead {
		firstChunk = toRead
	}
	copy(data[:firstChunk], rb.buf[rb.readPos:])

	secondChunk := toRead - firstChunk
	if secondChunk > 0 {
		copy(data[firstChunk:toRead], rb.buf[:secondChunk])
	}

	rb.readPos = (rb.readPos + toRead) % rb.size
	rb.count -= toRead

	rb.notFull.Signal()

	return toRead, nil
}

// Close closes the buffer
func (rb *RingBuffer) Close() error {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	rb.closed = true
	rb.notEmpty.Broadcast()
	rb.notFull.Broadcast()

	return nil
}

// Len returns the number of bytes in the buffer
func (rb *RingBuffer) Len() int {
	rb.mu.Lock()
	defer rb.mu.Unlock()
	return rb.count
}

// Cap returns the capacity of the buffer
func (rb *RingBuffer) Cap() int {
	return rb.size
}
