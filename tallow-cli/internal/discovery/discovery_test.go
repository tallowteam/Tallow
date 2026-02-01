package discovery

import (
	"context"
	"net"
	"testing"
	"time"

	"github.com/grandcat/zeroconf"
)

func TestServiceConstants(t *testing.T) {
	if ServiceType != "_tallow._tcp" {
		t.Errorf("ServiceType = %s, want _tallow._tcp", ServiceType)
	}
	if ServiceDomain != "local." {
		t.Errorf("ServiceDomain = %s, want local.", ServiceDomain)
	}
}

func TestNewDiscovery(t *testing.T) {
	d := NewDiscovery()
	if d == nil {
		t.Fatal("NewDiscovery returned nil")
	}
	if d.peers == nil {
		t.Error("peers map is nil")
	}
}

func TestDiscoverySetCallbacks(t *testing.T) {
	d := NewDiscovery()

	discoverCalled := false
	removeCalled := false

	d.SetOnDiscover(func(peer *Peer) {
		discoverCalled = true
	})

	d.SetOnRemove(func(peer *Peer) {
		removeCalled = true
	})

	if d.onDiscover == nil {
		t.Error("onDiscover not set")
	}
	if d.onRemove == nil {
		t.Error("onRemove not set")
	}

	// Verify callbacks work
	d.onDiscover(&Peer{})
	d.onRemove(&Peer{})

	if !discoverCalled {
		t.Error("onDiscover callback not called")
	}
	if !removeCalled {
		t.Error("onRemove callback not called")
	}
}

func TestDiscoveryGetPeers(t *testing.T) {
	d := NewDiscovery()

	// Initially empty
	peers := d.GetPeers()
	if len(peers) != 0 {
		t.Errorf("Initial peers = %d, want 0", len(peers))
	}

	// Add some peers manually
	d.peersMu.Lock()
	d.peers["192.168.1.1:12345"] = &Peer{
		Name: "peer1",
		IP:   "192.168.1.1",
		Port: 12345,
	}
	d.peers["192.168.1.2:12345"] = &Peer{
		Name: "peer2",
		IP:   "192.168.1.2",
		Port: 12345,
	}
	d.peersMu.Unlock()

	peers = d.GetPeers()
	if len(peers) != 2 {
		t.Errorf("Peers = %d, want 2", len(peers))
	}
}

func TestDiscoveryGetPeerByRoom(t *testing.T) {
	d := NewDiscovery()

	// Add peers
	d.peersMu.Lock()
	d.peers["192.168.1.1:12345"] = &Peer{
		Name:     "peer1",
		IP:       "192.168.1.1",
		Port:     12345,
		RoomCode: "alpha-beta-gamma",
	}
	d.peers["192.168.1.2:12345"] = &Peer{
		Name:     "peer2",
		IP:       "192.168.1.2",
		Port:     12345,
		RoomCode: "delta-echo-foxtrot",
	}
	d.peersMu.Unlock()

	// Find existing
	peer := d.GetPeerByRoom("alpha-beta-gamma")
	if peer == nil {
		t.Fatal("GetPeerByRoom returned nil for existing room")
	}
	if peer.Name != "peer1" {
		t.Errorf("Peer name = %s, want peer1", peer.Name)
	}

	// Find non-existing
	peer = d.GetPeerByRoom("nonexistent")
	if peer != nil {
		t.Error("GetPeerByRoom should return nil for non-existing room")
	}
}

func TestDiscoveryClear(t *testing.T) {
	d := NewDiscovery()

	// Add peers
	d.peersMu.Lock()
	d.peers["192.168.1.1:12345"] = &Peer{Name: "peer1"}
	d.peersMu.Unlock()

	if len(d.GetPeers()) != 1 {
		t.Error("Peer not added")
	}

	// Clear
	d.Clear()

	if len(d.GetPeers()) != 0 {
		t.Error("Clear did not remove peers")
	}
}

func TestDiscoveryStop(t *testing.T) {
	d := NewDiscovery()

	// Should not panic
	d.Stop()
}

