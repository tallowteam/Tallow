'use client';

import { useState, useCallback, useEffect } from 'react';
import { secureLog } from '../utils/secure-logger';
import { transferMetadata, TransferMetadata, EXPIRATION_PRESETS } from '../transfer/transfer-metadata';
import {
  encryptFileWithPasswordLayer,
  decryptPasswordProtectedFile,
  PasswordProtectedFile,
} from '../crypto/password-file-encryption';
import {
  signFile,
  verifyFileSignature,
  FileSignature,
  serializeSignature,
  deserializeSignature,
  getPublicKeyFingerprint,
} from '../crypto/digital-signatures';

export interface AdvancedTransferOptions {
  password?: string;
  passwordHint?: string;
  expiration?: keyof typeof EXPIRATION_PRESETS | 'never';
  oneTime?: boolean;
  signed?: boolean;
}

export function useAdvancedTransfer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMetadata, setCurrentMetadata] = useState<TransferMetadata | null>(null);

  /**
   * Prepare file for transfer with advanced options
   */
  const prepareFileTransfer = useCallback(
    async (
      file: File,
      sessionKey: Uint8Array,
      options: AdvancedTransferOptions
    ): Promise<{
      encryptedFile: PasswordProtectedFile;
      metadata: TransferMetadata;
      signature?: FileSignature;
    }> => {
      setIsProcessing(true);

      try {
        const transferId = crypto.randomUUID();

        // Read file data for signing (if needed)
        let signature: FileSignature | undefined;
        if (options.signed) {
          const fileBuffer = await file.arrayBuffer();
          const fileData = new Uint8Array(fileBuffer);
          signature = await signFile(fileData);
        }

        // Encrypt file with optional password layer
        let encryptedFile: PasswordProtectedFile;
        if (options.password) {
          encryptedFile = await encryptFileWithPasswordLayer(
            file,
            sessionKey,
            options.password,
            options.passwordHint
          );
        } else {
          // Import standard encryption
          const { encryptFile } = await import('../crypto/file-encryption-pqc');
          encryptedFile = await encryptFile(file, sessionKey);
        }

        // Calculate expiration timestamp
        let expiresAt: number | undefined;
        let expirationDuration: number | undefined;
        if (options.expiration && options.expiration !== 'never') {
          expirationDuration = EXPIRATION_PRESETS[options.expiration];
          expiresAt = Date.now() + expirationDuration;
        }

        // Create metadata
        const metadata: TransferMetadata = {
          transferId,
          hasPassword: !!options.password,
          ...(options.passwordHint ? { passwordHint: options.passwordHint } : {}),
          ...(expiresAt !== undefined ? { expiresAt } : {}),
          ...(expirationDuration !== undefined ? { expirationDuration } : {}),
          oneTimeTransfer: options.oneTime || false,
          downloadCount: 0,
          ...(options.oneTime ? { maxDownloads: 1 } : {}),
          isSigned: options.signed || false,
          ...(signature ? { signatureData: serializeSignature(signature) } : {}),
          ...(signature ? { senderPublicKey: Array.from(signature.publicKey) } : {}),
          createdAt: Date.now(),
          fileName: file.name,
          fileSize: file.size,
        };

        // Store metadata
        await transferMetadata.setMetadata(transferId, metadata);
        setCurrentMetadata(metadata);

        return { encryptedFile, metadata, ...(signature ? { signature } : {}) };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Decrypt and verify received file
   */
  const decryptReceivedFile = useCallback(
    async (
      encryptedFile: PasswordProtectedFile,
      sessionKey: Uint8Array,
      metadata: TransferMetadata,
      password?: string
    ): Promise<{
      blob: Blob;
      verified: boolean;
      fingerprint?: string;
    }> => {
      setIsProcessing(true);

      try {
        // Decrypt file
        let blob: Blob;
        if (metadata.hasPassword) {
          if (!password) {
            throw new Error('Password required for decryption');
          }
          blob = await decryptPasswordProtectedFile(encryptedFile, sessionKey, password);
        } else {
          const { decryptFile } = await import('../crypto/file-encryption-pqc');
          blob = await decryptFile(encryptedFile, sessionKey);
        }

        // Verify signature if present
        let verified = false;
        let fingerprint: string | undefined;

        if (metadata.isSigned && metadata.signatureData) {
          const signature = deserializeSignature(metadata.signatureData);
          const fileBuffer = await blob.arrayBuffer();
          const fileData = new Uint8Array(fileBuffer);

          verified = verifyFileSignature(fileData, signature);
          fingerprint = getPublicKeyFingerprint(signature.publicKey);
        }

        // Update download count
        const shouldDelete = await transferMetadata.incrementDownloadCount(metadata.transferId);

        if (shouldDelete) {
          secureLog.log('Transfer auto-deleted (one-time or max downloads reached)');
        }

        return { blob, verified, ...(fingerprint ? { fingerprint } : {}) };
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  /**
   * Check if transfer is still valid (not expired, not exhausted)
   */
  const isTransferValid = useCallback((metadata: TransferMetadata): boolean => {
    // Check expiration
    if (metadata.expiresAt && metadata.expiresAt < Date.now()) {
      return false;
    }

    // Check download exhaustion
    if (metadata.oneTimeTransfer && (metadata.downloadCount || 0) >= 1) {
      return false;
    }

    if (metadata.maxDownloads && (metadata.downloadCount || 0) >= metadata.maxDownloads) {
      return false;
    }

    return true;
  }, []);

  /**
   * Get all active transfers
   */
  const getActiveTransfers = useCallback(async (): Promise<TransferMetadata[]> => {
    return transferMetadata.getAllActive();
  }, []);

  /**
   * Clean up expired transfers
   */
  const cleanupExpired = useCallback(async (): Promise<void> => {
    await transferMetadata.cleanupExpired();
  }, []);

  /**
   * Remove specific transfer metadata
   */
  const removeTransfer = useCallback(async (transferId: string): Promise<void> => {
    await transferMetadata.removeMetadata(transferId);
  }, []);

  // Auto-cleanup on mount
  useEffect(() => {
    cleanupExpired();
  }, [cleanupExpired]);

  return {
    isProcessing,
    currentMetadata,
    prepareFileTransfer,
    decryptReceivedFile,
    isTransferValid,
    getActiveTransfers,
    cleanupExpired,
    removeTransfer,
  };
}

export default useAdvancedTransfer;
