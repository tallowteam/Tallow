package ratelimit

import (
	"net"
	"sync"
	"time"
)

// IPTracker tracks connections and activity per IP
type IPTracker struct {
	entries map[string]*IPEntry
	mu      sync.RWMutex
	maxAge  time.Duration
}

// IPEntry holds tracking data for a single IP
type IPEntry struct {
	IP             string
	FirstSeen      time.Time
	LastSeen       time.Time
	ConnectionCount int
	TotalRequests  int64
	TotalBytes     int64
	IsWhitelisted  bool
	IsBlacklisted  bool
	Metadata       map[string]string
	mu             sync.Mutex
}

// NewIPTracker creates a new IP tracker
func NewIPTracker(maxAge time.Duration) *IPTracker {
	if maxAge <= 0 {
		maxAge = 24 * time.Hour
	}

	tracker := &IPTracker{
		entries: make(map[string]*IPEntry),
		maxAge:  maxAge,
	}

	// Start cleanup goroutine
	go tracker.cleanupLoop()

	return tracker
}

// Track records activity for an IP
func (t *IPTracker) Track(ip string) *IPEntry {
	t.mu.Lock()
	defer t.mu.Unlock()

	entry, exists := t.entries[ip]
	if !exists {
		entry = &IPEntry{
			IP:        ip,
			FirstSeen: time.Now(),
			LastSeen:  time.Now(),
			Metadata:  make(map[string]string),
		}
		t.entries[ip] = entry
	}

	entry.mu.Lock()
	entry.LastSeen = time.Now()
	entry.TotalRequests++
	entry.mu.Unlock()

	return entry
}

// Get returns the entry for an IP without modifying it
func (t *IPTracker) Get(ip string) (*IPEntry, bool) {
	t.mu.RLock()
	defer t.mu.RUnlock()

	entry, exists := t.entries[ip]
	return entry, exists
}

// IncrementConnections increments the connection count for an IP
func (t *IPTracker) IncrementConnections(ip string) {
	entry := t.Track(ip)
	entry.mu.Lock()
	entry.ConnectionCount++
	entry.mu.Unlock()
}

// DecrementConnections decrements the connection count for an IP
func (t *IPTracker) DecrementConnections(ip string) {
	t.mu.RLock()
	entry, exists := t.entries[ip]
	t.mu.RUnlock()

	if exists {
		entry.mu.Lock()
		if entry.ConnectionCount > 0 {
			entry.ConnectionCount--
		}
		entry.mu.Unlock()
	}
}

// AddBytes adds transferred bytes for an IP
func (t *IPTracker) AddBytes(ip string, bytes int64) {
	entry := t.Track(ip)
	entry.mu.Lock()
	entry.TotalBytes += bytes
	entry.mu.Unlock()
}

// Whitelist adds an IP to the whitelist
func (t *IPTracker) Whitelist(ip string) {
	entry := t.Track(ip)
	entry.mu.Lock()
	entry.IsWhitelisted = true
	entry.IsBlacklisted = false
	entry.mu.Unlock()
}

// Blacklist adds an IP to the blacklist
func (t *IPTracker) Blacklist(ip string) {
	entry := t.Track(ip)
	entry.mu.Lock()
	entry.IsBlacklisted = true
	entry.IsWhitelisted = false
	entry.mu.Unlock()
}

// IsWhitelisted checks if an IP is whitelisted
func (t *IPTracker) IsWhitelisted(ip string) bool {
	t.mu.RLock()
	entry, exists := t.entries[ip]
	t.mu.RUnlock()

	if !exists {
		return false
	}

	entry.mu.Lock()
	defer entry.mu.Unlock()
	return entry.IsWhitelisted
}

// IsBlacklisted checks if an IP is blacklisted
func (t *IPTracker) IsBlacklisted(ip string) bool {
	t.mu.RLock()
	entry, exists := t.entries[ip]
	t.mu.RUnlock()

	if !exists {
		return false
	}

	entry.mu.Lock()
	defer entry.mu.Unlock()
	return entry.IsBlacklisted
}

// Remove removes an IP from tracking
func (t *IPTracker) Remove(ip string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.entries, ip)
}

// Count returns the number of tracked IPs
func (t *IPTracker) Count() int {
	t.mu.RLock()
	defer t.mu.RUnlock()
	return len(t.entries)
}

// ActiveConnections returns total active connections
func (t *IPTracker) ActiveConnections() int {
	t.mu.RLock()
	defer t.mu.RUnlock()

	total := 0
	for _, entry := range t.entries {
		entry.mu.Lock()
		total += entry.ConnectionCount
		entry.mu.Unlock()
	}
	return total
}

// cleanupLoop periodically removes old entries
func (t *IPTracker) cleanupLoop() {
	ticker := time.NewTicker(t.maxAge / 4)
	defer ticker.Stop()

	for range ticker.C {
		t.cleanup()
	}
}

// cleanup removes entries older than maxAge with no active connections
func (t *IPTracker) cleanup() {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := time.Now()
	for ip, entry := range t.entries {
		entry.mu.Lock()
		isOld := now.Sub(entry.LastSeen) > t.maxAge
		noConnections := entry.ConnectionCount == 0
		entry.mu.Unlock()

		if isOld && noConnections {
			delete(t.entries, ip)
		}
	}
}

// SetMetadata sets metadata for an IP
func (t *IPTracker) SetMetadata(ip, key, value string) {
	entry := t.Track(ip)
	entry.mu.Lock()
	entry.Metadata[key] = value
	entry.mu.Unlock()
}

// GetMetadata gets metadata for an IP
func (t *IPTracker) GetMetadata(ip, key string) (string, bool) {
	t.mu.RLock()
	entry, exists := t.entries[ip]
	t.mu.RUnlock()

	if !exists {
		return "", false
	}

	entry.mu.Lock()
	defer entry.mu.Unlock()
	value, ok := entry.Metadata[key]
	return value, ok
}

// IsPrivateIP checks if an IP is a private/internal address
func IsPrivateIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}

	// Check for loopback
	if ip.IsLoopback() {
		return true
	}

	// Check for private ranges
	privateRanges := []struct {
		start net.IP
		end   net.IP
	}{
		{net.ParseIP("10.0.0.0"), net.ParseIP("10.255.255.255")},
		{net.ParseIP("172.16.0.0"), net.ParseIP("172.31.255.255")},
		{net.ParseIP("192.168.0.0"), net.ParseIP("192.168.255.255")},
		{net.ParseIP("fc00::"), net.ParseIP("fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff")}, // IPv6 ULA
	}

	for _, r := range privateRanges {
		if bytesCompare(ip, r.start) >= 0 && bytesCompare(ip, r.end) <= 0 {
			return true
		}
	}

	return false
}

// bytesCompare compares two IPs as byte slices
func bytesCompare(a, b net.IP) int {
	a = a.To16()
	b = b.To16()
	for i := 0; i < len(a); i++ {
		if a[i] < b[i] {
			return -1
		}
		if a[i] > b[i] {
			return 1
		}
	}
	return 0
}
