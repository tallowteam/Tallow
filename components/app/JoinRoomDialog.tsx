'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode } from 'lucide-react';

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinRoom: (code: string, password?: string) => Promise<void>;
}

export function JoinRoomDialog({
  open,
  onOpenChange,
  onJoinRoom,
}: JoinRoomDialogProps) {
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleJoin = async () => {
    if (!roomCode.trim()) {return;}

    setIsJoining(true);

    try {
      await onJoinRoom(roomCode.trim().toUpperCase(), password || undefined);

      // Reset form in transition for non-blocking UI
      startTransition(() => {
        setRoomCode('');
        setPassword('');
        setNeedsPassword(false);
        onOpenChange(false);
      });
    } catch (error: any) {
      console.error('Failed to join room:', error);

      // Check if password is required
      if (error.message?.includes('password')) {
        setNeedsPassword(true);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and limit to 8 characters
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setRoomCode(formatted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Transfer Room</DialogTitle>
          <DialogDescription>
            Enter the room code to join an existing transfer room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Code */}
          <div className="space-y-2">
            <Label htmlFor="room-code">Room Code</Label>
            <Input
              id="room-code"
              placeholder="ABC12345"
              value={roomCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              maxLength={8}
              className="font-mono text-lg tracking-wider"
              autoComplete="off"
              autoFocus
              aria-required="true"
              aria-invalid={roomCode.length > 0 && roomCode.length < 8}
              aria-describedby="room-code-help"
            />
            <p id="room-code-help" className="text-xs text-muted-foreground">
              Enter the 8-character room code
            </p>
          </div>

          {/* Password (if needed) */}
          {needsPassword && (
            <div className="space-y-2">
              <Label htmlFor="room-password">Password</Label>
              <Input
                id="room-password"
                type="password"
                placeholder="Enter room password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={32}
                aria-required="true"
                aria-label="Room password"
                aria-describedby="room-password-help"
              />
              <p id="room-password-help" className="text-xs text-muted-foreground">
                This room is password protected
              </p>
            </div>
          )}

          {/* QR Code Scanner (Future Enhancement) */}
          <Button
            variant="outline"
            className="w-full"
            disabled
            title="Coming soon"
            aria-label="Scan QR code (coming soon)"
            aria-disabled="true"
          >
            <QrCode className="w-4 h-4 mr-2" aria-hidden="true" />
            Scan QR Code
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isJoining}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoin}
            disabled={isJoining || isPending || !roomCode.trim() || roomCode.length < 8}
            aria-label={(isJoining || isPending) ? "Joining room..." : "Join room"}
          >
            {(isJoining || isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
            {isPending ? 'Processing...' : 'Join Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
