// Package logging provides structured logging for the relay server.
package logging

import (
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
)

// LogConfig holds logging configuration
type LogConfig struct {
	Level  string
	Format string // "json" or "console"
	Output io.Writer
}

// Logger wraps zerolog.Logger with additional context
type Logger struct {
	zerolog.Logger
}

// NewLogger creates a new structured logger
func NewLogger(cfg LogConfig) *Logger {
	// Set global log level
	level, err := zerolog.ParseLevel(cfg.Level)
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)

	// Configure output
	var output io.Writer
	if cfg.Output != nil {
		output = cfg.Output
	} else {
		output = os.Stdout
	}

	// Configure format
	if cfg.Format == "console" {
		output = zerolog.ConsoleWriter{
			Out:        output,
			TimeFormat: time.RFC3339,
		}
	}

	// Create logger with common fields
	logger := zerolog.New(output).
		With().
		Timestamp().
		Str("service", "tallow-relay").
		Logger()

	return &Logger{Logger: logger}
}

// WithComponent returns a logger with component context
func (l *Logger) WithComponent(component string) *Logger {
	return &Logger{
		Logger: l.With().Str("component", component).Logger(),
	}
}

// WithRoom returns a logger with room context
func (l *Logger) WithRoom(roomID string) *Logger {
	return &Logger{
		Logger: l.With().Str("room_id", roomID).Logger(),
	}
}

// WithPeer returns a logger with peer context
func (l *Logger) WithPeer(peerID string) *Logger {
	return &Logger{
		Logger: l.With().Str("peer_id", peerID).Logger(),
	}
}

// WithIP returns a logger with IP context
func (l *Logger) WithIP(ip string) *Logger {
	return &Logger{
		Logger: l.With().Str("ip", ip).Logger(),
	}
}

// WithTransfer returns a logger with transfer context
func (l *Logger) WithTransfer(transferID string) *Logger {
	return &Logger{
		Logger: l.With().Str("transfer_id", transferID).Logger(),
	}
}
