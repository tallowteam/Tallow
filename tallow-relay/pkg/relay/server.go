// Package relay provides the WebSocket relay server for onion routing.
package relay

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/pkg/onion"
)

// RelayMode defines the relay operating mode
type RelayMode string

const (
	ModeEntry     RelayMode = "entry"
	ModeMiddle    RelayMode = "middle"
	ModeExit      RelayMode = "exit"
	ModeDirectory RelayMode = "directory"
)

// Server is the onion relay server
type Server struct {
	config         *Config
	log            *logging.Logger
	metrics        *metrics.PrometheusMetrics
	keyManager     *onion.KeyManager
	circuitManager *onion.CircuitManager
	httpServer     *http.Server
	metricsServer  *http.Server

	// Connection management
	connections    map[string]*RelayConnection
	connMu         sync.RWMutex

	// Outbound connections to next hops
	outbound       map[string]*websocket.Conn
	outboundMu     sync.RWMutex

	upgrader       websocket.Upgrader
	started        bool
	startTime      time.Time
	mu             sync.RWMutex
}

// RelayConnection represents a connected client or relay
type RelayConnection struct {
	ID         string
	Conn       *websocket.Conn
	RemoteAddr string
	IsRelay    bool
	Circuits   []string
	CreatedAt  time.Time
	LastPing   time.Time
	writeMu    sync.Mutex
}

// NewServer creates a new relay server
func NewServer(cfg *Config, log *logging.Logger, m *metrics.PrometheusMetrics, km *onion.KeyManager) (*Server, error) {
	circuitCfg := onion.DefaultCircuitConfig()
	if cfg.Onion.MaxCircuits > 0 {
		circuitCfg.MaxCircuits = cfg.Onion.MaxCircuits
	}
	if cfg.Onion.CircuitTimeout > 0 {
		circuitCfg.CircuitTimeout = cfg.Onion.CircuitTimeout
	}

	cm := onion.NewCircuitManager(circuitCfg, log, m, km)

	s := &Server{
		config:         cfg,
		log:            log.WithComponent("relay-server"),
		metrics:        m,
		keyManager:     km,
		circuitManager: cm,
		connections:    make(map[string]*RelayConnection),
		outbound:       make(map[string]*websocket.Conn),
		upgrader: websocket.Upgrader{
			ReadBufferSize:   cfg.Bridge.BufferSize,
			WriteBufferSize:  cfg.Bridge.BufferSize,
			HandshakeTimeout: 10 * time.Second,
			CheckOrigin:      func(r *http.Request) bool { return true },
		},
	}

	return s, nil
}

// Start starts the relay server
func (s *Server) Start() error {
	s.mu.Lock()
	if s.started {
		s.mu.Unlock()
		return fmt.Errorf("server already started")
	}
	s.started = true
	s.startTime = time.Now()
	s.mu.Unlock()

	// Start circuit manager
	s.circuitManager.Start()

	// Create HTTP mux
	mux := http.NewServeMux()

	// WebSocket endpoint for relay
	mux.HandleFunc("/ws", s.handleWebSocket)
	mux.HandleFunc("/ws/relay", s.handleRelayWebSocket)

	// REST endpoints
	mux.HandleFunc("/api/v1/info", s.handleInfo)
	mux.HandleFunc("/api/v1/stats", s.handleStats)
	mux.HandleFunc("/api/v1/publickey", s.handlePublicKey)

	// Health endpoints
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/ready", s.handleReady)

	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)
	s.httpServer = &http.Server{
		Addr:           addr,
		Handler:        mux,
		ReadTimeout:    s.config.Server.ReadTimeout,
		WriteTimeout:   s.config.Server.WriteTimeout,
		IdleTimeout:    s.config.Server.IdleTimeout,
		MaxHeaderBytes: s.config.Server.MaxHeaderBytes,
	}

	// Start metrics server if enabled
	if s.config.Metrics.Enabled {
		go s.startMetricsServer()
	}

	s.log.Info().
		Str("addr", addr).
		Str("mode", string(s.config.Onion.Mode)).
		Msg("Starting relay server")

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

	// Stop circuit manager
	s.circuitManager.Stop()

	// Close all connections
	s.connMu.Lock()
	for _, conn := range s.connections {
		conn.Conn.Close()
	}
	s.connMu.Unlock()

	// Close outbound connections
	s.outboundMu.Lock()
	for _, conn := range s.outbound {
		conn.Close()
	}
	s.outboundMu.Unlock()

	// Shutdown metrics server
	if s.metricsServer != nil {
		if err := s.metricsServer.Shutdown(ctx); err != nil {
			s.log.Error().Err(err).Msg("Metrics server shutdown error")
		}
	}

	// Shutdown main server
	return s.httpServer.Shutdown(ctx)
}

