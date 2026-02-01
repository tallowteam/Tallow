package room

import (
	"strings"
	"testing"
)

func TestWordList(t *testing.T) {
	// Verify word list is not empty
	if len(wordList) == 0 {
		t.Error("Word list is empty")
	}

	// All words should be lowercase
	for i, word := range wordList {
		if word != strings.ToLower(word) {
			t.Errorf("Word at index %d is not lowercase: %s", i, word)
		}
	}

	// All words should be alphabetic
	for i, word := range wordList {
		for _, c := range word {
			if c < 'a' || c > 'z' {
				t.Errorf("Word at index %d contains non-alphabetic character: %s", i, word)
				break
			}
		}
	}

	// Check for duplicates
	seen := make(map[string]bool)
	for i, word := range wordList {
		if seen[word] {
			t.Errorf("Duplicate word at index %d: %s", i, word)
		}
		seen[word] = true
	}
}

func TestNewCodeGenerator(t *testing.T) {
	tests := []struct {
		name          string
		wordCount     int
		expectedCount int
	}{
		{"default to 3 for zero", 0, 3},
		{"default to 3 for negative", -1, 3},
		{"default to 3 for one", 1, 3},
		{"two words", 2, 2}, // 2 is valid (minimum)
		{"three words", 3, 3},
		{"four words", 4, 4},
		{"five words", 5, 5},
		{"cap at 5 for 6", 6, 5},
		{"cap at 5 for 100", 100, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gen := NewCodeGenerator(tt.wordCount)
			if gen == nil {
				t.Fatal("NewCodeGenerator returned nil")
			}

			if gen.WordCount() != tt.expectedCount {
				t.Errorf("WordCount = %d, want %d", gen.WordCount(), tt.expectedCount)
			}
		})
	}
}

func TestCodeGeneratorGenerate(t *testing.T) {
	gen := NewCodeGenerator(3)

	code, err := gen.Generate()
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	// Should have 3 words
	parts := strings.Split(code, "-")
	if len(parts) != 3 {
		t.Errorf("Expected 3 words, got %d: %s", len(parts), code)
	}

	// All words should be from the list
	for _, word := range parts {
		if !isValidWord(word) {
			t.Errorf("Word %s not in word list", word)
		}
	}
}

func TestCodeGeneratorGenerateUniqueness(t *testing.T) {
	gen := NewCodeGenerator(3)

	codes := make(map[string]bool)
	for i := 0; i < 100; i++ {
		code, err := gen.Generate()
		if err != nil {
			t.Fatalf("Generate failed: %v", err)
		}
		if codes[code] {
			t.Logf("Warning: duplicate code generated at iteration %d: %s", i, code)
		}
		codes[code] = true
	}
}

func TestCodeGeneratorValidate(t *testing.T) {
	gen := NewCodeGenerator(3)

	tests := []struct {
		name  string
		code  string
		valid bool
	}{
		{"valid 3 words", "alpha-beta-gamma", true},
		{"wrong word count", "alpha-beta", false},
		{"too many words", "alpha-beta-gamma-delta", false},
		{"invalid word", "alpha-invalid123-gamma", false},
		{"empty", "", false},
		{"just separators", "--", false},
		{"mixed case valid", "Alpha-Beta-Gamma", true},
		{"uppercase valid", "ALPHA-BETA-GAMMA", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := gen.Validate(tt.code)
			if result != tt.valid {
				t.Errorf("Validate(%q) = %v, want %v", tt.code, result, tt.valid)
			}
		})
	}
}

func TestCodeGeneratorNormalize(t *testing.T) {
	gen := NewCodeGenerator(3)

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"lowercase", "alpha-beta-gamma", "alpha-beta-gamma"},
		{"uppercase", "ALPHA-BETA-GAMMA", "alpha-beta-gamma"},
		{"mixed", "Alpha-Beta-Gamma", "alpha-beta-gamma"},
		{"spaces", "alpha beta gamma", "alpha-beta-gamma"},
		{"underscores", "alpha_beta_gamma", "alpha-beta-gamma"},
		{"mixed separators", "alpha_beta gamma", "alpha-beta-gamma"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := gen.Normalize(tt.input)
			if result != tt.expected {
				t.Errorf("Normalize(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestCodeGeneratorEntropy(t *testing.T) {
	tests := []struct {
		wordCount int
		minBits   float64
	}{
		{3, 15}, // At least 15 bits
		{4, 20}, // At least 20 bits
		{5, 25}, // At least 25 bits
	}

	for _, tt := range tests {
		gen := NewCodeGenerator(tt.wordCount)
		entropy := gen.Entropy()
		if entropy < tt.minBits {
			t.Errorf("Entropy for %d words = %.2f bits, want at least %.2f", tt.wordCount, entropy, tt.minBits)
		}
	}
}

func TestCodeGeneratorTotalCombinations(t *testing.T) {
	wordCount := len(wordList)

	tests := []struct {
		words    int
		expected int64
	}{
		{3, int64(wordCount * wordCount * wordCount)},
		{4, int64(wordCount * wordCount * wordCount * wordCount)},
	}

	for _, tt := range tests {
		gen := NewCodeGenerator(tt.words)
		result := gen.TotalCombinations()
		if result != tt.expected {
			t.Errorf("TotalCombinations for %d words = %d, want %d", tt.words, result, tt.expected)
		}
	}
}

func TestIsValidWord(t *testing.T) {
	tests := []struct {
		word  string
		valid bool
	}{
		{"alpha", true},
		{"beta", true},
		{"gamma", true},
		{"ocean", true},
		{"quantum", true},
		{"xyz123", false},
		{"notinlist", false},
		{"", false},
		{"ALPHA", true},  // case insensitive
		{"Alpha", true},  // case insensitive
	}

	for _, tt := range tests {
		t.Run(tt.word, func(t *testing.T) {
			result := isValidWord(tt.word)
			if result != tt.valid {
				t.Errorf("isValidWord(%q) = %v, want %v", tt.word, result, tt.valid)
			}
		})
	}
}

func TestGeneratedCodePassesValidation(t *testing.T) {
	for wordCount := 3; wordCount <= 5; wordCount++ {
		gen := NewCodeGenerator(wordCount)

		for i := 0; i < 50; i++ {
			code, err := gen.Generate()
			if err != nil {
				t.Fatalf("Generate failed: %v", err)
			}

			if !gen.Validate(code) {
				t.Errorf("Generated code fails validation: %s", code)
			}
		}
	}
}

func TestCodeGeneratorDifferentWordCounts(t *testing.T) {
	for wordCount := 3; wordCount <= 5; wordCount++ {
		t.Run(string(rune('0'+wordCount))+" words", func(t *testing.T) {
			gen := NewCodeGenerator(wordCount)

			code, err := gen.Generate()
			if err != nil {
				t.Fatalf("Generate failed: %v", err)
			}

			parts := strings.Split(code, "-")
			if len(parts) != wordCount {
				t.Errorf("Expected %d words, got %d", wordCount, len(parts))
			}
		})
	}
}

func BenchmarkGenerate(b *testing.B) {
	gen := NewCodeGenerator(3)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		gen.Generate()
	}
}

func BenchmarkValidate(b *testing.B) {
	gen := NewCodeGenerator(3)
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		gen.Validate(code)
	}
}

func BenchmarkNormalize(b *testing.B) {
	gen := NewCodeGenerator(3)
	code := "Alpha_Beta Gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		gen.Normalize(code)
	}
}

func BenchmarkIsValidWord(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		isValidWord("quantum")
	}
}
