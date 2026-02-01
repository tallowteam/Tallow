// Package directory provides the relay directory client for onion routing.
package directory

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is a client for the relay directory service
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new directory client
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ListRelays retrieves all relays from the directory
func (c *Client) ListRelays(options *ListOptions) ([]RelayInfo, error) {
	url := c.baseURL + "/relays"
	if options != nil {
		url += options.ToQueryString()
	}

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to list relays: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("list relays failed: %s - %s", resp.Status, string(body))
	}

	var result struct {
		Relays []RelayInfo `json:"relays"`
		Count  int         `json:"count"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Relays, nil
}

// GetRelay retrieves a specific relay by ID
func (c *Client) GetRelay(relayID string) (*RelayInfo, error) {
	url := c.baseURL + "/relays/" + relayID

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get relay: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("relay not found: %s", relayID)
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("get relay failed: %s - %s", resp.Status, string(body))
	}

	var relay RelayInfo
	if err := json.NewDecoder(resp.Body).Decode(&relay); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &relay, nil
}

// GetRelayHealth retrieves health status for a specific relay
func (c *Client) GetRelayHealth(relayID string) (*RelayHealth, error) {
	url := c.baseURL + "/relays/" + relayID + "/health"

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get relay health: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("get relay health failed: %s - %s", resp.Status, string(body))
	}

	var health RelayHealth
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &health, nil
}

// Register registers a relay with the directory
func (c *Client) Register(info RelayInfo) error {
	url := c.baseURL + "/relays/register"

	data, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("failed to marshal relay info: %w", err)
	}

	resp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to register relay: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("register failed: %s - %s", resp.Status, string(body))
	}

	return nil
}

// Unregister removes a relay from the directory
func (c *Client) Unregister(relayID string) error {
	url := c.baseURL + "/relays/" + relayID

	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to unregister relay: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("unregister failed: %s - %s", resp.Status, string(body))
	}

	return nil
}

// SendHeartbeat sends a heartbeat update to the directory
func (c *Client) SendHeartbeat(relayID string, currentLoad float64, uptime int64) error {
	url := c.baseURL + "/relays/register"

	update := map[string]interface{}{
		"id":           relayID,
		"current_load": currentLoad,
		"uptime":       uptime,
	}

	data, err := json.Marshal(update)
	if err != nil {
		return fmt.Errorf("failed to marshal heartbeat: %w", err)
	}

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("heartbeat failed: %s - %s", resp.Status, string(body))
	}

	return nil
}

// StartHeartbeat starts periodic heartbeat updates
func (c *Client) StartHeartbeat(info RelayInfo, interval time.Duration, loadFunc func(float64)) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	startTime := time.Now()

	for range ticker.C {
		uptime := int64(time.Since(startTime).Seconds())
		currentLoad := 0.0 // TODO: Calculate actual load

		if err := c.SendHeartbeat(info.ID, currentLoad, uptime); err != nil {
			// Log error but continue
			continue
		}

		if loadFunc != nil {
			loadFunc(currentLoad)
		}
	}
}

// GetStats retrieves directory statistics
func (c *Client) GetStats() (*DirectoryStats, error) {
	url := c.baseURL + "/stats"

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get stats: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("get stats failed: %s - %s", resp.Status, string(body))
	}

	var stats DirectoryStats
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &stats, nil
}

// SelectRelaysForCircuit selects relays for building a circuit
func (c *Client) SelectRelaysForCircuit(hopCount int, preferEntry, preferExit string) ([]RelayInfo, error) {
	// Get all online relays
	relays, err := c.ListRelays(&ListOptions{
		OnlyOnline: true,
		MinTrust:   50.0,
	})
	if err != nil {
		return nil, err
	}

	// Categorize relays by mode
	entryRelays := make([]RelayInfo, 0)
	middleRelays := make([]RelayInfo, 0)
	exitRelays := make([]RelayInfo, 0)

	for _, relay := range relays {
		switch relay.Mode {
		case "entry":
			entryRelays = append(entryRelays, relay)
		case "middle":
			middleRelays = append(middleRelays, relay)
		case "exit":
			exitRelays = append(exitRelays, relay)
		}
	}

	// Validate we have enough relays
	if len(entryRelays) == 0 {
		return nil, fmt.Errorf("no entry relays available")
	}
	if hopCount > 2 && len(middleRelays) == 0 {
		return nil, fmt.Errorf("no middle relays available for %d-hop circuit", hopCount)
	}
	if len(exitRelays) == 0 {
		return nil, fmt.Errorf("no exit relays available")
	}

	// Select relays
	selected := make([]RelayInfo, 0, hopCount)

	// Entry relay
	entry := selectBestRelay(entryRelays, preferEntry)
	selected = append(selected, entry)

	// Middle relays (if hopCount > 2)
	for i := 0; i < hopCount-2; i++ {
		middle := selectRandomRelay(middleRelays, selected)
		if middle == nil {
			return nil, fmt.Errorf("not enough middle relays")
		}
		selected = append(selected, *middle)
	}

	// Exit relay
	exit := selectBestRelay(exitRelays, preferExit)
	selected = append(selected, exit)

	return selected, nil
}

// selectBestRelay selects the best relay, preferring a specific ID if provided
func selectBestRelay(relays []RelayInfo, preferID string) RelayInfo {
	if preferID != "" {
		for _, r := range relays {
			if r.ID == preferID {
				return r
			}
		}
	}

	// Select by highest trust score
	best := relays[0]
	for _, r := range relays[1:] {
		if r.TrustScore > best.TrustScore {
			best = r
		}
	}
	return best
}

// selectRandomRelay selects a random relay not already in the circuit
func selectRandomRelay(relays []RelayInfo, excluded []RelayInfo) *RelayInfo {
	excludedIDs := make(map[string]bool)
	for _, r := range excluded {
		excludedIDs[r.ID] = true
	}

	available := make([]RelayInfo, 0)
	for _, r := range relays {
		if !excludedIDs[r.ID] {
			available = append(available, r)
		}
	}

	if len(available) == 0 {
		return nil
	}

	// Simple selection - in production use crypto/rand
	return &available[0]
}

// ListOptions contains options for listing relays
type ListOptions struct {
	Mode       string
	OnlyOnline bool
	MinTrust   float64
}

// ToQueryString converts options to URL query string
func (o *ListOptions) ToQueryString() string {
	if o == nil {
		return ""
	}

	params := ""
	if o.Mode != "" {
		params += "?mode=" + o.Mode
	}
	if o.OnlyOnline {
		if params == "" {
			params = "?"
		} else {
			params += "&"
		}
		params += "online=true"
	}
	if o.MinTrust > 0 {
		if params == "" {
			params = "?"
		} else {
			params += "&"
		}
		params += fmt.Sprintf("min_trust=%.2f", o.MinTrust)
	}
	return params
}

// RelayHealth contains health information for a relay
type RelayHealth struct {
	ID          string    `json:"id"`
	Online      bool      `json:"online"`
	LastSeen    time.Time `json:"last_seen"`
	Uptime      int64     `json:"uptime"`
	CurrentLoad float64   `json:"current_load"`
}

// DirectoryStats contains statistics about the directory
type DirectoryStats struct {
	TotalRelays  int            `json:"total_relays"`
	OnlineRelays int            `json:"online_relays"`
	ByMode       map[string]int `json:"by_mode"`
	Uptime       float64        `json:"uptime"`
}
