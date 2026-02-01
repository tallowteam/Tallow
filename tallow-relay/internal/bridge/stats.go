package bridge

import (
	"sync"
	"sync/atomic"
	"time"
)

// TransferStats tracks statistics for a transfer
type TransferStats struct {
	BytesSent     int64
	BytesReceived int64
	MessagesSent  int64
	MsgsReceived  int64
	StartTime     time.Time
	LastActivity  time.Time
	mu            sync.RWMutex
}

// NewTransferStats creates a new transfer stats tracker
func NewTransferStats() *TransferStats {
	now := time.Now()
	return &TransferStats{
		StartTime:    now,
		LastActivity: now,
	}
}

// AddBytesSent adds to bytes sent counter
func (ts *TransferStats) AddBytesSent(n int64) {
	atomic.AddInt64(&ts.BytesSent, n)
	ts.touch()
}

// AddBytesReceived adds to bytes received counter
func (ts *TransferStats) AddBytesReceived(n int64) {
	atomic.AddInt64(&ts.BytesReceived, n)
	ts.touch()
}

// AddMessageSent increments message sent counter
func (ts *TransferStats) AddMessageSent() {
	atomic.AddInt64(&ts.MessagesSent, 1)
	ts.touch()
}

// AddMessageReceived increments message received counter
func (ts *TransferStats) AddMessageReceived() {
	atomic.AddInt64(&ts.MsgsReceived, 1)
	ts.touch()
}

// touch updates the last activity time
func (ts *TransferStats) touch() {
	ts.mu.Lock()
	ts.LastActivity = time.Now()
	ts.mu.Unlock()
}

// TotalBytes returns total bytes transferred
func (ts *TransferStats) TotalBytes() int64 {
	return atomic.LoadInt64(&ts.BytesSent) + atomic.LoadInt64(&ts.BytesReceived)
}

// TotalMessages returns total messages transferred
func (ts *TransferStats) TotalMessages() int64 {
	return atomic.LoadInt64(&ts.MessagesSent) + atomic.LoadInt64(&ts.MsgsReceived)
}

// Duration returns the transfer duration
func (ts *TransferStats) Duration() time.Duration {
	return time.Since(ts.StartTime)
}

// IdleTime returns time since last activity
func (ts *TransferStats) IdleTime() time.Duration {
	ts.mu.RLock()
	defer ts.mu.RUnlock()
	return time.Since(ts.LastActivity)
}

// Throughput returns the average throughput in bytes per second
func (ts *TransferStats) Throughput() float64 {
	duration := ts.Duration().Seconds()
	if duration == 0 {
		return 0
	}
	return float64(ts.TotalBytes()) / duration
}

// Snapshot returns a snapshot of the current stats
type StatsSnapshot struct {
	BytesSent      int64         `json:"bytes_sent"`
	BytesReceived  int64         `json:"bytes_received"`
	TotalBytes     int64         `json:"total_bytes"`
	MessagesSent   int64         `json:"messages_sent"`
	MsgsReceived   int64         `json:"messages_received"`
	TotalMessages  int64         `json:"total_messages"`
	Duration       time.Duration `json:"duration"`
	IdleTime       time.Duration `json:"idle_time"`
	ThroughputBps  float64       `json:"throughput_bps"`
}

// Snapshot returns a point-in-time snapshot of stats
func (ts *TransferStats) Snapshot() StatsSnapshot {
	sent := atomic.LoadInt64(&ts.BytesSent)
	recv := atomic.LoadInt64(&ts.BytesReceived)
	msgSent := atomic.LoadInt64(&ts.MessagesSent)
	msgRecv := atomic.LoadInt64(&ts.MsgsReceived)

	return StatsSnapshot{
		BytesSent:     sent,
		BytesReceived: recv,
		TotalBytes:    sent + recv,
		MessagesSent:  msgSent,
		MsgsReceived:  msgRecv,
		TotalMessages: msgSent + msgRecv,
		Duration:      ts.Duration(),
		IdleTime:      ts.IdleTime(),
		ThroughputBps: ts.Throughput(),
	}
}

// GlobalStats tracks server-wide statistics
type GlobalStats struct {
	TotalBytesRelayed    int64
	TotalMessagesRelayed int64
	TotalTransfers       int64
	ActiveTransfers      int64
	StartTime            time.Time
}

// NewGlobalStats creates a new global stats tracker
func NewGlobalStats() *GlobalStats {
	return &GlobalStats{
		StartTime: time.Now(),
	}
}

// AddBytesRelayed adds to global bytes relayed
func (gs *GlobalStats) AddBytesRelayed(n int64) {
	atomic.AddInt64(&gs.TotalBytesRelayed, n)
}

// AddMessagesRelayed adds to global messages relayed
func (gs *GlobalStats) AddMessagesRelayed(n int64) {
	atomic.AddInt64(&gs.TotalMessagesRelayed, n)
}

// IncrementTransfers increments both total and active transfers
func (gs *GlobalStats) IncrementTransfers() {
	atomic.AddInt64(&gs.TotalTransfers, 1)
	atomic.AddInt64(&gs.ActiveTransfers, 1)
}

// DecrementActiveTransfers decrements active transfers
func (gs *GlobalStats) DecrementActiveTransfers() {
	atomic.AddInt64(&gs.ActiveTransfers, -1)
}

// Uptime returns server uptime
func (gs *GlobalStats) Uptime() time.Duration {
	return time.Since(gs.StartTime)
}
