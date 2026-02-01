package transfer

import (
	"archive/tar"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// BatchConfig configures batch transfers
type BatchConfig struct {
	// Paths can be files or directories
	Paths       []string
	ChunkSize   int
	Compress    bool
	RoomCode    string
	RelayURL    string
	LocalFirst  bool
	Timeout     time.Duration
	OutputDir   string
	Overwrite   bool
	Concurrency int // Number of concurrent file transfers
}

// BatchItem represents a single item in a batch transfer
type BatchItem struct {
	Path         string
	RelativePath string
	Size         int64
	IsDir        bool
	Mode         os.FileMode
}

// BatchResult represents the result of a batch operation
type BatchResult struct {
	Item    BatchItem
	Success bool
	Error   error
	Bytes   int64
	Time    time.Duration
}

// BatchSender handles sending multiple files and directories
type BatchSender struct {
	config     BatchConfig
	items      []BatchItem
	totalSize  int64
	totalFiles int
	progress   *ProgressTracker
	mu         sync.Mutex
	results    []BatchResult
	archivePath string
}

// NewBatchSender creates a new batch sender
func NewBatchSender(config BatchConfig) (*BatchSender, error) {
	if len(config.Paths) == 0 {
		return nil, errors.New("no paths provided")
	}
	if config.ChunkSize <= 0 {
		config.ChunkSize = DefaultChunkSize
	}
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Minute
	}
	if config.Concurrency <= 0 {
		config.Concurrency = 1
	}

	bs := &BatchSender{
		config: config,
	}

	// Scan all paths to build item list
	for _, path := range config.Paths {
		if err := bs.scanPath(path); err != nil {
			return nil, fmt.Errorf("failed to scan %s: %w", path, err)
		}
	}

	if bs.totalFiles == 0 {
		return nil, errors.New("no files found in provided paths")
	}

	return bs, nil
}

// scanPath recursively scans a path and adds items
func (bs *BatchSender) scanPath(path string) error {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return err
	}

	stat, err := os.Stat(absPath)
	if err != nil {
		return err
	}

	basePath := filepath.Dir(absPath)

	if stat.IsDir() {
		// Walk directory
		return filepath.Walk(absPath, func(p string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			relPath, err := filepath.Rel(basePath, p)
			if err != nil {
				relPath = filepath.Base(p)
			}

			item := BatchItem{
				Path:         p,
				RelativePath: relPath,
				IsDir:        info.IsDir(),
				Mode:         info.Mode(),
			}

			if !info.IsDir() {
				item.Size = info.Size()
				bs.totalSize += info.Size()
				bs.totalFiles++
			}

			bs.items = append(bs.items, item)
			return nil
		})
	}

	// Single file
	item := BatchItem{
		Path:         absPath,
		RelativePath: stat.Name(),
		Size:         stat.Size(),
		IsDir:        false,
		Mode:         stat.Mode(),
	}
	bs.items = append(bs.items, item)
	bs.totalSize += stat.Size()
	bs.totalFiles++

	return nil
}

// TotalSize returns the total size of all files
func (bs *BatchSender) TotalSize() int64 {
	return bs.totalSize
}

// TotalFiles returns the total number of files
func (bs *BatchSender) TotalFiles() int {
	return bs.totalFiles
}

// Items returns all batch items
func (bs *BatchSender) Items() []BatchItem {
	return bs.items
}

// CreateArchive creates a tar.gz archive of all items
func (bs *BatchSender) CreateArchive() (string, error) {
	// Create temp file for archive
	tempFile, err := os.CreateTemp("", "tallow-batch-*.tar.gz")
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}
	tempPath := tempFile.Name()
	bs.archivePath = tempPath

	// Create gzip writer
	gzw := gzip.NewWriter(tempFile)
	defer gzw.Close()

	// Create tar writer
	tw := tar.NewWriter(gzw)
	defer tw.Close()

	// Add all items to archive
	for _, item := range bs.items {
		if err := bs.addToTar(tw, item); err != nil {
			tempFile.Close()
			os.Remove(tempPath)
			return "", fmt.Errorf("failed to add %s to archive: %w", item.RelativePath, err)
		}
	}

	if err := tw.Close(); err != nil {
		tempFile.Close()
		os.Remove(tempPath)
		return "", err
	}

	if err := gzw.Close(); err != nil {
		tempFile.Close()
		os.Remove(tempPath)
		return "", err
	}

	if err := tempFile.Close(); err != nil {
		os.Remove(tempPath)
		return "", err
	}

	return tempPath, nil
}

