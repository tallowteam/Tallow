// Package directory provides the relay directory server for onion routing.
package directory

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"sync"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/pkg/relay"
)

// RelayInfo contains information about a relay node
type RelayInfo struct {
	// ID is the unique relay identifier
	ID string `json:"id"`

	// PublicKey is the relay's ML-KEM-768 public key
	PublicKey []byte `json:"public_key"`

	// Endpoint is the WebSocket URL of the relay
	Endpoint string `json:"endpoint"`

	// Mode is the relay operating mode (entry, middle, exit)
	Mode string `json:"mode"`

	// Version is the relay software version
	Version string `json:"version"`

	// Capabilities are features supported by this relay
	Capabilities []string `json:"capabilities"`

	// MaxBandwidth is the maximum bandwidth in bytes/sec
	MaxBandwidth int64 `json:"max_bandwidth"`

	// CurrentLoad is the current load percentage (0-100)
	CurrentLoad float64 `json:"current_load"`

	// Uptime is the relay uptime in seconds
	Uptime int64 `json:"uptime"`

	// LastSeen is when the relay last sent a heartbeat
	LastSeen time.Time `json:"last_seen"`

	// RegisteredAt is when the relay first registered
	RegisteredAt time.Time `json:"registered_at"`

	// TrustScore is the relay's trust score (0-100)
	TrustScore float64 `json:"trust_score"`

	// Online indicates if the relay is currently reachable
	Online bool `json:"online"`

	// Country is the relay's country code (optional)
	Country string `json:"country,omitempty"`

	// ASN is the relay's autonomous system number (optional)
	ASN string `json:"asn,omitempty"`
}

// Server is the relay directory server
type Server struct {
	config      *relay.Config
	log         *logging.Logger
	metrics     *metrics.PrometheusMetrics
	relays      map[string]*RelayInfo
	mu          sync.RWMutex
	httpServer  *http.Server
	started     bool
	startTime   time.Time

	// Cleanup
	cleanupTicker *time.Ticker
	stopCleanup   chan struct{}
}

// NewServer creates a new directory server
func NewServer(cfg *relay.Config, log *logging.Logger, m *metrics.PrometheusMetrics) (*Server, error) {
	return &Server{
		config:      cfg,
		log:         log.WithComponent("directory-server"),
		metrics:     m,
		relays:      make(map[string]*RelayInfo),
		stopCleanup: make(chan struct{}),
	}, nil
}

// Start starts the directory server
func (s *Server) Start() error {
	s.started = true
	s.startTime = time.Now()

	// Start cleanup routine
	s.cleanupTicker = time.NewTicker(1 * time.Minute)
	go s.cleanupLoop()

	// Create HTTP mux
	mux := http.NewServeMux()

	// Directory endpoints
	mux.HandleFunc("/relays", s.handleRelays)
	mux.HandleFunc("/relays/", s.handleRelay)
	mux.HandleFunc("/relays/register", s.handleRegister)

	// Health endpoints
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/ready", s.handleReady)

	// Stats
	mux.HandleFunc("/stats", s.handleStats)

	addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)
	s.httpServer = &http.Server{
		Addr:           addr,
		Handler:        mux,
		ReadTimeout:    s.config.Server.ReadTimeout,
		WriteTimeout:   s.config.Server.WriteTimeout,
		IdleTimeout:    s.config.Server.IdleTimeout,
		MaxHeaderBytes: s.config.Server.MaxHeaderBytes,
	}

	s.log.Info().
		Str("addr", addr).
		Msg("Starting directory server")

	if s.config.TLS.Enabled {
		return s.httpServer.ListenAndServeTLS(s.config.TLS.CertFile, s.config.TLS.KeyFile)
	}
	return s.httpServer.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	if !s.started {
		return nil
	}

	close(s.stopCleanup)
	if s.cleanupTicker != nil {
		s.cleanupTicker.Stop()
	}

	return s.httpServer.Shutdown(ctx)
}