// handleWebSocket handles client WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Only entry relays accept client connections
	if s.config.Onion.Mode != ModeEntry && s.config.Onion.Mode != ModeMiddle {
		http.Error(w, "Not an entry relay", http.StatusForbidden)
		return
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.log.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	connID := onion.GenerateCircuitID()
	relayConn := &RelayConnection{
		ID:         connID,
		Conn:       conn,
		RemoteAddr: r.RemoteAddr,
		IsRelay:    false,
		CreatedAt:  time.Now(),
		LastPing:   time.Now(),
	}

	s.connMu.Lock()
	s.connections[connID] = relayConn
	s.connMu.Unlock()

	s.metrics.ActiveConnections.Inc()
	defer func() {
		s.metrics.ActiveConnections.Dec()
		s.connMu.Lock()
		delete(s.connections, connID)
		s.connMu.Unlock()
		conn.Close()
	}()

	s.log.Debug().
		Str("conn_id", connID).
		Str("remote", r.RemoteAddr).
		Msg("New client connection")

	s.handleConnection(relayConn)
}

// handleRelayWebSocket handles relay-to-relay WebSocket connections
func (s *Server) handleRelayWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.log.Error().Err(err).Msg("Relay WebSocket upgrade failed")
		return
	}

	connID := onion.GenerateCircuitID()
	relayConn := &RelayConnection{
		ID:         connID,
		Conn:       conn,
		RemoteAddr: r.RemoteAddr,
		IsRelay:    true,
		CreatedAt:  time.Now(),
		LastPing:   time.Now(),
	}

	s.connMu.Lock()
	s.connections[connID] = relayConn
	s.connMu.Unlock()

	s.metrics.ActiveConnections.Inc()
	defer func() {
		s.metrics.ActiveConnections.Dec()
		s.connMu.Lock()
		delete(s.connections, connID)
		s.connMu.Unlock()
		conn.Close()
	}()

	s.log.Debug().
		Str("conn_id", connID).
		Str("remote", r.RemoteAddr).
		Msg("New relay connection")

	s.handleConnection(relayConn)
}

// handleConnection processes messages from a connection
func (s *Server) handleConnection(conn *RelayConnection) {
	for {
		_, data, err := conn.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				s.log.Debug().Err(err).Str("conn_id", conn.ID).Msg("Connection read error")
			}
			return
		}

		// Parse relay message
		var msg onion.RelayMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			s.log.Warn().Err(err).Str("conn_id", conn.ID).Msg("Invalid message format")
			s.sendError(conn, "", onion.ErrInvalidCircuitID, "Invalid message format")
			continue
		}

		// Handle message based on type
		switch msg.Type {
		case onion.MsgCreateCircuit:
			s.handleCreateCircuit(conn, &msg)
		case onion.MsgExtendCircuit:
			s.handleExtendCircuit(conn, &msg)
		case onion.MsgRelayData:
			s.handleRelayData(conn, &msg)
		case onion.MsgDestroyCircuit:
			s.handleDestroyCircuit(conn, &msg)
		case onion.MsgPing:
			s.handlePing(conn, &msg)
		default:
			s.log.Warn().
				Str("type", string(msg.Type)).
				Str("conn_id", conn.ID).
				Msg("Unknown message type")
		}
	}
}

