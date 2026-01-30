'use client';

import { useTransition } from 'react';
import { Shield, AlertTriangle, Info, Eye, FileWarning } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { MetadataInfo, getMetadataSummary } from '@/lib/privacy/metadata-stripper';

interface MetadataStripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strip: boolean) => void;
  onViewMetadata: () => void;
  files: Array<{
    name: string;
    metadata?: MetadataInfo;
  }>;
  loading?: boolean;
}

export function MetadataStripDialog({
  isOpen,
  onClose,
  onConfirm,
  onViewMetadata,
  files,
  loading = false,
}: MetadataStripDialogProps) {
  const [isPending, startTransition] = useTransition();

  const filesWithSensitiveData = files.filter(f => f.metadata?.hasSensitiveData);
  const totalSensitiveFiles = filesWithSensitiveData.length;

  // Aggregate all sensitive data types
  const sensitiveTypes = new Set<string>();
  filesWithSensitiveData.forEach(file => {
    if (file.metadata) {
      const summary = getMetadataSummary(file.metadata);
      summary.forEach(item => sensitiveTypes.add(item));
    }
  });

  const handleStripAndContinue = () => {
    startTransition(() => {
      onConfirm(true);
      onClose();
    });
  };

  const handleKeepAndContinue = () => {
    startTransition(() => {
      onConfirm(false);
      onClose();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sensitive Metadata Detected
          </DialogTitle>
          <DialogDescription>
            {totalSensitiveFiles === 1
              ? '1 file contains sensitive metadata'
              : `${totalSensitiveFiles} files contain sensitive metadata`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Card */}
          <Card className="p-4 border-amber-500/50 bg-amber-500/10">
            <div className="flex items-start gap-3">
              <FileWarning className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-500 mb-2">
                  Privacy Warning
                </p>
                <p className="text-muted-foreground">
                  The selected files contain the following sensitive information that could
                  reveal your identity or location:
                </p>
              </div>
            </div>
          </Card>

          {/* Sensitive Data Types */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Detected Information:</Label>
            <div className="flex flex-wrap gap-2">
              {Array.from(sensitiveTypes).map((type, index) => (
                <Badge key={index} variant="outline" className="border-amber-500/50">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Files List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Affected Files:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filesWithSensitiveData.slice(0, 5).map((file, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground truncate px-3 py-1.5 rounded-md bg-secondary"
                >
                  {file.name}
                </div>
              ))}
              {filesWithSensitiveData.length > 5 && (
                <div className="text-sm text-muted-foreground text-center py-1">
                  +{filesWithSensitiveData.length - 5} more files
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <Card className="p-4 border-blue-500/50 bg-blue-500/10">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500 mb-1">
                  Recommended: Strip Metadata
                </p>
                <p className="text-muted-foreground">
                  We recommend removing this information before sharing to protect your privacy.
                  Image quality will not be affected.
                </p>
              </div>
            </div>
          </Card>

          {/* View Details Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewMetadata}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Detailed Metadata
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleKeepAndContinue}
            disabled={loading || isPending}
            className="flex-1"
          >
            {isPending ? 'Processing...' : 'Keep Metadata & Send'}
          </Button>
          <Button
            onClick={handleStripAndContinue}
            disabled={loading || isPending}
            className="flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            {isPending ? 'Processing...' : 'Strip Metadata & Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MetadataStripDialog;
