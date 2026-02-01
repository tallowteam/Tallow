# TALLOW - COMPLETE DOCUMENTATION (PART 3)

*Continued from Part 2*

---

## 11. CUSTOM HOOKS (30+ Hooks)

### 11.1 Transfer Hooks

#### useFileTransfer
**Location:** `lib/hooks/use-file-transfer.ts`

**Purpose:** Core file transfer operations

```typescript
function useFileTransfer() {
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  };

  const calculateHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return {
    downloadFile,
    formatFileSize,
    getFileIcon,
    calculateHash
  };
}
```

#### usePQCTransfer
**Location:** `lib/hooks/use-pqc-transfer.ts`

**Purpose:** Post-quantum encrypted transfers

```typescript
function usePQCTransfer() {
  const [session, setSession] = useState<PQCSession | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const initSession = async (peerId: string) => {
    try {
      // Generate ML-KEM keypair
      const { publicKey, secretKey } = await generateKyberKeypair();

      // Send public key to peer
      await sendPublicKey(peerId, publicKey);

      // Receive peer's public key
      const peerPublicKey = await receivePeerPublicKey(peerId);

      // Perform encapsulation
      const { ciphertext, sharedSecret } = await encapsulate(peerPublicKey);

      // Send ciphertext
      await sendCiphertext(peerId, ciphertext);

      // Derive session keys
      const sessionKeys = deriveSessionKeys(sharedSecret);

      setSession({
        peerId,
        sessionKeys,
        established: true
      });
    } catch (err) {
      setError(err as Error);
    }
  };

  const sendFile = async (file: File) => {
    if (!session) throw new Error('No active session');

    const chunkSize = 64 * 1024; // 64KB
    const chunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      // Encrypt chunk
      const encrypted = await encryptChunk(
        await chunk.arrayBuffer(),
        session.sessionKeys.encryption,
        i
      );

      // Send encrypted chunk
      await sendChunk(session.peerId, encrypted);

      // Update progress
      setProgress((i + 1) / chunks * 100);
    }
  };

  return {
    initSession,
    sendFile,
    progress,
    error,
    session
  };
}
```

#### useGroupTransfer
**Location:** `lib/hooks/use-group-transfer.ts`

**Purpose:** Multi-recipient transfers

```typescript
function useGroupTransfer() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [progress, setProgress] = useState<Map<string, number>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, TransferStatus>>(new Map());

  const addRecipient = (recipient: Recipient) => {
    setRecipients(prev => [...prev, recipient]);
    setProgress(prev => new Map(prev).set(recipient.id, 0));
    setStatuses(prev => new Map(prev).set(recipient.id, 'pending'));
  };

  const removeRecipient = (recipientId: string) => {
    setRecipients(prev => prev.filter(r => r.id !== recipientId));
    setProgress(prev => {
      const next = new Map(prev);
      next.delete(recipientId);
      return next;
    });
    setStatuses(prev => {
      const next = new Map(prev);
      next.delete(recipientId);
      return next;
    });
  };

  const sendToAll = async (file: File) => {
    // Encrypt file once
    const encryptedFile = await encryptFile(file);

    // Send to all recipients in parallel
    const promises = recipients.map(recipient =>
      sendToRecipient(recipient, encryptedFile)
        .then(() => {
          setStatuses(prev => new Map(prev).set(recipient.id, 'completed'));
        })
        .catch(error => {
          setStatuses(prev => new Map(prev).set(recipient.id, 'failed'));
        })
    );

    await Promise.allSettled(promises);
  };

  const sendToRecipient = async (
    recipient: Recipient,
    encryptedFile: Blob
  ) => {
    setStatuses(prev => new Map(prev).set(recipient.id, 'transferring'));

    // Establish connection
    const connection = await connectToRecipient(recipient);

    // Send file with progress tracking
    await connection.sendFile(encryptedFile, (progress) => {
      setProgress(prev => new Map(prev).set(recipient.id, progress));
    });
  };

  return {
    recipients,
    addRecipient,
    removeRecipient,
    sendToAll,
    progress,
    statuses
  };
}
```

