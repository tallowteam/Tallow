package network

import (
	"net"
	"sync"
	"testing"
	"time"
)

func TestListenAndDial(t *testing.T) {
	// Start listener
	listener, err := Listen(":0")
	if err != nil {
		t.Fatalf("Listen failed: %v", err)
	}
	defer listener.Close()

	if listener.Port() <= 0 {
		t.Error("Port should be positive")
	}

	// Accept connection in goroutine
	var serverConn *TCPConnection
	var acceptErr error
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, acceptErr = listener.Accept()
	}()

	// Connect
	addr := listener.Addr().String()
	clientConn, err := DialWithTimeout(addr, 5*time.Second)
	if err != nil {
		t.Fatalf("DialWithTimeout failed: %v", err)
	}
	defer clientConn.Close()

	wg.Wait()

	if acceptErr != nil {
		t.Fatalf("Accept failed: %v", acceptErr)
	}
	defer serverConn.Close()
}

func TestTCPConnectionReadWrite(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
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
		t.Errorf("Read data mismatch: got %q, want %q", buf[:n], testData)
	}
}

func TestTCPConnectionBidirectional(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
	defer clientConn.Close()
	wg.Wait()
	defer serverConn.Close()

	// Client -> Server
	clientConn.Write([]byte("ping"))
	buf := make([]byte, 10)
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

func TestTCPConnectionClose(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
	wg.Wait()

	// Close client
	clientConn.Close()

	// Server read should fail
	buf := make([]byte, 10)
	_, err := serverConn.Read(buf)
	if err == nil {
		t.Error("Expected error or EOF after client close")
	}

	serverConn.Close()
}

func TestTCPConnectionDeadlines(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
	defer clientConn.Close()
	wg.Wait()
	defer serverConn.Close()

	// Set short read deadline
	serverConn.SetReadDeadline(time.Now().Add(10 * time.Millisecond))

	// Read should timeout
	buf := make([]byte, 10)
	_, err := serverConn.Read(buf)
	if err == nil {
		t.Error("Expected timeout error")
	}

	// Check it's a timeout error
	if netErr, ok := err.(net.Error); ok {
		if !netErr.Timeout() {
			t.Error("Expected timeout error type")
		}
	}
}

func TestDialWithTimeoutInvalid(t *testing.T) {
	// Invalid address
	_, err := DialWithTimeout("invalid:99999", 100*time.Millisecond)
	if err == nil {
		t.Error("Expected error for invalid address")
	}
}

func TestDialWithTimeoutUnreachable(t *testing.T) {
	// Unreachable address (should timeout)
	_, err := DialWithTimeout("10.255.255.1:12345", 100*time.Millisecond)
	if err == nil {
		t.Error("Expected error for unreachable address")
	}
}

func TestListenerPort(t *testing.T) {
	listener, err := Listen(":0")
	if err != nil {
		t.Fatalf("Listen failed: %v", err)
	}
	defer listener.Close()

	port := listener.Port()
	if port <= 0 || port > 65535 {
		t.Errorf("Invalid port: %d", port)
	}
}

func TestListenerAddr(t *testing.T) {
	listener, err := Listen(":0")
	if err != nil {
		t.Fatalf("Listen failed: %v", err)
	}
	defer listener.Close()

	addr := listener.Addr()
	if addr == nil {
		t.Error("Addr() returned nil")
	}
}

func TestMultipleConnections(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	const numConns = 5
	var serverConns []*TCPConnection
	var clientConns []*TCPConnection
	var wg sync.WaitGroup

	// Accept goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < numConns; i++ {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			serverConns = append(serverConns, conn)
		}
	}()

	// Connect multiple clients
	for i := 0; i < numConns; i++ {
		conn, err := DialWithTimeout(listener.Addr().String(), 5*time.Second)
		if err != nil {
			t.Fatalf("Dial %d failed: %v", i, err)
		}
		clientConns = append(clientConns, conn)
	}

	wg.Wait()

	if len(serverConns) != numConns {
		t.Errorf("Server accepted %d connections, want %d", len(serverConns), numConns)
	}

	// Cleanup
	for _, c := range clientConns {
		c.Close()
	}
	for _, c := range serverConns {
		c.Close()
	}
}

func TestLargeDataTransfer(t *testing.T) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
	defer clientConn.Close()
	wg.Wait()
	defer serverConn.Close()

	// Send 1MB of data
	dataSize := 1024 * 1024
	data := make([]byte, dataSize)
	for i := range data {
		data[i] = byte(i % 256)
	}

	// Send in background
	wg.Add(1)
	go func() {
		defer wg.Done()
		clientConn.Write(data)
	}()

	// Receive
	received := make([]byte, 0, dataSize)
	buf := make([]byte, 32768)
	for len(received) < dataSize {
		n, err := serverConn.Read(buf)
		if err != nil {
			t.Fatalf("Read failed at %d bytes: %v", len(received), err)
		}
		received = append(received, buf[:n]...)
	}

	wg.Wait()

	if len(received) != dataSize {
		t.Errorf("Received %d bytes, want %d", len(received), dataSize)
	}

	// Verify data
	for i := 0; i < dataSize; i++ {
		if received[i] != byte(i%256) {
			t.Errorf("Data mismatch at byte %d", i)
			break
		}
	}
}

func BenchmarkTCPWrite(b *testing.B) {
	listener, _ := Listen(":0")
	defer listener.Close()

	var serverConn *TCPConnection
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		serverConn, _ = listener.Accept()
		// Drain data
		buf := make([]byte, 65536)
		for {
			_, err := serverConn.Read(buf)
			if err != nil {
				return
			}
		}
	}()

	clientConn, _ := DialWithTimeout(listener.Addr().String(), 5*time.Second)
	defer clientConn.Close()

	data := make([]byte, 1024)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		clientConn.Write(data)
	}
}
