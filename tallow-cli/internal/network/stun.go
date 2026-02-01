package network

import (
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"net"
	"time"
)

// STUN message types
const (
	stunMsgTypeBindingRequest  = 0x0001
	stunMsgTypeBindingResponse = 0x0101
	stunMsgTypeBindingError    = 0x0111
)

// STUN attribute types
const (
	stunAttrMappedAddress    = 0x0001
	stunAttrXORMappedAddress = 0x0020
)

// STUN magic cookie
const stunMagicCookie = 0x2112A442

// Default STUN servers
var DefaultSTUNServers = []string{
	"stun.l.google.com:19302",
	"stun1.l.google.com:19302",
	"stun2.l.google.com:19302",
	"stun.cloudflare.com:3478",
}

// NATType represents the type of NAT
type NATType int

const (
	NATTypeUnknown NATType = iota
	NATTypeNone            // No NAT (public IP)
	NATTypeFullCone
	NATTypeRestrictedCone
	NATTypePortRestricted
	NATTypeSymmetric
)

func (n NATType) String() string {
	switch n {
	case NATTypeNone:
		return "No NAT (Public IP)"
	case NATTypeFullCone:
		return "Full Cone NAT"
	case NATTypeRestrictedCone:
		return "Restricted Cone NAT"
	case NATTypePortRestricted:
		return "Port Restricted Cone NAT"
	case NATTypeSymmetric:
		return "Symmetric NAT"
	default:
		return "Unknown"
	}
}

// STUNResult contains the result of a STUN query
type STUNResult struct {
	PublicIP   string
	PublicPort int
	NATType    NATType
	LocalIP    string
	LocalPort  int
}

// STUNClient performs STUN queries
type STUNClient struct {
	servers []string
	timeout time.Duration
}

// NewSTUNClient creates a new STUN client
func NewSTUNClient(servers []string) *STUNClient {
	if len(servers) == 0 {
		servers = DefaultSTUNServers
	}
	return &STUNClient{
		servers: servers,
		timeout: 5 * time.Second,
	}
}

// GetPublicAddress queries STUN servers to get the public address
func (c *STUNClient) GetPublicAddress(ctx context.Context) (*STUNResult, error) {
	// Create UDP socket
	conn, err := net.ListenUDP("udp4", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create UDP socket: %w", err)
	}
	defer conn.Close()

	localAddr := conn.LocalAddr().(*net.UDPAddr)

	// Try each STUN server
	for _, server := range c.servers {
		result, err := c.queryServer(ctx, conn, server)
		if err == nil {
			result.LocalIP = localAddr.IP.String()
			result.LocalPort = localAddr.Port
			return result, nil
		}
	}

	return nil, errors.New("all STUN servers failed")
}

// queryServer queries a single STUN server
func (c *STUNClient) queryServer(ctx context.Context, conn *net.UDPConn, server string) (*STUNResult, error) {
	serverAddr, err := net.ResolveUDPAddr("udp4", server)
	if err != nil {
		return nil, err
	}

	// Build STUN binding request
	request := c.buildBindingRequest()

	// Set timeout
	deadline, ok := ctx.Deadline()
	if !ok {
		deadline = time.Now().Add(c.timeout)
	}
	conn.SetDeadline(deadline)

	// Send request
	if _, err := conn.WriteToUDP(request, serverAddr); err != nil {
		return nil, err
	}

	// Read response
	response := make([]byte, 1024)
	n, _, err := conn.ReadFromUDP(response)
	if err != nil {
		return nil, err
	}

	// Parse response
	return c.parseBindingResponse(response[:n])
}

// buildBindingRequest builds a STUN binding request
func (c *STUNClient) buildBindingRequest() []byte {
	// 20 bytes header
	request := make([]byte, 20)

	// Message type: Binding Request
	binary.BigEndian.PutUint16(request[0:2], stunMsgTypeBindingRequest)

	// Message length: 0 (no attributes)
	binary.BigEndian.PutUint16(request[2:4], 0)

	// Magic cookie
	binary.BigEndian.PutUint32(request[4:8], stunMagicCookie)

	// Transaction ID (96 bits)
	// Use current time for simplicity (not cryptographically random but sufficient for STUN)
	now := time.Now().UnixNano()
	binary.BigEndian.PutUint64(request[8:16], uint64(now))
	binary.BigEndian.PutUint32(request[16:20], uint32(now>>32))

	return request
}

