// Package metrics provides Prometheus metrics for monitoring.
package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// PrometheusMetrics holds all Prometheus metrics
type PrometheusMetrics struct {
	// HTTP metrics
	HTTPRequestsTotal   *prometheus.CounterVec
	HTTPRequestDuration *prometheus.HistogramVec

	// Connection metrics
	ActiveConnections prometheus.Gauge
	ConnectionsTotal  prometheus.Counter

	// Room metrics
	ActiveRooms   prometheus.Gauge
	RoomsCreated  prometheus.Counter
	RoomsExpired  prometheus.Counter
	RoomDuration  prometheus.Histogram

	// Transfer metrics
	BytesRelayed        prometheus.Counter
	MessagesRelayed     prometheus.Counter
	TransfersCompleted  prometheus.Counter
	TransferDuration    prometheus.Histogram

	// Error metrics
	ErrorsTotal  *prometheus.CounterVec
	PanicsTotal  prometheus.Counter

	// Rate limiting metrics
	RateLimitHits prometheus.Counter
	BannedIPs     prometheus.Gauge

	registry *prometheus.Registry
}

// NewPrometheusMetrics creates and registers all metrics
func NewPrometheusMetrics() *PrometheusMetrics {
	registry := prometheus.NewRegistry()

	m := &PrometheusMetrics{
		registry: registry,

		HTTPRequestsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "http_requests_total",
				Help:      "Total number of HTTP requests",
			},
			[]string{"method", "path", "status"},
		),

		HTTPRequestDuration: prometheus.NewHistogramVec(
			prometheus.HistogramOpts{
				Namespace: "tallow_relay",
				Name:      "http_request_duration_seconds",
				Help:      "HTTP request duration in seconds",
				Buckets:   prometheus.DefBuckets,
			},
			[]string{"method", "path"},
		),

		ActiveConnections: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "tallow_relay",
				Name:      "active_connections",
				Help:      "Number of active WebSocket connections",
			},
		),

		ConnectionsTotal: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "connections_total",
				Help:      "Total number of WebSocket connections",
			},
		),

		ActiveRooms: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "tallow_relay",
				Name:      "active_rooms",
				Help:      "Number of active rooms",
			},
		),

		RoomsCreated: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "rooms_created_total",
				Help:      "Total number of rooms created",
			},
		),

		RoomsExpired: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "rooms_expired_total",
				Help:      "Total number of rooms expired",
			},
		),

		RoomDuration: prometheus.NewHistogram(
			prometheus.HistogramOpts{
				Namespace: "tallow_relay",
				Name:      "room_duration_seconds",
				Help:      "Room lifetime duration in seconds",
				Buckets:   []float64{60, 300, 600, 1800, 3600, 7200, 14400, 28800, 43200, 86400},
			},
		),

		BytesRelayed: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "bytes_relayed_total",
				Help:      "Total bytes relayed",
			},
		),

		MessagesRelayed: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "messages_relayed_total",
				Help:      "Total messages relayed",
			},
		),

		TransfersCompleted: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "transfers_completed_total",
				Help:      "Total transfers completed",
			},
		),

		TransferDuration: prometheus.NewHistogram(
			prometheus.HistogramOpts{
				Namespace: "tallow_relay",
				Name:      "transfer_duration_seconds",
				Help:      "Transfer duration in seconds",
				Buckets:   []float64{1, 5, 10, 30, 60, 120, 300, 600, 1800, 3600},
			},
		),

		ErrorsTotal: prometheus.NewCounterVec(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "errors_total",
				Help:      "Total number of errors",
			},
			[]string{"type"},
		),

		PanicsTotal: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "panics_total",
				Help:      "Total number of panics recovered",
			},
		),

		RateLimitHits: prometheus.NewCounter(
			prometheus.CounterOpts{
				Namespace: "tallow_relay",
				Name:      "rate_limit_hits_total",
				Help:      "Total number of rate limit hits",
			},
		),

		BannedIPs: prometheus.NewGauge(
			prometheus.GaugeOpts{
				Namespace: "tallow_relay",
				Name:      "banned_ips",
				Help:      "Number of currently banned IPs",
			},
		),
	}

	// Register all metrics
	registry.MustRegister(
		m.HTTPRequestsTotal,
		m.HTTPRequestDuration,
		m.ActiveConnections,
		m.ConnectionsTotal,
		m.ActiveRooms,
		m.RoomsCreated,
		m.RoomsExpired,
		m.RoomDuration,
		m.BytesRelayed,
		m.MessagesRelayed,
		m.TransfersCompleted,
		m.TransferDuration,
		m.ErrorsTotal,
		m.PanicsTotal,
		m.RateLimitHits,
		m.BannedIPs,
	)

	// Register default Go metrics
	registry.MustRegister(
		prometheus.NewGoCollector(),
		prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}),
	)

	return m
}

// Handler returns the HTTP handler for metrics endpoint
func (m *PrometheusMetrics) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{
		EnableOpenMetrics: true,
	})
}

// RecordError records an error by type
func (m *PrometheusMetrics) RecordError(errorType string) {
	m.ErrorsTotal.WithLabelValues(errorType).Inc()
}

// RecordHTTPRequest records an HTTP request
func (m *PrometheusMetrics) RecordHTTPRequest(method, path, status string, duration float64) {
	m.HTTPRequestsTotal.WithLabelValues(method, path, status).Inc()
	m.HTTPRequestDuration.WithLabelValues(method, path).Observe(duration)
}
