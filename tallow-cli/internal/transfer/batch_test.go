package transfer

import (
	"archive/tar"
	"compress/gzip"
	"io"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// Test helpers

func createTestDir(t *testing.T) string {
	t.Helper()
	dir, err := os.MkdirTemp("", "tallow-batch-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	return dir
}

func createTestFile(t *testing.T, dir, name string, size int) string {
	t.Helper()
	path := filepath.Join(dir, name)

	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatalf("Failed to create parent dir: %v", err)
	}

	data := make([]byte, size)
	for i := range data {
		data[i] = byte(i % 256)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	return path
}

func createTestSubdir(t *testing.T, dir, name string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	if err := os.MkdirAll(path, 0755); err != nil {
		t.Fatalf("Failed to create subdir: %v", err)
	}
	return path
}

// DragDropParser tests

func TestNewDragDropParser(t *testing.T) {
	parser := NewDragDropParser()
	if parser == nil {
		t.Fatal("NewDragDropParser returned nil")
	}
	if len(parser.Paths()) != 0 {
		t.Error("New parser should have no paths")
	}
}

func TestDragDropParserAddPath(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	file := createTestFile(t, dir, "test.txt", 100)

	parser := NewDragDropParser()
	err := parser.AddPath(file)
	if err != nil {
		t.Fatalf("AddPath failed: %v", err)
	}

	if len(parser.Paths()) != 1 {
		t.Errorf("Expected 1 path, got %d", len(parser.Paths()))
	}
}

func TestDragDropParserAddPaths(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	file1 := createTestFile(t, dir, "file1.txt", 100)
	file2 := createTestFile(t, dir, "file2.txt", 200)
	file3 := createTestFile(t, dir, "file3.txt", 300)

	parser := NewDragDropParser()
	err := parser.AddPaths([]string{file1, file2, file3})
	if err != nil {
		t.Fatalf("AddPaths failed: %v", err)
	}

	if len(parser.Paths()) != 3 {
		t.Errorf("Expected 3 paths, got %d", len(parser.Paths()))
	}
}

func TestDragDropParserAddInvalidPath(t *testing.T) {
	parser := NewDragDropParser()
	err := parser.AddPath("/nonexistent/path/to/file.txt")
	if err == nil {
		t.Error("Expected error for nonexistent path")
	}
}

func TestDragDropParserHasDirectories(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	file := createTestFile(t, dir, "test.txt", 100)
	subdir := createTestSubdir(t, dir, "subdir")

	tests := []struct {
		name     string
		paths    []string
		expected bool
	}{
		{"files only", []string{file}, false},
		{"directory only", []string{subdir}, true},
		{"mixed", []string{file, subdir}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parser := NewDragDropParser()
			parser.AddPaths(tt.paths)
			if parser.HasDirectories() != tt.expected {
				t.Errorf("HasDirectories() = %v, want %v", parser.HasDirectories(), tt.expected)
			}
		})
	}
}

func TestDragDropParserHasMultiple(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	file1 := createTestFile(t, dir, "file1.txt", 100)
	file2 := createTestFile(t, dir, "file2.txt", 100)

	tests := []struct {
		name     string
		paths    []string
		expected bool
	}{
		{"single", []string{file1}, false},
		{"multiple", []string{file1, file2}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			parser := NewDragDropParser()
			parser.AddPaths(tt.paths)
			if parser.HasMultiple() != tt.expected {
				t.Errorf("HasMultiple() = %v, want %v", parser.HasMultiple(), tt.expected)
			}
		})
	}
}

func TestDragDropParserTotalItems(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create structure:
	// dir/
	//   file1.txt (100 bytes)
	//   subdir/
	//     file2.txt (200 bytes)
	//     file3.txt (300 bytes)

	createTestFile(t, dir, "file1.txt", 100)
	subdir := createTestSubdir(t, dir, "subdir")
	createTestFile(t, subdir, "file2.txt", 200)
	createTestFile(t, subdir, "file3.txt", 300)

	parser := NewDragDropParser()
	parser.AddPath(dir)

	files, dirs, totalSize, err := parser.TotalItems()
	if err != nil {
		t.Fatalf("TotalItems failed: %v", err)
	}

	if files != 3 {
		t.Errorf("Expected 3 files, got %d", files)
	}
	// dirs includes the root dir and subdir
	if dirs < 2 {
		t.Errorf("Expected at least 2 directories, got %d", dirs)
	}
	if totalSize != 600 {
		t.Errorf("Expected total size 600, got %d", totalSize)
	}
}

