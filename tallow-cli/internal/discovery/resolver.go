package discovery

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/grandcat/zeroconf"
)

// Resolver resolves tallow services on the local network
type Resolver struct {
	timeout time.Duration
}

// NewResolver creates a new Resolver
func NewResolver(timeout time.Duration) *Resolver {
	if timeout <= 0 {
		timeout = 5 * time.Second
	}
	return &Resolver{
		timeout: timeout,
	}
}

// Resolve finds all tallow services on the network
func (r *Resolver) Resolve(ctx context.Context) ([]*Peer, error) {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create resolver: %w", err)
	}

	entries := make(chan *zeroconf.ServiceEntry)
	peers := make([]*Peer, 0)

	go func() {
		for entry := range entries {
			peer := r.entryToPeer(entry)
			if peer != nil {
				peers = append(peers, peer)
			}
		}
	}()

	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	err = resolver.Browse(ctx, ServiceType, ServiceDomain, entries)
	if err != nil {
		return nil, fmt.Errorf("failed to browse: %w", err)
	}

	<-ctx.Done()
	return peers, nil
}

// ResolveByRoom finds a peer with a specific room code
func (r *Resolver) ResolveByRoom(ctx context.Context, roomCode string) (*Peer, error) {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create resolver: %w", err)
	}

	entries := make(chan *zeroconf.ServiceEntry)
	found := make(chan *Peer, 1)

	go func() {
		for entry := range entries {
			peer := r.entryToPeer(entry)
			if peer != nil && peer.RoomCode == roomCode {
				select {
				case found <- peer:
				default:
				}
			}
		}
	}()

	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	err = resolver.Browse(ctx, ServiceType, ServiceDomain, entries)
	if err != nil {
		return nil, fmt.Errorf("failed to browse: %w", err)
	}

	select {
	case peer := <-found:
		return peer, nil
	case <-ctx.Done():
		return nil, errors.New("peer not found")
	}
}

// entryToPeer converts a zeroconf entry to a Peer
func (r *Resolver) entryToPeer(entry *zeroconf.ServiceEntry) *Peer {
	if entry == nil {
		return nil
	}

	// Get IP address
	var ip string
	if len(entry.AddrIPv4) > 0 {
		ip = entry.AddrIPv4[0].String()
	} else if len(entry.AddrIPv6) > 0 {
		ip = entry.AddrIPv6[0].String()
	} else {
		return nil
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

	return &Peer{
		Name:     entry.Instance,
		HostName: entry.HostName,
		IP:       ip,
		Port:     entry.Port,
		RoomCode: txtData["room"],
		TxtData:  txtData,
	}
}

// LookupService looks up a specific service instance
func (r *Resolver) LookupService(ctx context.Context, instanceName string) (*Peer, error) {
	resolver, err := zeroconf.NewResolver(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create resolver: %w", err)
	}

	entries := make(chan *zeroconf.ServiceEntry)
	found := make(chan *Peer, 1)

	go func() {
		for entry := range entries {
			if entry.Instance == instanceName {
				peer := r.entryToPeer(entry)
				if peer != nil {
					select {
					case found <- peer:
					default:
					}
				}
			}
		}
	}()

	ctx, cancel := context.WithTimeout(ctx, r.timeout)
	defer cancel()

	err = resolver.Browse(ctx, ServiceType, ServiceDomain, entries)
	if err != nil {
		return nil, fmt.Errorf("failed to browse: %w", err)
	}

	select {
	case peer := <-found:
		return peer, nil
	case <-ctx.Done():
		return nil, errors.New("service not found")
	}
}

// QuickResolve does a fast resolution with a short timeout
func QuickResolve() ([]*Peer, error) {
	r := NewResolver(2 * time.Second)
	return r.Resolve(context.Background())
}

// QuickResolveByRoom does a fast resolution for a specific room
func QuickResolveByRoom(roomCode string) (*Peer, error) {
	r := NewResolver(3 * time.Second)
	return r.ResolveByRoom(context.Background(), roomCode)
}
