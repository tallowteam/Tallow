// Package network provides networking utilities for tallow.
package network

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"sync"
	"time"
)

// TCPConnection wraps a TCP connection with additional features
type TCPConnection struct {
	conn       net.Conn
	readMu     sync.Mutex
	writeMu    sync.Mutex
	closed     bool
	closedMu   sync.RWMutex
}

// NewTCPConnection wraps an existing connection
func NewTCPConnection(conn net.Conn) *TCPConnection {
	return &TCPConnection{
		conn: conn,
	}
}

// Dial creates a new TCP connection
func Dial(ctx context.Context, address string) (*TCPConnection, error) {
	var d net.Dialer
	conn, err := d.DialContext(ctx, "tcp", address)
	if err != nil {
		return nil, err
	}
	return NewTCPConnection(conn), nil
}

// DialWithTimeout dials with a timeout
func DialWithTimeout(address string, timeout time.Duration) (*TCPConnection, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	return Dial(ctx, address)
}

// Read implements io.Reader
func (c *TCPConnection) Read(p []byte) (n int, err error) {
	c.closedMu.RLock()
	if c.closed {
		c.closedMu.RUnlock()
		return 0, io.ErrClosedPipe
	}
	c.closedMu.RUnlock()

	c.readMu.Lock()
	defer c.readMu.Unlock()

	return c.conn.Read(p)
}

// Write implements io.Writer
func (c *TCPConnection) Write(p []byte) (n int, err error) {
	c.closedMu.RLock()
	if c.closed {
		c.closedMu.RUnlock()
		return 0, io.ErrClosedPipe
	}
	c.closedMu.RUnlock()

	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	return c.conn.Write(p)
}

// Close implements io.Closer
func (c *TCPConnection) Close() error {
	c.closedMu.Lock()
	defer c.closedMu.Unlock()

	if c.closed {
		return nil
	}
	c.closed = true

	return c.conn.Close()
}

// SetDeadline sets both read and write deadlines
func (c *TCPConnection) SetDeadline(t time.Time) error {
	return c.conn.SetDeadline(t)
}

// SetReadDeadline sets the read deadline
func (c *TCPConnection) SetReadDeadline(t time.Time) error {
	return c.conn.SetReadDeadline(t)
}

// SetWriteDeadline sets the write deadline
func (c *TCPConnection) SetWriteDeadline(t time.Time) error {
	return c.conn.SetWriteDeadline(t)
}

// LocalAddr returns the local address
func (c *TCPConnection) LocalAddr() net.Addr {
	return c.conn.LocalAddr()
}

// RemoteAddr returns the remote address
func (c *TCPConnection) RemoteAddr() net.Addr {
	return c.conn.RemoteAddr()
}

// TCPListener wraps a TCP listener
type TCPListener struct {
	listener net.Listener
	closed   bool
	closedMu sync.RWMutex
}

// Listen creates a new TCP listener
func Listen(address string) (*TCPListener, error) {
	listener, err := net.Listen("tcp", address)
	if err != nil {
		return nil, err
	}
	return &TCPListener{
		listener: listener,
	}, nil
}

// Accept accepts a new connection
func (l *TCPListener) Accept() (*TCPConnection, error) {
	l.closedMu.RLock()
	if l.closed {
		l.closedMu.RUnlock()
		return nil, errors.New("listener closed")
	}
	l.closedMu.RUnlock()

	conn, err := l.listener.Accept()
	if err != nil {
		return nil, err
	}
	return NewTCPConnection(conn), nil
}

// Close closes the listener
func (l *TCPListener) Close() error {
	l.closedMu.Lock()
	defer l.closedMu.Unlock()

	if l.closed {
		return nil
	}
	l.closed = true

	return l.listener.Close()
}

// Addr returns the listener address
func (l *TCPListener) Addr() net.Addr {
	return l.listener.Addr()
}

// Port returns the listener port
func (l *TCPListener) Port() int {
	addr := l.listener.Addr().(*net.TCPAddr)
	return addr.Port
}

// GetLocalIP returns the local IP address
func GetLocalIP() (string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "", err
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String(), nil
			}
		}
	}

	return "", errors.New("no local IP found")
}

// GetAllLocalIPs returns all local IP addresses
func GetAllLocalIPs() ([]string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return nil, err
	}

	var ips []string
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ips = append(ips, ipnet.IP.String())
			}
		}
	}

	if len(ips) == 0 {
		return nil, errors.New("no local IPs found")
	}

	return ips, nil
}

// IsPortAvailable checks if a port is available
func IsPortAvailable(port int) bool {
	addr := fmt.Sprintf(":%d", port)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return false
	}
	listener.Close()
	return true
}

// FindAvailablePort finds an available port in the given range
func FindAvailablePort(start, end int) (int, error) {
	for port := start; port <= end; port++ {
		if IsPortAvailable(port) {
			return port, nil
		}
	}
	return 0, errors.New("no available port found")
}

// ConnectionPool manages a pool of connections
type ConnectionPool struct {
	conns   chan *TCPConnection
	factory func() (*TCPConnection, error)
	maxSize int
	mu      sync.Mutex
}

// NewConnectionPool creates a new connection pool
func NewConnectionPool(maxSize int, factory func() (*TCPConnection, error)) *ConnectionPool {
	return &ConnectionPool{
		conns:   make(chan *TCPConnection, maxSize),
		factory: factory,
		maxSize: maxSize,
	}
}

// Get gets a connection from the pool
func (p *ConnectionPool) Get(ctx context.Context) (*TCPConnection, error) {
	select {
	case conn := <-p.conns:
		return conn, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
		return p.factory()
	}
}

// Put returns a connection to the pool
func (p *ConnectionPool) Put(conn *TCPConnection) {
	select {
	case p.conns <- conn:
	default:
		conn.Close()
	}
}

// Close closes all connections in the pool
func (p *ConnectionPool) Close() {
	close(p.conns)
	for conn := range p.conns {
		conn.Close()
	}
}
