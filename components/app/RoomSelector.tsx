'use client';

/**
 * Room Selector Component
 * Provides UI for creating and joining transfer rooms
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, LogIn } from 'lucide-react';
import { CreateRoomDialog } from './CreateRoomDialog';
import { JoinRoomDialog } from './JoinRoomDialog';
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';
import { RoomConfig } from '@/lib/rooms/transfer-room-manager';

interface RoomSelectorProps {
  deviceName: string;
  onRoomCreated?: () => void;
  onRoomJoined?: () => void;
}

export function RoomSelector({
  deviceName,
  onRoomCreated,
  onRoomJoined,
}: RoomSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const { createRoom, joinRoom, isConnected } = useTransferRoom(deviceName);

  const handleCreateRoom = async (config: RoomConfig) => {
    await createRoom(config);
    onRoomCreated?.();
  };

  const handleJoinRoom = async (code: string, password?: string) => {
    await joinRoom(code, password);
    onRoomJoined?.();
  };

  return (
    <>
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Transfer Rooms</h3>
            <p className="text-sm text-muted-foreground">
              Create or join a room to share files with multiple users
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!isConnected}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>

            <Button
              onClick={() => setShowJoinDialog(true)}
              disabled={!isConnected}
              variant="outline"
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Join Room
            </Button>
          </div>

          {!isConnected && (
            <p className="text-xs text-muted-foreground">
              Connecting to server...
            </p>
          )}
        </div>
      </Card>

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateRoom={handleCreateRoom}
      />

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoinRoom={handleJoinRoom}
      />
    </>
  );
}
