// Package bridge provides bidirectional relay tunneling between peers.
package bridge

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
)

// Config holds bridge configuration
type Config struct {
	BufferSize      int
	MaxBytesPerRoom int64
	IdleTimeout     time.Duration
}

// Bridge manages bidirectional relay between two peers
type Bridge struct {
	config  Config
	log     *logging.Logger
	metrics *metrics.PrometheusMetrics
}

// Stats holds bridge statistics
type Stats struct {
	BytesTransferred int64
	MessagesRelayed  int64
	Duration         time.Duration
	StartTime        time.Time
	EndTime          time.Time
	TerminationReason string
}

// NewBridge creates a new bridge
func NewBridge(cfg Config, log *logging.Logger, m *metrics.PrometheusMetrics) *Bridge {
	return &Bridge{
		config:  cfg,
		log:     log.WithComponent("bridge"),
		metrics: m,
	}
}

// Start begins bidirectional relay between two peers
// This blocks until the bridge is closed
func (b *Bridge) Start(peer1, peer2 *Peer) Stats {
	stats := Stats{
		StartTime: time.Now(),
	}

	var bytesTransferred int64
	var messagesRelayed int64

	// Create channels for coordination
	done := make(chan struct{})
	var once sync.Once
	closeDone := func() {
		once.Do(func() {
			close(done)
		})
	}

	// Track idle timeout
	lastActivity := time.Now()
	var activityMu sync.Mutex

	updateActivity := func() {
		activityMu.Lock()
		lastActivity = time.Now()
		activityMu.Unlock()
	}

	// Start idle timeout checker
	go func() {
		ticker := time.NewTicker(time.Second * 10)
		defer ticker.Stop()

		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				activityMu.Lock()
				idle := time.Since(lastActivity)
				activityMu.Unlock()

				if idle > b.config.IdleTimeout {
					b.log.Warn().
						Dur("idle_duration", idle).
						Msg("Bridge idle timeout")
					stats.TerminationReason = "idle_timeout"
					closeDone()
					return
				}
			}
		}
	}()

	// Relay from peer1 to peer2
	go func() {
		defer closeDone()
		for {
			select {
			case <-done:
				return
			default:
			}

			data, err := peer1.ReadRaw()
			if err != nil {
				b.log.Debug().Err(err).Msg("Peer1 read error")
				if stats.TerminationReason == "" {
					stats.TerminationReason = "peer1_disconnect"
				}
				return
			}

			updateActivity()
			atomic.AddInt64(&bytesTransferred, int64(len(data)))
			atomic.AddInt64(&messagesRelayed, 1)

			// Check byte limit
			if b.config.MaxBytesPerRoom > 0 && atomic.LoadInt64(&bytesTransferred) > b.config.MaxBytesPerRoom {
				b.log.Warn().
					Int64("bytes", atomic.LoadInt64(&bytesTransferred)).
					Int64("limit", b.config.MaxBytesPerRoom).
					Msg("Bridge byte limit exceeded")
				stats.TerminationReason = "byte_limit_exceeded"
				return
			}

			if err := peer2.WriteRaw(data); err != nil {
				b.log.Debug().Err(err).Msg("Peer2 write error")
				if stats.TerminationReason == "" {
					stats.TerminationReason = "peer2_disconnect"
				}
				return
			}

			// Update metrics
			if b.metrics != nil {
				b.metrics.BytesRelayed.Add(float64(len(data)))
				b.metrics.MessagesRelayed.Inc()
			}
		}
	}()

	// Relay from peer2 to peer1
	go func() {
		defer closeDone()
		for {
			select {
			case <-done:
				return
			default:
			}

			data, err := peer2.ReadRaw()
			if err != nil {
				b.log.Debug().Err(err).Msg("Peer2 read error")
				if stats.TerminationReason == "" {
					stats.TerminationReason = "peer2_disconnect"
				}
				return
			}

			updateActivity()
			atomic.AddInt64(&bytesTransferred, int64(len(data)))
			atomic.AddInt64(&messagesRelayed, 1)

			// Check byte limit
			if b.config.MaxBytesPerRoom > 0 && atomic.LoadInt64(&bytesTransferred) > b.config.MaxBytesPerRoom {
				b.log.Warn().
					Int64("bytes", atomic.LoadInt64(&bytesTransferred)).
					Int64("limit", b.config.MaxBytesPerRoom).
					Msg("Bridge byte limit exceeded")
				stats.TerminationReason = "byte_limit_exceeded"
				return
			}

			if err := peer1.WriteRaw(data); err != nil {
				b.log.Debug().Err(err).Msg("Peer1 write error")
				if stats.TerminationReason == "" {
					stats.TerminationReason = "peer1_disconnect"
				}
				return
			}

			// Update metrics
			if b.metrics != nil {
				b.metrics.BytesRelayed.Add(float64(len(data)))
				b.metrics.MessagesRelayed.Inc()
			}
		}
	}()

	// Wait for completion
	<-done

	stats.EndTime = time.Now()
	stats.Duration = stats.EndTime.Sub(stats.StartTime)
	stats.BytesTransferred = atomic.LoadInt64(&bytesTransferred)
	stats.MessagesRelayed = atomic.LoadInt64(&messagesRelayed)

	if stats.TerminationReason == "" {
		stats.TerminationReason = "normal"
	}

	// Update final metrics
	if b.metrics != nil {
		b.metrics.TransferDuration.Observe(stats.Duration.Seconds())
		b.metrics.TransfersCompleted.Inc()
	}

	return stats
}
