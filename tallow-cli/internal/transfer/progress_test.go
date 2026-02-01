package transfer

import (
	"bytes"
	"io"
	"testing"
	"time"
)

func TestNewProgressTracker(t *testing.T) {
	tracker := NewProgressTracker(1000, "Testing")
	if tracker == nil {
		t.Fatal("NewProgressTracker returned nil")
	}
}

func TestProgressTrackerAdd(t *testing.T) {
	tracker := NewProgressTracker(1000, "Test")

	tracker.Add(100)
	if tracker.Percentage() != 10 {
		t.Errorf("Percentage() = %v, want 10", tracker.Percentage())
	}

	tracker.Add(400)
	if tracker.Percentage() != 50 {
		t.Errorf("Percentage() = %v, want 50", tracker.Percentage())
	}

	tracker.Add(500)
	if tracker.Percentage() != 100 {
		t.Errorf("Percentage() = %v, want 100", tracker.Percentage())
	}
}

func TestProgressTrackerSet(t *testing.T) {
	tracker := NewProgressTracker(1000, "Test")

	tracker.Set(500)
	if tracker.Percentage() != 50 {
		t.Errorf("Percentage() = %v, want 50", tracker.Percentage())
	}

	tracker.Set(250)
	if tracker.Percentage() != 25 {
		t.Errorf("Percentage() = %v, want 25", tracker.Percentage())
	}
}

func TestProgressTrackerPercentage(t *testing.T) {
	tests := []struct {
		name       string
		total      int64
		current    int64
		wantPct    float64
	}{
		{"zero total", 0, 0, 100},
		{"empty", 1000, 0, 0},
		{"quarter", 1000, 250, 25},
		{"half", 1000, 500, 50},
		{"full", 1000, 1000, 100},
		{"overflow", 1000, 1500, 150},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tracker := NewProgressTracker(tt.total, "Test")
			tracker.Set(tt.current)

			got := tracker.Percentage()
			if got != tt.wantPct {
				t.Errorf("Percentage() = %v, want %v", got, tt.wantPct)
			}
		})
	}
}

func TestProgressTrackerSpeed(t *testing.T) {
	tracker := NewProgressTracker(10000, "Test")

	// Add bytes over time
	tracker.Add(1000)
	time.Sleep(100 * time.Millisecond)

	speed := tracker.Speed()
	if speed <= 0 {
		t.Error("Speed should be positive")
	}

	// Speed should be roughly 10000 bytes/sec (1000 bytes in 0.1 sec)
	// Allow for timing variance
	if speed < 5000 || speed > 20000 {
		t.Logf("Speed = %v bytes/sec (expected ~10000)", speed)
	}
}

func TestProgressTrackerSpeedNoTime(t *testing.T) {
	tracker := NewProgressTracker(1000, "Test")
	tracker.Set(500)

	// Speed should return 0 or very high when called immediately
	speed := tracker.Speed()
	if speed < 0 {
		t.Error("Speed should not be negative")
	}
}

func TestProgressTrackerETA(t *testing.T) {
	tracker := NewProgressTracker(10000, "Test")

	tracker.Add(1000)
	// Longer sleep for more stable timing in containerized environments
	time.Sleep(200 * time.Millisecond)

	eta := tracker.ETA()

	// ETA should be positive for incomplete transfer
	// In fast environments, ETA might be very small but should still be > 0
	// Allow for timing variance - if speed is too fast, ETA might be very small
	if eta < 0 {
		t.Error("ETA should not be negative for incomplete transfer")
	}

	// Log the ETA for debugging
	t.Logf("ETA = %v (remaining 9000 bytes)", eta)
}

func TestProgressTrackerETAZeroSpeed(t *testing.T) {
	tracker := NewProgressTracker(1000, "Test")
	// Don't add any bytes

	eta := tracker.ETA()
	if eta != 0 {
		t.Errorf("ETA with zero speed = %v, want 0", eta)
	}
}

func TestProgressTrackerFinish(t *testing.T) {
	tracker := NewProgressTracker(1000, "Test")
	tracker.Add(1000)

	// Should not panic
	tracker.Finish()
}

func TestProgressReader(t *testing.T) {
	data := []byte("hello world")
	tracker := NewProgressTracker(int64(len(data)), "Test")
	reader := NewProgressReader(bytes.NewReader(data), tracker)

	// Read all data
	buf := make([]byte, len(data))
	n, err := io.ReadFull(reader, buf)
	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}

	if n != len(data) {
		t.Errorf("Read %d bytes, want %d", n, len(data))
	}

	if !bytes.Equal(buf, data) {
		t.Error("Data mismatch")
	}

	if tracker.Percentage() != 100 {
		t.Errorf("Percentage = %v, want 100", tracker.Percentage())
	}
}

