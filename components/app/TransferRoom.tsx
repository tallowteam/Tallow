'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Copy,
  Share2,
  Upload,
  LogOut,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTransferRoom } from '@/lib/hooks/use-transfer-room';
import { formatDistance } from 'date-fns';

interface TransferRoomProps {
  deviceName: string;
  onSendFiles?: (files: File[]) => void;
  onLeaveRoom?: () => void;
}

export function TransferRoom({
  deviceName,
  onSendFiles,
  onLeaveRoom,
}: TransferRoomProps) {
  const {
    room,
    members,
    isOwner,
    isInRoom,
    leaveRoom,
    closeRoom,
    broadcastFileOffer,
    getRoomUrl,
  } = useTransferRoom(deviceName);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleCopyRoomCode = useCallback(() => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      toast.success('Room code copied to clipboard');
    }
  }, [room]);

  const handleCopyRoomUrl = useCallback(() => {
    const url = getRoomUrl();
    navigator.clipboard.writeText(url);
    toast.success('Room URL copied to clipboard');
  }, [getRoomUrl]);

  const handleShare = useCallback(async () => {
    const url = getRoomUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my Tallow room`,
          text: `Join room ${room?.code} for secure file sharing`,
          url,
        });
        toast.success('Shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopyRoomUrl();
    }
  }, [getRoomUrl, handleCopyRoomUrl, room]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);

      // Broadcast file offer to room members
      files.forEach(file => {
        broadcastFileOffer(file.name, file.size);
      });

      // Call parent handler if provided
      onSendFiles?.(files);

      toast.success(`Broadcasting ${files.length} file(s) to room members`);
    }
  }, [broadcastFileOffer, onSendFiles]);

  const handleLeaveRoom = useCallback(() => {
    leaveRoom();
    onLeaveRoom?.();
  }, [leaveRoom, onLeaveRoom]);

  const handleCloseRoom = useCallback(() => {
    if (confirm('Are you sure you want to close this room? All members will be disconnected.')) {
      closeRoom();
      onLeaveRoom?.();
    }
  }, [closeRoom, onLeaveRoom]);

  if (!isInRoom || !room) {
    return null;
  }

  const getTimeRemaining = () => {
    if (!room.expiresAt) {return 'Never expires';}
    const distance = formatDistance(new Date(room.expiresAt), new Date(), { addSuffix: true });
    return `Expires ${distance}`;
  };

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold">{room.name}</h2>
              {isOwner && (
                <Badge variant="default" className="text-xs">
                  Owner
                </Badge>
              )}
            </div>

            {/* Room Code */}
            <div className="flex items-center gap-2 mb-2">
              <code className="text-2xl font-mono font-bold tracking-wider bg-muted px-3 py-1 rounded">
                {room.code}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyRoomCode}
                title="Copy room code"
                aria-label="Copy room code"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Room Info */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{members.length} / {room.maxMembers} members</span>
              </div>
              {room.isPasswordProtected && (
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Password protected</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{getTimeRemaining()}</span>
              </div>
            </div>
          </div>

          {/* Room Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              title="Share room"
              aria-label="Share room"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </Button>
            {isOwner ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCloseRoom}
                aria-label="Close room"
              >
                <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                Close Room
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeaveRoom}
                aria-label="Leave room"
              >
                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                Leave
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Members List */}
        <Card className="md:col-span-1 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members ({members.length})
          </h3>
          <ScrollArea className="h-[300px] pr-4">
            <ul className="space-y-2">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.deviceName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.deviceName}
                      {member.id === room.ownerId && ' (Owner)'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {member.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Card>

        {/* File Sharing Area */}
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Share Files</h3>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Select files to share with all room members
            </p>
            <label className="cursor-pointer">
              <Button asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Select Files
                </span>
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                aria-label="Select files to share"
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
              <ul className="space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {file.name} ({formatFileSize(file.size)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