#### useResumableTransfer
**Location:** `lib/hooks/use-resumable-transfer.ts`

**Purpose:** Resume interrupted transfers

```typescript
function useResumableTransfer() {
  const saveState = async (state: TransferState) => {
    const db = await openDB('resumable-transfers', 1);
    await db.put('transfers', state);
  };

  const loadState = async (transferId: string): Promise<TransferState | null> => {
    const db = await openDB('resumable-transfers', 1);
    return await db.get('transfers', transferId);
  };

  const resume = async (transferId: string) => {
    const state = await loadState(transferId);
    if (!state) throw new Error('Transfer not found');

    // Resume from last completed chunk
    const lastCompletedChunk = state.chunks
      .filter(c => c.status === 'complete')
      .sort((a, b) => b.index - a.index)[0];

    const startChunk = lastCompletedChunk ? lastCompletedChunk.index + 1 : 0;

    // Continue transfer
    for (let i = startChunk; i < state.totalChunks; i++) {
      if (state.chunks[i].status === 'complete') continue;

      // Transfer chunk
      await transferChunk(i, state);

      // Update state
      state.chunks[i].status = 'complete';
      await saveState(state);
    }
  };

  return {
    saveState,
    loadState,
    resume
  };
}
```

### 11.2 Connection Hooks

#### useP2PConnection
**Location:** `lib/hooks/use-p2p-connection.ts`

**Purpose:** WebRTC peer-to-peer connections

```typescript
function useP2PConnection() {
  const [connection, setConnection] = useState<RTCPeerConnection | null>(null);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const connect = async (peerId: string) => {
    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: process.env.NEXT_PUBLIC_TURN_SERVER }
      ]
    });

    // Create data channel
    const dc = pc.createDataChannel('file-transfer', {
      ordered: true,
      maxRetransmits: 3
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendICECandidate(peerId, event.candidate);
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    // Handle data channel open
    dc.onopen = () => {
      console.log('Data channel open');
    };

    dc.onmessage = (event) => {
      handleMessage(event.data);
    };

    // Create offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer to peer
    await sendOffer(peerId, offer);

    // Wait for answer
    const answer = await receiveAnswer(peerId);
    await pc.setRemoteDescription(answer);

    setConnection(pc);
    setDataChannel(dc);
  };

  const send = (data: ArrayBuffer) => {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    dataChannel.send(data);
  };

  const disconnect = () => {
    dataChannel?.close();
    connection?.close();
    setConnection(null);
    setDataChannel(null);
  };

  return {
    connect,
    send,
    disconnect,
    connectionState,
    isConnected: connectionState === 'connected'
  };
}
```

#### useTransferRoom
**Location:** `lib/hooks/use-transfer-room.ts`

**Purpose:** Multi-user transfer rooms

```typescript
function useTransferRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const createRoom = async (name: string, password?: string) => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        name,
        password
      })
    });

    const data = await response.json();
    setRoom(data);
    return data.roomCode;
  };

  const joinRoom = async (roomCode: string, password?: string) => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'join',
        roomCode,
        password,
        deviceId: getDeviceId()
      })
    });

    const data = await response.json();
    setRoom(data);

    // Connect to signaling server for room
    const socket = io(process.env.NEXT_PUBLIC_SIGNALING_SERVER!);
    socket.emit('join-room', roomCode);

    // Listen for member updates
    socket.on('member-joined', (member: Member) => {
      setMembers(prev => [...prev, member]);
    });

    socket.on('member-left', (memberId: string) => {
      setMembers(prev => prev.filter(m => m.id !== memberId));
    });
  };

  const leaveRoom = () => {
    if (room) {
      socket.emit('leave-room', room.id);
      setRoom(null);
      setMembers([]);
    }
  };

  return {
    room,
    members,
    createRoom,
    joinRoom,
    leaveRoom
  };
}
```

### 11.3 Privacy Hooks

#### useMetadataStripper
**Location:** `lib/hooks/use-metadata-stripper.ts`

**Purpose:** Strip metadata from files