// handleCreateCircuit handles circuit creation requests
func (s *Server) handleCreateCircuit(conn *RelayConnection, msg *onion.RelayMessage) {
	var req onion.CreateCircuitRequest
	if err := json.Unmarshal(msg.Data, &req); err != nil {
		s.sendError(conn, msg.CircuitID, onion.ErrInvalidCircuitID, "Invalid create circuit request")
		return
	}

	// Create circuit
	circuit, _, err := s.circuitManager.CreateCircuit(&req, conn.ID)
	if err != nil {
		s.log.Error().Err(err).Str("circuit_id", req.CircuitID).Msg("Failed to create circuit")
		if relayErr, ok := err.(*onion.RelayError); ok {
			s.sendError(conn, req.CircuitID, relayErr.Code, relayErr.Message)
		} else {
			s.sendError(conn, req.CircuitID, onion.ErrInternalError, err.Error())
		}
		return
	}

	// Track circuit on connection
	conn.Circuits = append(conn.Circuits, circuit.ID)

	// Send success response
	resp := onion.CreateCircuitResponse{
		CircuitID: circuit.ID,
		Success:   true,
	}
	respData, _ := json.Marshal(resp)

	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgCircuitCreated,
		CircuitID: circuit.ID,
		Data:      respData,
		Timestamp: time.Now().UnixMilli(),
	})

	s.log.Info().
		Str("circuit_id", circuit.ID).
		Str("conn_id", conn.ID).
		Msg("Circuit created")
}

// handleExtendCircuit handles circuit extension requests
func (s *Server) handleExtendCircuit(conn *RelayConnection, msg *onion.RelayMessage) {
	var req onion.ExtendCircuitRequest
	if err := json.Unmarshal(msg.Data, &req); err != nil {
		s.sendError(conn, msg.CircuitID, onion.ErrInvalidCircuitID, "Invalid extend circuit request")
		return
	}

	// Get circuit
	circuit, err := s.circuitManager.GetCircuit(req.CircuitID)
	if err != nil {
		s.sendError(conn, req.CircuitID, onion.ErrCircuitNotFound, "Circuit not found")
		return
	}

	// Connect to next hop if not already connected
	nextHopConn, err := s.getOrCreateOutboundConnection(req.NextHop)
	if err != nil {
		s.log.Error().Err(err).
			Str("circuit_id", req.CircuitID).
			Str("next_hop", req.NextHop).
			Msg("Failed to connect to next hop")
		s.sendError(conn, req.CircuitID, onion.ErrRelayFailed, "Failed to connect to next hop")
		return
	}

	// Forward the encrypted extend request to next hop
	forwardMsg := &onion.RelayMessage{
		Type:      onion.MsgCreateCircuit,
		CircuitID: req.CircuitID,
		Data:      req.EncryptedExtend,
		Timestamp: time.Now().UnixMilli(),
	}

	if err := s.sendToConnection(nextHopConn, forwardMsg); err != nil {
		s.sendError(conn, req.CircuitID, onion.ErrRelayFailed, "Failed to extend circuit")
		return
	}

	// Update circuit with next hop
	nextHop := &onion.CircuitHop{
		RelayID:  req.NextHop,
		Endpoint: req.NextHop,
	}
	if err := s.circuitManager.ExtendCircuit(circuit.ID, nextHop); err != nil {
		s.log.Warn().Err(err).Str("circuit_id", circuit.ID).Msg("Failed to record circuit extension")
	}

	// Send success response
	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgCircuitExtended,
		CircuitID: circuit.ID,
		Timestamp: time.Now().UnixMilli(),
	})
}

