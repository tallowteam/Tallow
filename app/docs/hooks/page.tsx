'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui';
import {
  Menu,
  Code,
} from '@/components/icons';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';

const hookCategories = [
  {
    title: 'Transfer',
    hooks: [
      { id: 'use-file-transfer', label: 'useFileTransfer' },
      { id: 'use-resumable-transfer', label: 'useResumableTransfer' },
      { id: 'use-p2p-connection', label: 'useP2PConnection' },
    ],
  },
  {
    title: 'Discovery',
    hooks: [
      { id: 'use-unified-discovery', label: 'useUnifiedDiscovery' },
      { id: 'use-nat-optimized-connection', label: 'useNATOptimizedConnection' },
    ],
  },
  {
    title: 'Chat',
    hooks: [
      { id: 'use-chat-integration', label: 'useChatIntegration' },
      { id: 'use-chat-visibility', label: 'useChatVisibility' },
    ],
  },
  {
    title: 'Security',
    hooks: [
      { id: 'use-onion-routing', label: 'useOnionRouting' },
      { id: 'use-pqc-manager', label: 'usePQCManager' },
      { id: 'use-secure-storage', label: 'useSecureStorage' },
    ],
  },
  {
    title: 'Media',
    hooks: [
      { id: 'use-screen-capture', label: 'useScreenCapture' },
    ],
  },
  {
    title: 'UI',
    hooks: [
      { id: 'use-performance', label: 'usePerformance' },
      { id: 'use-intersection-observer', label: 'useIntersectionObserver' },
      { id: 'use-keyboard-shortcut', label: 'useKeyboardShortcut' },
      { id: 'use-notifications', label: 'useNotifications' },
    ],
  },
  {
    title: 'Utility',
    hooks: [
      { id: 'use-focus-trap', label: 'useFocusTrap' },
    ],
  },
];

