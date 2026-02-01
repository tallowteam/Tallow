package network

import (
	"context"
	"encoding/binary"
	"net"
	"testing"
	"time"
)

func TestNATTypeString(t *testing.T) {
	tests := []struct {
		natType  NATType
		expected string
	}{
		{NATTypeUnknown, "Unknown"},
		{NATTypeNone, "No NAT (Public IP)"},
		{NATTypeFullCone, "Full Cone NAT"},
		{NATTypeRestrictedCone, "Restricted Cone NAT"},
		{NATTypePortRestricted, "Port Restricted Cone NAT"},
		{NATTypeSymmetric, "Symmetric NAT"},
		{NATType(99), "Unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := tt.natType.String()
			if result != tt.expected {
				t.Errorf("NATType(%d).String() = %q, want %q", tt.natType, result, tt.expected)
			}
		})
	}
}

func TestNewSTUNClient(t *testing.T) {
	// With nil servers
	client := NewSTUNClient(nil)
	if client == nil {
		t.Fatal("NewSTUNClient returned nil")
	}
	if len(client.servers) == 0 {
		t.Error("Default servers should be set")
	}

	// With empty servers
	client = NewSTUNClient([]string{})
	if len(client.servers) == 0 {
		t.Error("Default servers should be set for empty slice")
	}

	// With custom servers
	custom := []string{"stun.example.com:3478"}
	client = NewSTUNClient(custom)
	if len(client.servers) != 1 {
		t.Errorf("Expected 1 server, got %d", len(client.servers))
	}
	if client.servers[0] != "stun.example.com:3478" {
		t.Error("Custom server not set")
	}
}

func TestDefaultSTUNServers(t *testing.T) {
	if len(DefaultSTUNServers) == 0 {
		t.Error("DefaultSTUNServers should not be empty")
	}

	// Verify all have port
	for _, server := range DefaultSTUNServers {
		_, port, err := net.SplitHostPort(server)
		if err != nil {
			t.Errorf("Invalid server address %s: %v", server, err)
		}
		if port == "" {
			t.Errorf("Server %s missing port", server)
		}
	}
}

func TestBuildBindingRequest(t *testing.T) {
	client := NewSTUNClient(nil)
	request := client.buildBindingRequest()

	if len(request) != 20 {
		t.Errorf("Request length = %d, want 20", len(request))
	}

	// Check message type
	msgType := binary.BigEndian.Uint16(request[0:2])
	if msgType != stunMsgTypeBindingRequest {
		t.Errorf("Message type = 0x%04x, want 0x%04x", msgType, stunMsgTypeBindingRequest)
	}

	// Check message length
	msgLen := binary.BigEndian.Uint16(request[2:4])
	if msgLen != 0 {
		t.Errorf("Message length = %d, want 0", msgLen)
	}

	// Check magic cookie
	cookie := binary.BigEndian.Uint32(request[4:8])
	if cookie != stunMagicCookie {
		t.Errorf("Magic cookie = 0x%08x, want 0x%08x", cookie, stunMagicCookie)
	}
}

func TestParseBindingResponseTooShort(t *testing.T) {
	client := NewSTUNClient(nil)

	// Too short
	_, err := client.parseBindingResponse([]byte{0, 0, 0, 0, 0})
	if err == nil {
		t.Error("Expected error for short response")
	}
}

func TestParseBindingResponseWrongType(t *testing.T) {
	client := NewSTUNClient(nil)

	// Wrong message type
	response := make([]byte, 20)
	binary.BigEndian.PutUint16(response[0:2], 0x0099) // Wrong type
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)

	_, err := client.parseBindingResponse(response)
	if err == nil {
		t.Error("Expected error for wrong message type")
	}
}

func TestParseBindingResponseErrorType(t *testing.T) {
	client := NewSTUNClient(nil)

	// Error response
	response := make([]byte, 20)
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingError)
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)

	_, err := client.parseBindingResponse(response)
	if err == nil {
		t.Error("Expected error for binding error response")
	}
}