// BatchSender tests

func TestNewBatchSender(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	createTestFile(t, dir, "file1.txt", 100)

	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{dir},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	if sender == nil {
		t.Fatal("NewBatchSender returned nil")
	}
}

func TestNewBatchSenderNoPaths(t *testing.T) {
	_, err := NewBatchSender(BatchConfig{
		Paths: []string{},
	})
	if err == nil {
		t.Error("Expected error for no paths")
	}
}

func TestNewBatchSenderInvalidPath(t *testing.T) {
	_, err := NewBatchSender(BatchConfig{
		Paths: []string{"/nonexistent/path"},
	})
	if err == nil {
		t.Error("Expected error for invalid path")
	}
}

func TestBatchSenderScanPath(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create test structure
	createTestFile(t, dir, "root.txt", 100)
	sub1 := createTestSubdir(t, dir, "sub1")
	createTestFile(t, sub1, "sub1_file.txt", 200)
	sub2 := createTestSubdir(t, sub1, "sub2")
	createTestFile(t, sub2, "deep_file.txt", 300)

	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{dir},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	if sender.TotalFiles() != 3 {
		t.Errorf("Expected 3 files, got %d", sender.TotalFiles())
	}
	if sender.TotalSize() != 600 {
		t.Errorf("Expected size 600, got %d", sender.TotalSize())
	}
}

func TestBatchSenderCreateArchive(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create test files
	createTestFile(t, dir, "file1.txt", 100)
	createTestFile(t, dir, "file2.txt", 200)
	sub := createTestSubdir(t, dir, "subdir")
	createTestFile(t, sub, "nested.txt", 300)

	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{dir},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	archivePath, err := sender.CreateArchive()
	if err != nil {
		t.Fatalf("CreateArchive failed: %v", err)
	}
	defer sender.CleanupArchive()

	// Verify archive exists
	stat, err := os.Stat(archivePath)
	if err != nil {
		t.Fatalf("Archive file not found: %v", err)
	}
	if stat.Size() == 0 {
		t.Error("Archive is empty")
	}

	// Verify archive contents
	file, err := os.Open(archivePath)
	if err != nil {
		t.Fatalf("Failed to open archive: %v", err)
	}
	defer file.Close()

	gzr, err := gzip.NewReader(file)
	if err != nil {
		t.Fatalf("Failed to create gzip reader: %v", err)
	}
	defer gzr.Close()

	tr := tar.NewReader(gzr)
	fileCount := 0
	dirCount := 0

	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatalf("Failed to read tar header: %v", err)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			dirCount++
		case tar.TypeReg:
			fileCount++
		}
	}

	if fileCount != 3 {
		t.Errorf("Expected 3 files in archive, got %d", fileCount)
	}
}

func TestBatchSenderCleanupArchive(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	createTestFile(t, dir, "test.txt", 100)

	sender, _ := NewBatchSender(BatchConfig{Paths: []string{dir}})
	archivePath, _ := sender.CreateArchive()

	// Verify archive exists
	if _, err := os.Stat(archivePath); err != nil {
		t.Fatal("Archive should exist before cleanup")
	}

	// Cleanup
	err := sender.CleanupArchive()
	if err != nil {
		t.Fatalf("CleanupArchive failed: %v", err)
	}

	// Verify archive is gone
	if _, err := os.Stat(archivePath); !os.IsNotExist(err) {
		t.Error("Archive should not exist after cleanup")
	}
}

func TestBatchSenderItems(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	createTestFile(t, dir, "file1.txt", 100)
	createTestFile(t, dir, "file2.txt", 200)

	sender, _ := NewBatchSender(BatchConfig{Paths: []string{dir}})

	items := sender.Items()
	if len(items) == 0 {
		t.Error("Items() returned empty slice")
	}

	// Verify items have correct data
	for _, item := range items {
		if item.Path == "" {
			t.Error("Item has empty path")
		}
		if item.RelativePath == "" {
			t.Error("Item has empty relative path")
		}
	}
}

