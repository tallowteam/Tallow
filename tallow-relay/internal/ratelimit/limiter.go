// Package ratelimit provides per-IP rate limiting functionality.
package ratelimit

import (
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// Config holds rate limiter configuration
type Config struct {
	RequestsPerSecond float64
	BurstSize         int
	CleanupInterval   time.Duration
	BanDuration       time.Duration
	MaxViolations     int
}

// Limiter implements per-IP rate limiting
type Limiter struct {
	config   Config
	limiters map[string]*ipLimiter
	banned   map[string]time.Time
	mu       sync.RWMutex
	stopCh   chan struct{}
	doneCh   chan struct{}
}

// ipLimiter tracks rate limiting state for a single IP
type ipLimiter struct {
	limiter    *rate.Limiter
	violations int
	lastSeen   time.Time
}

// NewLimiter creates a new rate limiter
func NewLimiter(cfg Config) *Limiter {
	if cfg.RequestsPerSecond <= 0 {
		cfg.RequestsPerSecond = 10
	}
	if cfg.BurstSize <= 0 {
		cfg.BurstSize = 20
	}
	if cfg.CleanupInterval <= 0 {
		cfg.CleanupInterval = 10 * time.Minute
	}
	if cfg.BanDuration <= 0 {
		cfg.BanDuration = 1 * time.Hour
	}
	if cfg.MaxViolations <= 0 {
		cfg.MaxViolations = 5
	}

	l := &Limiter{
		config:   cfg,
		limiters: make(map[string]*ipLimiter),
		banned:   make(map[string]time.Time),
		stopCh:   make(chan struct{}),
		doneCh:   make(chan struct{}),
	}

	// Start cleanup goroutine
	go l.cleanup()

	return l
}

// Allow checks if a request from the given IP is allowed
func (l *Limiter) Allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Check if banned
	if banUntil, banned := l.banned[ip]; banned {
		if time.Now().Before(banUntil) {
			return false
		}
		// Ban expired, remove it
		delete(l.banned, ip)
	}

	// Get or create limiter for this IP
	il, exists := l.limiters[ip]
	if !exists {
		il = &ipLimiter{
			limiter:  rate.NewLimiter(rate.Limit(l.config.RequestsPerSecond), l.config.BurstSize),
			lastSeen: time.Now(),
		}
		l.limiters[ip] = il
	}

	il.lastSeen = time.Now()

	// Check rate limit
	if !il.limiter.Allow() {
		il.violations++

		// Ban if too many violations
		if il.violations >= l.config.MaxViolations {
			l.banned[ip] = time.Now().Add(l.config.BanDuration)
			delete(l.limiters, ip)
		}

		return false
	}

	// Reset violations on successful request
	il.violations = 0
	return true
}

// AllowN checks if n requests from the given IP are allowed
func (l *Limiter) AllowN(ip string, n int) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Check if banned
	if banUntil, banned := l.banned[ip]; banned {
		if time.Now().Before(banUntil) {
			return false
		}
		delete(l.banned, ip)
	}

	il, exists := l.limiters[ip]
	if !exists {
		il = &ipLimiter{
			limiter:  rate.NewLimiter(rate.Limit(l.config.RequestsPerSecond), l.config.BurstSize),
			lastSeen: time.Now(),
		}
		l.limiters[ip] = il
	}

	il.lastSeen = time.Now()

	if !il.limiter.AllowN(time.Now(), n) {
		il.violations++
		if il.violations >= l.config.MaxViolations {
			l.banned[ip] = time.Now().Add(l.config.BanDuration)
			delete(l.limiters, ip)
		}
		return false
	}

	il.violations = 0
	return true
}

// IsBanned checks if an IP is banned
func (l *Limiter) IsBanned(ip string) bool {
	l.mu.RLock()
	defer l.mu.RUnlock()

	banUntil, banned := l.banned[ip]
	if !banned {
		return false
	}
	return time.Now().Before(banUntil)
}

// Ban manually bans an IP
func (l *Limiter) Ban(ip string, duration time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.banned[ip] = time.Now().Add(duration)
	delete(l.limiters, ip)
}

// Unban removes a ban for an IP
func (l *Limiter) Unban(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.banned, ip)
}

// Reset resets the limiter for an IP
func (l *Limiter) Reset(ip string) {
	l.mu.Lock()
	defer l.mu.Unlock()

	delete(l.limiters, ip)
	delete(l.banned, ip)
}

// Stats returns current limiter statistics
type Stats struct {
	ActiveLimiters int
	BannedIPs      int
}

// Stats returns limiter statistics
func (l *Limiter) Stats() Stats {
	l.mu.RLock()
	defer l.mu.RUnlock()

	return Stats{
		ActiveLimiters: len(l.limiters),
		BannedIPs:      len(l.banned),
	}
}

// Stop stops the limiter cleanup goroutine
func (l *Limiter) Stop() {
	close(l.stopCh)
	<-l.doneCh
}

// cleanup periodically removes old limiters and expired bans
func (l *Limiter) cleanup() {
	defer close(l.doneCh)

	ticker := time.NewTicker(l.config.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-l.stopCh:
			return
		case <-ticker.C:
			l.doCleanup()
		}
	}
}

// doCleanup performs the actual cleanup
func (l *Limiter) doCleanup() {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()

	// Clean up old limiters
	for ip, il := range l.limiters {
		if now.Sub(il.lastSeen) > l.config.CleanupInterval*2 {
			delete(l.limiters, ip)
		}
	}

	// Clean up expired bans
	for ip, banUntil := range l.banned {
		if now.After(banUntil) {
			delete(l.banned, ip)
		}
	}
}

// GetViolations returns the number of violations for an IP
func (l *Limiter) GetViolations(ip string) int {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if il, exists := l.limiters[ip]; exists {
		return il.violations
	}
	return 0
}

// BannedUntil returns when the IP ban expires, or zero if not banned
func (l *Limiter) BannedUntil(ip string) time.Time {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if banUntil, banned := l.banned[ip]; banned {
		return banUntil
	}
	return time.Time{}
}
