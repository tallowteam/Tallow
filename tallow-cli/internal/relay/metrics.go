package relay

import (
	"net/http"
	"sync/atomic"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics provides Prometheus metrics for the relay server
type Metrics struct {
	// Counters
	ConnectionsTotal     prometheus.Counter
	BytesTransferred     prometheus.Counter
	RoomsCreated         prometheus.Counter
	TransfersCompleted   prometheus.Counter
	TransfersFailed      prometheus.Counter
	AuthFailures         prometheus.Counter

	// Gauges
	ActiveConnections    prometheus.Gauge
	ActiveRooms          prometheus.Gauge
	ActiveTransfers      prometheus.Gauge

	// Histograms
	TransferDuration     prometheus.Histogram
	TransferSize         prometheus.Histogram
	ConnectionDuration   prometheus.Histogram

	// Internal counters for non-Prometheus use
	totalConnections     int64
	totalBytesIn         int64
	totalBytesOut        int64
}

// NewMetrics creates a new Metrics instance and registers with Prometheus
func NewMetrics(namespace string) *Metrics {
	if namespace == "" {
		namespace = "tallow_relay"
	}

	m := &Metrics{
		ConnectionsTotal: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "connections_total",
			Help:      "Total number of connections",
		}),
		BytesTransferred: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "bytes_transferred_total",
			Help:      "Total bytes transferred",
		}),
		RoomsCreated: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "rooms_created_total",
			Help:      "Total number of rooms created",
		}),
		TransfersCompleted: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "transfers_completed_total",
			Help:      "Total number of completed transfers",
		}),
		TransfersFailed: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "transfers_failed_total",
			Help:      "Total number of failed transfers",
		}),
		AuthFailures: prometheus.NewCounter(prometheus.CounterOpts{
			Namespace: namespace,
			Name:      "auth_failures_total",
			Help:      "Total number of authentication failures",
		}),
		ActiveConnections: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "active_connections",
			Help:      "Number of active connections",
		}),
		ActiveRooms: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "active_rooms",
			Help:      "Number of active rooms",
		}),
		ActiveTransfers: prometheus.NewGauge(prometheus.GaugeOpts{
			Namespace: namespace,
			Name:      "active_transfers",
			Help:      "Number of active transfers",
		}),
		TransferDuration: prometheus.NewHistogram(prometheus.HistogramOpts{
			Namespace: namespace,
			Name:      "transfer_duration_seconds",
			Help:      "Transfer duration in seconds",
			Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600, 1800},
		}),
		TransferSize: prometheus.NewHistogram(prometheus.HistogramOpts{
			Namespace: namespace,
			Name:      "transfer_size_bytes",
			Help:      "Transfer size in bytes",
			Buckets:   prometheus.ExponentialBuckets(1024, 4, 10), // 1KB to ~1GB
		}),
		ConnectionDuration: prometheus.NewHistogram(prometheus.HistogramOpts{
			Namespace: namespace,
			Name:      "connection_duration_seconds",
			Help:      "Connection duration in seconds",
			Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600},
		}),
	}

	// Register all metrics
	prometheus.MustRegister(
		m.ConnectionsTotal,
		m.BytesTransferred,
		m.RoomsCreated,
		m.TransfersCompleted,
		m.TransfersFailed,
		m.AuthFailures,
		m.ActiveConnections,
		m.ActiveRooms,
		m.ActiveTransfers,
		m.TransferDuration,
		m.TransferSize,
		m.ConnectionDuration,
	)

	return m
}

// Handler returns the Prometheus HTTP handler
func (m *Metrics) Handler() http.Handler {
	return promhttp.Handler()
}

// RecordConnection records a new connection
func (m *Metrics) RecordConnection() {
	m.ConnectionsTotal.Inc()
	m.ActiveConnections.Inc()
	atomic.AddInt64(&m.totalConnections, 1)
}

