package relay

import (
	"net"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// RateLimiter provides per-IP rate limiting
type RateLimiter struct {
	limiters    map[string]*rate.Limiter
	mu          sync.RWMutex
	rateLimit   rate.Limit
	burstLimit  int
	cleanupTick time.Duration
}

// NewRateLimiter creates a new rate limiter
// rateLimit is requests per second, burstLimit is the burst size
func NewRateLimiter(ratePerSecond float64, burst int) *RateLimiter {
	rl := &RateLimiter{
		limiters:    make(map[string]*rate.Limiter),
		rateLimit:   rate.Limit(ratePerSecond),
		burstLimit:  burst,
		cleanupTick: 5 * time.Minute,
	}

	go rl.cleanup()

	return rl
}

// Allow checks if a request from the given IP is allowed
func (rl *RateLimiter) Allow(ip string) bool {
	limiter := rl.getLimiter(ip)
	return limiter.Allow()
}

// Wait blocks until a request from the given IP is allowed
func (rl *RateLimiter) Wait(ip string) error {
	limiter := rl.getLimiter(ip)
	return limiter.Wait(nil)
}

// getLimiter returns the rate limiter for an IP, creating one if needed
func (rl *RateLimiter) getLimiter(ip string) *rate.Limiter {
	rl.mu.RLock()
	limiter, exists := rl.limiters[ip]
	rl.mu.RUnlock()

	if exists {
		return limiter
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Double-check after acquiring write lock
	if limiter, exists = rl.limiters[ip]; exists {
		return limiter
	}

	limiter = rate.NewLimiter(rl.rateLimit, rl.burstLimit)
	rl.limiters[ip] = limiter
	return limiter
}

// cleanup removes old limiters periodically
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.cleanupTick)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		// Clear all limiters (simple approach - could be smarter)
		if len(rl.limiters) > 10000 {
			rl.limiters = make(map[string]*rate.Limiter)
		}
		rl.mu.Unlock()
	}
}

// ExtractIP extracts the IP address from a remote address
func ExtractIP(remoteAddr string) string {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		return remoteAddr
	}
	return host
}

// ConnectionLimiter limits the number of connections per IP
type ConnectionLimiter struct {
	connections map[string]int
	mu          sync.RWMutex
	maxPerIP    int
}

// NewConnectionLimiter creates a new connection limiter
func NewConnectionLimiter(maxPerIP int) *ConnectionLimiter {
	return &ConnectionLimiter{
		connections: make(map[string]int),
		maxPerIP:    maxPerIP,
	}
}

// Acquire attempts to acquire a connection slot for an IP
func (cl *ConnectionLimiter) Acquire(ip string) bool {
	cl.mu.Lock()
	defer cl.mu.Unlock()

	current := cl.connections[ip]
	if current >= cl.maxPerIP {
		return false
	}

	cl.connections[ip] = current + 1
	return true
}

// Release releases a connection slot for an IP
func (cl *ConnectionLimiter) Release(ip string) {
	cl.mu.Lock()
	defer cl.mu.Unlock()

	if current := cl.connections[ip]; current > 0 {
		cl.connections[ip] = current - 1
		if cl.connections[ip] == 0 {
			delete(cl.connections, ip)
		}
	}
}

// Count returns the number of connections for an IP
func (cl *ConnectionLimiter) Count(ip string) int {
	cl.mu.RLock()
	defer cl.mu.RUnlock()
	return cl.connections[ip]
}

// TotalConnections returns the total number of connections
func (cl *ConnectionLimiter) TotalConnections() int {
	cl.mu.RLock()
	defer cl.mu.RUnlock()

	total := 0
	for _, count := range cl.connections {
		total += count
	}
	return total
}

// BandwidthLimiter limits bandwidth per connection
type BandwidthLimiter struct {
	bytesPerSecond int64
	buckets        map[string]*tokenBucket
	mu             sync.RWMutex
}

type tokenBucket struct {
	tokens     int64
	maxTokens  int64
	refillRate int64
	lastRefill time.Time
	mu         sync.Mutex
}

// NewBandwidthLimiter creates a new bandwidth limiter
func NewBandwidthLimiter(bytesPerSecond int64) *BandwidthLimiter {
	return &BandwidthLimiter{
		bytesPerSecond: bytesPerSecond,
		buckets:        make(map[string]*tokenBucket),
	}
}

// Request requests tokens (bytes) from the bucket
func (bl *BandwidthLimiter) Request(id string, bytes int64) bool {
	bucket := bl.getBucket(id)
	return bucket.request(bytes)
}

// getBucket gets or creates a bucket for an ID
func (bl *BandwidthLimiter) getBucket(id string) *tokenBucket {
	bl.mu.RLock()
	bucket, exists := bl.buckets[id]
	bl.mu.RUnlock()

	if exists {
		return bucket
	}

	bl.mu.Lock()
	defer bl.mu.Unlock()

	if bucket, exists = bl.buckets[id]; exists {
		return bucket
	}

	// Allow burst of 1 second worth of data
	bucket = &tokenBucket{
		tokens:     bl.bytesPerSecond,
		maxTokens:  bl.bytesPerSecond,
		refillRate: bl.bytesPerSecond,
		lastRefill: time.Now(),
	}
	bl.buckets[id] = bucket
	return bucket
}

// request requests tokens from the bucket
func (tb *tokenBucket) request(bytes int64) bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	// Refill tokens
	now := time.Now()
	elapsed := now.Sub(tb.lastRefill).Seconds()
	tb.tokens += int64(elapsed * float64(tb.refillRate))
	if tb.tokens > tb.maxTokens {
		tb.tokens = tb.maxTokens
	}
	tb.lastRefill = now

	// Check if enough tokens
	if bytes > tb.tokens {
		return false
	}

	tb.tokens -= bytes
	return true
}

// Remove removes a bucket
func (bl *BandwidthLimiter) Remove(id string) {
	bl.mu.Lock()
	defer bl.mu.Unlock()
	delete(bl.buckets, id)
}
