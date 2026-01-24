'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { generateUUID } from '@/lib/utils/uuid';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    ArrowRight,
    Loader2,
    Zap,
    Shield,
    Check,
    Copy,
    FileDown,
    Clipboard,
    RefreshCw,
    Users,
    Mail,
} from "lucide-react";
import { FileSelector, FileWithData } from "@/components/transfer/file-selector";
import { TransferQueue } from "@/components/transfer/transfer-queue";
import { DeviceList } from "@/components/devices/device-list";
import { ManualConnect } from "@/components/devices/manual-connect";
import { Device, Transfer } from "@/lib/types";
import { getConnectionManager, ConnectionManager } from "@/lib/signaling/connection-manager";
import { downloadFile, formatFileSize } from "@/lib/hooks/use-file-transfer";
import { getDeviceId } from "@/lib/auth/user-identity";
import { generateWordPhrase, generateShortCode, formatCode, detectCodeType } from "@/lib/transfer/word-phrase-codes";
import { addTransferRecord } from "@/lib/storage/transfer-history";
import { migrateSensitiveData } from "@/lib/storage/secure-storage";
import { getLocalDiscovery, DiscoveredDevice } from "@/lib/discovery/local-discovery";
import { readClipboard, writeClipboard, addToClipboardHistory } from "@/lib/features/clipboard-sync";
import { TransferConfirmDialog } from "@/components/transfer/transfer-confirm-dialog";
import { TransferProgress } from "@/components/transfer/transfer-progress";
import { FriendsList } from "@/components/friends/friends-list";
import { PasswordInputDialog } from "@/components/transfer/password-input-dialog";
import { Friend, getTrustedFriends, isFriend, requiresPasscode, updateFriendConnection, getPendingFriendRequests, initFriendsCache } from "@/lib/storage/friends";
import { encryptFileWithPassword, decryptFileWithPassword } from "@/lib/transfer/file-encryption";
import { VerificationDialog, VerificationBadge } from "@/components/security/verification-dialog";
import { VerificationSession, createVerificationSession, markSessionVerified, markSessionFailed, markSessionSkipped, isPeerVerified, initVerificationCache } from "@/lib/crypto/peer-authentication";
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageDropdown } from '@/components/language-dropdown';
import { useLanguage } from '@/lib/i18n/language-context';
import { getPrivateTransport } from '@/lib/transport/private-webrtc';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { io } from 'socket.io-client';
import { secureLog } from '@/lib/utils/secure-logger';

interface ReceivedFile {
    name: string;
    type: string;
    size: number;
    blob: Blob;
    receivedAt: Date;
    relativePath?: string;
}

