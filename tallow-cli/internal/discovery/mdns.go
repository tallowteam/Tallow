// Package discovery provides local network discovery using mDNS.
package discovery

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/grandcat/zeroconf"
)

const (
	// ServiceType is the mDNS service type for tallow
	ServiceType = "_tallow._tcp"
	// ServiceDomain is the mDNS domain
	ServiceDomain = "local."
)

// Peer represents a discovered peer
type Peer struct {
	Name     string
	HostName string
	IP       string
	Port     int
	RoomCode string
	TxtData  map[string]string
}

// Discovery provides mDNS discovery functionality
type Discovery struct {
	resolver   *zeroconf.Resolver
	server     *zeroconf.Server
	peers      map[string]*Peer
	peersMu    sync.RWMutex
	onDiscover func(*Peer)
	onRemove   func(*Peer)
}

// NewDiscovery creates a new Discovery instance
func NewDiscovery() *Discovery {
	return &Discovery{
		peers: make(map[string]*Peer),
	}
}

// SetOnDiscover sets the callback for peer discovery
func (d *Discovery) SetOnDiscover(fn func(*Peer)) {
	d.onDiscover = fn
}

// SetOnRemove sets the callback for peer removal
func (d *Discovery) SetOnRemove(fn func(*Peer)) {
	d.onRemove = fn
}

// Browse starts browsing for tallow peers
func (d *Discovery) Browse(ctx context.Context) error {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		return fmt.Errorf("failed to create resolver: %w", err)
	}
	d.resolver = resolver

	entries := make(chan *zeroconf.ServiceEntry)

	go func() {
		for {
			select {
			case entry := <-entries:
				if entry == nil {
					continue
				}
				d.handleEntry(entry)
			case <-ctx.Done():
				return
			}
		}
	}()

	err = resolver.Browse(ctx, ServiceType, ServiceDomain, entries)
	if err != nil {
		return fmt.Errorf("failed to browse: %w", err)
	}

	return nil
}

// handleEntry processes a discovered service entry
func (d *Discovery) handleEntry(entry *zeroconf.ServiceEntry) {
	// Extract IP address
	var ip string
	if len(entry.AddrIPv4) > 0 {
		ip = entry.AddrIPv4[0].String()
	} else if len(entry.AddrIPv6) > 0 {
		ip = entry.AddrIPv6[0].String()
	} else {
		return // No IP address
	}

	// Parse TXT records
	txtData := make(map[string]string)
	for _, txt := range entry.Text {
		for i := 0; i < len(txt); i++ {
			if txt[i] == '=' {
				txtData[txt[:i]] = txt[i+1:]
				break
			}
		}
	}

	peer := &Peer{
		Name:     entry.Instance,
		HostName: entry.HostName,
		IP:       ip,
		Port:     entry.Port,
		RoomCode: txtData["room"],
		TxtData:  txtData,
	}

	// Store peer
	d.peersMu.Lock()
	key := fmt.Sprintf("%s:%d", ip, entry.Port)
	_, exists := d.peers[key]
	d.peers[key] = peer
	d.peersMu.Unlock()

	// Call discovery callback
	if !exists && d.onDiscover != nil {
		d.onDiscover(peer)
	}
}

// GetPeers returns all discovered peers
func (d *Discovery) GetPeers() []*Peer {
	d.peersMu.RLock()
	defer d.peersMu.RUnlock()

	peers := make([]*Peer, 0, len(d.peers))
	for _, peer := range d.peers {
		peers = append(peers, peer)
	}
	return peers
}

// GetPeerByRoom finds a peer by room code
func (d *Discovery) GetPeerByRoom(roomCode string) *Peer {
	d.peersMu.RLock()
	defer d.peersMu.RUnlock()

	for _, peer := range d.peers {
		if peer.RoomCode == roomCode {
			return peer
		}
	}
	return nil
}

// BrowseWithTimeout browses for a specific duration
func (d *Discovery) BrowseWithTimeout(timeout time.Duration) ([]*Peer, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	if err := d.Browse(ctx); err != nil {
		return nil, err
	}

	<-ctx.Done()
	return d.GetPeers(), nil
}

// WaitForPeer waits for a specific peer by room code
func (d *Discovery) WaitForPeer(ctx context.Context, roomCode string) (*Peer, error) {
	found := make(chan *Peer, 1)

	d.SetOnDiscover(func(peer *Peer) {
		if peer.RoomCode == roomCode {
			select {
			case found <- peer:
			default:
			}
		}
	})

	if err := d.Browse(ctx); err != nil {
		return nil, err
	}

	select {
	case peer := <-found:
		return peer, nil
	case <-ctx.Done():
		return nil, errors.New("peer not found")
	}
}

// Stop stops the discovery
func (d *Discovery) Stop() {
	// zeroconf handles cleanup internally
}

// Clear clears the discovered peers list
func (d *Discovery) Clear() {
	d.peersMu.Lock()
	d.peers = make(map[string]*Peer)
	d.peersMu.Unlock()
}
