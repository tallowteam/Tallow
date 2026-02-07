'use client';

import { useState } from 'react';
import { BiometricAuth } from './BiometricAuth';
import type { AuthenticationResult } from '@/lib/auth/webauthn';
import styles from './BiometricAuthExample.module.css';

/**
 * BiometricAuth Example Component
 *
 * Demonstrates the full capabilities of the WebAuthn/FIDO2
 * biometric authentication system with different use cases.
 */
export function BiometricAuthExample() {
  const [authResult, setAuthResult] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'authenticate' | 'register'>('authenticate');

  const handleAuthSuccess = (result: AuthenticationResult) => {
    setAuthResult(`✅ Authentication successful! Credential ID: ${result.credentialId.slice(0, 16)}...`);
    setTimeout(() => setAuthResult(null), 5000);
  };

  const handleAuthError = (error: string) => {
    setAuthResult(`❌ Authentication failed: ${error}`);
    setTimeout(() => setAuthResult(null), 5000);
  };

  const handleRegisterSuccess = (credentialId: string) => {
    setAuthResult(`✅ Registration successful! Credential ID: ${credentialId.slice(0, 16)}...`);
    setTimeout(() => {
      setAuthResult(null);
      setCurrentMode('authenticate');
    }, 3000);
  };

  const handleRegisterError = (error: string) => {
    setAuthResult(`❌ Registration failed: ${error}`);
    setTimeout(() => setAuthResult(null), 5000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Biometric Authentication Demo</h2>
        <p className={styles.description}>
          Test WebAuthn/FIDO2 biometric authentication with Touch ID, Face ID, Windows Hello, or fingerprint sensors.
        </p>
      </div>

      {/* Result Banner */}
      {authResult && (
        <div className={styles.resultBanner}>
          <span>{authResult}</span>
        </div>
      )}

      {/* Mode Toggle */}
      <div className={styles.modeToggle}>
        <button
          type="button"
          onClick={() => setCurrentMode('authenticate')}
          className={`${styles.modeButton} ${currentMode === 'authenticate' ? styles.modeButtonActive : ''}`}
        >
          Authenticate
        </button>
        <button
          type="button"
          onClick={() => setCurrentMode('register')}
          className={`${styles.modeButton} ${currentMode === 'register' ? styles.modeButtonActive : ''}`}
        >
          Register
        </button>
      </div>

      {/* Authentication Examples */}
      <div className={styles.examples}>
        {/* Example 1: Full Featured */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Full Featured</h3>
          <p className={styles.exampleDescription}>
            Complete authentication interface with device management
          </p>
          <BiometricAuth
            username="demo-user"
            displayName="Demo User"
            mode={currentMode}
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
            onRegisterSuccess={handleRegisterSuccess}
            onRegisterError={handleRegisterError}
            showDeviceList={true}
            size="md"
          />
        </div>

        {/* Example 2: Simple Authentication Button */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Simple Button</h3>
          <p className={styles.exampleDescription}>
            Minimal authentication button without device list
          </p>
          <BiometricAuth
            username="simple-user"
            displayName="Simple User"
            mode="authenticate"
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
            showDeviceList={false}
            size="md"
            buttonText="Verify with Biometric"
          />
        </div>

        {/* Example 3: Small Button */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Small Size</h3>
          <p className={styles.exampleDescription}>
            Compact authentication button for inline use
          </p>
          <BiometricAuth
            username="compact-user"
            displayName="Compact User"
            mode="authenticate"
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
            showDeviceList={false}
            size="sm"
            buttonText="Quick Verify"
          />
        </div>

        {/* Example 4: Large Button */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Large Size</h3>
          <p className={styles.exampleDescription}>
            Prominent authentication button for primary actions
          </p>
          <BiometricAuth
            username="large-user"
            displayName="Large User"
            mode="authenticate"
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
            showDeviceList={false}
            size="lg"
            buttonText="Authenticate"
          />
        </div>
      </div>

      {/* Security Notes */}
      <div className={styles.securityNotes}>
        <h3 className={styles.securityTitle}>Security Features</h3>
        <ul className={styles.securityList}>
          <li>
            <strong>Privacy First:</strong> Biometric data never leaves your device
          </li>
          <li>
            <strong>Hardware-Backed:</strong> Uses secure enclave/TPM when available
          </li>
          <li>
            <strong>Phishing-Resistant:</strong> Cryptographic authentication prevents credential theft
          </li>
          <li>
            <strong>Multi-Device:</strong> Register multiple devices for flexibility
          </li>
          <li>
            <strong>Standards-Based:</strong> Built on W3C WebAuthn and FIDO2 specifications
          </li>
        </ul>
      </div>

      {/* Browser Support */}
      <div className={styles.browserSupport}>
        <h3 className={styles.browserTitle}>Browser Support</h3>
        <div className={styles.browsers}>
          <div className={styles.browser}>
            <span className={styles.browserName}>Chrome</span>
            <span className={styles.browserVersion}>67+</span>
          </div>
          <div className={styles.browser}>
            <span className={styles.browserName}>Firefox</span>
            <span className={styles.browserVersion}>60+</span>
          </div>
          <div className={styles.browser}>
            <span className={styles.browserName}>Safari</span>
            <span className={styles.browserVersion}>14+</span>
          </div>
          <div className={styles.browser}>
            <span className={styles.browserName}>Edge</span>
            <span className={styles.browserVersion}>18+</span>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className={styles.useCases}>
        <h3 className={styles.useCasesTitle}>Use Cases in Tallow</h3>
        <div className={styles.useCaseGrid}>
          <div className={styles.useCase}>
            <div className={styles.useCaseIcon}>🔐</div>
            <h4 className={styles.useCaseTitle}>Device Verification</h4>
            <p className={styles.useCaseDescription}>
              Verify device identity before sensitive file transfers
            </p>
          </div>
          <div className={styles.useCase}>
            <div className={styles.useCaseIcon}>👤</div>
            <h4 className={styles.useCaseTitle}>User Authentication</h4>
            <p className={styles.useCaseDescription}>
              Optional passwordless authentication for returning users
            </p>
          </div>
          <div className={styles.useCase}>
            <div className={styles.useCaseIcon}>🔑</div>
            <h4 className={styles.useCaseTitle}>Key Access Control</h4>
            <p className={styles.useCaseDescription}>
              Protect encryption keys with biometric authentication
            </p>
          </div>
          <div className={styles.useCase}>
            <div className={styles.useCaseIcon}>✅</div>
            <h4 className={styles.useCaseTitle}>Action Confirmation</h4>
            <p className={styles.useCaseDescription}>
              Require biometric confirmation for critical operations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
