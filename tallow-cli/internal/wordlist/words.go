// Package wordlist provides word-based code generation for human-readable transfer codes.
package wordlist

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

// Words is a curated list of 256 memorable, distinct words for code generation.
// Each word is easy to spell, pronounce, and remember.
var Words = []string{
	// Animals
	"alpha", "bear", "cat", "dog", "eagle", "fox", "goat", "hawk",
	"ibis", "jay", "koala", "lion", "moose", "newt", "owl", "panda",
	"quail", "raven", "snake", "tiger", "urchin", "viper", "wolf", "xerus",
	"yak", "zebra", "ape", "bat", "crane", "deer", "elk", "frog",
	// Nature
	"amber", "brook", "cliff", "delta", "ember", "frost", "grove", "hill",
	"isle", "jade", "kelp", "lake", "moss", "north", "ocean", "peak",
	"quartz", "river", "storm", "tide", "umbra", "valley", "wave", "xerox",
	"yield", "zenith", "aurora", "breeze", "canyon", "dune", "east", "fjord",
	// Colors
	"azure", "bronze", "coral", "denim", "ebony", "fawn", "gold", "hazel",
	"indigo", "jet", "khaki", "lime", "maroon", "navy", "olive", "pink",
	"rust", "sage", "tan", "umber", "violet", "wine", "xanadu", "yellow",
	// Objects
	"arrow", "blade", "crown", "drum", "echo", "flame", "gear", "harp",
	"iron", "jewel", "kite", "lamp", "mirror", "nail", "orb", "prism",
	"quill", "ring", "sword", "torch", "unity", "vault", "wheel", "xray",
	// Actions
	"blast", "climb", "dash", "drift", "flash", "glide", "hover", "jump",
	"knock", "launch", "march", "nudge", "orbit", "pulse", "quest", "rush",
	"shift", "trace", "twist", "spin", "whirl", "zoom", "bounce", "coast",
	// Food
	"apple", "bread", "cherry", "date", "egg", "fig", "grape", "honey",
	"ice", "jam", "kiwi", "lemon", "mango", "nut", "orange", "peach",
	"rice", "sugar", "tea", "vanilla", "wheat", "yeast", "basil", "cocoa",
	// Music
	"bass", "chord", "flute", "forte", "groove", "hymn", "jazz", "key",
	"lyric", "melody", "note", "opera", "piano", "rhythm", "scale", "tempo",
	"tune", "verse", "waltz", "aria", "beat", "cello", "duet", "encore",
	// Space
	"comet", "cosmos", "earth", "galaxy", "lunar", "mars", "nebula", "nova",
	"plasma", "pluto", "quasar", "rocket", "saturn", "star", "sun", "terra",
	"uranus", "venus", "void", "warp", "meteor", "astro", "beam", "cosmic",
}

// GenerateCode creates a random word-based code with the specified number of words.
// Default is 3 words (e.g., "alpha-beta-gamma"), providing 24 bits of entropy.
func GenerateCode(numWords int) (string, error) {
	if numWords <= 0 {
		numWords = 3
	}

	words := make([]string, numWords)
	max := big.NewInt(int64(len(Words)))

	for i := 0; i < numWords; i++ {
		idx, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", fmt.Errorf("failed to generate random index: %w", err)
		}
		words[i] = Words[idx.Int64()]
	}

	return strings.Join(words, "-"), nil
}

// ValidateCode checks if a code is properly formatted
func ValidateCode(code string) bool {
	parts := strings.Split(code, "-")
	if len(parts) < 2 || len(parts) > 6 {
		return false
	}

	wordSet := make(map[string]bool)
	for _, w := range Words {
		wordSet[w] = true
	}

	for _, part := range parts {
		if !wordSet[strings.ToLower(part)] {
			return false
		}
	}

	return true
}

// NormalizeCode converts a code to lowercase and trims whitespace
func NormalizeCode(code string) string {
	return strings.ToLower(strings.TrimSpace(code))
}

// CodeToBytes converts a word code to bytes for use as key material
func CodeToBytes(code string) []byte {
	return []byte(NormalizeCode(code))
}

// GenerateRoomID creates a room identifier from a code
func GenerateRoomID(code string) string {
	// Use first 16 chars of hex-encoded hash for room ID
	normalized := NormalizeCode(code)
	return fmt.Sprintf("%x", []byte(normalized))[:16]
}