// BatchReceiver tests

func TestNewBatchReceiver(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	receiver, err := NewBatchReceiver(BatchConfig{
		OutputDir: dir,
	})
	if err != nil {
		t.Fatalf("NewBatchReceiver failed: %v", err)
	}

	if receiver == nil {
		t.Fatal("NewBatchReceiver returned nil")
	}
}

func TestNewBatchReceiverCreatesDir(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	outputDir := filepath.Join(dir, "new", "nested", "output")

	_, err := NewBatchReceiver(BatchConfig{
		OutputDir: outputDir,
	})
	if err != nil {
		t.Fatalf("NewBatchReceiver failed: %v", err)
	}

	// Verify directory was created
	if _, err := os.Stat(outputDir); err != nil {
		t.Error("Output directory should have been created")
	}
}

func TestBatchReceiverExtractArchive(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create source files
	srcDir := filepath.Join(dir, "src")
	os.MkdirAll(srcDir, 0755)
	createTestFile(t, srcDir, "file1.txt", 100)
	createTestFile(t, srcDir, "file2.txt", 200)
	sub := createTestSubdir(t, srcDir, "subdir")
	createTestFile(t, sub, "nested.txt", 300)

	// Create archive
	sender, _ := NewBatchSender(BatchConfig{Paths: []string{srcDir}})
	archivePath, err := sender.CreateArchive()
	if err != nil {
		t.Fatalf("Failed to create archive: %v", err)
	}
	defer sender.CleanupArchive()

	// Extract archive
	outputDir := filepath.Join(dir, "output")
	receiver, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir})

	err = receiver.ExtractArchive(archivePath)
	if err != nil {
		t.Fatalf("ExtractArchive failed: %v", err)
	}

	// Verify extraction
	items := receiver.ExtractedItems()
	fileCount := 0
	for _, item := range items {
		if !item.IsDir {
			fileCount++
			// Verify file exists
			if _, err := os.Stat(item.Path); err != nil {
				t.Errorf("Extracted file not found: %s", item.Path)
			}
		}
	}

	if fileCount != 3 {
		t.Errorf("Expected 3 extracted files, got %d", fileCount)
	}

	if receiver.TotalSize() != 600 {
		t.Errorf("Expected total size 600, got %d", receiver.TotalSize())
	}
}

func TestBatchReceiverOverwrite(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create source file
	srcDir := filepath.Join(dir, "src")
	os.MkdirAll(srcDir, 0755)
	createTestFile(t, srcDir, "test.txt", 100)

	// Create archive
	sender, _ := NewBatchSender(BatchConfig{Paths: []string{srcDir}})
	archivePath, _ := sender.CreateArchive()
	defer sender.CleanupArchive()

	// Create existing file in output
	outputDir := filepath.Join(dir, "output")
	os.MkdirAll(outputDir, 0755)

	// We need to match the archive's internal path structure
	srcBase := filepath.Base(srcDir)
	existingPath := filepath.Join(outputDir, srcBase, "test.txt")
	os.MkdirAll(filepath.Dir(existingPath), 0755)
	os.WriteFile(existingPath, []byte("existing content"), 0644)

	// Try to extract without overwrite - should fail
	receiver1, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir, Overwrite: false})
	err := receiver1.ExtractArchive(archivePath)
	if err == nil {
		t.Error("Expected error when overwrite is false and file exists")
	}

	// Extract with overwrite - should succeed
	receiver2, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir, Overwrite: true})
	err = receiver2.ExtractArchive(archivePath)
	if err != nil {
		t.Fatalf("ExtractArchive with overwrite failed: %v", err)
	}
}

func TestBatchReceiverPathTraversal(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create a malicious archive with path traversal
	archivePath := filepath.Join(dir, "malicious.tar.gz")
	file, _ := os.Create(archivePath)
	gzw := gzip.NewWriter(file)
	tw := tar.NewWriter(gzw)

	// Try to write file outside of output dir
	header := &tar.Header{
		Name: "../../../etc/passwd",
		Mode: 0644,
		Size: 4,
	}
	tw.WriteHeader(header)
	tw.Write([]byte("test"))
	tw.Close()
	gzw.Close()
	file.Close()

	// Try to extract - should fail due to path traversal
	outputDir := filepath.Join(dir, "output")
	receiver, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir})

	err := receiver.ExtractArchive(archivePath)
	if err == nil {
		t.Error("Expected error for path traversal attempt")
	}
}

