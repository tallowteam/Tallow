package network

import (
	"io"
	"time"
)

// ReadWriteCloserWithDeadline extends io.ReadWriteCloser with deadline methods
type ReadWriteCloserWithDeadline interface {
	io.ReadWriteCloser
	SetDeadline(t time.Time) error
	SetReadDeadline(t time.Time) error
	SetWriteDeadline(t time.Time) error
}