```typescript
function useMetadataStripper() {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [stripping, setStripping] = useState(false);

  const extractMetadata = async (file: File): Promise<Metadata> => {
    const tags = await ExifReader.load(file);

    return {
      gps: {
        latitude: tags.GPSLatitude?.description,
        longitude: tags.GPSLongitude?.description,
        altitude: tags.GPSAltitude?.description
      },
      camera: {
        make: tags.Make?.description,
        model: tags.Model?.description,
        lens: tags.LensModel?.description
      },
      timestamps: {
        created: tags.DateTime?.description,
        modified: tags.ModifyDate?.description
      },
      software: tags.Software?.description,
      author: tags.Artist?.description
    };
  };

  const stripMetadata = async (file: File): Promise<File> => {
    setStripping(true);

    try {
      if (file.type.startsWith('image/')) {
        return await stripImageMetadata(file);
      } else if (file.type.startsWith('video/')) {
        return await stripVideoMetadata(file);
      }

      return file;
    } finally {
      setStripping(false);
    }
  };

  const stripImageMetadata = async (file: File): Promise<File> => {
    // Create canvas
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image (no metadata)
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve, file.type, 0.95);
    });

    return new File([blob], file.name, { type: file.type });
  };

  return {
    extractMetadata,
    stripMetadata,
    metadata,
    stripping
  };
}
```

#### useOnionRouting
**Location:** `lib/hooks/use-onion-routing.ts`

**Purpose:** 3-hop onion routing

```typescript
function useOnionRouting() {
  const [circuit, setCircuit] = useState<Circuit | null>(null);
  const [relays, setRelays] = useState<RelayNode[]>([]);

  const selectRelays = (): RelayNode[] => {
    const available = getAvailableRelays();

    // Select 3 relays with geographic diversity
    const relay1 = selectRelay(available, { region: 'europe' });
    const relay2 = selectRelay(available, { region: 'asia' });
    const relay3 = selectRelay(available, { region: 'americas' });

    return [relay1, relay2, relay3];
  };

  const buildCircuit = async (): Promise<Circuit> => {
    const path = selectRelays();
    const layerKeys: Uint8Array[] = [];

    // Establish circuit hop by hop
    for (const relay of path) {
      // Exchange keys with relay
      const { sharedSecret } = await keyExchange(relay);
      layerKeys.push(sharedSecret);

      // Extend circuit through relay
      await extendCircuit(relay);
    }

    const circuit: Circuit = {
      id: generateCircuitId(),
      path,
      layerKeys,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000 // 10 minutes
    };

    setCircuit(circuit);
    setRelays(path);

    return circuit;
  };

  const sendThroughCircuit = async (data: Uint8Array): Promise<void> => {
    if (!circuit) throw new Error('No active circuit');

    // Encrypt in layers (innermost to outermost)
    let encrypted = data;

    for (let i = circuit.layerKeys.length - 1; i >= 0; i--) {
      encrypted = await encrypt(encrypted, circuit.layerKeys[i]);
    }

    // Send to first relay
    await sendToRelay(circuit.path[0], encrypted);
  };

  return {
    buildCircuit,
    sendThroughCircuit,
    circuit,
    relays
  };
}
```

### 11.4 Communication Hooks

#### useChat
**Location:** `lib/hooks/use-chat.ts`

**Purpose:** Encrypted chat messaging

