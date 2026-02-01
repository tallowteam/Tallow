# Screen Sharing Documentation

Complete guide to screen sharing functionality in Tallow.

## Overview

Tallow's screen sharing feature provides secure, end-to-end encrypted screen sharing using WebRTC with Post-Quantum Cryptography (PQC) protection. The implementation supports multiple quality presets, adaptive bitrate, and comprehensive privacy controls.

## Features

### Core Capabilities

- **Screen Capture**: Share entire screen, specific window, or browser tab
- **Quality Presets**: 720p, 1080p, 4K resolution options
- **Frame Rates**: 15, 30, 60 FPS support
- **System Audio**: Share system audio (Chrome/Edge)
- **Cursor Control**: Toggle cursor visibility in shared screen
- **Adaptive Bitrate**: Automatic quality adjustment based on network conditions

### Privacy & Security

- **End-to-End Encryption**: All screen sharing is encrypted with PQC
- **Relay-Only Mode**: Force TURN relay to prevent IP leaks
- **User Consent**: Explicit permission required before sharing
- **Visual Indicators**: Clear "Sharing" badges and status
- **Auto-Stop**: Automatic stop on disconnect or browser UI stop
- **No Recording**: Screen sharing is live-only (recording optional)

### User Experience

- **Local Preview**: See what you're sharing in real-time
- **Fullscreen Mode**: View shared screen in fullscreen
- **Picture-in-Picture**: Keep shared screen visible while multitasking
- **Pause/Resume**: Temporarily pause sharing
- **Switch Source**: Change screen/window without disconnecting
- **Statistics**: Live stats (resolution, FPS, bitrate, latency)

## Architecture

### Components

#### Core Module
- `lib/webrtc/screen-sharing.ts` - Screen sharing manager class
- `lib/hooks/use-screen-share.ts` - React hook for screen sharing
- `lib/hooks/use-screen-capture.ts` - Low-level capture hook

#### UI Components
- `components/app/ScreenShare.tsx` - Main control panel
- `components/app/ScreenSharePreview.tsx` - Local preview
- `components/app/ScreenShareViewer.tsx` - Receiver view

### Data Flow

```
User Action → ScreenShare Component → useScreenShare Hook
    → ScreenSharingManager → WebRTC PeerConnection
    → Encrypted Stream → Remote Peer → ScreenShareViewer
```

## Usage

### Basic Screen Sharing

```typescript
import { ScreenShare, ScreenShareViewer } from '@/components/app';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function MyComponent() {
  const { state, stream, startSharing, stopSharing } = useScreenShare({
    quality: '1080p',
    frameRate: 30,
    shareAudio: false,
  });

  const handleStart = async () => {
    try {
      await startSharing(peerConnection);
      console.log('Screen sharing started:', stream);
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  return (
    <div>
      <ScreenShare
        peerConnection={peerConnection}
        onStreamReady={(stream) => console.log('Stream ready:', stream)}
        onStopped={() => console.log('Stopped')}
      />
    </div>
  );
}
```

### Advanced Configuration

```typescript
const {
  state,
  stats,
  stream,
  startSharing,
  updateQuality,
  updateFrameRate,
  toggleAudio,
} = useScreenShare({
  quality: '4k',
  frameRate: 60,
  shareAudio: true,
  shareCursor: true,
  autoStop: true,
});

// Change quality on the fly
await updateQuality('1080p');

// Adjust frame rate
await updateFrameRate(30);

// Toggle system audio
await toggleAudio(true);
```

### Receiving Screen Share

```typescript
function ReceiverComponent({ remoteStream, peerName }) {
  return (
    <ScreenShareViewer
      stream={remoteStream}
      peerName={peerName}
      showControls={true}
      allowDownload={false}
      allowPiP={true}
    />
  );
}
```

### Using ScreenSharingManager Directly

```typescript
import { ScreenSharingManager } from '@/lib/webrtc/screen-sharing';

const manager = new ScreenSharingManager({
  quality: '1080p',
  frameRate: 30,
  shareAudio: false,
  shareCursor: true,
  autoStop: true,
});

// Set up callbacks
manager.setStateCallback((state) => {
  console.log('State changed:', state);
});

manager.setStatsCallback((stats) => {
  console.log('Stats:', stats);
});

// Start sharing
const stream = await manager.startSharing(peerConnection);

// Get current stats
const stats = manager.getStats();
console.log('Current bitrate:', stats?.bitrate);

// Stop sharing
manager.stopSharing();

// Cleanup
manager.dispose();
```

