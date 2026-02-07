# Voice Memo Component

Production-ready voice memo recording component with real-time waveform visualization for Tallow's secure file transfer system.

## Overview

The VoiceMemo component provides a complete solution for recording and sharing voice memos during P2P file transfers. Built with the MediaRecorder API and Web Audio API, it offers real-time audio visualization, playback controls, and seamless integration with Tallow's encrypted chat system.

## Features

### Core Functionality
- **Microphone Recording**: High-quality audio capture using MediaRecorder API
- **Real-time Audio Levels**: Live audio level monitoring via AnalyserNode
- **Pause/Resume**: Full control over recording sessions
- **Auto-stop**: Configurable maximum duration (default: 5 minutes)
- **Waveform Visualization**: Dynamic waveform display during and after recording
- **Playback Controls**: Play/pause and scrubber for recorded audio
- **WebM/Opus Output**: Optimal compression and quality

### Audio Processing
- **Echo Cancellation**: Automatic echo removal
- **Noise Suppression**: Background noise reduction
- **Auto Gain Control**: Consistent volume levels
- **High Sample Rate**: 48kHz mono recording
- **Efficient Encoding**: 128kbps Opus codec

### User Experience
- **Compact Mode**: Optimized layout for chat panels
- **Hold-to-Record**: Optional press-and-hold recording
- **Visual Feedback**: Pulsing indicator shows audio levels
- **Duration Display**: Real-time timer in MM:SS format
- **Max Duration Warning**: Alert when approaching time limit

## Architecture

### File Structure

```
lib/media/
├── voice-recorder.ts       # Core VoiceRecorder class
└── audio-visualizer.ts     # Waveform extraction utilities

components/transfer/
├── VoiceMemo.tsx          # Main component
├── VoiceMemo.module.css   # Component styles
├── VoiceMemoExample.tsx   # Usage examples
└── VoiceMemoExample.module.css
```

### VoiceRecorder Class

```typescript
import { VoiceRecorder, formatVoiceDuration } from '@/lib/media/voice-recorder';

const recorder = new VoiceRecorder({
  maxDuration: 5 * 60 * 1000,    // 5 minutes
  audioBitsPerSecond: 128000,    // 128 kbps
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
});

// Event handlers
recorder.onAudioLevel = (level) => {
  console.log('Audio level:', level); // 0-1
};

recorder.onMaxDurationReached = () => {
  console.log('Max duration reached');
};

// Start recording
await recorder.start();

// Get current state
const { isRecording, isPaused, duration, audioLevel } = recorder.getState();

// Stop and get result
const result = await recorder.stop();
// result: { blob, url, duration, size, mimeType }
```

### Audio Visualizer

```typescript
import { createWaveformData } from '@/lib/media/audio-visualizer';

// Extract waveform peaks from audio blob
const peaks = await createWaveformData(audioBlob, {
  sampleCount: 100,      // Number of data points
  channel: -1,           // Average all channels
  smooth: true,          // Apply smoothing
  smoothingWindow: 3,    // Smoothing window size
});

// Returns: number[] (normalized 0-1 amplitude values)
```

## Usage

### Basic Integration

```tsx
import VoiceMemo from '@/components/transfer/VoiceMemo';

function ChatPanel() {
  const handleSend = async (audioBlob: Blob, duration: number) => {
    // Convert to File
    const file = new File(
      [audioBlob],
      `voice-memo-${Date.now()}.webm`,
      { type: audioBlob.type }
    );

    // Send via chat or transfer system
    await sendFile(file);
  };

  return (
    <VoiceMemo
      onSend={handleSend}
      onCancel={() => console.log('Cancelled')}
      maxDuration={5 * 60 * 1000}
    />
  );
}
```

### Compact Mode for Chat

```tsx
<VoiceMemo
  onSend={handleSendVoiceMemo}
  compact
  maxDuration={5 * 60 * 1000}
/>
```

### Hold-to-Record Mode

```tsx
<VoiceMemo
  onSend={handleSendVoiceMemo}
  holdToRecord
  maxDuration={30 * 1000} // 30 seconds
/>
```

### Integration with ChatManager

```tsx
import { useChat } from '@/lib/hooks/use-chat';
import VoiceMemo from '@/components/transfer/VoiceMemo';

function ChatWithVoiceMemos() {
  const { sendFileAttachment } = useChat({
    sessionId,
    userId,
    userName,
    dataChannel,
    sessionKeys,
  });

  const handleSendVoiceMemo = async (audioBlob: Blob, duration: number) => {
    const file = new File(
      [audioBlob],
      `voice-${Date.now()}.webm`,
      { type: audioBlob.type }
    );

    await sendFileAttachment(file);
  };

  return (
    <div className="chat-voice-controls">
      <VoiceMemo
        onSend={handleSendVoiceMemo}
        compact
      />
    </div>
  );
}
```

## Component API

### Props

```typescript
interface VoiceMemoProps {
  /** Callback when voice memo is ready to send */
  onSend?: (audioBlob: Blob, duration: number) => Promise<void>;

  /** Callback when recording is cancelled */
  onCancel?: () => void;

  /** Maximum recording duration in milliseconds (default: 5 minutes) */
  maxDuration?: number;

  /** Compact mode for chat sidebar (default: false) */
  compact?: boolean;

  /** Enable hold-to-record mode (default: false) */
  holdToRecord?: boolean;
}
```