```typescript
function useChat(peerId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load messages from IndexedDB
  useEffect(() => {
    const loadMessages = async () => {
      const db = await openDB('chat', 1);
      const stored = await db.getAll('messages', peerId);
      setMessages(stored);
    };

    loadMessages();
  }, [peerId]);

  const sendMessage = async (content: string) => {
    // Encrypt message
    const encrypted = await encryptMessage(content, sessionKey);

    const message: ChatMessage = {
      id: generateId(),
      senderId: myDeviceId,
      recipientId: peerId,
      content: encrypted,
      type: 'text',
      timestamp: Date.now(),
      status: 'sending'
    };

    // Add to local messages
    setMessages(prev => [...prev, message]);

    // Save to IndexedDB
    const db = await openDB('chat', 1);
    await db.add('messages', message);

    // Send via WebRTC
    try {
      await sendViaPeer(peerId, message);
      updateMessageStatus(message.id, 'sent');
    } catch (error) {
      updateMessageStatus(message.id, 'failed');
    }
  };

  const receiveMessage = (encryptedMessage: EncryptedMessage) => {
    // Decrypt message
    const content = decryptMessage(encryptedMessage, sessionKey);

    const message: ChatMessage = {
      id: encryptedMessage.id,
      senderId: peerId,
      recipientId: myDeviceId,
      content,
      type: 'text',
      timestamp: encryptedMessage.timestamp,
      status: 'delivered'
    };

    setMessages(prev => [...prev, message]);
    setUnreadCount(prev => prev + 1);

    // Save to IndexedDB
    saveMessage(message);

    // Send read receipt
    sendReadReceipt(message.id);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return {
    messages,
    sendMessage,
    isTyping,
    unreadCount,
    markAsRead
  };
}
```

#### useVoiceCommands
**Location:** `lib/hooks/use-voice-commands.ts`

**Purpose:** Voice control

```typescript
function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const recognition = useMemo(() => {
    if (!('webkitSpeechRecognition' in window)) return null;

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript;

      setTranscript(command);
      handleCommand(command);
    };

    return recognition;
  }, []);

  const handleCommand = (command: string) => {
    const normalized = command.toLowerCase().trim();

    const commands: Record<string, () => void> = {
      'start transfer': startTransfer,
      'cancel': cancelTransfer,
      'pause': pauseTransfer,
      'resume': resumeTransfer,
      'open settings': openSettings,
      'help': showHelp
    };

    const match = Object.keys(commands).find(cmd =>
      normalized.includes(cmd)
    );

    if (match) {
      commands[match]();
      speak(`Executing ${match}`);
    }
  };

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening
  };
}
```

#### useScreenShare
**Location:** `lib/hooks/use-screen-share.ts`

**Purpose:** Screen sharing

```typescript
function useScreenShare() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const startSharing = async (options: ScreenShareOptions) => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: options.width || 1920,
          height: options.height || 1080,
          frameRate: options.frameRate || 30
        },
        audio: options.audio || false
      });

      // Handle stream ended (user clicked browser's stop button)
      mediaStream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };

      setStream(mediaStream);
      setIsSharing(true);

      return mediaStream;
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      throw error;
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsSharing(false);
    }
  };

  const changeQuality = async (preset: '720p' | '1080p' | '4K') => {
    if (!stream) return;

    const constraints = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4K': { width: 3840, height: 2160 }
    };

    const videoTrack = stream.getVideoTracks()[0];
    await videoTrack.applyConstraints(constraints[preset]);
  };

  return {
    stream,
    isSharing,
    startSharing,
    stopSharing,
    changeQuality
  };
}
```

### 11.5 UI/UX Hooks

#### useReducedMotion
**Location:** `lib/hooks/use-reduced-motion.ts`

**Purpose:** Respect motion preferences

```typescript
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
}
```

#### usePWA
**Location:** `lib/hooks/use-pwa.ts`

**Purpose:** PWA installation

```typescript
function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setInstallPrompt(null);
  };

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    install
  };
}
```

#### useSwipeGestures
**Location:** `lib/hooks/use-swipe-gestures.ts`

**Purpose:** Touch gesture handling

```typescript
function useSwipeGestures(handlers: SwipeHandlers) {
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance) {
        handlers.onSwipeLeft?.();
      } else if (distanceX < -minSwipeDistance) {
        handlers.onSwipeRight?.();
      }
    } else {
      if (distanceY > minSwipeDistance) {
        handlers.onSwipeUp?.();
      } else if (distanceY < -minSwipeDistance) {
        handlers.onSwipeDown?.();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
```

---

## 12. STORAGE & DATA MANAGEMENT

### 12.1 Client-Side Storage

#### Secure Storage (Encrypted IndexedDB)
**Location:** `lib/storage/secure-storage.ts`

