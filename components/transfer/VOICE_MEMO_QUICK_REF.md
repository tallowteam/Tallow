# Voice Memo Quick Reference

Fast implementation guide for voice memo recording in Tallow.

## Installation

No additional dependencies required. Uses browser APIs:
- MediaRecorder API
- Web Audio API (AudioContext, AnalyserNode)
- getUserMedia

## Quick Start

### 1. Basic Usage

```tsx
import VoiceMemo from '@/components/transfer/VoiceMemo';

function MyComponent() {
  const handleSend = async (audioBlob: Blob, duration: number) => {
    const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
      type: audioBlob.type
    });
    // Send file via your preferred method
    await uploadFile(file);
  };

  return <VoiceMemo onSend={handleSend} />;
}
```

### 2. Chat Integration

```tsx
import { useChat } from '@/lib/hooks/use-chat';
import VoiceMemo from '@/components/transfer/VoiceMemo';

const { sendFileAttachment } = useChat({ /* ... */ });

const handleSend = async (audioBlob: Blob) => {
  const file = new File([audioBlob], `voice.webm`, { type: audioBlob.type });
  await sendFileAttachment(file);
};

<VoiceMemo onSend={handleSend} compact />
```

### 3. Standalone Recording

```tsx
import { VoiceRecorder } from '@/lib/media/voice-recorder';

// Start recording
const recorder = new VoiceRecorder({ maxDuration: 60000 });
await recorder.start();

// Monitor audio levels
recorder.onAudioLevel = (level) => console.log(level); // 0-1

// Stop and get result
const { blob, duration } = await recorder.stop();
```

## Props Reference

```typescript
interface VoiceMemoProps {
  onSend?: (audioBlob: Blob, duration: number) => Promise<void>;
  onCancel?: () => void;
  maxDuration?: number;      // Default: 300000 (5 min)
  compact?: boolean;         // Default: false
  holdToRecord?: boolean;    // Default: false
}
```

## Common Patterns

### Pattern 1: Chat Panel Integration

```tsx
<div className="chat-controls">
  <VoiceMemo
    onSend={handleSendVoiceMemo}
    compact
    maxDuration={5 * 60 * 1000}
  />
</div>
```

### Pattern 2: Custom Duration

```tsx
// 30-second voice notes
<VoiceMemo
  onSend={handleSend}
  maxDuration={30 * 1000}
/>
```

### Pattern 3: Hold-to-Record

```tsx
// Press and hold to record (like messaging apps)
<VoiceMemo
  onSend={handleSend}
  holdToRecord
/>
```

### Pattern 4: With Loading State

```tsx
const [isSending, setIsSending] = useState(false);

const handleSend = async (blob: Blob, duration: number) => {
  setIsSending(true);
  try {
    await uploadVoiceMemo(blob);
  } finally {
    setIsSending(false);
  }
};

<VoiceMemo onSend={handleSend} />
```

## Waveform Visualization

### Extract Waveform Data

```tsx
import { createWaveformData } from '@/lib/media/audio-visualizer';

const peaks = await createWaveformData(audioBlob, {
  sampleCount: 100,    // Number of data points
  channel: -1,         // Average all channels
  smooth: true,        // Apply smoothing
});

// peaks: number[] (0-1 normalized amplitudes)
```

### Render Waveform

```tsx
// SVG path
const path = createWaveformPath(peaks, 300, 60);
<svg viewBox="0 0 300 60">
  <path d={path} fill="var(--primary-500)" />
</svg>

// Bar chart
const bars = createWaveformBars(peaks, 300, 60);
{bars.map((bar, i) => (
  <div key={i} style={{
    left: bar.x,
    top: bar.y,
    width: bar.width,
    height: bar.height
  }} />
))}
```

## VoiceRecorder API

### Methods

```typescript
const recorder = new VoiceRecorder(options);

await recorder.start();           // Start recording
await recorder.stop();            // Stop and return result
recorder.pause();                 // Pause recording
recorder.resume();                // Resume recording
recorder.cancel();                // Cancel without saving
recorder.getAudioLevel();         // Current level (0-1)
recorder.getState();              // Full state object
```

### Properties

```typescript
recorder.isRecording;  // boolean
recorder.isPaused;     // boolean
recorder.duration;     // number (milliseconds)
```

### Events

