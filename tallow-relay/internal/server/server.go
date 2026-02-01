package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/tallow/tallow-relay/internal/bridge"
	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/internal/protocol"
	"github.com/tallow/tallow-relay/internal/ratelimit"
	"github.com/tallow/tallow-relay/internal/room"
)

// Server is the main relay server
type Server struct {
	config      *Config
	log         *logging.Logger
	metrics     *metrics.PrometheusMetrics
	roomManager *room.Manager
	rateLimiter *ratelimit.Limiter
	middleware  *Middleware
	httpServer  *http.Server
	metricsServer *http.Server
	upgrader    websocket.Upgrader
	mu          sync.RWMutex
	started     bool
}

// New creates a new relay server
func New(cfg *Config, log *logging.Logger, m *metrics.PrometheusMetrics) (*Server, error) {
	// Create rate limiter
	rl := ratelimit.NewLimiter(ratelimit.Config{
		RequestsPerSecond: cfg.RateLimit.RequestsPerSecond,
		BurstSize:         cfg.RateLimit.BurstSize,
		CleanupInterval:   cfg.RateLimit.CleanupInterval,
		BanDuration:       cfg.RateLimit.BanDuration,
		MaxViolations:     cfg.RateLimit.MaxViolations,
	})

	// Create room manager
	rm := room.NewManager(room.ManagerConfig{
		MaxRooms:        cfg.Room.MaxRooms,
		DefaultExpiry:   cfg.Room.DefaultExpiry,
		MaxExpiry:       cfg.Room.MaxExpiry,
		CleanupInterval: cfg.Room.CleanupInterval,
		CodeWordCount:   cfg.Room.CodeWordCount,
	}, log, m)

	s := &Server{
		config:      cfg,
		log:         log.WithComponent("server"),
		metrics:     m,
		roomManager: rm,
		rateLimiter: rl,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  cfg.Bridge.BufferSize,
			WriteBufferSize: cfg.Bridge.BufferSize,
			CheckOrigin: func(r *http.Request) bool {
				// Allow all origins for self-hosted setups
				return true
			},
			HandshakeTimeout: 10 * time.Second,
		},
	}

	s.middleware = NewMiddleware(cfg, log, m, rl)

	return s, nil
}

// Start starts the server
func (s *Server) Start() error {
	s.mu.Lock()
	if s.started {
		s.mu.Unlock()
		return fmt.Errorf("server already started")
	}
	s.started = true
	s.mu.Unlock()

	// Start room manager cleanup
	s.roomManager.Start()

	// Create HTTP mux
	mux := http.NewServeMux()

	// WebSocket endpoint for relay
	mux.HandleFunc("/ws", s.handleWebSocket)

	// REST endpoints
	mux.HandleFunc("/api/v1/rooms", s.handleRooms)
	mux.HandleFunc("/api/v1/rooms/", s.handleRoom)
	mux.HandleFunc("/api/v1/stats", s.handleStats)

	// Health endpoints
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/ready", s.handleReady)

	// Apply middleware
	handler := s.middleware.Chain(mux)

	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)
	s.httpServer = &http.Server{
		Addr:           addr,
		Handler:        handler,
		ReadTimeout:    s.config.Server.ReadTimeout,
		WriteTimeout:   s.config.Server.WriteTimeout,
		IdleTimeout:    s.config.Server.IdleTimeout,
		MaxHeaderBytes: s.config.Server.MaxHeaderBytes,
	}

	// Start metrics server if enabled
	if s.config.Metrics.Enabled {
		go s.startMetricsServer()
	}

	s.log.Info().Str("addr", addr).Msg("Starting HTTP server")

	if s.config.TLS.Enabled {
		return s.httpServer.ListenAndServeTLS(s.config.TLS.CertFile, s.config.TLS.KeyFile)
	}
	return s.httpServer.ListenAndServe()
}

