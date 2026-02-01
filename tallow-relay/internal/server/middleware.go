package server

import (
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/internal/ratelimit"
)

// Middleware wraps HTTP handlers with common functionality
type Middleware struct {
	log         *logging.Logger
	metrics     *metrics.PrometheusMetrics
	rateLimiter *ratelimit.Limiter
	config      *Config
}

// NewMiddleware creates a new middleware instance
func NewMiddleware(cfg *Config, log *logging.Logger, m *metrics.PrometheusMetrics, rl *ratelimit.Limiter) *Middleware {
	return &Middleware{
		log:         log.WithComponent("middleware"),
		metrics:     m,
		rateLimiter: rl,
		config:      cfg,
	}
}

// Chain applies multiple middleware in order
func (m *Middleware) Chain(h http.Handler) http.Handler {
	// Apply in reverse order (last applied runs first)
	h = m.Recovery(h)
	h = m.Logging(h)
	h = m.Metrics(h)
	if m.config.RateLimit.Enabled {
		h = m.RateLimit(h)
	}
	h = m.CORS(h)
	h = m.Security(h)
	return h
}

// Security adds security headers
func (m *Middleware) Security(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Content-Security-Policy", "default-src 'self'")

		// Remove server identification
		w.Header().Del("Server")

		next.ServeHTTP(w, r)
	})
}

// CORS handles Cross-Origin Resource Sharing
func (m *Middleware) CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow WebSocket upgrades from any origin (the app can be self-hosted)
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "86400")

		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// RateLimit applies per-IP rate limiting
func (m *Middleware) RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)

		if !m.rateLimiter.Allow(ip) {
			m.log.Warn().Str("ip", ip).Msg("Rate limit exceeded")
			m.metrics.RateLimitHits.Inc()

			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Logging logs HTTP requests
func (m *Middleware) Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap response writer to capture status
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)

		// Don't log health checks at info level
		if r.URL.Path == "/health" || r.URL.Path == "/ready" {
			m.log.Debug().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", wrapped.status).
				Dur("duration", duration).
				Msg("Request completed")
		} else {
			m.log.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Str("ip", getClientIP(r)).
				Int("status", wrapped.status).
				Int64("bytes", wrapped.written).
				Dur("duration", duration).
				Msg("Request completed")
		}
	})
}

// Metrics records HTTP metrics
func (m *Middleware) Metrics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start).Seconds()

		m.metrics.HTTPRequestsTotal.WithLabelValues(
			r.Method,
			r.URL.Path,
			http.StatusText(wrapped.status),
		).Inc()

		m.metrics.HTTPRequestDuration.WithLabelValues(
			r.Method,
			r.URL.Path,
		).Observe(duration)
	})
}

// Recovery recovers from panics
func (m *Middleware) Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				m.log.Error().
					Interface("error", err).
					Str("path", r.URL.Path).
					Msg("Panic recovered")

				m.metrics.PanicsTotal.Inc()

				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture status and bytes
type responseWriter struct {
	http.ResponseWriter
	status  int
	written int64
}

func (w *responseWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *responseWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.written += int64(n)
	return n, err
}

// getClientIP extracts the real client IP from request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (from reverse proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to remote address
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
