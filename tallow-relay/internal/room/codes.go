// Package room provides room management for relay connections.
package room

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

// wordList contains phonetically distinct words for generating codes
// These are chosen to be:
// - Easy to pronounce in multiple languages
// - Phonetically distinct from each other
// - Common enough to be memorable
var wordList = []string{
	// Nature
	"alpha", "beta", "gamma", "delta", "echo",
	"foxtrot", "golf", "hotel", "india", "juliet",
	"kilo", "lima", "mike", "november", "oscar",
	"papa", "quebec", "romeo", "sierra", "tango",
	"uniform", "victor", "whiskey", "xray", "yankee",
	"zulu",
	// Additional memorable words
	"ocean", "river", "mountain", "forest", "desert",
	"sunset", "sunrise", "thunder", "lightning", "rainbow",
	"crystal", "diamond", "emerald", "sapphire", "ruby",
	"silver", "golden", "bronze", "copper", "iron",
	"falcon", "eagle", "phoenix", "dragon", "tiger",
	"panther", "cobra", "viper", "shark", "dolphin",
	"comet", "meteor", "nebula", "galaxy", "quasar",
	"pulsar", "nova", "cosmos", "orbit", "lunar",
	"solar", "stellar", "zenith", "horizon", "vertex",
	"cipher", "matrix", "vector", "prism", "quantum",
	"photon", "neutron", "proton", "electron", "plasma",
	"carbon", "helium", "neon", "argon", "xenon",
	"atlas", "titan", "apollo", "mercury", "venus",
	"mars", "jupiter", "saturn", "neptune", "pluto",
	"aurora", "blizzard", "cyclone", "tornado", "tsunami",
	"meadow", "valley", "canyon", "glacier", "volcano",
	"bamboo", "cedar", "maple", "willow", "sequoia",
	"jasper", "onyx", "opal", "pearl", "coral",
	"amber", "ivory", "jade", "marble", "granite",
	"crimson", "scarlet", "indigo", "violet", "azure",
	"magenta", "turquoise", "lavender", "burgundy", "olive",
}

// CodeGenerator generates human-readable room codes
type CodeGenerator struct {
	wordCount int
	separator string
}

// NewCodeGenerator creates a new code generator
func NewCodeGenerator(wordCount int) *CodeGenerator {
	if wordCount < 2 {
		wordCount = 3
	}
	if wordCount > 5 {
		wordCount = 5
	}

	return &CodeGenerator{
		wordCount: wordCount,
		separator: "-",
	}
}

// Generate creates a new random code
func (g *CodeGenerator) Generate() (string, error) {
	words := make([]string, g.wordCount)
	listLen := big.NewInt(int64(len(wordList)))

	for i := 0; i < g.wordCount; i++ {
		idx, err := rand.Int(rand.Reader, listLen)
		if err != nil {
			return "", fmt.Errorf("failed to generate random index: %w", err)
		}
		words[i] = wordList[idx.Int64()]
	}

	return strings.Join(words, g.separator), nil
}

// Validate checks if a code has valid format
func (g *CodeGenerator) Validate(code string) bool {
	parts := strings.Split(code, g.separator)
	if len(parts) != g.wordCount {
		return false
	}

	for _, word := range parts {
		if !isValidWord(word) {
			return false
		}
	}

	return true
}

// isValidWord checks if a word is in the word list
func isValidWord(word string) bool {
	word = strings.ToLower(word)
	for _, w := range wordList {
		if w == word {
			return true
		}
	}
	return false
}

// Normalize normalizes a code to lowercase with standard separator
func (g *CodeGenerator) Normalize(code string) string {
	code = strings.ToLower(code)
	// Handle common variations
	code = strings.ReplaceAll(code, " ", g.separator)
	code = strings.ReplaceAll(code, "_", g.separator)
	return code
}

// Entropy returns the approximate entropy in bits for the current configuration
func (g *CodeGenerator) Entropy() float64 {
	// log2(len(wordList)^wordCount)
	// For 100 words and 3 words: log2(100^3) = log2(1,000,000) ≈ 19.9 bits
	return float64(g.wordCount) * 6.64 // log2(100) ≈ 6.64
}

// WordCount returns the number of words in generated codes
func (g *CodeGenerator) WordCount() int {
	return g.wordCount
}

// TotalCombinations returns the total number of possible codes
func (g *CodeGenerator) TotalCombinations() int64 {
	result := int64(1)
	for i := 0; i < g.wordCount; i++ {
		result *= int64(len(wordList))
	}
	return result
}