### States

The component manages four primary states:

1. **Idle**: Ready to start recording
2. **Recording**: Active recording in progress
3. **Paused**: Recording paused
4. **Recorded**: Recording complete, ready for playback/send

## Browser Support

### Required APIs
- MediaRecorder API
- getUserMedia (microphone access)
- Web Audio API (AudioContext, AnalyserNode)
- Blob and URL APIs

### Supported Browsers
- Chrome/Edge 88+
- Firefox 85+
- Safari 14.1+
- Opera 74+

### Format Support
Preferred output format: `audio/webm;codecs=opus`

Fallback formats:
- `audio/webm`
- `audio/ogg;codecs=opus`
- `audio/mp4`

## Styling

The component uses CSS Modules with CSS custom properties for theming:

```css
/* Design tokens used */
--bg-base: Background for waveform container
--bg-surface: Component background
--bg-elevated: Button backgrounds
--text-primary: Primary text color
--text-secondary: Secondary text color
--primary-500: Accent color (#5E5CE6)
--border-default: Border color
```

### Customization

Override CSS module classes:

```css
.voiceMemo {
  /* Custom container styles */
}

.recordButton {
  /* Custom button styles */
}

.waveformContainer {
  /* Custom waveform styles */
}
```

## Security Considerations

### Microphone Permissions
- Requests microphone access on first recording attempt
- Handles permission denial gracefully with error messages
- No persistent permissions stored

### Audio Data
- Audio data stored in memory only during recording
- No automatic uploads or cloud storage
- Blob URLs created locally for playback
- Clean up resources on component unmount

### Privacy Features
- Audio never leaves the device until explicitly sent
- Compatible with Tallow's E2E encryption
- No analytics or tracking of recordings
- Secure deletion of temporary data

## Performance

### Memory Management
- Chunk-based recording (1-second chunks)
- Efficient blob concatenation
- Automatic cleanup on stop/cancel
- Resource disposal on unmount

### CPU Usage
- Audio level monitoring: ~100ms interval
- Minimal overhead from AnalyserNode
- Efficient waveform extraction using OfflineAudioContext

### File Sizes
At 128kbps Opus encoding:
- 30 seconds ≈ 480 KB
- 1 minute ≈ 960 KB
- 5 minutes ≈ 4.8 MB

## Accessibility

### Keyboard Support
- Record button: Space/Enter to toggle
- Playback: Space to play/pause
- Scrubber: Arrow keys to seek

### ARIA Labels
- Clear button labels for screen readers
- Status announcements for recording state
- Semantic HTML structure

### Visual Indicators
- High-contrast recording indicators
- Multiple feedback mechanisms (color, animation, text)
- Clear duration display

## Error Handling

### Common Errors

1. **NotAllowedError**: Microphone permission denied
   ```
   "Microphone access denied. Please allow microphone permissions."
   ```

2. **NotFoundError**: No microphone found
   ```
   "No microphone found. Please connect a microphone."
   ```

3. **Browser Unsupported**: APIs not available
   ```
   "Voice recording is not supported in this browser."
   ```

### Error Recovery
- Automatic cleanup on errors
- State reset to idle
- Clear error messages to user
- Retry mechanism available

## Testing

### Unit Tests
```typescript
import { VoiceRecorder } from '@/lib/media/voice-recorder';

describe('VoiceRecorder', () => {
  it('should detect browser support', () => {
    expect(VoiceRecorder.isSupported()).toBe(true);
  });

  it('should format duration correctly', () => {
    expect(formatVoiceDuration(0)).toBe('00:00');
    expect(formatVoiceDuration(90000)).toBe('01:30');
    expect(formatVoiceDuration(305000)).toBe('05:05');
  });
});
```

### Integration Tests
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import VoiceMemo from '@/components/transfer/VoiceMemo';

describe('VoiceMemo', () => {
  it('should start recording on button click', async () => {
    const { getByLabelText } = render(<VoiceMemo />);
    const recordButton = getByLabelText('Start recording');

    fireEvent.click(recordButton);

    await waitFor(() => {
      expect(getByLabelText('Stop recording')).toBeInTheDocument();
    });
  });
});
```

## Roadmap

### Planned Features
- [ ] Multiple audio format support (MP3, AAC)
- [ ] Audio effects (speed, pitch adjustment)
- [ ] Bookmark/markers during recording
- [ ] Transcription integration
- [ ] Voice activity detection (auto-pause on silence)
- [ ] Audio compression options
- [ ] Recording templates/presets

### Potential Enhancements
- Noise gate for better quality
- Audio normalization
- Trim functionality
- Multi-language support
- Custom waveform colors
- Recording analytics

## Related Components

- **ChatPanel**: Message interface for voice memo sharing
- **ChatManager**: E2E encrypted message handling
- **FilePreview**: Audio file preview component
- **TransferProgress**: File transfer status

## Contributing

When contributing to the voice memo feature:

1. Follow existing code style and patterns
2. Add tests for new functionality
3. Update documentation
4. Ensure browser compatibility
5. Test with actual microphone hardware
6. Verify memory cleanup
7. Check accessibility features

## License

Part of the Tallow secure file transfer project.

## Support

For issues or questions:
- Check browser console for error messages
- Verify microphone permissions
- Test in supported browsers
- Review error handling documentation

---

**Last Updated**: 2026-02-06
**Version**: 1.0.0
**Status**: Production Ready
