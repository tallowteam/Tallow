package room

import (
	"errors"
	"sync"
	"time"

	"github.com/tallow/tallow-relay/internal/bridge"
)

var (
	// ErrRoomFull is returned when trying to add a peer to a full room
	ErrRoomFull = errors.New("room is full")
	// ErrRoomClosed is returned when trying to interact with a closed room
	ErrRoomClosed = errors.New("room is closed")
	// ErrPeerAlreadyInRoom is returned when a peer is already in the room
	ErrPeerAlreadyInRoom = errors.New("peer already in room")
)

// Room represents a relay room where two peers can connect
type Room struct {
	id         string
	code       string
	expiresAt  time.Time
	createdAt  time.Time
	peers      []*bridge.Peer
	peerJoined chan struct{}
	closed     chan struct{}
	isClosed   bool
	mu         sync.RWMutex
}

// NewRoom creates a new room
func NewRoom(id, code string, expiry time.Duration) *Room {
	return &Room{
		id:         id,
		code:       code,
		expiresAt:  time.Now().Add(expiry),
		createdAt:  time.Now(),
		peers:      make([]*bridge.Peer, 0, 2),
		peerJoined: make(chan struct{}, 1),
		closed:     make(chan struct{}),
	}
}

// ID returns the room's unique identifier
func (r *Room) ID() string {
	return r.id
}

// Code returns the room's human-readable code
func (r *Room) Code() string {
	return r.code
}

// ExpiresAt returns when the room expires
func (r *Room) ExpiresAt() time.Time {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.expiresAt
}

// CreatedAt returns when the room was created
func (r *Room) CreatedAt() time.Time {
	return r.createdAt
}

// IsExpired checks if the room has expired
func (r *Room) IsExpired() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return time.Now().After(r.expiresAt)
}

// IsFull checks if the room has two peers
func (r *Room) IsFull() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.peers) >= 2
}

// PeerCount returns the number of peers in the room
func (r *Room) PeerCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.peers)
}

// AddPeer adds a peer to the room
func (r *Room) AddPeer(peer *bridge.Peer, isCreator bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.isClosed {
		return ErrRoomClosed
	}

	if len(r.peers) >= 2 {
		return ErrRoomFull
	}

	// Check if peer is already in room
	for _, p := range r.peers {
		if p == peer {
			return ErrPeerAlreadyInRoom
		}
	}

	r.peers = append(r.peers, peer)
	peer.SetRoom(r.id, isCreator)

	// Signal that a peer has joined (for the creator to know)
	if !isCreator && len(r.peers) == 2 {
		select {
		case r.peerJoined <- struct{}{}:
		default:
		}
	}

	return nil
}

// RemovePeer removes a peer from the room
func (r *Room) RemovePeer(peer *bridge.Peer) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for i, p := range r.peers {
		if p == peer {
			r.peers = append(r.peers[:i], r.peers[i+1:]...)
			break
		}
	}
}

// Peers returns all peers in the room
func (r *Room) Peers() []*bridge.Peer {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*bridge.Peer, len(r.peers))
	copy(result, r.peers)
	return result
}

// PeerJoined returns a channel that signals when a peer joins
func (r *Room) PeerJoined() <-chan struct{} {
	return r.peerJoined
}

// Closed returns a channel that's closed when the room is closed
func (r *Room) Closed() <-chan struct{} {
	return r.closed
}

// Close closes the room and disconnects all peers
func (r *Room) Close() {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.isClosed {
		return
	}

	r.isClosed = true
	close(r.closed)

	// Close all peer connections
	for _, peer := range r.peers {
		peer.Close()
	}
	r.peers = nil
}

// ExtendExpiry extends the room's expiry time
func (r *Room) ExtendExpiry(duration time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.expiresAt = r.expiresAt.Add(duration)
}

// SetExpiry sets a new expiry time
func (r *Room) SetExpiry(expiresAt time.Time) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.expiresAt = expiresAt
}

// TimeRemaining returns the time until the room expires
func (r *Room) TimeRemaining() time.Duration {
	r.mu.RLock()
	defer r.mu.RUnlock()
	remaining := time.Until(r.expiresAt)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// Stats returns room statistics
type RoomStats struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	PeerCount   int       `json:"peer_count"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	TimeRemaining string  `json:"time_remaining"`
}

// Stats returns statistics about the room
func (r *Room) Stats() RoomStats {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return RoomStats{
		ID:            r.id,
		Code:          r.code,
		PeerCount:     len(r.peers),
		CreatedAt:     r.createdAt,
		ExpiresAt:     r.expiresAt,
		TimeRemaining: time.Until(r.expiresAt).Round(time.Second).String(),
	}
}