**Purpose:** Encrypted storage for sensitive data

```typescript
class SecureStorage {
  private db: IDBDatabase;
  private masterKey: CryptoKey;

  async init() {
    // Derive master key from device-specific data
    this.masterKey = await this.deriveMasterKey();

    // Open IndexedDB
    this.db = await openDB('secure-storage', 1, {
      upgrade(db) {
        db.createObjectStore('data');
      }
    });
  }

  async set(key: string, value: any): Promise<void> {
    // Serialize value
    const serialized = JSON.stringify(value);

    // Encrypt with AES-256-GCM
    const encrypted = await this.encrypt(serialized);

    // Store in IndexedDB
    await this.db.put('data', encrypted, key);
  }

  async get(key: string): Promise<any> {
    // Retrieve from IndexedDB
    const encrypted = await this.db.get('data', key);

    if (!encrypted) return null;

    // Decrypt
    const decrypted = await this.decrypt(encrypted);

    // Deserialize
    return JSON.parse(decrypted);
  }

  async remove(key: string): Promise<void> {
    await this.db.delete('data', key);
  }

  private async encrypt(plaintext: string): Promise<EncryptedData> {
    const data = new TextEncoder().encode(plaintext);
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce
      },
      this.masterKey,
      data
    );

    return {
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      nonce: Array.from(nonce)
    };
  }

  private async decrypt(encrypted: EncryptedData): Promise<string> {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(encrypted.nonce)
      },
      this.masterKey,
      new Uint8Array(encrypted.ciphertext)
    );

    return new TextDecoder().decode(plaintext);
  }
}
```

#### Transfer History
**Location:** `lib/storage/transfer-history.ts`

**Schema:**
```typescript
interface TransferRecord {
  id: string;
  fileName: string;
  fileSize: number;
  peerId: string;
  peerName: string;
  direction: 'sent' | 'received';
  status: 'completed' | 'failed' | 'cancelled';
  timestamp: number;
  duration: number;        // milliseconds
  speed: number;           // bytes/second
  encryption: 'pqc' | 'classical';
  passwordProtected: boolean;
}
```

**Operations:**
```typescript
class TransferHistory {
  async add(record: TransferRecord): Promise<void> {
    const db = await openDB('transfer-history', 1);
    await db.add('transfers', record);
  }

  async getAll(): Promise<TransferRecord[]> {
    const db = await openDB('transfer-history', 1);
    return await db.getAll('transfers');
  }

  async query(filter: TransferFilter): Promise<TransferRecord[]> {
    const all = await this.getAll();

    return all.filter(record => {
      if (filter.direction && record.direction !== filter.direction) {
        return false;
      }

      if (filter.status && record.status !== filter.status) {
        return false;
      }

      if (filter.startDate && record.timestamp < filter.startDate) {
        return false;
      }

      if (filter.endDate && record.timestamp > filter.endDate) {
        return false;
      }

      return true;
    });
  }

  async export(): Promise<Blob> {
    const records = await this.getAll();
    const csv = this.toCSV(records);
    return new Blob([csv], { type: 'text/csv' });
  }
}
```

#### Friends Storage
**Location:** `lib/storage/friends.ts`

**Schema:**
```typescript
interface Friend {
  id: string;              // Device ID
  name: string;
  avatar?: string;
  publicKey: Uint8Array;
  verified: boolean;
  verifiedAt?: number;
  trustLevel: number;      // 0-100
  addedAt: number;
  lastSeen: number;
  autoAccept: boolean;
  notifications: boolean;
  settings: FriendSettings;
}
```

**Operations:**
```typescript
class FriendsStorage {
  async add(friend: Friend): Promise<void> {
    const db = await openDB('friends', 1);
    await db.add('friends', friend);
  }

  async update(id: string, updates: Partial<Friend>): Promise<void> {
    const db = await openDB('friends', 1);
    const friend = await db.get('friends', id);

    if (friend) {
      await db.put('friends', { ...friend, ...updates });
    }
  }

  async remove(id: string): Promise<void> {
    const db = await openDB('friends', 1);
    await db.delete('friends', id);
  }

  async getAll(): Promise<Friend[]> {
    const db = await openDB('friends', 1);
    return await db.getAll('friends');
  }

  async verify(id: string): Promise<void> {
    await this.update(id, {
      verified: true,
      verifiedAt: Date.now(),
      trustLevel: 100
    });
  }
}
```

