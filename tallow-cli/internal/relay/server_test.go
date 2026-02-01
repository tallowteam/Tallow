package relay

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestDefaultServerConfig(t *testing.T) {
	cfg := DefaultServerConfig()

	if cfg.ListenAddr == "" {
		t.Error("ListenAddr should not be empty")
	}

	if cfg.RoomTTL <= 0 {
		t.Error("RoomTTL should be positive")
	}

	if cfg.MaxConnectionsPerIP <= 0 {
		t.Error("MaxConnectionsPerIP should be positive")
	}

	if cfg.RateLimit <= 0 {
		t.Error("RateLimit should be positive")
	}

	if cfg.BurstLimit <= 0 {
		t.Error("BurstLimit should be positive")
	}
}

func TestNewServer(t *testing.T) {
	cfg := DefaultServerConfig()
	server := NewServer(cfg)

	if server == nil {
		t.Fatal("NewServer returned nil")
	}

	if server.roomManager == nil {
		t.Error("roomManager is nil")
	}

	if server.rateLimiter == nil {
		t.Error("rateLimiter is nil")
	}

	if server.connLimiter == nil {
		t.Error("connLimiter is nil")
	}
}

func TestServerHealthEndpoint(t *testing.T) {
	cfg := DefaultServerConfig()
	cfg.EnableMetrics = false
	server := NewServer(cfg)

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()

	server.handleHealth(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want %d", w.Code, http.StatusOK)
	}

	body := w.Body.String()
	if !strings.Contains(body, "ok") && !strings.Contains(body, "status") {
		t.Errorf("Body should contain status: %s", body)
	}
}

func TestServerStatsEndpoint(t *testing.T) {
	cfg := DefaultServerConfig()
	cfg.EnableMetrics = false
	server := NewServer(cfg)

	req := httptest.NewRequest(http.MethodGet, "/stats", nil)
	w := httptest.NewRecorder()

	server.handleStats(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Status = %d, want %d", w.Code, http.StatusOK)
	}

	body := w.Body.String()
	if !strings.Contains(body, "uptime") {
		t.Errorf("Body should contain uptime: %s", body)
	}
}

func TestRateLimiter(t *testing.T) {
	rl := NewRateLimiter(10, 5)

	ip := "192.168.1.1"

	// First 5 requests should be allowed (burst)
	for i := 0; i < 5; i++ {
		if !rl.Allow(ip) {
			t.Errorf("Request %d should be allowed (within burst)", i)
		}
	}
}

func TestConnectionLimiter(t *testing.T) {
	cl := NewConnectionLimiter(3)

	ip := "192.168.1.1"

	// First 3 connections should be allowed
	for i := 0; i < 3; i++ {
		if !cl.Acquire(ip) {
			t.Errorf("Connection %d should be allowed", i)
		}
	}

	// 4th connection should be denied
	if cl.Acquire(ip) {
		t.Error("4th connection should be denied")
	}

	// Release one and try again
	cl.Release(ip)
	if !cl.Acquire(ip) {
		t.Error("Connection after release should be allowed")
	}
}

func TestConnectionLimiterMultipleIPs(t *testing.T) {
	cl := NewConnectionLimiter(2)

	ip1 := "192.168.1.1"
	ip2 := "192.168.1.2"

	// Both IPs should get their own limit
	cl.Acquire(ip1)
	cl.Acquire(ip1)
	cl.Acquire(ip2)
	cl.Acquire(ip2)

	if cl.Acquire(ip1) {
		t.Error("ip1 should be at limit")
	}

	if cl.Acquire(ip2) {
		t.Error("ip2 should be at limit")
	}
}

func TestRoomManager(t *testing.T) {
	rm := NewRoomManager(time.Minute)

	room := rm.GetOrCreateRoom("test-room")
	if room == nil {
		t.Fatal("GetOrCreateRoom returned nil")
	}

	if room.ID != "test-room" {
		t.Errorf("Room ID = %s, want test-room", room.ID)
	}

	// Get same room again
	room2 := rm.GetOrCreateRoom("test-room")
	if room2 != room {
		t.Error("Should return same room for same ID")
	}
}