## API Reference

### ScreenSharingManager

#### Constructor
```typescript
new ScreenSharingManager(config?: Partial<ScreenShareConfig>)
```

**Config Options:**
- `quality`: '720p' | '1080p' | '4k' - Video quality preset
- `frameRate`: 15 | 30 | 60 - Target frame rate
- `shareAudio`: boolean - Include system audio
- `shareCursor`: boolean - Show cursor in shared screen
- `autoStop`: boolean - Auto-stop on disconnect

#### Methods

##### `startSharing(peerConnection?: RTCPeerConnection): Promise<MediaStream>`
Start screen sharing. Returns the media stream.

##### `stopSharing(): void`
Stop screen sharing and clean up resources.

##### `pauseSharing(): void`
Pause video track (mute screen sharing).

##### `resumeSharing(): void`
Resume paused screen sharing.

##### `switchSource(): Promise<void>`
Switch to a different screen/window source.

##### `updateQuality(quality: ScreenShareQuality): Promise<void>`
Change video quality preset.

##### `updateFrameRate(fps: FrameRate): Promise<void>`
Change target frame rate.

##### `toggleAudio(enabled: boolean): Promise<void>`
Enable or disable system audio sharing.

##### `getStats(): ScreenShareStats | null`
Get current statistics.

##### `getState(): ScreenShareState`
Get current state.

##### `getStream(): MediaStream | null`
Get the current media stream.

##### `isSharing(): boolean`
Check if currently sharing.

##### `isPaused(): boolean`
Check if sharing is paused.

##### `dispose(): void`
Clean up and release all resources.

### useScreenShare Hook

```typescript
function useScreenShare(config?: Partial<ScreenShareConfig>): UseScreenShareResult
```

**Returns:**
```typescript
{
  state: ScreenShareState;
  stats: ScreenShareStats | null;
  stream: MediaStream | null;
  startSharing: (peerConnection?: RTCPeerConnection) => Promise<void>;
  stopSharing: () => void;
  pauseSharing: () => void;
  resumeSharing: () => void;
  switchSource: () => Promise<void>;
  updateQuality: (quality: ScreenShareQuality) => Promise<void>;
  updateFrameRate: (fps: FrameRate) => Promise<void>;
  toggleAudio: (enabled: boolean) => Promise<void>;
  manager: ScreenSharingManager | null;
}
```

### useScreenCapture Hook

```typescript
function useScreenCapture(): UseScreenCaptureResult
```

Low-level hook for screen capture without WebRTC integration.

**Returns:**
```typescript
{
  state: ScreenCaptureState;
  stream: MediaStream | null;
  startCapture: (options?: ScreenCaptureOptions) => Promise<MediaStream>;
  stopCapture: () => void;
  switchCapture: (options?: ScreenCaptureOptions) => Promise<MediaStream>;
}
```

## Quality Presets

### 720p (HD)
- Resolution: 1280x720
- Bitrate: 1.5 Mbps
- Best for: Standard sharing, moderate bandwidth

### 1080p (Full HD)
- Resolution: 1920x1080
- Bitrate: 3 Mbps
- Best for: High-quality sharing, good bandwidth

### 4K (Ultra HD)
- Resolution: 3840x2160
- Bitrate: 8 Mbps
- Best for: Maximum quality, high bandwidth

### Frame Rates

- **15 FPS**: Low bandwidth, static content (documents, slides)
- **30 FPS**: Standard sharing, general use
- **60 FPS**: Smooth motion, video playback, gaming

## Adaptive Bitrate

The screen sharing implementation includes automatic quality adjustment:

1. **Network Monitoring**: Continuously monitors packet loss and bandwidth
2. **Quality Reduction**: Reduces bitrate by 20% when packet loss > 5%
3. **Quality Recovery**: Gradually increases bitrate when connection is stable
4. **Constraints**: Maintains bitrate between 500 Kbps and 10 Mbps

## Browser Support

### Full Support
- Chrome 72+
- Edge 79+
- Opera 60+

### Partial Support
- Firefox 66+ (no system audio)
- Safari 13+ (no system audio, limited features)

### System Audio Support
- Chrome/Edge: Full support
- Firefox/Safari: Not supported

## Privacy Considerations

### User Consent
- Browser shows permission dialog before sharing
- User can cancel at any time
- Clear visual indicators when sharing

### IP Protection
- All connections use TURN relay when configured
- No direct P2P connections that expose IPs
- Filtered ICE candidates