// addToTar adds an item to the tar archive
func (bs *BatchSender) addToTar(tw *tar.Writer, item BatchItem) error {
	if item.IsDir {
		header := &tar.Header{
			Name:     item.RelativePath + "/",
			Mode:     int64(item.Mode),
			Typeflag: tar.TypeDir,
		}
		return tw.WriteHeader(header)
	}

	// Open file
	file, err := os.Open(item.Path)
	if err != nil {
		return err
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return err
	}

	header := &tar.Header{
		Name:    item.RelativePath,
		Mode:    int64(item.Mode),
		Size:    stat.Size(),
		ModTime: stat.ModTime(),
	}

	if err := tw.WriteHeader(header); err != nil {
		return err
	}

	_, err = io.Copy(tw, file)
	return err
}

// CleanupArchive removes the temporary archive
func (bs *BatchSender) CleanupArchive() error {
	if bs.archivePath != "" {
		return os.Remove(bs.archivePath)
	}
	return nil
}

// Results returns the results of the batch transfer
func (bs *BatchSender) Results() []BatchResult {
	bs.mu.Lock()
	defer bs.mu.Unlock()
	return bs.results
}

// BatchReceiver handles receiving multiple files/directories
type BatchReceiver struct {
	config    BatchConfig
	items     []BatchItem
	totalSize int64
	progress  *ProgressTracker
	mu        sync.Mutex
	results   []BatchResult
}

// NewBatchReceiver creates a new batch receiver
func NewBatchReceiver(config BatchConfig) (*BatchReceiver, error) {
	if config.OutputDir == "" {
		config.OutputDir = "."
	}

	// Ensure output directory exists
	if err := os.MkdirAll(config.OutputDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %w", err)
	}

	return &BatchReceiver{
		config: config,
	}, nil
}

// ExtractArchive extracts a tar.gz archive to the output directory
func (br *BatchReceiver) ExtractArchive(archivePath string) error {
	file, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer file.Close()

	gzr, err := gzip.NewReader(file)
	if err != nil {
		return fmt.Errorf("failed to create gzip reader: %w", err)
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to read tar header: %w", err)
		}

		// Sanitize path to prevent directory traversal
		target := filepath.Join(br.config.OutputDir, header.Name)
		if !strings.HasPrefix(target, filepath.Clean(br.config.OutputDir)+string(os.PathSeparator)) {
			return fmt.Errorf("invalid path in archive: %s", header.Name)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, os.FileMode(header.Mode)); err != nil {
				return fmt.Errorf("failed to create directory %s: %w", target, err)
			}
			br.items = append(br.items, BatchItem{
				Path:         target,
				RelativePath: header.Name,
				IsDir:        true,
				Mode:         os.FileMode(header.Mode),
			})

		case tar.TypeReg:
			// Ensure parent directory exists
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return fmt.Errorf("failed to create parent directory: %w", err)
			}

			// Check if file exists and overwrite is disabled
			if _, err := os.Stat(target); err == nil && !br.config.Overwrite {
				return fmt.Errorf("file already exists: %s", target)
			}

			// Create file
			outFile, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, os.FileMode(header.Mode))
			if err != nil {
				return fmt.Errorf("failed to create file %s: %w", target, err)
			}

			// Copy content with size limit
			written, err := io.Copy(outFile, io.LimitReader(tr, header.Size))
			outFile.Close()
			if err != nil {
				os.Remove(target)
				return fmt.Errorf("failed to write file %s: %w", target, err)
			}

			br.items = append(br.items, BatchItem{
				Path:         target,
				RelativePath: header.Name,
				Size:         written,
				IsDir:        false,
				Mode:         os.FileMode(header.Mode),
			})
			br.totalSize += written

		default:
			// Skip other types
		}
	}

	return nil
}

// ExtractedItems returns all extracted items
func (br *BatchReceiver) ExtractedItems() []BatchItem {
	return br.items
}

// TotalSize returns the total size of extracted files
func (br *BatchReceiver) TotalSize() int64 {
	return br.totalSize
}

