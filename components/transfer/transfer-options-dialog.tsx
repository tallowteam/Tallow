'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, Clock, Download, Shield, FileSignature } from 'lucide-react';
import { EXPIRATION_PRESETS } from '@/lib/transfer/transfer-metadata';

interface TransferOptions {
  passwordProtected: boolean;
  expiration: keyof typeof EXPIRATION_PRESETS | 'never';
  oneTime: boolean;
  signed: boolean;
}

interface TransferOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  onConfirm: (options: TransferOptions) => void;
  onCancel?: () => void;
}

export function TransferOptionsDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  onCancel,
}: TransferOptionsDialogProps) {
  const [options, setOptions] = useState<TransferOptions>({
    passwordProtected: false,
    expiration: 'never',
    oneTime: false,
    signed: true, // Default to signed for security
  });
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(() => {
      onConfirm(options);
      onOpenChange(false);
    });
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#191610] dark:text-[#fefefc]">
            <div className="p-2 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20">
              <Settings2 className="w-5 h-5 text-[#b2987d]" />
            </div>
            <span>Transfer Options</span>
          </DialogTitle>
          <DialogDescription>
            {fileName
              ? `Configure security options for "${fileName}"`
              : 'Configure security and privacy options for this transfer'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Password Protection */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-5 h-5 text-[#b2987d] mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="password-toggle" className="text-base cursor-pointer text-[#191610] dark:text-[#fefefc]">
                  Password Protection
                </Label>
                <p className="text-sm text-[#b2987d]">
                  Require password to decrypt file
                </p>
              </div>
            </div>
            <Switch
              id="password-toggle"
              checked={options.passwordProtected}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, passwordProtected: checked }))
              }
            />
          </div>

          {/* Digital Signature */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <FileSignature className="w-5 h-5 text-[#b2987d] mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="sign-toggle" className="text-base cursor-pointer text-[#191610] dark:text-[#fefefc]">
                  Digital Signature
                </Label>
                <p className="text-sm text-[#b2987d]">
                  Sign file to verify authenticity
                </p>
              </div>
            </div>
            <Switch
              id="sign-toggle"
              checked={options.signed}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, signed: checked }))
              }
            />
          </div>

          {/* One-Time Transfer */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <Download className="w-5 h-5 text-[#b2987d] mt-0.5" />
              <div className="space-y-1">
                <Label htmlFor="onetime-toggle" className="text-base cursor-pointer text-[#191610] dark:text-[#fefefc]">
                  One-Time Transfer
                </Label>
                <p className="text-sm text-[#b2987d]">
                  Auto-delete after first download
                </p>
              </div>
            </div>
            <Switch
              id="onetime-toggle"
              checked={options.oneTime}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, oneTime: checked }))
              }
            />
          </div>

          {/* Expiration Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#b2987d] mt-0.5" />
              <div className="space-y-1 flex-1">
                <Label htmlFor="expiration" className="text-base text-[#191610] dark:text-[#fefefc]">
                  Auto-Expiration
                </Label>
                <p className="text-sm text-[#b2987d]">
                  Automatically delete transfer after time period
                </p>
              </div>
            </div>
            <Select
              value={options.expiration}
              onValueChange={(value) =>
                setOptions((prev) => ({
                  ...prev,
                  expiration: value as keyof typeof EXPIRATION_PRESETS | 'never',
                }))
              }
            >
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never expire</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl space-y-1
            bg-gradient-to-br from-[#b2987d]/5 to-[#b2987d]/10
            dark:from-[#b2987d]/10 dark:to-[#b2987d]/5
            border border-[#e5dac7] dark:border-[#544a36]">
            <p className="text-sm font-semibold text-[#191610] dark:text-[#fefefc]">Selected Options:</p>
            <ul className="text-xs text-[#b2987d] space-y-0.5">
              {options.passwordProtected && <li>• Password protected</li>}
              {options.signed && <li>• Digitally signed</li>}
              {options.oneTime && <li>• One-time download</li>}
              {options.expiration !== 'never' && (
                <li>
                  • Expires in{' '}
                  {options.expiration === '1h'
                    ? '1 hour'
                    : options.expiration === '24h'
                    ? '24 hours'
                    : options.expiration === '7d'
                    ? '7 days'
                    : '30 days'}
                </li>
              )}
              {!options.passwordProtected &&
                !options.oneTime &&
                options.expiration === 'never' && <li>• Standard transfer</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isPending ? 'Processing...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransferOptionsDialog;
