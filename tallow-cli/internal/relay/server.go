package relay

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"github.com/tallow/tallow-cli/pkg/protocol"
)

// Common errors
var (
	ErrRoomFull     = errors.New("room is full")
	ErrRoomClosed   = errors.New("room is closed")
	ErrRoomExists   = errors.New("room already exists")
	ErrRoomNotFound = errors.New("room not found")
	ErrUnauthorized = errors.New("unauthorized")
)

// ServerConfig configures the relay server
type ServerConfig struct {
	ListenAddr         string
	RoomTTL            time.Duration
	MaxConnectionsPerIP int
	RateLimit          float64
	BurstLimit         int
	EnableMetrics      bool
	MetricsAddr        string
	TLSCert            string
	TLSKey             string
}

// DefaultServerConfig returns default configuration
func DefaultServerConfig() ServerConfig {
	return ServerConfig{
		ListenAddr:         ":8080",
		RoomTTL:            30 * time.Minute,
		MaxConnectionsPerIP: 10,
		RateLimit:          10,
		BurstLimit:         20,
		EnableMetrics:      true,
		MetricsAddr:        ":9090",
	}
}

// Server is the relay server
type Server struct {
	config          ServerConfig
	roomManager     *RoomManager
	rateLimiter     *RateLimiter
	connLimiter     *ConnectionLimiter
	metrics         *Metrics
	simpleMetrics   *SimpleMetrics
	upgrader        websocket.Upgrader
	httpServer      *http.Server
	metricsServer   *http.Server
	bridges         *BridgePool
	startTime       time.Time
	logger          *log.Logger
	mu              sync.RWMutex
}

// NewServer creates a new relay server
func NewServer(config ServerConfig) *Server {
	s := &Server{
		config:        config,
		roomManager:   NewRoomManager(config.RoomTTL),
		rateLimiter:   NewRateLimiter(config.RateLimit, config.BurstLimit),
		connLimiter:   NewConnectionLimiter(config.MaxConnectionsPerIP),
		simpleMetrics: NewSimpleMetrics(),
		bridges:       NewBridgePool(),
		startTime:     time.Now(),
		logger:        log.New(os.Stdout, "[relay] ", log.LstdFlags),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  65536,
			WriteBufferSize: 65536,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
	}

	if config.EnableMetrics {
		s.metrics = NewMetrics("tallow_relay")
	}

	return s
}

// Start starts the relay server
func (s *Server) Start() error {
	mux := http.NewServeMux()

	// WebSocket endpoint
	mux.HandleFunc("/ws", s.handleWebSocket)
	mux.HandleFunc("/ws/", s.handleWebSocket)

	// Room API
	mux.HandleFunc("/api/room", s.handleRoomAPI)
	mux.HandleFunc("/api/room/", s.handleRoomAPI)

	// Health check
	mux.HandleFunc("/health", s.handleHealth)

	// Stats
	mux.HandleFunc("/stats", s.handleStats)

	s.httpServer = &http.Server{
		Addr:         s.config.ListenAddr,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start metrics server
	if s.config.EnableMetrics && s.metrics != nil {
		metricsMux := http.NewServeMux()
		metricsMux.Handle("/metrics", s.metrics.Handler())

		s.metricsServer = &http.Server{
			Addr:    s.config.MetricsAddr,
			Handler: metricsMux,
		}

		go func() {
			s.logger.Printf("Metrics server listening on %s", s.config.MetricsAddr)
			if err := s.metricsServer.ListenAndServe(); err != http.ErrServerClosed {
				s.logger.Printf("Metrics server error: %v", err)
			}
		}()
	}

	s.logger.Printf("Relay server listening on %s", s.config.ListenAddr)

	var err error
	if s.config.TLSCert != "" && s.config.TLSKey != "" {
		err = s.httpServer.ListenAndServeTLS(s.config.TLSCert, s.config.TLSKey)
	} else {
		err = s.httpServer.ListenAndServe()
	}

	if err != http.ErrServerClosed {
		return err
	}
	return nil
}

// Run starts the server and handles signals
func (s *Server) Run() error {
	// Signal handling
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	errCh := make(chan error, 1)

	go func() {
		errCh <- s.Start()
	}()

	select {
	case err := <-errCh:
		return err
	case sig := <-sigCh:
		s.logger.Printf("Received signal %v, shutting down...", sig)
		return s.Stop()
	}
}

// Stop gracefully stops the server
func (s *Server) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Close all bridges
	s.bridges.CloseAll()

	// Shutdown HTTP servers
	if s.metricsServer != nil {
		s.metricsServer.Shutdown(ctx)
	}

	if s.httpServer != nil {
		return s.httpServer.Shutdown(ctx)
	}

	return nil
}

