'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransferOptionsDialog } from './transfer-options-dialog';
import { PasswordProtectionDialog } from './password-protection-dialog';
import { PasswordInputDialog } from './password-input-dialog';
import { TransferStatusBadges } from './transfer-status-badges';
import { useAdvancedTransfer } from '@/lib/hooks/use-advanced-transfer';
import { Shield, Send, Download, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Example component demonstrating advanced file transfer features
 * This can be integrated into the main transfer UI
 */
export function AdvancedFileTransfer() {
  const {
    isProcessing,
    currentMetadata,
    prepareFileTransfer,
    decryptReceivedFile,
    isTransferValid,
  } = useAdvancedTransfer();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Transfer options state
  const [transferOptions, setTransferOptions] = useState<{
    passwordProtected: boolean;
    expiration: string;
    oneTime: boolean;
    signed: boolean;
  } | null>(null);

  // Simulated session key (in real usage, this comes from PQC key exchange)
  const [sessionKey] = useState(() => crypto.getRandomValues(new Uint8Array(32)));

  // Mock encrypted file and metadata (in real usage, received from peer)
  const [receivedFile, setReceivedFile] = useState<any>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowOptionsDialog(true);
    }
  }, []);

  /**
   * Handle transfer options confirmation
   */
  const handleOptionsConfirm = useCallback(
    (options: any) => {
      setTransferOptions(options);

      if (options.passwordProtected) {
        setShowPasswordDialog(true);
      } else {
        handleSendFile(null);
      }
    },
    [selectedFile]
  );

  /**
   * Handle password confirmation and send file
   */
  const handlePasswordConfirm = useCallback(
    (password: string, hint?: string) => {
      handleSendFile(password, hint);
    },
    [selectedFile, transferOptions]
  );

  /**
   * Send file with advanced options
   */
  const handleSendFile = useCallback(
    async (password: string | null, hint?: string) => {
      if (!selectedFile || !transferOptions) {return;}

      try {
        const { encryptedFile, metadata, signature } = await prepareFileTransfer(
          selectedFile,
          sessionKey,
          {
            ...(password ? { password } : {}),
            ...(hint ? { passwordHint: hint } : {}),
            ...(transferOptions.expiration !== 'never' ? { expiration: transferOptions.expiration as any } : {}),
            oneTime: transferOptions.oneTime,
            signed: transferOptions.signed,
          }
        );

        // In real usage, send encryptedFile and metadata to peer via WebRTC
        // For demo, store locally
        setReceivedFile({ encryptedFile, metadata });

        toast.success('File prepared for transfer', {
          description: `${selectedFile.name} is ready to send`,
        });

        console.log('Transfer prepared:', {
          fileName: selectedFile.name,
          metadata,
          hasSigned: !!signature,
        });
      } catch (error) {
        console.error('Transfer preparation failed:', error);
        toast.error('Failed to prepare file', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [selectedFile, transferOptions, sessionKey, prepareFileTransfer]
  );

  /**
   * Handle password input for decryption
   */
  const handlePasswordSubmit = useCallback(
    async (password: string): Promise<boolean> => {
      if (!receivedFile) {return false;}

      try {
        const { blob, verified, fingerprint } = await decryptReceivedFile(
          receivedFile.encryptedFile,
          sessionKey,
          receivedFile.metadata,
          password
        );

        // Download the decrypted file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = receivedFile.metadata.fileName || 'file';
        a.click();
        URL.revokeObjectURL(url);

        toast.success('File decrypted successfully', {
          description: verified ? 'Signature verified' : 'No signature',
        });

        console.log('File decrypted:', {
          verified,
          fingerprint,
        });

        return true;
      } catch (error) {
        console.error('Decryption failed:', error);
        return false;
      }
    },
    [receivedFile, sessionKey, decryptReceivedFile]
  );

  /**
   * Receive file (decrypt and download)
   */
  const handleReceiveFile = useCallback(async () => {
    if (!receivedFile) {return;}

    // Check if transfer is still valid
    if (!isTransferValid(receivedFile.metadata)) {
      toast.error('Transfer expired or exhausted', {
        description: 'This transfer is no longer available',
      });
      return;
    }

    if (receivedFile.metadata.hasPassword) {
      setShowPasswordInput(true);
    } else {
      try {
        const { blob, verified, fingerprint } = await decryptReceivedFile(
          receivedFile.encryptedFile,
          sessionKey,
          receivedFile.metadata
        );

        // Download the decrypted file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = receivedFile.metadata.fileName || 'file';
        a.click();
        URL.revokeObjectURL(url);

        toast.success('File downloaded', {
          description: verified ? 'Signature verified' : 'No signature',
        });

        console.log('File downloaded:', {
          verified,
          fingerprint,
        });
      } catch (error) {
        console.error('Download failed:', error);
        toast.error('Failed to download file', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [receivedFile, sessionKey, decryptReceivedFile, isTransferValid]);

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Advanced File Transfer
          </CardTitle>
          <CardDescription>
            Secure file sharing with password protection, expiration, and digital signatures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Send Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send File
            </h3>

            <div className="flex items-center gap-4">
              <input
                type="file"
                onChange={handleFileSelect}
                className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isProcessing}
              />
            </div>

            {currentMetadata && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Transfer Status</span>
                  <TransferStatusBadges metadata={currentMetadata} />
                </div>
                <p className="text-xs text-muted-foreground">
                  File: {currentMetadata.fileName} ({(currentMetadata.fileSize || 0) / 1024}KB)
                </p>
              </div>
            )}
          </div>

          {/* Receive Section */}
          {receivedFile && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="w-5 h-5" />
                Receive File
              </h3>

              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Received Transfer</span>
                  <TransferStatusBadges metadata={receivedFile.metadata} />
                </div>

                <div className="space-y-1">
                  <p className="text-sm">File: {receivedFile.metadata.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(receivedFile.metadata.fileSize || 0) / 1024}KB
                  </p>

                  {receivedFile.metadata.passwordHint && (
                    <p className="text-xs text-muted-foreground">
                      Hint: {receivedFile.metadata.passwordHint}
                    </p>
                  )}
                </div>

                <Button onClick={handleReceiveFile} disabled={isProcessing} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}

          {/* Feature List */}
          <div className="pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3">Available Features</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#fefefc] mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Password Protection</p>
                  <p className="text-xs text-muted-foreground">Extra encryption layer</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Digital Signatures</p>
                  <p className="text-xs text-muted-foreground">Verify authenticity</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Download className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">One-Time Transfer</p>
                  <p className="text-xs text-muted-foreground">Auto-delete after download</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Auto-Expiration</p>
                  <p className="text-xs text-muted-foreground">Time-limited access</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TransferOptionsDialog
        open={showOptionsDialog}
        onOpenChange={setShowOptionsDialog}
        {...(selectedFile?.name ? { fileName: selectedFile.name } : {})}
        onConfirm={handleOptionsConfirm}
        onCancel={() => setSelectedFile(null)}
      />

      <PasswordProtectionDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        {...(selectedFile?.name ? { fileName: selectedFile.name } : {})}
        onConfirm={handlePasswordConfirm}
        onCancel={() => setSelectedFile(null)}
      />

      <PasswordInputDialog
        open={showPasswordInput}
        onOpenChange={setShowPasswordInput}
        {...(receivedFile?.metadata.fileName ? { fileName: receivedFile.metadata.fileName } : {})}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}

export default AdvancedFileTransfer;
