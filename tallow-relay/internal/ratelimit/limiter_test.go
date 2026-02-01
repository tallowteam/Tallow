package ratelimit

import (
	"sync"
	"testing"
	"time"
)

func TestNewLimiter(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	if limiter == nil {
		t.Fatal("NewLimiter returned nil")
	}

	limiter.Stop()
}

func TestNewLimiterDefaults(t *testing.T) {
	cfg := Config{} // All zeros

	limiter := NewLimiter(cfg)
	if limiter == nil {
		t.Fatal("NewLimiter returned nil")
	}

	// Check defaults applied
	if limiter.config.RequestsPerSecond <= 0 {
		t.Error("RequestsPerSecond should have default")
	}
	if limiter.config.BurstSize <= 0 {
		t.Error("BurstSize should have default")
	}
	if limiter.config.CleanupInterval <= 0 {
		t.Error("CleanupInterval should have default")
	}
	if limiter.config.BanDuration <= 0 {
		t.Error("BanDuration should have default")
	}
	if limiter.config.MaxViolations <= 0 {
		t.Error("MaxViolations should have default")
	}

	limiter.Stop()
}

func TestLimiterAllow(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 100,
		BurstSize:         10,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// First burst should be allowed
	for i := 0; i < 10; i++ {
		if !limiter.Allow(ip) {
			t.Errorf("Request %d should be allowed (within burst)", i)
		}
	}
}

func TestLimiterAllowRateLimit(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 1,
		BurstSize:         2,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// First 2 should be allowed (burst)
	limiter.Allow(ip)
	limiter.Allow(ip)

	// Third should be rate limited
	if limiter.Allow(ip) {
		t.Error("Request beyond burst should be rate limited")
	}
}

func TestLimiterAllowN(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 100,
		BurstSize:         10,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Allow 5 at once
	if !limiter.AllowN(ip, 5) {
		t.Error("AllowN(5) should be allowed")
	}

	// Allow 5 more (at burst limit)
	if !limiter.AllowN(ip, 5) {
		t.Error("AllowN(5) should be allowed (at burst)")
	}

	// Beyond burst should fail
	if limiter.AllowN(ip, 5) {
		t.Error("AllowN(5) beyond burst should be denied")
	}
}

func TestLimiterBanAfterViolations(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 1,
		BurstSize:         1,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     3,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// First request allowed
	limiter.Allow(ip)

	// Exceed limit multiple times to trigger ban
	for i := 0; i < 3; i++ {
		limiter.Allow(ip)
	}

	// Should now be banned
	if !limiter.IsBanned(ip) {
		t.Error("IP should be banned after max violations")
	}

	// Further requests should be denied
	if limiter.Allow(ip) {
		t.Error("Banned IP should be denied")
	}
}

func TestLimiterIsBanned(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Initially not banned
	if limiter.IsBanned(ip) {
		t.Error("IP should not be banned initially")
	}
}

func TestLimiterBan(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Manually ban
	limiter.Ban(ip, time.Hour)

	if !limiter.IsBanned(ip) {
		t.Error("IP should be banned after Ban()")
	}

	if limiter.Allow(ip) {
		t.Error("Banned IP should be denied")
	}
}

func TestLimiterUnban(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	limiter.Ban(ip, time.Hour)
	if !limiter.IsBanned(ip) {
		t.Error("IP should be banned")
	}

	limiter.Unban(ip)
	if limiter.IsBanned(ip) {
		t.Error("IP should not be banned after Unban()")
	}
}

func TestLimiterReset(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Make some requests and ban
	limiter.Allow(ip)
	limiter.Ban(ip, time.Hour)

	limiter.Reset(ip)

	// Should be able to make requests again
	if !limiter.Allow(ip) {
		t.Error("Should be able to make requests after Reset()")
	}

	if limiter.IsBanned(ip) {
		t.Error("Should not be banned after Reset()")
	}
}

func TestLimiterStats(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	// Initially empty
	stats := limiter.Stats()
	if stats.ActiveLimiters != 0 {
		t.Errorf("Initial ActiveLimiters = %d, want 0", stats.ActiveLimiters)
	}
	if stats.BannedIPs != 0 {
		t.Errorf("Initial BannedIPs = %d, want 0", stats.BannedIPs)
	}

	// Make some requests
	limiter.Allow("192.168.1.1")
	limiter.Allow("192.168.1.2")
	limiter.Ban("192.168.1.3", time.Hour)

	stats = limiter.Stats()
	if stats.ActiveLimiters != 2 {
		t.Errorf("ActiveLimiters = %d, want 2", stats.ActiveLimiters)
	}
	if stats.BannedIPs != 1 {
		t.Errorf("BannedIPs = %d, want 1", stats.BannedIPs)
	}
}

