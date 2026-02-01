// Tallow Onion Relay Server
// A multi-hop relay node for TALLOW's onion routing network.
// Supports entry, middle, and exit relay modes with PQC key exchange.
package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/tallow/tallow-relay/internal/logging"
	"github.com/tallow/tallow-relay/internal/metrics"
	"github.com/tallow/tallow-relay/pkg/directory"
	"github.com/tallow/tallow-relay/pkg/onion"
	"github.com/tallow/tallow-relay/pkg/relay"
)

var (
	version   = "2.0.0"
	buildTime = "unknown"
	gitCommit = "unknown"
)

func main() {
	// Command line flags
	configPath := flag.String("config", "", "Path to configuration file")
	showVersion := flag.Bool("version", false, "Show version information")
	relayMode := flag.String("mode", "middle", "Relay mode: entry, middle, exit, or directory")
	port := flag.Int("port", 8080, "Port to listen on")
	directoryURL := flag.String("directory", "", "Directory server URL for relay registration")
	relayID := flag.String("id", "", "Unique relay identifier (auto-generated if empty)")
	flag.Parse()

	if *showVersion {
		println("Tallow Onion Relay Server")
		println("Version:", version)
		println("Build Time:", buildTime)
		println("Git Commit:", gitCommit)
		os.Exit(0)
	}

	// Initialize logger
	log := logging.NewLogger(logging.LogConfig{
		Level:  getEnvOrDefault("LOG_LEVEL", "info"),
		Format: getEnvOrDefault("LOG_FORMAT", "json"),
	})

	log.Info().
		Str("version", version).
		Str("build_time", buildTime).
		Str("git_commit", gitCommit).
		Str("mode", *relayMode).
		Msg("Starting Tallow Onion Relay Server")

	// Load configuration
	cfg := relay.DefaultConfig()
	if *configPath != "" {
		loadedCfg, err := relay.LoadConfig(*configPath)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to load configuration")
		}
		cfg = loadedCfg
	}

	// Override from flags
	cfg.Server.Port = *port
	cfg.Onion.Mode = relay.RelayMode(*relayMode)
	cfg.Onion.DirectoryURL = *directoryURL
	if *relayID != "" {
		cfg.Onion.RelayID = *relayID
	}

	// Override from environment
	cfg.ApplyEnvironment()

	log.Info().
		Str("host", cfg.Server.Host).
		Int("port", cfg.Server.Port).
		Str("relay_mode", string(cfg.Onion.Mode)).
		Str("relay_id", cfg.Onion.RelayID).
		Msg("Configuration loaded")

	// Initialize metrics
	metricsHandler := metrics.NewPrometheusMetrics()

	// Initialize PQC key manager
	keyManager, err := onion.NewKeyManager(cfg.Onion.KeyStorePath)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize key manager")
	}
	defer keyManager.Close()

	log.Info().
		Str("public_key_fingerprint", keyManager.GetPublicKeyFingerprint()).
		Msg("PQC keys initialized")

	// Start appropriate server based on mode
	var server interface {
		Start() error
		Shutdown(context.Context) error
	}

	switch cfg.Onion.Mode {
	case relay.ModeDirectory:
		// Start directory server
		dirSrv, err := directory.NewServer(cfg, log, metricsHandler)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create directory server")
		}
		server = dirSrv
		log.Info().Msg("Starting in DIRECTORY mode")

	default:
		// Start relay server (entry, middle, or exit)
		relaySrv, err := relay.NewServer(cfg, log, metricsHandler, keyManager)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create relay server")
		}
		server = relaySrv

		// Register with directory if URL provided
		if cfg.Onion.DirectoryURL != "" {
			go registerWithDirectory(log, cfg, keyManager)
		}

		log.Info().Str("mode", string(cfg.Onion.Mode)).Msg("Starting in RELAY mode")
	}

	// Start server in goroutine
	go func() {
		if err := server.Start(); err != nil {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server shutdown error")
	}

	log.Info().Msg("Server stopped")
}

// registerWithDirectory registers this relay with the directory server
func registerWithDirectory(log *logging.Logger, cfg *relay.Config, keyManager *onion.KeyManager) {
	client := directory.NewClient(cfg.Onion.DirectoryURL)

	// Wait a bit for server to start
	time.Sleep(2 * time.Second)

	relayInfo := directory.RelayInfo{
		ID:              cfg.Onion.RelayID,
		PublicKey:       keyManager.GetPublicKeyBytes(),
		Endpoint:        cfg.Onion.PublicEndpoint,
		Mode:            string(cfg.Onion.Mode),
		Version:         version,
		Capabilities:    getCapabilities(cfg.Onion.Mode),
		MaxBandwidth:    cfg.Onion.MaxBandwidth,
		CurrentLoad:     0,
	}

	// Register with retries
	for i := 0; i < 5; i++ {
		err := client.Register(relayInfo)
		if err == nil {
			log.Info().
				Str("relay_id", cfg.Onion.RelayID).
				Str("directory", cfg.Onion.DirectoryURL).
				Msg("Registered with directory")

			// Start heartbeat
			go client.StartHeartbeat(relayInfo, 30*time.Second, func(load float64) {
				// Update current load in heartbeat
			})
			return
		}
		log.Warn().Err(err).Int("attempt", i+1).Msg("Failed to register with directory, retrying...")
		time.Sleep(time.Duration(i+1) * 5 * time.Second)
	}

	log.Error().Msg("Failed to register with directory after 5 attempts")
}

func getCapabilities(mode relay.RelayMode) []string {
	caps := []string{"pqc-ml-kem-768", "websocket"}
	switch mode {
	case relay.ModeEntry:
		caps = append(caps, "entry", "client-connect")
	case relay.ModeMiddle:
		caps = append(caps, "middle", "relay")
	case relay.ModeExit:
		caps = append(caps, "exit", "peer-connect")
	}
	return caps
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