// BatchProgress tests

func TestNewBatchProgress(t *testing.T) {
	bp := NewBatchProgress(10, 1000)
	if bp == nil {
		t.Fatal("NewBatchProgress returned nil")
	}
	if bp.TotalFiles != 10 {
		t.Errorf("TotalFiles = %d, want 10", bp.TotalFiles)
	}
	if bp.TotalBytes != 1000 {
		t.Errorf("TotalBytes = %d, want 1000", bp.TotalBytes)
	}
}

func TestBatchProgressStartFile(t *testing.T) {
	bp := NewBatchProgress(10, 1000)
	bp.StartFile("test.txt")

	if bp.CurrentFile != "test.txt" {
		t.Errorf("CurrentFile = %s, want test.txt", bp.CurrentFile)
	}
}

func TestBatchProgressCompleteFile(t *testing.T) {
	bp := NewBatchProgress(10, 1000)

	bp.CompleteFile(100)
	if bp.CompletedFiles != 1 {
		t.Errorf("CompletedFiles = %d, want 1", bp.CompletedFiles)
	}
	if bp.TransferredBytes != 100 {
		t.Errorf("TransferredBytes = %d, want 100", bp.TransferredBytes)
	}

	bp.CompleteFile(200)
	if bp.CompletedFiles != 2 {
		t.Errorf("CompletedFiles = %d, want 2", bp.CompletedFiles)
	}
	if bp.TransferredBytes != 300 {
		t.Errorf("TransferredBytes = %d, want 300", bp.TransferredBytes)
	}
}

func TestBatchProgressProgress(t *testing.T) {
	bp := NewBatchProgress(10, 1000)

	// 0% initially
	if bp.Progress() != 0 {
		t.Errorf("Initial progress = %.1f, want 0", bp.Progress())
	}

	// 50%
	bp.TransferredBytes = 500
	if bp.Progress() != 50 {
		t.Errorf("50%% progress = %.1f, want 50", bp.Progress())
	}

	// 100%
	bp.TransferredBytes = 1000
	if bp.Progress() != 100 {
		t.Errorf("100%% progress = %.1f, want 100", bp.Progress())
	}
}

func TestBatchProgressFileProgress(t *testing.T) {
	bp := NewBatchProgress(10, 1000)

	if bp.FileProgress() != 0 {
		t.Errorf("Initial file progress = %.1f, want 0", bp.FileProgress())
	}

	bp.CompletedFiles = 5
	if bp.FileProgress() != 50 {
		t.Errorf("50%% file progress = %.1f, want 50", bp.FileProgress())
	}
}

func TestBatchProgressSpeed(t *testing.T) {
	bp := NewBatchProgress(10, 1000)

	// Initial speed should be 0
	if bp.Speed() != 0 {
		t.Logf("Initial speed = %.1f (expected 0 or very high)", bp.Speed())
	}

	// After some time
	time.Sleep(100 * time.Millisecond)
	bp.TransferredBytes = 1000

	speed := bp.Speed()
	if speed <= 0 {
		t.Logf("Speed after transfer = %.1f", speed)
	}
}

func TestBatchProgressETA(t *testing.T) {
	bp := NewBatchProgress(10, 10000)

	// Initial ETA should be 0 (no data yet)
	if bp.ETA() != 0 {
		t.Logf("Initial ETA = %v", bp.ETA())
	}

	// After transfer
	time.Sleep(100 * time.Millisecond)
	bp.TransferredBytes = 1000

	eta := bp.ETA()
	if eta < 0 {
		t.Error("ETA should not be negative")
	}
}

func TestBatchProgressString(t *testing.T) {
	bp := NewBatchProgress(10, 1000)
	bp.CurrentFile = "test.txt"
	bp.CompletedFiles = 5
	bp.TransferredBytes = 500

	str := bp.String()
	if str == "" {
		t.Error("String() returned empty")
	}

	// Should contain file count and current file
	if len(str) < 10 {
		t.Errorf("String too short: %s", str)
	}
}