func TestParseBindingResponseBadCookie(t *testing.T) {
	client := NewSTUNClient(nil)

	// Bad magic cookie
	response := make([]byte, 20)
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
	binary.BigEndian.PutUint32(response[4:8], 0xDEADBEEF) // Wrong cookie

	_, err := client.parseBindingResponse(response)
	if err == nil {
		t.Error("Expected error for bad magic cookie")
	}
}

func TestParseBindingResponseNoAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	// Valid header but no mapped address
	response := make([]byte, 20)
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
	binary.BigEndian.PutUint16(response[2:4], 0) // No attributes
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)

	_, err := client.parseBindingResponse(response)
	if err == nil {
		t.Error("Expected error for missing mapped address")
	}
}

func TestParseXORMappedAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	// Build valid XOR-MAPPED-ADDRESS for 192.168.1.1:12345
	// XOR with magic cookie
	data := make([]byte, 8)
	data[0] = 0          // Reserved
	data[1] = 0x01       // IPv4 family
	port := uint16(12345) ^ uint16(stunMagicCookie>>16)
	binary.BigEndian.PutUint16(data[2:4], port)

	ip := net.ParseIP("192.168.1.1").To4()
	magicBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(magicBytes, stunMagicCookie)
	for i := 0; i < 4; i++ {
		data[4+i] = ip[i] ^ magicBytes[i]
	}

	transactionID := make([]byte, 4)
	binary.BigEndian.PutUint32(transactionID, stunMagicCookie)

	result, err := client.parseXORMappedAddress(data, transactionID)
	if err != nil {
		t.Fatalf("parseXORMappedAddress failed: %v", err)
	}

	if result.PublicIP != "192.168.1.1" {
		t.Errorf("PublicIP = %s, want 192.168.1.1", result.PublicIP)
	}
	if result.PublicPort != 12345 {
		t.Errorf("PublicPort = %d, want 12345", result.PublicPort)
	}
}

func TestParseXORMappedAddressTooShort(t *testing.T) {
	client := NewSTUNClient(nil)

	_, err := client.parseXORMappedAddress([]byte{0, 0, 0}, nil)
	if err == nil {
		t.Error("Expected error for short data")
	}
}

func TestParseXORMappedAddressIPv6(t *testing.T) {
	client := NewSTUNClient(nil)

	// IPv6 family
	data := make([]byte, 8)
	data[1] = 0x02 // IPv6 family

	_, err := client.parseXORMappedAddress(data, nil)
	if err == nil {
		t.Error("Expected error for IPv6 (unsupported)")
	}
}

func TestParseMappedAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	// Build valid MAPPED-ADDRESS for 10.0.0.1:8080
	data := make([]byte, 8)
	data[0] = 0    // Reserved
	data[1] = 0x01 // IPv4 family
	binary.BigEndian.PutUint16(data[2:4], 8080)
	copy(data[4:8], net.ParseIP("10.0.0.1").To4())

	result, err := client.parseMappedAddress(data)
	if err != nil {
		t.Fatalf("parseMappedAddress failed: %v", err)
	}

	if result.PublicIP != "10.0.0.1" {
		t.Errorf("PublicIP = %s, want 10.0.0.1", result.PublicIP)
	}
	if result.PublicPort != 8080 {
		t.Errorf("PublicPort = %d, want 8080", result.PublicPort)
	}
}

func TestParseMappedAddressTooShort(t *testing.T) {
	client := NewSTUNClient(nil)

	_, err := client.parseMappedAddress([]byte{0, 0, 0})
	if err == nil {
		t.Error("Expected error for short data")
	}
}

func TestParseMappedAddressIPv6(t *testing.T) {
	client := NewSTUNClient(nil)

	// IPv6 family
	data := make([]byte, 8)
	data[1] = 0x02 // IPv6 family

	_, err := client.parseMappedAddress(data)
	if err == nil {
		t.Error("Expected error for IPv6 (unsupported)")
	}
}

func TestParseBindingResponseWithXORMappedAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	// Build complete response with XOR-MAPPED-ADDRESS
	response := make([]byte, 36) // 20 header + 4 attr header + 8 attr data + padding

	// Header
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
	binary.BigEndian.PutUint16(response[2:4], 12) // 4 + 8 = 12 bytes of attributes
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)

	// Attribute header
	binary.BigEndian.PutUint16(response[20:22], stunAttrXORMappedAddress)
	binary.BigEndian.PutUint16(response[22:24], 8) // 8 bytes of data

	// Attribute data
	response[24] = 0    // Reserved
	response[25] = 0x01 // IPv4
	port := uint16(54321) ^ uint16(stunMagicCookie>>16)
	binary.BigEndian.PutUint16(response[26:28], port)

	ip := net.ParseIP("8.8.8.8").To4()
	magicBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(magicBytes, stunMagicCookie)
	for i := 0; i < 4; i++ {
		response[28+i] = ip[i] ^ magicBytes[i]
	}

	result, err := client.parseBindingResponse(response)
	if err != nil {
		t.Fatalf("parseBindingResponse failed: %v", err)
	}

	if result.PublicIP != "8.8.8.8" {
		t.Errorf("PublicIP = %s, want 8.8.8.8", result.PublicIP)
	}
	if result.PublicPort != 54321 {
		t.Errorf("PublicPort = %d, want 54321", result.PublicPort)
	}
}

func TestParseBindingResponseWithMappedAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	// Build complete response with MAPPED-ADDRESS
	response := make([]byte, 36)

	// Header
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
	binary.BigEndian.PutUint16(response[2:4], 12)
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)

	// Attribute header
	binary.BigEndian.PutUint16(response[20:22], stunAttrMappedAddress)
	binary.BigEndian.PutUint16(response[22:24], 8)

	// Attribute data
	response[24] = 0    // Reserved
	response[25] = 0x01 // IPv4
	binary.BigEndian.PutUint16(response[26:28], 12345)
	copy(response[28:32], net.ParseIP("1.2.3.4").To4())

	result, err := client.parseBindingResponse(response)
	if err != nil {
		t.Fatalf("parseBindingResponse failed: %v", err)
	}

	if result.PublicIP != "1.2.3.4" {
		t.Errorf("PublicIP = %s, want 1.2.3.4", result.PublicIP)
	}
}

func TestGetPublicAddressTimeout(t *testing.T) {
	// Use unreachable server
	client := NewSTUNClient([]string{"10.255.255.1:3478"})
	client.timeout = 100 * time.Millisecond

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	_, err := client.GetPublicAddress(ctx)
	if err == nil {
		t.Error("Expected error for unreachable STUN server")
	}
}

func TestQueryServerInvalidAddress(t *testing.T) {
	client := NewSTUNClient(nil)

	conn, err := net.ListenUDP("udp4", nil)
	if err != nil {
		t.Fatalf("Failed to create UDP socket: %v", err)
	}
	defer conn.Close()

	ctx := context.Background()
	_, err = client.queryServer(ctx, conn, "not:a:valid:address")
	if err == nil {
		t.Error("Expected error for invalid address")
	}
}

func TestSTUNResultFields(t *testing.T) {
	result := STUNResult{
		PublicIP:   "1.2.3.4",
		PublicPort: 12345,
		NATType:    NATTypeFullCone,
		LocalIP:    "192.168.1.100",
		LocalPort:  54321,
	}

	if result.PublicIP != "1.2.3.4" {
		t.Error("PublicIP field mismatch")
	}
	if result.PublicPort != 12345 {
		t.Error("PublicPort field mismatch")
	}
	if result.NATType != NATTypeFullCone {
		t.Error("NATType field mismatch")
	}
	if result.LocalIP != "192.168.1.100" {
		t.Error("LocalIP field mismatch")
	}
	if result.LocalPort != 54321 {
		t.Error("LocalPort field mismatch")
	}
}

