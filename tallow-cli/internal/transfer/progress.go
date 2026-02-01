package transfer

import (
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/schollz/progressbar/v3"
)

// ProgressTracker tracks transfer progress
type ProgressTracker struct {
	bar        *progressbar.ProgressBar
	totalBytes int64
	sentBytes  int64
	startTime  time.Time
	mu         sync.Mutex
}

// NewProgressTracker creates a new progress tracker
func NewProgressTracker(totalBytes int64, description string) *ProgressTracker {
	bar := progressbar.NewOptions64(
		totalBytes,
		progressbar.OptionEnableColorCodes(true),
		progressbar.OptionShowBytes(true),
		progressbar.OptionSetWidth(40),
		progressbar.OptionShowCount(),
		progressbar.OptionSetDescription(description),
		progressbar.OptionSetTheme(progressbar.Theme{
			Saucer:        "[green]=[reset]",
			SaucerHead:    "[green]>[reset]",
			SaucerPadding: " ",
			BarStart:      "[",
			BarEnd:        "]",
		}),
		progressbar.OptionOnCompletion(func() {
			fmt.Println()
		}),
	)

	return &ProgressTracker{
		bar:        bar,
		totalBytes: totalBytes,
		startTime:  time.Now(),
	}
}

// Add adds bytes to the progress
func (p *ProgressTracker) Add(n int64) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.sentBytes += n
	p.bar.Add64(n)
}

// Set sets the absolute progress
func (p *ProgressTracker) Set(n int64) {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.sentBytes = n
	p.bar.Set64(n)
}

// Finish completes the progress bar
func (p *ProgressTracker) Finish() {
	p.bar.Finish()
}

// Speed returns the current transfer speed in bytes/sec
func (p *ProgressTracker) Speed() float64 {
	p.mu.Lock()
	defer p.mu.Unlock()

	elapsed := time.Since(p.startTime).Seconds()
	if elapsed == 0 {
		return 0
	}
	return float64(p.sentBytes) / elapsed
}

// ETA returns the estimated time remaining
func (p *ProgressTracker) ETA() time.Duration {
	speed := p.Speed()
	if speed == 0 {
		return 0
	}

	p.mu.Lock()
	remaining := p.totalBytes - p.sentBytes
	p.mu.Unlock()

	return time.Duration(float64(remaining)/speed) * time.Second
}

// Percentage returns the completion percentage
func (p *ProgressTracker) Percentage() float64 {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.totalBytes == 0 {
		return 100
	}
	return float64(p.sentBytes) / float64(p.totalBytes) * 100
}

// ProgressReader wraps an io.Reader with progress tracking
type ProgressReader struct {
	reader   io.Reader
	tracker  *ProgressTracker
}

// NewProgressReader creates a progress-tracking reader
func NewProgressReader(r io.Reader, tracker *ProgressTracker) *ProgressReader {
	return &ProgressReader{
		reader:  r,
		tracker: tracker,
	}
}

// Read implements io.Reader
func (p *ProgressReader) Read(buf []byte) (n int, err error) {
	n, err = p.reader.Read(buf)
	if n > 0 {
		p.tracker.Add(int64(n))
	}
	return n, err
}

// ProgressWriter wraps an io.Writer with progress tracking
type ProgressWriter struct {
	writer  io.Writer
	tracker *ProgressTracker
}

// NewProgressWriter creates a progress-tracking writer
func NewProgressWriter(w io.Writer, tracker *ProgressTracker) *ProgressWriter {
	return &ProgressWriter{
		writer:  w,
		tracker: tracker,
	}
}

// Write implements io.Writer
func (p *ProgressWriter) Write(buf []byte) (n int, err error) {
	n, err = p.writer.Write(buf)
	if n > 0 {
		p.tracker.Add(int64(n))
	}
	return n, err
}

// SimpleProgress provides a simple text-based progress display
type SimpleProgress struct {
	totalBytes   int64
	currentBytes int64
	startTime    time.Time
	lastUpdate   time.Time
	description  string
	mu           sync.Mutex
}

// NewSimpleProgress creates a simple progress display
func NewSimpleProgress(totalBytes int64, description string) *SimpleProgress {
	return &SimpleProgress{
		totalBytes:  totalBytes,
		startTime:   time.Now(),
		lastUpdate:  time.Now(),
		description: description,
	}
}

// Update updates the progress
func (s *SimpleProgress) Update(currentBytes int64) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.currentBytes = currentBytes

	// Throttle updates to every 100ms
	if time.Since(s.lastUpdate) < 100*time.Millisecond {
		return
	}
	s.lastUpdate = time.Now()

	percentage := float64(currentBytes) / float64(s.totalBytes) * 100
	elapsed := time.Since(s.startTime).Seconds()
	speed := float64(currentBytes) / elapsed

	// Build progress bar
	barWidth := 30
	filled := int(percentage / 100 * float64(barWidth))
	bar := strings.Repeat("=", filled) + strings.Repeat(" ", barWidth-filled)

	// Format speed
	speedStr := formatBytes(int64(speed)) + "/s"

	// Clear line and print
	fmt.Fprintf(os.Stderr, "\r%s [%s] %.1f%% %s   ",
		s.description, bar, percentage, speedStr)
}

// Finish completes the progress
func (s *SimpleProgress) Finish() {
	s.mu.Lock()
	defer s.mu.Unlock()

	elapsed := time.Since(s.startTime)
	avgSpeed := float64(s.totalBytes) / elapsed.Seconds()

	fmt.Fprintf(os.Stderr, "\r%s [%s] 100%% %s (%.1fs)\n",
		s.description,
		strings.Repeat("=", 30),
		formatBytes(int64(avgSpeed))+"/s",
		elapsed.Seconds())
}

// formatBytes formats bytes as human-readable string
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// FormatSpeed formats a speed value
func FormatSpeed(bytesPerSec float64) string {
	return formatBytes(int64(bytesPerSec)) + "/s"
}

// FormatDuration formats a duration
func FormatDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%.0fs", d.Seconds())
	}
	if d < time.Hour {
		return fmt.Sprintf("%dm%ds", int(d.Minutes()), int(d.Seconds())%60)
	}
	return fmt.Sprintf("%dh%dm", int(d.Hours()), int(d.Minutes())%60)
}