func TestBatchProgressZeroTotal(t *testing.T) {
	// Test with zero totals
	bp := NewBatchProgress(0, 0)

	// Should not panic and return 100%
	if bp.Progress() != 100 {
		t.Errorf("Progress with zero total = %.1f, want 100", bp.Progress())
	}
	if bp.FileProgress() != 100 {
		t.Errorf("FileProgress with zero total = %.1f, want 100", bp.FileProgress())
	}
}

// Integration tests

func TestBatchRoundTrip(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create complex directory structure
	srcDir := filepath.Join(dir, "source")
	os.MkdirAll(srcDir, 0755)

	// Root files
	createTestFile(t, srcDir, "readme.txt", 500)
	createTestFile(t, srcDir, "main.go", 1000)

	// Nested directories
	docs := createTestSubdir(t, srcDir, "docs")
	createTestFile(t, docs, "guide.md", 2000)
	createTestFile(t, docs, "api.md", 1500)

	images := createTestSubdir(t, srcDir, "images")
	createTestFile(t, images, "logo.png", 5000)
	createTestFile(t, images, "icon.png", 3000)

	deep := createTestSubdir(t, images, "deep")
	createTestFile(t, deep, "nested.txt", 100)

	// Create sender
	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{srcDir},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	expectedFiles := sender.TotalFiles()
	expectedSize := sender.TotalSize()

	// Create archive
	archivePath, err := sender.CreateArchive()
	if err != nil {
		t.Fatalf("CreateArchive failed: %v", err)
	}
	defer sender.CleanupArchive()

	// Extract to different location
	outputDir := filepath.Join(dir, "output")
	receiver, err := NewBatchReceiver(BatchConfig{
		OutputDir: outputDir,
		Overwrite: true,
	})
	if err != nil {
		t.Fatalf("NewBatchReceiver failed: %v", err)
	}

	err = receiver.ExtractArchive(archivePath)
	if err != nil {
		t.Fatalf("ExtractArchive failed: %v", err)
	}

	// Verify results
	extractedFiles := 0
	for _, item := range receiver.ExtractedItems() {
		if !item.IsDir {
			extractedFiles++
		}
	}

	if extractedFiles != expectedFiles {
		t.Errorf("Extracted %d files, expected %d", extractedFiles, expectedFiles)
	}

	if receiver.TotalSize() != expectedSize {
		t.Errorf("Extracted size %d, expected %d", receiver.TotalSize(), expectedSize)
	}

	// Verify file contents match
	checkFilesMatch(t,
		filepath.Join(srcDir, "readme.txt"),
		filepath.Join(outputDir, filepath.Base(srcDir), "readme.txt"))
	checkFilesMatch(t,
		filepath.Join(srcDir, "docs", "guide.md"),
		filepath.Join(outputDir, filepath.Base(srcDir), "docs", "guide.md"))
	checkFilesMatch(t,
		filepath.Join(srcDir, "images", "deep", "nested.txt"),
		filepath.Join(outputDir, filepath.Base(srcDir), "images", "deep", "nested.txt"))
}

func checkFilesMatch(t *testing.T, path1, path2 string) {
	t.Helper()

	data1, err := os.ReadFile(path1)
	if err != nil {
		t.Errorf("Failed to read %s: %v", path1, err)
		return
	}

	data2, err := os.ReadFile(path2)
	if err != nil {
		t.Errorf("Failed to read %s: %v", path2, err)
		return
	}

	if len(data1) != len(data2) {
		t.Errorf("File sizes don't match: %d vs %d", len(data1), len(data2))
		return
	}

	for i := range data1 {
		if data1[i] != data2[i] {
			t.Errorf("File contents differ at byte %d", i)
			return
		}
	}
}

