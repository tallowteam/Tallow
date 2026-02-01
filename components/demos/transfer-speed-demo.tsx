'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  Package,
  Wifi,
  Activity,
  Clock,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Constants for simulation
const CHUNK_SIZE = 64 * 1024; // 64KB chunks
const FILE_SIZE = 50 * 1024 * 1024; // 50MB file
const UPDATE_INTERVAL = 100; // Update every 100ms
const GRAPH_POINTS = 50; // Number of points in the speed graph
const MAX_SPEED = 15 * 1024 * 1024; // 15 MB/s max theoretical speed

interface SpeedDataPoint {
  timestamp: number;
  speed: number; // bytes per second
}

interface ChunkIndicator {
  id: number;
  status: 'pending' | 'sending' | 'sent';
  offset: number;
}

type TransferState = 'idle' | 'running' | 'paused' | 'completed';

export function TransferSpeedDemo() {
  const [state, setState] = useState<TransferState>('idle');
  const [bytesTransferred, setBytesTransferred] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState<SpeedDataPoint[]>([]);
  const [chunks, setChunks] = useState<ChunkIndicator[]>([]);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastBytesRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const totalChunks = Math.ceil(FILE_SIZE / CHUNK_SIZE);
  const progress = (bytesTransferred / FILE_SIZE) * 100;
  const chunksCompleted = Math.floor(bytesTransferred / CHUNK_SIZE);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Format speed
  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  // Calculate ETA
  const calculateETA = useCallback((): string => {
    if (currentSpeed === 0 || state !== 'running') {return '--';}
    const remaining = FILE_SIZE - bytesTransferred;
    const seconds = remaining / currentSpeed;

    if (seconds < 60) {return `${Math.ceil(seconds)}s`;}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;}
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }, [currentSpeed, state, bytesTransferred]);

  // Simulate realistic network conditions
  const getNetworkSpeedMultiplier = useCallback(() => {
    const baseSpeed = {
      excellent: 0.9,
      good: 0.7,
      fair: 0.5,
      poor: 0.3,
    }[networkQuality];

    // Add some randomness to simulate real network fluctuations
    const variance = 0.3;
    const randomFactor = 1 - variance + Math.random() * variance * 2;

    return baseSpeed * randomFactor;
  }, [networkQuality]);

  // Simulate transfer
  const simulateTransfer = useCallback(() => {
    if (state !== 'running') {return;}

    const now = Date.now();
    const deltaTime = (now - lastUpdateRef.current) / 1000; // seconds

    if (deltaTime < UPDATE_INTERVAL / 1000) {
      animationFrameRef.current = requestAnimationFrame(simulateTransfer);
      return;
    }

    // Calculate speed based on network quality
    const speedMultiplier = getNetworkSpeedMultiplier();
    const targetSpeed = MAX_SPEED * speedMultiplier;
    const bytesToTransfer = Math.min(
      targetSpeed * deltaTime,
      FILE_SIZE - bytesTransferred
    );

    const newBytesTransferred = Math.min(
      bytesTransferred + bytesToTransfer,
      FILE_SIZE
    );

    // Calculate instantaneous speed
    const bytesDelta = newBytesTransferred - lastBytesRef.current;
    const speed = bytesDelta / deltaTime;

    setBytesTransferred(newBytesTransferred);
    setCurrentSpeed(speed);

    // Update speed history
    setSpeedHistory((prev) => {
      const newHistory = [
        ...prev,
        { timestamp: now, speed },
      ].slice(-GRAPH_POINTS);
      return newHistory;
    });

    // Update chunk indicators
    const currentChunkIndex = Math.floor(newBytesTransferred / CHUNK_SIZE);
    setChunks((prev) => {
      const updated = [...prev];
      for (let i = 0; i < Math.min(10, currentChunkIndex); i++) {
        const chunk = updated[i];
        if (!chunk) {
          updated[i] = {
            id: i,
            status: 'sent',
            offset: i * CHUNK_SIZE,
          };
        } else if (chunk.status !== 'sent') {
          updated[i] = {
            id: chunk.id,
            status: 'sent',
            offset: chunk.offset,
          };
        }
      }
      // Mark sending chunks
      if (currentChunkIndex < totalChunks) {
        for (let i = currentChunkIndex; i < Math.min(currentChunkIndex + 3, totalChunks); i++) {
          const chunk = updated[i];
          if (!chunk) {
            updated[i] = {
              id: i,
              status: 'sending',
              offset: i * CHUNK_SIZE,
            };
          } else if (chunk.status === 'pending') {
            updated[i] = {
              id: chunk.id,
              status: 'sending',
              offset: chunk.offset,
            };
          }
        }
      }
      return updated.slice(0, 10);
    });

    lastUpdateRef.current = now;
    lastBytesRef.current = newBytesTransferred;

    // Check completion
    if (newBytesTransferred >= FILE_SIZE) {
      setState('completed');
      return;
    }

    // Randomly change network quality
    if (Math.random() < 0.02) {
      const qualities: Array<'excellent' | 'good' | 'fair' | 'poor'> = ['excellent', 'good', 'fair', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      if (randomQuality) {
        setNetworkQuality(randomQuality);
      }
    }

    animationFrameRef.current = requestAnimationFrame(simulateTransfer);
  }, [state, bytesTransferred, getNetworkSpeedMultiplier, totalChunks]);

  // Start simulation
  const handleStart = () => {
    if (state === 'idle' || state === 'completed') {
      // Reset
      setBytesTransferred(0);
      setCurrentSpeed(0);
      setSpeedHistory([]);
      setChunks([]);
      lastBytesRef.current = 0;
      startTimeRef.current = Date.now();
    }

    setState('running');
    lastUpdateRef.current = Date.now();
  };

  const handlePause = () => {
    setState('paused');
  };

  const handleReset = () => {
    setState('idle');
    setBytesTransferred(0);
    setCurrentSpeed(0);
    setSpeedHistory([]);
    setChunks([]);
    lastBytesRef.current = 0;
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Effect to run simulation
  useEffect(() => {
    if (state === 'running') {
      animationFrameRef.current = requestAnimationFrame(simulateTransfer);
    } else if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, simulateTransfer]);

  // Speed graph component
  const SpeedGraph = () => {
    const width = 400;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 20, left: 40 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const maxSpeed = Math.max(...speedHistory.map((d) => d.speed), MAX_SPEED * 0.5);

    const points = speedHistory.map((point, i) => {
      const x = padding.left + (i / (GRAPH_POINTS - 1)) * graphWidth;
      const y = padding.top + graphHeight - (point.speed / maxSpeed) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    const pathData = speedHistory.length > 0
      ? `M ${padding.left},${padding.top + graphHeight} L ${points} L ${padding.left + graphWidth},${padding.top + graphHeight} Z`
      : '';

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        <g className="opacity-20">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + graphHeight * (1 - ratio)}
              x2={padding.left + graphWidth}
              y2={padding.top + graphHeight * (1 - ratio)}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Area under curve */}
        {pathData && (
          <path
            d={pathData}
            fill="currentColor"
            className="text-primary/20"
          />
        )}

        {/* Line */}
        {speedHistory.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
          />
        )}

        {/* Y-axis labels */}
        <g className="text-xs fill-muted-foreground">
          <text x={padding.left - 5} y={padding.top + 5} textAnchor="end" className="text-[10px]">
            {formatSpeed(maxSpeed)}
          </text>
          <text x={padding.left - 5} y={padding.top + graphHeight} textAnchor="end" className="text-[10px]">
            0
          </text>
        </g>

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + graphHeight}
          x2={padding.left + graphWidth}
          y2={padding.top + graphHeight}
          stroke="currentColor"
          className="opacity-20"
          strokeWidth="1"
        />
      </svg>
    );
  };

  // Chunk indicators
  const ChunkIndicators = () => {
    return (
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {chunks.map((chunk) => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg border transition-colors',
                chunk.status === 'sent' && 'bg-green-500/10 border-green-500/30',
                chunk.status === 'sending' && 'bg-primary/10 border-primary/30',
                chunk.status === 'pending' && 'bg-muted border-border'
              )}
            >
              <Package className={cn(
                'w-4 h-4 flex-shrink-0',
                chunk.status === 'sent' && 'text-green-500',
                chunk.status === 'sending' && 'text-primary animate-pulse',
                chunk.status === 'pending' && 'text-muted-foreground'
              )} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">Chunk #{chunk.id + 1}</div>
                <div className="text-[10px] text-muted-foreground">
                  {formatBytes(chunk.offset)} - {formatBytes(Math.min(chunk.offset + CHUNK_SIZE, FILE_SIZE))}
                </div>
              </div>
              {chunk.status === 'sent' && (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {chunk.status === 'sending' && (
                <div className="w-4 h-4 flex-shrink-0">
                  <motion.div
                    className="w-full h-full border-2 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              P2P Transfer Speed Demo
            </CardTitle>
            <CardDescription>
              Simulated file transfer with chunking and real-time metrics
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {state === 'idle' || state === 'paused' || state === 'completed' ? (
              <Button
                onClick={handleStart}
                size="sm"
                variant="default"
              >
                <Play className="w-4 h-4" />
                {state === 'completed' ? 'Restart' : state === 'paused' ? 'Resume' : 'Start'}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            {state !== 'idle' && (
              <Button
                onClick={handleReset}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Transfer Progress</span>
            <span className="text-muted-foreground">
              {formatBytes(bytesTransferred)} / {formatBytes(FILE_SIZE)}
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-primary/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(1)}%</span>
            {state === 'completed' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-500 font-medium flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Completed!
              </motion.span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="w-3 h-3" />
              Speed
            </div>
            <div className="text-xl font-bold">
              {formatSpeed(currentSpeed)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="w-3 h-3" />
              ETA
            </div>
            <div className="text-xl font-bold">
              {calculateETA()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Package className="w-3 h-3" />
              Chunks
            </div>
            <div className="text-xl font-bold">
              {chunksCompleted} / {totalChunks}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wifi className="w-3 h-3" />
              Network
            </div>
            <div className="text-xl font-bold capitalize">
              {networkQuality}
            </div>
          </div>
        </div>

        {/* Speed Graph */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Real-time Speed</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border">
            <SpeedGraph />
          </div>
        </div>

        {/* WebRTC DataChannel Stats */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            WebRTC DataChannel Stats
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-muted-foreground">Chunk Size</div>
              <div className="font-mono font-medium">{formatBytes(CHUNK_SIZE)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Buffered Amount</div>
              <div className="font-mono font-medium">
                {state === 'running' ? `${Math.floor(Math.random() * 256)}KB` : '0 KB'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Channel State</div>
              <div className="font-mono font-medium capitalize">{state === 'idle' ? 'closed' : 'open'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Packets Sent</div>
              <div className="font-mono font-medium">{chunksCompleted}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Packet Loss</div>
              <div className="font-mono font-medium">
                {state === 'running' ? `${(Math.random() * 2).toFixed(2)}%` : '0%'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">RTT</div>
              <div className="font-mono font-medium">
                {state === 'running' ? `${Math.floor(20 + Math.random() * 30)}ms` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Chunk Indicators */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Chunks (64KB each)</h4>
          <div className="p-4 rounded-xl bg-muted/30 border border-border max-h-64 overflow-y-auto">
            {chunks.length > 0 ? (
              <ChunkIndicators />
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                No chunks transmitted yet. Click Start to begin transfer.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
