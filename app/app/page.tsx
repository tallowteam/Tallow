'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { generateUUID } from '@/lib/utils/uuid';
// Button and Progress available but using custom Euveka components
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Upload,
    Download,
    Wifi,
    Globe,
    Settings,
    History,
    Send,
    Loader2,
    Check,
    Copy,
    FileDown,
    RefreshCw,
    Users,
    ArrowLeft,
    X,
    File,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    QrCode,
    Shield,
    AlertTriangle,
    Zap,
    ChevronRight,
    Clock,
} from "lucide-react";
import { FileSelectorWithPrivacy, FileWithData } from "@/components/transfer/file-selector-with-privacy";
import { DeviceListAnimated } from "@/components/devices/device-list-animated";
import { Device, Transfer } from "@/lib/types";
import { getConnectionManager, ConnectionManager } from "@/lib/signaling/connection-manager";
import { downloadFile, formatFileSize } from "@/lib/hooks/use-file-transfer";
import { getDeviceId } from "@/lib/auth/user-identity";
import { formatCode } from "@/lib/transfer/word-phrase-codes";
import { addTransferRecord, getRecentTransfers } from "@/lib/storage/transfer-history";
import { migrateSensitiveData } from "@/lib/storage/secure-storage";
import { getLocalDiscovery, DiscoveredDevice } from "@/lib/discovery/local-discovery";
import { writeClipboard, addToClipboardHistory } from "@/lib/features/clipboard-sync";
import { FriendsList } from "@/components/friends/friends-list";
import { Friend, getFriends, updateFriendConnection, getPendingFriendRequests, initFriendsCache } from "@/lib/storage/friends";
import { LazyVerificationDialog } from "@/components/lazy-components";
import { VerificationSession, createVerificationSession, markSessionVerified, markSessionFailed, markSessionSkipped, isPeerVerified, initVerificationCache } from "@/lib/crypto/peer-authentication";
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';
import { transferMetadata } from '@/lib/transfer/transfer-metadata';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLanguage } from '@/lib/i18n/language-context';
import { getPrivateTransport } from '@/lib/transport/private-webrtc';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { preloadOnMount } from '@/lib/crypto/preload-pqc';
import { secureLog } from '@/lib/utils/secure-logger';
import { initializePrivacyFeatures, PrivacyInitResult } from '@/lib/init/privacy-init';
import { registerServiceWorker } from '@/lib/pwa/service-worker-registration';
import { announce } from '@/components/accessibility/live-region-provider';
import { cn } from '@/lib/utils';
import { MDNSStatusIndicator } from '@/components/app/MDNSStatusIndicator';

// ============================================================================
// EUVEKA DESIGN SYSTEM - BLACK & WHITE DARK MODE
// ============================================================================

const EUVEKA = {
    bg: {
        primary: '#0a0a08',
        card: '#141414',
        cardHover: '#1a1a1a',
        elevated: '#0f0f0f',
    },
    border: {
        default: '#262626',
        hover: 'rgba(254, 254, 252, 0.2)',
        active: '#fefefc',
    },
    text: {
        primary: '#fefefc',
        secondary: 'rgba(254, 254, 252, 0.6)',
        muted: 'rgba(254, 254, 252, 0.4)',
    },
    accent: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
    }
};

// ============================================================================
// INTERFACES
// ============================================================================

interface ReceivedFile {
    name: string;
    type: string;
    size: number;
    blob: Blob;
    receivedAt: Date;
    relativePath?: string;
}

interface RecentTransfer {
    id: string;
    direction: 'send' | 'receive';
    fileName: string;
    fileSize: number;
    peerName: string;
    completedAt: Date;
    status: 'completed' | 'failed';
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'transferring';
type TransferMode = 'local' | 'internet' | 'friends' | null;

// ============================================================================
// ANIMATION VARIANTS - Euveka Style
// ============================================================================

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

const tabSwitchVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }
    }
};

const cardHoverVariants = {
    rest: {
        y: 0,
        scale: 1,
        boxShadow: '0 0 0 rgba(254, 254, 252, 0)'
    },
    hover: {
        y: -4,
        scale: 1.01,
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.5)',
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1] as const
        }
    },
    tap: {
        y: 0,
        scale: 0.99,
        transition: {
            duration: 0.1
        }
    }
};

const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFileIcon(type: string) {
    if (type.startsWith('image/')) {return Image;}
    if (type.startsWith('video/')) {return Video;}
    if (type.startsWith('audio/')) {return Music;}
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {return Archive;}
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) {return FileText;}
    return File;
}

function getUserFriendlyError(error: string): string {
    if (error.includes('signaling') || error.includes('WebSocket')) {
        return 'Unable to connect to the signaling server. Please check your internet connection.';
    }
    if (error.includes('timeout') || error.includes('Timeout')) {
        return 'Connection timed out. The peer may be unreachable.';
    }
    if (error.includes('ICE') || error.includes('ice')) {
        return 'Unable to establish peer connection. Try a different connection mode.';
    }
    if (error.includes('rate') || error.includes('Rate')) {
        return 'Too many connection attempts. Please wait a moment and try again.';
    }
    return 'Connection failed. Please try again.';
}

// ============================================================================
// EUVEKA GLASS CARD COMPONENT
// ============================================================================

interface EuvekaCardProps {
    children: React.ReactNode;
    className?: string;
    interactive?: boolean;
    onClick?: () => void;
    glow?: boolean;
}

function EuvekaCard({ children, className, interactive = false, onClick, glow = false }: EuvekaCardProps) {
    const baseStyles = cn(
        'relative rounded-2xl overflow-hidden',
        'bg-[#141414] border border-[#262626]',
        'backdrop-blur-xl',
        glow && 'shadow-[0_0_60px_-12px_rgba(254,254,252,0.1)]',
        className
    );

    if (interactive) {
        return (
            <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(baseStyles, 'cursor-pointer hover:border-[#fefefc]/20 transition-colors duration-300')}
                onClick={onClick}
            >
                {children}
            </motion.div>
        );
    }

    return <div className={baseStyles}>{children}</div>;
}

// ============================================================================
// EUVEKA OUTLINE BUTTON
// ============================================================================

interface EuvekaButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'outline' | 'filled' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    icon?: boolean;
}