func TestDiscoveryHandleEntry(t *testing.T) {
	d := NewDiscovery()

	discovered := make(chan *Peer, 1)
	d.SetOnDiscover(func(peer *Peer) {
		discovered <- peer
	})

	// Create mock entry with IPv4
	entry := zeroconf.NewServiceEntry("test-service", ServiceType, ServiceDomain)
	entry.HostName = "testhost.local."
	entry.Port = 12345
	entry.AddrIPv4 = []net.IP{net.ParseIP("192.168.1.100")}
	entry.Text = []string{"room=test-room", "version=1"}

	d.handleEntry(entry)

	// Check callback was called
	select {
	case peer := <-discovered:
		if peer.Name != "test-service" {
			t.Errorf("Peer name = %s, want test-service", peer.Name)
		}
		if peer.IP != "192.168.1.100" {
			t.Errorf("Peer IP = %s, want 192.168.1.100", peer.IP)
		}
		if peer.Port != 12345 {
			t.Errorf("Peer port = %d, want 12345", peer.Port)
		}
		if peer.RoomCode != "test-room" {
			t.Errorf("Peer RoomCode = %s, want test-room", peer.RoomCode)
		}
		if peer.TxtData["version"] != "1" {
			t.Errorf("TxtData[version] = %s, want 1", peer.TxtData["version"])
		}
	default:
		t.Error("onDiscover callback not called")
	}

	// Verify peer stored
	peers := d.GetPeers()
	if len(peers) != 1 {
		t.Errorf("Peers stored = %d, want 1", len(peers))
	}
}

func TestDiscoveryHandleEntryIPv6(t *testing.T) {
	d := NewDiscovery()

	entry := zeroconf.NewServiceEntry("ipv6-service", ServiceType, ServiceDomain)
	entry.HostName = "testhost.local."
	entry.Port = 12345
	entry.AddrIPv6 = []net.IP{net.ParseIP("::1")}

	d.handleEntry(entry)

	peers := d.GetPeers()
	if len(peers) != 1 {
		t.Errorf("IPv6 peer not stored")
	}
	if peers[0].IP != "::1" {
		t.Errorf("IP = %s, want ::1", peers[0].IP)
	}
}

func TestDiscoveryHandleEntryNoIP(t *testing.T) {
	d := NewDiscovery()

	entry := zeroconf.NewServiceEntry("no-ip-service", ServiceType, ServiceDomain)
	entry.HostName = "testhost.local."
	entry.Port = 12345
	// No IPs

	d.handleEntry(entry)

	peers := d.GetPeers()
	if len(peers) != 0 {
		t.Error("Peer without IP should not be stored")
	}
}

func TestDiscoveryHandleEntryDuplicate(t *testing.T) {
	d := NewDiscovery()

	callCount := 0
	d.SetOnDiscover(func(peer *Peer) {
		callCount++
	})

	entry := zeroconf.NewServiceEntry("dup-service", ServiceType, ServiceDomain)
	entry.HostName = "testhost.local."
	entry.Port = 12345
	entry.AddrIPv4 = []net.IP{net.ParseIP("192.168.1.1")}

	// Handle same entry twice
	d.handleEntry(entry)
	d.handleEntry(entry)

	// Callback should only be called once (first discovery)
	if callCount != 1 {
		t.Errorf("onDiscover called %d times, want 1", callCount)
	}
}

func TestPeerStruct(t *testing.T) {
	peer := &Peer{
		Name:     "test-peer",
		HostName: "host.local.",
		IP:       "192.168.1.1",
		Port:     12345,
		RoomCode: "test-room",
		TxtData: map[string]string{
			"key1": "value1",
			"key2": "value2",
		},
	}

	if peer.Name != "test-peer" {
		t.Error("Name field mismatch")
	}
	if peer.HostName != "host.local." {
		t.Error("HostName field mismatch")
	}
	if peer.IP != "192.168.1.1" {
		t.Error("IP field mismatch")
	}
	if peer.Port != 12345 {
		t.Error("Port field mismatch")
	}
	if peer.RoomCode != "test-room" {
		t.Error("RoomCode field mismatch")
	}
	if peer.TxtData["key1"] != "value1" {
		t.Error("TxtData field mismatch")
	}
}

// Advertiser tests

func TestNewAdvertiser(t *testing.T) {
	adv := NewAdvertiser(12345, "test-room")
	if adv == nil {
		t.Fatal("NewAdvertiser returned nil")
	}
	if adv.port != 12345 {
		t.Errorf("Port = %d, want 12345", adv.port)
	}
	if adv.roomCode != "test-room" {
		t.Errorf("RoomCode = %s, want test-room", adv.roomCode)
	}
}

func TestAdvertiserGetters(t *testing.T) {
	adv := NewAdvertiser(8080, "my-room")

	if adv.Port() != 8080 {
		t.Errorf("Port() = %d, want 8080", adv.Port())
	}
	if adv.RoomCode() != "my-room" {
		t.Errorf("RoomCode() = %s, want my-room", adv.RoomCode())
	}
}

