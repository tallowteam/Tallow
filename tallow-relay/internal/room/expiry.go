package room

import (
	"sync"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
)

// ExpiryManager handles room expiration
type ExpiryManager struct {
	log      *logging.Logger
	rooms    map[string]*Room
	mu       sync.RWMutex
	interval time.Duration
	stopCh   chan struct{}
	doneCh   chan struct{}
	onExpire func(roomID string)
}

// NewExpiryManager creates a new expiry manager
func NewExpiryManager(interval time.Duration, log *logging.Logger, onExpire func(string)) *ExpiryManager {
	return &ExpiryManager{
		log:      log.WithComponent("expiry"),
		rooms:    make(map[string]*Room),
		interval: interval,
		stopCh:   make(chan struct{}),
		doneCh:   make(chan struct{}),
		onExpire: onExpire,
	}
}

// Start begins the expiry checking loop
func (em *ExpiryManager) Start() {
	go em.run()
}

// Stop stops the expiry manager
func (em *ExpiryManager) Stop() {
	close(em.stopCh)
	<-em.doneCh
}

// Add adds a room to be monitored for expiry
func (em *ExpiryManager) Add(r *Room) {
	em.mu.Lock()
	defer em.mu.Unlock()
	em.rooms[r.ID()] = r
}

// Remove removes a room from expiry monitoring
func (em *ExpiryManager) Remove(roomID string) {
	em.mu.Lock()
	defer em.mu.Unlock()
	delete(em.rooms, roomID)
}

// run is the main expiry checking loop
func (em *ExpiryManager) run() {
	defer close(em.doneCh)

	ticker := time.NewTicker(em.interval)
	defer ticker.Stop()

	for {
		select {
		case <-em.stopCh:
			return
		case <-ticker.C:
			em.checkExpired()
		}
	}
}

// checkExpired checks for and handles expired rooms
func (em *ExpiryManager) checkExpired() {
	em.mu.RLock()
	var expired []string
	now := time.Now()

	for id, r := range em.rooms {
		if r.IsExpired() || r.ExpiresAt().Before(now) {
			expired = append(expired, id)
		}
	}
	em.mu.RUnlock()

	// Process expired rooms
	for _, id := range expired {
		em.mu.Lock()
		r, exists := em.rooms[id]
		if exists {
			delete(em.rooms, id)
		}
		em.mu.Unlock()

		if exists {
			em.log.Info().
				Str("room_id", id).
				Time("expired_at", r.ExpiresAt()).
				Msg("Room expired")

			r.Close()

			if em.onExpire != nil {
				em.onExpire(id)
			}
		}
	}

	if len(expired) > 0 {
		em.log.Debug().Int("count", len(expired)).Msg("Cleaned up expired rooms")
	}
}

// Count returns the number of rooms being monitored
func (em *ExpiryManager) Count() int {
	em.mu.RLock()
	defer em.mu.RUnlock()
	return len(em.rooms)
}

// ExtendExpiry extends a room's expiry time
func (em *ExpiryManager) ExtendExpiry(roomID string, duration time.Duration) bool {
	em.mu.RLock()
	r, exists := em.rooms[roomID]
	em.mu.RUnlock()

	if !exists {
		return false
	}

	r.ExtendExpiry(duration)
	return true
}
