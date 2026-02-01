package discovery

import (
	"fmt"
	"os"

	"github.com/grandcat/zeroconf"
)

// Advertiser advertises a tallow service via mDNS
type Advertiser struct {
	server   *zeroconf.Server
	port     int
	roomCode string
}

// NewAdvertiser creates a new Advertiser
func NewAdvertiser(port int, roomCode string) *Advertiser {
	return &Advertiser{
		port:     port,
		roomCode: roomCode,
	}
}

// Start starts advertising the service
func (a *Advertiser) Start() error {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "tallow"
	}

	// Instance name includes room code for easy identification
	instanceName := fmt.Sprintf("tallow-%s", a.roomCode)

	// TXT records
	txt := []string{
		fmt.Sprintf("room=%s", a.roomCode),
		"version=1",
	}

	server, err := zeroconf.Register(
		instanceName,       // Instance name
		ServiceType,        // Service type
		ServiceDomain,      // Domain
		a.port,             // Port
		txt,                // TXT records
		nil,                // Interfaces (nil = all)
	)
	if err != nil {
		return fmt.Errorf("failed to register service: %w", err)
	}

	a.server = server

	fmt.Printf("Advertising service: %s on port %d (hostname: %s)\n", instanceName, a.port, hostname)

	return nil
}

// Stop stops advertising
func (a *Advertiser) Stop() {
	if a.server != nil {
		a.server.Shutdown()
		a.server = nil
	}
}

// UpdateRoom updates the room code
func (a *Advertiser) UpdateRoom(roomCode string) error {
	a.Stop()
	a.roomCode = roomCode
	return a.Start()
}

// Port returns the advertised port
func (a *Advertiser) Port() int {
	return a.port
}

// RoomCode returns the advertised room code
func (a *Advertiser) RoomCode() string {
	return a.roomCode
}

// AdvertiserConfig holds advertiser configuration
type AdvertiserConfig struct {
	Port     int
	RoomCode string
	Name     string
	Version  string
}

// NewAdvertiserWithConfig creates an advertiser with full configuration
func NewAdvertiserWithConfig(config AdvertiserConfig) (*Advertiser, error) {
	adv := &Advertiser{
		port:     config.Port,
		roomCode: config.RoomCode,
	}

	if err := adv.Start(); err != nil {
		return nil, err
	}

	return adv, nil
}
