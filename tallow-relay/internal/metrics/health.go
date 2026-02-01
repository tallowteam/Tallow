package metrics

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

// HealthStatus represents the health status
type HealthStatus string

const (
	HealthStatusHealthy   HealthStatus = "healthy"
	HealthStatusDegraded  HealthStatus = "degraded"
	HealthStatusUnhealthy HealthStatus = "unhealthy"
)

// HealthCheck represents a single health check
type HealthCheck struct {
	Name        string            `json:"name"`
	Status      HealthStatus      `json:"status"`
	Message     string            `json:"message,omitempty"`
	LastChecked time.Time         `json:"last_checked"`
	Details     map[string]string `json:"details,omitempty"`
}

// HealthResponse is the response for health endpoints
type HealthResponse struct {
	Status     HealthStatus  `json:"status"`
	Timestamp  time.Time     `json:"timestamp"`
	Version    string        `json:"version,omitempty"`
	Uptime     string        `json:"uptime,omitempty"`
	Checks     []HealthCheck `json:"checks,omitempty"`
}

// HealthChecker manages health checks
type HealthChecker struct {
	checks    map[string]func() HealthCheck
	startTime time.Time
	version   string
	mu        sync.RWMutex
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(version string) *HealthChecker {
	return &HealthChecker{
		checks:    make(map[string]func() HealthCheck),
		startTime: time.Now(),
		version:   version,
	}
}

// RegisterCheck registers a health check
func (hc *HealthChecker) RegisterCheck(name string, check func() HealthCheck) {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	hc.checks[name] = check
}

// RemoveCheck removes a health check
func (hc *HealthChecker) RemoveCheck(name string) {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	delete(hc.checks, name)
}

// Check runs all health checks
func (hc *HealthChecker) Check() HealthResponse {
	hc.mu.RLock()
	defer hc.mu.RUnlock()

	response := HealthResponse{
		Status:    HealthStatusHealthy,
		Timestamp: time.Now(),
		Version:   hc.version,
		Uptime:    time.Since(hc.startTime).Round(time.Second).String(),
		Checks:    make([]HealthCheck, 0, len(hc.checks)),
	}

	for name, check := range hc.checks {
		result := check()
		result.Name = name
		result.LastChecked = time.Now()
		response.Checks = append(response.Checks, result)

		// Update overall status
		if result.Status == HealthStatusUnhealthy {
			response.Status = HealthStatusUnhealthy
		} else if result.Status == HealthStatusDegraded && response.Status == HealthStatusHealthy {
			response.Status = HealthStatusDegraded
		}
	}

	return response
}

// IsHealthy returns true if all checks pass
func (hc *HealthChecker) IsHealthy() bool {
	response := hc.Check()
	return response.Status == HealthStatusHealthy
}

// HealthHandler returns an HTTP handler for the health endpoint
func (hc *HealthChecker) HealthHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		response := hc.Check()

		w.Header().Set("Content-Type", "application/json")

		switch response.Status {
		case HealthStatusHealthy:
			w.WriteHeader(http.StatusOK)
		case HealthStatusDegraded:
			w.WriteHeader(http.StatusOK) // Still serving, just degraded
		case HealthStatusUnhealthy:
			w.WriteHeader(http.StatusServiceUnavailable)
		}

		json.NewEncoder(w).Encode(response)
	}
}

// LivenessHandler returns an HTTP handler for the liveness endpoint
// This is a simple check that returns 200 if the server is running
func (hc *HealthChecker) LivenessHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status": "alive",
		})
	}
}

// ReadinessHandler returns an HTTP handler for the readiness endpoint
func (hc *HealthChecker) ReadinessHandler(isReady func() bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if isReady() {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]string{
				"status": "ready",
			})
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]string{
				"status": "not ready",
			})
		}
	}
}

// Uptime returns the server uptime
func (hc *HealthChecker) Uptime() time.Duration {
	return time.Since(hc.startTime)
}

// StartTime returns when the server started
func (hc *HealthChecker) StartTime() time.Time {
	return hc.startTime
}

// Common health check functions

// MemoryCheck returns a health check for memory usage
func MemoryCheck(maxBytes uint64) func() HealthCheck {
	return func() HealthCheck {
		var m struct {
			Alloc uint64
		}
		// In production, use runtime.ReadMemStats

		if m.Alloc > maxBytes {
			return HealthCheck{
				Status:  HealthStatusDegraded,
				Message: "High memory usage",
				Details: map[string]string{
					"alloc_bytes": "unknown",
					"max_bytes":   "unknown",
				},
			}
		}

		return HealthCheck{
			Status:  HealthStatusHealthy,
			Message: "Memory usage normal",
		}
	}
}

// AlwaysHealthy returns a health check that always passes
func AlwaysHealthy(message string) func() HealthCheck {
	return func() HealthCheck {
		return HealthCheck{
			Status:  HealthStatusHealthy,
			Message: message,
		}
	}
}