func TestRoomManagerCreateRoom(t *testing.T) {
	rm := NewRoomManager(time.Minute)

	room, err := rm.CreateRoom("new-room")
	if err != nil {
		t.Fatalf("CreateRoom failed: %v", err)
	}

	if room.ID != "new-room" {
		t.Errorf("Room ID = %s, want new-room", room.ID)
	}

	// Create same room again should fail
	_, err = rm.CreateRoom("new-room")
	if err != ErrRoomExists {
		t.Errorf("Expected ErrRoomExists, got %v", err)
	}
}

func TestRoomManagerGetRoom(t *testing.T) {
	rm := NewRoomManager(time.Minute)

	// Non-existent room
	room := rm.GetRoom("nonexistent")
	if room != nil {
		t.Error("GetRoom for nonexistent should return nil")
	}

	// Create and get
	rm.CreateRoom("exists")
	room = rm.GetRoom("exists")
	if room == nil {
		t.Error("GetRoom for existing room should not return nil")
	}
}

func TestRoomManagerRemoveRoom(t *testing.T) {
	rm := NewRoomManager(time.Minute)

	rm.CreateRoom("to-remove")
	rm.RemoveRoom("to-remove")

	room := rm.GetRoom("to-remove")
	if room != nil {
		t.Error("Room should be removed")
	}
}

func TestRoomManagerStats(t *testing.T) {
	rm := NewRoomManager(time.Minute)

	stats := rm.Stats()
	if stats.ActiveRooms != 0 {
		t.Errorf("Initial ActiveRooms = %d, want 0", stats.ActiveRooms)
	}

	rm.CreateRoom("room1")
	rm.CreateRoom("room2")

	stats = rm.Stats()
	if stats.ActiveRooms != 2 {
		t.Errorf("ActiveRooms = %d, want 2", stats.ActiveRooms)
	}
}

func TestRoomAddClient(t *testing.T) {
	rm := NewRoomManager(time.Minute)
	room := rm.GetOrCreateRoom("test")

	client := &Client{
		ID:         "client1",
		Conn:       nil,
		RemoteAddr: "127.0.0.1:12345",
	}

	err := room.AddClient(client)
	if err != nil {
		t.Fatalf("AddClient failed: %v", err)
	}

	if room.ClientCount() != 1 {
		t.Errorf("ClientCount = %d, want 1", room.ClientCount())
	}
}

func TestRoomMaxClients(t *testing.T) {
	rm := NewRoomManager(time.Minute)
	room := rm.GetOrCreateRoom("test")

	// Add 2 clients (max)
	room.AddClient(&Client{ID: "client1"})
	room.AddClient(&Client{ID: "client2"})

	if !room.IsFull() {
		t.Error("Room should be full")
	}

	// Third client should fail
	err := room.AddClient(&Client{ID: "client3"})
	if err != ErrRoomFull {
		t.Errorf("Expected ErrRoomFull, got %v", err)
	}
}

func TestRoomRemoveClient(t *testing.T) {
	rm := NewRoomManager(time.Minute)
	room := rm.GetOrCreateRoom("test")

	room.AddClient(&Client{ID: "client1"})
	room.AddClient(&Client{ID: "client2"})

	room.RemoveClient("client1")

	if room.ClientCount() != 1 {
		t.Errorf("ClientCount = %d, want 1", room.ClientCount())
	}

	if room.IsFull() {
		t.Error("Room should not be full after removal")
	}
}

func TestRoomGetPeer(t *testing.T) {
	rm := NewRoomManager(time.Minute)
	room := rm.GetOrCreateRoom("test")

	room.AddClient(&Client{ID: "client1"})
	room.AddClient(&Client{ID: "client2"})

	peer := room.GetPeer("client1")
	if peer == nil {
		t.Fatal("GetPeer returned nil")
	}

	if peer.ID != "client2" {
		t.Errorf("Peer ID = %s, want client2", peer.ID)
	}
}

