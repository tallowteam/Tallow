package protocol

import (
	"strings"
	"testing"
)

func TestGenerateRoomCode(t *testing.T) {
	tests := []struct {
		name     string
		numWords int
	}{
		{"default (3 words)", 0},
		{"2 words", 2},
		{"3 words", 3},
		{"4 words", 4},
		{"5 words", 5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			code, err := GenerateRoomCode(tt.numWords)
			if err != nil {
				t.Fatalf("GenerateRoomCode failed: %v", err)
			}

			expectedWords := tt.numWords
			if expectedWords <= 0 {
				expectedWords = 3
			}

			parts := strings.Split(code, "-")
			if len(parts) != expectedWords {
				t.Errorf("word count = %v, want %v", len(parts), expectedWords)
			}

			// All parts should be lowercase
			for _, part := range parts {
				if part != strings.ToLower(part) {
					t.Errorf("word %q should be lowercase", part)
				}
			}
		})
	}
}

func TestGenerateRoomCodeUniqueness(t *testing.T) {
	codes := make(map[string]bool)

	for i := 0; i < 1000; i++ {
		code, err := GenerateRoomCode(3)
		if err != nil {
			t.Fatalf("GenerateRoomCode failed: %v", err)
		}

		if codes[code] {
			// With 256^3 = 16M possibilities, collision in 1000 is very unlikely
			// but not impossible. Just log a warning.
			t.Logf("Warning: duplicate code %q at iteration %d", code, i)
		}
		codes[code] = true
	}
}

func TestValidateRoomCode(t *testing.T) {
	tests := []struct {
		name  string
		code  string
		valid bool
	}{
		{"valid 2 words", "alpha-bear", true},
		{"valid 3 words", "alpha-bear-cat", true},
		{"valid 4 words", "alpha-bear-cat-delta", true},
		{"valid 6 words", "alpha-bear-cat-delta-echo-fox", true},
		{"single word", "alpha", false},
		{"7+ words", "a-b-c-d-e-f-g", false},
		{"empty", "", false},
		{"invalid word", "alpha-notaword-bear", false},
		{"mixed case valid", "Alpha-Bear-Cat", true},
		{"with spaces", "alpha bear cat", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateRoomCode(tt.code)
			if result != tt.valid {
				t.Errorf("ValidateRoomCode(%q) = %v, want %v", tt.code, result, tt.valid)
			}
		})
	}
}

func TestNormalizeRoomCode(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"lowercase", "alpha-bear-cat", "alpha-bear-cat"},
		{"uppercase", "ALPHA-BEAR-CAT", "alpha-bear-cat"},
		{"mixed case", "Alpha-Bear-Cat", "alpha-bear-cat"},
		{"with spaces", "  alpha-bear-cat  ", "alpha-bear-cat"},
		{"empty", "", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NormalizeRoomCode(tt.input)
			if result != tt.expected {
				t.Errorf("NormalizeRoomCode(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestRoomIDFromCode(t *testing.T) {
	// Same code should always produce same room ID
	code := "alpha-beta-gamma"
	id1 := RoomIDFromCode(code)
	id2 := RoomIDFromCode(code)

	if id1 != id2 {
		t.Error("RoomIDFromCode should be deterministic")
	}

	// Different codes should produce different IDs
	code2 := "delta-echo-foxtrot"
	id3 := RoomIDFromCode(code2)

	if id1 == id3 {
		t.Error("Different codes should produce different room IDs")
	}

	// ID should be 32 hex characters
	if len(id1) != 32 {
		t.Errorf("RoomID len = %v, want 32", len(id1))
	}

	// All characters should be hex
	for _, c := range id1 {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			t.Errorf("Invalid hex character: %c", c)
		}
	}
}

func TestRoomIDFromCodeNormalization(t *testing.T) {
	// Same code with different cases should produce same ID
	id1 := RoomIDFromCode("alpha-beta-gamma")
	id2 := RoomIDFromCode("Alpha-Beta-Gamma")
	id3 := RoomIDFromCode("ALPHA-BETA-GAMMA")
	id4 := RoomIDFromCode("  alpha-beta-gamma  ")

	if id1 != id2 || id2 != id3 || id3 != id4 {
		t.Error("RoomIDFromCode should normalize before hashing")
	}
}

func TestCodeToKeyMaterial(t *testing.T) {
	code := "alpha-beta-gamma"
	key := CodeToKeyMaterial(code)

	// Key should be 32 bytes
	if len(key) != 32 {
		t.Errorf("key len = %v, want 32", len(key))
	}

	// Same code should produce same key
	key2 := CodeToKeyMaterial(code)
	if string(key) != string(key2) {
		t.Error("CodeToKeyMaterial should be deterministic")
	}

	// Different codes should produce different keys
	code2 := "delta-echo-foxtrot"
	key3 := CodeToKeyMaterial(code2)
	if string(key) == string(key3) {
		t.Error("Different codes should produce different keys")
	}
}

func TestCodeToKeyMaterialNormalization(t *testing.T) {
	// Same code with different cases should produce same key
	key1 := CodeToKeyMaterial("alpha-beta-gamma")
	key2 := CodeToKeyMaterial("Alpha-Beta-Gamma")
	key3 := CodeToKeyMaterial("ALPHA-BETA-GAMMA")

	if string(key1) != string(key2) || string(key2) != string(key3) {
		t.Error("CodeToKeyMaterial should normalize before derivation")
	}
}

func TestGeneratedCodeIsValid(t *testing.T) {
	// All generated codes should be valid
	for i := 0; i < 100; i++ {
		code, err := GenerateRoomCode(3)
		if err != nil {
			t.Fatalf("GenerateRoomCode failed: %v", err)
		}

		if !ValidateRoomCode(code) {
			t.Errorf("Generated code %q is not valid", code)
		}
	}
}

func TestGeneratedCodeNormalized(t *testing.T) {
	// All generated codes should already be normalized
	for i := 0; i < 100; i++ {
		code, err := GenerateRoomCode(3)
		if err != nil {
			t.Fatalf("GenerateRoomCode failed: %v", err)
		}

		normalized := NormalizeRoomCode(code)
		if code != normalized {
			t.Errorf("Generated code %q is not normalized (becomes %q)", code, normalized)
		}
	}
}

func BenchmarkGenerateRoomCode(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GenerateRoomCode(3)
	}
}

func BenchmarkValidateRoomCode(b *testing.B) {
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ValidateRoomCode(code)
	}
}

func BenchmarkRoomIDFromCode(b *testing.B) {
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		RoomIDFromCode(code)
	}
}

func BenchmarkCodeToKeyMaterial(b *testing.B) {
	code := "alpha-beta-gamma"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		CodeToKeyMaterial(code)
	}
}
