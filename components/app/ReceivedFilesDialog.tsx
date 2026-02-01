'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileDown, Download, Trash2, Share2, Copy } from 'lucide-react';
import { formatFileSize } from '@/lib/hooks/use-file-transfer';
import { useWebShare, copyToClipboard } from '@/lib/hooks/use-web-share';
import { toast } from 'sonner';

interface ReceivedFile {
  name: string;
  type: string;
  size: number;
  blob: Blob;
  receivedAt: Date;
  relativePath?: string;
}

export interface ReceivedFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ReceivedFile[];
  onDownload: (file: ReceivedFile) => void;
  onClear: () => void;
}

export function ReceivedFilesDialog({
  open,
  onOpenChange,
  files,
  onDownload,
  onClear,
}: ReceivedFilesDialogProps) {
  const { share, canShare, canShareFiles } = useWebShare();

  const handleShare = async (file: ReceivedFile) => {
    try {
      // Convert blob to File
      const fileToShare = new File([file.blob], file.name, { type: file.type });

      if (canShareFiles) {
        const success = await share({
          files: [fileToShare],
          title: `Share ${file.name}`,
          text: `Received via Tallow`,
        });

        if (success) {
          toast.success('File shared successfully');
        }
      } else {
        // Fallback: copy link or show message
        toast.info('File sharing not supported', {
          description: 'Download the file to share it',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share file');
    }
  };

  const handleCopyLink = async (file: ReceivedFile) => {
    const link = `${window.location.origin}/shared/${file.name}`;
    const success = await copyToClipboard(link);

    if (success) {
      toast.success('Link copied to clipboard');
    } else {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        aria-describedby="received-files-description"
      >
        <DialogHeader>
          <DialogTitle id="received-files-title">Received Files</DialogTitle>
          <DialogDescription id="received-files-description">
            {files.length} {files.length === 1 ? 'file' : 'files'} ready to download
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" role="status">
              <FileDown className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
              <p>No received files</p>
            </div>
          ) : (
            <ul className="space-y-3" aria-label="Received files">
              {files.map((file, index) => (
                <li key={index}>
                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.type || 'Unknown type'}</span>
                          <span>•</span>
                          <time dateTime={file.receivedAt.toISOString()}>
                            {file.receivedAt.toLocaleTimeString()}
                          </time>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {canShare && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleShare(file)}
                            aria-label={`Share ${file.name}`}
                            title="Share file"
                          >
                            <Share2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        )}
                        {!canShareFiles && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(file)}
                            aria-label={`Copy link for ${file.name}`}
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(file)}
                          aria-label={`Download ${file.name}`}
                        >
                          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        {files.length > 0 && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClear}
              className="flex-1"
              aria-label="Clear all received files"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Clear All
            </Button>
            <Button
              onClick={() => {
                files.forEach(onDownload);
                onOpenChange(false);
              }}
              className="flex-1"
              aria-label="Download all files"
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Download All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
