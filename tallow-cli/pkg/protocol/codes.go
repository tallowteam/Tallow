package protocol

import (
	"github.com/tallow/tallow-cli/internal/crypto"
	"github.com/tallow/tallow-cli/internal/wordlist"
)

// GenerateRoomCode generates a new room code with the specified number of words
func GenerateRoomCode(numWords int) (string, error) {
	return wordlist.GenerateCode(numWords)
}

// ValidateRoomCode validates a room code format
func ValidateRoomCode(code string) bool {
	return wordlist.ValidateCode(code)
}

// NormalizeRoomCode normalizes a room code
func NormalizeRoomCode(code string) string {
	return wordlist.NormalizeCode(code)
}

// RoomIDFromCode derives a room ID from a code
func RoomIDFromCode(code string) string {
	normalized := wordlist.NormalizeCode(code)
	hash := crypto.Blake3Hash([]byte(normalized))
	// Return first 16 bytes as hex string
	result := make([]byte, 32)
	for i, b := range hash[:16] {
		result[i*2] = "0123456789abcdef"[b>>4]
		result[i*2+1] = "0123456789abcdef"[b&0xf]
	}
	return string(result)
}

// CodeToKeyMaterial derives key material from a code for PAKE
func CodeToKeyMaterial(code string) []byte {
	normalized := wordlist.NormalizeCode(code)
	return crypto.Blake3DeriveKey("tallow-pake-password-v1", []byte(normalized), 32)
}