// RecordDisconnection records a disconnection
func (m *Metrics) RecordDisconnection(duration time.Duration) {
	m.ActiveConnections.Dec()
	m.ConnectionDuration.Observe(duration.Seconds())
}

// RecordRoomCreated records a new room
func (m *Metrics) RecordRoomCreated() {
	m.RoomsCreated.Inc()
	m.ActiveRooms.Inc()
}

// RecordRoomClosed records a room closure
func (m *Metrics) RecordRoomClosed() {
	m.ActiveRooms.Dec()
}

// RecordTransferStart records the start of a transfer
func (m *Metrics) RecordTransferStart() {
	m.ActiveTransfers.Inc()
}

// RecordTransferComplete records a completed transfer
func (m *Metrics) RecordTransferComplete(duration time.Duration, size int64) {
	m.ActiveTransfers.Dec()
	m.TransfersCompleted.Inc()
	m.TransferDuration.Observe(duration.Seconds())
	m.TransferSize.Observe(float64(size))
}

// RecordTransferFailed records a failed transfer
func (m *Metrics) RecordTransferFailed() {
	m.ActiveTransfers.Dec()
	m.TransfersFailed.Inc()
}

// RecordBytes records bytes transferred
func (m *Metrics) RecordBytes(bytes int64) {
	m.BytesTransferred.Add(float64(bytes))
	atomic.AddInt64(&m.totalBytesIn, bytes)
}

// RecordAuthFailure records an authentication failure
func (m *Metrics) RecordAuthFailure() {
	m.AuthFailures.Inc()
}

// GetStats returns basic statistics
type RelayStats struct {
	TotalConnections int64
	TotalBytesIn     int64
	TotalBytesOut    int64
	Uptime           time.Duration
}

// Stats returns current relay statistics
func (m *Metrics) Stats(startTime time.Time) RelayStats {
	return RelayStats{
		TotalConnections: atomic.LoadInt64(&m.totalConnections),
		TotalBytesIn:     atomic.LoadInt64(&m.totalBytesIn),
		TotalBytesOut:    atomic.LoadInt64(&m.totalBytesOut),
		Uptime:           time.Since(startTime),
	}
}

// SimpleMetrics provides basic metrics without Prometheus
type SimpleMetrics struct {
	connections      int64
	rooms            int64
	bytesTransferred int64
	startTime        time.Time
}

// NewSimpleMetrics creates simple metrics
func NewSimpleMetrics() *SimpleMetrics {
	return &SimpleMetrics{
		startTime: time.Now(),
	}
}

// IncConnections increments connection count
func (sm *SimpleMetrics) IncConnections() {
	atomic.AddInt64(&sm.connections, 1)
}

// DecConnections decrements connection count
func (sm *SimpleMetrics) DecConnections() {
	atomic.AddInt64(&sm.connections, -1)
}

// IncRooms increments room count
func (sm *SimpleMetrics) IncRooms() {
	atomic.AddInt64(&sm.rooms, 1)
}

// DecRooms decrements room count
func (sm *SimpleMetrics) DecRooms() {
	atomic.AddInt64(&sm.rooms, -1)
}

// AddBytes adds bytes transferred
func (sm *SimpleMetrics) AddBytes(n int64) {
	atomic.AddInt64(&sm.bytesTransferred, n)
}

// Connections returns connection count
func (sm *SimpleMetrics) Connections() int64 {
	return atomic.LoadInt64(&sm.connections)
}

// Rooms returns room count
func (sm *SimpleMetrics) Rooms() int64 {
	return atomic.LoadInt64(&sm.rooms)
}

// BytesTransferred returns total bytes transferred
func (sm *SimpleMetrics) BytesTransferred() int64 {
	return atomic.LoadInt64(&sm.bytesTransferred)
}

// Uptime returns uptime
func (sm *SimpleMetrics) Uptime() time.Duration {
	return time.Since(sm.startTime)
}
