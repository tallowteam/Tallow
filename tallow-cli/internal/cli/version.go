package cli

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"
)

var (
	version   = "dev"
	commit    = "none"
	buildDate = "unknown"
)

// SetVersionInfo sets the version information from build flags
func SetVersionInfo(ver, com, date string) {
	version = ver
	commit = com
	buildDate = date
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	Long:  "Print detailed version information about tallow",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("tallow %s\n", version)
		fmt.Printf("  Commit:     %s\n", commit)
		fmt.Printf("  Built:      %s\n", buildDate)
		fmt.Printf("  Go version: %s\n", runtime.Version())
		fmt.Printf("  OS/Arch:    %s/%s\n", runtime.GOOS, runtime.GOARCH)
		fmt.Println()
		fmt.Println("Cryptographic features:")
		fmt.Println("  - ML-KEM-768 (CRYSTALS-Kyber)")
		fmt.Println("  - X25519 key exchange")
		fmt.Println("  - AES-256-GCM encryption")
		fmt.Println("  - BLAKE3 hashing")
		fmt.Println("  - CPACE PAKE")
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
