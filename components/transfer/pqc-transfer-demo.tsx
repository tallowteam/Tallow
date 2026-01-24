'use client';

/**
 * PQC Transfer Demo Component
 * Example of how to integrate post-quantum transfers
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { pqCrypto } from '@/lib/crypto/pqc-crypto';
import { fileEncryption } from '@/lib/crypto/file-encryption-pqc';
import { Shield, Send, Download, Key, Lock, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Local Crypto Test Component
 * Tests the crypto primitives without needing WebRTC
 */
function LocalCryptoTest({ onBack }: { onBack: () => void }) {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Hash function
      try {
        const data = new TextEncoder().encode('test data');
        const hash = pqCrypto.hash(data);
        const passed = hash.length === 32 && hash.some(b => b !== 0);
        testResults.push({
          name: 'SHA-256 Hash',
          passed,
          details: passed
            ? `Hash: ${Array.from(hash.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...`
            : 'Hash returned zeros or wrong length',
        });
      } catch (e) {
        testResults.push({ name: 'SHA-256 Hash', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 2: Keypair Generation
      let senderKeys, receiverKeys;
      try {
        senderKeys = await pqCrypto.generateHybridKeypair();
        receiverKeys = await pqCrypto.generateHybridKeypair();
        const passed =
          senderKeys.kyber.publicKey.length === 1184 &&
          senderKeys.kyber.secretKey.length === 2400 &&
          senderKeys.x25519.publicKey.length === 32;
        testResults.push({
          name: 'Hybrid Keypair Generation',
          passed,
          details: passed
            ? `Kyber: ${senderKeys.kyber.publicKey.length}B pub, ${senderKeys.kyber.secretKey.length}B sec | X25519: ${senderKeys.x25519.publicKey.length}B`
            : 'Invalid key sizes',
        });
      } catch (e) {
        testResults.push({ name: 'Hybrid Keypair Generation', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 3: Encapsulation
      let ciphertext, senderSecret;
      try {
        if (!receiverKeys) throw new Error('No receiver keys');
        const result = await pqCrypto.encapsulate(pqCrypto.getPublicKey(receiverKeys));
        ciphertext = result.ciphertext;
        senderSecret = result.sharedSecret;
        const passed =
          ciphertext.kyberCiphertext.length === 1088 &&
          ciphertext.x25519EphemeralPublic.length === 32 &&
          senderSecret.length === 32;
        testResults.push({
          name: 'Hybrid Encapsulation',
          passed,
          details: passed
            ? `Ciphertext: ${ciphertext.kyberCiphertext.length}B Kyber + ${ciphertext.x25519EphemeralPublic.length}B X25519`
            : 'Invalid ciphertext sizes',
        });
      } catch (e) {
        testResults.push({ name: 'Hybrid Encapsulation', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 4: Decapsulation
      let receiverSecret;
      try {
        if (!ciphertext || !receiverKeys) throw new Error('Missing data');
        receiverSecret = await pqCrypto.decapsulate(ciphertext, receiverKeys);
        const passed = receiverSecret.length === 32;
        testResults.push({
          name: 'Hybrid Decapsulation',
          passed,
          details: passed
            ? `Shared secret: ${receiverSecret.length}B`
            : 'Invalid shared secret',
        });
      } catch (e) {
        testResults.push({ name: 'Hybrid Decapsulation', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 5: Shared Secret Match
      try {
        if (!senderSecret || !receiverSecret) throw new Error('Missing secrets');
        const passed = pqCrypto.constantTimeEqual(senderSecret, receiverSecret);
        testResults.push({
          name: 'Shared Secret Match',
          passed,
          details: passed
            ? 'Sender and receiver derived identical secrets'
            : 'MISMATCH: Secrets do not match!',
        });
      } catch (e) {
        testResults.push({ name: 'Shared Secret Match', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 6: Session Key Derivation
      let sessionKeys;
      try {
        if (!senderSecret) throw new Error('No shared secret');
        sessionKeys = pqCrypto.deriveSessionKeys(senderSecret);
        const passed =
          sessionKeys.encryptionKey.length === 32 &&
          sessionKeys.authKey.length === 32 &&
          sessionKeys.sessionId.length === 16;
        testResults.push({
          name: 'HKDF Key Derivation',
          passed,
          details: passed
            ? `Encryption: ${sessionKeys.encryptionKey.length}B, Auth: ${sessionKeys.authKey.length}B, Session: ${sessionKeys.sessionId.length}B`
            : 'Invalid derived key sizes',
        });
      } catch (e) {
        testResults.push({ name: 'HKDF Key Derivation', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 7: AES-256-GCM Encryption/Decryption
      try {
        if (!sessionKeys) throw new Error('No session keys');
        const plaintext = new TextEncoder().encode('Hello, Post-Quantum World!');
        const encrypted = await pqCrypto.encrypt(plaintext, sessionKeys.encryptionKey);
        const decrypted = await pqCrypto.decrypt(encrypted, sessionKeys.encryptionKey);
        const passed = new TextDecoder().decode(decrypted) === 'Hello, Post-Quantum World!';
        testResults.push({
          name: 'AES-256-GCM Encrypt/Decrypt',
          passed,
          details: passed
            ? `Encrypted ${plaintext.length}B → ${encrypted.ciphertext.length}B → decrypted OK`
            : 'Decryption failed or data mismatch',
        });
      } catch (e) {
        testResults.push({ name: 'AES-256-GCM Encrypt/Decrypt', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 8: Key Serialization Round-trip
      try {
        if (!senderKeys) throw new Error('No sender keys');
        const publicKey = pqCrypto.getPublicKey(senderKeys);
        const serialized = pqCrypto.serializePublicKey(publicKey);
        const deserialized = pqCrypto.deserializePublicKey(serialized);
        const passed =
          pqCrypto.constantTimeEqual(publicKey.kyberPublicKey, deserialized.kyberPublicKey) &&
          pqCrypto.constantTimeEqual(publicKey.x25519PublicKey, deserialized.x25519PublicKey);
        testResults.push({
          name: 'Key Serialization Round-trip',
          passed,
          details: passed
            ? `Serialized: ${serialized.length}B, round-trip OK`
            : 'Serialization/deserialization mismatch',
        });
      } catch (e) {
        testResults.push({ name: 'Key Serialization Round-trip', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 9: File Encryption (simulated transfer)
      try {
        if (!sessionKeys) throw new Error('No session keys');
        // Create a test file
        const testContent = 'Hello, Post-Quantum World! This is a test file for encryption.';
        const testBlob = new Blob([testContent], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

        const encrypted = await fileEncryption.encrypt(testFile, sessionKeys.encryptionKey);
        const passed =
          encrypted.chunks.length > 0 &&
          encrypted.metadata.encryptedName.length > 0 && // Changed from originalName - it's encrypted for privacy
          encrypted.metadata.fileHash.length === 32;
        testResults.push({
          name: 'File Encryption',
          passed,
          details: passed
            ? `${encrypted.chunks.length} chunk(s), hash: ${Array.from(encrypted.metadata.fileHash.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')}...`
            : 'File encryption failed',
        });
      } catch (e) {
        testResults.push({ name: 'File Encryption', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 10: File Decryption
      let decryptedBlob: Blob | null = null;
      try {
        if (!sessionKeys) throw new Error('No session keys');
        const testContent = 'Hello, Post-Quantum World! This is a test file for encryption.';
        const testBlob = new Blob([testContent], { type: 'text/plain' });
        const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

        const encrypted = await fileEncryption.encrypt(testFile, sessionKeys.encryptionKey);
        decryptedBlob = await fileEncryption.decrypt(encrypted, sessionKeys.encryptionKey);

        const passed = decryptedBlob.size === testContent.length;
        testResults.push({
          name: 'File Decryption',
          passed,
          details: passed
            ? `Decrypted: ${decryptedBlob.size}B`
            : `Size mismatch: expected ${testContent.length}, got ${decryptedBlob.size}`,
        });
      } catch (e) {
        testResults.push({ name: 'File Decryption', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      // Test 11: File Integrity (content match)
      try {
        if (!decryptedBlob) throw new Error('No decrypted blob');
        const testContent = 'Hello, Post-Quantum World! This is a test file for encryption.';
        const decryptedText = await decryptedBlob.text();
        const passed = decryptedText === testContent;
        testResults.push({
          name: 'File Integrity Verification',
          passed,
          details: passed
            ? 'Decrypted content matches original exactly'
            : `Content mismatch: "${decryptedText.slice(0, 20)}..."`,
        });
      } catch (e) {
        testResults.push({ name: 'File Integrity Verification', passed: false, details: String(e) });
      }
      setResults([...testResults]);

      const allPassed = testResults.every(r => r.passed);
      if (allPassed) {
        toast.success('All crypto tests passed!');
      } else {
        toast.error('Some tests failed');
      }
    } catch (e) {
      toast.error('Test error: ' + String(e));
    } finally {
      setTesting(false);
    }
  };

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Crypto Test Suite</h3>
            <p className="text-sm text-muted-foreground">
              Verify all PQC primitives work correctly
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={runTests}
          disabled={testing}
        >
          <FlaskConical className="w-5 h-5 mr-2" />
          {testing ? 'Running Tests...' : 'Run All Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Results</span>
              <Badge variant={passedCount === totalCount ? 'default' : 'destructive'}>
                {passedCount}/{totalCount} passed
              </Badge>
            </div>

            {results.map((result, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${result.passed
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {result.passed
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />
                  }
                  <span className="font-medium text-sm">{result.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {result.details}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Manual Key Exchange Component
 * Proper Kyber KEM flow: public key + ciphertext exchange
 */
function ManualKeyExchange({
  role,
  onBack,
  onSecured
}: {
  role: 'send' | 'receive';
  onBack: () => void;
  onSecured: (sessionKeys: { encryptionKey: Uint8Array; authKey: Uint8Array }) => void;
}) {
  const [step, setStep] = useState(1);
  const [myKeys, setMyKeys] = useState<Awaited<ReturnType<typeof pqCrypto.generateHybridKeypair>> | null>(null);
  const [myPublicKeyHex, setMyPublicKeyHex] = useState('');
  const [peerPublicKeyHex, setPeerPublicKeyHex] = useState('');
  const [ciphertextHex, setCiphertextHex] = useState('');
  const [sharedSecret, setSharedSecret] = useState<Uint8Array | null>(null);
  const [sessionKeys, setSessionKeys] = useState<ReturnType<typeof pqCrypto.deriveSessionKeys> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Generate keypair on mount
  useEffect(() => {
    const init = async () => {
      try {
        const keys = await pqCrypto.generateHybridKeypair();
        setMyKeys(keys);
        const serialized = pqCrypto.serializeKeypairPublic(keys);
        setMyPublicKeyHex(Array.from(serialized).map(b => b.toString(16).padStart(2, '0')).join(''));
        toast.success('Keypair generated');
      } catch (e) {
        setError(String(e));
      }
    };
    init();
  }, []);

  // Sender: Step 2 - Encapsulate with peer's public key
  const handleSenderEncapsulate = async () => {
    if (!peerPublicKeyHex.trim()) {
      toast.error('Enter receiver\'s public key');
      return;
    }
    try {
      // Clean the hex string - remove whitespace and validate
      const cleanHex = peerPublicKeyHex.replace(/\s/g, '').toLowerCase();
      if (!/^[0-9a-f]+$/.test(cleanHex)) {
        throw new Error('Invalid hex characters in public key');
      }
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Public key hex has odd length');
      }

      const peerKeyBytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      const peerPublicKey = pqCrypto.deserializePublicKey(peerKeyBytes);
      const { ciphertext, sharedSecret: secret } = await pqCrypto.encapsulate(peerPublicKey);
      setSharedSecret(secret);

      const serializedCt = pqCrypto.serializeCiphertext(ciphertext);
      setCiphertextHex(Array.from(serializedCt).map(b => b.toString(16).padStart(2, '0')).join(''));

      const keys = pqCrypto.deriveSessionKeys(secret);
      setSessionKeys(keys);

      setStep(3);
      toast.success('Encapsulation complete! Share the ciphertext.');
    } catch (e) {
      setError(String(e));
      toast.error('Encapsulation failed: ' + String(e));
    }
  };

  // Receiver: Step 2 - Decapsulate with ciphertext
  const handleReceiverDecapsulate = async () => {
    if (!ciphertextHex.trim()) {
      toast.error('Enter sender\'s ciphertext');
      return;
    }
    if (!myKeys) {
      toast.error('Keys not ready');
      return;
    }
    try {
      // Clean the hex string - remove whitespace and validate
      const cleanHex = ciphertextHex.replace(/\s/g, '').toLowerCase();
      if (!/^[0-9a-f]+$/.test(cleanHex)) {
        throw new Error('Invalid hex characters in ciphertext');
      }
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Ciphertext hex has odd length');
      }

      const ctBytes = new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
      const ciphertext = pqCrypto.deserializeCiphertext(ctBytes);
      const secret = await pqCrypto.decapsulate(ciphertext, myKeys);
      setSharedSecret(secret);

      const keys = pqCrypto.deriveSessionKeys(secret);
      setSessionKeys(keys);

      setStep(3);
      toast.success('Decapsulation complete! Session secured.');
      onSecured(keys);
    } catch (e) {
      setError(String(e));
      toast.error('Decapsulation failed: ' + String(e));
    }
  };

  // Sender: Confirm session after receiver is ready
  const handleSenderConfirm = () => {
    if (sessionKeys) {
      onSecured(sessionKeys);
      toast.success('Session secured!');
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {role === 'send' ? 'Send File' : 'Receive File'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Manual key exchange (step {step}/3)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={step === 3 ? 'default' : 'secondary'}>
              {step === 3 ? <Lock className="w-3 h-3 mr-1" /> : <Key className="w-3 h-3 mr-1" />}
              {step === 3 ? 'Secured' : 'Negotiating'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Step 1: Show my public key */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
            Your Public Key
          </label>
          <div className="flex gap-2">
            <Input
              value={myPublicKeyHex}
              readOnly
              className="font-mono text-xs"
              placeholder="Generating..."
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(myPublicKeyHex);
                toast.success('Copied!');
              }}
              disabled={!myPublicKeyHex}
            >
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Share this with the other party</p>
        </div>

        {/* Step 2: Enter peer's public key (both roles) */}
        {role === 'send' && step < 3 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
              Receiver's Public Key
            </label>
            <div className="flex gap-2">
              <Input
                value={peerPublicKeyHex}
                onChange={(e) => setPeerPublicKeyHex(e.target.value)}
                className="font-mono text-xs"
                placeholder="Paste receiver's public key..."
              />
              <Button onClick={handleSenderEncapsulate} disabled={!peerPublicKeyHex}>
                Encapsulate
              </Button>
            </div>
          </div>
        )}

        {role === 'receive' && step < 3 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
              Sender's Ciphertext
            </label>
            <div className="flex gap-2">
              <Input
                value={ciphertextHex}
                onChange={(e) => setCiphertextHex(e.target.value)}
                className="font-mono text-xs"
                placeholder="Paste sender's ciphertext..."
              />
              <Button onClick={handleReceiverDecapsulate} disabled={!ciphertextHex}>
                Decapsulate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The sender will share this after receiving your public key
            </p>
          </div>
        )}

        {/* Step 3 (Sender): Show ciphertext to share */}
        {role === 'send' && step === 3 && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-500 dark:bg-green-600 text-primary-foreground flex items-center justify-center text-xs">3</span>
                Ciphertext (share with receiver)
              </label>
              <div className="flex gap-2">
                <Input
                  value={ciphertextHex}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(ciphertextHex);
                    toast.success('Ciphertext copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this ciphertext to the receiver, then click Confirm
              </p>
            </div>
            <Button className="w-full" onClick={handleSenderConfirm}>
              <Lock className="w-4 h-4 mr-2" />
              Confirm Session Secured
            </Button>
          </>
        )}

        {/* Step 3 (Receiver): Session ready */}
        {role === 'receive' && step === 3 && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">Session Secured!</p>
            <p className="text-xs text-muted-foreground">
              Ready to receive encrypted files
            </p>
          </div>
        )}

        {/* Session info */}
        {sessionKeys && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Session ID: {Array.from(sessionKeys.sessionId.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('')}...
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function PQCTransferDemo() {
  const [mode, setMode] = useState<'send' | 'receive' | 'test' | null>(null);
  const [sessionKeys, setSessionKeys] = useState<{ encryptionKey: Uint8Array; authKey: Uint8Array } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptedFile, setEncryptedFile] = useState<Awaited<ReturnType<typeof fileEncryption.encrypt>> | null>(null);

  const handleSecured = (keys: { encryptionKey: Uint8Array; authKey: Uint8Array }) => {
    setSessionKeys(keys);
  };

  const handleEncryptFile = async () => {
    if (!selectedFile || !sessionKeys) return;
    setIsEncrypting(true);
    try {
      const encrypted = await fileEncryption.encrypt(selectedFile, sessionKeys.encryptionKey);
      setEncryptedFile(encrypted);
      toast.success('File encrypted!', {
        description: `${encrypted.chunks.length} chunk(s), ready to send`,
      });
    } catch (e) {
      toast.error('Encryption failed: ' + String(e));
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setEncryptedFile(null);
    }
  };

  // Test mode
  if (mode === 'test') {
    return <LocalCryptoTest onBack={() => setMode(null)} />;
  }

  if (!mode) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Post-Quantum Secure Transfer</h2>
            <p className="text-muted-foreground">
              Quantum-resistant encryption with ML-KEM-768 + X25519
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => setMode('send')}>
              <Send className="w-5 h-5 mr-2" />
              Send File
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode('receive')}>
              <Download className="w-5 h-5 mr-2" />
              Receive File
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={() => setMode('test')} className="text-muted-foreground">
              <FlaskConical className="w-4 h-4 mr-2" />
              Test Crypto Primitives
            </Button>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">ML-KEM-768</Badge>
              <Badge variant="secondary">X25519</Badge>
              <Badge variant="secondary">AES-256-GCM</Badge>
              <Badge variant="secondary">BLAKE3</Badge>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // If session not yet secured, show the key exchange UI
  if (!sessionKeys) {
    return (
      <ManualKeyExchange
        role={mode}
        onBack={() => setMode(null)}
        onSecured={handleSecured}
      />
    );
  }

  // Session secured - show file operations
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {mode === 'send' ? 'Send File' : 'Receive File'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Session secured - ready for file transfer
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">
              <Lock className="w-3 h-3 mr-1" />
              Secured
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => {
              setMode(null);
              setSessionKeys(null);
              setSelectedFile(null);
              setEncryptedFile(null);
            }}>
              ← Back
            </Button>
          </div>
        </div>

        {/* Send file (sender only) */}
        {mode === 'send' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select File</label>
              <Input
                type="file"
                onChange={handleFileSelect}
                disabled={isEncrypting}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleEncryptFile}
              disabled={!selectedFile || isEncrypting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isEncrypting ? 'Encrypting...' : 'Encrypt File'}
            </Button>

            {encryptedFile && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium">File Encrypted!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {encryptedFile.chunks.length} chunk(s) ready.
                  Hash: {Array.from(encryptedFile.metadata.fileHash.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('')}...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  (In production, these chunks would be sent via WebRTC)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Receive file (receiver only) */}
        {mode === 'receive' && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Ready to receive</p>
            <p className="text-xs text-muted-foreground">
              Session secured. (In production, files would arrive via WebRTC)
            </p>
          </div>
        )}

        {/* Security info */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            End-to-end encrypted with quantum-resistant cryptography
          </p>
        </div>
      </div>
    </Card>
  );
}