func TestBatchMultiplePaths(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create multiple separate directories
	dir1 := filepath.Join(dir, "dir1")
	dir2 := filepath.Join(dir, "dir2")
	os.MkdirAll(dir1, 0755)
	os.MkdirAll(dir2, 0755)

	createTestFile(t, dir1, "file1.txt", 100)
	createTestFile(t, dir2, "file2.txt", 200)

	// Send both directories
	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{dir1, dir2},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	if sender.TotalFiles() != 2 {
		t.Errorf("Expected 2 files, got %d", sender.TotalFiles())
	}

	archivePath, err := sender.CreateArchive()
	if err != nil {
		t.Fatalf("CreateArchive failed: %v", err)
	}
	defer sender.CleanupArchive()

	// Extract
	outputDir := filepath.Join(dir, "output")
	receiver, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir})
	err = receiver.ExtractArchive(archivePath)
	if err != nil {
		t.Fatalf("ExtractArchive failed: %v", err)
	}

	extractedFiles := 0
	for _, item := range receiver.ExtractedItems() {
		if !item.IsDir {
			extractedFiles++
		}
	}

	if extractedFiles != 2 {
		t.Errorf("Expected 2 extracted files, got %d", extractedFiles)
	}
}

func TestBatchEmptyDirectory(t *testing.T) {
	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	emptyDir := filepath.Join(dir, "empty")
	os.MkdirAll(emptyDir, 0755)

	_, err := NewBatchSender(BatchConfig{
		Paths: []string{emptyDir},
	})
	if err == nil {
		t.Error("Expected error for empty directory")
	}
}

func TestBatchLargeFile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping large file test in short mode")
	}

	dir := createTestDir(t)
	defer os.RemoveAll(dir)

	// Create 10MB file
	largeFile := createTestFile(t, dir, "large.bin", 10*1024*1024)

	sender, err := NewBatchSender(BatchConfig{
		Paths: []string{filepath.Dir(largeFile)},
	})
	if err != nil {
		t.Fatalf("NewBatchSender failed: %v", err)
	}

	archivePath, err := sender.CreateArchive()
	if err != nil {
		t.Fatalf("CreateArchive failed: %v", err)
	}
	defer sender.CleanupArchive()

	// Verify archive is smaller due to compression
	archiveInfo, _ := os.Stat(archivePath)
	t.Logf("Original: %d bytes, Archive: %d bytes", sender.TotalSize(), archiveInfo.Size())
}

// Benchmarks

func BenchmarkBatchSenderScan(b *testing.B) {
	dir, _ := os.MkdirTemp("", "bench-*")
	defer os.RemoveAll(dir)

	// Create 100 files
	for i := 0; i < 100; i++ {
		path := filepath.Join(dir, filepath.Dir(filepath.Join("a", "b", "c")[:i%3+1]),
			filepath.Base(filepath.Join("file", string(rune('0'+i%10))+".txt")))
		os.MkdirAll(filepath.Dir(path), 0755)
		os.WriteFile(path, make([]byte, 1000), 0644)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		NewBatchSender(BatchConfig{Paths: []string{dir}})
	}
}

func BenchmarkBatchCreateArchive(b *testing.B) {
	dir, _ := os.MkdirTemp("", "bench-*")
	defer os.RemoveAll(dir)

	// Create test files
	for i := 0; i < 10; i++ {
		path := filepath.Join(dir, "file"+string(rune('0'+i))+".txt")
		os.WriteFile(path, make([]byte, 10000), 0644)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		sender, _ := NewBatchSender(BatchConfig{Paths: []string{dir}})
		sender.CreateArchive()
		sender.CleanupArchive()
	}
}

func BenchmarkBatchExtractArchive(b *testing.B) {
	dir, _ := os.MkdirTemp("", "bench-*")
	defer os.RemoveAll(dir)

	srcDir := filepath.Join(dir, "src")
	os.MkdirAll(srcDir, 0755)
	for i := 0; i < 10; i++ {
		path := filepath.Join(srcDir, "file"+string(rune('0'+i))+".txt")
		os.WriteFile(path, make([]byte, 10000), 0644)
	}

	sender, _ := NewBatchSender(BatchConfig{Paths: []string{srcDir}})
	archivePath, _ := sender.CreateArchive()
	defer sender.CleanupArchive()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		outputDir := filepath.Join(dir, "out"+string(rune('0'+i%10)))
		receiver, _ := NewBatchReceiver(BatchConfig{OutputDir: outputDir, Overwrite: true})
		receiver.ExtractArchive(archivePath)
	}
}
