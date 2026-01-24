'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { downloadFile, formatFileSize } from '@/lib/hooks/use-file-transfer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, Loader2, AlertCircle, Check } from 'lucide-react';
import { secureLog } from '@/lib/utils/secure-logger';

interface ReceivedFile {
    name: string;
    blob: Blob;
    size: number;
}

type PageState = 'connecting' | 'downloading' | 'complete' | 'error';

function getSignalingUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_SIGNALING_URL;
    if (envUrl) return envUrl;
    if (window.location.hostname.includes('manisahome.com')) {
        return 'wss://signaling.manisahome.com';
    }
    return '';
}

const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

export default function ShareDownloadPage() {
    const params = useParams();
    const id = params.id as string;

    const [pageState, setPageState] = useState<PageState>('connecting');
    const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
    const [currentFileName, setCurrentFileName] = useState('');
    const [progress, setProgress] = useState(0);
    const [eta, setEta] = useState('');

    const socketRef = useRef<Socket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const pqcManagerRef = useRef<PQCTransferManager | null>(null);
    const transferStartTimeRef = useRef<number>(0);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    const formatEta = useCallback((progressValue: number): string => {
        if (progressValue <= 0 || transferStartTimeRef.current === 0) return '';
        const elapsed = Date.now() - transferStartTimeRef.current;
        const totalEstimated = (elapsed / progressValue) * 100;
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

    const cleanup = useCallback(() => {
        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        pqcManagerRef.current?.destroy();
        pqcManagerRef.current = null;
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        pendingCandidatesRef.current = [];
    }, []);

    const flushPendingCandidates = useCallback(async () => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) return;
        const candidates = pendingCandidatesRef.current.splice(0);
        for (const candidate of candidates) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                secureLog.error('Failed to add queued ICE candidate:', e);
            }
        }
    }, []);

    const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        if (pc.remoteDescription) {
            try {
                await pc.addIceCandidate(candidate);
            } catch (e) {
                secureLog.error('Failed to add ICE candidate:', e);
            }
        } else {
            pendingCandidatesRef.current.push(candidate);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        const signalingUrl = getSignalingUrl();
        if (!signalingUrl) {
            setPageState('error');
            return;
        }
        const socket = io(signalingUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        const roomId = `share-${id}`;

        socket.on('connect', () => {
            secureLog.log('[Share] Connected to signaling server');
            socket.emit('join-room', roomId);
        });

        socket.on('connect_error', () => {
            setPageState('error');
        });

        socket.on('offer', async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
            secureLog.log('[Share] Received WebRTC offer from sender');

            const pc = new RTCPeerConnection({ iceServers });
            peerConnectionRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        candidate: event.candidate.toJSON(),
                        to: data.from,
                        room: roomId,
                    });
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                    if (pageState === 'connecting') {
                        setPageState('error');
                    }
                }
            };

            pc.ondatachannel = (event) => {
                const channel = event.channel;
                dataChannelRef.current = channel;
                channel.binaryType = 'arraybuffer';

                channel.onopen = async () => {
                    secureLog.log('[Share] Data channel open, initializing PQC session');
                    setPageState('downloading');

                    const manager = new PQCTransferManager();
                    pqcManagerRef.current = manager;

                    await manager.initializeSession('receive');
                    manager.setDataChannel(channel);

                    manager.onSessionReady(() => {
                        secureLog.log('[Share] PQC session ready, waiting for files');
                    });

                    manager.onProgress((p) => {
                        setProgress(p);
                        setEta(formatEta(p));
                    });

                    manager.onComplete((blob, filename) => {
                        const file: ReceivedFile = {
                            name: filename,
                            blob,
                            size: blob.size,
                        };
                        setReceivedFiles((prev) => [...prev, file]);
                        setProgress(0);
                        setCurrentFileName('');
                        setPageState('complete');
                        // Auto-trigger download
                        downloadFile(blob, filename);
                    });

                    manager.onFileIncoming((meta) => {
                        setCurrentFileName(`${meta.mimeCategory} (${formatFileSize(meta.size)})`);
                        setProgress(0);
                        transferStartTimeRef.current = Date.now();
                        setPageState('downloading');
                    });

                    manager.onError((error) => {
                        secureLog.error('[Share] Transfer error:', error);
                        setPageState('error');
                    });

                    // Route messages to PQC manager
                    channel.onmessage = async (event) => {
                        if (typeof event.data === 'string' && pqcManagerRef.current) {
                            await pqcManagerRef.current.handleIncomingMessage(event.data);
                        }
                    };
                };

                channel.onclose = () => {
                    secureLog.log('[Share] Data channel closed');
                    if (receivedFiles.length === 0 && pageState !== 'complete') {
                        setPageState('error');
                    }
                };

                channel.onerror = () => {
                    setPageState('error');
                };
            };

            await pc.setRemoteDescription(data.offer);
            await flushPendingCandidates();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', {
                answer,
                to: data.from,
                room: roomId,
            });
        });

        socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
            await addIceCandidate(data.candidate);
        });

        // Timeout: if no offer received within 60 seconds, show expired state
        const timeout = setTimeout(() => {
            if (pageState === 'connecting') {
                setPageState('error');
            }
        }, 60000);

        return () => {
            clearTimeout(timeout);
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleDownloadFile = useCallback(async (file: ReceivedFile) => {
        await downloadFile(file.blob, file.name);
    }, []);

    const handleDownloadAll = useCallback(async () => {
        for (const file of receivedFiles) {
            await downloadFile(file.blob, file.name);
        }
    }, [receivedFiles]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <title>Download Files - Tallow</title>

            <Card className="w-full max-w-md p-8">
                {/* Connecting State */}
                {pageState === 'connecting' && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-foreground">
                                Connecting to sender...
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Establishing a secure peer-to-peer connection.
                                The sender must be online for the transfer to begin.
                            </p>
                        </div>
                    </div>
                )}

                {/* Downloading State */}
                {pageState === 'downloading' && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10">
                            <Download className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-foreground">
                                Receiving file...
                            </h1>
                            {currentFileName && (
                                <p className="text-sm text-muted-foreground truncate max-w-[280px]">
                                    {currentFileName}
                                </p>
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            <Progress value={progress} className="h-3" />
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{Math.round(progress)}%</span>
                                {eta && <span>{eta}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Complete State */}
                {pageState === 'complete' && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-500/10">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-foreground">
                                Transfer complete
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {receivedFiles.length} file{receivedFiles.length !== 1 ? 's' : ''} received successfully.
                            </p>
                        </div>

                        <div className="w-full space-y-2">
                            {receivedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border"
                                >
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-sm font-medium truncate text-foreground">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadFile(file)}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {receivedFiles.length > 1 && (
                            <Button
                                onClick={handleDownloadAll}
                                className="w-full gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download All
                            </Button>
                        )}
                    </div>
                )}

                {/* Error/Expired State */}
                {pageState === 'error' && (
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-destructive/10">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-foreground">
                                Link unavailable
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                This share link has expired or the sender is no longer online.
                                Ask the sender to create a new share link.
                            </p>
                        </div>
                    </div>
                )}

                {/* Branding Footer */}
                <div className="mt-8 pt-4 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        Secured with post-quantum encryption via{' '}
                        <span className="font-medium text-foreground">Tallow</span>
                    </p>
                </div>
            </Card>
        </div>
    );
}