// cleanupLoop periodically removes stale relays
func (s *Server) cleanupLoop() {
	for {
		select {
		case <-s.stopCleanup:
			return
		case <-s.cleanupTicker.C:
			s.cleanupStaleRelays()
		}
	}
}

// cleanupStaleRelays removes relays that haven't sent a heartbeat recently
func (s *Server) cleanupStaleRelays() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	staleThreshold := 2 * time.Minute
	removed := 0

	for id, relay := range s.relays {
		if now.Sub(relay.LastSeen) > staleThreshold {
			relay.Online = false
			// Mark as offline but don't remove immediately
			if now.Sub(relay.LastSeen) > 10*time.Minute {
				delete(s.relays, id)
				removed++
			}
		}
	}

	if removed > 0 {
		s.log.Info().
			Int("removed", removed).
			Int("remaining", len(s.relays)).
			Msg("Cleaned up stale relays")
	}
}

// handleRelays handles GET /relays - list all relays
func (s *Server) handleRelays(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get query parameters for filtering
	mode := r.URL.Query().Get("mode")
	onlyOnline := r.URL.Query().Get("online") == "true"
	minTrust := 0.0
	if v := r.URL.Query().Get("min_trust"); v != "" {
		fmt.Sscanf(v, "%f", &minTrust)
	}

	s.mu.RLock()
	relays := make([]*RelayInfo, 0, len(s.relays))
	for _, relay := range s.relays {
		// Apply filters
		if mode != "" && relay.Mode != mode {
			continue
		}
		if onlyOnline && !relay.Online {
			continue
		}
		if relay.TrustScore < minTrust {
			continue
		}
		relays = append(relays, relay)
	}
	s.mu.RUnlock()

	// Sort by trust score (highest first)
	sort.Slice(relays, func(i, j int) bool {
		return relays[i].TrustScore > relays[j].TrustScore
	})

	// Return sanitized relay info (without private data)
	response := make([]map[string]interface{}, len(relays))
	for i, relay := range relays {
		response[i] = map[string]interface{}{
			"id":           relay.ID,
			"public_key":   relay.PublicKey,
			"endpoint":     relay.Endpoint,
			"mode":         relay.Mode,
			"capabilities": relay.Capabilities,
			"trust_score":  relay.TrustScore,
			"online":       relay.Online,
			"current_load": relay.CurrentLoad,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"relays": response,
		"count":  len(response),
	})
}