// startMetricsServer starts the prometheus metrics server
func (s *Server) startMetricsServer() {
	mux := http.NewServeMux()
	mux.Handle(s.config.Metrics.Path, s.metrics.Handler())

	addr := fmt.Sprintf(":%d", s.config.Metrics.Port)
	s.metricsServer = &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	s.log.Info().Str("addr", addr).Msg("Starting metrics server")
	if err := s.metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		s.log.Error().Err(err).Msg("Metrics server error")
	}
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.started {
		return nil
	}

	// Stop room manager
	s.roomManager.Stop()

	// Stop rate limiter
	s.rateLimiter.Stop()

	// Shutdown metrics server
	if s.metricsServer != nil {
		if err := s.metricsServer.Shutdown(ctx); err != nil {
			s.log.Error().Err(err).Msg("Metrics server shutdown error")
		}
	}

	// Shutdown main server
	return s.httpServer.Shutdown(ctx)
}

// handleWebSocket handles WebSocket connections for relay
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.log.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	s.metrics.ActiveConnections.Inc()
	defer s.metrics.ActiveConnections.Dec()

	clientIP := getClientIP(r)
	s.log.Debug().Str("ip", clientIP).Msg("New WebSocket connection")

	// Create peer connection handler
	peer := bridge.NewPeer(conn, bridge.PeerConfig{
		BufferSize:     s.config.Bridge.BufferSize,
		ReadDeadline:   s.config.Bridge.ReadDeadline,
		WriteDeadline:  s.config.Bridge.WriteDeadline,
		PingInterval:   s.config.Bridge.PingInterval,
		PongTimeout:    s.config.Bridge.PongTimeout,
		MaxMessageSize: s.config.Bridge.MaxMessageSize,
	}, s.log.WithIP(clientIP), s.metrics)

	// Handle protocol handshake
	if err := s.handleHandshake(peer); err != nil {
		s.log.Error().Err(err).Str("ip", clientIP).Msg("Handshake failed")
		peer.SendError(protocol.ErrorCodeHandshakeFailed, err.Error())
		peer.Close()
		return
	}
}

// handleHandshake processes the initial handshake
func (s *Server) handleHandshake(peer *bridge.Peer) error {
	// Read initial message
	msg, err := peer.ReadMessage()
	if err != nil {
		return fmt.Errorf("failed to read handshake: %w", err)
	}

	switch msg.Type {
	case protocol.MsgTypeCreateRoom:
		return s.handleCreateRoom(peer, msg)
	case protocol.MsgTypeJoinRoom:
		return s.handleJoinRoom(peer, msg)
	default:
		return fmt.Errorf("unexpected message type: %s", msg.Type)
	}
}

// handleCreateRoom handles room creation requests
func (s *Server) handleCreateRoom(peer *bridge.Peer, msg *protocol.Message) error {
	var req protocol.CreateRoomRequest
	if err := json.Unmarshal(msg.Payload, &req); err != nil {
		return fmt.Errorf("invalid create room request: %w", err)
	}

	// Determine expiry
	expiry := s.config.Room.DefaultExpiry
	if req.ExpiryMinutes > 0 {
		requestedExpiry := time.Duration(req.ExpiryMinutes) * time.Minute
		if requestedExpiry <= s.config.Room.MaxExpiry {
			expiry = requestedExpiry
		}
	}

	// Create room
	r, err := s.roomManager.CreateRoom(expiry)
	if err != nil {
		return fmt.Errorf("failed to create room: %w", err)
	}

	// Add peer to room as creator
	if err := r.AddPeer(peer, true); err != nil {
		s.roomManager.RemoveRoom(r.ID())
		return fmt.Errorf("failed to add peer to room: %w", err)
	}

	// Send room created response
	resp := protocol.RoomCreatedResponse{
		RoomID:    r.ID(),
		Code:      r.Code(),
		ExpiresAt: r.ExpiresAt().Unix(),
	}

	if err := peer.SendMessage(protocol.MsgTypeRoomCreated, resp); err != nil {
		return fmt.Errorf("failed to send room created: %w", err)
	}

	s.log.Info().
		Str("room_id", r.ID()).
		Str("code", r.Code()).
		Msg("Room created")

	// Wait for peer
	return s.waitForPeer(peer, r)
}

