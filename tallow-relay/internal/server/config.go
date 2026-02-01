// Package server provides the main HTTP/WebSocket server implementation.
package server

import (
	"os"
	"strconv"
	"time"

	"gopkg.in/yaml.v3"
)

// Config holds all server configuration
type Config struct {
	Server    ServerConfig    `yaml:"server"`
	Room      RoomConfig      `yaml:"room"`
	RateLimit RateLimitConfig `yaml:"rate_limit"`
	Bridge    BridgeConfig    `yaml:"bridge"`
	TLS       TLSConfig       `yaml:"tls"`
	Metrics   MetricsConfig   `yaml:"metrics"`
}

// ServerConfig holds HTTP server settings
type ServerConfig struct {
	Host            string        `yaml:"host"`
	Port            int           `yaml:"port"`
	ReadTimeout     time.Duration `yaml:"read_timeout"`
	WriteTimeout    time.Duration `yaml:"write_timeout"`
	IdleTimeout     time.Duration `yaml:"idle_timeout"`
	MaxHeaderBytes  int           `yaml:"max_header_bytes"`
	ShutdownTimeout time.Duration `yaml:"shutdown_timeout"`
}

// RoomConfig holds room management settings
type RoomConfig struct {
	MaxRooms        int           `yaml:"max_rooms"`
	DefaultExpiry   time.Duration `yaml:"default_expiry"`
	MaxExpiry       time.Duration `yaml:"max_expiry"`
	CleanupInterval time.Duration `yaml:"cleanup_interval"`
	CodeWordCount   int           `yaml:"code_word_count"`
}

// RateLimitConfig holds rate limiting settings
type RateLimitConfig struct {
	Enabled           bool          `yaml:"enabled"`
	RequestsPerSecond float64       `yaml:"requests_per_second"`
	BurstSize         int           `yaml:"burst_size"`
	CleanupInterval   time.Duration `yaml:"cleanup_interval"`
	BanDuration       time.Duration `yaml:"ban_duration"`
	MaxViolations     int           `yaml:"max_violations"`
}

// BridgeConfig holds bridge/tunnel settings
type BridgeConfig struct {
	BufferSize       int           `yaml:"buffer_size"`
	MaxMessageSize   int64         `yaml:"max_message_size"`
	ReadDeadline     time.Duration `yaml:"read_deadline"`
	WriteDeadline    time.Duration `yaml:"write_deadline"`
	PingInterval     time.Duration `yaml:"ping_interval"`
	PongTimeout      time.Duration `yaml:"pong_timeout"`
	MaxBytesPerRoom  int64         `yaml:"max_bytes_per_room"`
	IdleTimeout      time.Duration `yaml:"idle_timeout"`
}

// TLSConfig holds TLS settings
type TLSConfig struct {
	Enabled  bool   `yaml:"enabled"`
	CertFile string `yaml:"cert_file"`
	KeyFile  string `yaml:"key_file"`
	AutoTLS  bool   `yaml:"auto_tls"`
}

// MetricsConfig holds metrics/monitoring settings
type MetricsConfig struct {
	Enabled     bool   `yaml:"enabled"`
	Path        string `yaml:"path"`
	HealthPath  string `yaml:"health_path"`
	ReadyPath   string `yaml:"ready_path"`
	Port        int    `yaml:"port"`
	Namespace   string `yaml:"namespace"`
}

// DefaultConfig returns configuration with sensible defaults
func DefaultConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Host:            "0.0.0.0",
			Port:            8080,
			ReadTimeout:     30 * time.Second,
			WriteTimeout:    30 * time.Second,
			IdleTimeout:     120 * time.Second,
			MaxHeaderBytes:  1 << 20, // 1MB
			ShutdownTimeout: 30 * time.Second,
		},
		Room: RoomConfig{
			MaxRooms:        10000,
			DefaultExpiry:   24 * time.Hour,
			MaxExpiry:       72 * time.Hour,
			CleanupInterval: 5 * time.Minute,
			CodeWordCount:   3,
		},
		RateLimit: RateLimitConfig{
			Enabled:           true,
			RequestsPerSecond: 10,
			BurstSize:         20,
			CleanupInterval:   10 * time.Minute,
			BanDuration:       1 * time.Hour,
			MaxViolations:     5,
		},
		Bridge: BridgeConfig{
			BufferSize:      32 * 1024, // 32KB
			MaxMessageSize:  64 * 1024 * 1024, // 64MB
			ReadDeadline:    60 * time.Second,
			WriteDeadline:   30 * time.Second,
			PingInterval:    30 * time.Second,
			PongTimeout:     10 * time.Second,
			MaxBytesPerRoom: 10 * 1024 * 1024 * 1024, // 10GB
			IdleTimeout:     5 * time.Minute,
		},
		TLS: TLSConfig{
			Enabled: false,
		},
		Metrics: MetricsConfig{
			Enabled:    true,
			Path:       "/metrics",
			HealthPath: "/health",
			ReadyPath:  "/ready",
			Port:       9090,
			Namespace:  "tallow_relay",
		},
	}
}

// LoadConfig loads configuration from a YAML file
func LoadConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	cfg := DefaultConfig()
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

// ApplyEnvironment overrides config values from environment variables
func (c *Config) ApplyEnvironment() {
	// Server
	if v := os.Getenv("RELAY_HOST"); v != "" {
		c.Server.Host = v
	}
	if v := os.Getenv("RELAY_PORT"); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			c.Server.Port = port
		}
	}

	// Room
	if v := os.Getenv("RELAY_MAX_ROOMS"); v != "" {
		if max, err := strconv.Atoi(v); err == nil {
			c.Room.MaxRooms = max
		}
	}
	if v := os.Getenv("RELAY_ROOM_EXPIRY"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			c.Room.DefaultExpiry = d
		}
	}

	// Rate limiting
	if v := os.Getenv("RELAY_RATE_LIMIT_ENABLED"); v != "" {
		c.RateLimit.Enabled = v == "true" || v == "1"
	}
	if v := os.Getenv("RELAY_RATE_LIMIT_RPS"); v != "" {
		if rps, err := strconv.ParseFloat(v, 64); err == nil {
			c.RateLimit.RequestsPerSecond = rps
		}
	}

	// TLS
	if v := os.Getenv("RELAY_TLS_ENABLED"); v != "" {
		c.TLS.Enabled = v == "true" || v == "1"
	}
	if v := os.Getenv("RELAY_TLS_CERT"); v != "" {
		c.TLS.CertFile = v
	}
	if v := os.Getenv("RELAY_TLS_KEY"); v != "" {
		c.TLS.KeyFile = v
	}

	// Metrics
	if v := os.Getenv("RELAY_METRICS_ENABLED"); v != "" {
		c.Metrics.Enabled = v == "true" || v == "1"
	}
	if v := os.Getenv("RELAY_METRICS_PORT"); v != "" {
		if port, err := strconv.Atoi(v); err == nil {
			c.Metrics.Port = port
		}
	}
}