// handleWebSocket handles WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	ip := ExtractIP(r.RemoteAddr)

	// Rate limiting
	if !s.rateLimiter.Allow(ip) {
		http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
		return
	}

	// Connection limiting
	if !s.connLimiter.Acquire(ip) {
		http.Error(w, "too many connections", http.StatusTooManyRequests)
		return
	}
	defer s.connLimiter.Release(ip)

	// Upgrade to WebSocket
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Printf("WebSocket upgrade error: %v", err)
		return
	}
	defer conn.Close()

	s.simpleMetrics.IncConnections()
	if s.metrics != nil {
		s.metrics.RecordConnection()
	}
	connStart := time.Now()

	defer func() {
		s.simpleMetrics.DecConnections()
		if s.metrics != nil {
			s.metrics.RecordDisconnection(time.Since(connStart))
		}
	}()

	// Get room ID from query or first message
	roomID := r.URL.Query().Get("room")

	if roomID == "" {
		// Read room ID from first message
		_, msg, err := conn.ReadMessage()
		if err != nil {
			s.logger.Printf("Error reading room ID: %v", err)
			return
		}
		roomID = string(msg)
	}

	if roomID == "" {
		conn.WriteMessage(websocket.TextMessage, []byte("error: room ID required"))
		return
	}

	// Get or create room
	room := s.roomManager.GetOrCreateRoom(roomID)
	if room.ClientCount() == 0 {
		s.simpleMetrics.IncRooms()
		if s.metrics != nil {
			s.metrics.RecordRoomCreated()
		}
		room.SetOnClose(func() {
			s.simpleMetrics.DecRooms()
			if s.metrics != nil {
				s.metrics.RecordRoomClosed()
			}
		})
	}

	// Create client
	clientID := fmt.Sprintf("%s-%d", ip, time.Now().UnixNano())
	client := &Client{
		ID:         clientID,
		Conn:       &wsConn{conn: conn},
		RemoteAddr: r.RemoteAddr,
	}

	// Add client to room
	if err := room.AddClient(client); err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("error: "+err.Error()))
		return
	}
	defer room.RemoveClient(clientID)

	// Notify client of successful join
	conn.WriteMessage(websocket.TextMessage, []byte("joined"))

	// Wait for peer
	if room.ClientCount() < 2 {
		conn.WriteMessage(websocket.TextMessage, []byte("waiting"))

		// Wait for peer with timeout
		timeout := time.After(5 * time.Minute)
		ticker := time.NewTicker(500 * time.Millisecond)
		defer ticker.Stop()

	waitLoop:
		for {
			select {
			case <-timeout:
				conn.WriteMessage(websocket.TextMessage, []byte("timeout: no peer connected"))
				return
			case <-ticker.C:
				if room.ClientCount() >= 2 {
					break waitLoop
				}
			}
		}
	}

	// Notify both clients that peer is connected
	conn.WriteMessage(websocket.TextMessage, []byte("connected"))

	// Get peer
	peer := room.GetPeer(clientID)
	if peer == nil {
		conn.WriteMessage(websocket.TextMessage, []byte("error: peer disconnected"))
		return
	}

	s.logger.Printf("Bridging clients in room %s", roomID)

	if s.metrics != nil {
		s.metrics.RecordTransferStart()
	}

	transferStart := time.Now()

	// Create bridge between clients
	bridge := NewBridge(client.Conn, peer.Conn, BridgeConfig{
		BufferSize: 65536,
		Timeout:    30 * time.Minute,
		OnComplete: func(a2b, b2a int64) {
			total := a2b + b2a
			s.simpleMetrics.AddBytes(total)
			if s.metrics != nil {
				s.metrics.RecordBytes(total)
				s.metrics.RecordTransferComplete(time.Since(transferStart), total)
			}
		},
	})

	s.bridges.Add(roomID, bridge)
	defer s.bridges.Remove(roomID)

	bridge.Start()
	bridge.Wait()

	s.logger.Printf("Bridge closed for room %s", roomID)
}

