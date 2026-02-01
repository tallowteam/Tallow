'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TransferRoom } from '@/components/app/TransferRoom';
import { JoinRoomDialog } from '@/components/app/JoinRoomDialog';
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';
import { getDeviceId } from '@/lib/auth/user-identity';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import secureStorage from '@/lib/storage/secure-storage';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.['code'] as string | undefined;

  const [deviceName, setDeviceName] = useState<string>('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    room: _room,
    isInRoom,
    joinRoom,
    isConnected,
  } = useTransferRoom(deviceName);

  // Load device name
  useEffect(() => {
    const loadDeviceName = async () => {
      try {
        const name = await secureStorage.getItem('tallow_device_name');
        setDeviceName(name || `Device ${getDeviceId().slice(0, 6)}`);
      } catch (error) {
        console.error('Failed to load device name:', error);
        setDeviceName(`Device ${getDeviceId().slice(0, 6)}`);
      }
    };

    loadDeviceName();
  }, []);

  // Auto-join room when connected and device name is loaded
  useEffect(() => {
    if (isConnected && deviceName && !isInRoom && code) {
      setIsLoading(false);
      setShowJoinDialog(true);
    }
  }, [isConnected, deviceName, isInRoom, code]);

  const handleJoinRoom = async (roomCode: string, password?: string) => {
    try {
      setError(null);
      await joinRoom(roomCode, password);
      setShowJoinDialog(false);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleLeaveRoom = () => {
    router.push('/app');
  };

  if (isLoading || !deviceName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading room...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
          <p className="text-muted-foreground mb-4">
            Establishing connection to the signaling server
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Join Room</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.push('/app')}>
              Go Home
            </Button>
            <Button onClick={() => {
              setError(null);
              setShowJoinDialog(true);
            }}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {isInRoom ? (
          <TransferRoom
            deviceName={deviceName}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <div className="max-w-md mx-auto text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Joining room...</p>
          </div>
        )}
      </div>

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onJoinRoom={handleJoinRoom}
      />
    </div>
  );
}
