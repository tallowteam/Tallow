package bridge

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/internal/protocol"
)

// PeerConfig holds peer configuration
type PeerConfig struct {
	BufferSize     int
	ReadDeadline   time.Duration
	WriteDeadline  time.Duration
	PingInterval   time.Duration
	PongTimeout    time.Duration
	MaxMessageSize int64
}

// Peer represents a connected WebSocket peer
type Peer struct {
	conn       *websocket.Conn
	config     PeerConfig
	log        *logging.Logger
	metrics    *metrics.PrometheusMetrics
	roomID     string
	isCreator  bool
	stats      *TransferStats
	writeMu    sync.Mutex
	closed     bool
	closedMu   sync.RWMutex
	closeOnce  sync.Once
}

// NewPeer creates a new peer connection handler
func NewPeer(conn *websocket.Conn, cfg PeerConfig, log *logging.Logger, m *metrics.PrometheusMetrics) *Peer {
	// Configure connection
	conn.SetReadLimit(cfg.MaxMessageSize)

	return &Peer{
		conn:    conn,
		config:  cfg,
		log:     log,
		metrics: m,
		stats:   NewTransferStats(),
	}
}

// SetRoom associates the peer with a room
func (p *Peer) SetRoom(roomID string, isCreator bool) {
	p.roomID = roomID
	p.isCreator = isCreator
}

// RoomID returns the peer's room ID
func (p *Peer) RoomID() string {
	return p.roomID
}

// IsCreator returns whether this peer created the room
func (p *Peer) IsCreator() bool {
	return p.isCreator
}

// ReadMessage reads and parses a protocol message
func (p *Peer) ReadMessage() (*protocol.Message, error) {
	if err := p.setReadDeadline(); err != nil {
		return nil, err
	}

	_, data, err := p.conn.ReadMessage()
	if err != nil {
		return nil, err
	}

	p.stats.AddBytesReceived(int64(len(data)))
	p.stats.AddMessageReceived()

	return protocol.DecodeMessage(data)
}

// ReadRaw reads raw bytes from the connection
func (p *Peer) ReadRaw() ([]byte, error) {
	if err := p.setReadDeadline(); err != nil {
		return nil, err
	}

	_, data, err := p.conn.ReadMessage()
	if err != nil {
		return nil, err
	}

	p.stats.AddBytesReceived(int64(len(data)))
	p.stats.AddMessageReceived()

	return data, nil
}

// SendMessage sends a protocol message
func (p *Peer) SendMessage(msgType string, payload interface{}) error {
	msg, err := protocol.NewMessage(msgType, payload)
	if err != nil {
		return err
	}

	data, err := protocol.EncodeMessage(msg)
	if err != nil {
		return err
	}

	return p.WriteRaw(data)
}

// SendError sends an error message
func (p *Peer) SendError(code, message string) error {
	return p.SendMessage(protocol.MsgTypeError, protocol.ErrorResponse{
		Code:    code,
		Message: message,
	})
}

// WriteRaw writes raw bytes to the connection
func (p *Peer) WriteRaw(data []byte) error {
	p.writeMu.Lock()
	defer p.writeMu.Unlock()

	p.closedMu.RLock()
	if p.closed {
		p.closedMu.RUnlock()
		return websocket.ErrCloseSent
	}
	p.closedMu.RUnlock()

	if err := p.setWriteDeadline(); err != nil {
		return err
	}

	if err := p.conn.WriteMessage(websocket.BinaryMessage, data); err != nil {
		return err
	}

	p.stats.AddBytesSent(int64(len(data)))
	p.stats.AddMessageSent()

	return nil
}

// WriteJSON writes a JSON message
func (p *Peer) WriteJSON(v interface{}) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return p.WriteRaw(data)
}

// Close closes the peer connection
func (p *Peer) Close() error {
	var err error
	p.closeOnce.Do(func() {
		p.closedMu.Lock()
		p.closed = true
		p.closedMu.Unlock()

		// Send close message
		p.writeMu.Lock()
		deadline := time.Now().Add(time.Second * 5)
		p.conn.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
			deadline,
		)
		p.writeMu.Unlock()

		err = p.conn.Close()
	})
	return err
}

// IsClosed returns whether the peer is closed
func (p *Peer) IsClosed() bool {
	p.closedMu.RLock()
	defer p.closedMu.RUnlock()
	return p.closed
}

// Stats returns the peer's transfer statistics
func (p *Peer) Stats() *TransferStats {
	return p.stats
}

// Ping sends a ping message
func (p *Peer) Ping() error {
	p.writeMu.Lock()
	defer p.writeMu.Unlock()

	deadline := time.Now().Add(p.config.PongTimeout)
	return p.conn.WriteControl(websocket.PingMessage, nil, deadline)
}

// StartPingLoop starts the ping/pong loop
func (p *Peer) StartPingLoop() {
	// Set up pong handler
	p.conn.SetPongHandler(func(string) error {
		return p.conn.SetReadDeadline(time.Now().Add(p.config.ReadDeadline))
	})

	// Start ping ticker
	go func() {
		ticker := time.NewTicker(p.config.PingInterval)
		defer ticker.Stop()

		for {
			<-ticker.C
			if p.IsClosed() {
				return
			}
			if err := p.Ping(); err != nil {
				p.log.Debug().Err(err).Msg("Ping failed")
				return
			}
		}
	}()
}

// setReadDeadline sets the read deadline
func (p *Peer) setReadDeadline() error {
	if p.config.ReadDeadline > 0 {
		return p.conn.SetReadDeadline(time.Now().Add(p.config.ReadDeadline))
	}
	return nil
}

// setWriteDeadline sets the write deadline
func (p *Peer) setWriteDeadline() error {
	if p.config.WriteDeadline > 0 {
		return p.conn.SetWriteDeadline(time.Now().Add(p.config.WriteDeadline))
	}
	return nil
}

// RemoteAddr returns the peer's remote address
func (p *Peer) RemoteAddr() string {
	return p.conn.RemoteAddr().String()
}
