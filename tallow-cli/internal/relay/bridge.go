package relay

import (
	"context"
	"io"
	"sync"
	"time"
)

// Bridge provides bidirectional data forwarding between two connections
type Bridge struct {
	clientA    io.ReadWriteCloser
	clientB    io.ReadWriteCloser
	bufferSize int
	timeout    time.Duration
	ctx        context.Context
	cancel     context.CancelFunc
	wg         sync.WaitGroup
	closed     bool
	closedMu   sync.Mutex
	bytesA2B   int64
	bytesB2A   int64
	bytesMu    sync.Mutex
	onComplete func(a2b, b2a int64)
}

// BridgeConfig configures a bridge
type BridgeConfig struct {
	BufferSize int
	Timeout    time.Duration
	OnComplete func(a2b, b2a int64)
}

// DefaultBridgeConfig returns default configuration
func DefaultBridgeConfig() BridgeConfig {
	return BridgeConfig{
		BufferSize: 65536, // 64KB
		Timeout:    30 * time.Minute,
	}
}

// NewBridge creates a new Bridge
func NewBridge(a, b io.ReadWriteCloser, config BridgeConfig) *Bridge {
	if config.BufferSize <= 0 {
		config.BufferSize = 65536
	}
	if config.Timeout <= 0 {
		config.Timeout = 30 * time.Minute
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Bridge{
		clientA:    a,
		clientB:    b,
		bufferSize: config.BufferSize,
		timeout:    config.Timeout,
		ctx:        ctx,
		cancel:     cancel,
		onComplete: config.OnComplete,
	}
}

// Start starts the bidirectional forwarding
func (b *Bridge) Start() {
	b.wg.Add(2)

	// A -> B
	go func() {
		defer b.wg.Done()
		bytes := b.forward(b.clientA, b.clientB)
		b.bytesMu.Lock()
		b.bytesA2B = bytes
		b.bytesMu.Unlock()
	}()

	// B -> A
	go func() {
		defer b.wg.Done()
		bytes := b.forward(b.clientB, b.clientA)
		b.bytesMu.Lock()
		b.bytesB2A = bytes
		b.bytesMu.Unlock()
	}()
}

// Wait waits for the bridge to complete
func (b *Bridge) Wait() {
	b.wg.Wait()

	b.closedMu.Lock()
	b.closed = true
	b.closedMu.Unlock()

	if b.onComplete != nil {
		b.bytesMu.Lock()
		a2b := b.bytesA2B
		b2a := b.bytesB2A
		b.bytesMu.Unlock()
		b.onComplete(a2b, b2a)
	}
}

// forward copies data from src to dst
func (b *Bridge) forward(src io.Reader, dst io.Writer) int64 {
	buf := make([]byte, b.bufferSize)
	var total int64

	for {
		select {
		case <-b.ctx.Done():
			return total
		default:
		}

		n, err := src.Read(buf)
		if n > 0 {
			written, writeErr := dst.Write(buf[:n])
			total += int64(written)
			if writeErr != nil {
				b.Close()
				return total
			}
		}

		if err != nil {
			if err != io.EOF {
				b.Close()
			}
			return total
		}
	}
}

// Close closes the bridge
func (b *Bridge) Close() {
	b.closedMu.Lock()
	if b.closed {
		b.closedMu.Unlock()
		return
	}
	b.closed = true
	b.closedMu.Unlock()

	b.cancel()
	b.clientA.Close()
	b.clientB.Close()
}

// IsClosed returns true if the bridge is closed
func (b *Bridge) IsClosed() bool {
	b.closedMu.Lock()
	defer b.closedMu.Unlock()
	return b.closed
}

// Stats returns the bytes transferred in each direction
func (b *Bridge) Stats() (a2b, b2a int64) {
	b.bytesMu.Lock()
	defer b.bytesMu.Unlock()
	return b.bytesA2B, b.bytesB2A
}

// BridgeWithContext creates and starts a bridge with context
func BridgeWithContext(ctx context.Context, a, b io.ReadWriteCloser, bufSize int) *Bridge {
	bridgeCtx, cancel := context.WithCancel(ctx)

	bridge := &Bridge{
		clientA:    a,
		clientB:    b,
		bufferSize: bufSize,
		ctx:        bridgeCtx,
		cancel:     cancel,
	}

	// Start forwarding
	bridge.Start()

	// Cancel on context done
	go func() {
		<-ctx.Done()
		bridge.Close()
	}()

	return bridge
}

// SimpleBridge is a simple one-shot bridge
func SimpleBridge(a, b io.ReadWriteCloser) error {
	bridge := NewBridge(a, b, DefaultBridgeConfig())
	bridge.Start()
	bridge.Wait()
	return nil
}

// BridgePool manages a pool of bridges
type BridgePool struct {
	bridges  map[string]*Bridge
	mu       sync.RWMutex
}

// NewBridgePool creates a new bridge pool
func NewBridgePool() *BridgePool {
	return &BridgePool{
		bridges: make(map[string]*Bridge),
	}
}

// Add adds a bridge to the pool
func (p *BridgePool) Add(id string, bridge *Bridge) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.bridges[id] = bridge
}

// Remove removes a bridge from the pool
func (p *BridgePool) Remove(id string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if bridge, exists := p.bridges[id]; exists {
		bridge.Close()
		delete(p.bridges, id)
	}
}

// Get gets a bridge by ID
func (p *BridgePool) Get(id string) *Bridge {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.bridges[id]
}

// Count returns the number of active bridges
func (p *BridgePool) Count() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return len(p.bridges)
}

// CloseAll closes all bridges
func (p *BridgePool) CloseAll() {
	p.mu.Lock()
	defer p.mu.Unlock()

	for id, bridge := range p.bridges {
		bridge.Close()
		delete(p.bridges, id)
	}
}