#### Chat Storage
**Location:** `lib/chat/chat-storage.ts`

**Schema:**
```typescript
const chatDB = {
  name: 'chat',
  version: 1,
  stores: {
    messages: {
      keyPath: 'id',
      indexes: [
        { name: 'peerId', keyPath: 'peerId' },
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'status', keyPath: 'status' }
      ]
    },
    threads: {
      keyPath: 'id',
      indexes: [
        { name: 'lastMessageAt', keyPath: 'lastMessageAt' }
      ]
    }
  }
};
```

**Operations:**
```typescript
class ChatStorage {
  async saveMessage(message: ChatMessage): Promise<void> {
    const db = await openDB('chat', 1);
    await db.add('messages', message);

    // Update thread
    await this.updateThread(message.peerId, message);
  }

  async getMessages(peerId: string, limit = 50): Promise<ChatMessage[]> {
    const db = await openDB('chat', 1);
    const index = db.transaction('messages').store.index('peerId');

    const messages = await index.getAll(peerId);

    // Sort by timestamp descending
    messages.sort((a, b) => b.timestamp - a.timestamp);

    return messages.slice(0, limit);
  }

  async searchMessages(query: string): Promise<ChatMessage[]> {
    const db = await openDB('chat', 1);
    const all = await db.getAll('messages');

    // Search in decrypted content
    return all.filter(msg => {
      const decrypted = decryptMessage(msg.content);
      return decrypted.toLowerCase().includes(query.toLowerCase());
    });
  }

  async deleteThread(peerId: string): Promise<void> {
    const db = await openDB('chat', 1);
    const index = db.transaction('messages', 'readwrite').store.index('peerId');

    const messages = await index.getAll(peerId);

    for (const message of messages) {
      await db.delete('messages', message.id);
    }

    await db.delete('threads', peerId);
  }
}
```

### 12.2 Cloud Storage (Cloudflare R2)

#### File Upload
**Location:** `lib/email-fallback/index.ts`

```typescript
async function uploadToR2(file: File): Promise<string> {
  // Encrypt file
  const encrypted = await encryptFile(file);

  // Generate unique ID
  const fileId = generateFileId();

  // Upload to R2
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileId,
    Body: encrypted,
    ContentType: 'application/octet-stream',
    Metadata: {
      originalName: encryptString(file.name),
      uploadedAt: Date.now().toString(),
      expiresAt: (Date.now() + 86400000).toString() // 24 hours
    }
  }));

  // Return download URL
  return `${R2_PUBLIC_URL}/${fileId}`;
}
```

#### File Download
```typescript
async function downloadFromR2(fileId: string): Promise<Blob> {
  // Get object from R2
  const response = await r2Client.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileId
  }));

  // Read stream
  const encrypted = await streamToBuffer(response.Body);

  // Decrypt
  const decrypted = await decryptFile(encrypted);

  return decrypted;
}
```

#### Cleanup Job
**Location:** `app/api/cron/cleanup/route.ts`

```typescript
export async function POST(request: Request) {
  // Verify cron secret
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // List all objects
  const response = await r2Client.send(new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME
  }));

  const now = Date.now();
  let deleted = 0;
  let bytesFreed = 0;

  // Delete expired files
  for (const object of response.Contents || []) {
    const metadata = await getObjectMetadata(object.Key);
    const expiresAt = parseInt(metadata.expiresAt);

    if (expiresAt < now) {
      await r2Client.send(new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: object.Key
      }));

      deleted++;
      bytesFreed += object.Size || 0;
    }
  }

  return Response.json({
    filesDeleted: deleted,
    bytesFreed
  });
}
```

---

*Documentation continues in Part 4...*
