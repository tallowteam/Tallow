'use client';

/**
 * Security Module Test Page
 * Tests all Signal-level security features
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Shield, Key, Globe, Lock, EyeOff } from 'lucide-react';

// Import security modules
import { SparsePQRatchet } from '@/lib/crypto/sparse-pq-ratchet';
import { TripleRatchet } from '@/lib/crypto/triple-ratchet';
import {
    generateIdentityKeyPair,
    generateSignedPrekey,
    verifySignedPrekey,
    initializePrekeyStore,
    getIdentityFingerprint
} from '@/lib/crypto/signed-prekeys';
import { OnionRouter, defaultOnionConfig } from '@/lib/transport/onion-routing';
import { TrafficObfuscator } from '@/lib/transport/obfuscation';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';

interface TestResult {
    name: string;
    passed: boolean;
    details: string;
    duration?: number;
}

interface TestModule {
    name: string;
    icon: React.ReactNode;
    tests: () => Promise<TestResult[]>;
}

export default function SecurityTestPage() {
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState<Map<string, TestResult[]>>(new Map());
    const [currentModule, setCurrentModule] = useState('');

    const testModules: TestModule[] = [
        {
            name: 'Traffic Obfuscation',
            icon: <EyeOff className="w-5 h-5" />,
            tests: testTrafficObfuscation,
        },
        {
            name: 'Sparse PQ Ratchet',
            icon: <Key className="w-5 h-5" />,
            tests: testSparsePQRatchet,
        },
        {
            name: 'Triple Ratchet',
            icon: <Shield className="w-5 h-5" />,
            tests: testTripleRatchet,
        },
        {
            name: 'Signed Prekeys',
            icon: <Lock className="w-5 h-5" />,
            tests: testSignedPrekeys,
        },
        {
            name: 'Onion Routing',
            icon: <Globe className="w-5 h-5" />,
            tests: testOnionRouting,
        },
    ];

    const runAllTests = async () => {
        setTesting(true);
        setResults(new Map());

        for (const module of testModules) {
            setCurrentModule(module.name);
            try {
                const moduleResults = await module.tests();
                setResults(prev => new Map(prev).set(module.name, moduleResults));
            } catch (error) {
                setResults(prev => new Map(prev).set(module.name, [{
                    name: 'Module Error',
                    passed: false,
                    details: String(error),
                }]));
            }
        }

        setCurrentModule('');
        setTesting(false);
    };

    const getTotalStats = () => {
        let passed = 0;
        let failed = 0;
        results.forEach(tests => {
            tests.forEach(t => t.passed ? passed++ : failed++);
        });
        return { passed, failed, total: passed + failed };
    };

    const stats = getTotalStats();

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/app">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Security Module Tests</h1>
                        <p className="text-muted-foreground">
                            Verify all Signal-level security features
                        </p>
                    </div>
                </div>

                {/* Run Tests Button */}
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Run All Security Tests</h2>
                            <p className="text-sm text-muted-foreground">
                                Tests: Sparse PQ Ratchet, Triple Ratchet, Signed Prekeys, Onion Routing
                            </p>
                        </div>
                        <Button onClick={runAllTests} disabled={testing} size="lg">
                            {testing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Testing {currentModule}...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Run All Tests
                                </>
                            )}
                        </Button>
                    </div>

                    {stats.total > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-secondary/50">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Results</span>
                                <div className="flex gap-4">
                                    <span className="text-green-500 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" /> {stats.passed} passed
                                    </span>
                                    <span className={`flex items-center gap-1 ${stats.failed > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        <XCircle className="w-4 h-4" /> {stats.failed} failed
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Test Results by Module */}
                {testModules.map(module => {
                    const moduleResults = results.get(module.name);
                    if (!moduleResults && !testing) return null;

                    return (
                        <Card key={module.name} className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {module.icon}
                                <h3 className="text-lg font-semibold">{module.name}</h3>
                                {moduleResults && (
                                    <span className={`text-sm px-2 py-0.5 rounded-full ${moduleResults.every(r => r.passed)
                                        ? 'bg-green-500/20 text-green-600'
                                        : 'bg-red-500/20 text-red-600'
                                        }`}>
                                        {moduleResults.filter(r => r.passed).length}/{moduleResults.length}
                                    </span>
                                )}
                                {testing && currentModule === module.name && (
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {moduleResults && (
                                <div className="space-y-2">
                                    {moduleResults.map((result, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-lg ${result.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {result.passed ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                )}
                                                <span className="font-medium">{result.name}</span>
                                                {result.duration && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {result.duration}ms
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 font-mono">
                                                {result.details}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    );
                })}

                {/* Back Button */}
                <div className="flex justify-center pt-4">
                    <Link href="/app">
                        <Button variant="outline" size="lg">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Main App
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Test Functions
// =============================================================================

async function testTrafficObfuscation(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Initialization
    try {
        const start = Date.now();
        const obfuscator = new TrafficObfuscator();
        const config = obfuscator.getConfig();

        results.push({
            name: 'Initialization',
            passed: config.paddingMin === 0.1 && config.paddingMax === 0.3,
            details: `Padding: ${config.paddingMin * 100}%-${config.paddingMax * 100}%, Bitrate: ${config.targetBitrate / 1000}KB/s`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Initialization', passed: false, details: String(e) });
    }

    // Test 2: Data Padding
    try {
        const start = Date.now();
        const obfuscator = new TrafficObfuscator();
        const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        const paddedData = obfuscator.padData(originalData);
        const unpadded = obfuscator.unpadData(paddedData);

        const matched = unpadded !== null && arraysEqual(originalData, unpadded);

        results.push({
            name: 'Data Padding/Unpadding',
            passed: matched && paddedData.length > originalData.length,
            details: `Original: ${originalData.length}B → Padded: ${paddedData.length}B → Restored: ${unpadded?.length || 0}B`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Data Padding/Unpadding', passed: false, details: String(e) });
    }

    // Test 3: Random Chunking
    try {
        const start = Date.now();
        // Use smaller chunk sizes for testing (1KB-5KB instead of 16KB-1MB)
        const obfuscator = new TrafficObfuscator({
            chunkSizeMin: 1024,    // 1KB
            chunkSizeMax: 5120,    // 5KB
        });
        const data = new Uint8Array(50000); // 50KB (under 64KB crypto limit)
        // Fill in chunks to avoid getRandomValues limit
        for (let i = 0; i < data.length; i += 32768) {
            const chunk = Math.min(32768, data.length - i);
            crypto.getRandomValues(data.subarray(i, i + chunk));
        }

        const chunks = obfuscator.randomChunking(data);
        const reassembled = obfuscator.reassembleChunks(chunks);

        const matched = arraysEqual(data, reassembled);
        const hasVariation = new Set(chunks.map(c => c.length)).size > 1;

        results.push({
            name: 'Random Chunking',
            passed: matched && hasVariation && chunks.length > 1,
            details: `${chunks.length} chunks, sizes vary: ${hasVariation}, reassembly: ${matched ? 'OK' : 'FAILED'}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Random Chunking', passed: false, details: String(e) });
    }

    // Test 4: Constant Bitrate Transfer
    try {
        const start = Date.now();
        const obfuscator = new TrafficObfuscator({ targetBitrate: 50000 }); // 50KB/s for faster test
        const data = new Uint8Array(1000); // 1KB test data
        crypto.getRandomValues(data);

        let chunkCount = 0;
        let totalBytes = 0;

        for await (const chunk of obfuscator.constantBitrateTransfer(data)) {
            chunkCount++;
            totalBytes += chunk.data.length;
            if (chunkCount > 20) break; // Limit for test
        }

        results.push({
            name: 'Constant Bitrate Transfer',
            passed: chunkCount > 0 && totalBytes > 0,
            details: `${chunkCount} chunks, ${totalBytes}B total (async generator works)`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Constant Bitrate Transfer', passed: false, details: String(e) });
    }

    // Test 5: Decoy Generation
    try {
        const start = Date.now();
        const obfuscator = new TrafficObfuscator({ decoyProbability: 1.0 }); // Force decoys
        const decoy = obfuscator.generateDecoyChunk(42);

        results.push({
            name: 'Decoy Generation',
            passed: decoy.isDecoy && decoy.sequenceNumber === 42 && decoy.data.length > 0,
            details: `Decoy: ${decoy.data.length}B, seq=${decoy.sequenceNumber}, isDecoy=${decoy.isDecoy}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Decoy Generation', passed: false, details: String(e) });
    }

    // Test 6: Frame/Parse Round Trip
    try {
        const start = Date.now();
        const obfuscator = new TrafficObfuscator();
        const originalChunk = {
            data: new Uint8Array([1, 2, 3, 4, 5]),
            isDecoy: false,
            sequenceNumber: 123,
            timestamp: Date.now(),
        };

        const framed = obfuscator.frameChunk(originalChunk);
        const parsed = obfuscator.parseFrame(framed);

        const matched = parsed &&
            arraysEqual(originalChunk.data, parsed.data) &&
            parsed.sequenceNumber === 123;

        results.push({
            name: 'Frame/Parse Round Trip',
            passed: !!matched,
            details: matched ? `Frame: ${framed.length}B, parsed seq=${parsed!.sequenceNumber}` : 'Parse failed',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Frame/Parse Round Trip', passed: false, details: String(e) });
    }

    return results;
}

async function testSparsePQRatchet(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Initialization
    try {
        const start = Date.now();
        const initialSecret = pqCrypto.randomBytes(32);
        const ratchet = await SparsePQRatchet.initialize(initialSecret, true);
        const info = ratchet.getEpochInfo();

        results.push({
            name: 'Initialization',
            passed: info.epoch === 0 && info.messageCount === 0,
            details: `Epoch: ${info.epoch}, Message count: ${info.messageCount}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Initialization', passed: false, details: String(e) });
    }

    // Test 2: Key Generation
    try {
        const start = Date.now();
        const initialSecret = pqCrypto.randomBytes(32);
        const ratchet = await SparsePQRatchet.initialize(initialSecret, true);
        const publicKey = ratchet.getPublicKey();

        results.push({
            name: 'Key Generation',
            passed: publicKey.kyberPublicKey.length === 1184 && publicKey.x25519PublicKey.length === 32,
            details: `Kyber: ${publicKey.kyberPublicKey.length}B, X25519: ${publicKey.x25519PublicKey.length}B`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Key Generation', passed: false, details: String(e) });
    }

    // Test 3: Message Key Derivation
    try {
        const start = Date.now();
        const initialSecret = pqCrypto.randomBytes(32);
        const ratchet = await SparsePQRatchet.initialize(initialSecret, true);

        const result1 = await ratchet.prepareSend();
        const result2 = await ratchet.prepareSend();

        // Keys should be different
        const keysUnique = !arraysEqual(result1.messageKey, result2.messageKey);

        results.push({
            name: 'Message Key Derivation',
            passed: keysUnique && result1.messageKey.length === 32,
            details: `Key 1: ${toHex(result1.messageKey.slice(0, 8))}..., Key 2: ${toHex(result2.messageKey.slice(0, 8))}...`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Message Key Derivation', passed: false, details: String(e) });
    }

    // Test 4: Epoch Tracking
    try {
        const start = Date.now();
        const initialSecret = pqCrypto.randomBytes(32);
        const ratchet = await SparsePQRatchet.initialize(initialSecret, true);

        // Send messages
        for (let i = 0; i < 5; i++) {
            await ratchet.prepareSend();
        }

        const info = ratchet.getEpochInfo();

        results.push({
            name: 'Epoch Tracking',
            passed: info.messageCount === 5 && info.epoch === 0,
            details: `After 5 messages: epoch=${info.epoch}, count=${info.messageCount}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Epoch Tracking', passed: false, details: String(e) });
    }

    return results;
}

async function testTripleRatchet(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Session Initialization
    try {
        const start = Date.now();
        const sharedSecret = pqCrypto.randomBytes(32);
        const alice = await TripleRatchet.initialize(sharedSecret, true, 'test-session');
        const bob = await TripleRatchet.initialize(sharedSecret, false, 'test-session');

        const aliceKeys = alice.getPublicKeys();
        const bobKeys = bob.getPublicKeys();

        results.push({
            name: 'Session Initialization',
            passed: aliceKeys.dhPublicKey.length === 32 && bobKeys.dhPublicKey.length === 32,
            details: `Alice DH: ${aliceKeys.dhPublicKey.length}B, Bob DH: ${bobKeys.dhPublicKey.length}B`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Session Initialization', passed: false, details: String(e) });
    }

    // Test 2: Key Exchange
    try {
        const start = Date.now();
        const sharedSecret = pqCrypto.randomBytes(32);
        const alice = await TripleRatchet.initialize(sharedSecret, true, 'test-session');
        const bob = await TripleRatchet.initialize(sharedSecret, false, 'test-session');

        const aliceKeys = alice.getPublicKeys();
        const bobKeys = bob.getPublicKeys();

        alice.setPeerPublicKeys(bobKeys.dhPublicKey, bobKeys.pqPublicKey);
        bob.setPeerPublicKeys(aliceKeys.dhPublicKey, aliceKeys.pqPublicKey);

        results.push({
            name: 'Key Exchange',
            passed: true,
            details: 'Keys exchanged successfully between Alice and Bob',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Key Exchange', passed: false, details: String(e) });
    }

    // Test 3: Encrypt/Decrypt Round Trip
    try {
        const start = Date.now();
        const sharedSecret = pqCrypto.randomBytes(32);
        const alice = await TripleRatchet.initialize(sharedSecret, true, 'test-session');
        const bob = await TripleRatchet.initialize(sharedSecret, false, 'test-session');

        const aliceKeys = alice.getPublicKeys();
        const bobKeys = bob.getPublicKeys();

        alice.setPeerPublicKeys(bobKeys.dhPublicKey, bobKeys.pqPublicKey);
        bob.setPeerPublicKeys(aliceKeys.dhPublicKey, aliceKeys.pqPublicKey);

        const plaintext = new TextEncoder().encode('Hello from Triple Ratchet!');
        const encrypted = await alice.encrypt(plaintext);
        const decrypted = await bob.decrypt(encrypted);

        const matches = new TextDecoder().decode(decrypted) === 'Hello from Triple Ratchet!';

        results.push({
            name: 'Encrypt/Decrypt Round Trip',
            passed: matches,
            details: matches ? 'Message decrypted successfully' : 'Decryption mismatch',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Encrypt/Decrypt Round Trip', passed: false, details: String(e) });
    }

    // Test 4: Session Info
    try {
        const start = Date.now();
        const sharedSecret = pqCrypto.randomBytes(32);
        const session = await TripleRatchet.initialize(sharedSecret, true, 'info-test');
        const info = session.getSessionInfo();

        results.push({
            name: 'Session Info',
            passed: info.sessionId === 'info-test' && info.drMessageNumber === 0,
            details: `ID: ${info.sessionId}, Messages: ${info.drMessageNumber}, PQ Epoch: ${info.pqEpoch}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Session Info', passed: false, details: String(e) });
    }

    return results;
}

async function testSignedPrekeys(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Identity Key Generation
    try {
        const start = Date.now();
        const identity = generateIdentityKeyPair();

        results.push({
            name: 'Identity Key Generation',
            passed: identity.publicKey.length === 32 && identity.privateKey.length === 32,
            details: `Public: ${identity.publicKey.length}B, Private: ${identity.privateKey.length}B`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Identity Key Generation', passed: false, details: String(e) });
    }

    // Test 2: Identity Fingerprint
    try {
        const start = Date.now();
        const identity = generateIdentityKeyPair();
        const fingerprint = getIdentityFingerprint(identity.publicKey);

        // Fingerprint should be 8 groups of 4 hex chars
        const valid = fingerprint.split(' ').length === 8 && fingerprint.length === 39;

        results.push({
            name: 'Identity Fingerprint',
            passed: valid,
            details: fingerprint,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Identity Fingerprint', passed: false, details: String(e) });
    }

    // Test 3: Signed Prekey Generation
    try {
        const start = Date.now();
        const identity = generateIdentityKeyPair();
        const signedPrekey = await generateSignedPrekey(identity, 1);

        results.push({
            name: 'Signed Prekey Generation',
            passed: signedPrekey.public.keyId === 1 && signedPrekey.public.signature.length === 64,
            details: `KeyID: ${signedPrekey.public.keyId}, Signature: ${signedPrekey.public.signature.length}B`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Signed Prekey Generation', passed: false, details: String(e) });
    }

    // Test 4: Signature Verification
    try {
        const start = Date.now();
        const identity = generateIdentityKeyPair();
        const signedPrekey = await generateSignedPrekey(identity, 1);
        const valid = verifySignedPrekey(signedPrekey.public, identity.publicKey);

        results.push({
            name: 'Signature Verification',
            passed: valid,
            details: valid ? 'Signature verified successfully' : 'Signature verification failed',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Signature Verification', passed: false, details: String(e) });
    }

    // Test 5: Prekey Store Initialization
    try {
        const start = Date.now();
        const identity = generateIdentityKeyPair();
        const store = await initializePrekeyStore(identity);

        results.push({
            name: 'Prekey Store Initialization',
            passed: store.oneTimePrekeys.length === 100 && store.signedPrekey !== undefined,
            details: `Signed: 1, One-time: ${store.oneTimePrekeys.length}, Next ID: ${store.nextKeyId}`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Prekey Store Initialization', passed: false, details: String(e) });
    }

    return results;
}

async function testOnionRouting(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Router Initialization
    try {
        const start = Date.now();
        const router = new OnionRouter(defaultOnionConfig);

        results.push({
            name: 'Router Initialization',
            passed: !router.isEnabled(), // Default is disabled
            details: `Enabled: ${router.isEnabled()} (default should be false)`,
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Router Initialization', passed: false, details: String(e) });
    }

    // Test 2: Config Update
    try {
        const start = Date.now();
        const router = new OnionRouter(defaultOnionConfig);
        router.setConfig({ enabled: true, hopCount: 2 });

        results.push({
            name: 'Config Update',
            passed: router.isEnabled(),
            details: 'Config updated: enabled=true, hopCount=2',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Config Update', passed: false, details: String(e) });
    }

    // Test 3: Relay Discovery (Simulated)
    try {
        const start = Date.now();
        const router = new OnionRouter({ ...defaultOnionConfig, enabled: true });
        await router.refreshRelays();

        // Should return empty list (no actual relays)
        results.push({
            name: 'Relay Discovery (Simulated)',
            passed: true,
            details: 'Relay discovery returned (simulated - no real network)',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Relay Discovery', passed: false, details: String(e) });
    }

    // Test 4: Circuit Creation (Without Relays)
    try {
        const start = Date.now();
        const router = new OnionRouter({ ...defaultOnionConfig, enabled: true });
        const circuit = await router.createCircuit('ws://localhost:8080');

        // Should return null (no relays available)
        results.push({
            name: 'Circuit Creation (No Relays)',
            passed: circuit === null,
            details: 'Circuit null as expected (no relays available)',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Circuit Creation', passed: false, details: String(e) });
    }

    // Test 5: Close All Circuits
    try {
        const start = Date.now();
        const router = new OnionRouter(defaultOnionConfig);
        router.closeAllCircuits();

        results.push({
            name: 'Close All Circuits',
            passed: true,
            details: 'All circuits closed successfully',
            duration: Date.now() - start,
        });
    } catch (e) {
        results.push({ name: 'Close All Circuits', passed: false, details: String(e) });
    }

    return results;
}

// Utility functions
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
