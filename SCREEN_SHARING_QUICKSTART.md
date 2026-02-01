# Screen Sharing Quick Start Guide

Get started with screen sharing in Tallow in 5 minutes.

## Quick Setup

### 1. Install Dependencies

All dependencies are already included in Tallow. No additional installation needed.

### 2. Import Components

```typescript
import { ScreenShare, ScreenShareViewer } from '@/components/app';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
```

### 3. Basic Usage

```typescript
function MyApp() {
  const { state, stream, startSharing, stopSharing } = useScreenShare();

  return (
    <div>
      <ScreenShare
        onStreamReady={(stream) => console.log('Sharing:', stream)}
      />
    </div>
  );
}
```

## Common Use Cases

### Share Screen with Default Settings

```typescript
import { ScreenShare } from '@/components/app';

<ScreenShare
  peerConnection={myPeerConnection}
  showStats={true}
/>
```

### Custom Quality Settings

```typescript
import { useScreenShare } from '@/lib/hooks/use-screen-share';

const { startSharing } = useScreenShare({
  quality: '1080p',
  frameRate: 30,
  shareAudio: false,
});

await startSharing(peerConnection);
```

### Receive Screen Share

```typescript
import { ScreenShareViewer } from '@/components/app';

<ScreenShareViewer
  stream={remoteStream}
  peerName="John Doe"
  showControls={true}
  allowPiP={true}
/>
```

### Monitor Statistics

```typescript
const { stats } = useScreenShare();

console.log('Bitrate:', stats?.bitrate);
console.log('FPS:', stats?.fps);
console.log('Resolution:', stats?.resolution);
```

## Configuration Options

### Quality Presets

```typescript
// 720p - Best for moderate bandwidth
{ quality: '720p', frameRate: 30 }

// 1080p - Recommended default
{ quality: '1080p', frameRate: 30 }

// 4K - For high bandwidth
{ quality: '4k', frameRate: 30 }
```

### Frame Rates

```typescript
frameRate: 15  // Low bandwidth, static content
frameRate: 30  // Standard (recommended)
frameRate: 60  // Smooth motion, high bandwidth
```

### Audio Options

```typescript
shareAudio: true   // Include system audio (Chrome/Edge)
shareAudio: false  // Video only (default)
```

## Control Methods

### Start/Stop

```typescript
const { startSharing, stopSharing } = useScreenShare();

// Start
await startSharing(peerConnection);

// Stop
stopSharing();
```

### Pause/Resume

```typescript
const { pauseSharing, resumeSharing } = useScreenShare();

// Pause
pauseSharing();

// Resume
resumeSharing();
```

### Change Quality

```typescript
const { updateQuality, updateFrameRate } = useScreenShare();

// Change quality
await updateQuality('720p');

// Change frame rate
await updateFrameRate(60);
```

### Switch Source

```typescript
const { switchSource } = useScreenShare();

// Switch to different screen/window
await switchSource();
```

## Integration with P2P Connection

### Sender Side

```typescript
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';
import { useScreenShare } from '@/lib/hooks/use-screen-share';

function Sender() {
  const { peerConnection } = useP2PConnection();
  const { startSharing } = useScreenShare();

  const handleShare = async () => {
    const stream = await startSharing(peerConnection);
    // Stream is automatically added to peer connection
  };

  return <button onClick={handleShare}>Share Screen</button>;
}
```

### Receiver Side

```typescript
function Receiver() {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };
  }, []);

  return <ScreenShareViewer stream={remoteStream} />;
}
```

## Error Handling

### Check Browser Support

```typescript
import { isScreenShareSupported } from '@/lib/webrtc/screen-sharing';

if (!isScreenShareSupported()) {
  alert('Screen sharing not supported in this browser');
}
```

### Handle Permission Denied

```typescript
try {
  await startSharing();
} catch (error) {
  if (error.message.includes('permission denied')) {
    alert('Please allow screen sharing permission');
  }
}
```

### Handle Connection Errors

```typescript
const { state } = useScreenShare();

if (state.error) {
  console.error('Screen sharing error:', state.error);
}
```

## Best Practices

### 1. Start with Lower Quality

```typescript
// Start conservative, increase if needed
const config = {
  quality: '720p',
  frameRate: 30,
};
```

### 2. Monitor Network Conditions

```typescript
const { stats } = useScreenShare();

useEffect(() => {
  if (stats && stats.packetsLost > 100) {
    console.warn('High packet loss, consider reducing quality');
  }
}, [stats]);
```

### 3. Clean Up on Unmount

```typescript
useEffect(() => {
  return () => {
    stopSharing(); // Clean up when component unmounts
  };
}, [stopSharing]);
```

### 4. Provide User Feedback

```typescript
const { state } = useScreenShare();

if (state.isSharing) {
  return <Badge>Sharing Screen</Badge>;
}
```

## Troubleshooting

### Screen Sharing Won't Start

1. Check browser support (Chrome, Edge, Opera)
2. Verify screen sharing permission granted
3. Ensure HTTPS or localhost
4. Check for conflicting extensions

### Poor Quality

1. Reduce quality preset
2. Lower frame rate
3. Disable audio sharing
4. Check network bandwidth
5. Close other apps using bandwidth

### High Latency

1. Use wired connection
2. Check TURN server configuration
3. Reduce quality/frame rate
4. Monitor network stats

## Demo & Examples

### Live Demo

Visit `/screen-share-demo` for interactive examples and testing.

### Example Code

See `tests/e2e/screen-sharing.spec.ts` for comprehensive examples.

### Full Documentation

Read `SCREEN_SHARING.md` for complete API reference and advanced usage.

## Performance Tips

### Bandwidth Requirements

- 720p @ 30fps: ~1.5 Mbps
- 1080p @ 30fps: ~3 Mbps
- 1080p @ 60fps: ~5 Mbps
- 4K @ 30fps: ~8 Mbps

### CPU Usage

- Lower resolution = Less CPU
- Lower frame rate = Less CPU
- Hardware acceleration helps (enabled by default)

### Network Tips

- Use wired connection for best stability
- WiFi 5GHz better than 2.4GHz
- Close bandwidth-heavy apps
- Check for network congestion

## Next Steps

1. Try the demo at `/screen-share-demo`
2. Read full documentation in `SCREEN_SHARING.md`
3. Check API reference for advanced features
4. Run tests: `npm test screen-sharing`

## Support

For issues or questions:
- GitHub Issues
- Documentation: `/docs`
- Demo: `/screen-share-demo`

## Version

Current version: 1.0.0

Compatible with:
- Chrome 72+
- Edge 79+
- Opera 60+
- Firefox 66+ (partial)
- Safari 13+ (partial)
