package network

import (
	"context"
	"encoding/binary"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestDialWebSocketInvalidURL(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name string
		url  string
	}{
		{"empty", ""},
		{"no host", "ws://"},
		{"invalid scheme", "://invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := DialWebSocket(ctx, tt.url)
			if err == nil {
				t.Error("Expected error for invalid URL")
			}
		})
	}
}

func TestDialWebSocketUnreachable(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	_, err := DialWebSocket(ctx, "ws://10.255.255.1:12345")
	if err == nil {
		t.Error("Expected error for unreachable server")
	}
}

func TestWebSocketServerAndConnection(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	// Convert HTTP URL to WebSocket URL
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()

	if serverConn == nil {
		t.Fatal("Server did not receive connection")
	}
	defer serverConn.Close()
}

func TestWebSocketConnectionReadWrite(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Write from client
	testData := []byte("hello from client")
	n, err := clientConn.Write(testData)
	if err != nil {
		t.Fatalf("Write failed: %v", err)
	}
	if n != len(testData) {
		t.Errorf("Write n = %d, want %d", n, len(testData))
	}

	// Read on server
	buf := make([]byte, 100)
	n, err = serverConn.Read(buf)
	if err != nil {
		t.Fatalf("Read failed: %v", err)
	}
	if string(buf[:n]) != string(testData) {
		t.Errorf("Data mismatch: got %q, want %q", buf[:n], testData)
	}
}

func TestWebSocketConnectionBidirectional(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Client -> Server
	clientConn.Write([]byte("ping"))
	buf := make([]byte, 100)
	n, _ := serverConn.Read(buf)
	if string(buf[:n]) != "ping" {
		t.Error("Client->Server message failed")
	}

	// Server -> Client
	serverConn.Write([]byte("pong"))
	n, _ = clientConn.Read(buf)
	if string(buf[:n]) != "pong" {
		t.Error("Server->Client message failed")
	}
}

func TestWebSocketConnectionClose(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}

	wg.Wait()

	// Close client
	clientConn.Close()

	// Double close should not panic
	clientConn.Close()

	// Write after close should fail
	_, err = clientConn.Write([]byte("test"))
	if err != ErrWebSocketClosed {
		t.Errorf("Expected ErrWebSocketClosed, got %v", err)
	}

	// Read after close should fail
	buf := make([]byte, 10)
	_, err = clientConn.Read(buf)
	if err != ErrWebSocketClosed {
		t.Errorf("Expected ErrWebSocketClosed, got %v", err)
	}

	serverConn.Close()
}

func TestWebSocketConnectionDeadlines(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Test SetDeadline
	err = clientConn.SetDeadline(time.Now().Add(time.Minute))
	if err != nil {
		t.Errorf("SetDeadline failed: %v", err)
	}

	// Test SetReadDeadline
	err = clientConn.SetReadDeadline(time.Now().Add(time.Minute))
	if err != nil {
		t.Errorf("SetReadDeadline failed: %v", err)
	}

	// Test SetWriteDeadline
	err = clientConn.SetWriteDeadline(time.Now().Add(time.Minute))
	if err != nil {
		t.Errorf("SetWriteDeadline failed: %v", err)
	}
}

func TestWebSocketConnectionPing(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Ping should not error
	err = clientConn.Ping()
	if err != nil {
		t.Errorf("Ping failed: %v", err)
	}
}

func TestWebSocketURLSchemeConversion(t *testing.T) {
	// This tests the URL scheme conversion in DialWebSocket
	// We can't fully test without a server, but we can verify error messages
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	tests := []string{
		"http://10.255.255.1:12345",  // Should become ws://
		"https://10.255.255.1:12345", // Should become wss://
		"ftp://10.255.255.1:12345",   // Should become wss:// (default)
	}

	for _, url := range tests {
		_, err := DialWebSocket(ctx, url)
		// All should fail due to unreachable, but URL parsing should succeed
		if err == nil {
			t.Errorf("Expected error for %s", url)
		}
		// Should not be a URL parsing error
		if strings.Contains(err.Error(), "invalid URL") {
			t.Errorf("Unexpected URL parsing error for %s: %v", url, err)
		}
	}
}

func TestWebSocketFrameWriter(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Create frame writer
	writer := NewWebSocketFrameWriter(clientConn)
	if writer == nil {
		t.Fatal("NewWebSocketFrameWriter returned nil")
	}

	// Write a frame
	testData := []byte("framed data")
	err = writer.WriteFrame(testData)
	if err != nil {
		t.Fatalf("WriteFrame failed: %v", err)
	}

	// Read on server (length prefix + data)
	buf := make([]byte, 100)
	n, _ := serverConn.Read(buf)

	// First 4 bytes should be length
	if n < 4 {
		t.Fatal("Not enough data received")
	}
	length := binary.BigEndian.Uint32(buf[:4])
	if int(length) != len(testData) {
		t.Errorf("Length prefix = %d, want %d", length, len(testData))
	}
}