// parseBindingResponse parses a STUN binding response
func (c *STUNClient) parseBindingResponse(data []byte) (*STUNResult, error) {
	if len(data) < 20 {
		return nil, errors.New("response too short")
	}

	// Check message type
	msgType := binary.BigEndian.Uint16(data[0:2])
	if msgType != stunMsgTypeBindingResponse {
		if msgType == stunMsgTypeBindingError {
			return nil, errors.New("STUN binding error")
		}
		return nil, errors.New("unexpected response type")
	}

	// Check magic cookie
	cookie := binary.BigEndian.Uint32(data[4:8])
	if cookie != stunMagicCookie {
		return nil, errors.New("invalid magic cookie")
	}

	// Parse attributes
	msgLen := binary.BigEndian.Uint16(data[2:4])
	if int(msgLen)+20 > len(data) {
		return nil, errors.New("invalid message length")
	}

	offset := 20
	for offset < 20+int(msgLen) {
		if offset+4 > len(data) {
			break
		}

		attrType := binary.BigEndian.Uint16(data[offset : offset+2])
		attrLen := binary.BigEndian.Uint16(data[offset+2 : offset+4])
		offset += 4

		if offset+int(attrLen) > len(data) {
			break
		}

		attrData := data[offset : offset+int(attrLen)]

		if attrType == stunAttrXORMappedAddress {
			return c.parseXORMappedAddress(attrData, data[4:8])
		} else if attrType == stunAttrMappedAddress {
			return c.parseMappedAddress(attrData)
		}

		// Align to 4 bytes
		offset += int(attrLen)
		if attrLen%4 != 0 {
			offset += 4 - int(attrLen%4)
		}
	}

	return nil, errors.New("no mapped address in response")
}

// parseXORMappedAddress parses an XOR-MAPPED-ADDRESS attribute
func (c *STUNClient) parseXORMappedAddress(data, transactionID []byte) (*STUNResult, error) {
	if len(data) < 8 {
		return nil, errors.New("invalid XOR-MAPPED-ADDRESS")
	}

	family := data[1]
	port := binary.BigEndian.Uint16(data[2:4]) ^ uint16(stunMagicCookie>>16)

	if family == 0x01 { // IPv4
		ip := make([]byte, 4)
		magicBytes := make([]byte, 4)
		binary.BigEndian.PutUint32(magicBytes, stunMagicCookie)
		for i := 0; i < 4; i++ {
			ip[i] = data[4+i] ^ magicBytes[i]
		}
		return &STUNResult{
			PublicIP:   net.IP(ip).String(),
			PublicPort: int(port),
		}, nil
	}

	return nil, errors.New("unsupported address family")
}

// parseMappedAddress parses a MAPPED-ADDRESS attribute
func (c *STUNClient) parseMappedAddress(data []byte) (*STUNResult, error) {
	if len(data) < 8 {
		return nil, errors.New("invalid MAPPED-ADDRESS")
	}

	family := data[1]
	port := binary.BigEndian.Uint16(data[2:4])

	if family == 0x01 { // IPv4
		ip := net.IP(data[4:8])
		return &STUNResult{
			PublicIP:   ip.String(),
			PublicPort: int(port),
		}, nil
	}

	return nil, errors.New("unsupported address family")
}

// DetectNATType performs NAT type detection (simplified)
func (c *STUNClient) DetectNATType(ctx context.Context) (*STUNResult, error) {
	result, err := c.GetPublicAddress(ctx)
	if err != nil {
		return nil, err
	}

	// Compare local and public IP
	localIP, err := GetLocalIP()
	if err != nil {
		result.NATType = NATTypeUnknown
		return result, nil
	}

	if localIP == result.PublicIP {
		result.NATType = NATTypeNone
	} else {
		// Simplified: assume port-restricted for now
		// Full NAT detection requires multiple STUN queries
		result.NATType = NATTypePortRestricted
	}

	return result, nil
}
