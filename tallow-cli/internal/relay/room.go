// Package relay implements the tallow relay server.
package relay

import (
	"io"
	"sync"
	"time"
)

// Room represents a transfer room
type Room struct {
	ID        string
	CreatedAt time.Time
	ExpiresAt time.Time
	clients   []*Client
	clientsMu sync.RWMutex
	maxSize   int
	closed    bool
	closedMu  sync.RWMutex
	onClose   func()
}

// Client represents a connected client in a room
type Client struct {
	ID         string
	Conn       io.ReadWriteCloser
	Room       *Room
	JoinedAt   time.Time
	IsSender   bool
	RemoteAddr string
}

// NewRoom creates a new room
func NewRoom(id string, ttl time.Duration) *Room {
	if ttl <= 0 {
		ttl = 30 * time.Minute
	}

	return &Room{
		ID:        id,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(ttl),
		clients:   make([]*Client, 0, 2),
		maxSize:   2, // Default: sender + receiver
	}
}

// SetMaxSize sets the maximum number of clients
func (r *Room) SetMaxSize(size int) {
	r.maxSize = size
}

// SetOnClose sets the callback for room closure
func (r *Room) SetOnClose(fn func()) {
	r.onClose = fn
}

// AddClient adds a client to the room
func (r *Room) AddClient(client *Client) error {
	r.closedMu.RLock()
	if r.closed {
		r.closedMu.RUnlock()
		return ErrRoomClosed
	}
	r.closedMu.RUnlock()

	r.clientsMu.Lock()
	defer r.clientsMu.Unlock()

	if len(r.clients) >= r.maxSize {
		return ErrRoomFull
	}

	client.Room = r
	client.JoinedAt = time.Now()
	r.clients = append(r.clients, client)

	return nil
}

// RemoveClient removes a client from the room
func (r *Room) RemoveClient(clientID string) {
	r.clientsMu.Lock()
	defer r.clientsMu.Unlock()

	for i, c := range r.clients {
		if c.ID == clientID {
			r.clients = append(r.clients[:i], r.clients[i+1:]...)
			break
		}
	}

	// Close room if empty
	if len(r.clients) == 0 {
		go r.Close()
	}
}

// GetClients returns all clients in the room
func (r *Room) GetClients() []*Client {
	r.clientsMu.RLock()
	defer r.clientsMu.RUnlock()

	clients := make([]*Client, len(r.clients))
	copy(clients, r.clients)
	return clients
}

// GetPeer returns the peer of a client
func (r *Room) GetPeer(clientID string) *Client {
	r.clientsMu.RLock()
	defer r.clientsMu.RUnlock()

	for _, c := range r.clients {
		if c.ID != clientID {
			return c
		}
	}
	return nil
}

// ClientCount returns the number of clients
func (r *Room) ClientCount() int {
	r.clientsMu.RLock()
	defer r.clientsMu.RUnlock()
	return len(r.clients)
}

// IsFull returns true if the room is full
func (r *Room) IsFull() bool {
	r.clientsMu.RLock()
	defer r.clientsMu.RUnlock()
	return len(r.clients) >= r.maxSize
}

// IsExpired returns true if the room has expired
func (r *Room) IsExpired() bool {
	return time.Now().After(r.ExpiresAt)
}

// Extend extends the room's expiration
func (r *Room) Extend(duration time.Duration) {
	r.ExpiresAt = time.Now().Add(duration)
}

// Close closes the room and all client connections
func (r *Room) Close() {
	r.closedMu.Lock()
	if r.closed {
		r.closedMu.Unlock()
		return
	}
	r.closed = true
	r.closedMu.Unlock()

	r.clientsMu.Lock()
	clients := r.clients
	r.clients = nil
	r.clientsMu.Unlock()

	for _, c := range clients {
		if c.Conn != nil {
			c.Conn.Close()
		}
	}

	if r.onClose != nil {
		r.onClose()
	}
}

// IsClosed returns true if the room is closed
func (r *Room) IsClosed() bool {
	r.closedMu.RLock()
	defer r.closedMu.RUnlock()
	return r.closed
}

// RoomManager manages multiple rooms
type RoomManager struct {
	rooms   map[string]*Room
	roomsMu sync.RWMutex
	ttl     time.Duration
}

// NewRoomManager creates a new room manager
func NewRoomManager(defaultTTL time.Duration) *RoomManager {
	if defaultTTL <= 0 {
		defaultTTL = 30 * time.Minute
	}

	rm := &RoomManager{
		rooms: make(map[string]*Room),
		ttl:   defaultTTL,
	}

	// Start cleanup goroutine
	go rm.cleanupLoop()

	return rm
}

// CreateRoom creates a new room
func (rm *RoomManager) CreateRoom(id string) (*Room, error) {
	rm.roomsMu.Lock()
	defer rm.roomsMu.Unlock()

	if _, exists := rm.rooms[id]; exists {
		return nil, ErrRoomExists
	}

	room := NewRoom(id, rm.ttl)
	room.SetOnClose(func() {
		rm.removeRoom(id)
	})

	rm.rooms[id] = room
	return room, nil
}

// GetRoom returns a room by ID
func (rm *RoomManager) GetRoom(id string) *Room {
	rm.roomsMu.RLock()
	defer rm.roomsMu.RUnlock()
	return rm.rooms[id]
}

// GetOrCreateRoom returns an existing room or creates a new one
func (rm *RoomManager) GetOrCreateRoom(id string) *Room {
	rm.roomsMu.Lock()
	defer rm.roomsMu.Unlock()

	if room, exists := rm.rooms[id]; exists {
		return room
	}

	room := NewRoom(id, rm.ttl)
	room.SetOnClose(func() {
		rm.removeRoom(id)
	})

	rm.rooms[id] = room
	return room
}

// RemoveRoom removes a room
func (rm *RoomManager) RemoveRoom(id string) {
	rm.removeRoom(id)
}

func (rm *RoomManager) removeRoom(id string) {
	rm.roomsMu.Lock()
	defer rm.roomsMu.Unlock()
	delete(rm.rooms, id)
}

// RoomCount returns the number of rooms
func (rm *RoomManager) RoomCount() int {
	rm.roomsMu.RLock()
	defer rm.roomsMu.RUnlock()
	return len(rm.rooms)
}

// cleanupLoop periodically removes expired rooms
func (rm *RoomManager) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		rm.cleanupExpired()
	}
}

// cleanupExpired removes all expired rooms
func (rm *RoomManager) cleanupExpired() {
	rm.roomsMu.Lock()
	defer rm.roomsMu.Unlock()

	for id, room := range rm.rooms {
		if room.IsExpired() || room.IsClosed() {
			room.Close()
			delete(rm.rooms, id)
		}
	}
}

// Stats returns statistics about the room manager
type RoomManagerStats struct {
	TotalRooms   int
	ActiveRooms  int
	TotalClients int
}

// Stats returns current statistics
func (rm *RoomManager) Stats() RoomManagerStats {
	rm.roomsMu.RLock()
	defer rm.roomsMu.RUnlock()

	stats := RoomManagerStats{
		TotalRooms: len(rm.rooms),
	}

	for _, room := range rm.rooms {
		if !room.IsClosed() {
			stats.ActiveRooms++
			stats.TotalClients += room.ClientCount()
		}
	}

	return stats
}
