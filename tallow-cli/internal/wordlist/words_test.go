package wordlist

import (
	"strings"
	"testing"
)

func TestWordsListSize(t *testing.T) {
	// Verify we have a reasonable number of words
	if len(Words) < 100 {
		t.Errorf("Words list too small: %d", len(Words))
	}

	if len(Words) > 1000 {
		t.Errorf("Words list unexpectedly large: %d", len(Words))
	}
}

func TestWordsAreUnique(t *testing.T) {
	seen := make(map[string]bool)
	for i, word := range Words {
		if seen[word] {
			t.Errorf("Duplicate word at index %d: %s", i, word)
		}
		seen[word] = true
	}
}

func TestWordsAreLowercase(t *testing.T) {
	for i, word := range Words {
		if word != strings.ToLower(word) {
			t.Errorf("Word at index %d is not lowercase: %s", i, word)
		}
	}
}

func TestWordsAreAlphabetic(t *testing.T) {
	for i, word := range Words {
		for _, c := range word {
			if c < 'a' || c > 'z' {
				t.Errorf("Word at index %d contains non-alphabetic character: %s", i, word)
				break
			}
		}
	}
}

func TestWordsMinLength(t *testing.T) {
	for i, word := range Words {
		if len(word) < 2 {
			t.Errorf("Word at index %d is too short: %s", i, word)
		}
	}
}

func TestGenerateCode(t *testing.T) {
	tests := []struct {
		name     string
		numWords int
		expected int
	}{
		{"default", 0, 3},
		{"negative", -1, 3},
		{"two words", 2, 2},
		{"three words", 3, 3},
		{"four words", 4, 4},
		{"five words", 5, 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code, err := GenerateCode(tt.numWords)
			if err != nil {
				t.Fatalf("GenerateCode failed: %v", err)
			}

			parts := strings.Split(code, "-")
			if len(parts) != tt.expected {
				t.Errorf("word count = %v, want %v (code: %s)", len(parts), tt.expected, code)
			}
		})
	}
}

func TestGenerateCodeUsesValidWords(t *testing.T) {
	wordSet := make(map[string]bool)
	for _, w := range Words {
		wordSet[w] = true
	}

	for i := 0; i < 100; i++ {
		code, err := GenerateCode(3)
		if err != nil {
			t.Fatalf("GenerateCode failed: %v", err)
		}

		parts := strings.Split(code, "-")
		for _, part := range parts {
			if !wordSet[part] {
				t.Errorf("Generated word not in wordlist: %s", part)
			}
		}
	}
}

func TestGenerateCodeUniqueness(t *testing.T) {
	codes := make(map[string]bool)

	for i := 0; i < 1000; i++ {
		code, err := GenerateCode(3)
		if err != nil {
			t.Fatalf("GenerateCode failed: %v", err)
		}

		if codes[code] {
			t.Logf("Warning: duplicate code at iteration %d: %s", i, code)
		}
		codes[code] = true
	}
}

func TestValidateCode(t *testing.T) {
	tests := []struct {
		name  string
		code  string
		valid bool
	}{
		{"valid 2 words", "alpha-bear", true},
		{"valid 3 words", "alpha-bear-cat", true},
		{"valid 4 words", "alpha-bear-cat-dog", true},
		{"valid 6 words", "alpha-bear-cat-dog-eagle-fox", true},
		{"single word", "alpha", false},
		{"too many words", "a-b-c-d-e-f-g", false},
		{"empty", "", false},
		{"just hyphen", "-", false},
		{"invalid word", "alpha-xyz123-gamma", false},
		{"mixed case valid", "Alpha-Bear-Cat", true},
		{"uppercase valid", "ALPHA-BEAR-CAT", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateCode(tt.code)
			if result != tt.valid {
				t.Errorf("ValidateCode(%q) = %v, want %v", tt.code, result, tt.valid)
			}
		})
	}
}