const hookDetails: Record<string, any> = {
  'use-file-transfer': {
    name: 'useFileTransfer',
    category: 'Transfer',
    description: 'Manages file selection, drag-and-drop operations, and file list management for transfers.',
    importPath: `import { useFileTransfer } from '@/lib/hooks/use-file-transfer';`,
    signature: `function useFileTransfer(): {
  files: FileWithData[];
  isDragging: boolean;
  inputRef: React.Ref<HTMLInputElement>;
  addFiles: (fileList: FileList | File[]) => FileWithData[];
  removeFile: (id: string) => void;
  clearFiles: () => void;
  openFilePicker: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getTotalSize: () => number;
  getFileById: (id: string) => FileWithData | undefined;
  getAllFiles: () => File[];
}`,
    parameters: [],
    returnValue: [
      { name: 'files', type: 'FileWithData[]', description: 'Array of selected files with metadata' },
      { name: 'isDragging', type: 'boolean', description: 'Whether user is dragging files over the element' },
      { name: 'inputRef', type: 'React.Ref<HTMLInputElement>', description: 'Reference to hidden file input' },
      { name: 'addFiles', type: 'function', description: 'Add files to the transfer queue' },
      { name: 'removeFile', type: 'function', description: 'Remove file by ID' },
      { name: 'clearFiles', type: 'function', description: 'Clear all files' },
      { name: 'handleDragOver', type: 'function', description: 'Handle drag over event' },
      { name: 'handleDrop', type: 'function', description: 'Handle drop event' },
    ],
    example: `function FileUploadComponent() {
  const {
    files,
    isDragging,
    inputRef,
    addFiles,
    removeFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
  } = useFileTransfer();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragging ? '2px solid blue' : '1px solid gray',
        padding: '20px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={handleFileInputChange}
      />
      <button onClick={() => inputRef.current?.click()}>
        Select Files
      </button>

      <ul>
        {files.map((file) => (
          <li key={file.id}>
            {file.name} - {file.size} bytes
            <button onClick={() => removeFile(file.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    notes: 'Also exports utility functions: downloadFile, downloadFiles, formatFileSize, formatSpeed, formatTime, getFileExtension, getMimeType',
  },
  'use-resumable-transfer': {
    name: 'useResumableTransfer',
    category: 'Transfer',
    description: 'Provides UI-friendly interface for resumable transfer functionality with connection recovery.',
    importPath: `import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';`,
    signature: `function useResumableTransfer(options?: UseResumableTransferOptions): {
  isNegotiating: boolean;
  isTransferring: boolean;
  isResuming: boolean;
  progress: number;
  error: string | null;
  sessionReady: boolean;
  connectionLost: boolean;
  currentTransferId: string | null;
  resumableTransfers: ResumableTransferItem[];
  autoResumeEnabled: boolean;
  autoResumeCountdown: number;
  initializeSender: () => Promise<string>;
  initializeReceiver: () => Promise<string>;
  setPeerPublicKey: (publicKeyHex: string) => Promise<void>;
  setDataChannel: (dataChannel: RTCDataChannel) => void;
  sendFile: (file: File, relativePath?: string) => Promise<void>;
  resumeTransfer: (transferId: string) => Promise<void>;
  deleteResumableTransfer: (transferId: string) => Promise<void>;
  cancelAutoResume: () => void;
  toggleAutoResume: (enabled: boolean) => void;
}`,
    parameters: [
      { name: 'options.onTransferComplete', type: 'function', description: 'Called when transfer completes' },
      { name: 'options.onError', type: 'function', description: 'Called when error occurs' },
      { name: 'options.onConnectionLost', type: 'function', description: 'Called when connection is lost' },
      { name: 'options.autoResume', type: 'boolean', description: 'Auto-resume transfers on connection recovery' },
    ],
    returnValue: [
      { name: 'isTransferring', type: 'boolean', description: 'Whether a transfer is in progress' },
      { name: 'progress', type: 'number', description: 'Transfer progress percentage (0-100)' },
      { name: 'sessionReady', type: 'boolean', description: 'Whether crypto session is established' },
      { name: 'resumableTransfers', type: 'ResumableTransferItem[]', description: 'List of resumable transfers' },
    ],
    example: `function ResumableTransferComponent() {
  const {
    isTransferring,
    progress,
    sessionReady,
    resumableTransfers,
    initializeSender,
    setPeerPublicKey,
    sendFile,
  } = useResumableTransfer({
    autoResume: true,
    onTransferComplete: (blob, filename) => {
      console.log('Transfer complete:', filename);
    },
  });

  const handleInitiate = async () => {
    const publicKey = await initializeSender();
    // Share publicKey with peer
  };

  const handleSend = async (file: File) => {
    if (sessionReady) {
      await sendFile(file);
    }
  };

  return (
    <div>
      <button onClick={handleInitiate}>Start Transfer</button>
      {isTransferring && <progress value={progress} max={100} />}
      <ul>
        {resumableTransfers.map(t => (
          <li key={t.transferId}>{t.fileName} - {t.progress}%</li>
        ))}
      </ul>
    </div>
  );
}`,
    notes: 'Supports auto-resume on connection recovery. Stores transfer state in IndexedDB. Turbopack pattern: Use getState() for state inspection during transfers.',
  },
  'use-p2p-connection': {
    name: 'useP2PConnection',
    category: 'Transfer',
    description: 'Manages P2P WebRTC connections with end-to-end encryption and peer verification.',
    importPath: `import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';`,
    signature: `function useP2PConnection(): {
  state: P2PConnectionState;
  currentTransfer: TransferProgress | null;
  receivedFiles: ReceivedFile[];
  dataChannel: RTCDataChannel | null;
  initializeAsInitiator: () => Promise<RTCSessionDescriptionInit | undefined>;
  acceptConnection: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | undefined>;
  completeConnection: (answer: RTCSessionDescriptionInit) => Promise<void>;
  sendFile: (file: File, onProgress?: (progress: number) => void) => Promise<void>;
  sendFiles: (files: File[], onProgress?: (fileIndex: number, progress: number) => void) => Promise<void>;
  downloadReceivedFile: (file: ReceivedFile) => void;
  confirmVerification: () => void;
  failVerification: () => void;
  skipVerification: () => void;
}`,
    parameters: [],
    returnValue: [
      { name: 'state.isConnected', type: 'boolean', description: 'P2P connection established' },
      { name: 'state.verificationPending', type: 'boolean', description: 'Waiting for peer verification' },
      { name: 'currentTransfer', type: 'TransferProgress | null', description: 'Current file transfer progress' },
      { name: 'receivedFiles', type: 'ReceivedFile[]', description: 'Received files' },
    ],
    example: `function P2PTransferComponent() {
  const {
    state,
    initializeAsInitiator,
    acceptConnection,
    completeConnection,
    sendFile,
    confirmVerification,
  } = useP2PConnection();

  const initiateConnection = async () => {
    const offer = await initializeAsInitiator();
    // Send offer to peer
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    const answer = await acceptConnection(offer);
    // Send answer back
  };

  return (
    <div>
      {!state.isConnected && (
        <button onClick={initiateConnection}>Initiate Connection</button>
      )}
      {state.verificationPending && (
        <button onClick={confirmVerification}>Verify Peer</button>
      )}
      {state.isConnected && (
        <button onClick={() => sendFile(file)}>Send File</button>
      )}
    </div>
  );
}`,
    notes: 'Implements relay-only mode for privacy. Includes peer verification with SAS (Short Authentication String). Supports backpressure handling for efficient transfers.',
  },
  'use-unified-discovery': {
    name: 'useUnifiedDiscovery',
    category: 'Discovery',
    description: 'Discovers devices using both mDNS (local) and signaling server (internet) methods.',
    importPath: `import { useUnifiedDiscovery } from '@/lib/hooks/use-unified-discovery';`,
    signature: `function useUnifiedDiscovery(options?: UseUnifiedDiscoveryOptions): UseUnifiedDiscoveryResult {
  devices: UnifiedDevice[];
  isDiscovering: boolean;
  isMdnsAvailable: boolean;
  isSignalingConnected: boolean;
  mdnsDeviceCount: number;
  signalingDeviceCount: number;
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => void;
  refresh: () => Promise<void>;
  getBestConnectionMethod: (deviceId: string) => 'direct' | 'signaling' | null;
  getDevice: (deviceId: string) => UnifiedDevice | undefined;
  advertise: () => void;
  stopAdvertising: () => void;
  error: Error | null;
}`,
    parameters: [
      { name: 'options.enableMdns', type: 'boolean', description: 'Enable mDNS discovery (default: true)' },
      { name: 'options.enableSignaling', type: 'boolean', description: 'Enable signaling discovery (default: true)' },
      { name: 'options.autoStart', type: 'boolean', description: 'Auto-start discovery on mount (default: true)' },
      { name: 'options.sourceFilter', type: 'DiscoverySource', description: 'Filter by discovery source' },
    ],
    returnValue: [
      { name: 'devices', type: 'UnifiedDevice[]', description: 'Discovered devices' },
      { name: 'isDiscovering', type: 'boolean', description: 'Discovery active' },
      { name: 'isMdnsAvailable', type: 'boolean', description: 'mDNS daemon available' },
    ],
    example: `function DeviceListComponent() {
  const {
    devices,
    isDiscovering,
    startDiscovery,
    stopDiscovery,
  } = useUnifiedDiscovery({
    autoStart: true,
    enableMdns: true,
    enableSignaling: true,
  });

  return (
    <div>
      {!isDiscovering && <button onClick={startDiscovery}>Start Discovery</button>}
      {isDiscovering && <button onClick={stopDiscovery}>Stop Discovery</button>}
      <ul>
        {devices.map(device => (
          <li key={device.id}>{device.name} ({device.source})</li>
        ))}
      </ul>
    </div>
  );
}`,
    notes: 'Also provides useMdnsDiscovery and useSignalingDiscovery utility hooks for single-source discovery.',
  },
  'use-nat-optimized-connection': {
    name: 'useNATOptimizedConnection',
    category: 'Discovery',
    description: 'Optimizes WebRTC connections with NAT type detection and adaptive connection strategies.',
    importPath: `import { useNATOptimizedConnection } from '@/lib/hooks/use-nat-optimized-connection';`,
    signature: `function useNATOptimizedConnection(options?: UseNATOptimizedConnectionOptions): {
  localNAT: NATType | null;
  remoteNAT: NATType | null;
  natDetecting: boolean;
  strategy: AdaptiveStrategyResult | null;
  shouldUseTURN: boolean;
  bestTURNServer: TURNServer | null;
  detectLocalNAT: () => Promise<NATDetectionResult | null>;
  setRemoteNAT: (natType: NATType) => void;
  calculateStrategy: () => AdaptiveStrategyResult | null;
  getICEConfig: () => RTCConfiguration | null;
  recordConnectionSuccess: (time: number, type: 'direct' | 'relayed') => void;
  recordConnectionFailure: (error: string) => void;
  getMetrics: () => any;
  isReady: boolean;
  canConnect: boolean;
}`,
    parameters: [
      { name: 'options.autoDetectNAT', type: 'boolean', description: 'Auto-detect NAT on mount (default: true)' },
      { name: 'options.enableTURNHealth', type: 'boolean', description: 'Monitor TURN server health (default: true)' },
      { name: 'options.remoteNATType', type: 'NATType', description: 'Remote peer NAT type if known' },
    ],
    returnValue: [
      { name: 'localNAT', type: 'NATType | null', description: 'Detected local NAT type' },
      { name: 'strategy', type: 'AdaptiveStrategyResult | null', description: 'Recommended connection strategy' },
      { name: 'shouldUseTURN', type: 'boolean', description: 'Whether to use TURN relay' },
    ],
    example: `function NATOptimizedComponent() {
  const {
    localNAT,
    remoteNAT,
    strategy,
    shouldUseTURN,
    detectLocalNAT,
    setRemoteNAT,
  } = useNATOptimizedConnection({
    autoDetectNAT: true,
    enableTURNHealth: true,
  });

  const handlePeerNATDetected = (remoteNATType: NATType) => {
    setRemoteNAT(remoteNATType);
  };

  return (
    <div>
      <p>Local NAT: {localNAT}</p>
      <p>Remote NAT: {remoteNAT}</p>
      {strategy && <p>Strategy: {strategy.strategy}</p>}
      {shouldUseTURN && <p>Using TURN relay</p>}
    </div>
  );
}`,
    notes: 'Detects 5 NAT types: Open, Full Cone, Address Restricted, Port Restricted, Symmetric. Provides adaptive timeout recommendations.',
  },
  'use-chat-integration': {
    name: 'useChatIntegration',
    category: 'Chat',
    description: 'Integrates secure chat functionality into file transfer sessions.',
    importPath: `import { useChatIntegration } from '@/lib/hooks/use-chat-integration';`,
    signature: `function useChatIntegration(options: UseChatIntegrationOptions): UseChatIntegrationResult {
  chatManager: ChatManager | null;
  sessionId: string;
  isReady: boolean;
  unreadCount: number;
  error: Error | null;
  resetUnreadCount: () => void;
}`,
    parameters: [
      { name: 'options.dataChannel', type: 'RTCDataChannel | null', description: 'WebRTC data channel' },
      { name: 'options.sessionKeys', type: 'SessionKeys | null', description: 'Encryption session keys' },
      { name: 'options.currentUserId', type: 'string', description: 'Current user ID' },
      { name: 'options.enabled', type: 'boolean', description: 'Enable chat (default: true)' },
    ],
    returnValue: [
      { name: 'chatManager', type: 'ChatManager | null', description: 'Chat manager instance' },
      { name: 'isReady', type: 'boolean', description: 'Chat ready for messaging' },
      { name: 'unreadCount', type: 'number', description: 'Number of unread messages' },
    ],
    example: `function ChatComponent() {
  const {
    chatManager,
    isReady,
    unreadCount,
    resetUnreadCount,
  } = useChatIntegration({
    dataChannel: rtcDataChannel,
    sessionKeys: encryptionKeys,
    currentUserId: userId,
    currentUserName: userName,
  });

  const handleSendMessage = async (text: string) => {
    if (chatManager) {
      await chatManager.sendMessage(text);
    }
  };

  return (
    <div>
      {!isReady && <p>Loading chat...</p>}
      {unreadCount > 0 && <badge>{unreadCount} new messages</badge>}
      <button onClick={() => {
        handleSendMessage('Hello');
        resetUnreadCount();
      }}>
        Send Hello
      </button>
    </div>
  );
}`,
    notes: 'Uses useChatVisibility hook for toggling chat visibility. Messages are encrypted with session keys.',
  },
  'use-onion-routing': {
    name: 'useOnionRouting',
    category: 'Security',
    description: 'Manages onion routing circuits for privacy-preserving data transfers.',
    importPath: `import { useOnionRouting } from '@/lib/hooks/use-onion-routing';`,
    signature: `function useOnionRouting(initialConfig?: Partial<OnionRoutingConfig>): UseOnionRoutingResult {
  isAvailable: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  config: OnionRoutingConfig | null;
  stats: OnionRoutingStats | null;
  relayNodes: RelayNode[];
  activePaths: Map<string, string[]>;
  updateConfig: (config: Partial<OnionRoutingConfig>) => void;
  routeData: (transferId: string, data: ArrayBuffer, destination: string) => Promise<void>;
  selectPath: (numHops?: number) => Promise<RelayNode[]>;
  refreshRelays: () => Promise<void>;
  closeCircuit: (transferId: string) => void;
}`,
    parameters: [
      { name: 'initialConfig', type: 'Partial<OnionRoutingConfig>', description: 'Initial routing configuration' },
    ],
    returnValue: [
      { name: 'isAvailable', type: 'boolean', description: 'Onion routing available' },
      { name: 'relayNodes', type: 'RelayNode[]', description: 'Available relay nodes' },
      { name: 'activePaths', type: 'Map<string, string[]>', description: 'Active routing circuits' },
    ],
    example: `function OnionRoutingComponent() {
  const {
    isAvailable,
    relayNodes,
    routeData,
    selectPath,
    stats,
  } = useOnionRouting({
    mode: 'multi-hop',
  });

  const handleRouteData = async () => {
    const path = await selectPath(3); // 3 hops
    await routeData('transfer-1', data, destination);
  };

  return (
    <div>
      {isAvailable ? (
        <div>
          <p>Relay nodes: {relayNodes.length}</p>
          <p>Success rate: {stats?.successRate}%</p>
          <button onClick={handleRouteData}>Route Through Onion</button>
        </div>
      ) : (
        <p>Onion routing unavailable</p>
      )}
    </div>
  );
}`,
    notes: 'Also provides useOnionRoutingMode, useRelaySelection, useOnionStats, and useCircuitManagement utility hooks.',
  },
  'use-pqc-manager': {
    name: 'usePQCManager',
    category: 'Security',
    description: 'Provides post-quantum cryptography operations (ML-KEM-768 + X25519 hybrid).',
    importPath: `import { usePQCManager } from '@/lib/hooks/use-pqc-manager';`,
    signature: `function usePQCManager(options?: UsePQCManagerOptions): {
  isInitialized: boolean;
  error: string | null;
  generateKeyPair: () => Promise<HybridKeyPair | null>;
  encapsulate: (publicKey: HybridPublicKey) => Promise<{ ciphertext: HybridCiphertext; sharedSecret: Uint8Array } | null>;
  decapsulate: (ciphertext: HybridCiphertext, keyPair: HybridKeyPair) => Promise<Uint8Array | null>;
  encrypt: (plaintext: Uint8Array, key: Uint8Array, associatedData?: Uint8Array) => Promise<EncryptedData | null>;
  decrypt: (encrypted: EncryptedData, key: Uint8Array, associatedData?: Uint8Array) => Promise<Uint8Array | null>;
  hash: (data: Uint8Array) => Uint8Array | null;
  mac: (key: Uint8Array, data: Uint8Array) => Promise<Uint8Array | null>;
  randomBytes: (length: number) => Uint8Array | null;
}`,
    parameters: [
      { name: 'options.autoInit', type: 'boolean', description: 'Auto-initialize on mount (default: true)' },
      { name: 'options.resetNonces', type: 'boolean', description: 'Reset nonce counter (default: false)' },
      { name: 'options.onReady', type: 'function', description: 'Called when PQC is ready' },
    ],
    returnValue: [
      { name: 'isInitialized', type: 'boolean', description: 'PQC service initialized' },
      { name: 'error', type: 'string | null', description: 'Initialization error if any' },
    ],
    example: `function PQCComponent() {
  const {
    isInitialized,
    generateKeyPair,
    encapsulate,
    decapsulate,
    encrypt,
    decrypt,
  } = usePQCManager({ autoInit: true });

  const handleKeyExchange = async () => {
    const keyPair = await generateKeyPair();
    const publicKey = keyPair?.publicKey;
    // Share publicKey with peer
  };

  const handleEncrypt = async (data: Uint8Array) => {
    const key = await generateKeyPair();
    const encrypted = await encrypt(data, key);
    // Send encrypted data
  };

  return (
    <div>
      {!isInitialized && <p>Initializing PQC...</p>}
      {isInitialized && (
        <>
          <button onClick={handleKeyExchange}>Generate Keys</button>
          <button onClick={() => handleEncrypt(data)}>Encrypt Data</button>
        </>
      )}
    </div>
  );
}`,
    notes: 'Uses ML-KEM-768 for key encapsulation and X25519 for hybrid security. Includes nonce management and constant-time comparison.',
  },
  'use-secure-storage': {
    name: 'useSecureStorage',
    category: 'Security',
    description: 'Provides encrypted IndexedDB storage for transfer state and chunk data.',
    importPath: `import { useSecureStorage } from '@/lib/hooks/use-secure-storage';`,
    signature: `function useSecureStorage(options?: UseSecureStorageOptions): {
  isReady: boolean;
  error: string | null;
  createTransfer: (transferId: string, fileName: string, fileType: string, fileSize: number, ...) => Promise<TransferMetadata | null>;
  getTransfer: (transferId: string) => Promise<TransferMetadata | null>;
  updateTransfer: (metadata: Partial<TransferMetadata> & { transferId: string }) => Promise<boolean>;
  saveChunkData: (transferId: string, chunkIndex: number, data: ArrayBuffer, nonce: Uint8Array, hash: Uint8Array) => Promise<boolean>;
  getChunkData: (transferId: string, chunkIndex: number) => Promise<ChunkData | null>;
  getResumable: () => Promise<TransferMetadata[]>;
  removeTransfer: (transferId: string) => Promise<boolean>;
  cleanupExpired: () => Promise<number>;
  getStats: (transferId: string) => Promise<TransferStats | null>;
}`,
    parameters: [
      { name: 'options.autoInit', type: 'boolean', description: 'Auto-initialize on mount (default: true)' },
      { name: 'options.onReady', type: 'function', description: 'Called when storage is ready' },
      { name: 'options.onInitError', type: 'function', description: 'Called on initialization error' },
    ],
    returnValue: [
      { name: 'isReady', type: 'boolean', description: 'Storage initialized and ready' },
      { name: 'error', type: 'string | null', description: 'Error message if any' },
    ],
    example: `function SecureStorageComponent() {
  const {
    isReady,
    createTransfer,
    saveChunkData,
    getResumable,
  } = useSecureStorage({ autoInit: true });

  const handleStartTransfer = async (file: File) => {
    const metadata = await createTransfer(
      'transfer-1',
      file.name,
      file.type,
      file.size,
      fileHash,
      chunkSize,
      peerId,
      'receive'
    );
  };

  const handleSaveChunk = async (chunk: ArrayBuffer) => {
    await saveChunkData('transfer-1', 0, chunk, nonce, hash);
  };

  const handleCheckResumable = async () => {
    const transfers = await getResumable();
    console.log('Resumable transfers:', transfers);
  };

  return (
    <div>
      {isReady ? (
        <div>
          <button onClick={() => handleStartTransfer(file)}>Start Transfer</button>
          <button onClick={() => handleSaveChunk(chunk)}>Save Chunk</button>
          <button onClick={handleCheckResumable}>Check Resumable</button>
        </div>
      ) : (
        <p>Storage initializing...</p>
      )}
    </div>
  );
}`,
    notes: 'Stores transfer metadata and chunks in encrypted IndexedDB. Auto-cleanup of transfers older than 7 days.',
  },
  'use-screen-capture': {
    name: 'useScreenCapture',
    category: 'Media',
    description: 'Manages screen sharing and screen capture functionality.',
    importPath: `import { useScreenCapture } from '@/lib/hooks/use-screen-capture';`,
    signature: `function useScreenCapture(options?: UseScreenCaptureOptions): {
  isCapturing: boolean;
  isPaused: boolean;
  stream: MediaStream | null;
  error: string | null;
  stats: ScreenShareStats | null;
  quality: ScreenShareQuality;
  frameRate: FrameRate;
  isSupported: boolean;
  isActive: boolean;
  startCapture: (peerConnection?: RTCPeerConnection) => Promise<MediaStream | null>;
  stopCapture: () => void;
  pauseCapture: () => void;
  resumeCapture: () => void;
  updateQuality: (quality: ScreenShareQuality) => Promise<void>;
  updateFrameRate: (fps: FrameRate) => Promise<void>;
  toggleAudio: (enabled: boolean) => Promise<void>;
}`,
    parameters: [
      { name: 'options.quality', type: 'ScreenShareQuality', description: 'Quality preset: "720p" | "1080p" | "1440p" (default: "1080p")' },
      { name: 'options.frameRate', type: 'FrameRate', description: 'Frame rate: 15 | 24 | 30 | 60 (default: 30)' },
      { name: 'options.shareAudio', type: 'boolean', description: 'Share audio (default: false)' },
      { name: 'options.shareCursor', type: 'boolean', description: 'Show cursor (default: true)' },
    ],
    returnValue: [
      { name: 'isCapturing', type: 'boolean', description: 'Screen sharing active' },
      { name: 'stream', type: 'MediaStream | null', description: 'Captured media stream' },
      { name: 'stats', type: 'ScreenShareStats | null', description: 'Capture statistics' },
    ],
    example: `function ScreenShareComponent() {
  const {
    isCapturing,
    stream,
    quality,
    startCapture,
    stopCapture,
    updateQuality,
  } = useScreenCapture({
    quality: '1080p',
    frameRate: 30,
    shareAudio: false,
  });

  const handleStartShare = async () => {
    const capturedStream = await startCapture();
    if (capturedStream && videoRef.current) {
      videoRef.current.srcObject = capturedStream;
    }
  };

  return (
    <div>
      {!isCapturing && <button onClick={handleStartShare}>Start Screen Share</button>}
      {isCapturing && <button onClick={stopCapture}>Stop Sharing</button>}
      <select onChange={(e) => updateQuality(e.target.value as ScreenShareQuality)}>
        <option value="720p">720p</option>
        <option value="1080p" selected>1080p</option>
        <option value="1440p">1440p</option>
      </select>
      <video ref={videoRef} autoPlay playsInline muted />
    </div>
  );
}`,
    notes: 'Supports PQC protection marking for post-quantum secured sessions. Compatible with all major browsers via displayMediaOptions.',
  },
  'use-performance': {
    name: 'usePerformance',
    category: 'UI',
    description: 'Monitors component performance metrics and Core Web Vitals.',
    importPath: `import { usePerformance } from '@/lib/hooks/use-performance';`,
    signature: `function usePerformance(options?: UsePerformanceOptions): UsePerformanceReturn {
  markStart: (name: string) => void;
  markEnd: (name: string) => number;
  measure: <T>(name: string, fn: () => T | Promise<T>) => Promise<{ result: T; duration: number }>;
  metrics: PerformanceMetric[];
  longTasks: PerformanceEntry[];
}`,
    parameters: [
      { name: 'options.trackWebVitals', type: 'boolean', description: 'Track Core Web Vitals (default: false)' },
      { name: 'options.trackLongTasks', type: 'boolean', description: 'Track long tasks (default: false)' },
      { name: 'options.onMetric', type: 'function', description: 'Callback for metric updates' },
    ],
    returnValue: [
      { name: 'metrics', type: 'PerformanceMetric[]', description: 'Collected performance metrics' },
      { name: 'longTasks', type: 'PerformanceEntry[]', description: 'Detected long tasks' },
    ],
    example: `function PerformanceComponent() {
  const {
    markStart,
    markEnd,
    measure,
    metrics,
  } = usePerformance({
    trackWebVitals: true,
    onMetric: (m) => console.log('Metric:', m),
  });

  const handleDataFetch = async () => {
    markStart('data-fetch');
    const data = await fetchData();
    const duration = markEnd('data-fetch');
    console.log('Fetch took:', duration, 'ms');
  };

  const handleMeasure = async () => {
    const { result, duration } = await measure('expensive-op', () => expensiveFunction());
    console.log('Operation took:', duration, 'ms');
  };

  return (
    <div>
      <button onClick={handleDataFetch}>Fetch Data</button>
      <button onClick={handleMeasure}>Expensive Operation</button>
      <p>Metrics collected: {metrics.length}</p>
    </div>
  );
}`,
    notes: 'Also provides useRenderTime, useAsyncTiming, useIdleCallback, and useIntersectionLoad utility hooks.',
  },
  'use-intersection-observer': {
    name: 'useIntersectionObserver',
    category: 'UI',
    description: 'Detects when elements enter the viewport for animations and lazy loading.',
    importPath: `import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer';`,
    signature: `function useIntersectionObserver<T extends HTMLElement = HTMLElement>(options?: UseIntersectionObserverOptions): {
  ref: React.Ref<T>;
  isIntersecting: boolean;
  hasIntersected: boolean;
  isVisible: boolean;
}`,
    parameters: [
      { name: 'options.threshold', type: 'number | number[]', description: 'Intersection threshold (default: 0.1)' },
      { name: 'options.triggerOnce', type: 'boolean', description: 'Only trigger once (default: true)' },
      { name: 'options.enabled', type: 'boolean', description: 'Enable observer (default: true)' },
    ],
    returnValue: [
      { name: 'ref', type: 'React.Ref<T>', description: 'Ref to attach to element' },
      { name: 'isIntersecting', type: 'boolean', description: 'Currently intersecting viewport' },
      { name: 'hasIntersected', type: 'boolean', description: 'Has intersected at least once' },
      { name: 'isVisible', type: 'boolean', description: 'Visibility state (considers triggerOnce)' },
    ],
    example: `function AnimatedSection() {
  const {
    ref,
    isVisible,
  } = useIntersectionObserver({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <h2>Animated Section</h2>
      <p>This fades in when scrolled into view</p>
    </section>
  );
}`,
    notes: 'Also provides useStaggeredIntersectionObserver for animations on lists and useReducedMotion to respect user preferences.',
  },
  'use-keyboard-shortcut': {
    name: 'useKeyboardShortcut',
    category: 'UI',
    description: 'Registers keyboard shortcuts with global keyboard management system.',
    importPath: `import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';`,
    signature: `function useKeyboardShortcut(
  shortcutId: string,
  shortcut: Omit<KeyboardShortcut, 'id'> | null
): void`,
    parameters: [
      { name: 'shortcutId', type: 'string', description: 'Unique shortcut identifier' },
      { name: 'shortcut.key', type: 'string', description: 'Key to listen for (e.g., "Enter", "s")' },
      { name: 'shortcut.ctrlKey', type: 'boolean', description: 'Ctrl key modifier' },
      { name: 'shortcut.shiftKey', type: 'boolean', description: 'Shift key modifier' },
      { name: 'shortcut.handler', type: 'function', description: 'Callback when shortcut pressed' },
    ],
    returnValue: [],
    example: `function EditorComponent() {
  const handleSave = () => console.log('Saved!');

  useKeyboardShortcut('save', {
    key: 's',
    ctrlKey: true,
    handler: handleSave,
  });

  useKeyboardShortcut('bold', {
    key: 'b',
    ctrlKey: true,
    handler: () => applyBold(),
  });

  return <div>Press Ctrl+S to save</div>;
}`,
    notes: 'Register shortcuts once at component mount. Pass null to deregister. Global system prevents duplicate handlers.',
  },
  'use-notifications': {
    name: 'useNotifications',
    category: 'UI',
    description: 'Unified hook for toast and browser notifications with settings integration.',
    importPath: `import { useNotifications } from '@/lib/hooks/use-notifications';`,
    signature: `function useNotifications(): {
  notify: (options: NotifyOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  notifyTransferStarted: (fileName: string, deviceName: string) => string;
  notifyTransferComplete: (fileName: string, direction?: 'sent' | 'received') => string;
  notifyTransferFailed: (fileName: string, error?: string, onRetry?: () => void) => string;
  notifyConnectionEstablished: (deviceName: string, type?: 'p2p' | 'relay') => string;
  notifyConnectionLost: (deviceName: string) => string;
  notifyDeviceDiscovered: (deviceName: string) => string;
  notifyIncomingTransferRequest: (deviceName: string, fileName: string, onAccept: () => void, onReject: () => void) => string;
  isBrowserNotificationsAvailable: boolean;
}`,
    parameters: [],
    returnValue: [
      { name: 'notify', type: 'function', description: 'Show custom notification' },
      { name: 'success/error/warning/info', type: 'function', description: 'Quick notification helpers' },
      { name: 'notifyTransferStarted', type: 'function', description: 'Transfer started notification' },
    ],
    example: `function TransferComponent() {
  const {
    notifyTransferStarted,
    notifyTransferComplete,
    notifyTransferFailed,
    notify,
  } = useNotifications();

  const handleTransfer = async () => {
    notifyTransferStarted('document.pdf', 'John Device');
    try {
      await performTransfer();
      notifyTransferComplete('document.pdf', 'received');
    } catch (error) {
      notifyTransferFailed('document.pdf', error.message, handleRetry);
    }
  };

  return (
    <div>
      <button onClick={handleTransfer}>Transfer File</button>
      <button onClick={() => notify({ message: 'Custom notification' })}>
        Custom
      </button>
    </div>
  );
}`,
    notes: 'Respects user notification settings (sound, browser notifications, silent hours). Auto-integrates with toast provider.',
  },
  'use-focus-trap': {
    name: 'useFocusTrap',
    category: 'Utility',
    description: 'Manages focus trap for modal dialogs and dropdowns (a11y).',
    importPath: `import { useFocusTrap } from '@/lib/accessibility/use-focus-trap';`,
    signature: `function useFocusTrap(containerRef: React.RefObject<HTMLElement>, enabled?: boolean): void`,
    parameters: [
      { name: 'containerRef', type: 'React.RefObject<HTMLElement>', description: 'Ref to container element' },
      { name: 'enabled', type: 'boolean', description: 'Enable focus trap (default: true)' },
    ],
    returnValue: [],
    example: `function ModalComponent() {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useFocusTrap(modalRef, isOpen);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      {isOpen && (
        <div ref={modalRef} role="dialog" aria-modal="true">
          <h2>Modal Dialog</h2>
          <button>Action 1</button>
          <button>Action 2</button>
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}`,
    notes: 'Traps focus within container, preventing interaction with background elements. Restores focus on unmount.',
  },
};

