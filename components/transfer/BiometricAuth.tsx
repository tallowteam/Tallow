'use client';

import { useState, useEffect, type KeyboardEvent } from 'react';
import { webauthn, type AuthenticationResult } from '@/lib/auth/webauthn';
import { useWebAuthnStore, webauthnStore } from '@/lib/auth/webauthn-store';
import styles from './BiometricAuth.module.css';

// ============================================================================
// Type Definitions
// ============================================================================

interface BiometricAuthProps {
  /** Optional username for registration */
  username?: string;
  /** Optional display name for registration */
  displayName?: string;
  /** Callback when authentication succeeds */
  onAuthSuccess?: (result: AuthenticationResult) => void;
  /** Callback when authentication fails */
  onAuthError?: (error: string) => void;
  /** Callback when registration succeeds */
  onRegisterSuccess?: (credentialId: string) => void;
  /** Callback when registration fails */
  onRegisterError?: (error: string) => void;
  /** Show registration flow instead of authentication */
  mode?: 'authenticate' | 'register';
  /** Custom button text */
  buttonText?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show device list */
  showDeviceList?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function BiometricAuth({
  username = 'User',
  displayName = 'Tallow User',
  onAuthSuccess,
  onAuthError,
  onRegisterSuccess,
  onRegisterError,
  mode = 'authenticate',
  buttonText,
  size = 'md',
  showDeviceList = true,
}: BiometricAuthProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [biometricName, setBiometricName] = useState<string>('Biometric');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  const {
    credentials,
    addCredential,
    removeCredential,
    markCredentialUsed,
    getPrimaryCredential,
  } = useWebAuthnStore();

  // Check WebAuthn availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = webauthn.isAvailable();
      setIsAvailable(available);

      if (available) {
        const name = await webauthn.getBiometricMethodName();
        setBiometricName(name);
      }
    };

