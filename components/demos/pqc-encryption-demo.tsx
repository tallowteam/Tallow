'use client';

/**
 * PQC Encryption Demo Component
 * Interactive demonstration of post-quantum cryptography encryption/decryption
 */

import { useState } from 'react';
import { Lock, Unlock, Key, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EncryptionStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
}

export function PQCEncryptionDemo() {
  const [message, setMessage] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [keyPair, setKeyPair] = useState<{ publicKey: string; privateKey: string } | null>(null);

  const steps: EncryptionStep[] = [
    {
      step: 1,
      title: 'Generate Key Pair',
      description: 'ML-KEM-768 (Kyber) quantum-resistant key generation',
      status: keyPair ? 'complete' : currentStep === 0 ? 'active' : 'pending',
    },
    {
      step: 2,
      title: 'Encrypt Message',
      description: 'Hybrid encryption with X25519 + ML-KEM-768',
      status: encryptedMessage ? 'complete' : currentStep === 1 ? 'active' : 'pending',
    },
    {
      step: 3,
      title: 'Decrypt Message',
      description: 'Secure decryption with private key',
      status: decryptedMessage ? 'complete' : currentStep === 2 ? 'active' : 'pending',
    },
  ];

  const handleGenerateKeys = async () => {
    setIsEncrypting(true);
    setCurrentStep(0);

    // Simulate key generation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockPublicKey = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('');

    const mockPrivateKey = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join('');

    setKeyPair({
      publicKey: mockPublicKey,
      privateKey: mockPrivateKey,
    });

    setIsEncrypting(false);
    setCurrentStep(1);
  };

  const handleEncrypt = async () => {
    if (!message.trim() || !keyPair) {return;}

    setIsEncrypting(true);
    setCurrentStep(1);

    // Simulate encryption process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock encrypted message (base64-like)
    const encrypted = btoa(message)
      .split('')
      .reverse()
      .join('')
      .replace(/[A-Za-z]/g, (c) =>
        String.fromCharCode(c.charCodeAt(0) + (c <= 'Z' ? 13 : -13))
      );

    setEncryptedMessage(encrypted);
    setIsEncrypting(false);
    setCurrentStep(2);
  };

  const handleDecrypt = async () => {
    if (!encryptedMessage || !keyPair) {return;}

    setIsDecrypting(true);
    setCurrentStep(2);

    // Simulate decryption process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock decryption (reverse of encryption)
    const decrypted = atob(
      encryptedMessage
        .replace(/[A-Za-z]/g, (c) =>
          String.fromCharCode(c.charCodeAt(0) + (c <= 'Z' ? 13 : -13))
        )
        .split('')
        .reverse()
        .join('')
    );

    setDecryptedMessage(decrypted);
    setIsDecrypting(false);
  };

  const handleReset = () => {
    setMessage('');
    setEncryptedMessage('');
    setDecryptedMessage('');
    setKeyPair(null);
    setCurrentStep(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Post-Quantum Encryption Demo</h2>
        </div>
        <p className="text-muted-foreground">
          Experience hybrid encryption with ML-KEM-768 (Kyber) and X25519
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-white/5 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
        <div className="text-sm text-white">
          <strong>How it works:</strong> This demo simulates Tallow's quantum-resistant
          encryption. Real implementation uses ML-KEM-768 (NIST-approved CRYSTALS-Kyber) for
          key encapsulation and X25519 for hybrid security.
        </div>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div
            key={step.step}
            className={`p-4 rounded-lg border-2 transition-colors ${
              step.status === 'complete'
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : step.status === 'active'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'complete'
                    ? 'bg-green-500 text-white'
                    : step.status === 'active'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.step}
              </div>
              <h3 className="font-semibold text-sm">{step.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      {/* Key Generation */}
      {!keyPair && (
        <div className="p-6 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-4">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Step 1: Generate Key Pair</h3>
          </div>
          <Button onClick={handleGenerateKeys} disabled={isEncrypting}>
            {isEncrypting ? 'Generating Keys...' : 'Generate Quantum-Resistant Keys'}
          </Button>
        </div>
      )}

      {/* Display Keys */}
      {keyPair && (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Key Pair Generated</h3>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Public Key (768 bytes)
              </span>
              <div className="mt-1 p-3 bg-muted rounded font-mono text-xs break-all">
                {keyPair.publicKey.slice(0, 64)}...
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Private Key (1632 bytes)
              </span>
              <div className="mt-1 p-3 bg-muted rounded font-mono text-xs break-all">
                {keyPair.privateKey.slice(0, 64)}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Section */}
      {keyPair && !encryptedMessage && (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Step 2: Encrypt Message</h3>
          </div>

          <div>
            <label htmlFor="secret-message" className="text-sm font-medium">Your Secret Message</label>
            <textarea
              id="secret-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a secret message to encrypt..."
              className="w-full mt-2 p-3 border rounded-md min-h-[100px] bg-background"
              disabled={isEncrypting}
            />
          </div>

          <Button
            onClick={handleEncrypt}
            disabled={!message.trim() || isEncrypting}
            className="w-full"
          >
            {isEncrypting ? 'Encrypting...' : 'Encrypt with ML-KEM-768'}
          </Button>
        </div>
      )}

      {/* Encrypted Message Display */}
      {encryptedMessage && !decryptedMessage && (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Encrypted Message</h3>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Ciphertext (Quantum-Resistant)
            </span>
            <div className="mt-2 p-3 bg-muted rounded font-mono text-xs break-all">
              {encryptedMessage}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            This message is protected by ML-KEM-768 encryption and cannot be decrypted by
            quantum computers.
          </p>

          <Button
            onClick={handleDecrypt}
            disabled={isDecrypting}
            variant="outline"
            className="w-full"
          >
            {isDecrypting ? 'Decrypting...' : 'Decrypt Message'}
          </Button>
        </div>
      )}

      {/* Decrypted Message Display */}
      {decryptedMessage && (
        <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 space-y-4">
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Decryption Successful
            </h3>
          </div>

          <div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Original Message
            </span>
            <div className="mt-2 p-3 bg-white dark:bg-green-900 rounded border border-green-300 dark:border-green-700">
              {decryptedMessage}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <Shield className="h-4 w-4" />
            <span>Message decrypted successfully using private key</span>
          </div>

          <Button onClick={handleReset} variant="outline" className="w-full">
            Reset Demo
          </Button>
        </div>
      )}

      {/* Technical Details */}
      <div className="p-6 border rounded-lg bg-muted/30">
        <h3 className="font-semibold mb-3">Technical Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-primary">Algorithm:</strong>
            <p className="text-muted-foreground">ML-KEM-768 (CRYSTALS-Kyber)</p>
          </div>
          <div>
            <strong className="text-primary">Key Size:</strong>
            <p className="text-muted-foreground">768 bytes public, 1632 bytes private</p>
          </div>
          <div>
            <strong className="text-primary">Security Level:</strong>
            <p className="text-muted-foreground">NIST Level 3 (~192-bit AES)</p>
          </div>
          <div>
            <strong className="text-primary">Hybrid Mode:</strong>
            <p className="text-muted-foreground">X25519 + ML-KEM-768</p>
          </div>
        </div>
      </div>
    </div>
  );
}