// handleRoomAPI handles room API requests
func (s *Server) handleRoomAPI(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		// Create room
		var req struct {
			RoomID string `json:"room_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}

		if req.RoomID == "" {
			code, _ := protocol.GenerateRoomCode(3)
			req.RoomID = protocol.RoomIDFromCode(code)
		}

		room, err := s.roomManager.CreateRoom(req.RoomID)
		if err != nil {
			if err == ErrRoomExists {
				http.Error(w, "room exists", http.StatusConflict)
			} else {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"room_id":    room.ID,
			"expires_at": room.ExpiresAt,
		})

	case http.MethodGet:
		// Get room status
		roomID := r.URL.Query().Get("id")
		if roomID == "" {
			http.Error(w, "room ID required", http.StatusBadRequest)
			return
		}

		room := s.roomManager.GetRoom(roomID)
		if room == nil {
			http.Error(w, "room not found", http.StatusNotFound)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"room_id":      room.ID,
			"client_count": room.ClientCount(),
			"is_full":      room.IsFull(),
			"expires_at":   room.ExpiresAt,
		})

	case http.MethodDelete:
		// Delete room
		roomID := r.URL.Query().Get("id")
		if roomID == "" {
			http.Error(w, "room ID required", http.StatusBadRequest)
			return
		}

		room := s.roomManager.GetRoom(roomID)
		if room != nil {
			room.Close()
			s.roomManager.RemoveRoom(roomID)
		}

		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleHealth handles health check requests
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"uptime": time.Since(s.startTime).String(),
	})
}

// handleStats handles stats requests
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	stats := s.roomManager.Stats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"uptime":             time.Since(s.startTime).String(),
		"connections":        s.simpleMetrics.Connections(),
		"rooms":              s.simpleMetrics.Rooms(),
		"active_rooms":       stats.ActiveRooms,
		"total_clients":      stats.TotalClients,
		"bytes_transferred":  s.simpleMetrics.BytesTransferred(),
	})
}

// wsConn wraps a WebSocket connection as io.ReadWriteCloser
type wsConn struct {
	conn    *websocket.Conn
	readBuf []byte
	readIdx int
	mu      sync.Mutex
}

func (w *wsConn) Read(p []byte) (n int, err error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	// Return buffered data
	if w.readIdx < len(w.readBuf) {
		n = copy(p, w.readBuf[w.readIdx:])
		w.readIdx += n
		return n, nil
	}

	// Read new message
	_, msg, err := w.conn.ReadMessage()
	if err != nil {
		if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
			return 0, io.EOF
		}
		return 0, err
	}

	w.readBuf = msg
	w.readIdx = 0

	n = copy(p, w.readBuf)
	w.readIdx = n
	return n, nil
}

func (w *wsConn) Write(p []byte) (n int, err error) {
	err = w.conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (w *wsConn) Close() error {
	w.conn.WriteMessage(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	return w.conn.Close()
}
