'use client';

/**
 * Toast Examples Component
 * Demonstrates all toast variants and use cases
 */

import { toast } from '@/lib/utils/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Trash2, Copy, Wifi, Shield } from 'lucide-react';

export function ToastExamples() {
  return (
    <Card className="p-6 space-y-6 rounded-2xl max-w-2xl">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Toast Notification Examples</h2>
        <p className="text-muted-foreground">
          Try different toast variants and see them in action
        </p>
      </div>

      {/* Basic Variants */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">Basic Variants</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => toast.success('Operation completed successfully!')}
            variant="outline"
            className="rounded-full"
          >
            Success Toast
          </Button>
          <Button
            onClick={() => toast.error('Something went wrong')}
            variant="outline"
            className="rounded-full"
          >
            Error Toast
          </Button>
          <Button
            onClick={() => toast.warning('Please review your settings')}
            variant="outline"
            className="rounded-full"
          >
            Warning Toast
          </Button>
          <Button
            onClick={() => toast.info('New update available')}
            variant="outline"
            className="rounded-full"
          >
            Info Toast
          </Button>
          <Button
            onClick={() => toast.loading('Processing...')}
            variant="outline"
            className="rounded-full"
          >
            Loading Toast
          </Button>
        </div>
      </div>

      {/* With Actions */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">With Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              toast.success('File downloaded', {
                action: {
                  label: 'Open',
                  onClick: () => console.log('Opening file...'),
                  icon: <Download className="w-4 h-4" />,
                },
              })
            }
            variant="outline"
            className="rounded-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Action
          </Button>
          <Button
            onClick={() =>
              toast.error('Connection failed', {
                persist: true,
                action: {
                  label: 'Retry',
                  onClick: () => {
                    toast.dismiss();
                    toast.info('Retrying connection...');
                  },
                },
              })
            }
            variant="outline"
            className="rounded-full"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Error with Retry
          </Button>
        </div>
      </div>

      {/* With Undo */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">With Undo Functionality</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              toast.withUndo('File deleted', () => {
                console.log('File restored');
              });
            }}
            variant="outline"
            className="rounded-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete with Undo
          </Button>
          <Button
            onClick={() => {
              toast.withUndo('Settings reset to defaults', () => {
                console.log('Settings restored');
              });
            }}
            variant="outline"
            className="rounded-full"
          >
            Reset with Undo
          </Button>
        </div>
      </div>

      {/* Specialized Toasts */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">Specialized Toasts</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => toast.fileCopied('document.pdf')}
            variant="outline"
            className="rounded-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            File Copied
          </Button>
          <Button
            onClick={() => toast.fileDownloaded('report.xlsx')}
            variant="outline"
            className="rounded-full"
          >
            <Download className="w-4 h-4 mr-2" />
            File Downloaded
          </Button>
          <Button
            onClick={() => toast.fileUploaded('image.png')}
            variant="outline"
            className="rounded-full"
          >
            File Uploaded
          </Button>
          <Button
            onClick={() => toast.connected('MacBook Pro')}
            variant="outline"
            className="rounded-full"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Connected
          </Button>
          <Button
            onClick={() => toast.encryptionEnabled()}
            variant="outline"
            className="rounded-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            Encryption Enabled
          </Button>
        </div>
      </div>

      {/* Persistent Toast */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">Persistent Toast</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              toast.error('Critical error occurred', {
                persist: true,
                description: 'This toast will stay until dismissed',
              })
            }
            variant="outline"
            className="rounded-full"
          >
            Persistent Error
          </Button>
          <Button
            onClick={() => toast.dismissAll()}
            variant="destructive"
            className="rounded-full"
          >
            Dismiss All
          </Button>
        </div>
      </div>

      {/* Promise Toast */}
      <div className="space-y-3">
        <h3 className="font-medium text-lg">Promise Toast</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const promise = new Promise<{ name: string }>((resolve) => {
                setTimeout(() => resolve({ name: 'file.pdf' }), 2000);
              });

              toast.promise(promise, {
                loading: 'Uploading file...',
                success: (data: { name: string }) => `${data.name} uploaded successfully!`,
                error: 'Upload failed',
              });
            }}
            variant="outline"
            className="rounded-full"
          >
            Upload Promise
          </Button>
        </div>
      </div>
    </Card>
  );
}
