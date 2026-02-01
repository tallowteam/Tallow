# Screen Sharing API Examples

Practical code examples for implementing screen sharing in Tallow.

## Table of Contents

1. [Basic Examples](#basic-examples)
2. [Advanced Usage](#advanced-usage)
3. [Integration Examples](#integration-examples)
4. [Custom Implementations](#custom-implementations)
5. [Error Handling](#error-handling)
6. [Performance Optimization](#performance-optimization)

## Basic Examples

### Example 1: Simple Screen Share Button

```typescript
import { useState } from 'react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { Button } from '@/components/ui/button';

function SimpleScreenShare() {
  const { state, startSharing, stopSharing } = useScreenShare();

  return (
    <div>
      {!state.isSharing ? (
        <Button onClick={() => startSharing()}>
          Share Screen
        </Button>
      ) : (
        <Button onClick={stopSharing} variant="destructive">
          Stop Sharing
        </Button>
      )}
    </div>
  );
}
```

### Example 2: Screen Share with Preview

```typescript
import { ScreenShare, ScreenSharePreview } from '@/components/app';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function ScreenShareWithPreview() {
  const { state, stream } = useScreenShare();

  return (
    <div className="space-y-4">
      <ScreenShare showStats={true} />

      {state.isSharing && (
        <ScreenSharePreview
          stream={stream}
          isSharing={state.isSharing}
          isPaused={state.isPaused}
          showControls={true}
        />
      )}
    </div>
  );
}
```

### Example 3: Receive Screen Share

```typescript
import { useState, useEffect } from 'react';
import { ScreenShareViewer } from '@/components/app';

function ReceiveScreenShare({ peerConnection }) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
  }, [peerConnection]);

  return (
    <ScreenShareViewer
      stream={remoteStream}
      peerName="Remote User"
      showControls={true}
      allowPiP={true}
    />
  );
}
```

## Advanced Usage

### Example 4: Custom Quality Settings

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function CustomQualityScreenShare() {
  const {
    state,
    startSharing,
    updateQuality,
    updateFrameRate,
  } = useScreenShare({
    quality: '1080p',
    frameRate: 30,
    shareAudio: false,
  });

  const changeToLowQuality = async () => {
    await updateQuality('720p');
    await updateFrameRate(15);
  };

  const changeToHighQuality = async () => {
    await updateQuality('4k');
    await updateFrameRate(60);
  };

  return (
    <div>
      <button onClick={() => startSharing()}>Start</button>
      <button onClick={changeToLowQuality}>Low Quality</button>
      <button onClick={changeToHighQuality}>High Quality</button>
    </div>
  );
}
```

### Example 5: Real-time Statistics Display

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { formatBitrate } from '@/lib/webrtc/screen-sharing';

function ScreenShareWithStats() {
  const { state, stats, startSharing } = useScreenShare();

  return (
    <div>
      <button onClick={() => startSharing()}>Start</button>

      {state.isSharing && stats && (
        <div className="stats">
          <div>Resolution: {stats.resolution.width}x{stats.resolution.height}</div>
          <div>FPS: {stats.fps.toFixed(1)}</div>
          <div>Bitrate: {formatBitrate(stats.bitrate)}</div>
          <div>Latency: {(stats.latency * 1000).toFixed(0)}ms</div>
          <div>Packets Lost: {stats.packetsLost}</div>
        </div>
      )}
    </div>
  );
}
```

### Example 6: Adaptive Quality Based on Network

```typescript
import { useEffect } from 'react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function AdaptiveScreenShare() {
  const { stats, updateQuality, updateFrameRate } = useScreenShare();

  useEffect(() => {
    if (!stats) return;

    // Check packet loss
    const lossRate = stats.packetsLost / (stats.packetsLost + 1000);

    // Reduce quality if high packet loss
    if (lossRate > 0.05) { // 5% loss
      updateQuality('720p');
      updateFrameRate(15);
    }
    // Increase quality if connection is good
    else if (lossRate < 0.01 && stats.bitrate < 5_000_000) {
      updateQuality('1080p');
      updateFrameRate(30);
    }
  }, [stats, updateQuality, updateFrameRate]);

  return <div>Adaptive quality screen sharing</div>;
}
```

## Integration Examples

### Example 7: Full P2P Screen Sharing

```typescript
import { useState } from 'react';
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { ScreenShare, ScreenShareViewer } from '@/components/app';

function P2PScreenSharing() {
  const { peerConnection } = useP2PConnection();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Set up remote track handler
  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  }, [peerConnection]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Sender */}
      <div>
        <h2>Share Your Screen</h2>
        <ScreenShare
          peerConnection={peerConnection}
          onStreamReady={(stream) => console.log('Sharing:', stream)}
        />
      </div>

      {/* Receiver */}
      <div>
        <h2>Remote Screen</h2>
        <ScreenShareViewer
          stream={remoteStream}
          peerName="Remote User"
        />
      </div>
    </div>
  );
}
```

### Example 8: Screen Share with Recording

```typescript
import { useState, useRef } from 'react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function ScreenShareWithRecording() {
  const { stream, startSharing, stopSharing } = useScreenShare();
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${Date.now()}.webm`;
      a.click();
      chunksRef.current = [];
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <button onClick={() => startSharing()}>Share Screen</button>
      <button onClick={startRecording} disabled={!stream || isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  );
}
```

### Example 9: Multiple Quality Profiles

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';

const QUALITY_PROFILES = {
  presentation: { quality: '1080p', frameRate: 15 },
  video: { quality: '1080p', frameRate: 30 },
  gaming: { quality: '1080p', frameRate: 60 },
  lowBandwidth: { quality: '720p', frameRate: 15 },
} as const;

function MultiProfileScreenShare() {
  const { updateQuality, updateFrameRate } = useScreenShare();

  const applyProfile = async (profile: keyof typeof QUALITY_PROFILES) => {
    const settings = QUALITY_PROFILES[profile];
    await updateQuality(settings.quality);
    await updateFrameRate(settings.frameRate);
  };

  return (
    <div>
      <button onClick={() => applyProfile('presentation')}>
        Presentation Mode
      </button>
      <button onClick={() => applyProfile('video')}>
        Video Mode
      </button>
      <button onClick={() => applyProfile('gaming')}>
        Gaming Mode
      </button>
      <button onClick={() => applyProfile('lowBandwidth')}>
        Low Bandwidth
      </button>
    </div>
  );
}
```

## Custom Implementations

### Example 10: Using ScreenSharingManager Directly

```typescript
import { useEffect, useRef } from 'react';
import { ScreenSharingManager } from '@/lib/webrtc/screen-sharing';

function CustomScreenShare() {
  const managerRef = useRef<ScreenSharingManager | null>(null);

  useEffect(() => {
    const manager = new ScreenSharingManager({
      quality: '1080p',
      frameRate: 30,
      shareAudio: true,
    });

    // Set up callbacks
    manager.setStateCallback((state) => {
      console.log('State:', state);
    });

    manager.setStatsCallback((stats) => {
      console.log('Stats:', stats);
    });

    managerRef.current = manager;

    return () => {
      manager.dispose();
    };
  }, []);

  const handleStart = async () => {
    if (managerRef.current) {
      const stream = await managerRef.current.startSharing();
      console.log('Stream:', stream);
    }
  };

  return <button onClick={handleStart}>Start</button>;
}
```

### Example 11: Custom Capture Options

```typescript
import { useScreenCapture } from '@/lib/hooks/use-screen-capture';

function CustomCapture() {
  const { startCapture, stream } = useScreenCapture();

  const captureCurrentTab = async () => {
    await startCapture({
      video: {
        cursor: 'never',
        displaySurface: 'browser',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
      preferCurrentTab: true,
    });
  };

  const captureWindow = async () => {
    await startCapture({
      video: {
        cursor: 'always',
        displaySurface: 'window',
      },
      audio: false,
      surfaceType: 'window',
    });
  };

  return (
    <div>
      <button onClick={captureCurrentTab}>Capture Tab</button>
      <button onClick={captureWindow}>Capture Window</button>
    </div>
  );
}
```

## Error Handling

### Example 12: Comprehensive Error Handling

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { toast } from 'sonner';

function ErrorHandledScreenShare() {
  const { state, startSharing } = useScreenShare();

  const handleStart = async () => {
    try {
      await startSharing();
      toast.success('Screen sharing started');
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific errors
        if (error.message.includes('permission denied')) {
          toast.error('Permission denied. Please allow screen sharing.');
        } else if (error.message.includes('not supported')) {
          toast.error('Screen sharing not supported in this browser.');
        } else if (error.message.includes('not found')) {
          toast.error('No screen capture source selected.');
        } else {
          toast.error(`Failed to start: ${error.message}`);
        }
      }
    }
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      {state.error && (
        <div className="error">
          Error: {state.error}
        </div>
      )}
    </div>
  );
}
```

### Example 13: Browser Support Detection

```typescript
import { isScreenShareSupported, isSystemAudioSupported } from '@/lib/webrtc/screen-sharing';
import { Alert } from '@/components/ui/alert';

function BrowserCompatibilityCheck() {
  const screenShareSupported = isScreenShareSupported();
  const systemAudioSupported = isSystemAudioSupported();

  if (!screenShareSupported) {
    return (
      <Alert variant="destructive">
        Screen sharing is not supported. Please use Chrome, Edge, or Opera.
      </Alert>
    );
  }

  return (
    <div>
      <Alert>Screen sharing is supported!</Alert>
      {systemAudioSupported && (
        <Alert>System audio is supported!</Alert>
      )}
    </div>
  );
}
```

## Performance Optimization

### Example 14: Bandwidth-Aware Quality

```typescript
import { useEffect } from 'react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function BandwidthOptimizedShare() {
  const { stats, updateQuality, updateFrameRate } = useScreenShare();

  useEffect(() => {
    if (!stats) return;

    const availableBandwidth = stats.bandwidth;

    // Adjust quality based on available bandwidth
    if (availableBandwidth < 2_000_000) { // < 2 Mbps
      updateQuality('720p');
      updateFrameRate(15);
    } else if (availableBandwidth < 5_000_000) { // < 5 Mbps
      updateQuality('1080p');
      updateFrameRate(30);
    } else { // >= 5 Mbps
      updateQuality('1080p');
      updateFrameRate(60);
    }
  }, [stats, updateQuality, updateFrameRate]);

  return <div>Bandwidth-optimized sharing</div>;
}
```

### Example 15: Performance Monitoring

```typescript
import { useState, useEffect } from 'react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function PerformanceMonitor() {
  const { stats } = useScreenShare();
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgFps: 0,
    avgBitrate: 0,
    totalPacketsLost: 0,
  });

  useEffect(() => {
    if (!stats) return;

    setPerformanceMetrics(prev => ({
      avgFps: (prev.avgFps + stats.fps) / 2,
      avgBitrate: (prev.avgBitrate + stats.bitrate) / 2,
      totalPacketsLost: prev.totalPacketsLost + stats.packetsLost,
    }));
  }, [stats]);

  return (
    <div>
      <h3>Performance Metrics</h3>
      <div>Average FPS: {performanceMetrics.avgFps.toFixed(1)}</div>
      <div>Average Bitrate: {(performanceMetrics.avgBitrate / 1_000_000).toFixed(2)} Mbps</div>
      <div>Total Packets Lost: {performanceMetrics.totalPacketsLost}</div>
    </div>
  );
}
```

### Example 16: Connection Quality Indicator

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { Badge } from '@/components/ui/badge';

function ConnectionQualityIndicator() {
  const { stats } = useScreenShare();

  const getQuality = () => {
    if (!stats) return 'unknown';

    const lossRate = stats.packetsLost / (stats.packetsLost + 1000);

    if (lossRate < 0.01 && stats.latency < 0.05) return 'excellent';
    if (lossRate < 0.03 && stats.latency < 0.1) return 'good';
    if (lossRate < 0.05 && stats.latency < 0.2) return 'fair';
    return 'poor';
  };

  const quality = getQuality();
  const colors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
    unknown: 'bg-gray-500',
  };

  return (
    <Badge className={colors[quality]}>
      Connection: {quality}
    </Badge>
  );
}
```