func TestNormalizeCode(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"lowercase", "alpha-beta-gamma", "alpha-beta-gamma"},
		{"uppercase", "ALPHA-BETA-GAMMA", "alpha-beta-gamma"},
		{"mixed", "Alpha-Beta-Gamma", "alpha-beta-gamma"},
		{"with spaces", "  alpha-beta-gamma  ", "alpha-beta-gamma"},
		{"tabs", "\talpha-beta-gamma\t", "alpha-beta-gamma"},
		{"empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NormalizeCode(tt.input)
			if result != tt.expected {
				t.Errorf("NormalizeCode(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestCodeToBytes(t *testing.T) {
	code := "Alpha-Beta-Gamma"
	expected := []byte("alpha-beta-gamma")

	result := CodeToBytes(code)
	if string(result) != string(expected) {
		t.Errorf("CodeToBytes(%q) = %q, want %q", code, result, expected)
	}
}

func TestGenerateRoomID(t *testing.T) {
	code := "alpha-beta-gamma"
	id := GenerateRoomID(code)

	// Should be 16 hex characters
	if len(id) != 16 {
		t.Errorf("RoomID len = %v, want 16", len(id))
	}

	// All characters should be hex
	for _, c := range id {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			t.Errorf("Invalid hex character: %c", c)
		}
	}
}

func TestGenerateRoomIDDeterministic(t *testing.T) {
	code := "alpha-beta-gamma"

	id1 := GenerateRoomID(code)
	id2 := GenerateRoomID(code)

	if id1 != id2 {
		t.Error("GenerateRoomID should be deterministic")
	}
}

func TestGenerateRoomIDUnique(t *testing.T) {
	id1 := GenerateRoomID("alpha-beta-gamma")
	id2 := GenerateRoomID("delta-echo-foxtrot")

	if id1 == id2 {
		t.Error("Different codes should produce different room IDs")
	}
}

func TestGenerateRoomIDNormalization(t *testing.T) {
	id1 := GenerateRoomID("alpha-beta-gamma")
	id2 := GenerateRoomID("Alpha-Beta-Gamma")
	id3 := GenerateRoomID("ALPHA-BETA-GAMMA")

	if id1 != id2 || id2 != id3 {
		t.Error("GenerateRoomID should normalize before hashing")
	}
}

func TestGeneratedCodePassesValidation(t *testing.T) {
	for i := 0; i < 100; i++ {
		code, err := GenerateCode(3)
		if err != nil {
			t.Fatalf("GenerateCode failed: %v", err)
		}

		if !ValidateCode(code) {
			t.Errorf("Generated code fails validation: %s", code)
		}
	}
}

func TestGeneratedCodeIsNormalized(t *testing.T) {
	for i := 0; i < 100; i++ {
		code, err := GenerateCode(3)
		if err != nil {
			t.Fatalf("GenerateCode failed: %v", err)
		}

		normalized := NormalizeCode(code)
		if code != normalized {
			t.Errorf("Generated code is not normalized: %s (normalized: %s)", code, normalized)
		}
	}
}

func TestEntropy(t *testing.T) {
	// With 256 words and 3 words per code:
	// Entropy = log2(256^3) = 24 bits
	// With 4 words: 32 bits
	// With 5 words: 40 bits

	// This is a documentation test, not a calculation test
	wordCount := len(Words)
	t.Logf("Word count: %d", wordCount)
	t.Logf("3-word entropy: %.1f bits", float64(3)*logBase2(float64(wordCount)))
	t.Logf("4-word entropy: %.1f bits", float64(4)*logBase2(float64(wordCount)))
	t.Logf("5-word entropy: %.1f bits", float64(5)*logBase2(float64(wordCount)))
}

func logBase2(x float64) float64 {
	return 3.321928 * log10(x) // log2(x) = log10(x) / log10(2)
}

func log10(x float64) float64 {
	// Simple approximation for testing
	if x <= 0 {
		return 0
	}
	result := 0.0
	for x >= 10 {
		x /= 10
		result++
	}
	return result + (x-1)*0.4343 // crude approximation
}

func BenchmarkGenerateCode(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GenerateCode(3)
	}
}

func BenchmarkValidateCode(b *testing.B) {
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ValidateCode(code)
	}
}

func BenchmarkNormalizeCode(b *testing.B) {
	code := "Alpha-Beta-Gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		NormalizeCode(code)
	}
}

func BenchmarkGenerateRoomID(b *testing.B) {
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		GenerateRoomID(code)
	}
}