### Encryption
- End-to-end encryption with PQC
- No server-side decryption
- Secure key exchange

### Auto-Stop Protection
- Stops when user closes share via browser
- Stops when peer disconnects
- Stops when tab/window closes

## Performance Optimization

### Bandwidth Usage

| Quality | Frame Rate | Bitrate | Bandwidth |
|---------|-----------|---------|-----------|
| 720p    | 15 FPS    | ~1 Mbps | Low       |
| 720p    | 30 FPS    | ~1.5 Mbps | Medium  |
| 1080p   | 30 FPS    | ~3 Mbps | High      |
| 1080p   | 60 FPS    | ~5 Mbps | Very High |
| 4K      | 30 FPS    | ~8 Mbps | Ultra     |

### Best Practices

1. **Start with lower quality**: Begin with 720p/30fps, increase if needed
2. **Monitor stats**: Watch for packet loss and adjust quality
3. **Use wired connection**: WiFi can be unstable for high-quality sharing
4. **Close unnecessary apps**: Free up CPU for encoding
5. **Disable audio if not needed**: Reduces bandwidth usage

## Troubleshooting

### Screen Sharing Won't Start

**Error: "Screen capture is not supported"**
- Solution: Use a supported browser (Chrome, Edge)

**Error: "Permission denied"**
- Solution: Grant screen capture permission in browser settings

**Error: "No screen capture source found"**
- Solution: Ensure you select a screen/window in the picker dialog

### Poor Quality

**Pixelated or blurry video**
- Increase quality preset
- Reduce frame rate to allow higher bitrate
- Check network bandwidth

**Stuttering or freezing**
- Reduce quality preset
- Lower frame rate
- Check CPU usage

### Audio Not Working

**System audio not available**
- Ensure using Chrome or Edge browser
- Check "Share system audio" in browser permission dialog
- Verify audio is enabled in settings

### Connection Issues

**High latency**
- Check network connection
- Consider using relay-only mode
- Reduce quality/frame rate

**Frequent disconnections**
- Verify TURN server configuration
- Check firewall settings
- Use stable network connection

## Examples

### Full Featured Implementation

```typescript
import { useState } from 'react';
import { ScreenShare, ScreenSharePreview, ScreenShareViewer } from '@/components/app';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function ScreenSharingDemo() {
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const {
    state,
    stats,
    stream,
    startSharing,
    stopSharing,
  } = useScreenShare({
    quality: '1080p',
    frameRate: 30,
    shareAudio: true,
  });

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Sender Side */}
      <div>
        <h2>Your Screen</h2>
        <ScreenShare
          peerConnection={peerConnection}
          onStreamReady={(stream) => console.log('Sharing:', stream)}
          showStats={true}
        />

        {state.isSharing && (
          <ScreenSharePreview
            stream={stream}
            isSharing={state.isSharing}
            isPaused={state.isPaused}
            showControls={true}
          />
        )}
      </div>

      {/* Receiver Side */}
      <div>
        <h2>Remote Screen</h2>
        <ScreenShareViewer
          stream={remoteStream}
          peerName="Remote User"
          showControls={true}
          allowPiP={true}
          allowDownload={true}
        />
      </div>
    </div>
  );
}
```

## Future Enhancements

- [ ] Recording support with user consent
- [ ] Multiple screen sharing (presenter mode)
- [ ] Annotation tools (drawing on shared screen)
- [ ] Screen region selection (partial screen)
- [ ] Collaborative cursor (show remote cursor)
- [ ] Screen sharing history/analytics
- [ ] Bandwidth estimation UI
- [ ] Quality auto-adjustment based on content type
- [ ] Mobile screen sharing (iOS/Android)
- [ ] Screen sharing templates (presentation mode, etc.)

## Security Audit

### Threat Model

1. **IP Leakage**: Mitigated by relay-only mode
2. **Man-in-the-Middle**: Prevented by E2E encryption
3. **Unauthorized Recording**: User consent required
4. **Screen Content Exposure**: Clear indicators, auto-stop

### Compliance

- **GDPR**: User consent, right to be forgotten
- **CCPA**: Privacy controls, data minimization
- **HIPAA**: End-to-end encryption (consult legal for full compliance)

## Contributing

When contributing to screen sharing:

1. Maintain end-to-end encryption
2. Add tests for new features
3. Update documentation
4. Follow privacy-first principles
5. Test across browsers

## License

Part of Tallow - see main LICENSE file.

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/tallow/issues)
- Documentation: [Full docs](https://tallow.app/docs)
