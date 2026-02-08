'use client';

/**
 * SAS Verification Modal
 * Agent 012 — SAS-VERIFIER
 *
 * Displays Short Authentication String (emoji or word-based) for
 * users to verify they're connected to the correct peer.
 * Both peers see the same SAS derived from the shared secret.
 *
 * Features:
 * - Emoji mode: 6 emojis from 64-set (36-bit entropy)
 * - Word mode: 4 words from 256-word list
 * - Toggle between display modes
 * - Confirm / Reject actions
 * - Step-by-step verification instructions
 */

import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { SASCode, SASDisplayMode } from '@/lib/crypto/sas';
import styles from './SASModal.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface SASModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** The SAS code to display */
  sasCode: SASCode | null;
  /** Peer device name */
  peerName: string;
  /** Called when user confirms the SAS match */
  onConfirm: () => void;
  /** Called when user rejects (SAS mismatch) */
  onReject: () => void;
  /** Whether the peer has already confirmed */
  peerConfirmed?: boolean;
  /** Disable actions (e.g., while waiting) */
  disabled?: boolean;
}

type VerificationStatus = 'pending' | 'confirmed' | 'rejected';

// ============================================================================
// COMPONENT
// ============================================================================

export function SASModal({
  open,
  onClose,
  sasCode,
  peerName,
  onConfirm,
  onReject,
  peerConfirmed = false,
  disabled = false,
}: SASModalProps) {
  const [displayMode, setDisplayMode] = useState<SASDisplayMode>('emoji');
  const [status, setStatus] = useState<VerificationStatus>('pending');

  const handleConfirm = useCallback(() => {
    setStatus('confirmed');
    onConfirm();
  }, [onConfirm]);

  const handleReject = useCallback(() => {
    setStatus('rejected');
    onReject();
  }, [onReject]);

  if (!sasCode) {return null;}

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Verify Connection"
      size="sm"
      closeOnBackdropClick={false}
      closeOnEscape={status !== 'pending'}
    >
      <div className={styles.container}>
        {/* Peer Info */}
        <div className={styles.header}>
          <p className={styles.peerName}>Connecting to {peerName}</p>
          <p className={styles.description}>
            Compare the code below with what your peer sees.
            Both devices must show the same code.
          </p>
        </div>

        {/* Display Mode Toggle */}
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeButton} ${displayMode === 'emoji' ? styles.modeButtonActive : ''}`}
            onClick={() => setDisplayMode('emoji')}
          >
            Emoji
          </button>
          <button
            type="button"
            className={`${styles.modeButton} ${displayMode === 'words' ? styles.modeButtonActive : ''}`}
            onClick={() => setDisplayMode('words')}
          >
            Words
          </button>
        </div>

        {/* SAS Display */}
        <div className={styles.sasDisplay}>
          {displayMode === 'emoji' ? (
            <div className={styles.emojiDisplay}>
              {sasCode.emojis.map((emoji, i) => (
                <div key={i} className={styles.emojiItem}>
                  <div className={styles.emoji}>{emoji}</div>
                  <span className={styles.emojiIndex}>{i + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.wordDisplay}>
              {sasCode.wordList.map((word, i) => (
                <div key={i} className={styles.wordItem}>
                  {word}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className={styles.instructions}>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>1</span>
            <span>Ask your peer to read their code aloud or show their screen</span>
          </div>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>2</span>
            <span>Verify every {displayMode === 'emoji' ? 'emoji' : 'word'} matches exactly</span>
          </div>
          <div className={styles.instructionStep}>
            <span className={styles.stepNumber}>3</span>
            <span>If they match, tap Confirm. If not, tap Reject to abort.</span>
          </div>
        </div>

        {/* Peer Status */}
        {peerConfirmed && status === 'pending' && (
          <div className={`${styles.status} ${styles.statusConfirmed}`}>
            Your peer has confirmed the match
          </div>
        )}

        {/* Status Messages */}
        {status === 'confirmed' && !peerConfirmed && (
          <div className={`${styles.status} ${styles.statusPending}`}>
            Waiting for peer to confirm...
          </div>
        )}
        {status === 'rejected' && (
          <div className={`${styles.status} ${styles.statusRejected}`}>
            Connection rejected — possible MITM attack
          </div>
        )}

        {/* Actions */}
        {status === 'pending' && (
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.rejectButton}
              onClick={handleReject}
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reject
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={disabled}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Codes Match
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