## Complete Working Example

### Example 17: Production-Ready Implementation

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { ScreenShare, ScreenSharePreview, ScreenShareViewer } from '@/components/app';
import { isScreenShareSupported } from '@/lib/webrtc/screen-sharing';
import { toast } from 'sonner';

function ProductionScreenSharing() {
  const { peerConnection, state: connectionState } = useP2PConnection();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const {
    state: shareState,
    stats,
    stream: localStream,
    startSharing,
    stopSharing,
  } = useScreenShare({
    quality: '1080p',
    frameRate: 30,
    shareAudio: false,
    autoStop: true,
  });

  // Handle remote track
  useEffect(() => {
    if (!peerConnection) return;

    peerConnection.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
        toast.success('Receiving screen share');
      }
    };
  }, [peerConnection]);

  // Handle sharing start
  const handleStartSharing = useCallback(async () => {
    if (!peerConnection) {
      toast.error('No peer connection');
      return;
    }

    try {
      await startSharing(peerConnection);
      toast.success('Screen sharing started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to start: ${message}`);
    }
  }, [peerConnection, startSharing]);

  // Auto-stop when peer disconnects
  useEffect(() => {
    if (!connectionState.isConnected && shareState.isSharing) {
      stopSharing();
      toast.info('Screen sharing stopped (peer disconnected)');
    }
  }, [connectionState.isConnected, shareState.isSharing, stopSharing]);

  // Check browser support
  if (!isScreenShareSupported()) {
    return (
      <div className="error">
        Screen sharing is not supported in your browser.
        Please use Chrome, Edge, or Opera.
      </div>
    );
  }

  return (
    <div className="screen-sharing-container">
      {/* Connection Status */}
      <div className="status">
        {connectionState.isConnected ? (
          <span className="connected">Connected to peer</span>
        ) : (
          <span className="disconnected">Not connected</span>
        )}
      </div>

      {/* Sharing Controls */}
      <div className="controls">
        <ScreenShare
          peerConnection={peerConnection}
          onStreamReady={handleStartSharing}
          onStopped={() => toast.info('Sharing stopped')}
          showStats={true}
        />
      </div>

      {/* Local Preview */}
      {shareState.isSharing && (
        <div className="preview">
          <ScreenSharePreview
            stream={localStream}
            isSharing={shareState.isSharing}
            isPaused={shareState.isPaused}
            showControls={true}
            showStats={true}
          />
        </div>
      )}

      {/* Remote View */}
      {remoteStream && (
        <div className="remote">
          <ScreenShareViewer
            stream={remoteStream}
            peerName={connectionState.peerName || 'Remote User'}
            showControls={true}
            allowPiP={true}
            allowDownload={false}
          />
        </div>
      )}

      {/* Statistics */}
      {shareState.isSharing && stats && (
        <div className="stats">
          <div>Resolution: {stats.resolution.width}x{stats.resolution.height}</div>
          <div>FPS: {stats.fps.toFixed(1)}</div>
          <div>Bitrate: {(stats.bitrate / 1_000_000).toFixed(2)} Mbps</div>
          <div>Latency: {(stats.latency * 1000).toFixed(0)}ms</div>
        </div>
      )}
    </div>
  );
}

export default ProductionScreenSharing;
```

## Tips & Best Practices

1. **Always check browser support** before enabling screen sharing
2. **Handle errors gracefully** with user-friendly messages
3. **Monitor statistics** to optimize quality
4. **Clean up resources** on component unmount
5. **Provide visual feedback** for all state changes
6. **Use auto-stop** to prevent resource leaks
7. **Start with conservative quality** and increase as needed
8. **Test across browsers** for compatibility
9. **Implement bandwidth adaptation** for better UX
10. **Add loading states** for async operations

## Common Patterns

- **Start/Stop Toggle**: Single button that changes based on state
- **Quality Presets**: Pre-configured quality profiles for different use cases
- **Auto-Adaptation**: Automatic quality adjustment based on network
- **Statistics Dashboard**: Real-time monitoring of performance
- **Error Recovery**: Automatic retry with fallback quality
- **Multi-User**: Support for multiple simultaneous screen shares

For more examples and complete API reference, see:
- `SCREEN_SHARING.md` - Full documentation
- `SCREEN_SHARING_QUICKSTART.md` - Quick start guide
- `/screen-share-demo` - Live demo application