export default function AppPage() {
    // Translation
    const { t } = useLanguage();

    // User-friendly error message mapping
    const getUserFriendlyError = (error: string): string => {
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
    };

    // App state
    const [mode, setMode] = useState<'send' | 'receive'>('send');
    const [connectionType, setConnectionType] = useState<'local' | 'internet' | 'friends' | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [friendRequestCount, setFriendRequestCount] = useState(0);
    const [transferPassword, setTransferPassword] = useState<string | undefined>(undefined);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [pendingDecryptFile, setPendingDecryptFile] = useState<ReceivedFile | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<FileWithData[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [sendingFileIndex, setSendingFileIndex] = useState(0);
    const [sendingFileTotal, setSendingFileTotal] = useState(0);
    const [sendingFileName, setSendingFileName] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);
    const [receiveProgress, setReceiveProgress] = useState(0);
    const [receivingFileName, setReceivingFileName] = useState('');
    const transferStartTime = useRef<number>(0);
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
    const [showReceivedDialog, setShowReceivedDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [transferSpeed, setTransferSpeed] = useState(0);

    // Email share state
    const [showEmailShareDialog, setShowEmailShareDialog] = useState(false);
    const [shareEmail, setShareEmail] = useState('');
    const [shareId, setShareId] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareStatus, setShareStatus] = useState<'idle' | 'waiting' | 'connected' | 'transferring' | 'done'>('idle');

    // PQC encryption state
    const [pqcReady, setPqcReady] = useState(false);

    // SAS Verification state
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [verificationSession, setVerificationSession] = useState<VerificationSession | null>(null);
    const [peerVerified, setPeerVerified] = useState(false);

    // Code state - support both word phrases and short codes
    const [codeType, setCodeType] = useState<'word' | 'short'>('word');
    const [connectionCode, setConnectionCode] = useState('');

    // Local discovery
    const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);

    // Connection refs
    const connectionManager = useRef<ConnectionManager | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const pqcManager = useRef<PQCTransferManager | null>(null);
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const connectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const thisDevice = useRef<Device | null>(null);

    // Helper: safely add ICE candidate (queues if remote description not set)
    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnection.current;
        if (!pc) return;

        if (pc.remoteDescription) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                secureLog.error('Failed to add ICE candidate:', e);
            }
        } else {
            pendingCandidates.current.push(candidate);
        }
    }, []);

    // Helper: flush queued ICE candidates after remote description is set
    const flushPendingCandidates = useCallback(async () => {
        const pc = peerConnection.current;
        if (!pc || !pc.remoteDescription) return;

        const candidates = pendingCandidates.current.splice(0);
        for (const candidate of candidates) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                secureLog.error('Failed to add queued ICE candidate:', e);
            }
        }
    }, []);

    // Helper: clean up existing peer connection before creating a new one
    const cleanupConnection = useCallback(() => {
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
            connectionTimeout.current = null;
        }
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        pqcManager.current?.destroy();
        pqcManager.current = null;
        pendingCandidates.current = [];
        setPqcReady(false);
    }, []);

    // Helper: start connection timeout
    const startConnectionTimeout = useCallback((timeoutMs = 30000) => {
        if (connectionTimeout.current) {
            clearTimeout(connectionTimeout.current);
        }
        connectionTimeout.current = setTimeout(() => {
            if (!peerConnection.current || peerConnection.current.connectionState !== 'connected') {
                toast.error('Connection timed out. The peer may be unreachable.');
                cleanupConnection();
                setIsConnecting(false);
                setIsConnected(false);
            }
        }, timeoutMs);
    }, [cleanupConnection]);

    // Handle control messages (non-file messages like clipboard)
    const handleControlMessage = useCallback(async (message: any) => {
        switch (message.type) {
            case 'clipboard':
                writeClipboard(message.content);
                await addToClipboardHistory({
                    content: message.content,
                    fromDevice: message.senderId,
                    fromName: message.senderName,
                    isLocal: false,
                });
                toast.success('Clipboard received', {
                    description: message.content.slice(0, 50) + (message.content.length > 50 ? '...' : ''),
                });
                break;
            case 'device-info':
                // Update discovered device with real info after WebRTC connects
                if (message.deviceId && message.name) {
                    const discovery = getLocalDiscovery();
                    discovery.updateDeviceInfo(message.deviceId, message.name, message.platform || 'unknown');
                    // Update selected device if it matches
                    setSelectedDevice(prev => {
                        if (prev && prev.id === message.deviceId) {
                            return { ...prev, name: message.name, platform: message.platform || prev.platform };
                        }
                        return prev;
                    });
                }
                break;
        }
    }, []);

    // Setup data channel handlers
    const setupDataChannel = useCallback((channel: RTCDataChannel, isInitiator = true) => {
        channel.binaryType = 'arraybuffer';

        channel.onopen = async () => {
            setIsConnected(true);
            setIsConnecting(false);
            toast.success(isInitiator ? 'Connected! Establishing encrypted session...' : 'Connected! Waiting for encrypted session...');

            // Send real device info over the encrypted data channel
            const discovery = getLocalDiscovery();
            const myInfo = discovery.getMyDeviceInfo();
            channel.send(JSON.stringify({
                type: 'device-info',
                deviceId: myInfo.deviceId,
                name: myInfo.name,
                platform: myInfo.platform,
            }));

            // Initialize PQC encrypted session
            const manager = new PQCTransferManager();
            pqcManager.current = manager;

            // Apply bandwidth limit from settings
            try {
                const stored = localStorage.getItem('tallow_settings');
                if (stored) {
                    const s = JSON.parse(stored);
                    if (s.bandwidthLimit > 0) {
                        manager.setBandwidthLimit(s.bandwidthLimit);
                    }
                }
            } catch { /* ignore */ }

            await manager.initializeSession(isInitiator ? 'send' : 'receive');
            manager.setDataChannel(channel);

            manager.onSessionReady(() => {
                setPqcReady(true);
                toast.success('PQC encryption active. Ready to transfer.');
            });

            manager.onProgress((progress) => {
                setSendProgress(progress);
                setReceiveProgress(progress);
            });

            manager.onComplete((blob, filename, relativePath) => {
                setIsReceiving(false);
                setReceiveProgress(0);
                const displayName = relativePath || filename;
                const file: ReceivedFile = {
                    name: displayName,
                    type: blob.type || 'application/octet-stream',
                    size: blob.size,
                    blob,
                    receivedAt: new Date(),
                    relativePath,
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
                    speed: blob.size / 5,
                });
                toast.success(`Received: ${filename}`, {
                    action: {
                        label: 'Download',
                        onClick: () => downloadFile(blob, filename),
                    },
                });
                setShowReceivedDialog(true);
                setIsSending(false);
            });

            manager.onFileIncoming((metadata) => {
                setIsReceiving(true);
                setReceiveProgress(0);
                setReceivingFileName(`${metadata.mimeCategory} (${formatFileSize(metadata.size)})`);
                transferStartTime.current = Date.now();
                toast.info(`Receiving encrypted file (${formatFileSize(metadata.size)})...`);
            });

            manager.onError((error) => {
                toast.error('Encrypted transfer failed: ' + error);
                setIsSending(false);
            });

            // Only the initiator starts the key exchange
            if (isInitiator) {
                manager.startKeyExchange();
            }

            // Setup verification callback - triggered when shared secret is ready
            manager.onVerificationReady((sharedSecret) => {
                const peerId = selectedDevice?.id || 'unknown';
                const peerName = selectedDevice?.name || 'Unknown Device';

                if (!isPeerVerified(peerId)) {
                    // Use the actual cryptographically strong shared secret from PQC key exchange
                    const session = createVerificationSession(peerId, peerName, sharedSecret);
                    setVerificationSession(session);
                    setShowVerificationDialog(true);
                } else {
                    setPeerVerified(true);
                }
            });
        };

        channel.onclose = () => {
            setIsConnected(false);
            setPqcReady(false);
            pqcManager.current?.destroy();
            pqcManager.current = null;
            toast.info('Connection closed');
        };

        channel.onerror = () => {
            toast.error('Connection error');
        };

        channel.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                // Route to PQC manager first
                if (pqcManager.current) {
                    const handled = await pqcManager.current.handleIncomingMessage(event.data);
                    if (handled) return;
                }

                // Fall through to control messages (clipboard, etc.)
                try {
                    const message = JSON.parse(event.data);
                    handleControlMessage(message);
                } catch (e) {
                    // Non-JSON string messages are ignored
                }
            }
        };
    }, [handleControlMessage]);

    // Create peer connection with mode-appropriate ICE configuration
    const createPeerConnection = useCallback((): RTCPeerConnection => {
        let rtcConfig: RTCConfiguration;

        if (connectionType === 'local') {
            // Local mode: no STUN/TURN needed, LAN host candidates suffice
            rtcConfig = { iceServers: [], iceTransportPolicy: 'all' };
        } else {
            // Internet/friends mode: use private transport (TURN relay if configured)
            const transport = getPrivateTransport();
            rtcConfig = transport.getRTCConfiguration();
        }

        const pc = new RTCPeerConnection(rtcConfig);

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setIsConnected(true);
                setIsConnecting(false);
                if (connectionTimeout.current) {
                    clearTimeout(connectionTimeout.current);
                    connectionTimeout.current = null;
                }
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                setIsConnected(false);
                setIsConnecting(false);
            }
        };

        pc.ondatachannel = (event) => {
            dataChannel.current = event.channel;
            setupDataChannel(event.channel, false);
        };

        return pc;
    }, [setupDataChannel, connectionType]);

    // Initialize
    useEffect(() => {
        // Encrypt all sensitive data in localStorage on startup
        migrateSensitiveData().catch(() => {});
        // Initialize caches from secure storage
        initVerificationCache();
        initFriendsCache();

        // Set up device for transfers
        thisDevice.current = {
            id: getDeviceId(),
            name: 'Web Device',
            platform: 'web',
            isOnline: true,
            isFavorite: false,
            lastSeen: new Date(),
        };

        // Initialize connection manager
        connectionManager.current = getConnectionManager();

        // Use the connection manager's generated code
        setConnectionCode(connectionManager.current.code);

        // Load friend request count
        setFriendRequestCount(getPendingFriendRequests().length);

        // Start local discovery
        const discovery = getLocalDiscovery();
        discovery.start();
        const unsubscribe = discovery.onDevicesChanged(setDiscoveredDevices);

        // Handle incoming local device connections
        discovery.setSignalingEvents({
            onOffer: async (data) => {
                toast.info('Incoming local connection...');
                cleanupConnection();
                setIsConnecting(true);
                startConnectionTimeout();

                const pc = createPeerConnection();
                peerConnection.current = pc;

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        discovery.sendIceCandidate(data.from, event.candidate.toJSON());
                    }
                };

                await pc.setRemoteDescription(data.offer);
                await flushPendingCandidates();
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                discovery.sendAnswer(data.from, answer);
            },
            onIceCandidate: async (data) => {
                await addIceCandidate(data.candidate);
            },
        });

        return () => {
            discovery.stop();
            unsubscribe();
            connectionManager.current?.disconnect();
            cleanupConnection();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Generate new code
    const regenerateCode = useCallback(() => {
        if (connectionManager.current) {
            const { wordCode, alphaCode } = connectionManager.current.regenerateCodes();
            setConnectionCode(codeType === 'word' ? wordCode : alphaCode);
            toast.success('New code generated');
        }
    }, [codeType]);

    // Toggle code type
    const toggleCodeType = useCallback(() => {
        if (!connectionManager.current) return;
        if (codeType === 'word') {
            setCodeType('short');
            setConnectionCode(connectionManager.current.shortCode);
        } else {
            setCodeType('word');
            setConnectionCode(connectionManager.current.code);
        }
    }, [codeType]);

    // File selection handlers
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

    // Convert discovered devices to Device format
    const localDevices: Device[] = discoveredDevices.map(d => ({
        id: d.id,
        name: d.name,
        platform: d.platform as any,
        isOnline: d.isOnline,
        isFavorite: false,
        lastSeen: d.lastSeen,
    }));

    // Device handlers - initiates WebRTC connection for local devices
    const handleDeviceSelect = useCallback((device: Device) => {
        setSelectedDevice(device);

        // For local devices, initiate WebRTC via discovery signaling
        const discovery = getLocalDiscovery();
        const targetSocketId = discovery.getDeviceSocketId(device.id);

        if (!targetSocketId) {
            toast.info(`Selected ${device.name}`);
            return;
        }

        cleanupConnection();
        setIsConnecting(true);
        toast.info(`Connecting to ${device.name}...`);
        startConnectionTimeout();

        discovery.setSignalingEvents({
            onAnswer: async (data) => {
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(data.answer);
                    await flushPendingCandidates();
                }
            },
            onIceCandidate: async (data) => {
                await addIceCandidate(data.candidate);
            },
        });

        const pc = createPeerConnection();
        peerConnection.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                discovery.sendIceCandidate(targetSocketId, event.candidate.toJSON());
            }
        };

        const channel = pc.createDataChannel('fileTransfer', { ordered: true });
        dataChannel.current = channel;
        setupDataChannel(channel, true);

        pc.createOffer().then(async (offer) => {
            await pc.setLocalDescription(offer);
            discovery.sendOffer(targetSocketId, offer);
        }).catch(() => {
            toast.error('Failed to connect');
            setIsConnecting(false);
        });
    }, [createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout]);

    const handleToggleFavorite = useCallback((device: Device) => {
        // In a real app, this would persist to storage
        toast.info(`${device.isFavorite ? 'Removed from' : 'Added to'} favorites`);
    }, []);

    const handleRefreshDevices = useCallback(() => {
        toast.info('Scanning for devices...');
        const discovery = getLocalDiscovery();
        discovery.refresh();
    }, []);

    // Friend handlers
    const handleSendToFriend = useCallback((friend: Friend) => {
        setSelectedFriend(friend);
        setConnectionType('friends');

        // Create a virtual device for the friend
        const friendDevice: Device = {
            id: friend.id,
            name: friend.name,
            platform: 'web',
            isOnline: true,
            isFavorite: true,
            lastSeen: friend.lastConnected || new Date(),
        };
        setSelectedDevice(friendDevice);

        // Update last connected
        updateFriendConnection(friend.id);

        // Notify if first-time verification will be required
        if (!isPeerVerified(friend.id)) {
            toast.info(`First connection to ${friend.name} - verification will be required`);
        } else {
            toast.success(`Ready to send to ${friend.name}`);
        }
    }, []);

    const handleRefreshFriends = useCallback(() => {
        setFriendRequestCount(getPendingFriendRequests().length);
    }, []);

    // Connect by code using Socket.IO signaling
    const handleConnectByCode = useCallback(async (code: string) => {
        cleanupConnection();
        setIsConnecting(true);
        toast.info(`Connecting to ${formatCode(code)}...`);

        try {
            const cm = connectionManager.current;
            if (!cm) {
                throw new Error('Connection manager not initialized');
            }

            // Set up event handlers for signaling
            cm.setEvents({
                onSignalingConnected: () => {},
                onSignalingDisconnected: () => {
                    setIsConnected(false);
                },
                onPeerConnected: async (peerId, socketId) => {
                    toast.info('Peer found, establishing connection...');
                    startConnectionTimeout();

                    // Create WebRTC connection and send offer
                    const pc = createPeerConnection();
                    peerConnection.current = pc;

                    pc.onicecandidate = async (event) => {
                        if (event.candidate) {
                            await cm.sendIceCandidate(event.candidate.toJSON());
                        }
                    };

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

                    pc.onicecandidate = async (event) => {
                        if (event.candidate) {
                            await cm.sendIceCandidate(event.candidate.toJSON());
                        }
                    };

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
                onIceCandidate: async (candidate) => {
                    await addIceCandidate(candidate);
                },
                onError: (error) => {
                    secureLog.error('[App] Signaling error:', error);
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                },
            });

            // Connect to the code's room
            await cm.connectToCode(code);

            const connectedDevice: Device = {
                id: code,
                name: `Device ${formatCode(code)}`,
                platform: 'web',
                isOnline: true,
                isFavorite: false,
                lastSeen: new Date(),
            };
            setSelectedDevice(connectedDevice);

        } catch (error) {
            secureLog.error('Connection failed:', error);
            toast.error('Failed to connect');
            setIsConnecting(false);
        }
    }, [createPeerConnection, setupDataChannel]);

    // QR code connect handler - connects via signaling using the scanned device ID
    const handleQRConnect = useCallback((deviceId: string, name: string) => {
        toast.info(`Connecting to ${name}...`);
        handleConnectByCode(deviceId);
    }, [handleConnectByCode]);

    // Connect by IP - connects through signaling server at target IP
    const handleConnectByIP = useCallback(async (ip: string, port: number) => {
        cleanupConnection();
        setIsConnecting(true);
        toast.info(`Connecting to ${ip}:${port}...`);

        try {
            const cm = connectionManager.current;
            if (!cm) {
                throw new Error('Connection manager not initialized');
            }

            cm.setEvents({
                onPeerConnected: async () => {
                    toast.info('Device found, establishing connection...');
                    startConnectionTimeout();

                    const pc = createPeerConnection();
                    peerConnection.current = pc;

                    pc.onicecandidate = async (event) => {
                        if (event.candidate) {
                            await cm.sendIceCandidate(event.candidate.toJSON());
                        }
                    };

                    const channel = pc.createDataChannel('fileTransfer', { ordered: true });
                    dataChannel.current = channel;
                    setupDataChannel(channel, true);

                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await cm.sendOffer(offer);
                },
                onOffer: async (offer) => {
                    startConnectionTimeout();

                    const pc = createPeerConnection();
                    peerConnection.current = pc;

                    pc.onicecandidate = async (event) => {
                        if (event.candidate) {
                            await cm.sendIceCandidate(event.candidate.toJSON());
                        }
                    };

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
                onIceCandidate: async (candidate) => {
                    await addIceCandidate(candidate);
                },
                onError: (error) => {
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                },
            });

            await cm.startListening();

            const device: Device = {
                id: generateUUID(),
                name: `Device at ${ip}`,
                platform: 'web',
                isOnline: true,
                isFavorite: false,
                lastSeen: new Date(),
            };
            setSelectedDevice(device);
        } catch (error) {
            toast.error('Failed to connect to device');
            setIsConnecting(false);
        }
    }, [createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout]);

    // Listen for incoming connections when in SEND mode with Internet P2P
    // This is when sender displays their code and waits for receiver to connect
    useEffect(() => {
        if (mode === 'send' && connectionType === 'internet' && connectionManager.current) {
            const cm = connectionManager.current;

            // Set up event handlers for sender (waiting for receiver)
            cm.setEvents({
                onSignalingConnected: () => {},
                onPeerConnected: async (peerId, socketId) => {
                    toast.info('Receiver connected, establishing P2P...');
                    cleanupConnection();
                    startConnectionTimeout();

                    // As sender, create offer when receiver joins
                    try {
                        const pc = createPeerConnection();
                        peerConnection.current = pc;

                        pc.onicecandidate = async (event) => {
                            if (event.candidate) {
                                await cm.sendIceCandidate(event.candidate.toJSON());
                            }
                        };

                        const channel = pc.createDataChannel('fileTransfer', { ordered: true });
                        dataChannel.current = channel;
                        setupDataChannel(channel, true);

                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        await cm.sendOffer(offer);
                    } catch (error) {
                        toast.error('Failed to establish connection');
                        setIsConnecting(false);
                    }
                },
                onAnswer: async (answer) => {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(answer);
                        await flushPendingCandidates();
                    }
                },
                onIceCandidate: async (candidate) => {
                    await addIceCandidate(candidate);
                },
                onError: (error) => {
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                },
            });

            // Start listening on our code
            cm.startListening().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('not configured')) {
                    toast.error('Failed to connect to signaling server');
                }
            });

            return () => {
                cm.disconnect();
                cleanupConnection();
            };
        }
    }, [mode, connectionType, createPeerConnection, setupDataChannel, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout]);

    // Listen for incoming connections when in receive mode
    useEffect(() => {
        if (mode === 'receive' && connectionType === 'internet' && connectionManager.current) {
            const cm = connectionManager.current;

            cm.setEvents({
                onSignalingConnected: () => {
                    toast.info('Ready to receive connections');
                },
                onPeerConnected: () => {
                    toast.info('Sender connected, waiting for offer...');
                },
                onOffer: async (offer) => {
                    toast.info('Incoming connection...');
                    cleanupConnection();
                    setIsConnecting(true);
                    startConnectionTimeout();

                    try {
                        const pc = createPeerConnection();
                        peerConnection.current = pc;

                        pc.onicecandidate = async (event) => {
                            if (event.candidate) {
                                await cm.sendIceCandidate(event.candidate.toJSON());
                            }
                        };

                        await pc.setRemoteDescription(offer);
                        await flushPendingCandidates();
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        await cm.sendAnswer(answer);
                    } catch (error) {
                        toast.error('Failed to accept connection');
                        setIsConnecting(false);
                    }
                },
                onAnswer: async (answer) => {
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(answer);
                        await flushPendingCandidates();
                    }
                },
                onIceCandidate: async (candidate) => {
                    await addIceCandidate(candidate);
                },
                onError: (error) => {
                    toast.error(getUserFriendlyError(error));
                    setIsConnecting(false);
                },
            });

            cm.startListening().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                if (!msg.includes('not configured')) {
                    toast.error('Failed to connect to signaling server');
                }
            });

            return () => {
                cm.disconnect();
                cleanupConnection();
            };
        }
    }, [mode, connectionType, createPeerConnection, addIceCandidate, flushPendingCandidates, cleanupConnection, startConnectionTimeout]);

    // Warn before page unload during active transfers
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
        if (selectedFiles.length === 0) {
            toast.error('Please select files to send');
            return;
        }

        if (!peerVerified) {
            toast.error('Peer verification required before sending files');
            setShowVerificationDialog(true);
            return;
        }

        const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
        const startTime = Date.now();

        // Create transfer record
        const newTransfer: Transfer = {
            id: generateUUID(),
            files: selectedFiles,
            from: thisDevice.current || { id: 'self', name: 'This Device', platform: 'web', isOnline: true, isFavorite: false, lastSeen: new Date() },
            to: selectedDevice || { id: 'peer', name: 'Peer', platform: 'web', isOnline: true, isFavorite: false, lastSeen: new Date() },
            status: 'transferring',
            progress: 0,
            speed: 0,
            direction: 'send',
            totalSize,
            transferredSize: 0,
            startTime: new Date(),
        };

        setTransfers((prev) => [newTransfer, ...prev]);
        setIsSending(true);
        transferStartTime.current = Date.now();

        // Verify we have a real connection and PQC session
        if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
            setTransfers((prev) =>
                prev.map((t) =>
                    t.id === newTransfer.id
                        ? { ...t, status: 'failed' }
                        : t
                )
            );
            setIsSending(false);
            toast.error('Not connected to a device. Please connect first.');
            return;
        }

        if (!pqcManager.current || !pqcManager.current.isReady()) {
            setTransfers((prev) =>
                prev.map((t) =>
                    t.id === newTransfer.id
                        ? { ...t, status: 'failed' }
                        : t
                )
            );
            setIsSending(false);
            toast.error('Encrypted session not ready. Please wait for PQC handshake.');
            return;
        }

        // Send files with PQC encryption
        try {
            setSendingFileTotal(selectedFiles.length);
            for (let i = 0; i < selectedFiles.length; i++) {
                const fileData = selectedFiles[i];
                setSendingFileIndex(i + 1);
                setSendingFileName(fileData.folderPath || fileData.name);
                setSendProgress(0);
                await pqcManager.current.sendFile(fileData.file, fileData.folderPath);
                toast.success(`Sent: ${fileData.name}`);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            setTransfers((prev) =>
                prev.map((t) =>
                    t.id === newTransfer.id
                        ? { ...t, status: 'completed', progress: 100, transferredSize: totalSize, endTime: new Date() }
                        : t
                )
            );

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
                speed: totalSize / (duration / 1000),
            });

            setSelectedFiles([]);
            setSendProgress(0);
            toast.success('All files sent with PQC encryption!');
        } catch (error) {
            secureLog.error('PQC transfer failed:', error);
            setTransfers((prev) =>
                prev.map((t) =>
                    t.id === newTransfer.id
                        ? { ...t, status: 'failed' }
                        : t
                )
            );
            toast.error('Transfer failed');
        } finally {
            setIsSending(false);
        }
    }, [selectedFiles, selectedDevice]);

    // Share clipboard
    const handleShareClipboard = useCallback(async () => {
        const text = await readClipboard();
        if (!text) {
            toast.error('Clipboard is empty');
            return;
        }

        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            dataChannel.current.send(JSON.stringify({
                type: 'clipboard',
                content: text,
                senderId: getDeviceId(),
                senderName: 'Device',
            }));

            await addToClipboardHistory({
                content: text,
                fromDevice: getDeviceId(),
                fromName: 'Me',
                isLocal: true,
            });

            toast.success('Clipboard shared!');
        } else {
            toast.error('Not connected to any device');
        }
    }, []);

    // Download received file
    const handleDownloadFile = useCallback(async (file: ReceivedFile) => {
        await downloadFile(file.blob, file.name, file.relativePath);
        toast.success(`Saved ${file.name}`);
    }, []);

    // Transfer handlers
    const handlePauseTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'paused' } : t))
        );
    }, []);

    const handleResumeTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'transferring' } : t))
        );
    }, []);

    const handleCancelTransfer = useCallback((id: string) => {
        setTransfers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: 'cancelled' } : t))
        );
    }, []);

    const handleClearCompleted = useCallback(() => {
        setTransfers((prev) =>
            prev.filter((t) => !['completed', 'failed', 'cancelled'].includes(t.status))
        );
    }, []);

    // Copy connection code
    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(connectionCode);
        toast.success('Code copied to clipboard!');
    }, [connectionCode]);

    // Email share handler
    const handleEmailShare = useCallback(async () => {
        if (!shareEmail || selectedFiles.length === 0) return;

        setIsSharing(true);
        setShareStatus('waiting');

        // Generate unique share ID
        const id = generateUUID();
        setShareId(id);

        // Calculate total size
        const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

        // Send email via API
        try {
            const res = await fetch('/api/send-share-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: shareEmail,
                    shareId: id,
                    fileCount: selectedFiles.length,
                    totalSize,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || 'Failed to send email');
                setIsSharing(false);
                setShareStatus('idle');
                return;
            }

            toast.success('Share link sent! Waiting for recipient...');

            // Join signaling room and wait for recipient
            const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL ||
                (window.location.hostname.includes('manisahome.com')
                    ? 'wss://signaling.manisahome.com'
                    : '');

            if (!signalingUrl) {
                toast.error('Signaling server not configured');
                setIsSharing(false);
                setShareStatus('idle');
                return;
            }

            const shareSocket = io(signalingUrl, {
                path: '/signaling',
                transports: ['websocket', 'polling'],
            });

            shareSocket.on('connect', () => {
                shareSocket.emit('join-room', `share-${id}`, 'sender');
            });

            // When recipient joins and sends an offer
            shareSocket.on('offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
                setShareStatus('connected');

                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                    ],
                });

                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        shareSocket.emit('ice-candidate', {
                            target: data.from,
                            candidate: e.candidate.toJSON(),
                        });
                    }
                };

                shareSocket.on('ice-candidate', (icData: { candidate: RTCIceCandidateInit }) => {
                    pc.addIceCandidate(new RTCIceCandidate(icData.candidate));
                });

                // Create data channel (we're the sender)
                const channel = pc.createDataChannel('pqc-transfer', { ordered: true });

                channel.onopen = async () => {
                    setShareStatus('transferring');

                    const manager = new PQCTransferManager();
                    await manager.initializeSession('send');
                    manager.setDataChannel(channel);

                    manager.onSessionReady(async () => {
                        // Send all files
                        for (const fileData of selectedFiles) {
                            await manager.sendFile(fileData.file, fileData.folderPath);
                        }
                        setShareStatus('done');
                        toast.success('Files shared successfully!');
                        setShowEmailShareDialog(false);
                        setIsSharing(false);
                        shareSocket.disconnect();
                        pc.close();
                    });

                    manager.onProgress((p) => setSendProgress(p));
                    manager.startKeyExchange();
                };

                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                shareSocket.emit('answer', { target: data.from, answer });
            });

        } catch (error) {
            toast.error('Failed to share files');
            setIsSharing(false);
            setShareStatus('idle');
        }
    }, [shareEmail, selectedFiles]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupConnection();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatEta = useCallback((progress: number): string => {
        if (progress <= 0 || transferStartTime.current === 0) return '';
        const elapsed = Date.now() - transferStartTime.current;
        const totalEstimated = (elapsed / progress) * 100;
        const remaining = Math.max(0, totalEstimated - elapsed);
        if (remaining < 1000) return '';
        const secs = Math.ceil(remaining / 1000);
        if (secs < 60) return `${secs}s left`;
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        if (mins < 60) return `${mins}m ${remSecs}s left`;
        const hrs = Math.floor(mins / 60);
        return `${hrs}h ${mins % 60}m left`;
    }, []);

    const canSend = selectedFiles.length > 0;

    return (
        <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
            {/* Minimal Fixed Header - Responsive & Touch-friendly */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm safe-area-top">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <Link href="/" className="nav-logo hover:opacity-60 transition-opacity !text-foreground text-lg sm:text-xl">
                        tallow
                    </Link>
                    {/* Visually hidden h1 for SEO/Accessibility */}
                    <h1 className="sr-only">Tallow - Secure File Sharing</h1>

                    <div className="flex items-center gap-1 sm:gap-3">
                        {/* Connection status - hidden on very small screens */}
                        <div className="hidden sm:flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                                isConnected && pqcReady && canSend && mode === 'send'
                                    ? 'bg-green-500'
                                    : isConnected && pqcReady
                                        ? 'bg-accent'
                                        : isConnected
                                            ? 'bg-yellow-500 animate-pulse'
                                            : 'bg-muted-foreground'
                            }`} />
                            <span className="label text-xs sm:text-sm">
                                {isConnected && pqcReady && canSend && mode === 'send'
                                    ? 'Ready to send'
                                    : isConnected && pqcReady
                                        ? 'Secured'
                                        : isConnected
                                            ? 'Encrypting...'
                                            : t('app.ready')}
                            </span>
                        </div>

                        {/* Clipboard button - Touch friendly 44px */}
                        {isConnected && (
                            <Button variant="ghost" size="icon" onClick={handleShareClipboard} title="Share Clipboard" aria-label="Share Clipboard" className="h-11 w-11 sm:h-10 sm:w-10 touchable">
                                <Clipboard className="w-5 h-5 text-foreground" />
                            </Button>
                        )}

                        {receivedFiles.length > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setShowReceivedDialog(true)} className="h-10 sm:h-9 px-3 touchable">
                                <FileDown className="w-4 h-4 mr-1 sm:mr-2 text-foreground" />
                                <span className="hidden sm:inline">{receivedFiles.length} Received</span>
                                <span className="sm:hidden">{receivedFiles.length}</span>
                            </Button>
                        )}

                        {/* Language Dropdown - hidden on mobile for cleaner nav */}
                        <div className="hidden sm:block">
                            <LanguageDropdown />
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* History - hidden on mobile */}
                        <Link href="/app/history" className="hidden sm:block">
                            <Button variant="ghost" size="icon" title="History" aria-label="View transfer history" className="h-11 w-11 sm:h-10 sm:w-10 touchable">
                                <History className="w-5 h-5 text-foreground" />
                            </Button>
                        </Link>

                        <Link href="/app/settings">
                            <Button variant="ghost" size="icon" title="Settings" aria-label="Open settings" className="h-11 w-11 sm:h-10 sm:w-10 touchable">
                                <Settings className="w-5 h-5 text-foreground" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content - Extra bottom padding on mobile to clear Next.js logo */}
            <main className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-20 sm:pb-8 safe-area-bottom">
                <div className="max-w-5xl mx-auto">
                    {/* Mode Toggle - Touch-friendly */}
                    <div className="flex justify-center mb-6 sm:mb-8">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as 'send' | 'receive')} className="w-full max-w-sm">
                            <TabsList className="grid w-full grid-cols-2 h-14 sm:h-12 p-1 bg-secondary rounded-full">
                                <TabsTrigger value="send" className="flex items-center gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm h-12 sm:h-10 text-sm sm:text-base touchable">
                                    <Upload className="w-4 h-4" />
                                    {t('app.send')}
                                </TabsTrigger>
                                <TabsTrigger value="receive" className="flex items-center gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm h-12 sm:h-10 text-sm sm:text-base touchable">
                                    <Download className="w-4 h-4" />
                                    {t('app.receive')}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Connection Status */}
                    {isConnecting && (
                        <div className="flex items-center justify-center gap-3 p-4 mb-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <Loader2 className="w-4 h-4 animate-spin text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm font-medium">{t('app.connecting')}</span>
                        </div>
                    )}

                    {isConnected && (
                        <div className="flex items-center justify-center gap-3 p-4 mb-6 rounded-xl bg-green-500/10 border border-green-500/20">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium">Connected and ready to transfer!</span>
                        </div>
                    )}

                    {/* Connection Type Selection - Responsive & Touch-friendly */}
                    {!connectionType && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-6 sm:mb-8">
                            {/* Local Network Card */}
                            <div
                                className="card-feature cursor-pointer hover:border-foreground min-h-[160px] sm:min-h-[180px] flex flex-col justify-between touchable active:scale-[0.98] transition-transform"
                                onClick={() => {
                                    setConnectionType('local');
                                    handleRefreshDevices();
                                }}
                            >
                                <div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-secondary mb-3 sm:mb-4">
                                        <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="heading-sm mb-1 text-base sm:text-lg">{t('app.localNetwork')}</h3>
                                    <p className="body-md text-sm sm:text-base">{t('app.localNetworkDesc')}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">⚡</span>
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">📡</span>
                                </div>
                            </div>

                            {/* Internet P2P Card - Matching style */}
                            <div
                                className="card-feature cursor-pointer hover:border-foreground min-h-[160px] sm:min-h-[180px] flex flex-col justify-between touchable active:scale-[0.98] transition-transform"
                                onClick={() => setConnectionType('internet')}
                            >
                                <div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-secondary mb-3 sm:mb-4">
                                        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="heading-sm mb-1 text-base sm:text-lg">{t('app.internetP2P')}</h3>
                                    <p className="body-md text-sm sm:text-base">{t('app.internetP2PDesc')}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">🌍</span>
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">🔒</span>
                                </div>
                            </div>

                            {/* Friends Card */}
                            <div
                                className="relative card-feature cursor-pointer hover:border-foreground min-h-[160px] sm:min-h-[180px] flex flex-col justify-between sm:col-span-2 lg:col-span-1 touchable active:scale-[0.98] transition-transform"
                                onClick={() => setConnectionType('friends')}
                            >
                                {friendRequestCount > 0 && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                                        {friendRequestCount}
                                    </div>
                                )}
                                <div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-secondary mb-3 sm:mb-4">
                                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <h3 className="heading-sm mb-1 text-base sm:text-lg">{t('app.friends')}</h3>
                                    <p className="body-md text-sm sm:text-base">{t('app.friendsDesc')}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">🔗</span>
                                    <span className="label px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary text-xs sm:text-sm">✓</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Interface */}
                    {connectionType && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Panel */}
                            <div className="lg:col-span-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">
                                        {connectionType === 'local' ? t('app.localNetwork') : connectionType === 'friends' ? t('app.friends') : t('app.connect')}
                                    </h2>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setConnectionType(null);
                                        setSelectedFriend(null);
                                    }}>
                                        {t('app.back')}
                                    </Button>
                                </div>

                                {connectionType === 'local' ? (
                                    <DeviceList
                                        devices={localDevices}
                                        onDeviceSelect={handleDeviceSelect}
                                        onToggleFavorite={handleToggleFavorite}
                                        onRefresh={handleRefreshDevices}
                                        onQRConnect={handleQRConnect}
                                        selectedDevice={selectedDevice}
                                    />
                                ) : connectionType === 'friends' ? (
                                    <FriendsList
                                        onSendToFriend={handleSendToFriend}
                                        onRefresh={handleRefreshFriends}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {mode === 'send' ? (
                                            <Card className="p-6 rounded-xl border border-border bg-card">
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <h3 className="font-semibold text-lg">{t('app.yourCode')}</h3>

                                                    {/* Toggle code type */}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant={codeType === 'word' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => { setCodeType('word'); setConnectionCode(generateWordPhrase(3)); }}
                                                        >
                                                            Word
                                                        </Button>
                                                        <Button
                                                            variant={codeType === 'short' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => { setCodeType('short'); setConnectionCode(generateShortCode()); }}
                                                        >
                                                            Code
                                                        </Button>
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-2 px-6 py-4 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors"
                                                        onClick={handleCopyCode}
                                                    >
                                                        <code className={`font-mono font-bold text-primary ${codeType === 'word' ? 'text-lg' : 'text-3xl tracking-widest'}`}>
                                                            {formatCode(connectionCode)}
                                                        </code>
                                                        <Copy className="w-5 h-5 text-primary/70" />
                                                    </div>

                                                    <Button variant="ghost" size="sm" onClick={regenerateCode}>
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        {t('app.regenerate')}
                                                    </Button>

                                                    <p className="text-sm text-muted-foreground">
                                                        {t('app.shareCode')}
                                                    </p>
                                                </div>
                                            </Card>
                                        ) : (
                                            <ManualConnect
                                                onConnectByIP={handleConnectByIP}
                                                onConnectByCode={handleConnectByCode}
                                                isConnecting={isConnecting}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Center/Right Panel */}
                            <div className="lg:col-span-2 space-y-6">
                                {mode === 'send' ? (
                                    <>
                                        <FileSelector
                                            onFilesSelected={handleFilesSelected}
                                            selectedFiles={selectedFiles}
                                            onRemoveFile={handleRemoveFile}
                                            onClearAll={handleClearFiles}
                                        />

                                        {/* Send Progress */}
                                        {isSending && (
                                            <Card className="p-4 rounded-xl border border-border bg-card">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium truncate max-w-[50%]">
                                                            {sendingFileName || t('app.sending')}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {sendingFileTotal > 1 && `${sendingFileIndex}/${sendingFileTotal} • `}
                                                            {Math.round(sendProgress)}%
                                                            {formatEta(sendProgress) && ` • ${formatEta(sendProgress)}`}
                                                        </span>
                                                    </div>
                                                    <Progress value={sendProgress} className="h-2" />
                                                </div>
                                            </Card>
                                        )}

                                        {/* Send Button */}
                                        {selectedFiles.length > 0 && !isSending && (
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card rounded-lg">
                                                <div>
                                                    <p className="font-semibold">
                                                        Ready to send {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Total: {formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="lg"
                                                        onClick={() => setShowEmailShareDialog(true)}
                                                        disabled={selectedFiles.length === 0}
                                                        className="gap-2"
                                                    >
                                                        <Mail className="w-5 h-5" />
                                                        Share via Email
                                                    </Button>
                                                    <Button
                                                        size="lg"
                                                        disabled={!canSend || !isConnected || !pqcReady || isSending}
                                                        onClick={handleStartTransfer}
                                                        className="gap-2"
                                                    >
                                                        {isSending ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Send className="w-5 h-5" />
                                                        )}
                                                        {isSending ? t('app.sending') : t('app.sendFiles')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Card className="p-12 rounded-xl border border-border bg-card">
                                            <div className="flex flex-col items-center text-center space-y-4">
                                                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-accent/10 animate-pulse-glow'}`}>
                                                    {isConnected ? (
                                                        <Check className="w-10 h-10 text-green-500" />
                                                    ) : (
                                                        <Download className="w-10 h-10 text-accent" />
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-semibold">
                                                    {isConnected ? t('app.connected') : t('app.ready')}
                                                </h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    {isConnected
                                                        ? t('app.waitingConnection')
                                                        : t('app.shareCode')}
                                                </p>
                                                {connectionType === 'internet' && !isConnected && (
                                                    <div
                                                        className="flex items-center gap-2 p-4 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors"
                                                        onClick={handleCopyCode}
                                                    >
                                                        <code className={`font-mono font-bold text-primary ${codeType === 'word' ? 'text-lg' : 'text-2xl tracking-widest'}`}>
                                                            {formatCode(connectionCode)}
                                                        </code>
                                                        <Copy className="w-5 h-5 text-primary/70" />
                                                    </div>
                                                )}
                                            </div>
                                        </Card>

                                        {/* Receive Progress */}
                                        {isReceiving && (
                                            <Card className="p-4 rounded-xl border border-border bg-card">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium truncate max-w-[50%]">
                                                            Receiving{receivingFileName ? `: ${receivingFileName}` : ''}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {Math.round(receiveProgress)}%
                                                            {formatEta(receiveProgress) && ` • ${formatEta(receiveProgress)}`}
                                                        </span>
                                                    </div>
                                                    <Progress value={receiveProgress} className="h-2" />
                                                </div>
                                            </Card>
                                        )}
                                    </>
                                )}

                                {/* Transfers */}
                                <div>
                                    <h2 className="text-xl font-semibold mb-4">{t('app.history')}</h2>
                                    <TransferQueue
                                        transfers={transfers}
                                        onPause={handlePauseTransfer}
                                        onResume={handleResumeTransfer}
                                        onCancel={handleCancelTransfer}
                                        onClearCompleted={handleClearCompleted}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {/* Received Files Dialog */}
            < Dialog open={showReceivedDialog} onOpenChange={setShowReceivedDialog} >
                <DialogContent className="rounded-xl border border-border bg-card">
                    <DialogHeader>
                        <DialogTitle>{t('app.receivedFiles')}</DialogTitle>
                        <DialogDescription>
                            {t('app.receivedFiles')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-auto">
                        {receivedFiles.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                {t('app.noFilesReceived')}
                            </p>
                        ) : (
                            receivedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)} • {file.receivedAt.toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <Button size="sm" onClick={() => handleDownloadFile(file)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        {t('app.download')}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog >

            {/* Email Share Dialog */}
            <Dialog open={showEmailShareDialog} onOpenChange={setShowEmailShareDialog}>
                <DialogContent className="rounded-xl border border-border bg-card">
                    <DialogHeader>
                        <DialogTitle>Share via Email</DialogTitle>
                        <DialogDescription>
                            Send a download link to the recipient. Files are transferred directly P2P when they open the link.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {shareStatus === 'idle' ? (
                            <>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Recipient email</label>
                                    <input
                                        type="email"
                                        value={shareEmail}
                                        onChange={(e) => setShareEmail(e.target.value)}
                                        placeholder="recipient@example.com"
                                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                                </p>
                                <Button
                                    onClick={handleEmailShare}
                                    disabled={!shareEmail || selectedFiles.length === 0}
                                    className="w-full"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Send Download Link
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-4 space-y-3">
                                {shareStatus === 'waiting' && (
                                    <>
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="font-medium">Waiting for recipient...</p>
                                        <p className="text-sm text-muted-foreground">Keep this tab open. The recipient will receive an email with a download link.</p>
                                    </>
                                )}
                                {shareStatus === 'connected' && (
                                    <>
                                        <Check className="w-8 h-8 text-green-500 mx-auto" />
                                        <p className="font-medium">Recipient connected!</p>
                                        <p className="text-sm text-muted-foreground">Establishing encrypted session...</p>
                                    </>
                                )}
                                {shareStatus === 'transferring' && (
                                    <>
                                        <p className="font-medium">Transferring files...</p>
                                        <Progress value={sendProgress} className="h-2" />
                                        <p className="text-sm text-muted-foreground">{Math.round(sendProgress)}%</p>
                                    </>
                                )}
                                {shareStatus === 'done' && (
                                    <>
                                        <Check className="w-8 h-8 text-green-500 mx-auto" />
                                        <p className="font-medium">Files shared successfully!</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* SAS Verification Dialog */}
            <VerificationDialog
                open={showVerificationDialog}
                onOpenChange={setShowVerificationDialog}
                session={verificationSession}
                peerName={selectedDevice?.name || 'Unknown Device'}
                isPreviouslyVerified={peerVerified}
                onVerified={async () => {
                    if (verificationSession) {
                        await markSessionVerified(verificationSession.id);
                        setPeerVerified(true);
                        setShowVerificationDialog(false);
                        toast.success('Connection verified!');
                    }
                }}
                onFailed={async () => {
                    if (verificationSession) {
                        await markSessionFailed(verificationSession.id);
                        setShowVerificationDialog(false);
                        toast.error('Verification failed! Disconnecting.');
                        cleanupConnection();
                    }
                }}
                onSkipped={async () => {
                    if (verificationSession) {
                        await markSessionSkipped(verificationSession.id);
                        setPeerVerified(true);
                        setShowVerificationDialog(false);
                        toast.info('Verification skipped');
                    }
                }}
            />
        </div >
    );
}