func TestLimiterGetViolations(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 1,
		BurstSize:         1,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     10,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// No violations initially
	if limiter.GetViolations(ip) != 0 {
		t.Error("Initial violations should be 0")
	}

	// Use up burst
	limiter.Allow(ip)

	// Trigger violations
	limiter.Allow(ip) // violation 1
	limiter.Allow(ip) // violation 2

	if limiter.GetViolations(ip) != 2 {
		t.Errorf("Violations = %d, want 2", limiter.GetViolations(ip))
	}
}

func TestLimiterBannedUntil(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Not banned
	if !limiter.BannedUntil(ip).IsZero() {
		t.Error("BannedUntil should be zero for non-banned IP")
	}

	// Ban for 1 hour
	banDuration := time.Hour
	before := time.Now()
	limiter.Ban(ip, banDuration)
	after := time.Now()

	bannedUntil := limiter.BannedUntil(ip)
	expectedMin := before.Add(banDuration)
	expectedMax := after.Add(banDuration)

	if bannedUntil.Before(expectedMin) || bannedUntil.After(expectedMax) {
		t.Errorf("BannedUntil = %v, expected between %v and %v", bannedUntil, expectedMin, expectedMax)
	}
}

func TestLimiterBanExpiry(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Second,
		BanDuration:       100 * time.Millisecond,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	limiter.Ban(ip, 50*time.Millisecond)

	if !limiter.IsBanned(ip) {
		t.Error("IP should be banned immediately after Ban()")
	}

	// Wait for ban to expire
	time.Sleep(100 * time.Millisecond)

	// Should not be banned anymore
	if limiter.IsBanned(ip) {
		t.Error("Ban should have expired")
	}

	// Should be able to make requests
	if !limiter.Allow(ip) {
		t.Error("Should be able to make requests after ban expires")
	}
}

func TestLimiterMultipleIPs(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         5,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ips := []string{"192.168.1.1", "192.168.1.2", "192.168.1.3"}

	// Each IP gets its own limit
	for _, ip := range ips {
		for i := 0; i < 5; i++ {
			if !limiter.Allow(ip) {
				t.Errorf("Request from %s should be allowed", ip)
			}
		}
	}

	// All should have hit their burst limit
	for _, ip := range ips {
		if limiter.Allow(ip) {
			t.Errorf("Request from %s beyond burst should be denied", ip)
		}
	}
}

func TestLimiterViolationReset(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 100, // High rate
		BurstSize:         2,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     10,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	// Use burst
	limiter.Allow(ip)
	limiter.Allow(ip)

	// Trigger a violation
	limiter.Allow(ip)

	if limiter.GetViolations(ip) != 1 {
		t.Error("Should have 1 violation")
	}

	// Wait for rate limit to refresh
	time.Sleep(50 * time.Millisecond)

	// Make a successful request
	if !limiter.Allow(ip) {
		t.Error("Request should be allowed after rate limit refresh")
	}

	// Violations should be reset
	if limiter.GetViolations(ip) != 0 {
		t.Errorf("Violations should be 0 after successful request, got %d", limiter.GetViolations(ip))
	}
}

func TestLimiterConcurrency(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 1000,
		BurstSize:         100,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				limiter.Allow(ip)
			}
		}()
	}

	wg.Wait()

	// Should not have panicked
	_ = limiter.Stats()
}

func TestLimiterStop(t *testing.T) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   10 * time.Millisecond,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)

	// Should complete without blocking indefinitely
	done := make(chan struct{})
	go func() {
		limiter.Stop()
		close(done)
	}()

	select {
	case <-done:
		// OK
	case <-time.After(time.Second):
		t.Error("Stop() took too long")
	}
}

func BenchmarkAllow(b *testing.B) {
	cfg := Config{
		RequestsPerSecond: 10000,
		BurstSize:         1000,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		limiter.Allow(ip)
	}
}

func BenchmarkAllowMultipleIPs(b *testing.B) {
	cfg := Config{
		RequestsPerSecond: 10000,
		BurstSize:         1000,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ips := make([]string, 100)
	for i := 0; i < 100; i++ {
		ips[i] = "192.168.1." + string(rune('0'+i%10))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		limiter.Allow(ips[i%100])
	}
}

func BenchmarkIsBanned(b *testing.B) {
	cfg := Config{
		RequestsPerSecond: 10,
		BurstSize:         20,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     5,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	ip := "192.168.1.1"
	limiter.Ban(ip, time.Hour)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		limiter.IsBanned(ip)
	}
}

func BenchmarkStats(b *testing.B) {
	cfg := Config{
		RequestsPerSecond: 10000,
		BurstSize:         1000,
		CleanupInterval:   time.Minute,
		BanDuration:       time.Hour,
		MaxViolations:     100,
	}

	limiter := NewLimiter(cfg)
	defer limiter.Stop()

	// Add some IPs
	for i := 0; i < 100; i++ {
		limiter.Allow("192.168.1." + string(rune('0'+i%10)))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		limiter.Stats()
	}
}
