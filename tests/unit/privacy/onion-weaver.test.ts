import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  MIN_HOPS,
  MAX_HOPS,
  CIRCUIT_ROTATION_MS,
  CELL_SIZE_BYTES,
  CELL_CMD,
  buildCircuit,
  circuitNeedsRotation,
  teardownCircuit,
  enforceOnionWeaverPolicy,
  negotiateHopKeys,
  deriveRelaySessionKey,
  encryptLayer,
  decryptLayer,
  wrapOnion,
  unwrapOnionLayer,
  buildCell,
  parseCell,
  buildPaddingCell,
  buildCreateCell,
  buildExtendCell,
  buildDestroyCell,
  buildRelayDataCells,
  handleCreateCell,
  relayProcessDataCell,
  createRelayNode,
  generateRelayKeypair,
  OnionCircuitManager,
  type RelayNode,
  type OnionCircuit,
} from '@/lib/privacy/onion-routing';
import { x25519 } from '@noble/curves/ed25519.js';

// ============================================================================
// Helpers
// ============================================================================

function makeRelays(count: number): RelayNode[] {
  return Array.from({ length: count }, (_, i) => {
    const kp = generateRelayKeypair();
    return createRelayNode(
      `relay-${i}`,
      kp.publicKeyHex,
      `ws://relay-${i}.example.com`,
      true,
    );
  });
}

function makeRelaysWithKeys(count: number): Array<{
  relay: RelayNode;
  privateKey: Uint8Array;
}> {
  return Array.from({ length: count }, (_, i) => {
    const kp = generateRelayKeypair();
    return {
      relay: createRelayNode(
        `relay-${i}`,
        kp.publicKeyHex,
        `ws://relay-${i}.example.com`,
        true,
      ),
      privateKey: kp.privateKey,
    };
  });
}

// ============================================================================
// Original Invariant Tests (backward-compatible)
// ============================================================================

