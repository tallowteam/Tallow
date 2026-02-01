package cli

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"
	"github.com/tallow/tallow-cli/internal/relay"
)

var (
	relayPort        int
	relayMetricsPort int
	relayRoomTTL     time.Duration
	relayMaxConns    int
	relayRateLimit   float64
	relayBurst       int
	relayTLSCert     string
	relayTLSKey      string
)

var relayCmd = &cobra.Command{
	Use:   "relay",
	Short: "Start a relay server",
	Long: `Start a tallow relay server for facilitating transfers.

The relay server is zero-knowledge - it never sees plaintext data.
All encryption is end-to-end between sender and receiver.

Examples:
  # Start relay on default port
  tallow relay

  # Start on custom port with TLS
  tallow relay --port 443 --tls-cert cert.pem --tls-key key.pem

  # Start with custom settings
  tallow relay --port 8080 --room-ttl 1h --max-connections 100`,
	RunE: runRelay,
}

func init() {
	rootCmd.AddCommand(relayCmd)

	relayCmd.Flags().IntVar(&relayPort, "port", 8080, "listen port")
	relayCmd.Flags().IntVar(&relayMetricsPort, "metrics-port", 9090, "Prometheus metrics port")
	relayCmd.Flags().DurationVar(&relayRoomTTL, "room-ttl", 30*time.Minute, "room time-to-live")
	relayCmd.Flags().IntVar(&relayMaxConns, "max-connections", 10, "max connections per IP")
	relayCmd.Flags().Float64Var(&relayRateLimit, "rate-limit", 10, "requests per second per IP")
	relayCmd.Flags().IntVar(&relayBurst, "burst", 20, "rate limit burst size")
	relayCmd.Flags().StringVar(&relayTLSCert, "tls-cert", "", "TLS certificate file")
	relayCmd.Flags().StringVar(&relayTLSKey, "tls-key", "", "TLS key file")
}

func runRelay(cmd *cobra.Command, args []string) error {
	config := relay.ServerConfig{
		ListenAddr:          fmt.Sprintf(":%d", relayPort),
		RoomTTL:             relayRoomTTL,
		MaxConnectionsPerIP: relayMaxConns,
		RateLimit:           relayRateLimit,
		BurstLimit:          relayBurst,
		EnableMetrics:       true,
		MetricsAddr:         fmt.Sprintf(":%d", relayMetricsPort),
		TLSCert:             relayTLSCert,
		TLSKey:              relayTLSKey,
	}

	server := relay.NewServer(config)

	fmt.Println("Starting tallow relay server...")
	fmt.Printf("  Listen:  %s\n", config.ListenAddr)
	fmt.Printf("  Metrics: %s\n", config.MetricsAddr)
	fmt.Printf("  Room TTL: %s\n", config.RoomTTL)
	fmt.Println()
	fmt.Println("Relay is zero-knowledge - all data is end-to-end encrypted.")
	fmt.Println()

	return server.Run()
}
