package network

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var (
	// ErrWebSocketClosed indicates the connection is closed
	ErrWebSocketClosed = errors.New("websocket connection closed")
)

// WebSocketConnection wraps a WebSocket connection as io.ReadWriteCloser
type WebSocketConnection struct {
	conn      *websocket.Conn
	readBuf   []byte
	readIdx   int
	readMu    sync.Mutex
	writeMu   sync.Mutex
	closed    bool
	closedMu  sync.RWMutex
}

// DialWebSocket connects to a WebSocket server
func DialWebSocket(ctx context.Context, urlStr string) (*WebSocketConnection, error) {
	u, err := url.Parse(urlStr)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	// Ensure scheme is ws or wss
	switch u.Scheme {
	case "ws", "wss":
		// OK
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	default:
		u.Scheme = "wss"
	}

	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.DialContext(ctx, u.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("websocket dial failed: %w", err)
	}

	return &WebSocketConnection{
		conn: conn,
	}, nil
}

// Read implements io.Reader
func (c *WebSocketConnection) Read(p []byte) (n int, err error) {
	c.closedMu.RLock()
	if c.closed {
		c.closedMu.RUnlock()
		return 0, ErrWebSocketClosed
	}
	c.closedMu.RUnlock()

	c.readMu.Lock()
	defer c.readMu.Unlock()

	// Return buffered data if available
	if c.readIdx < len(c.readBuf) {
		n = copy(p, c.readBuf[c.readIdx:])
		c.readIdx += n
		return n, nil
	}

	// Read new message
	_, msg, err := c.conn.ReadMessage()
	if err != nil {
		if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
			return 0, io.EOF
		}
		return 0, err
	}

	// Buffer the message
	c.readBuf = msg
	c.readIdx = 0

	n = copy(p, c.readBuf)
	c.readIdx = n
	return n, nil
}

// Write implements io.Writer
func (c *WebSocketConnection) Write(p []byte) (n int, err error) {
	c.closedMu.RLock()
	if c.closed {
		c.closedMu.RUnlock()
		return 0, ErrWebSocketClosed
	}
	c.closedMu.RUnlock()

	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	err = c.conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

// Close implements io.Closer
func (c *WebSocketConnection) Close() error {
	c.closedMu.Lock()
	defer c.closedMu.Unlock()

	if c.closed {
		return nil
	}
	c.closed = true

	// Send close message
	c.conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))

	return c.conn.Close()
}

// SetDeadline sets the read and write deadline
func (c *WebSocketConnection) SetDeadline(t time.Time) error {
	if err := c.conn.SetReadDeadline(t); err != nil {
		return err
	}
	return c.conn.SetWriteDeadline(t)
}

// SetReadDeadline sets the read deadline
func (c *WebSocketConnection) SetReadDeadline(t time.Time) error {
	return c.conn.SetReadDeadline(t)
}

// SetWriteDeadline sets the write deadline
func (c *WebSocketConnection) SetWriteDeadline(t time.Time) error {
	return c.conn.SetWriteDeadline(t)
}

// Ping sends a ping message
func (c *WebSocketConnection) Ping() error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()

	return c.conn.WriteMessage(websocket.PingMessage, nil)
}

// WebSocketServer handles WebSocket connections
type WebSocketServer struct {
	upgrader websocket.Upgrader
	handler  func(*WebSocketConnection)
}

// NewWebSocketServer creates a new WebSocket server
func NewWebSocketServer(handler func(*WebSocketConnection)) *WebSocketServer {
	return &WebSocketServer{
		upgrader: websocket.Upgrader{
			ReadBufferSize:  65536,
			WriteBufferSize: 65536,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for CLI tool
			},
		},
		handler: handler,
	}
}

// ServeHTTP implements http.Handler
func (s *WebSocketServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	wsConn := &WebSocketConnection{
		conn: conn,
	}

	s.handler(wsConn)
}

// WebSocketFrameWriter wraps a WebSocket connection for framed writing
type WebSocketFrameWriter struct {
	conn *WebSocketConnection
	buf  []byte
}

// NewWebSocketFrameWriter creates a framed writer
func NewWebSocketFrameWriter(conn *WebSocketConnection) *WebSocketFrameWriter {
	return &WebSocketFrameWriter{
		conn: conn,
		buf:  make([]byte, 4),
	}
}

// WriteFrame writes a length-prefixed frame
func (w *WebSocketFrameWriter) WriteFrame(data []byte) error {
	// Write length prefix
	binary.BigEndian.PutUint32(w.buf, uint32(len(data)))
	if _, err := w.conn.Write(w.buf); err != nil {
		return err
	}
	_, err := w.conn.Write(data)
	return err
}

// WebSocketFrameReader wraps a WebSocket connection for framed reading
type WebSocketFrameReader struct {
	conn *WebSocketConnection
	buf  []byte
}

// NewWebSocketFrameReader creates a framed reader
func NewWebSocketFrameReader(conn *WebSocketConnection) *WebSocketFrameReader {
	return &WebSocketFrameReader{
		conn: conn,
		buf:  make([]byte, 4),
	}
}

// ReadFrame reads a length-prefixed frame
func (r *WebSocketFrameReader) ReadFrame() ([]byte, error) {
	// Read length prefix
	if _, err := io.ReadFull(r.conn, r.buf); err != nil {
		return nil, err
	}

	length := binary.BigEndian.Uint32(r.buf)
	if length > 10*1024*1024 { // 10 MB limit
		return nil, errors.New("frame too large")
	}

	data := make([]byte, length)
	if _, err := io.ReadFull(r.conn, data); err != nil {
		return nil, err
	}

	return data, nil
}