func TestAdvertiserStop(t *testing.T) {
	adv := NewAdvertiser(12345, "test-room")

	// Stop without start should not panic
	adv.Stop()

	// Double stop should not panic
	adv.Stop()
}

func TestAdvertiserConfig(t *testing.T) {
	config := AdvertiserConfig{
		Port:     54321,
		RoomCode: "config-room",
		Name:     "test-device",
		Version:  "2.0",
	}

	if config.Port != 54321 {
		t.Error("Port field mismatch")
	}
	if config.RoomCode != "config-room" {
		t.Error("RoomCode field mismatch")
	}
	if config.Name != "test-device" {
		t.Error("Name field mismatch")
	}
	if config.Version != "2.0" {
		t.Error("Version field mismatch")
	}
}

// Resolver tests

func TestNewResolver(t *testing.T) {
	tests := []struct {
		name     string
		timeout  time.Duration
		expected time.Duration
	}{
		{"positive timeout", 10 * time.Second, 10 * time.Second},
		{"zero timeout", 0, 5 * time.Second},
		{"negative timeout", -1 * time.Second, 5 * time.Second},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := NewResolver(tt.timeout)
			if r == nil {
				t.Fatal("NewResolver returned nil")
			}
			if r.timeout != tt.expected {
				t.Errorf("timeout = %v, want %v", r.timeout, tt.expected)
			}
		})
	}
}

func TestResolverEntryToPeer(t *testing.T) {
	r := NewResolver(5 * time.Second)

	tests := []struct {
		name     string
		entry    *zeroconf.ServiceEntry
		expected *Peer
	}{
		{
			name:     "nil entry",
			entry:    nil,
			expected: nil,
		},
		{
			name: "no IP",
			entry: func() *zeroconf.ServiceEntry {
				e := zeroconf.NewServiceEntry("no-ip", ServiceType, ServiceDomain)
				e.Port = 12345
				return e
			}(),
			expected: nil,
		},
		{
			name: "IPv4",
			entry: func() *zeroconf.ServiceEntry {
				e := zeroconf.NewServiceEntry("ipv4-peer", ServiceType, ServiceDomain)
				e.HostName = "host.local."
				e.Port = 12345
				e.AddrIPv4 = []net.IP{net.ParseIP("10.0.0.1")}
				e.Text = []string{"room=test", "key=value"}
				return e
			}(),
			expected: &Peer{
				Name:     "ipv4-peer",
				HostName: "host.local.",
				IP:       "10.0.0.1",
				Port:     12345,
				RoomCode: "test",
			},
		},
		{
			name: "IPv6 only",
			entry: func() *zeroconf.ServiceEntry {
				e := zeroconf.NewServiceEntry("ipv6-peer", ServiceType, ServiceDomain)
				e.HostName = "host.local."
				e.Port = 12345
				e.AddrIPv6 = []net.IP{net.ParseIP("fe80::1")}
				return e
			}(),
			expected: &Peer{
				Name:     "ipv6-peer",
				HostName: "host.local.",
				IP:       "fe80::1",
				Port:     12345,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := r.entryToPeer(tt.entry)

			if tt.expected == nil {
				if result != nil {
					t.Error("Expected nil, got non-nil")
				}
				return
			}

			if result == nil {
				t.Fatal("Expected non-nil, got nil")
			}

			if result.Name != tt.expected.Name {
				t.Errorf("Name = %s, want %s", result.Name, tt.expected.Name)
			}
			if result.IP != tt.expected.IP {
				t.Errorf("IP = %s, want %s", result.IP, tt.expected.IP)
			}
			if result.Port != tt.expected.Port {
				t.Errorf("Port = %d, want %d", result.Port, tt.expected.Port)
			}
			if result.RoomCode != tt.expected.RoomCode {
				t.Errorf("RoomCode = %s, want %s", result.RoomCode, tt.expected.RoomCode)
			}
		})
	}
}

func TestResolverEntryToPeerTxtParsing(t *testing.T) {
	r := NewResolver(5 * time.Second)

	entry := zeroconf.NewServiceEntry("test", ServiceType, ServiceDomain)
	entry.Port = 12345
	entry.AddrIPv4 = []net.IP{net.ParseIP("127.0.0.1")}
	entry.Text = []string{
		"key1=value1",
		"key2=value2=with=equals",
		"key3=",
		"noequals",
	}

	peer := r.entryToPeer(entry)
	if peer == nil {
		t.Fatal("Expected non-nil peer")
	}

	if peer.TxtData["key1"] != "value1" {
		t.Errorf("key1 = %s, want value1", peer.TxtData["key1"])
	}
	if peer.TxtData["key2"] != "value2=with=equals" {
		t.Errorf("key2 = %s, want value2=with=equals", peer.TxtData["key2"])
	}
	if peer.TxtData["key3"] != "" {
		t.Errorf("key3 = %s, want empty", peer.TxtData["key3"])
	}
}