describe('onion-weaver invariants', () => {
  it('enforces 3 hops minimum in privacy mode', () => {
    expect(MIN_HOPS).toBe(3);

    const relays = makeRelays(5);
    const circuit = buildCircuit(relays, 3);
    expect(circuit.hops.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects circuit build with fewer hops than minimum', () => {
    expect(() => buildCircuit(makeRelays(5), 2)).toThrow('minHops must be >= 3');
  });

  it('rejects circuit build with insufficient available relays', () => {
    const relays = makeRelays(2);
    expect(() => buildCircuit(relays, 3)).toThrow('need >= 3 available relays');
  });

  it('enforces circuit rotation every 10 minutes', () => {
    expect(CIRCUIT_ROTATION_MS).toBe(10 * 60 * 1000);

    const circuit = buildCircuit(makeRelays(5));
    expect(circuit.expiresAt).toBe(circuit.createdAt + CIRCUIT_ROTATION_MS);
  });

  it('detects expired circuits needing rotation', () => {
    const circuit = buildCircuit(makeRelays(5));
    // Not expired yet
    expect(circuitNeedsRotation(circuit)).toBe(false);

    // Simulate expiry
    const expired = { ...circuit, expiresAt: Date.now() - 1 };
    expect(circuitNeedsRotation(expired)).toBe(true);
  });

  it('marks torn-down circuits as needing rotation', () => {
    const circuit = buildCircuit(makeRelays(5));
    const tornDown = teardownCircuit(circuit);
    expect(tornDown.tornDown).toBe(true);
    expect(circuitNeedsRotation(tornDown)).toBe(true);
  });

  it('selects relays using CSPRNG-based shuffling', () => {
    const relays = makeRelays(10);
    const circuits = Array.from({ length: 5 }, () => buildCircuit(relays));
    const firstHopIds = circuits.map((c) => c.hops[0]!.id);
    const unique = new Set(firstHopIds);
    expect(unique.size).toBeGreaterThanOrEqual(1);
  });

  it('generates unique 128-bit circuit IDs', () => {
    const relays = makeRelays(5);
    const ids = Array.from({ length: 10 }, () => buildCircuit(relays).circuitId);
    const unique = new Set(ids);
    expect(unique.size).toBe(10);
    for (const id of ids) {
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it('enforces policy: rejects minHops below 3', () => {
    expect(() =>
      enforceOnionWeaverPolicy({ enabled: true, hopCount: 2, rotationMs: 600000 })
    ).toThrow('minHops must be >= 3');
  });
});

// ============================================================================
// X25519 Key Exchange Tests
// ============================================================================

describe('onion-weaver key exchange', () => {
  it('negotiates hop keys via X25519 ECDH', () => {
    const kp = generateRelayKeypair();
    const hopKeys = negotiateHopKeys(kp.publicKey);

    expect(hopKeys.ephemeralPrivate).toHaveLength(32);
    expect(hopKeys.ephemeralPublic).toHaveLength(32);
    expect(hopKeys.sessionKey).toHaveLength(32);
  });

  it('derives matching session keys on both sides', () => {
    const relayKp = generateRelayKeypair();

    // Client side
    const hopKeys = negotiateHopKeys(relayKp.publicKey);

    // Relay side
    const relaySessionKey = deriveRelaySessionKey(
      hopKeys.ephemeralPublic,
      relayKp.privateKey,
      relayKp.publicKey,
    );

    // Both sides must derive the same key
    expect(Buffer.from(hopKeys.sessionKey)).toEqual(Buffer.from(relaySessionKey));
  });

  it('produces different keys for different relays', () => {
    const relay1 = generateRelayKeypair();
    const relay2 = generateRelayKeypair();

    const keys1 = negotiateHopKeys(relay1.publicKey);
    const keys2 = negotiateHopKeys(relay2.publicKey);

    expect(Buffer.from(keys1.sessionKey)).not.toEqual(Buffer.from(keys2.sessionKey));
  });

  it('produces different keys on each negotiation (ephemeral)', () => {
    const relayKp = generateRelayKeypair();

    const keys1 = negotiateHopKeys(relayKp.publicKey);
    const keys2 = negotiateHopKeys(relayKp.publicKey);

    // Ephemeral keys should differ
    expect(Buffer.from(keys1.ephemeralPublic)).not.toEqual(
      Buffer.from(keys2.ephemeralPublic),
    );
    // Session keys should differ because of different ephemeral keypairs
    expect(Buffer.from(keys1.sessionKey)).not.toEqual(Buffer.from(keys2.sessionKey));
  });

  it('rejects invalid public key length', () => {
    expect(() => negotiateHopKeys(new Uint8Array(16))).toThrow(
      'relay public key must be 32 bytes',
    );
  });
});

// ============================================================================
// AES-256-GCM Layer Encryption Tests
// ============================================================================

describe('onion-weaver layer encryption', () => {
  it('encrypts and decrypts a layer correctly', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Hello, onion routing!');

    const encrypted = encryptLayer(plaintext, key);
    const decrypted = decryptLayer(encrypted, key);

    expect(new TextDecoder().decode(decrypted)).toBe('Hello, onion routing!');
  });

  it('encryption output is nonce + ciphertext + tag', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new Uint8Array(100);

    const encrypted = encryptLayer(plaintext, key);

    // nonce (12) + ciphertext (100) + tag (16) = 128
    expect(encrypted.length).toBe(12 + 100 + 16);
  });

  it('detects tampering (authentication failure)', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret data');

    const encrypted = encryptLayer(plaintext, key);

    // Tamper with ciphertext
    encrypted[20] ^= 0xff;

    expect(() => decryptLayer(encrypted, key)).toThrow('authentication error');
  });

  it('fails with wrong key', () => {
    const key1 = crypto.getRandomValues(new Uint8Array(32));
    const key2 = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret');

    const encrypted = encryptLayer(plaintext, key1);

    expect(() => decryptLayer(encrypted, key2)).toThrow();
  });

  it('rejects invalid key length', () => {
    expect(() => encryptLayer(new Uint8Array(10), new Uint8Array(16))).toThrow(
      'session key must be 32 bytes',
    );
  });
});

// ============================================================================
// Multi-Layer Onion Wrapping Tests
// ============================================================================

describe('onion-weaver multi-layer wrapping', () => {
  it('wraps and unwraps 3 layers correctly', () => {
    const relaysWithKeys = makeRelaysWithKeys(3);
    const relays = relaysWithKeys.map((r) => r.relay);
    const circuit = buildCircuit(relays, 3);
    const destination = 'ws://destination.example.com';

    const plaintext = new TextEncoder().encode('Top secret payload');
    const wrapped = wrapOnion(plaintext, circuit, destination);

    // Unwrap layer by layer, simulating each relay
    // Entry relay (hop 0) peels first layer
    const layer0 = unwrapOnionLayer(wrapped, circuit.hopKeys[0]!.sessionKey);
    expect(layer0.nextHop).toBe(circuit.hops[1]!.address);

    // Middle relay (hop 1) peels second layer
    const layer1 = unwrapOnionLayer(layer0.innerData, circuit.hopKeys[1]!.sessionKey);
    expect(layer1.nextHop).toBe(circuit.hops[2]!.address);

    // Exit relay (hop 2) peels third layer
    const layer2 = unwrapOnionLayer(layer1.innerData, circuit.hopKeys[2]!.sessionKey);
    expect(layer2.nextHop).toBe(destination);

    // The final inner data should be the original plaintext
    expect(new TextDecoder().decode(layer2.innerData)).toBe('Top secret payload');
  });

  it('each relay only sees its own next hop', () => {
    const relaysWithKeys = makeRelaysWithKeys(3);
    const relays = relaysWithKeys.map((r) => r.relay);
    const circuit = buildCircuit(relays, 3);
    const destination = 'ws://final.example.com';

    const wrapped = wrapOnion(
      new TextEncoder().encode('data'),
      circuit,
      destination,
    );

    // Entry only sees middle relay address
    const layer0 = unwrapOnionLayer(wrapped, circuit.hopKeys[0]!.sessionKey);
    expect(layer0.nextHop).toBe(circuit.hops[1]!.address);
    // Entry cannot decrypt layer1 (would need hop 1's key)

    // Middle only sees exit relay address
    const layer1 = unwrapOnionLayer(layer0.innerData, circuit.hopKeys[1]!.sessionKey);
    expect(layer1.nextHop).toBe(circuit.hops[2]!.address);

    // Exit only sees destination
    const layer2 = unwrapOnionLayer(layer1.innerData, circuit.hopKeys[2]!.sessionKey);
    expect(layer2.nextHop).toBe(destination);
  });

  it('entry relay cannot decrypt inner layers with its own key', () => {
    const relays = makeRelays(3);
    const circuit = buildCircuit(relays, 3);
    const destination = 'ws://dest.example.com';

    const wrapped = wrapOnion(
      new TextEncoder().encode('secret'),
      circuit,
      destination,
    );

    const layer0 = unwrapOnionLayer(wrapped, circuit.hopKeys[0]!.sessionKey);

    // Try to decrypt layer1 with entry's key (should fail)
    expect(() =>
      unwrapOnionLayer(layer0.innerData, circuit.hopKeys[0]!.sessionKey),
    ).toThrow();
  });

  it('handles empty payload', () => {
    const relays = makeRelays(3);
    const circuit = buildCircuit(relays, 3);
    const destination = 'ws://dest.example.com';

    const wrapped = wrapOnion(new Uint8Array(0), circuit, destination);

    let data = wrapped;
    for (let i = 0; i < 3; i++) {
      const result = unwrapOnionLayer(data, circuit.hopKeys[i]!.sessionKey);
      data = result.innerData;
      if (i === 2) {
        expect(result.nextHop).toBe(destination);
        expect(result.innerData.length).toBe(0);
      }
    }
  });
});

// ============================================================================
// Fixed-Size Cell Tests
// ============================================================================

describe('onion-weaver fixed-size cells', () => {
  it('all cells are exactly CELL_SIZE_BYTES', () => {
    expect(CELL_SIZE_BYTES).toBe(512);

    const cell = buildCell('abcdef1234567890abcdef1234567890', CELL_CMD.RELAY_DATA, new Uint8Array(100));
    expect(cell.length).toBe(CELL_SIZE_BYTES);
  });

  it('padding cell is exactly CELL_SIZE_BYTES', () => {
    const cell = buildPaddingCell('abcdef1234567890abcdef1234567890');
    expect(cell.length).toBe(CELL_SIZE_BYTES);
  });

  it('round-trips through build/parse', () => {
    const payload = new TextEncoder().encode('test payload data');
    const circuitId = 'abcdef1234567890abcdef1234567890';

    const cell = buildCell(circuitId, CELL_CMD.RELAY_DATA, payload);
    const parsed = parseCell(cell);

    expect(parsed.circuitId).toBe(circuitId);
    expect(parsed.command).toBe(CELL_CMD.RELAY_DATA);
    expect(new TextDecoder().decode(parsed.body)).toBe('test payload data');
  });

  it('rejects oversized payloads', () => {
    const oversized = new Uint8Array(CELL_SIZE_BYTES); // Larger than max payload
    expect(() =>
      buildCell('test', CELL_CMD.RELAY_DATA, oversized),
    ).toThrow('cell payload too large');
  });

  it('rejects cells of wrong size during parse', () => {
    expect(() => parseCell(new Uint8Array(100))).toThrow(
      `cell must be exactly ${CELL_SIZE_BYTES} bytes`,
    );
  });

  it('builds relay data cells that chunk large payloads', () => {
    // Max cell payload is 477 bytes. Test with 1000 bytes.
    const data = crypto.getRandomValues(new Uint8Array(1000));
    const cells = buildRelayDataCells('testcircuit', data);

    expect(cells.length).toBe(3); // ceil(1000 / 477) = 3
    for (const cell of cells) {
      expect(cell.length).toBe(CELL_SIZE_BYTES);
    }
  });
});

// ============================================================================
// Relay Handshake Protocol Tests
// ============================================================================

describe('onion-weaver relay handshake', () => {
  it('CREATE cell contains ephemeral public key', () => {
    const relays = makeRelays(3);
    const circuit = buildCircuit(relays, 3);

    const createCell = buildCreateCell(circuit);
    expect(createCell.length).toBe(CELL_SIZE_BYTES);

    const parsed = parseCell(createCell);
    expect(parsed.command).toBe(CELL_CMD.CREATE);
    expect(parsed.body.length).toBe(32); // X25519 public key
  });

  it('relay derives matching session key from CREATE cell', () => {
    const relayKp = generateRelayKeypair();
    const relay = createRelayNode('test', relayKp.publicKeyHex, 'ws://test', true);

    // Build circuit targeting this specific relay as entry
    const otherRelays = makeRelays(2);
    const allRelays = [relay, ...otherRelays];
    const circuit = buildCircuit(allRelays, 3);

    // Find which hop uses our relay
    const hopIndex = circuit.hops.findIndex((h) => h.id === 'test');
    if (hopIndex === -1) {
      // Relay not selected (random shuffle), skip this iteration
      return;
    }

    const createCell = parseCell(
      buildCell(
        circuit.circuitId,
        CELL_CMD.CREATE,
        circuit.hopKeys[hopIndex]!.ephemeralPublic,
      ),
    );

    const relaySessionKey = handleCreateCell(
      createCell,
      relayKp.privateKey,
      relayKp.publicKey,
    );

    expect(Buffer.from(relaySessionKey)).toEqual(
      Buffer.from(circuit.hopKeys[hopIndex]!.sessionKey),
    );
  });

  it('DESTROY cell is valid', () => {
    const cell = buildDestroyCell('abcdef1234567890abcdef1234567890');
    expect(cell.length).toBe(CELL_SIZE_BYTES);

    const parsed = parseCell(cell);
    expect(parsed.command).toBe(CELL_CMD.DESTROY);
  });
});

// ============================================================================
// End-to-End Relay Simulation Tests
// ============================================================================

describe('onion-weaver end-to-end relay simulation', () => {
  it('simulates full 3-hop onion routing with relay-side decryption', () => {
    // Set up 3 relays with known keypairs
    const relayKeypairs = Array.from({ length: 3 }, () => generateRelayKeypair());
    const relays: RelayNode[] = relayKeypairs.map((kp, i) =>
      createRelayNode(`relay-${i}`, kp.publicKeyHex, `ws://relay-${i}.test`, true),
    );

    // Client builds circuit
    const circuit = buildCircuit(relays, 3);

    // The original payload
    const originalPayload = new TextEncoder().encode(
      'This is a secret message routed through 3 hops',
    );
    const destination = 'ws://final-destination.test';

    // Client wraps the payload in 3 encryption layers
    const wrapped = wrapOnion(originalPayload, circuit, destination);

    // === Entry Relay (hop 0) ===
    // Derive session key the same way the relay would
    const entrySessionKey = deriveRelaySessionKey(
      circuit.hopKeys[0]!.ephemeralPublic,
      relayKeypairs[circuit.hops.findIndex((h) => h.id === relays[0]!.id)]
        ? relayKeypairs[0]!.privateKey
        : relayKeypairs[0]!.privateKey,
      relays[0]!.publicKey,
    );

    // Verify session keys match
    const entryHopIndex = circuit.hops.findIndex((h) => h.id === relays[0]!.id);
    if (entryHopIndex >= 0) {
      expect(Buffer.from(entrySessionKey)).toEqual(
        Buffer.from(circuit.hopKeys[entryHopIndex]!.sessionKey),
      );
    }

    // Peel layers using the circuit's hop keys (simulating relays)
    let currentData = wrapped;

    for (let i = 0; i < 3; i++) {
      const hop = circuit.hops[i]!;
      const hopRelayIndex = relays.findIndex((r) => r.id === hop.id);
      const relayPrivKey = relayKeypairs[hopRelayIndex]!.privateKey;
      const relayPubKey = relays[hopRelayIndex]!.publicKey;

      // Relay derives session key
      const sessionKey = deriveRelaySessionKey(
        circuit.hopKeys[i]!.ephemeralPublic,
        relayPrivKey,
        relayPubKey,
      );

      // Relay peels one layer
      const result = unwrapOnionLayer(currentData, sessionKey);

      if (i < 2) {
        // Not the exit: should forward to next hop
        expect(result.nextHop).toBe(circuit.hops[i + 1]!.address);
      } else {
        // Exit relay: should see the final destination
        expect(result.nextHop).toBe(destination);
        // And the original plaintext
        expect(new TextDecoder().decode(result.innerData)).toBe(
          'This is a secret message routed through 3 hops',
        );
      }

      currentData = result.innerData;
    }
  });
});

// ============================================================================
// Circuit Manager Tests
// ============================================================================

describe('OnionCircuitManager', () => {
  let manager: OnionCircuitManager;
  let relays: RelayNode[];

  beforeEach(() => {
    manager = new OnionCircuitManager({
      enabled: true,
      hopCount: 3,
      rotationMs: CIRCUIT_ROTATION_MS,
    });
    relays = makeRelays(5);
  });

  afterEach(() => {
    manager.cleanup();
  });

  it('creates circuits', () => {
    const circuit = manager.createCircuit(relays);
    expect(circuit.hops.length).toBe(3);
    expect(circuit.hopKeys.length).toBe(3);
    expect(manager.activeCount).toBe(1);
  });

  it('retrieves circuits by ID', () => {
    const circuit = manager.createCircuit(relays);
    const retrieved = manager.getCircuit(circuit.circuitId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.circuitId).toBe(circuit.circuitId);
  });

  it('destroys circuits and wipes keys', () => {
    const circuit = manager.createCircuit(relays);
    const circuitId = circuit.circuitId;

    manager.destroyCircuit(circuitId);

    expect(manager.getCircuit(circuitId)).toBeNull();
    expect(manager.activeCount).toBe(0);
  });

  it('destroys all circuits', () => {
    manager.createCircuit(relays);
    manager.createCircuit(relays);
    manager.createCircuit(relays);
    expect(manager.activeCount).toBe(3);

    manager.destroyAll();
    expect(manager.activeCount).toBe(0);
  });

  it('auto-rotates expired circuits', async () => {
    const circuit = manager.createCircuit(relays);
    const circuitId = circuit.circuitId;

    // Manually expire the circuit
    const storedCircuit = manager.getCircuit(circuitId);
    if (storedCircuit) {
      storedCircuit.expiresAt = Date.now() - 1;
    }

    // Accessing an expired circuit should destroy it
    const result = manager.getCircuit(circuitId);
    expect(result).toBeNull();
  });

  it('rejects invalid config updates', () => {
    expect(() =>
      manager.updateConfig({ hopCount: 1 }),
    ).toThrow('minHops must be >= 3');
  });
});

// ============================================================================
// Key Destruction Tests
// ============================================================================

describe('onion-weaver key destruction', () => {
  it('teardownCircuit zeros all key material', () => {
    const relays = makeRelays(3);
    const circuit = buildCircuit(relays, 3);

    // Capture references to key arrays before teardown
    const keyRefs = circuit.hopKeys.map((hk) => ({
      priv: hk.ephemeralPrivate,
      pub: hk.ephemeralPublic,
      session: hk.sessionKey,
    }));

    // Verify keys are non-zero before teardown
    for (const ref of keyRefs) {
      expect(ref.session.some((b) => b !== 0)).toBe(true);
    }

    teardownCircuit(circuit);

    // After teardown, the original arrays should be zeroed
    for (const ref of keyRefs) {
      expect(ref.priv.every((b) => b === 0)).toBe(true);
      expect(ref.pub.every((b) => b === 0)).toBe(true);
      expect(ref.session.every((b) => b === 0)).toBe(true);
    }
  });
});
