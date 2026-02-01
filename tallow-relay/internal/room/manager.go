package room

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
)

var (
	// ErrMaxRoomsReached is returned when the maximum number of rooms is reached
	ErrMaxRoomsReached = errors.New("maximum number of rooms reached")
	// ErrRoomNotFound is returned when a room is not found
	ErrRoomNotFound = errors.New("room not found")
	// ErrCodeCollision is returned when code generation fails due to collisions
	ErrCodeCollision = errors.New("failed to generate unique code")
)

// ManagerConfig holds room manager configuration
type ManagerConfig struct {
	MaxRooms        int
	DefaultExpiry   time.Duration
	MaxExpiry       time.Duration
	CleanupInterval time.Duration
	CodeWordCount   int
}

// Manager manages room lifecycle
type Manager struct {
	config       ManagerConfig
	log          *logging.Logger
	metrics      *metrics.PrometheusMetrics
	rooms        map[string]*Room    // id -> room
	codeIndex    map[string]string   // code -> id
	codeGen      *CodeGenerator
	expiry       *ExpiryManager
	mu           sync.RWMutex
	totalCreated int64
	totalExpired int64
}

// ManagerStats holds manager statistics
type ManagerStats struct {
	ActiveRooms  int
	TotalCreated int64
	TotalExpired int64
}

// NewManager creates a new room manager
func NewManager(cfg ManagerConfig, log *logging.Logger, m *metrics.PrometheusMetrics) *Manager {
	mgr := &Manager{
		config:    cfg,
		log:       log.WithComponent("room-manager"),
		metrics:   m,
		rooms:     make(map[string]*Room),
		codeIndex: make(map[string]string),
		codeGen:   NewCodeGenerator(cfg.CodeWordCount),
	}

	// Create expiry manager with callback
	mgr.expiry = NewExpiryManager(cfg.CleanupInterval, log, func(roomID string) {
		mgr.mu.Lock()
		if r, exists := mgr.rooms[roomID]; exists {
			delete(mgr.codeIndex, r.Code())
			delete(mgr.rooms, roomID)
			mgr.totalExpired++
		}
		mgr.mu.Unlock()

		if m != nil {
			m.RoomsExpired.Inc()
			m.ActiveRooms.Dec()
		}
	})

	return mgr
}

// Start starts the room manager
func (m *Manager) Start() {
	m.expiry.Start()
	m.log.Info().
		Int("max_rooms", m.config.MaxRooms).
		Dur("default_expiry", m.config.DefaultExpiry).
		Msg("Room manager started")
}

// Stop stops the room manager
func (m *Manager) Stop() {
	m.expiry.Stop()

	// Close all rooms
	m.mu.Lock()
	for _, r := range m.rooms {
		r.Close()
	}
	m.rooms = make(map[string]*Room)
	m.codeIndex = make(map[string]string)
	m.mu.Unlock()

	m.log.Info().Msg("Room manager stopped")
}

// CreateRoom creates a new room
func (m *Manager) CreateRoom(expiry time.Duration) (*Room, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check room limit
	if len(m.rooms) >= m.config.MaxRooms {
		return nil, ErrMaxRoomsReached
	}

	// Generate unique ID
	id, err := generateID()
	if err != nil {
		return nil, err
	}

	// Generate unique code (retry if collision)
	var code string
	for i := 0; i < 10; i++ {
		code, err = m.codeGen.Generate()
		if err != nil {
			return nil, err
		}
		if _, exists := m.codeIndex[code]; !exists {
			break
		}
		code = ""
	}
	if code == "" {
		return nil, ErrCodeCollision
	}

	// Create room
	room := NewRoom(id, code, expiry)

	// Store room
	m.rooms[id] = room
	m.codeIndex[code] = id
	m.totalCreated++

	// Add to expiry manager
	m.expiry.Add(room)

	// Update metrics
	if m.metrics != nil {
		m.metrics.RoomsCreated.Inc()
		m.metrics.ActiveRooms.Inc()
	}

	m.log.Debug().
		Str("room_id", id).
		Str("code", code).
		Dur("expiry", expiry).
		Msg("Room created")

	return room, nil
}

// GetRoom returns a room by ID
func (m *Manager) GetRoom(id string) (*Room, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	room, exists := m.rooms[id]
	if !exists {
		return nil, ErrRoomNotFound
	}
	return room, nil
}

// GetRoomByCode returns a room by its human-readable code
func (m *Manager) GetRoomByCode(code string) (*Room, error) {
	// Normalize the code
	code = m.codeGen.Normalize(code)

	m.mu.RLock()
	defer m.mu.RUnlock()

	id, exists := m.codeIndex[code]
	if !exists {
		return nil, ErrRoomNotFound
	}

	room, exists := m.rooms[id]
	if !exists {
		return nil, ErrRoomNotFound
	}

	return room, nil
}

// RemoveRoom removes a room
func (m *Manager) RemoveRoom(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	room, exists := m.rooms[id]
	if !exists {
		return
	}

	// Remove from indices
	delete(m.codeIndex, room.Code())
	delete(m.rooms, id)

	// Remove from expiry manager
	m.expiry.Remove(id)

	// Update metrics
	if m.metrics != nil {
		m.metrics.ActiveRooms.Dec()
	}

	m.log.Debug().Str("room_id", id).Msg("Room removed")
}

// Stats returns manager statistics
func (m *Manager) Stats() ManagerStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return ManagerStats{
		ActiveRooms:  len(m.rooms),
		TotalCreated: m.totalCreated,
		TotalExpired: m.totalExpired,
	}
}

// ListRooms returns all active rooms (for admin purposes)
func (m *Manager) ListRooms() []RoomStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := make([]RoomStats, 0, len(m.rooms))
	for _, r := range m.rooms {
		stats = append(stats, r.Stats())
	}
	return stats
}

// CleanupEmpty removes rooms with no peers
func (m *Manager) CleanupEmpty() int {
	m.mu.Lock()
	defer m.mu.Unlock()

	var removed int
	for id, r := range m.rooms {
		if r.PeerCount() == 0 && time.Since(r.CreatedAt()) > time.Minute {
			delete(m.codeIndex, r.Code())
			delete(m.rooms, id)
			m.expiry.Remove(id)
			r.Close()
			removed++
		}
	}

	if removed > 0 && m.metrics != nil {
		m.metrics.ActiveRooms.Sub(float64(removed))
	}

	return removed
}

// generateID generates a random room ID
func generateID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ValidateCode checks if a code is valid
func (m *Manager) ValidateCode(code string) bool {
	return m.codeGen.Validate(strings.ToLower(code))
}
