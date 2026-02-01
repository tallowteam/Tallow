// Package relay provides configuration for the onion relay server.
package relay

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"strconv"
	"time"

	"gopkg.in/yaml.v3"
)

// Config holds all relay server configuration
type Config struct {
	Server    ServerConfig    `yaml:"server"`
	Room      RoomConfig      `yaml:"room"`
	RateLimit RateLimitConfig `yaml:"rate_limit"`
	Bridge    BridgeConfig    `yaml:"bridge"`
	TLS       TLSConfig       `yaml:"tls"`
	Metrics   MetricsConfig   `yaml:"metrics"`
	Onion     OnionConfig     `yaml:"onion"`
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

// OnionConfig holds onion routing specific configuration
type OnionConfig struct {
	// Mode is the relay operating mode
	Mode RelayMode `yaml:"mode"`

	// RelayID is the unique relay identifier
	RelayID string `yaml:"relay_id"`

	// PublicEndpoint is the public WebSocket URL for this relay
	PublicEndpoint string `yaml:"public_endpoint"`

	// DirectoryURL is the relay directory server URL
	DirectoryURL string `yaml:"directory_url"`

	// KeyStorePath is where to store/load PQC keys
	KeyStorePath string `yaml:"key_store_path"`

	// MaxCircuits is the maximum number of concurrent circuits
	MaxCircuits int `yaml:"max_circuits"`

	// CircuitTimeout is how long a circuit can be idle
	CircuitTimeout time.Duration `yaml:"circuit_timeout"`

	// MaxBandwidth is the maximum bandwidth in bytes/sec (0 = unlimited)
	MaxBandwidth int64 `yaml:"max_bandwidth"`

	// AllowedModes specifies which relay modes can connect
	AllowedModes []RelayMode `yaml:"allowed_modes"`

	// TrustedRelays is a list of trusted relay IDs
	TrustedRelays []string `yaml:"trusted_relays"`

	// RequireAuth requires authentication for relay-to-relay connections
	RequireAuth bool `yaml:"require_auth"`
}

// DefaultConfig returns configuration with sensible defaults
func DefaultConfig() *Config {
	relayID := generateRelayID()

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
			RequestsPerSecond: 100,
			BurstSize:         200,
			CleanupInterval:   10 * time.Minute,
			BanDuration:       1 * time.Hour,
			MaxViolations:     10,
		},
		Bridge: BridgeConfig{
			BufferSize:      64 * 1024, // 64KB
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
		Onion: OnionConfig{
			Mode:           ModeMiddle,
			RelayID:        relayID,
			KeyStorePath:   "/var/lib/tallow-relay/keys",
			MaxCircuits:    10000,
			CircuitTimeout: 30 * time.Minute,
			MaxBandwidth:   0, // unlimited
			AllowedModes:   []RelayMode{ModeEntry, ModeMiddle, ModeExit},
			RequireAuth:    false,
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

	// Onion config
	if v := os.Getenv("RELAY_MODE"); v != "" {
		c.Onion.Mode = RelayMode(v)
	}
	if v := os.Getenv("RELAY_ID"); v != "" {
		c.Onion.RelayID = v
	}
	if v := os.Getenv("RELAY_PUBLIC_ENDPOINT"); v != "" {
		c.Onion.PublicEndpoint = v
	}
	if v := os.Getenv("RELAY_DIRECTORY_URL"); v != "" {
		c.Onion.DirectoryURL = v
	}
	if v := os.Getenv("RELAY_KEY_STORE_PATH"); v != "" {
		c.Onion.KeyStorePath = v
	}
	if v := os.Getenv("RELAY_MAX_CIRCUITS"); v != "" {
		if max, err := strconv.Atoi(v); err == nil {
			c.Onion.MaxCircuits = max
		}
	}
	if v := os.Getenv("RELAY_MAX_BANDWIDTH"); v != "" {
		if bw, err := strconv.ParseInt(v, 10, 64); err == nil {
			c.Onion.MaxBandwidth = bw
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

// generateRelayID generates a unique relay identifier
func generateRelayID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback
		return "relay-" + strconv.FormatInt(time.Now().UnixNano(), 36)
	}
	return hex.EncodeToString(bytes)
}
