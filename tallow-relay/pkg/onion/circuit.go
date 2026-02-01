// Package onion provides circuit management for onion routing.
package onion

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
)

// CircuitManager manages onion routing circuits
type CircuitManager struct {
	circuits        map[string]*Circuit
	circuitsByPrev  map[string][]string // prevHopID -> circuitIDs
	circuitsByNext  map[string][]string // nextHopID -> circuitIDs
	mu              sync.RWMutex
	log             *logging.Logger
	metrics         *metrics.PrometheusMetrics
	keyManager      *KeyManager
	config          CircuitConfig

	// Cleanup
	cleanupTicker   *time.Ticker
	stopCleanup     chan struct{}
}

// CircuitConfig holds circuit manager configuration
type CircuitConfig struct {
	// MaxCircuits is the maximum number of concurrent circuits
	MaxCircuits int

	// CircuitTimeout is how long a circuit can be idle
	CircuitTimeout time.Duration

	// CleanupInterval is how often to clean up expired circuits
	CleanupInterval time.Duration

	// MaxBytesPerCircuit limits bytes per circuit (0 = unlimited)
	MaxBytesPerCircuit int64
}

// DefaultCircuitConfig returns default circuit configuration
func DefaultCircuitConfig() CircuitConfig {
	return CircuitConfig{
		MaxCircuits:        10000,
		CircuitTimeout:     30 * time.Minute,
		CleanupInterval:    1 * time.Minute,
		MaxBytesPerCircuit: 0, // unlimited
	}
}

// NewCircuitManager creates a new circuit manager
func NewCircuitManager(cfg CircuitConfig, log *logging.Logger, m *metrics.PrometheusMetrics, km *KeyManager) *CircuitManager {
	return &CircuitManager{
		circuits:       make(map[string]*Circuit),
		circuitsByPrev: make(map[string][]string),
		circuitsByNext: make(map[string][]string),
		log:            log.WithComponent("circuit-manager"),
		metrics:        m,
		keyManager:     km,
		config:         cfg,
		stopCleanup:    make(chan struct{}),
	}
}

// Start begins the circuit manager
func (cm *CircuitManager) Start() {
	cm.cleanupTicker = time.NewTicker(cm.config.CleanupInterval)
	go cm.cleanupLoop()
	cm.log.Info().Msg("Circuit manager started")
}

// Stop stops the circuit manager
func (cm *CircuitManager) Stop() {
	close(cm.stopCleanup)
	if cm.cleanupTicker != nil {
		cm.cleanupTicker.Stop()
	}

	// Close all circuits
	cm.mu.Lock()
	for _, circuit := range cm.circuits {
		cm.closeCircuitUnsafe(circuit)
	}
	cm.mu.Unlock()

	cm.log.Info().Msg("Circuit manager stopped")
}

// cleanupLoop periodically cleans up expired circuits
func (cm *CircuitManager) cleanupLoop() {
	for {
		select {
		case <-cm.stopCleanup:
			return
		case <-cm.cleanupTicker.C:
			cm.cleanupExpiredCircuits()
		}
	}
}

// cleanupExpiredCircuits removes circuits that have been idle too long
func (cm *CircuitManager) cleanupExpiredCircuits() {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	now := time.Now()
	expired := make([]string, 0)

	for id, circuit := range cm.circuits {
		if now.Sub(circuit.LastActivity) > cm.config.CircuitTimeout {
			expired = append(expired, id)
		}
	}

	for _, id := range expired {
		if circuit, ok := cm.circuits[id]; ok {
			cm.log.Debug().
				Str("circuit_id", id).
				Dur("idle_time", now.Sub(circuit.LastActivity)).
				Msg("Cleaning up expired circuit")
			cm.closeCircuitUnsafe(circuit)
		}
	}

	if len(expired) > 0 {
		cm.log.Info().
			Int("expired_count", len(expired)).
			Int("active_count", len(cm.circuits)).
			Msg("Circuit cleanup completed")
	}
}

