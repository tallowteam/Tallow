'use client';

/**
 * VoiceMemo Example Component
 * Demonstrates voice memo recording and sending in different contexts
 */

import { useState } from 'react';
import VoiceMemo from './VoiceMemo';
import styles from './VoiceMemoExample.module.css';

export default function VoiceMemoExample() {
  const [sentMemos, setSentMemos] = useState<Array<{ url: string; duration: number; timestamp: Date }>>([]);
  const [sendStatus, setSendStatus] = useState<string>('');

  const handleSend = async (audioBlob: Blob, duration: number) => {
    setSendStatus('Sending voice memo...');

    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create object URL for playback
    const url = URL.createObjectURL(audioBlob);
    setSentMemos(prev => [...prev, { url, duration, timestamp: new Date() }]);
    setSendStatus('Voice memo sent successfully!');

    // Clear status after 3 seconds
    setTimeout(() => setSendStatus(''), 3000);
  };

  const handleCancel = () => {
    setSendStatus('Recording cancelled');
    setTimeout(() => setSendStatus(''), 2000);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Voice Memo Recording</h2>
        <p className={styles.description}>
          Record and send voice memos with real-time waveform visualization
        </p>
      </div>

      <div className={styles.examples}>
        {/* Standard Mode */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Standard Mode</h3>
          <p className={styles.exampleDesc}>Tap to start/stop recording</p>
          <VoiceMemo onSend={handleSend} onCancel={handleCancel} />
        </div>

        {/* Compact Mode */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Compact Mode</h3>
          <p className={styles.exampleDesc}>Optimized for chat panels</p>
          <VoiceMemo onSend={handleSend} onCancel={handleCancel} compact />
        </div>

        {/* Hold to Record Mode */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Hold-to-Record Mode</h3>
          <p className={styles.exampleDesc}>Press and hold to record</p>
          <VoiceMemo onSend={handleSend} onCancel={handleCancel} holdToRecord />
        </div>

        {/* Custom Max Duration */}
        <div className={styles.example}>
          <h3 className={styles.exampleTitle}>Custom Duration (30s)</h3>
          <p className={styles.exampleDesc}>Limited to 30 seconds</p>
          <VoiceMemo onSend={handleSend} onCancel={handleCancel} maxDuration={30000} />
        </div>
      </div>

      {/* Status */}
      {sendStatus && (
        <div className={styles.status}>
          {sendStatus}
        </div>
      )}

      {/* Sent Memos */}
      {sentMemos.length > 0 && (
        <div className={styles.sentMemos}>
          <h3 className={styles.sentMemosTitle}>Sent Voice Memos ({sentMemos.length})</h3>
          <div className={styles.memosList}>
            {sentMemos.map((memo, index) => (
              <div key={index} className={styles.memoItem}>
                <div className={styles.memoInfo}>
                  <span className={styles.memoNumber}>Memo #{sentMemos.length - index}</span>
                  <span className={styles.memoDuration}>{formatDuration(memo.duration)}</span>
                  <span className={styles.memoTimestamp}>
                    {memo.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <audio controls className={styles.audioPlayer} src={memo.url} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features List */}
      <div className={styles.features}>
        <h3 className={styles.featuresTitle}>Features</h3>
        <ul className={styles.featuresList}>
          <li>Real-time audio level visualization with pulsing indicator</li>
          <li>Recording timer with MM:SS format</li>
          <li>Pause/resume recording support</li>
          <li>Waveform visualization after recording</li>
          <li>Audio playback with scrubber</li>
          <li>Auto-stop at max duration (default 5 minutes)</li>
          <li>WebM/Opus format (optimal compression)</li>
          <li>Echo cancellation & noise suppression</li>
          <li>Compact mode for chat panels</li>
          <li>Hold-to-record mode option</li>
        </ul>
      </div>

      {/* Integration Example */}
      <div className={styles.codeExample}>
        <h3 className={styles.codeTitle}>Integration Example</h3>
        <pre className={styles.code}>
          {`import VoiceMemo from '@/components/transfer/VoiceMemo';

// In your chat component
const handleSendVoiceMemo = async (audioBlob: Blob, duration: number) => {
  // Convert to file
  const file = new File([audioBlob], \`voice-memo-\${Date.now()}.webm\`, {
    type: audioBlob.type
  });

  // Send via chat manager
  await chatManager.sendFileAttachment(file);
};

// Render in chat panel
<VoiceMemo
  onSend={handleSendVoiceMemo}
  compact
  maxDuration={5 * 60 * 1000} // 5 minutes
/>`}
        </pre>
      </div>
    </div>
  );
}
