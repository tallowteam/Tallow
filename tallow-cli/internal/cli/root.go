// Package cli implements the command-line interface for tallow.
package cli

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	cfgFile     string
	verbose     bool
	relayServer string
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "tallow",
	Short: "Secure post-quantum encrypted file transfers",
	Long: `Tallow is a command-line tool for secure file transfers using
post-quantum cryptography (ML-KEM-768) combined with X25519.

Features:
  - Hybrid PQ cryptography (ML-KEM-768 + X25519)
  - CPACE password-authenticated key exchange
  - End-to-end AES-256-GCM encryption
  - Zero-knowledge relay servers
  - Local network discovery via mDNS

Examples:
  # Send a file
  tallow send document.pdf

  # Receive a file with code
  tallow receive alpha-beta-gamma

  # Start a relay server
  tallow relay --port 8080`,
	SilenceUsage:  true,
	SilenceErrors: true,
}

// Execute runs the root command
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.tallow.yaml)")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
	rootCmd.PersistentFlags().StringVar(&relayServer, "relay", "wss://relay.tallow.io", "relay server URL")

	viper.BindPFlag("relay", rootCmd.PersistentFlags().Lookup("relay"))
	viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
}

// initConfig reads in config file and ENV variables if set
func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		home, err := os.UserHomeDir()
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			return
		}

		viper.AddConfigPath(home)
		viper.AddConfigPath(".")
		viper.SetConfigType("yaml")
		viper.SetConfigName(".tallow")
	}

	viper.SetEnvPrefix("TALLOW")
	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("relay", "wss://relay.tallow.io")
	viper.SetDefault("chunk_size", 65536)
	viper.SetDefault("compress", true)
	viper.SetDefault("local_discovery", true)

	if err := viper.ReadInConfig(); err == nil {
		if verbose {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}
}

// IsVerbose returns whether verbose mode is enabled
func IsVerbose() bool {
	return verbose || viper.GetBool("verbose")
}

// GetRelayServer returns the configured relay server URL
func GetRelayServer() string {
	return viper.GetString("relay")
}