// CreateCircuit creates a new circuit with the given parameters
func (cm *CircuitManager) CreateCircuit(req *CreateCircuitRequest, prevHopID string) (*Circuit, []byte, error) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	// Check if we've hit the circuit limit
	if len(cm.circuits) >= cm.config.MaxCircuits {
		return nil, nil, NewRelayError(ErrRateLimited, "Maximum circuits reached")
	}

	// Check if circuit ID already exists
	if _, exists := cm.circuits[req.CircuitID]; exists {
		return nil, nil, NewRelayError(ErrCircuitExists, "Circuit ID already in use")
	}

	// Decapsulate the key using our private key
	sharedSecret, err := cm.keyManager.Decapsulate(req.Ciphertext)
	if err != nil {
		return nil, nil, NewRelayError(ErrKeyExchangeFailed, "Failed to decapsulate key")
	}

	// Derive session key from shared secret
	sessionKey := DeriveSessionKey(sharedSecret, []byte(req.CircuitID))

	// Create circuit
	circuit := &Circuit{
		ID:         req.CircuitID,
		SessionKey: sessionKey,
		State:      CircuitStateActive,
		CreatedAt:  time.Now(),
		LastActivity: time.Now(),
	}

	// Set previous hop if provided
	if prevHopID != "" {
		circuit.PrevHop = &CircuitHop{
			RelayID: prevHopID,
		}
		cm.circuitsByPrev[prevHopID] = append(cm.circuitsByPrev[prevHopID], req.CircuitID)
	}

	// Store circuit
	cm.circuits[req.CircuitID] = circuit

	cm.log.Info().
		Str("circuit_id", req.CircuitID).
		Str("prev_hop", prevHopID).
		Msg("Circuit created")

	// Update metrics
	if cm.metrics != nil {
		cm.metrics.ActiveRooms.Inc()
		cm.metrics.RoomsCreated.Inc()
	}

	return circuit, sessionKey, nil
}

// ExtendCircuit extends a circuit to the next hop
func (cm *CircuitManager) ExtendCircuit(circuitID string, nextHop *CircuitHop) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	circuit, ok := cm.circuits[circuitID]
	if !ok {
		return NewRelayError(ErrCircuitNotFound, "Circuit not found")
	}

	if circuit.State != CircuitStateActive {
		return NewRelayError(ErrCircuitClosed, "Circuit is not active")
	}

	circuit.NextHop = nextHop
	circuit.LastActivity = time.Now()

	// Index by next hop
	cm.circuitsByNext[nextHop.RelayID] = append(cm.circuitsByNext[nextHop.RelayID], circuitID)

	cm.log.Debug().
		Str("circuit_id", circuitID).
		Str("next_hop", nextHop.RelayID).
		Msg("Circuit extended")

	return nil
}

// GetCircuit retrieves a circuit by ID
func (cm *CircuitManager) GetCircuit(circuitID string) (*Circuit, error) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	circuit, ok := cm.circuits[circuitID]
	if !ok {
		return nil, NewRelayError(ErrCircuitNotFound, "Circuit not found")
	}

	return circuit, nil
}

// UpdateActivity updates the last activity time for a circuit
func (cm *CircuitManager) UpdateActivity(circuitID string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if circuit, ok := cm.circuits[circuitID]; ok {
		circuit.LastActivity = time.Now()
	}
}