func TestWebSocketFrameReader(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Create frame reader on client
	reader := NewWebSocketFrameReader(clientConn)
	if reader == nil {
		t.Fatal("NewWebSocketFrameReader returned nil")
	}

	// Write framed data from server
	testData := []byte("test frame data")
	lengthBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(lengthBuf, uint32(len(testData)))
	serverConn.Write(lengthBuf)
	serverConn.Write(testData)

	// Read frame on client
	data, err := reader.ReadFrame()
	if err != nil {
		t.Fatalf("ReadFrame failed: %v", err)
	}

	if string(data) != string(testData) {
		t.Errorf("Data mismatch: got %q, want %q", data, testData)
	}
}

func TestWebSocketFrameReaderLargeFrame(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	reader := NewWebSocketFrameReader(clientConn)

	// Try to send a frame that exceeds the 10MB limit
	lengthBuf := make([]byte, 4)
	binary.BigEndian.PutUint32(lengthBuf, 11*1024*1024) // 11 MB
	serverConn.Write(lengthBuf)

	_, err = reader.ReadFrame()
	if err == nil {
		t.Error("Expected error for oversized frame")
	}
	if !strings.Contains(err.Error(), "too large") {
		t.Errorf("Expected 'too large' error, got: %v", err)
	}
}

func TestNewWebSocketServer(t *testing.T) {
	called := false
	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		called = true
		conn.Close()
	})

	if server == nil {
		t.Fatal("NewWebSocketServer returned nil")
	}

	ts := httptest.NewServer(server)
	defer ts.Close()

	// Connect
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")
	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Dial failed: %v", err)
	}
	conn.Close()

	time.Sleep(50 * time.Millisecond)
	if !called {
		t.Error("Handler was not called")
	}
}

func TestWebSocketServerUpgradeFail(t *testing.T) {
	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		conn.Close()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	// Make a regular HTTP request (not WebSocket)
	resp, err := http.Get(ts.URL)
	if err != nil {
		t.Fatalf("GET failed: %v", err)
	}
	defer resp.Body.Close()

	// Should fail upgrade
	if resp.StatusCode == http.StatusSwitchingProtocols {
		t.Error("Expected non-upgrade status")
	}
}

func TestWebSocketConnectionConcurrency(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Concurrent writes should not panic
	var writeWg sync.WaitGroup
	for i := 0; i < 10; i++ {
		writeWg.Add(1)
		go func(i int) {
			defer writeWg.Done()
			clientConn.Write([]byte("concurrent write"))
		}(i)
	}
	writeWg.Wait()
}

func TestWebSocketConnectionBufferedRead(t *testing.T) {
	var serverConn *WebSocketConnection
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		serverConn = conn
		wg.Done()
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, err := DialWebSocket(ctx, wsURL)
	if err != nil {
		t.Fatalf("DialWebSocket failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()
	defer serverConn.Close()

	// Send a larger message
	testData := []byte("this is a longer message that will be read in chunks")
	serverConn.Write(testData)

	// Read in small chunks
	var received []byte
	buf := make([]byte, 10)
	for len(received) < len(testData) {
		n, err := clientConn.Read(buf)
		if err != nil {
			t.Fatalf("Read failed at %d bytes: %v", len(received), err)
		}
		received = append(received, buf[:n]...)
	}

	if string(received) != string(testData) {
		t.Errorf("Data mismatch: got %q, want %q", received, testData)
	}
}

func BenchmarkWebSocketWrite(b *testing.B) {
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		wg.Done()
		// Drain data
		buf := make([]byte, 65536)
		for {
			_, err := conn.Read(buf)
			if err != nil {
				return
			}
		}
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, _ := DialWebSocket(ctx, wsURL)
	defer clientConn.Close()

	wg.Wait()

	data := make([]byte, 1024)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		clientConn.Write(data)
	}
}

func BenchmarkWebSocketFrameWrite(b *testing.B) {
	var wg sync.WaitGroup
	wg.Add(1)

	server := NewWebSocketServer(func(conn *WebSocketConnection) {
		wg.Done()
		// Drain data
		buf := make([]byte, 65536)
		for {
			_, err := conn.Read(buf)
			if err != nil {
				return
			}
		}
	})

	ts := httptest.NewServer(server)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx := context.Background()
	clientConn, _ := DialWebSocket(ctx, wsURL)
	defer clientConn.Close()

	wg.Wait()

	writer := NewWebSocketFrameWriter(clientConn)
	data := make([]byte, 1024)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		writer.WriteFrame(data)
	}
}