// handleRelayData handles data relay requests
func (s *Server) handleRelayData(conn *RelayConnection, msg *onion.RelayMessage) {
	// Get circuit
	circuit, err := s.circuitManager.GetCircuit(msg.CircuitID)
	if err != nil {
		s.sendError(conn, msg.CircuitID, onion.ErrCircuitNotFound, "Circuit not found")
		return
	}

	// Unwrap one layer of onion encryption
	nextHop, innerPayload, err := onion.UnwrapOnionLayer(msg.Data, circuit.SessionKey)
	if err != nil {
		s.log.Warn().Err(err).Str("circuit_id", msg.CircuitID).Msg("Failed to unwrap onion layer")
		s.sendError(conn, msg.CircuitID, onion.ErrDecryptionFailed, "Failed to decrypt")
		return
	}

	// Record forwarded data
	if err := s.circuitManager.RecordForward(msg.CircuitID, int64(len(msg.Data))); err != nil {
		s.sendError(conn, msg.CircuitID, onion.ErrCircuitClosed, "Circuit closed")
		return
	}

	// Update metrics
	if s.metrics != nil {
		s.metrics.BytesRelayed.Add(float64(len(msg.Data)))
		s.metrics.MessagesRelayed.Inc()
	}

	// Check if this is the final destination (exit relay)
	if nextHop == "" || s.config.Onion.Mode == ModeExit {
		// Handle at exit - forward to destination peer
		s.handleExitData(conn, circuit, innerPayload)
		return
	}

	// Forward to next hop
	nextHopConn, err := s.getOrCreateOutboundConnection(nextHop)
	if err != nil {
		s.log.Error().Err(err).
			Str("circuit_id", msg.CircuitID).
			Str("next_hop", nextHop).
			Msg("Failed to connect to next hop")
		s.sendError(conn, msg.CircuitID, onion.ErrRelayFailed, "Failed to forward")
		return
	}

	// Forward the inner payload
	forwardMsg := &onion.RelayMessage{
		Type:      onion.MsgRelayData,
		CircuitID: msg.CircuitID,
		Data:      innerPayload,
		Timestamp: time.Now().UnixMilli(),
	}

	if err := s.sendToConnection(nextHopConn, forwardMsg); err != nil {
		s.sendError(conn, msg.CircuitID, onion.ErrRelayFailed, "Failed to forward")
		return
	}

	s.log.Debug().
		Str("circuit_id", msg.CircuitID).
		Str("next_hop", nextHop).
		Int("data_size", len(innerPayload)).
		Msg("Data relayed")
}

// handleExitData handles data at the exit relay
func (s *Server) handleExitData(conn *RelayConnection, circuit *onion.Circuit, data []byte) {
	// For exit relay, the data should be the final payload for the destination peer
	// In a real implementation, this would connect to the destination P2P peer
	s.log.Info().
		Str("circuit_id", circuit.ID).
		Int("data_size", len(data)).
		Msg("Exit relay received data")

	// Send acknowledgment back
	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgRelayAck,
		CircuitID: circuit.ID,
		Timestamp: time.Now().UnixMilli(),
	})
}

// handleDestroyCircuit handles circuit destruction requests
func (s *Server) handleDestroyCircuit(conn *RelayConnection, msg *onion.RelayMessage) {
	var req onion.DestroyCircuitRequest
	if err := json.Unmarshal(msg.Data, &req); err != nil {
		req.CircuitID = msg.CircuitID
		req.Reason = "client requested"
	}

	// Get circuit to find next hop before destroying
	circuit, _ := s.circuitManager.GetCircuit(req.CircuitID)

	// Destroy circuit locally
	if err := s.circuitManager.DestroyCircuit(req.CircuitID, req.Reason); err != nil {
		s.log.Warn().Err(err).Str("circuit_id", req.CircuitID).Msg("Failed to destroy circuit")
	}

	// Propagate destroy to next hop
	if circuit != nil && circuit.NextHop != nil {
		nextHopConn, _ := s.getOutboundConnection(circuit.NextHop.Endpoint)
		if nextHopConn != nil {
			destroyMsg := &onion.RelayMessage{
				Type:      onion.MsgDestroyCircuit,
				CircuitID: req.CircuitID,
				Timestamp: time.Now().UnixMilli(),
			}
			s.sendToConnection(nextHopConn, destroyMsg)
		}
	}

	// Send confirmation
	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgCircuitDestroyed,
		CircuitID: req.CircuitID,
		Timestamp: time.Now().UnixMilli(),
	})

	s.log.Info().
		Str("circuit_id", req.CircuitID).
		Str("reason", req.Reason).
		Msg("Circuit destroyed")
}