// handleJoinRoom handles room join requests
func (s *Server) handleJoinRoom(peer *bridge.Peer, msg *protocol.Message) error {
	var req protocol.JoinRoomRequest
	if err := json.Unmarshal(msg.Payload, &req); err != nil {
		return fmt.Errorf("invalid join room request: %w", err)
	}

	// Find room by code
	r, err := s.roomManager.GetRoomByCode(req.Code)
	if err != nil {
		peer.SendError(protocol.ErrorCodeRoomNotFound, "Room not found")
		return fmt.Errorf("room not found: %s", req.Code)
	}

	// Add peer to room
	if err := r.AddPeer(peer, false); err != nil {
		return fmt.Errorf("failed to add peer to room: %w", err)
	}

	// Send room joined response
	resp := protocol.RoomJoinedResponse{
		RoomID:    r.ID(),
		ExpiresAt: r.ExpiresAt().Unix(),
	}

	if err := peer.SendMessage(protocol.MsgTypeRoomJoined, resp); err != nil {
		return fmt.Errorf("failed to send room joined: %w", err)
	}

	s.log.Info().
		Str("room_id", r.ID()).
		Str("code", r.Code()).
		Msg("Peer joined room")

	// Start bridge
	return s.startBridge(r)
}

// waitForPeer waits for a peer to join the room
func (s *Server) waitForPeer(peer *bridge.Peer, r *room.Room) error {
	// Wait for peer joined notification from room
	select {
	case <-r.PeerJoined():
		// Notify creator that peer joined
		if err := peer.SendMessage(protocol.MsgTypePeerJoined, nil); err != nil {
			return fmt.Errorf("failed to send peer joined: %w", err)
		}
		return s.startBridge(r)
	case <-r.Closed():
		return fmt.Errorf("room closed while waiting for peer")
	case <-time.After(s.config.Room.DefaultExpiry):
		return fmt.Errorf("timeout waiting for peer")
	}
}

// startBridge starts bidirectional relay between peers
func (s *Server) startBridge(r *room.Room) error {
	// Create bridge
	b := bridge.NewBridge(bridge.Config{
		BufferSize:      s.config.Bridge.BufferSize,
		MaxBytesPerRoom: s.config.Bridge.MaxBytesPerRoom,
		IdleTimeout:     s.config.Bridge.IdleTimeout,
	}, s.log.WithRoom(r.ID()), s.metrics)

	// Get both peers
	peers := r.Peers()
	if len(peers) != 2 {
		return fmt.Errorf("expected 2 peers, got %d", len(peers))
	}

	s.log.Info().Str("room_id", r.ID()).Msg("Starting bridge")

	// Start bridge (blocks until done)
	stats := b.Start(peers[0], peers[1])

	s.log.Info().
		Str("room_id", r.ID()).
		Int64("bytes_transferred", stats.BytesTransferred).
		Dur("duration", stats.Duration).
		Msg("Bridge completed")

	// Clean up room
	r.Close()
	s.roomManager.RemoveRoom(r.ID())

	return nil
}

// handleRooms handles /api/v1/rooms
func (s *Server) handleRooms(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := s.roomManager.Stats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"active_rooms": stats.ActiveRooms,
		"total_created": stats.TotalCreated,
		"total_expired": stats.TotalExpired,
	})
}

// handleRoom handles /api/v1/rooms/{id}
func (s *Server) handleRoom(w http.ResponseWriter, r *http.Request) {
	// This is a simplified handler - in production you'd want proper routing
	http.Error(w, "Not implemented", http.StatusNotImplemented)
}

// handleStats handles /api/v1/stats
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	roomStats := s.roomManager.Stats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"rooms": map[string]interface{}{
			"active":        roomStats.ActiveRooms,
			"total_created": roomStats.TotalCreated,
			"total_expired": roomStats.TotalExpired,
		},
		"version": "1.0.0",
	})
}

// handleHealth handles health check endpoint
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
	})
}

// handleReady handles readiness check endpoint
func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	started := s.started
	s.mu.RUnlock()

	if !started {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "not ready",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ready",
	})
}
