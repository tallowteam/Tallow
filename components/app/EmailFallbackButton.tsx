'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { EmailFallbackDialog } from './EmailFallbackDialog';
import { toast } from 'sonner';

interface EmailFallbackButtonProps {
  file: File | null;
  senderName?: string;
  onSuccess?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function EmailFallbackButton({
  file,
  senderName,
  onSuccess,
  variant = 'outline',
  size = 'default',
  className,
  showLabel = true,
}: EmailFallbackButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open && onSuccess) {
      onSuccess();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={className}
        disabled={!file}
        aria-label="Send file via email"
      >
        <Mail className="h-4 w-4" />
        {showLabel && <span className="ml-2">Send via Email</span>}
      </Button>

      <EmailFallbackDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        file={file}
        {...(senderName ? { senderName } : {})}
      />
    </>
  );
}
