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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { RoomConfig } from '@/lib/rooms/transfer-room-manager';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (config: RoomConfig) => Promise<void>;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onCreateRoom,
}: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('1h');
  const [maxMembers, setMaxMembers] = useState('10');
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const config: RoomConfig = {
        ...(roomName ? { name: roomName } : {}),
        ...(isPasswordProtected && password ? { password } : {}),
        maxMembers: parseInt(maxMembers, 10),
      };

      // Set expiration
      if (expiresIn !== 'never') {
        const hours = parseInt(expiresIn.replace('h', ''), 10);
        config.expiresIn = hours * 60 * 60 * 1000; // Convert to milliseconds
      }

      await onCreateRoom(config);

      // Reset form in transition for non-blocking UI
      startTransition(() => {
        setRoomName('');
        setPassword('');
        setIsPasswordProtected(false);
        setExpiresIn('1h');
        setMaxMembers('10');
        onOpenChange(false);
      });
    } catch (error) {
      console.error('Failed to create room:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Transfer Room</DialogTitle>
          <DialogDescription>
            Create a room for multiple users to join and share files securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="room-name">Room Name (Optional)</Label>
            <Input
              id="room-name"
              placeholder="My Transfer Room"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Password Protection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password-protected">Password Protection</Label>
              <Switch
                id="password-protected"
                checked={isPasswordProtected}
                onCheckedChange={setIsPasswordProtected}
                aria-label="Enable password protection"
              />
            </div>
            {isPasswordProtected && (
              <Input
                id="room-password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={32}
                aria-required="true"
                aria-label="Room password"
                aria-invalid={isPasswordProtected && !password}
              />
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expires-in">Expires In</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger id="expires-in">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="6h">6 Hours</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="168h">7 Days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Members */}
          <div className="space-y-2">
            <Label htmlFor="max-members">Max Members</Label>
            <Select value={maxMembers} onValueChange={setMaxMembers}>
              <SelectTrigger id="max-members">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Members</SelectItem>
                <SelectItem value="10">10 Members</SelectItem>
                <SelectItem value="20">20 Members</SelectItem>
                <SelectItem value="50">50 Members</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || isPending || (isPasswordProtected && !password)}
            aria-label={(isCreating || isPending) ? "Creating room..." : "Create room"}
          >
            {(isCreating || isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
            {isPending ? 'Processing...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