    checkAvailability();
  }, []);

  // Handle authentication
  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const primaryCredential = getPrimaryCredential();
      const result = await webauthn.authenticate(
        primaryCredential?.credentialId
      );

      if (result.success) {
        setSuccess(true);

        // Mark credential as used
        if (result.credentialId) {
          markCredentialUsed(result.credentialId);
        }

        // Callback
        onAuthSuccess?.(result);

        // Reset success state after animation
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error || 'Authentication failed');
        onAuthError?.(result.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onAuthError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const credential = await webauthn.register(username, displayName);
      const storedCredential = webauthnStore.createStoredCredential(credential);

      addCredential(storedCredential);
      setSuccess(true);
      setShowRegistration(false);

      // Callback
      onRegisterSuccess?.(storedCredential.credentialId);

      // Reset success state after animation
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      onRegisterError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle device removal
  const handleRemoveDevice = (credentialId: string) => {
    removeCredential(credentialId);
  };

  // Not available fallback
  if (isAvailable === false) {
    return (
      <div className={styles.unavailable}>
        <div className={styles.unavailableIcon}>
          <InfoIcon />
        </div>
        <div className={styles.unavailableContent}>
          <h3 className={styles.unavailableTitle}>Biometric Authentication Not Available</h3>
          <p className={styles.unavailableText}>
            Your browser or device doesn't support biometric authentication.
            Use a device with Touch ID, Face ID, Windows Hello, or fingerprint sensor.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isAvailable === null) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={`${styles.button} ${styles[size]} ${styles.loading}`}
          disabled
        >
          <LoadingIcon />
          <span>Checking availability...</span>
        </button>
      </div>
    );
  }

  // Registration mode
  if (mode === 'register' || showRegistration) {
    return (
      <div className={styles.container}>
        <div className={styles.registrationPanel}>
          <div className={styles.registrationHeader}>
            <div className={styles.registrationIcon}>
              <FingerprintIcon />
            </div>
            <h3 className={styles.registrationTitle}>
              Register {biometricName}
            </h3>
            <p className={styles.registrationDescription}>
              Enable biometric authentication for quick and secure device verification.
              Your biometric data never leaves your device.
            </p>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <ErrorIcon />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.success} role="alert">
              <CheckIcon />
              <span>Successfully registered!</span>
            </div>
          )}

          <div className={styles.registrationActions}>
            {showRegistration && (
              <button
                type="button"
                onClick={() => setShowRegistration(false)}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleRegister}
              className={`${styles.registerButton} ${styles[size]}`}
              disabled={isLoading || success}
            >
              {isLoading ? (
                <>
                  <LoadingIcon />
                  <span>Setting up...</span>
                </>
              ) : success ? (
                <>
                  <CheckIcon />
                  <span>Registered</span>
                </>
              ) : (
                <>
                  <FingerprintIcon />
                  <span>Register Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication mode
  return (
    <div className={styles.container}>
      {/* Main Authentication Button */}
      <button
        type="button"
        onClick={handleAuthenticate}
        className={`${styles.button} ${styles[size]} ${success ? styles.successState : ''}`}
        disabled={isLoading || success || credentials.length === 0}
        aria-label={buttonText || `Verify with ${biometricName}`}
      >
        {isLoading ? (
          <>
            <LoadingIcon />
            <span>Verifying...</span>
          </>
        ) : success ? (
          <>
            <CheckIcon />
            <span>Verified</span>
          </>
        ) : (
          <>
            <FingerprintIcon />
            <span>{buttonText || `Verify Identity`}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className={styles.error} role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}

      {/* No credentials registered */}
      {credentials.length === 0 && (
        <div className={styles.noCredentials}>
          <p className={styles.noCredentialsText}>
            No biometric credentials registered.
          </p>
          <button
            type="button"
            onClick={() => setShowRegistration(true)}
            className={styles.setupButton}
          >
            <PlusIcon />
            <span>Set up {biometricName}</span>
          </button>
        </div>
      )}

      {/* Device List */}
      {showDeviceList && credentials.length > 0 && (
        <div className={styles.deviceList}>
          <h4 className={styles.deviceListTitle}>Registered Devices</h4>
          <div className={styles.devices}>
            {credentials.map((credential) => (
              <DeviceCard
                key={credential.id}
                credential={credential}
                onRemove={handleRemoveDevice}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowRegistration(true)}
            className={styles.addDeviceButton}
          >
            <PlusIcon />
            <span>Add Another Device</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Device Card Component
// ============================================================================

interface DeviceCardProps {
  credential: any;
  onRemove: (credentialId: string) => void;
}

function DeviceCard({ credential, onRemove }: DeviceCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      setShowConfirm(true);
    }
  };

  const handleRemove = () => {
    onRemove(credential.credentialId);
    setShowConfirm(false);
  };

  const authenticatorIcon = webauthn.getAuthenticatorIcon(
    credential.authenticatorAttachment
  );

  const lastUsed = new Date(credential.lastUsedAt);
  const isRecent = Date.now() - credential.lastUsedAt < 24 * 60 * 60 * 1000;

  return (
    <div className={styles.deviceCard} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.deviceCardIcon}>
        {authenticatorIcon === 'fingerprint' ? (
          <FingerprintIcon />
        ) : (
          <KeyIcon />
        )}
      </div>
      <div className={styles.deviceCardInfo}>
        <h5 className={styles.deviceCardName}>{credential.deviceName}</h5>
        <p className={styles.deviceCardMeta}>
          {webauthn.getAuthenticatorTypeName(credential.authenticatorAttachment)}
          {isRecent && <span className={styles.recentBadge}>Recent</span>}
        </p>
        <p className={styles.deviceCardDate}>
          Last used: {lastUsed.toLocaleDateString()}
        </p>
      </div>
      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={styles.removeButton}
          aria-label="Remove device"
        >
          <TrashIcon />
        </button>
      ) : (
        <div className={styles.confirmRemove}>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className={styles.confirmCancel}
            aria-label="Cancel"
          >
            <CloseIcon />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className={styles.confirmDelete}
            aria-label="Confirm removal"
          >
            <CheckIcon />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Icons
// ============================================================================

function FingerprintIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      className={styles.iconSpin}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