// Results returns the results
func (br *BatchReceiver) Results() []BatchResult {
	br.mu.Lock()
	defer br.mu.Unlock()
	return br.results
}

// DragDropParser parses drag-and-drop input (multiple paths)
type DragDropParser struct {
	paths []string
}

// NewDragDropParser creates a parser for drag-and-drop paths
func NewDragDropParser() *DragDropParser {
	return &DragDropParser{}
}

// AddPath adds a path (file or directory)
func (d *DragDropParser) AddPath(path string) error {
	// Resolve to absolute path
	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("invalid path %s: %w", path, err)
	}

	// Verify path exists
	if _, err := os.Stat(absPath); err != nil {
		return fmt.Errorf("path not accessible %s: %w", path, err)
	}

	d.paths = append(d.paths, absPath)
	return nil
}

// AddPaths adds multiple paths
func (d *DragDropParser) AddPaths(paths []string) error {
	for _, p := range paths {
		if err := d.AddPath(p); err != nil {
			return err
		}
	}
	return nil
}

// Paths returns all valid paths
func (d *DragDropParser) Paths() []string {
	return d.paths
}

// HasDirectories returns true if any path is a directory
func (d *DragDropParser) HasDirectories() bool {
	for _, p := range d.paths {
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			return true
		}
	}
	return false
}

// HasMultiple returns true if there are multiple paths
func (d *DragDropParser) HasMultiple() bool {
	return len(d.paths) > 1
}

// TotalItems returns statistics about the paths
func (d *DragDropParser) TotalItems() (files, dirs int, totalSize int64, err error) {
	for _, p := range d.paths {
		err = filepath.Walk(p, func(path string, info os.FileInfo, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if info.IsDir() {
				dirs++
			} else {
				files++
				totalSize += info.Size()
			}
			return nil
		})
		if err != nil {
			return
		}
	}
	return
}

// BatchProgress tracks progress for batch transfers
type BatchProgress struct {
	TotalFiles     int
	CompletedFiles int
	TotalBytes     int64
	TransferredBytes int64
	CurrentFile    string
	StartTime      time.Time
	mu             sync.Mutex
}

// NewBatchProgress creates a new batch progress tracker
func NewBatchProgress(totalFiles int, totalBytes int64) *BatchProgress {
	return &BatchProgress{
		TotalFiles: totalFiles,
		TotalBytes: totalBytes,
		StartTime:  time.Now(),
	}
}

// StartFile marks a file as being transferred
func (bp *BatchProgress) StartFile(name string) {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	bp.CurrentFile = name
}

// CompleteFile marks a file as completed
func (bp *BatchProgress) CompleteFile(bytes int64) {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	bp.CompletedFiles++
	bp.TransferredBytes += bytes
}

// Progress returns the completion percentage
func (bp *BatchProgress) Progress() float64 {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	if bp.TotalBytes == 0 {
		return 100
	}
	return float64(bp.TransferredBytes) / float64(bp.TotalBytes) * 100
}

// FileProgress returns file completion percentage
func (bp *BatchProgress) FileProgress() float64 {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	if bp.TotalFiles == 0 {
		return 100
	}
	return float64(bp.CompletedFiles) / float64(bp.TotalFiles) * 100
}

// Speed returns transfer speed in bytes/sec
func (bp *BatchProgress) Speed() float64 {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	elapsed := time.Since(bp.StartTime).Seconds()
	if elapsed == 0 {
		return 0
	}
	return float64(bp.TransferredBytes) / elapsed
}

// ETA returns estimated time remaining
func (bp *BatchProgress) ETA() time.Duration {
	speed := bp.Speed()
	if speed == 0 {
		return 0
	}
	bp.mu.Lock()
	remaining := bp.TotalBytes - bp.TransferredBytes
	bp.mu.Unlock()
	return time.Duration(float64(remaining)/speed) * time.Second
}

// String returns a human-readable progress string
func (bp *BatchProgress) String() string {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	return fmt.Sprintf("[%d/%d files] %.1f%% - %s",
		bp.CompletedFiles, bp.TotalFiles,
		float64(bp.TransferredBytes)/float64(bp.TotalBytes)*100,
		bp.CurrentFile)
}