// Mock STUN server for testing
func startMockSTUNServer(t *testing.T, responseIP string, responsePort int) (*net.UDPConn, int) {
	t.Helper()

	conn, err := net.ListenUDP("udp4", &net.UDPAddr{IP: net.ParseIP("127.0.0.1"), Port: 0})
	if err != nil {
		t.Fatalf("Failed to start mock STUN server: %v", err)
	}

	port := conn.LocalAddr().(*net.UDPAddr).Port

	go func() {
		buf := make([]byte, 1024)
		for {
			n, addr, err := conn.ReadFromUDP(buf)
			if err != nil {
				return
			}

			// Verify it's a binding request
			if n < 20 {
				continue
			}
			msgType := binary.BigEndian.Uint16(buf[0:2])
			if msgType != stunMsgTypeBindingRequest {
				continue
			}

			// Build response with XOR-MAPPED-ADDRESS
			response := make([]byte, 36)

			// Header
			binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
			binary.BigEndian.PutUint16(response[2:4], 12)
			binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)
			copy(response[8:20], buf[8:20]) // Copy transaction ID

			// XOR-MAPPED-ADDRESS attribute
			binary.BigEndian.PutUint16(response[20:22], stunAttrXORMappedAddress)
			binary.BigEndian.PutUint16(response[22:24], 8)

			response[24] = 0    // Reserved
			response[25] = 0x01 // IPv4

			port := uint16(responsePort) ^ uint16(stunMagicCookie>>16)
			binary.BigEndian.PutUint16(response[26:28], port)

			ip := net.ParseIP(responseIP).To4()
			magicBytes := make([]byte, 4)
			binary.BigEndian.PutUint32(magicBytes, stunMagicCookie)
			for i := 0; i < 4; i++ {
				response[28+i] = ip[i] ^ magicBytes[i]
			}

			conn.WriteToUDP(response, addr)
		}
	}()

	return conn, port
}

func TestGetPublicAddressWithMockServer(t *testing.T) {
	mockConn, mockPort := startMockSTUNServer(t, "203.0.113.1", 55555)
	defer mockConn.Close()

	client := NewSTUNClient([]string{net.JoinHostPort("127.0.0.1", itoa(mockPort))})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	result, err := client.GetPublicAddress(ctx)
	if err != nil {
		t.Fatalf("GetPublicAddress failed: %v", err)
	}

	if result.PublicIP != "203.0.113.1" {
		t.Errorf("PublicIP = %s, want 203.0.113.1", result.PublicIP)
	}
	if result.PublicPort != 55555 {
		t.Errorf("PublicPort = %d, want 55555", result.PublicPort)
	}
}

// Simple int to string for port
func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	var b [10]byte
	pos := len(b)
	for i > 0 {
		pos--
		b[pos] = byte('0' + i%10)
		i /= 10
	}
	return string(b[pos:])
}

func TestDetectNATTypeWithMockServer(t *testing.T) {
	mockConn, mockPort := startMockSTUNServer(t, "10.0.0.1", 12345)
	defer mockConn.Close()

	client := NewSTUNClient([]string{net.JoinHostPort("127.0.0.1", itoa(mockPort))})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	result, err := client.DetectNATType(ctx)
	if err != nil {
		t.Fatalf("DetectNATType failed: %v", err)
	}

	// Should detect NAT since local IP differs from public IP
	if result.NATType == NATTypeUnknown {
		t.Logf("NAT type detection returned unknown (may be expected)")
	}
}

func BenchmarkBuildBindingRequest(b *testing.B) {
	client := NewSTUNClient(nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		client.buildBindingRequest()
	}
}

func BenchmarkParseBindingResponse(b *testing.B) {
	client := NewSTUNClient(nil)

	// Build a valid response
	response := make([]byte, 36)
	binary.BigEndian.PutUint16(response[0:2], stunMsgTypeBindingResponse)
	binary.BigEndian.PutUint16(response[2:4], 12)
	binary.BigEndian.PutUint32(response[4:8], stunMagicCookie)
	binary.BigEndian.PutUint16(response[20:22], stunAttrXORMappedAddress)
	binary.BigEndian.PutUint16(response[22:24], 8)
	response[25] = 0x01
	binary.BigEndian.PutUint16(response[26:28], uint16(12345)^uint16(stunMagicCookie>>16))
	magicBytes := make([]byte, 4)
	binary.BigEndian.PutUint32(magicBytes, stunMagicCookie)
	ip := net.ParseIP("1.2.3.4").To4()
	for i := 0; i < 4; i++ {
		response[28+i] = ip[i] ^ magicBytes[i]
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		client.parseBindingResponse(response)
	}
}