```typescript
recorder.onStateChange = (state) => { /* ... */ };
recorder.onAudioLevel = (level) => { /* ... */ };
recorder.onMaxDurationReached = () => { /* ... */ };
recorder.onError = (error) => { /* ... */ };
```

## Utilities

### Format Duration

```typescript
import { formatVoiceDuration } from '@/lib/media/voice-recorder';

formatVoiceDuration(0);       // "00:00"
formatVoiceDuration(90000);   // "01:30"
formatVoiceDuration(305000);  // "05:05"
```

### Check Support

```typescript
import { VoiceRecorder } from '@/lib/media/voice-recorder';

if (!VoiceRecorder.isSupported()) {
  console.error('Voice recording not supported');
}
```

### Get Supported Formats

```typescript
const formats = VoiceRecorder.getSupportedTypes();
// ["audio/webm;codecs=opus", "audio/webm", ...]
```

## CSS Customization

### Override Styles

```css
/* Custom button color */
.voiceMemo .recordButton {
  background: #ff6b6b;
}

/* Custom waveform */
.voiceMemo .waveformBar {
  background: linear-gradient(to top, #667eea, #764ba2);
}

/* Compact layout */
.voiceMemo.compact {
  max-width: 240px;
  padding: 8px;
}
```

### CSS Variables

```css
:root {
  --primary-500: #5E5CE6;
  --bg-surface: #1a1a1a;
  --text-primary: #ffffff;
  --border-default: #333333;
}
```

## Error Handling

```tsx
<VoiceMemo
  onSend={handleSend}
  onCancel={() => {
    console.log('User cancelled recording');
  }}
/>

// Common errors:
// - "Microphone access denied"
// - "No microphone found"
// - "Voice recording is not supported"
```

## Performance Tips

1. **Cleanup**: Component automatically cleans up resources
2. **Memory**: Uses chunk-based recording (low memory)
3. **CPU**: Audio level updates at 100ms intervals
4. **File Size**: ~960KB per minute at 128kbps

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 88+     | ✅ Full |
| Firefox | 85+     | ✅ Full |
| Safari  | 14.1+   | ✅ Full |
| Edge    | 88+     | ✅ Full |
| Opera   | 74+     | ✅ Full |

## TypeScript Types

```typescript
import type {
  VoiceMemoProps,
  VoiceRecorderOptions,
  VoiceRecordingResult,
  VoiceRecorderState,
  WaveformOptions,
  WaveformData,
} from '@/components/transfer/VoiceMemo';
```

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import VoiceMemo from '@/components/transfer/VoiceMemo';
import { useChat } from '@/lib/hooks/use-chat';

export function ChatWithVoice() {
  const [showRecorder, setShowRecorder] = useState(false);
  const { sendFileAttachment } = useChat({
    sessionId: 'session-123',
    userId: 'user-456',
    userName: 'Alice',
    dataChannel,
    sessionKeys,
  });

  const handleSend = async (audioBlob: Blob, duration: number) => {
    const file = new File(
      [audioBlob],
      `voice-${Date.now()}.webm`,
      { type: audioBlob.type }
    );

    await sendFileAttachment(file);
    setShowRecorder(false);
  };

  const handleCancel = () => {
    setShowRecorder(false);
  };

  return (
    <div className="chat-container">
      {showRecorder ? (
        <VoiceMemo
          onSend={handleSend}
          onCancel={handleCancel}
          compact
          maxDuration={5 * 60 * 1000}
        />
      ) : (
        <button onClick={() => setShowRecorder(true)}>
          Record Voice Memo
        </button>
      )}
    </div>
  );
}
```

## Troubleshooting

### Microphone Not Working
```typescript
// Check permissions
navigator.permissions.query({ name: 'microphone' })
  .then(result => console.log(result.state));
```

### Format Not Supported
```typescript
// Check available formats
const formats = VoiceRecorder.getSupportedTypes();
if (formats.length === 0) {
  console.error('No audio formats supported');
}
```

### Audio Level Always Zero
```typescript
// Ensure AudioContext is running
recorder.onAudioLevel = (level) => {
  if (level === 0) {
    console.warn('No audio input detected');
  }
};
```

---

**Need more details?** See [VOICE_MEMO_README.md](./VOICE_MEMO_README.md) for complete documentation.