// handleRelay handles /relays/{id} endpoints
func (s *Server) handleRelay(w http.ResponseWriter, r *http.Request) {
	// Extract relay ID from path
	path := r.URL.Path
	if len(path) <= len("/relays/") {
		http.Error(w, "Relay ID required", http.StatusBadRequest)
		return
	}
	relayID := path[len("/relays/"):]

	// Check for /health suffix
	if len(relayID) > 7 && relayID[len(relayID)-7:] == "/health" {
		relayID = relayID[:len(relayID)-7]
		s.handleRelayHealth(w, r, relayID)
		return
	}

	switch r.Method {
	case http.MethodGet:
		s.getRelay(w, r, relayID)
	case http.MethodDelete:
		s.deleteRelay(w, r, relayID)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// getRelay returns information about a specific relay
func (s *Server) getRelay(w http.ResponseWriter, r *http.Request, relayID string) {
	s.mu.RLock()
	relay, exists := s.relays[relayID]
	s.mu.RUnlock()

	if !exists {
		http.Error(w, "Relay not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(relay)
}

// deleteRelay removes a relay from the directory
func (s *Server) deleteRelay(w http.ResponseWriter, r *http.Request, relayID string) {
	s.mu.Lock()
	_, exists := s.relays[relayID]
	if exists {
		delete(s.relays, relayID)
	}
	s.mu.Unlock()

	if !exists {
		http.Error(w, "Relay not found", http.StatusNotFound)
		return
	}

	s.log.Info().Str("relay_id", relayID).Msg("Relay unregistered")

	w.WriteHeader(http.StatusNoContent)
}

// handleRelayHealth returns health status for a specific relay
func (s *Server) handleRelayHealth(w http.ResponseWriter, r *http.Request, relayID string) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	relay, exists := s.relays[relayID]
	s.mu.RUnlock()

	if !exists {
		http.Error(w, "Relay not found", http.StatusNotFound)
		return
	}

	health := map[string]interface{}{
		"id":           relay.ID,
		"online":       relay.Online,
		"last_seen":    relay.LastSeen,
		"uptime":       relay.Uptime,
		"current_load": relay.CurrentLoad,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

// handleRegister handles POST /relays/register - register a new relay
func (s *Server) handleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		s.registerRelay(w, r)
	} else if r.Method == http.MethodPut {
		s.updateRelay(w, r)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// registerRelay registers a new relay
func (s *Server) registerRelay(w http.ResponseWriter, r *http.Request) {
	var info RelayInfo
	if err := json.NewDecoder(r.Body).Decode(&info); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if info.ID == "" || info.Endpoint == "" || info.Mode == "" {
		http.Error(w, "Missing required fields: id, endpoint, mode", http.StatusBadRequest)
		return
	}

	// Validate public key
	if len(info.PublicKey) == 0 {
		http.Error(w, "Missing public key", http.StatusBadRequest)
		return
	}

	// Set metadata
	now := time.Now()
	info.RegisteredAt = now
	info.LastSeen = now
	info.Online = true
	info.TrustScore = calculateInitialTrustScore(&info)

	s.mu.Lock()
	existing, exists := s.relays[info.ID]
	if exists {
		// Update existing relay
		info.RegisteredAt = existing.RegisteredAt
		info.TrustScore = existing.TrustScore // Preserve trust score
	}
	s.relays[info.ID] = &info
	s.mu.Unlock()

	action := "registered"
	if exists {
		action = "updated"
	}

	s.log.Info().
		Str("relay_id", info.ID).
		Str("endpoint", info.Endpoint).
		Str("mode", info.Mode).
		Float64("trust_score", info.TrustScore).
		Str("action", action).
		Msg("Relay " + action)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":     true,
		"id":          info.ID,
		"trust_score": info.TrustScore,
	})
}

// updateRelay updates relay status (heartbeat)
func (s *Server) updateRelay(w http.ResponseWriter, r *http.Request) {
	var update struct {
		ID          string  `json:"id"`
		CurrentLoad float64 `json:"current_load"`
		Uptime      int64   `json:"uptime"`
	}

	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	relay, exists := s.relays[update.ID]
	if exists {
		relay.LastSeen = time.Now()
		relay.CurrentLoad = update.CurrentLoad
		relay.Uptime = update.Uptime
		relay.Online = true

		// Slowly increase trust score for consistent uptime
		if relay.TrustScore < 100 {
			relay.TrustScore += 0.01
			if relay.TrustScore > 100 {
				relay.TrustScore = 100
			}
		}
	}
	s.mu.Unlock()

	if !exists {
		http.Error(w, "Relay not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
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
	if !s.started {
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

// handleStats returns directory statistics
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.RLock()
	totalRelays := len(s.relays)
	onlineRelays := 0
	byMode := make(map[string]int)

	for _, relay := range s.relays {
		if relay.Online {
			onlineRelays++
		}
		byMode[relay.Mode]++
	}
	s.mu.RUnlock()

	stats := map[string]interface{}{
		"total_relays":  totalRelays,
		"online_relays": onlineRelays,
		"by_mode":       byMode,
		"uptime":        time.Since(s.startTime).Seconds(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// calculateInitialTrustScore calculates initial trust score for a new relay
func calculateInitialTrustScore(info *RelayInfo) float64 {
	// Start with a base score
	score := 50.0

	// Bonus for having capabilities
	score += float64(len(info.Capabilities)) * 2

	// Bonus for version (newer versions get slightly higher score)
	if info.Version != "" {
		score += 5
	}

	// Cap at 70 for new relays (they need to prove themselves)
	if score > 70 {
		score = 70
	}

	return score
}
