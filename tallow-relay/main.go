// Tallow Relay Server
// A zero-knowledge relay server for secure peer-to-peer file transfers.
// The relay never sees plaintext data - it only forwards encrypted bytes.
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
	"github.com/tallow/tallow-relay/internal/server"
)

var (
	version   = "1.0.0"
	buildTime = "unknown"
	gitCommit = "unknown"
)

func main() {
	// Command line flags
	configPath := flag.String("config", "", "Path to configuration file")
	showVersion := flag.Bool("version", false, "Show version information")
	flag.Parse()

	if *showVersion {
		println("Tallow Relay Server")
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
		Msg("Starting Tallow Relay Server")

	// Load configuration
	var cfg *server.Config
	var err error

	if *configPath != "" {
		cfg, err = server.LoadConfig(*configPath)
	} else if envConfig := os.Getenv("RELAY_CONFIG"); envConfig != "" {
		cfg, err = server.LoadConfig(envConfig)
	} else {
		cfg = server.DefaultConfig()
	}

	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Override config from environment variables
	cfg.ApplyEnvironment()

	log.Info().
		Str("host", cfg.Server.Host).
		Int("port", cfg.Server.Port).
		Dur("room_expiry", cfg.Room.DefaultExpiry).
		Int("max_rooms", cfg.Room.MaxRooms).
		Msg("Configuration loaded")

	// Initialize metrics
	metricsHandler := metrics.NewPrometheusMetrics()

	// Create and start server
	srv, err := server.New(cfg, log, metricsHandler)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create server")
	}

	// Start server in goroutine
	go func() {
		if err := srv.Start(); err != nil {
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

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server shutdown error")
	}

	log.Info().Msg("Server stopped")
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