// RecordForward records bytes and messages forwarded on a circuit
func (cm *CircuitManager) RecordForward(circuitID string, bytes int64) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	circuit, ok := cm.circuits[circuitID]
	if !ok {
		return NewRelayError(ErrCircuitNotFound, "Circuit not found")
	}

	circuit.BytesForwarded += bytes
	circuit.MessagesForwarded++
	circuit.LastActivity = time.Now()

	// Check byte limit
	if cm.config.MaxBytesPerCircuit > 0 && circuit.BytesForwarded > cm.config.MaxBytesPerCircuit {
		cm.log.Warn().
			Str("circuit_id", circuitID).
			Int64("bytes", circuit.BytesForwarded).
			Int64("limit", cm.config.MaxBytesPerCircuit).
			Msg("Circuit byte limit exceeded")
		cm.closeCircuitUnsafe(circuit)
		return NewRelayError(ErrCircuitClosed, "Byte limit exceeded")
	}

	return nil
}

// DestroyCircuit destroys a circuit
func (cm *CircuitManager) DestroyCircuit(circuitID string, reason string) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	circuit, ok := cm.circuits[circuitID]
	if !ok {
		return NewRelayError(ErrCircuitNotFound, "Circuit not found")
	}

	cm.log.Info().
		Str("circuit_id", circuitID).
		Str("reason", reason).
		Int64("bytes_forwarded", circuit.BytesForwarded).
		Int64("messages_forwarded", circuit.MessagesForwarded).
		Msg("Destroying circuit")

	cm.closeCircuitUnsafe(circuit)
	return nil
}

// closeCircuitUnsafe closes a circuit (must hold lock)
func (cm *CircuitManager) closeCircuitUnsafe(circuit *Circuit) {
	// Update state
	circuit.State = CircuitStateClosed

	// Securely wipe session key
	if circuit.SessionKey != nil {
		for i := range circuit.SessionKey {
			circuit.SessionKey[i] = 0
		}
	}

	// Remove from indices
	if circuit.PrevHop != nil {
		cm.removeFromIndex(cm.circuitsByPrev, circuit.PrevHop.RelayID, circuit.ID)
	}
	if circuit.NextHop != nil {
		cm.removeFromIndex(cm.circuitsByNext, circuit.NextHop.RelayID, circuit.ID)
	}

	// Remove circuit
	delete(cm.circuits, circuit.ID)

	// Update metrics
	if cm.metrics != nil {
		cm.metrics.ActiveRooms.Dec()
	}
}

// removeFromIndex removes a circuit ID from an index
func (cm *CircuitManager) removeFromIndex(index map[string][]string, key, circuitID string) {
	ids := index[key]
	for i, id := range ids {
		if id == circuitID {
			index[key] = append(ids[:i], ids[i+1:]...)
			break
		}
	}
	if len(index[key]) == 0 {
		delete(index, key)
	}
}

// GetCircuitsByPrevHop returns circuits with a given previous hop
func (cm *CircuitManager) GetCircuitsByPrevHop(prevHopID string) []*Circuit {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	ids := cm.circuitsByPrev[prevHopID]
	circuits := make([]*Circuit, 0, len(ids))
	for _, id := range ids {
		if circuit, ok := cm.circuits[id]; ok {
			circuits = append(circuits, circuit)
		}
	}
	return circuits
}

// GetCircuitsByNextHop returns circuits with a given next hop
func (cm *CircuitManager) GetCircuitsByNextHop(nextHopID string) []*Circuit {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	ids := cm.circuitsByNext[nextHopID]
	circuits := make([]*Circuit, 0, len(ids))
	for _, id := range ids {
		if circuit, ok := cm.circuits[id]; ok {
			circuits = append(circuits, circuit)
		}
	}
	return circuits
}

// Stats returns circuit manager statistics
func (cm *CircuitManager) Stats() RelayStats {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	var totalBytes, totalMessages int64
	for _, circuit := range cm.circuits {
		totalBytes += circuit.BytesForwarded
		totalMessages += circuit.MessagesForwarded
	}

	return RelayStats{
		ActiveCircuits:    len(cm.circuits),
		BytesForwarded:    totalBytes,
		MessagesForwarded: totalMessages,
	}
}

// GenerateCircuitID generates a unique circuit ID
func GenerateCircuitID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to timestamp-based ID
		return fmt.Sprintf("circuit-%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}