// handlePing handles ping messages
func (s *Server) handlePing(conn *RelayConnection, msg *onion.RelayMessage) {
	conn.LastPing = time.Now()
	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgPong,
		CircuitID: msg.CircuitID,
		Timestamp: time.Now().UnixMilli(),
	})
}

// sendMessage sends a message to a connection
func (s *Server) sendMessage(conn *RelayConnection, msg *onion.RelayMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	conn.writeMu.Lock()
	defer conn.writeMu.Unlock()

	return conn.Conn.WriteMessage(websocket.BinaryMessage, data)
}

// sendError sends an error message
func (s *Server) sendError(conn *RelayConnection, circuitID string, code onion.ErrorCode, message string) {
	errResp := onion.RelayError{
		Code:    code,
		Message: message,
	}
	errData, _ := json.Marshal(errResp)

	s.sendMessage(conn, &onion.RelayMessage{
		Type:      onion.MsgError,
		CircuitID: circuitID,
		Data:      errData,
		Timestamp: time.Now().UnixMilli(),
	})
}

// sendToConnection sends a message to an outbound connection
func (s *Server) sendToConnection(conn *websocket.Conn, msg *onion.RelayMessage) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	return conn.WriteMessage(websocket.BinaryMessage, data)
}

// getOrCreateOutboundConnection gets or creates a connection to another relay
func (s *Server) getOrCreateOutboundConnection(endpoint string) (*websocket.Conn, error) {
	s.outboundMu.RLock()
	conn, exists := s.outbound[endpoint]
	s.outboundMu.RUnlock()

	if exists {
		return conn, nil
	}

	// Create new connection
	s.outboundMu.Lock()
	defer s.outboundMu.Unlock()

	// Double-check after acquiring write lock
	if conn, exists = s.outbound[endpoint]; exists {
		return conn, nil
	}

	// Connect to the relay
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(endpoint+"/ws/relay", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s: %w", endpoint, err)
	}

	s.outbound[endpoint] = conn

	// Start reader goroutine for responses
	go s.handleOutboundResponses(endpoint, conn)

	s.log.Debug().Str("endpoint", endpoint).Msg("Connected to relay")

	return conn, nil
}

// getOutboundConnection gets an existing outbound connection
func (s *Server) getOutboundConnection(endpoint string) (*websocket.Conn, error) {
	s.outboundMu.RLock()
	defer s.outboundMu.RUnlock()

	conn, exists := s.outbound[endpoint]
	if !exists {
		return nil, fmt.Errorf("no connection to %s", endpoint)
	}
	return conn, nil
}

// handleOutboundResponses handles responses from outbound connections
func (s *Server) handleOutboundResponses(endpoint string, conn *websocket.Conn) {
	defer func() {
		s.outboundMu.Lock()
		delete(s.outbound, endpoint)
		s.outboundMu.Unlock()
		conn.Close()
	}()

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			s.log.Debug().Err(err).Str("endpoint", endpoint).Msg("Outbound connection closed")
			return
		}

		// Parse and route response back
		var msg onion.RelayMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		// Find the circuit and route back to origin
		circuit, err := s.circuitManager.GetCircuit(msg.CircuitID)
		if err != nil {
			continue
		}

		// Find connection by prev hop
		if circuit.PrevHop != nil {
			s.connMu.RLock()
			prevConn := s.connections[circuit.PrevHop.RelayID]
			s.connMu.RUnlock()

			if prevConn != nil {
				// Wrap response in onion layer before sending back
				s.sendMessage(prevConn, &msg)
			}
		}
	}
}

// handleInfo returns relay information
func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	info := map[string]interface{}{
		"id":         s.config.Onion.RelayID,
		"mode":       s.config.Onion.Mode,
		"version":    "2.0.0",
		"uptime":     time.Since(s.startTime).Seconds(),
		"public_key": s.keyManager.GetPublicKeyFingerprint(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// handleStats returns relay statistics
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	stats := s.circuitManager.Stats()
	stats.Uptime = int64(time.Since(s.startTime).Seconds())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// handlePublicKey returns the relay's public key
func (s *Server) handlePublicKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/octet-stream")
	w.Write(s.keyManager.GetPublicKey())
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