export default function HooksPage() {
  const [activeHook, setActiveHook] = useState<string>('use-file-transfer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hookRef = useRef<HTMLDivElement>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const currentHook = hookDetails[activeHook];

  useEffect(() => {
    if (hookRef.current) {
      hookRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeHook]);

  return (
    <>
      <Header />
      <div className={styles.docsLayout}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Hooks</h3>
            </div>

            {hookCategories.map((category) => (
              <div key={category.title} className={styles.categorySection}>
                <h4 className={styles.categoryName}>{category.title}</h4>
                <ul className={styles.hooksList}>
                  {category.hooks.map((hook) => (
                    <li key={hook.id}>
                      <button
                        className={`${styles.hookLink} ${
                          activeHook === hook.id ? styles.hookLinkActive : ''
                        }`}
                        onClick={() => {
                          setActiveHook(hook.id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        {hook.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle sidebar"
            type="button"
          >
            <Menu />
            <span>Hooks</span>
          </button>

          {/* Mobile Sidebar Overlay */}
          {isMobileMenuOpen && (
            <div
              className={styles.mobileOverlay}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Content Container */}
          <div ref={hookRef} className={styles.hookContent}>
            {currentHook && (
              <>
                {/* Header */}
                <div className={styles.hookHeader}>
                  <div className={styles.hookTitleSection}>
                    <Code className={styles.hookIcon} />
                    <div>
                      <h1 className={styles.hookTitle}>{currentHook.name}</h1>
                      <Badge variant="secondary">{currentHook.category}</Badge>
                    </div>
                  </div>
                  <p className={styles.hookDescription}>{currentHook.description}</p>
                </div>

                {/* Import Statement */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Import</h2>
                  <div className={styles.codeBlock}>
                    <pre className={styles.code}>
                      <code>{currentHook.importPath}</code>
                    </pre>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyCode(currentHook.importPath)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </section>

                {/* Type Signature */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Type Signature</h2>
                  <div className={styles.codeBlock}>
                    <pre className={styles.code}>
                      <code>{currentHook.signature}</code>
                    </pre>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyCode(currentHook.signature)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </section>

                {/* Parameters */}
                {currentHook.parameters.length > 0 && (
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Parameters</h2>
                    <div className={styles.table}>
                      <div className={styles.tableHeader}>
                        <div className={styles.tableCell}>Name</div>
                        <div className={styles.tableCell}>Type</div>
                        <div className={styles.tableCell}>Description</div>
                      </div>
                      {currentHook.parameters.map((param: { name: string; type: string; description: string }, idx: number) => (
                        <div key={idx} className={styles.tableRow}>
                          <div className={`${styles.tableCell} ${styles.tableCellName}`}>
                            {param.name}
                          </div>
                          <div className={styles.tableCell}>
                            <code>{param.type}</code>
                          </div>
                          <div className={styles.tableCell}>{param.description}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Return Value */}
                {currentHook.returnValue.length > 0 && (
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Return Value</h2>
                    <div className={styles.table}>
                      <div className={styles.tableHeader}>
                        <div className={styles.tableCell}>Property</div>
                        <div className={styles.tableCell}>Type</div>
                        <div className={styles.tableCell}>Description</div>
                      </div>
                      {currentHook.returnValue.map((ret: { name: string; type: string; description: string }, idx: number) => (
                        <div key={idx} className={styles.tableRow}>
                          <div className={`${styles.tableCell} ${styles.tableCellName}`}>
                            {ret.name}
                          </div>
                          <div className={styles.tableCell}>
                            <code>{ret.type}</code>
                          </div>
                          <div className={styles.tableCell}>{ret.description}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Example */}
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Example</h2>
                  <div className={styles.codeBlock}>
                    <pre className={styles.code}>
                      <code>{currentHook.example}</code>
                    </pre>
                    <button
                      className={styles.copyButton}
                      onClick={() => handleCopyCode(currentHook.example)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </section>

                {/* Notes */}
                {currentHook.notes && (
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Notes</h2>
                    <div className={styles.noteBox}>
                      <p>{currentHook.notes}</p>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