func TestDiscoveryBrowseWithTimeout(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	d := NewDiscovery()

	// Very short timeout
	peers, err := d.BrowseWithTimeout(100 * time.Millisecond)

	// Should not error (just timeout)
	if err != nil {
		t.Logf("BrowseWithTimeout returned error: %v", err)
	}

	t.Logf("Found %d peers", len(peers))
}

func TestDiscoveryWaitForPeer(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	d := NewDiscovery()

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	// Should timeout looking for non-existent peer
	_, err := d.WaitForPeer(ctx, "nonexistent-room-code")
	if err == nil {
		t.Error("Expected error for non-existent peer")
	}
}

func TestResolverResolve(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	r := NewResolver(100 * time.Millisecond)

	peers, err := r.Resolve(context.Background())
	if err != nil {
		t.Logf("Resolve returned error: %v", err)
	}

	t.Logf("Found %d peers", len(peers))
}

func TestResolverResolveByRoom(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	r := NewResolver(100 * time.Millisecond)

	_, err := r.ResolveByRoom(context.Background(), "nonexistent-room")
	if err == nil {
		t.Error("Expected error for non-existent room")
	}
}

func TestResolverLookupService(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	r := NewResolver(100 * time.Millisecond)

	_, err := r.LookupService(context.Background(), "nonexistent-service")
	if err == nil {
		t.Error("Expected error for non-existent service")
	}
}

func TestQuickResolveFunctions(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	// These should not panic
	peers, _ := QuickResolve()
	t.Logf("QuickResolve found %d peers", len(peers))

	_, err := QuickResolveByRoom("test-room")
	if err == nil {
		t.Log("QuickResolveByRoom unexpectedly found a peer")
	}
}

// Concurrent access tests

func TestDiscoveryConcurrency(t *testing.T) {
	d := NewDiscovery()

	done := make(chan bool)

	// Concurrent reads
	for i := 0; i < 5; i++ {
		go func() {
			for j := 0; j < 100; j++ {
				d.GetPeers()
				d.GetPeerByRoom("test")
			}
			done <- true
		}()
	}

	// Concurrent writes via handleEntry
	for i := 0; i < 5; i++ {
		go func(id int) {
			for j := 0; j < 100; j++ {
				entry := zeroconf.NewServiceEntry("concurrent-test", ServiceType, ServiceDomain)
				entry.Port = 12345 + id
				entry.AddrIPv4 = []net.IP{net.ParseIP("192.168.1.1")}
				d.handleEntry(entry)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
}

func BenchmarkHandleEntry(b *testing.B) {
	d := NewDiscovery()

	entry := zeroconf.NewServiceEntry("bench-service", ServiceType, ServiceDomain)
	entry.HostName = "host.local."
	entry.Port = 12345
	entry.AddrIPv4 = []net.IP{net.ParseIP("192.168.1.1")}
	entry.Text = []string{"room=test", "version=1"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		d.handleEntry(entry)
	}
}

func BenchmarkGetPeers(b *testing.B) {
	d := NewDiscovery()

	// Add some peers
	for i := 0; i < 100; i++ {
		d.peersMu.Lock()
		d.peers["192.168.1."+string(rune('0'+i%10))+":12345"] = &Peer{
			Name: "peer",
		}
		d.peersMu.Unlock()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		d.GetPeers()
	}
}

func BenchmarkGetPeerByRoom(b *testing.B) {
	d := NewDiscovery()

	// Add some peers
	for i := 0; i < 100; i++ {
		d.peersMu.Lock()
		d.peers["192.168.1."+string(rune('0'+i%10))+":12345"] = &Peer{
			Name:     "peer",
			RoomCode: "room-" + string(rune('0'+i%10)),
		}
		d.peersMu.Unlock()
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		d.GetPeerByRoom("room-5")
	}
}

func BenchmarkEntryToPeer(b *testing.B) {
	r := NewResolver(5 * time.Second)

	entry := zeroconf.NewServiceEntry("bench-service", ServiceType, ServiceDomain)
	entry.HostName = "host.local."
	entry.Port = 12345
	entry.AddrIPv4 = []net.IP{net.ParseIP("192.168.1.1")}
	entry.Text = []string{"room=test", "version=1", "key=value"}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		r.entryToPeer(entry)
	}
}
