// Core types for the Tallow application

export interface Device {
  id: string;
  name: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web';
  ip?: string;
  port?: number;
  isOnline: boolean;
  isFavorite: boolean;
  lastSeen: Date;
  avatar?: string;
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string;
  lastModified?: Date;
  thumbnail?: string;
}

export interface Transfer {
  id: string;
  files: FileInfo[];
  from: Device;
  to: Device;
  status: 'pending' | 'connecting' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  speed: number; // bytes per second
  startTime?: Date;
  endTime?: Date;
  error?: string;
  direction: 'send' | 'receive';
  totalSize: number;
  transferredSize: number;
  eta?: number; // seconds
}

export interface TransferOptions {
  encryption: boolean;
  compression: boolean;
  overwrite: boolean;
  autoAccept: boolean;
  maxChunkSize: number;
}

export interface ConnectionTicket {
  id: string;
  peerId: string;
  signal: any; // WebRTC signal
  expires: Date;
  password?: string;
}

export interface TransferChunk {
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
  hash: string;
}

export interface Settings {
  deviceName: string;
  deviceAvatar?: string;
  downloadPath: string;
  port: number;
  autoAccept: boolean;
  requirePin: boolean;
  pin?: string;
  enableNotifications: boolean;
  enableSound: boolean;
  encryptionEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  relayServers: string[];
}

export type TransferEvent = {
  type: 'progress' | 'completed' | 'failed' | 'paused' | 'resumed' | 'cancelled';
  transfer: Transfer;
  data?: any;
};

// Friend transfer extends Transfer with friend info
export interface FriendTransfer extends Transfer {
  friendId?: string;
  friendName?: string;
  skipPasscode: boolean;
  isPasswordProtected: boolean;
}

// Password-protected file wrapper
export interface ProtectedFile {
  originalName: string;
  originalType: string;
  originalSize: number;
  encryptedData: ArrayBuffer;
  isEncrypted: true;
}