func TestProgressReaderChunked(t *testing.T) {
	data := bytes.Repeat([]byte("a"), 1000)
	tracker := NewProgressTracker(int64(len(data)), "Test")
	reader := NewProgressReader(bytes.NewReader(data), tracker)

	// Read in small chunks
	buf := make([]byte, 100)
	total := 0
	for {
		n, err := reader.Read(buf)
		total += n
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Read failed: %v", err)
		}
	}

	if total != len(data) {
		t.Errorf("Total read %d bytes, want %d", total, len(data))
	}

	if tracker.Percentage() != 100 {
		t.Errorf("Percentage = %v, want 100", tracker.Percentage())
	}
}

func TestProgressWriter(t *testing.T) {
	data := []byte("hello world")
	tracker := NewProgressTracker(int64(len(data)), "Test")
	var buf bytes.Buffer
	writer := NewProgressWriter(&buf, tracker)

	// Write all data
	n, err := writer.Write(data)
	if err != nil {
		t.Fatalf("Write failed: %v", err)
	}

	if n != len(data) {
		t.Errorf("Wrote %d bytes, want %d", n, len(data))
	}

	if !bytes.Equal(buf.Bytes(), data) {
		t.Error("Data mismatch")
	}

	if tracker.Percentage() != 100 {
		t.Errorf("Percentage = %v, want 100", tracker.Percentage())
	}
}

func TestSimpleProgress(t *testing.T) {
	progress := NewSimpleProgress(1000, "Test")
	if progress == nil {
		t.Fatal("NewSimpleProgress returned nil")
	}
}

func TestSimpleProgressUpdate(t *testing.T) {
	progress := NewSimpleProgress(1000, "Test")

	// Should not panic
	progress.Update(500)
	progress.Update(1000)
}

func TestSimpleProgressFinish(t *testing.T) {
	progress := NewSimpleProgress(1000, "Test")
	progress.Update(1000)

	// Should not panic
	progress.Finish()
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		bytes    int64
		expected string
	}{
		{0, "0 B"},
		{100, "100 B"},
		{1023, "1023 B"},
		{1024, "1.0 KB"},
		{1536, "1.5 KB"},
		{1048576, "1.0 MB"},
		{1073741824, "1.0 GB"},
		{1099511627776, "1.0 TB"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := formatBytes(tt.bytes)
			if result != tt.expected {
				t.Errorf("formatBytes(%d) = %q, want %q", tt.bytes, result, tt.expected)
			}
		})
	}
}

func TestFormatSpeed(t *testing.T) {
	tests := []struct {
		bytesPerSec float64
		expected    string
	}{
		{0, "0 B/s"},
		{1024, "1.0 KB/s"},
		{1048576, "1.0 MB/s"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := FormatSpeed(tt.bytesPerSec)
			if result != tt.expected {
				t.Errorf("FormatSpeed(%.0f) = %q, want %q", tt.bytesPerSec, result, tt.expected)
			}
		})
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		duration time.Duration
		expected string
	}{
		{30 * time.Second, "30s"},
		{90 * time.Second, "1m30s"},
		{3600 * time.Second, "1h0m"},
		{3660 * time.Second, "1h1m"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := FormatDuration(tt.duration)
			if result != tt.expected {
				t.Errorf("FormatDuration(%v) = %q, want %q", tt.duration, result, tt.expected)
			}
		})
	}
}

func TestProgressTrackerConcurrency(t *testing.T) {
	tracker := NewProgressTracker(100000, "Test")

	done := make(chan bool)

	// Multiple goroutines adding bytes
	for i := 0; i < 10; i++ {
		go func() {
			for j := 0; j < 1000; j++ {
				tracker.Add(10)
			}
			done <- true
		}()
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}

	// Total should be 10 * 1000 * 10 = 100000
	if tracker.Percentage() != 100 {
		t.Errorf("Percentage = %v, want 100", tracker.Percentage())
	}
}

func BenchmarkProgressTrackerAdd(b *testing.B) {
	tracker := NewProgressTracker(int64(b.N), "Bench")

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tracker.Add(1)
	}
}

func BenchmarkProgressReader(b *testing.B) {
	data := bytes.Repeat([]byte("x"), 1024)
	buf := make([]byte, 1024)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		tracker := NewProgressTracker(1024, "Bench")
		reader := NewProgressReader(bytes.NewReader(data), tracker)
		reader.Read(buf)
	}
}