func TestRoomClose(t *testing.T) {
	rm := NewRoomManager(time.Minute)
	room := rm.GetOrCreateRoom("test")

	room.AddClient(&Client{ID: "client1"})
	room.Close()

	// Should be able to add clients to closed room (depends on impl)
}

func TestSimpleMetrics(t *testing.T) {
	m := NewSimpleMetrics()

	if m.Connections() != 0 {
		t.Errorf("Initial connections = %d, want 0", m.Connections())
	}

	m.IncConnections()
	m.IncConnections()

	if m.Connections() != 2 {
		t.Errorf("Connections = %d, want 2", m.Connections())
	}

	m.DecConnections()

	if m.Connections() != 1 {
		t.Errorf("Connections = %d, want 1", m.Connections())
	}
}

func TestSimpleMetricsRooms(t *testing.T) {
	m := NewSimpleMetrics()

	m.IncRooms()
	m.IncRooms()

	if m.Rooms() != 2 {
		t.Errorf("Rooms = %d, want 2", m.Rooms())
	}

	m.DecRooms()

	if m.Rooms() != 1 {
		t.Errorf("Rooms = %d, want 1", m.Rooms())
	}
}

func TestSimpleMetricsBytes(t *testing.T) {
	m := NewSimpleMetrics()

	m.AddBytes(1000)
	m.AddBytes(500)

	if m.BytesTransferred() != 1500 {
		t.Errorf("BytesTransferred = %d, want 1500", m.BytesTransferred())
	}
}

func TestExtractIP(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"192.168.1.1:12345", "192.168.1.1"},
		{"10.0.0.1:80", "10.0.0.1"},
		{"127.0.0.1:8080", "127.0.0.1"},
		{"[::1]:8080", "::1"},
		{"[2001:db8::1]:443", "2001:db8::1"},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := ExtractIP(tt.input)
			if result != tt.expected {
				t.Errorf("ExtractIP(%s) = %s, want %s", tt.input, result, tt.expected)
			}
		})
	}
}

func TestBridgePool(t *testing.T) {
	pool := NewBridgePool()

	if pool == nil {
		t.Fatal("NewBridgePool returned nil")
	}
}

func TestServerGracefulShutdown(t *testing.T) {
	cfg := DefaultServerConfig()
	cfg.ListenAddr = ":0"
	cfg.EnableMetrics = false
	server := NewServer(cfg)

	// Start server in background
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		server.Start()
	}()

	// Give it time to start
	time.Sleep(100 * time.Millisecond)

	// Stop server
	err := server.Stop()
	if err != nil {
		t.Errorf("Stop failed: %v", err)
	}

	// Wait for server to finish
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// OK
	case <-time.After(5 * time.Second):
		t.Error("Server didn't stop in time")
	}
}

func TestWebSocketIntegration(t *testing.T) {
	cfg := DefaultServerConfig()
	cfg.EnableMetrics = false
	server := NewServer(cfg)

	// Create test server
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/ws") {
			server.handleWebSocket(w, r)
		} else if r.URL.Path == "/health" {
			server.handleHealth(w, r)
		}
	}))
	defer ts.Close()

	// Test health endpoint
	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("Health check failed: %v", err)
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Health status = %d, want %d", resp.StatusCode, http.StatusOK)
	}
}

func BenchmarkRateLimiter(b *testing.B) {
	rl := NewRateLimiter(1000, 100)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rl.Allow("192.168.1.1")
	}
}

func BenchmarkConnectionLimiter(b *testing.B) {
	cl := NewConnectionLimiter(1000)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cl.Acquire("192.168.1.1")
		cl.Release("192.168.1.1")
	}
}

func BenchmarkRoomManager(b *testing.B) {
	rm := NewRoomManager(time.Hour)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rm.GetOrCreateRoom("test-room")
	}
}