function EuvekaButton({ children, onClick, disabled, variant = 'outline', size = 'md', className, icon }: EuvekaButtonProps) {
    const sizeStyles = {
        sm: icon ? 'h-9 w-9' : 'h-9 px-4 text-sm',
        md: icon ? 'h-11 w-11' : 'h-11 px-5 text-sm',
        lg: icon ? 'h-12 w-12' : 'h-12 px-6 text-base',
    };

    const variantStyles = {
        outline: 'bg-transparent border border-[#fefefc]/20 text-[#fefefc] hover:bg-[#fefefc]/5 hover:border-[#fefefc]/40',
        filled: 'bg-[#fefefc] text-[#0a0a08] hover:bg-[#fefefc]/90',
        ghost: 'bg-transparent text-[#fefefc]/60 hover:text-[#fefefc] hover:bg-[#fefefc]/5',
    };

    const hoverProps = !disabled ? { whileHover: "hover" as const, whileTap: "tap" as const } : {};

    return (
        <motion.button
            variants={buttonVariants}
            initial="rest"
            {...hoverProps}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'rounded-full font-medium transition-all duration-200',
                'flex items-center justify-center gap-2',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                sizeStyles[size],
                variantStyles[variant],
                className
            )}
        >
            {children}
        </motion.button>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AppPage() {
    const { t } = useLanguage();

    // ========================================================================
    // STATE
    // ========================================================================

    // Core state
    const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
    const [transferMode, setTransferMode] = useState<TransferMode>(null);
    const [_connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');

    // File state
    const [selectedFiles, setSelectedFiles] = useState<FileWithData[]>([]);
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
    const [_transfers, setTransfers] = useState<Transfer[]>([]);
    const [recentTransfers, setRecentTransfers] = useState<RecentTransfer[]>([]);

    // Connection state
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [pqcReady, setPqcReady] = useState(false);

    // Transfer state
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [_sendSpeed, setSendSpeed] = useState(0);
    const [sendingFileName, setSendingFileName] = useState('');
    const [sendingFileIndex, setSendingFileIndex] = useState(0);
    const [sendingFileTotal, setSendingFileTotal] = useState(0);
    const [isReceiving, setIsReceiving] = useState(false);
    const [receiveProgress, setReceiveProgress] = useState(0);
    const [receivingFileName, setReceivingFileName] = useState('');

    // Code state
    const [connectionCode, setConnectionCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [codeType, _setCodeType] = useState<'word' | 'short'>('word');

    // Privacy & security state
    const [privacyInitResult, setPrivacyInitResult] = useState<PrivacyInitResult | null>(null);
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
    const [peerVerified, setPeerVerified] = useState(false);
    const [autoPromptVerification] = useState(true);
    const [filePassword, setFilePassword] = useState<string | undefined>(undefined);
    const [filePasswordHint, setFilePasswordHint] = useState<string | undefined>(undefined);

    // Local discovery
    const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
    const [_friends, setFriends] = useState<Friend[]>([]);
    const [friendRequestCount, setFriendRequestCount] = useState(0);

    // Dialog state
    const [showReceivedDialog, setShowReceivedDialog] = useState(false);
    const [_showPasswordDialog, _setShowPasswordDialog] = useState(false);
    const [_showMetadataDialog, _setShowMetadataDialog] = useState(false);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const connectionManager = useRef<ConnectionManager | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const pqcManager = useRef<PQCTransferManager | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const transferStartTime = useRef<number>(0);
    const thisDevice = useRef<Device | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // ========================================================================
    // DERIVED STATE
    // ========================================================================

    const localDevices: Device[] = useMemo(() => discoveredDevices.map(d => ({
        id: d.id,
        name: d.name,
        platform: d.platform as Device['platform'],
        ip: null,
        port: null,
        isOnline: d.isOnline,
        isFavorite: false,
        lastSeen: typeof d.lastSeen === 'number' ? d.lastSeen : d.lastSeen.getTime(),
        avatar: null,
    })), [discoveredDevices]);

    const currentStatus: ConnectionStatus = useMemo(() => {
        if (isSending || isReceiving) {return 'transferring';}
        if (isConnected && pqcReady) {return 'connected';}
        if (isConnecting) {return 'connecting';}
        return 'idle';
    }, [isSending, isReceiving, isConnected, pqcReady, isConnecting]);

    // ========================================================================
    // RESUMABLE TRANSFER
    // ========================================================================

    useResumableTransfer({
        autoResume: true,
        maxResumeAttempts: 3,
        onTransferComplete: (blob, filename, relativePath) => {
            const file: ReceivedFile = {
                name: filename,
                type: blob.type,
                size: blob.size,
                blob,
                receivedAt: new Date(),
                ...(relativePath !== undefined && { relativePath }),
            };
            setReceivedFiles((prev) => [...prev, file]);
            toast.success(t('app.resumedComplete'));
        },
        onError: (error) => {
            toast.error(`Resume failed: ${error.message}`);
        },
        onConnectionLost: () => {
            toast.warning(t('app.connectionLost'));
        },
        onResumeAvailable: (_transferId, progress) => {
            toast.info(t('app.previousTransfer'), {
                description: `${Math.round(progress)}% ${t('app.completed')}`,
                duration: 10000,
            });
        },
    });

    // ========================================================================
    // CONNECTION HELPERS
    // ========================================================================

    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnection.current;
        if (!pc) {return;}
        if (pc.remoteDescription) {
            try { await pc.addIceCandidate(candidate); } catch (e) { secureLog.error('Failed to add ICE candidate:', e); }
        } else {
            pendingCandidates.current.push(candidate);
        }
    }, []);

    const flushPendingCandidates = useCallback(async () => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) {return;}
        const candidates = pendingCandidates.current.splice(0);
        for (const candidate of candidates) {
            try { await pc.addIceCandidate(candidate); } catch (e) { secureLog.error('Failed to add queued ICE candidate:', e); }
        }
    }, []);

    const cleanupConnection = useCallback(() => {
        if (connectionTimeout.current) { clearTimeout(connectionTimeout.current); connectionTimeout.current = null; }
        if (dataChannel.current) { dataChannel.current.close(); dataChannel.current = null; }
        if (peerConnection.current) { peerConnection.current.close(); peerConnection.current = null; }
        pqcManager.current?.destroy();
        pqcManager.current = null;
        pendingCandidates.current = [];
        setPqcReady(false);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('idle');
    }, []);

    const startConnectionTimeout = useCallback((timeoutMs = 30000) => {
        if (connectionTimeout.current) {clearTimeout(connectionTimeout.current);}
        connectionTimeout.current = setTimeout(() => {
            if (!peerConnection.current || peerConnection.current.connectionState !== 'connected') {
                toast.error(t('app.connectionTimeout'));
                cleanupConnection();
            }
        }, timeoutMs);
    }, [cleanupConnection, t]);

    // Handle control messages
    const handleControlMessage = useCallback(async (message: Record<string, unknown>) => {
        switch (message['type']) {
            case 'clipboard':
                writeClipboard(message['content'] as string);
                await addToClipboardHistory({
                    content: message['content'] as string,
                    fromDevice: message['senderId'] as string,
                    fromName: message['senderName'] as string,
                    isLocal: false,
                });
                toast.success(t('app.clipboardReceived'), {
                    description: (message['content'] as string).slice(0, 50) + ((message['content'] as string).length > 50 ? '...' : ''),
                });
                break;
            case 'device-info':
                if (message['deviceId'] && message['name']) {
                    const discovery = getLocalDiscovery();
                    discovery.updateDeviceInfo(message['deviceId'] as string, message['name'] as string, (message['platform'] as string) || 'unknown');
                    setSelectedDevice(prev => {
                        if (prev && prev.id === message['deviceId']) {
                            return { ...prev, name: message['name'] as string, platform: (message['platform'] as Device['platform']) || prev.platform };
                        }
                        return prev;
                    });
                }
                break;
        }
    }, [t]);

    // Setup data channel handlers
    const setupDataChannel = useCallback((channel: RTCDataChannel, isInitiator = true) => {
        channel.binaryType = 'arraybuffer';
        channel.onopen = async () => {
            setIsConnected(true);
            setIsConnecting(false);
            setConnectionStatus('connected');
            toast.success(t('app.encryptedSession'));
            announce('Connection established successfully');

            const discovery = getLocalDiscovery();
            const myInfo = discovery.getMyDeviceInfo();
            channel.send(JSON.stringify({ type: 'device-info', deviceId: myInfo.deviceId, name: myInfo.name, platform: myInfo.platform }));

            const manager = new PQCTransferManager();
            pqcManager.current = manager;

            try {
                const stored = localStorage.getItem('tallow_settings');
                if (stored) { const s = JSON.parse(stored); if (s.bandwidthLimit > 0) {manager.setBandwidthLimit(s.bandwidthLimit);} }
            } catch { /* ignore */ }

            await manager.initializeSession(isInitiator ? 'send' : 'receive');
            manager.setDataChannel(channel);

            manager.onSessionReady(() => {
                setPqcReady(true);
                toast.success(t('app.pqcActive'));
            });

            manager.onProgress((progress) => {
                setSendProgress(progress);
                setReceiveProgress(progress);
                if (transferStartTime.current > 0) {
                    const elapsed = (Date.now() - transferStartTime.current) / 1000;
                    if (elapsed > 0 && progress > 0) {
                        const estimatedTotal = 1000000;
                        setSendSpeed((progress / 100) * estimatedTotal / elapsed);
                    }
                }
            });

            manager.onComplete((blob, filename, relativePath) => {
                setIsReceiving(false);
                setReceiveProgress(0);
                const file: ReceivedFile = {
                    name: relativePath || filename,
                    type: blob.type || 'application/octet-stream',
                    size: blob.size,
                    blob,
                    receivedAt: new Date(),
                    ...(relativePath ? { relativePath } : {})
                };
                setReceivedFiles(prev => [...prev, file]);
                addTransferRecord({
                    id: generateUUID(),
                    direction: 'receive',
                    files: [{ name: filename, size: blob.size, type: blob.type }],
                    totalSize: blob.size,
                    peerName: selectedDevice?.name || 'Connected Device',
                    peerId: selectedDevice?.id || 'peer',
                    status: 'completed',
                    startedAt: new Date(Date.now() - 5000),
                    completedAt: new Date(),
                    duration: 5000,
                    speed: blob.size / 5
                });
                toast.success(`${t('history.received')}: ${filename}`, {
                    action: { label: t('app.download'), onClick: () => downloadFile(blob, filename) }
                });
                setShowReceivedDialog(true);
                setIsSending(false);
                loadRecentTransfers();
            });

            manager.onFileIncoming((metadata) => {
                setIsReceiving(true);
                setReceiveProgress(0);
                setReceivingFileName(`${metadata.mimeCategory} (${formatFileSize(metadata.size)})`);
                transferStartTime.current = Date.now();
                toast.info(`${t('app.receiving')} (${formatFileSize(metadata.size)})...`);
                setConnectionStatus('transferring');
            });

            manager.onError((error) => {
                toast.error(t('app.transferFailed') + ': ' + error);
                setIsSending(false);
                setConnectionStatus('connected');
            });

            if (isInitiator) {manager.startKeyExchange();}

            manager.onVerificationReady((sharedSecret) => {
                const peerId = selectedDevice?.id || 'unknown';
                const peerName = selectedDevice?.name || 'Unknown Device';
                const alreadyVerified = isPeerVerified(peerId);
                if (!alreadyVerified || autoPromptVerification) {
                    const session = createVerificationSession(peerId, peerName, sharedSecret);
                    setVerificationSession(session);
                    setShowVerificationDialog(true);
                    if (!alreadyVerified) {toast.info(t('app.verifyConnection'), { description: t('app.verifyDesc'), duration: 5000 });}
                } else {
                    setPeerVerified(true);
                    toast.success(t('app.autoVerified'), { description: t('app.previouslyVerified') });
                }
            });
        };

        channel.onclose = () => {
            setIsConnected(false);
            setPqcReady(false);
            pqcManager.current?.destroy();
            pqcManager.current = null;
            setConnectionStatus('idle');
            announce('Connection closed');
            toast.info('Connection closed');
        };

        channel.onerror = () => { toast.error(t('app.connectionError')); };

        channel.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                if (pqcManager.current) {
                    const handled = await pqcManager.current.handleIncomingMessage(event.data);
                    if (handled) {return;}
                }
                try {
                    const message = JSON.parse(event.data);
                    handleControlMessage(message);
                } catch (_e) { /* Non-JSON string messages are ignored */ }
            }
        };
    }, [handleControlMessage, selectedDevice, autoPromptVerification, t]);

    // Create peer connection
    const createPeerConnection = useCallback((): RTCPeerConnection => {
        let rtcConfig: RTCConfiguration;
        if (transferMode === 'local') {
            rtcConfig = { iceServers: [], iceTransportPolicy: 'all' };
        } else {
            const transport = getPrivateTransport();
            rtcConfig = transport.getRTCConfiguration();
        }

        const pc = new RTCPeerConnection(rtcConfig);

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsConnecting(false);
                setConnectionStatus('connected');
                if (connectionTimeout.current) { clearTimeout(connectionTimeout.current); connectionTimeout.current = null; }
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setIsConnected(false);
                setIsConnecting(false);
                setConnectionStatus('idle');
                announce(pc.connectionState === 'failed' ? 'Connection failed' : 'Connection disconnected');
            }
        };

        pc.ondatachannel = (event) => {
            dataChannel.current = event.channel;
            setupDataChannel(event.channel, false);
        };

        return pc;
    }, [setupDataChannel, transferMode]);

    // Load recent transfers
    const loadRecentTransfers = useCallback(async () => {
        try {
            const transfers = await getRecentTransfers(5);
            const mapped: RecentTransfer[] = transfers.map(t => ({
                id: t.id,
                direction: t.direction,
                fileName: t.files[0]?.name || 'Unknown',
                fileSize: t.totalSize,
                peerName: t.peerName,
                completedAt: t.completedAt,
                status: t.status as 'completed' | 'failed'
            }));
            setRecentTransfers(mapped);
        } catch (e) {
            secureLog.error('Failed to load recent transfers:', e);
        }
    }, []);

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    useEffect(() => {
        preloadOnMount();
        migrateSensitiveData().catch(() => {});
        initVerificationCache();
        initFriendsCache();
        loadRecentTransfers();

        initializePrivacyFeatures().then(result => {
            setPrivacyInitResult(result);
            if (result.warnings.length > 0) {secureLog.warn('[App] Privacy warnings:', result.warnings);}
        }).catch(error => {
            secureLog.error('[App] Privacy init failed:', error);
        });

        registerServiceWorker({
            onSuccess: () => secureLog.log('[PWA] Service worker registered'),
            onUpdate: () => toast.info('New version available! Refresh to update.'),
            onError: (error) => secureLog.error('[PWA] Service worker error:', error)
        }).catch(error => {
            secureLog.error('[PWA] Service worker registration failed:', error);
        });

        thisDevice.current = {
            id: getDeviceId(),
            name: 'Web Device',
            platform: 'web',
            ip: null,
            port: null,
            isOnline: true,
            isFavorite: false,
            lastSeen: Date.now(),
            avatar: null
        };

        connectionManager.current = getConnectionManager();
        setConnectionCode(connectionManager.current.code);
        setFriendRequestCount(getPendingFriendRequests().length);
        setFriends(getFriends());

        const discovery = getLocalDiscovery();
        discovery.start();
        const unsubscribe = discovery.onDevicesChanged(setDiscoveredDevices);

        discovery.setSignalingEvents({
            onOffer: async (data) => {
                toast.info('Incoming connection...');
                cleanupConnection();
                setIsConnecting(true);
                setConnectionStatus('connecting');
                startConnectionTimeout();

                const pc = createPeerConnection();
                peerConnection.current = pc;
                pc.onicecandidate = (event) => { if (event.candidate) {discovery.sendIceCandidate(data.from, event.candidate.toJSON());} };
                await pc.setRemoteDescription(data.offer);
                await flushPendingCandidates();
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                discovery.sendAnswer(data.from, answer);
            },
            onIceCandidate: async (data) => { await addIceCandidate(data.candidate); },
        });

        return () => {
            discovery.stop();
            unsubscribe();
            connectionManager.current?.disconnect();
            cleanupConnection();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const regenerateCode = useCallback(() => {
        if (connectionManager.current) {
            const { wordCode, alphaCode } = connectionManager.current.regenerateCodes();
            setConnectionCode(codeType === 'word' ? wordCode : alphaCode);
            toast.success('New code generated');
        }
    }, [codeType]);

    const handleFilesSelected = useCallback((files: FileWithData[]) => {
        setSelectedFiles((prev) => [...prev, ...files]);
        toast.success(`Added ${files.length} file${files.length !== 1 ? 's' : ''}`);
    }, []);

    const handleRemoveFile = useCallback((id: string) => {
        setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const handleClearFiles = useCallback(() => {
        setSelectedFiles([]);
    }, []);

    const handleDeviceSelect = useCallback((device: Device) => {
        setSelectedDevice(device);
        const discovery = getLocalDiscovery();
        const targetSocketId = discovery.getDeviceSocketId(device.id);
        if (!targetSocketId) { toast.info(`Selected ${device.name}`); return; }

        cleanupConnection();
        setIsConnecting(true);
        setConnectionStatus('connecting');
        toast.info(`${t('app.connecting')} ${device.name}...`);
        startConnectionTimeout();

        discovery.setSignalingEvents({
            onAnswer: async (data) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(data.answer);
                    await flushPendingCandidates();
                }
            },
            onIceCandidate: async (data) => { await addIceCandidate(data.candidate); },
        });

        const pc = createPeerConnection();
        peerConnection.current = pc;
        pc.onicecandidate = (event) => { if (event.candidate) {discovery.sendIceCandidate(targetSocketId, event.candidate.toJSON());} };

        const channel = pc.createDataChannel('fileTransfer', { ordered: true });
        dataChannel.current = channel;
        setupDataChannel(channel, true);

        pc.createOffer().then(async (offer) => {
            await pc.setLocalDescription(offer);
            discovery.sendOffer(targetSocketId, offer);
        }).catch(() => {
            toast.error(t('app.connectionError'));
            setIsConnecting(false);
            setConnectionStatus('idle');
        });
    }, [createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout, t]);

    const handleConnectByCode = useCallback(async (code: string) => {
        cleanupConnection();
        setIsConnecting(true);
        setConnectionStatus('connecting');
        toast.info(`${t('app.connecting')} ${formatCode(code)}...`);

        try {
            const cm = connectionManager.current;
            if (!cm) {throw new Error('Connection manager not initialized');}

            cm.setEvents({
                onSignalingConnected: () => {},
                onSignalingDisconnected: () => { setIsConnected(false); setConnectionStatus('idle'); },
                onPeerConnected: async () => {
                    toast.info('Peer found, establishing connection...');
                    startConnectionTimeout();
                    const pc = createPeerConnection();
                    peerConnection.current = pc;
                    pc.onicecandidate = async (event) => { if (event.candidate) {await cm.sendIceCandidate(event.candidate.toJSON());} };
                    const channel = pc.createDataChannel('fileTransfer', { ordered: true });
                    dataChannel.current = channel;
                    setupDataChannel(channel, true);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await cm.sendOffer(offer);
                },
                onOffer: async (offer) => {
                    toast.info('Incoming connection...');
                    startConnectionTimeout();
                    const pc = createPeerConnection();
                    peerConnection.current = pc;
                    pc.onicecandidate = async (event) => { if (event.candidate) {await cm.sendIceCandidate(event.candidate.toJSON());} };
                    await pc.setRemoteDescription(offer);
                    await flushPendingCandidates();
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    await cm.sendAnswer(answer);
                },
                onAnswer: async (answer) => {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(answer);
                        await flushPendingCandidates();
                    }
                },
                onIceCandidate: async (candidate) => { await addIceCandidate(candidate); },
                onError: (error) => {
                    secureLog.error('[App] Signaling error:', error);
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                    setConnectionStatus('idle');
                },
            });

            await cm.connectToCode(code);
            const connectedDevice: Device = {
                id: code,
                name: `Device ${formatCode(code)}`,
                platform: 'web',
                ip: null,
                port: null,
                isOnline: true,
                isFavorite: false,
                lastSeen: Date.now(),
                avatar: null
            };
            setSelectedDevice(connectedDevice);
        } catch (error) {
            secureLog.error('Connection failed:', error);
            toast.error(t('app.connectionError'));
            setIsConnecting(false);
            setConnectionStatus('idle');
        }
    }, [createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout, t]);

    // Listen for incoming connections - SEND mode with Internet
    useEffect(() => {
        if (activeTab === 'send' && transferMode === 'internet' && connectionManager.current) {
            const cm = connectionManager.current;
            cm.setEvents({
                onSignalingConnected: () => {},
                onPeerConnected: async () => {
                    toast.info('Receiver connected...');
                    cleanupConnection();
                    setConnectionStatus('connecting');
                    startConnectionTimeout();
                    try {
                        const pc = createPeerConnection();
                        peerConnection.current = pc;
                        pc.onicecandidate = async (event) => { if (event.candidate) {await cm.sendIceCandidate(event.candidate.toJSON());} };
                        const channel = pc.createDataChannel('fileTransfer', { ordered: true });
                        dataChannel.current = channel;
                        setupDataChannel(channel, true);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        await cm.sendOffer(offer);
                    } catch (_error) {
                        toast.error(t('app.connectionError'));
                        setIsConnecting(false);
                        setConnectionStatus('idle');
                    }
                },
                onAnswer: async (answer) => {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(answer);
                        await flushPendingCandidates();
                    }
                },
                onIceCandidate: async (candidate) => { await addIceCandidate(candidate); },
                onError: (error) => {
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                    setConnectionStatus('idle');
                },
            });
            cm.startListening().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('not configured')) {toast.error(t('app.signalingError'));}
            });
            return () => { cm.disconnect(); cleanupConnection(); };
        }
        return undefined;
    }, [activeTab, transferMode, createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout, t]);

    // Listen for incoming connections - RECEIVE mode
    useEffect(() => {
        if (activeTab === 'receive' && transferMode === 'internet' && connectionManager.current) {
            const cm = connectionManager.current;
            cm.setEvents({
                onSignalingConnected: () => { toast.info(t('app.waitingConnection')); },
                onPeerConnected: () => { toast.info('Sender connected...'); },
                onOffer: async (offer) => {
                    toast.info('Incoming connection...');
                    cleanupConnection();
                    setIsConnecting(true);
                    setConnectionStatus('connecting');
                    startConnectionTimeout();
                    try {
                        const pc = createPeerConnection();
                        peerConnection.current = pc;
                        pc.onicecandidate = async (event) => { if (event.candidate) {await cm.sendIceCandidate(event.candidate.toJSON());} };
                        await pc.setRemoteDescription(offer);
                        await flushPendingCandidates();
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await cm.sendAnswer(answer);
                    } catch (_error) {
                        toast.error(t('app.connectionError'));
                        setIsConnecting(false);
                        setConnectionStatus('idle');
                    }
                },
                onAnswer: async (answer) => {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(answer);
                        await flushPendingCandidates();
                    }
                },
                onIceCandidate: async (candidate) => { await addIceCandidate(candidate); },
                onError: (error) => {
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                    setConnectionStatus('idle');
                },
            });
            cm.startListening().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('not configured')) {toast.error(t('app.signalingError'));}
            });
            return () => { cm.disconnect(); cleanupConnection(); };
        }
        return undefined;
    }, [activeTab, transferMode, createPeerConnection, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout, t]);

    // Warn before page unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSending || (isConnected && selectedFiles.length > 0)) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isSending, isConnected, selectedFiles.length]);

    // Send files
    const handleStartTransfer = useCallback(async () => {
        if (selectedFiles.length === 0) { toast.error('Please select files to send'); return; }
        if (!peerVerified) { toast.error('Verify connection first'); setShowVerificationDialog(true); return; }

        const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
        const startTime = Date.now();

        const newTransfer: Transfer = {
            id: generateUUID(),
            files: selectedFiles,
            from: thisDevice.current || { id: 'self', name: 'This Device', platform: 'web', ip: null, port: null, isOnline: true, isFavorite: false, lastSeen: Date.now(), avatar: null },
            to: selectedDevice || { id: 'peer', name: 'Peer', platform: 'web', ip: null, port: null, isOnline: true, isFavorite: false, lastSeen: Date.now(), avatar: null },
            status: 'transferring',
            progress: 0,
            speed: 0,
            direction: 'send',
            totalSize,
            transferredSize: 0,
            startTime,
            endTime: null,
            error: null,
            eta: null,
            quality: 'good',
            encryptionMetadata: null
        };

        setTransfers((prev) => [newTransfer, ...prev]);
        setIsSending(true);
        setConnectionStatus('transferring');
        transferStartTime.current = Date.now();

        if (filePassword) {
            await transferMetadata.setMetadata(newTransfer.id, {
                transferId: newTransfer.id,
                hasPassword: true,
                ...(filePasswordHint ? { passwordHint: filePasswordHint } : {}),
                createdAt: Date.now(),
                ...(selectedFiles[0]?.name ? { fileName: selectedFiles[0].name } : {}),
                fileSize: totalSize
            });
        }

        if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
            setTransfers((prev) => prev.map((t) => t.id === newTransfer.id ? { ...t, status: 'failed' } : t));
            setIsSending(false);
            setConnectionStatus('idle');
            toast.error('Not connected. Please connect first.');
            return;
        }

        if (!pqcManager.current || !pqcManager.current.isReady()) {
            setTransfers((prev) => prev.map((t) => t.id === newTransfer.id ? { ...t, status: 'failed' } : t));
            setIsSending(false);
            setConnectionStatus('connected');
            toast.error('Encrypted session not ready.');
            return;
        }

        try {
            setSendingFileTotal(selectedFiles.length);
            for (let i = 0; i < selectedFiles.length; i++) {
                const fileData = selectedFiles[i];
                if (!fileData) {continue;}
                setSendingFileIndex(i + 1);
                setSendingFileName(fileData.folderPath || fileData.name);
                setSendProgress(0);
                await pqcManager.current.sendFile(fileData.file, fileData.folderPath);
                toast.success(`Sent: ${fileData.name}`);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            setTransfers((prev) => prev.map((t) => t.id === newTransfer.id ? { ...t, status: 'completed', progress: 100, transferredSize: totalSize, endTime } : t));
            addTransferRecord({
                id: newTransfer.id,
                direction: 'send',
                files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                totalSize,
                peerName: selectedDevice?.name || 'Connected Device',
                peerId: selectedDevice?.id || 'peer',
                status: 'completed',
                startedAt: new Date(startTime),
                completedAt: new Date(endTime),
                duration,
                speed: totalSize / (duration / 1000)
            });

            setSelectedFiles([]);
            setSendProgress(0);
            setFilePassword(undefined);
            setFilePasswordHint(undefined);
            toast.success(t('app.transferComplete'));
            announce('All files sent successfully');
            loadRecentTransfers();
        } catch (error) {
            secureLog.error('Transfer failed:', error);
            setTransfers((prev) => prev.map((t) => t.id === newTransfer.id ? { ...t, status: 'failed' } : t));
            toast.error(t('app.transferFailed'));
        } finally {
            setIsSending(false);
            setConnectionStatus('connected');
        }
    }, [selectedFiles, selectedDevice, peerVerified, filePassword, filePasswordHint, t, loadRecentTransfers]);

    // Download handlers
    const handleDownloadFile = useCallback(async (file: ReceivedFile) => {
        await downloadFile(file.blob, file.name, file.relativePath);
        toast.success(`Saved ${file.name}`);
    }, []);

    const handleDownloadAll = useCallback(async () => {
        for (const file of receivedFiles) {
            await downloadFile(file.blob, file.name, file.relativePath);
        }
        toast.success(`Downloaded ${receivedFiles.length} files`);
    }, [receivedFiles]);

    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(connectionCode);
        toast.success(t('common.copied'));
    }, [connectionCode, t]);

    // Verification handlers
    const handleVerify = useCallback(() => {
        if (verificationSession) {
            markSessionVerified(verificationSession.peerId);
            setPeerVerified(true);
            setShowVerificationDialog(false);
            toast.success(t('verification.verified'));
        }
    }, [verificationSession, t]);

    const handleSkipVerification = useCallback(() => {
        if (verificationSession) {
            markSessionSkipped(verificationSession.peerId);
            setPeerVerified(true);
            setShowVerificationDialog(false);
            toast.info(t('verification.skipped'));
        }
    }, [verificationSession, t]);

    const handleRejectVerification = useCallback(() => {
        if (verificationSession) {
            markSessionFailed(verificationSession.peerId);
            setShowVerificationDialog(false);
            cleanupConnection();
            toast.error(t('verification.failed'));
        }
    }, [verificationSession, cleanupConnection, t]);

    // Refresh handlers
    const handleRefreshDevices = useCallback(() => {
        toast.info('Scanning for devices...');
        const discovery = getLocalDiscovery();
        discovery.refresh();
    }, []);

    const handleRefreshFriends = useCallback(() => {
        setFriendRequestCount(getPendingFriendRequests().length);
        setFriends(getFriends());
    }, []);

    // Friend handler
    const handleSendToFriend = useCallback((friend: Friend) => {
        setTransferMode('friends');
        const friendDevice: Device = {
            id: friend.id,
            name: friend.name,
            platform: 'web',
            ip: null,
            port: null,
            isOnline: true,
            isFavorite: true,
            lastSeen: typeof friend.lastConnected === 'number' ? friend.lastConnected : (friend.lastConnected ? (friend.lastConnected as Date).getTime() : Date.now()),
            avatar: friend.avatar || null
        };
        setSelectedDevice(friendDevice);
        updateFriendConnection(friend.id);
        if (!isPeerVerified(friend.id)) {toast.info(`First connection to ${friend.name}`);}
        else {toast.success(`Ready to send to ${friend.name}`);}
    }, []);

    // Format ETA
    const formatEta = useCallback((progress: number): string => {
        if (progress <= 0 || transferStartTime.current === 0) {return '';}
        const elapsed = Date.now() - transferStartTime.current;
        const totalEstimated = (elapsed / progress) * 100;
        const remaining = Math.max(0, totalEstimated - elapsed);
        if (remaining < 1000) {return '';}
        const secs = Math.ceil(remaining / 1000);
        if (secs < 60) {return `${secs}s`;}
        const mins = Math.floor(secs / 60);
        if (mins < 60) {return `${mins}m ${secs % 60}s`;}
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }, []);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    // ========================================================================
    // RENDER - EUVEKA STYLE
    // ========================================================================

    return (
        <div className="min-h-screen" style={{ backgroundColor: EUVEKA.bg.primary }}>
            {/* ================================================================
                HEADER BAR - Euveka Style
            ================================================================ */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626]" style={{ backgroundColor: EUVEKA.bg.primary }}>
                <div className="max-w-5xl 3xl:max-w-6xl 4xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
                    {/* Logo + Status */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="p-2 -ml-2 rounded-full hover:bg-[#fefefc]/5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#fefefc]/60" />
                        </Link>
                        <div className="flex items-center gap-2.5">
                            <motion.div
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#fefefc]/20 flex items-center justify-center"
                                whileHover={{ scale: 1.05, borderColor: 'rgba(254, 254, 252, 0.4)' }}
                            >
                                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#fefefc]" />
                            </motion.div>
                            <span className="text-base sm:text-lg font-semibold text-[#fefefc]">
                                {t('app.title')}
                            </span>
                        </div>

                        {/* Status Indicator */}
                        <div className={cn(
                            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
                            currentStatus === 'connected' && 'border-[#22c55e]/40 text-[#22c55e]',
                            currentStatus === 'connecting' && 'border-[#f59e0b]/40 text-[#f59e0b]',
                            currentStatus === 'transferring' && 'border-[#fefefc]/40 text-[#fefefc]',
                            currentStatus === 'idle' && 'border-[#262626] text-[#fefefc]/40'
                        )}>
                            <motion.span
                                className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    currentStatus === 'connected' && 'bg-[#22c55e]',
                                    currentStatus === 'connecting' && 'bg-[#f59e0b]',
                                    currentStatus === 'transferring' && 'bg-[#fefefc]',
                                    currentStatus === 'idle' && 'bg-[#fefefc]/40'
                                )}
                                animate={currentStatus === 'connecting' || currentStatus === 'transferring' ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                            {currentStatus === 'connected' && (pqcReady ? 'PQC Secured' : t('app.connected'))}
                            {currentStatus === 'connecting' && t('app.connecting')}
                            {currentStatus === 'transferring' && t('app.transferring')}
                            {currentStatus === 'idle' && t('app.ready')}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1.5">
                        {receivedFiles.length > 0 && (
                            <EuvekaButton
                                variant="ghost"
                                size="sm"
                                icon
                                onClick={() => setShowReceivedDialog(true)}
                                className="relative"
                            >
                                <FileDown className="w-4 h-4" />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#fefefc] text-[#0a0a08] text-[10px] flex items-center justify-center font-bold">
                                    {receivedFiles.length}
                                </span>
                            </EuvekaButton>
                        )}
                        <ThemeToggle />
                        <Link href="/app/history">
                            <EuvekaButton variant="ghost" size="sm" icon>
                                <History className="w-4 h-4" />
                            </EuvekaButton>
                        </Link>
                        <Link href="/app/settings">
                            <EuvekaButton variant="ghost" size="sm" icon>
                                <Settings className="w-4 h-4" />
                            </EuvekaButton>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ================================================================
                MAIN CONTENT
            ================================================================ */}
            <main id="main-content" className="pt-18 sm:pt-22 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="max-w-4xl lg:max-w-5xl mx-auto"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* ============================================================
                        SEND/RECEIVE TOGGLE - Pill Style
                    ============================================================ */}
                    <motion.div variants={itemVariants} className="flex justify-center mb-6 sm:mb-8">
                        <div className="p-1 rounded-full border border-[#262626] bg-[#141414]">
                            <div className="flex">
                                {(['send', 'receive'] as const).map((tab) => (
                                    <motion.button
                                        key={tab}
                                        onClick={() => { setActiveTab(tab); setTransferMode(null); }}
                                        className={cn(
                                            'relative px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2',
                                            activeTab === tab
                                                ? 'text-[#0a0a08]'
                                                : 'text-[#fefefc]/60 hover:text-[#fefefc]'
                                        )}
                                        whileHover={activeTab !== tab ? { scale: 1.02 } : {}}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="activeTabPill"
                                                className="absolute inset-0 bg-[#fefefc] rounded-full"
                                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center gap-2">
                                            {tab === 'send' ? <Upload className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                            {tab === 'send' ? t('app.send') : t('app.receive')}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ============================================================
                        TAB CONTENT
                    ============================================================ */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'send' ? (
                            <motion.div
                                key="send"
                                variants={tabSwitchVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-5 sm:space-y-6"
                            >
                                {/* File Drop Zone - Only when no mode selected */}
                                {!transferMode && (
                                    <motion.div variants={itemVariants}>
                                        <EuvekaCard
                                            className={cn(
                                                'p-5 sm:p-6 transition-all duration-300',
                                                isDragging && 'border-[#fefefc] bg-[#fefefc]/5'
                                            )}
                                        >
                                            <div
                                                ref={dropZoneRef}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                            >
                                                <FileSelectorWithPrivacy
                                                    onFilesSelected={handleFilesSelected}
                                                    selectedFiles={selectedFiles}
                                                    onRemoveFile={handleRemoveFile}
                                                    onClearAll={handleClearFiles}
                                                />
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Selected Files Summary */}
                                {selectedFiles.length > 0 && !transferMode && (
                                    <motion.div variants={itemVariants}>
                                        <EuvekaCard className="p-4 border-[#fefefc]/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border border-[#fefefc]/20 flex items-center justify-center">
                                                        <File className="w-4 h-4 text-[#fefefc]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#fefefc] text-sm">
                                                            {selectedFiles.length} {selectedFiles.length === 1 ? t('app.fileSelected') : t('app.filesSelected')}
                                                        </p>
                                                        <p className="text-xs text-[#fefefc]/60">
                                                            {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))} total
                                                        </p>
                                                    </div>
                                                </div>
                                                <EuvekaButton
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleClearFiles}
                                                    className="text-[#fefefc]/60 hover:text-[#ef4444]"
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" />
                                                    {t('app.clearFiles')}
                                                </EuvekaButton>
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Transfer Mode Cards - Bento Grid */}
                                {!transferMode && (
                                    <motion.div variants={itemVariants}>
                                        <h3 className="text-xs font-medium text-[#fefefc]/40 uppercase tracking-wider mb-4 px-1">
                                            {t('app.selectConnection')}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
                                            {/* Local Network Card */}
                                            <EuvekaCard
                                                interactive
                                                onClick={() => setTransferMode('local')}
                                                className="p-4 sm:p-5 group h-full flex flex-col"
                                            >
                                                <div className="w-11 h-11 rounded-full border border-[#fefefc]/10 flex items-center justify-center mb-3 group-hover:border-[#fefefc]/30 transition-colors">
                                                    <Wifi className="w-5 h-5 text-[#fefefc]" />
                                                </div>
                                                <h4 className="font-semibold text-[#fefefc] mb-1.5 text-base">
                                                    {t('app.localNetwork')}
                                                </h4>
                                                <p className="text-sm text-[#fefefc]/50 leading-relaxed flex-grow">
                                                    {t('app.localNetworkDesc')}
                                                </p>
                                                <div className="flex items-center justify-between mt-auto pt-3">
                                                    <MDNSStatusIndicator size="sm" className="opacity-70 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center gap-1 text-[#fefefc]/60 text-xs font-medium group-hover:text-[#fefefc] transition-colors">
                                                        <span>Connect</span>
                                                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                    </div>
                                                </div>
                                            </EuvekaCard>

                                            {/* Internet P2P Card */}
                                            <EuvekaCard
                                                interactive
                                                onClick={() => setTransferMode('internet')}
                                                className="p-4 sm:p-5 group h-full flex flex-col"
                                            >
                                                <div className="w-11 h-11 rounded-full border border-[#fefefc]/10 flex items-center justify-center mb-3 group-hover:border-[#fefefc]/30 transition-colors">
                                                    <Globe className="w-5 h-5 text-[#fefefc]" />
                                                </div>
                                                <h4 className="font-semibold text-[#fefefc] mb-1.5 text-base">
                                                    {t('app.internetP2P')}
                                                </h4>
                                                <p className="text-sm text-[#fefefc]/50 leading-relaxed flex-grow">
                                                    {t('app.internetP2PDesc')}
                                                </p>
                                                <div className="flex items-center gap-1 text-[#fefefc]/60 text-xs font-medium group-hover:text-[#fefefc] transition-colors mt-auto pt-3">
                                                    <span>Connect</span>
                                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </EuvekaCard>

                                            {/* Friends Card */}
                                            <EuvekaCard
                                                interactive
                                                onClick={() => setTransferMode('friends')}
                                                className="p-4 sm:p-5 group relative h-full flex flex-col"
                                            >
                                                {friendRequestCount > 0 && (
                                                    <motion.span
                                                        className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#fefefc] text-[#0a0a08] text-[10px] font-bold flex items-center justify-center"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500 }}
                                                    >
                                                        {friendRequestCount}
                                                    </motion.span>
                                                )}
                                                <div className="w-11 h-11 rounded-full border border-[#fefefc]/10 flex items-center justify-center mb-3 group-hover:border-[#fefefc]/30 transition-colors">
                                                    <Users className="w-5 h-5 text-[#fefefc]" />
                                                </div>
                                                <h4 className="font-semibold text-[#fefefc] mb-1.5 text-base">
                                                    {t('app.friends')}
                                                </h4>
                                                <p className="text-sm text-[#fefefc]/50 leading-relaxed flex-grow">
                                                    {t('app.friendsDesc')}
                                                </p>
                                                <div className="flex items-center gap-1 text-[#fefefc]/60 text-xs font-medium group-hover:text-[#fefefc] transition-colors mt-auto pt-3">
                                                    <span>View Friends</span>
                                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </EuvekaCard>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Mode-specific content */}
                                {transferMode === 'local' && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <EuvekaButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTransferMode(null)}
                                                className="text-[#fefefc]/60"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                                                {t('app.back')}
                                            </EuvekaButton>
                                            <MDNSStatusIndicator size="sm" />
                                            <EuvekaButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRefreshDevices}
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                                {t('app.refresh')}
                                            </EuvekaButton>
                                        </div>
                                        <EuvekaCard className="p-4 sm:p-5">
                                            <DeviceListAnimated
                                                devices={localDevices}
                                                selectedDevice={selectedDevice}
                                                onDeviceSelect={handleDeviceSelect}
                                                onToggleFavorite={() => {}}
                                                onRefresh={handleRefreshDevices}
                                                isLoading={false}
                                            />
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {transferMode === 'internet' && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
                                        <EuvekaButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTransferMode(null)}
                                            className="text-[#fefefc]/60"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                                            {t('app.back')}
                                        </EuvekaButton>

                                        {/* Connection Code Display */}
                                        <EuvekaCard className="p-5 sm:p-6" glow>
                                            <div className="text-center mb-4">
                                                <h4 className="text-base font-semibold text-[#fefefc] mb-1.5">
                                                    {t('app.yourCode')}
                                                </h4>
                                                <p className="text-sm text-[#fefefc]/50">
                                                    {t('app.shareCode')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-1 p-4 rounded-xl bg-[#0a0a08] border border-[#262626] font-mono text-lg text-center text-[#fefefc] tracking-wider">
                                                    {connectionCode}
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <EuvekaButton
                                                        variant="outline"
                                                        size="sm"
                                                        icon
                                                        onClick={handleCopyCode}
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </EuvekaButton>
                                                    <EuvekaButton
                                                        variant="outline"
                                                        size="sm"
                                                        icon
                                                        onClick={regenerateCode}
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                    </EuvekaButton>
                                                </div>
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {transferMode === 'friends' && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <EuvekaButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setTransferMode(null)}
                                                className="text-[#fefefc]/60"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                                                {t('app.back')}
                                            </EuvekaButton>
                                            <EuvekaButton
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleRefreshFriends}
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                                {t('app.refresh')}
                                            </EuvekaButton>
                                        </div>
                                        <EuvekaCard className="p-4 sm:p-5">
                                            <FriendsList
                                                onSendToFriend={handleSendToFriend}
                                            />
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Connected State - Ready to Send */}
                                {isConnected && selectedDevice && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                                        <EuvekaCard className="p-4 sm:p-5 border-[#22c55e]/30">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full border border-[#22c55e]/30 flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-[#22c55e]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#fefefc] text-sm">
                                                            {t('app.connectedTo')} {selectedDevice.name}
                                                        </p>
                                                        <p className="text-xs text-[#fefefc]/50">
                                                            {pqcReady ? 'Post-quantum encryption active' : 'Establishing encryption...'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {peerVerified && (
                                                    <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        Verified
                                                    </div>
                                                )}
                                            </div>

                                            {selectedFiles.length > 0 && (
                                                <EuvekaButton
                                                    variant="filled"
                                                    size="md"
                                                    onClick={handleStartTransfer}
                                                    disabled={!pqcReady || isSending}
                                                    className="w-full"
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            {t('app.sending')} ({sendingFileIndex}/{sendingFileTotal})
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="w-4 h-4" />
                                                            {t('app.sendFiles')}
                                                        </>
                                                    )}
                                                </EuvekaButton>
                                            )}
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Transfer Progress */}
                                {(isSending || isReceiving) && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                                        <EuvekaCard className="p-4 sm:p-5">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <span className="font-medium text-[#fefefc] text-sm truncate mr-3">
                                                    {isSending ? sendingFileName : receivingFileName}
                                                </span>
                                                <span className="text-sm font-medium text-[#fefefc]">
                                                    {Math.round(isSending ? sendProgress : receiveProgress)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden mb-2.5">
                                                <motion.div
                                                    className="h-full bg-[#fefefc] rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${isSending ? sendProgress : receiveProgress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-[#fefefc]/50">
                                                <span className="flex items-center gap-1.5">
                                                    {isSending ? <Upload className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                                                    {isSending ? t('app.sending') : t('app.receiving')}
                                                </span>
                                                <span>{formatEta(isSending ? sendProgress : receiveProgress)}</span>
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Recent Transfers Preview */}
                                {!transferMode && !isConnected && recentTransfers.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <h3 className="text-xs font-medium text-[#fefefc]/40 uppercase tracking-wider">
                                                Recent Transfers
                                            </h3>
                                            <Link href="/app/history" className="text-xs text-[#fefefc]/60 font-medium hover:text-[#fefefc] transition-colors">
                                                View All
                                            </Link>
                                        </div>
                                        <EuvekaCard className="divide-y divide-[#262626]">
                                            {recentTransfers.slice(0, 3).map((transfer, i) => (
                                                <motion.div
                                                    key={transfer.id}
                                                    className="flex items-center gap-3 p-3"
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                >
                                                    <div className={cn(
                                                        'w-9 h-9 rounded-full border flex items-center justify-center',
                                                        transfer.direction === 'send'
                                                            ? 'border-[#fefefc]/20'
                                                            : 'border-[#22c55e]/30'
                                                    )}>
                                                        {transfer.direction === 'send' ? (
                                                            <Upload className="w-3.5 h-3.5 text-[#fefefc]" />
                                                        ) : (
                                                            <Download className="w-3.5 h-3.5 text-[#22c55e]" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-[#fefefc] text-sm truncate">
                                                            {transfer.fileName}
                                                        </p>
                                                        <p className="text-xs text-[#fefefc]/50">
                                                            {transfer.peerName} - {formatFileSize(transfer.fileSize)}
                                                        </p>
                                                    </div>
                                                    <div className="text-[10px] text-[#fefefc]/40 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(transfer.completedAt).toLocaleDateString()}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </EuvekaCard>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            /* ============================================================
                                RECEIVE TAB
                            ============================================================ */
                            <motion.div
                                key="receive"
                                variants={tabSwitchVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-5 sm:space-y-6"
                            >
                                {/* Code Input */}
                                {!transferMode && !isConnected && (
                                    <motion.div variants={itemVariants} className="space-y-4">
                                        {/* Enter Code Card */}
                                        <EuvekaCard className="p-5 sm:p-6" glow>
                                            <div className="text-center mb-4">
                                                <h3 className="text-base sm:text-lg font-semibold text-[#fefefc] mb-1.5">
                                                    {t('app.enterCode')}
                                                </h3>
                                                <p className="text-sm text-[#fefefc]/50">
                                                    Enter the code from the sender to connect
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <Input
                                                    value={inputCode}
                                                    onChange={(e) => setInputCode(e.target.value)}
                                                    placeholder="e.g. apple-berry-cloud or AB3X#K"
                                                    className="h-12 text-base text-center font-mono tracking-wider rounded-xl border-[#262626] bg-[#0a0a08] text-[#fefefc] placeholder:text-[#fefefc]/30 focus:border-[#fefefc]/40 focus:ring-0"
                                                />
                                                <EuvekaButton
                                                    variant="filled"
                                                    size="md"
                                                    onClick={() => handleConnectByCode(inputCode)}
                                                    disabled={!inputCode.trim() || isConnecting}
                                                    className="w-full"
                                                >
                                                    {isConnecting ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            {t('app.connecting')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronRight className="w-4 h-4" />
                                                            {t('app.connect')}
                                                        </>
                                                    )}
                                                </EuvekaButton>
                                            </div>
                                        </EuvekaCard>

                                        {/* QR Scanner Option */}
                                        <EuvekaCard
                                            interactive
                                            onClick={() => setTransferMode('internet')}
                                            className="p-4 border-dashed group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full border border-[#fefefc]/10 flex items-center justify-center group-hover:border-[#fefefc]/30 transition-colors">
                                                    <QrCode className="w-5 h-5 text-[#fefefc]/60 group-hover:text-[#fefefc] transition-colors" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-[#fefefc] text-sm">
                                                        {t('app.scanQR')}
                                                    </h4>
                                                    <p className="text-xs text-[#fefefc]/50">
                                                        {t('app.orEnterCode')}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-[#fefefc]/40 group-hover:text-[#fefefc] group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Waiting for connection */}
                                {transferMode === 'internet' && !isConnected && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="space-y-4">
                                        <EuvekaButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTransferMode(null)}
                                            className="text-[#fefefc]/60"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                                            {t('app.back')}
                                        </EuvekaButton>
                                        <EuvekaCard className="p-8 sm:p-10 text-center" glow>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="w-12 h-12 mx-auto mb-5"
                                            >
                                                <Loader2 className="w-12 h-12 text-[#fefefc]" />
                                            </motion.div>
                                            <p className="text-base font-medium text-[#fefefc] mb-1.5">
                                                {t('app.waitingConnection')}
                                            </p>
                                            <p className="text-sm text-[#fefefc]/50">
                                                Share your code with the sender
                                            </p>
                                            <div className="mt-5 p-3 rounded-xl bg-[#0a0a08] border border-[#262626] font-mono text-base text-[#fefefc]">
                                                {connectionCode}
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Connected - Receiving */}
                                {isConnected && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                                        <EuvekaCard className="p-4 sm:p-5 border-[#22c55e]/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full border border-[#22c55e]/30 flex items-center justify-center">
                                                    <Check className="w-5 h-5 text-[#22c55e]" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#fefefc] text-sm">
                                                        {t('app.connectedTo')} {selectedDevice?.name || 'Peer'}
                                                    </p>
                                                    <p className="text-xs text-[#fefefc]/50">
                                                        {isReceiving ? t('app.receiving') : 'Ready to receive files'}
                                                    </p>
                                                </div>
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}

                                {/* Receive Progress */}
                                {isReceiving && (
                                    <motion.div variants={itemVariants} initial="hidden" animate="visible">
                                        <EuvekaCard className="p-4 sm:p-5">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <span className="font-medium text-[#fefefc] text-sm truncate mr-3">
                                                    {receivingFileName}
                                                </span>
                                                <span className="text-sm font-medium text-[#fefefc]">
                                                    {Math.round(receiveProgress)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-[#fefefc] rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${receiveProgress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        </EuvekaCard>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ============================================================
                        PRIVACY WARNING
                    ============================================================ */}
                    {privacyInitResult?.warnings && privacyInitResult.warnings.length > 0 && (
                        <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mt-6">
                            <EuvekaCard className="p-4 border-[#f59e0b]/30">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full border border-[#f59e0b]/30 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-[#fefefc] text-sm mb-0.5">
                                            Privacy Warning
                                        </p>
                                        <p className="text-xs text-[#fefefc]/60 mb-3">
                                            WebRTC may expose your IP address to connected peers.
                                        </p>
                                        <EuvekaButton
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.location.href = '/app/settings#privacy'}
                                            className="border-[#f59e0b]/30 text-[#f59e0b] hover:bg-[#f59e0b]/10"
                                        >
                                            Enable Relay Mode
                                        </EuvekaButton>
                                    </div>
                                </div>
                            </EuvekaCard>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* ================================================================
                RECEIVED FILES DIALOG
            ================================================================ */}
            <AnimatePresence>
                {showReceivedDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowReceivedDialog(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <EuvekaCard className="overflow-hidden" glow>
                                <div className="p-4 border-b border-[#262626]">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-[#fefefc]">
                                            {t('app.receivedFiles')}
                                        </h2>
                                        <EuvekaButton
                                            variant="ghost"
                                            size="sm"
                                            icon
                                            onClick={() => setShowReceivedDialog(false)}
                                        >
                                            <X className="w-4 h-4" />
                                        </EuvekaButton>
                                    </div>
                                </div>

                                <ScrollArea className="max-h-72">
                                    <div className="p-3 space-y-1.5">
                                        {receivedFiles.map((file, index) => {
                                            const FileIcon = getFileIcon(file.type);
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#fefefc]/5 group transition-colors"
                                                >
                                                    <div className="w-9 h-9 rounded-full border border-[#262626] flex items-center justify-center shrink-0">
                                                        <FileIcon className="w-4 h-4 text-[#fefefc]/60" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-[#fefefc] text-sm truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-[#fefefc]/50">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                    <EuvekaButton
                                                        variant="ghost"
                                                        size="sm"
                                                        icon
                                                        onClick={() => handleDownloadFile(file)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </EuvekaButton>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                {receivedFiles.length > 0 && (
                                    <div className="p-4 border-t border-[#262626]">
                                        <EuvekaButton
                                            variant="filled"
                                            size="md"
                                            onClick={handleDownloadAll}
                                            className="w-full"
                                        >
                                            <Download className="w-4 h-4" />
                                            {t('app.downloadAll')}
                                        </EuvekaButton>
                                    </div>
                                )}
                            </EuvekaCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================================================================
                VERIFICATION DIALOG
            ================================================================ */}
            {showVerificationDialog && verificationSession && (
                <LazyVerificationDialog
                    open={showVerificationDialog}
                    onOpenChange={setShowVerificationDialog}
                    session={verificationSession}
                    peerName={selectedDevice?.name || 'Unknown Device'}
                    onVerified={handleVerify}
                    onSkipped={handleSkipVerification}
                    onFailed={handleRejectVerification}
                    isPreviouslyVerified={isPeerVerified(verificationSession.peerId)}
                />
            )}
        </div>
    );
}
