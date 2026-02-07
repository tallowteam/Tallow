'use client';

/**
 * Visual Code Demo Component
 *
 * Demonstrates the visual code generator with different options.
 * This is for development/testing purposes.
 */

import { useState } from 'react';
import {
  generateEnhancedVisualCodeDataURL,
  generateVisualCodeDataURL,
} from '@/lib/utils/qr-code-generator';
import styles from './VisualCodeDemo.module.css';

export function VisualCodeDemo() {
  const [roomCode, setRoomCode] = useState('ABC123');
  const [colorScheme, setColorScheme] = useState<'monochrome' | 'gradient' | 'accent'>('monochrome');
  const [gridSize, setGridSize] = useState(12);
  const [size, setSize] = useState(256);
  const [mode, setMode] = useState<'enhanced' | 'simple'>('enhanced');

  const url = `https://tallow.app/transfer?room=${roomCode}`;

  const visualCodeUrl = mode === 'enhanced'
    ? generateEnhancedVisualCodeDataURL(url, { size, gridSize, colorScheme })
    : generateVisualCodeDataURL(roomCode, { size, gridSize, colorScheme });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Visual Code Generator Demo</h2>

      <div className={styles.content}>
        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Room Code
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className={styles.input}
                maxLength={16}
              />
            </label>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Mode
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'enhanced' | 'simple')}
                className={styles.select}
              >
                <option value="enhanced">Enhanced (with markers)</option>
                <option value="simple">Simple</option>
              </select>
            </label>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Color Scheme
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as any)}
                className={styles.select}
              >
                <option value="monochrome">Monochrome</option>
                <option value="accent">Accent</option>
                <option value="gradient">Gradient</option>
              </select>
            </label>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Grid Size: {gridSize}
              <input
                type="range"
                min="4"
                max="20"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className={styles.slider}
              />
            </label>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.label}>
              Size: {size}px
              <input
                type="range"
                min="128"
                max="512"
                step="64"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className={styles.slider}
              />
            </label>
          </div>

          <div className={styles.info}>
            <p className={styles.infoText}>
              <strong>URL:</strong> {url}
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          <div className={styles.previewWrapper}>
            <img
              src={visualCodeUrl}
              alt={`Visual code for ${roomCode}`}
              className={styles.previewImage}
            />
          </div>
          <p className={styles.caption}>
            {mode === 'enhanced' ? 'Enhanced' : 'Simple'} Visual Code
          </p>
        </div>
      </div>

      {/* Examples */}
      <div className={styles.examples}>
        <h3 className={styles.examplesTitle}>Example Codes</h3>
        <div className={styles.examplesGrid}>
          {['ABC123', 'XYZ789', 'DEMO01', 'TEST99'].map((code) => (
            <div key={code} className={styles.example}>
              <img
                src={generateEnhancedVisualCodeDataURL(
                  `https://tallow.app/transfer?room=${code}`,
                  { size: 128, gridSize: 12, colorScheme: 'monochrome' }
                )}
                alt={code}
                className={styles.exampleImage}
              />
              <span className={styles.exampleCode}>{code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Info */}
      <div className={styles.usage}>
        <h3 className={styles.usageTitle}>Usage</h3>
        <pre className={styles.code}>
{`import { generateEnhancedVisualCodeDataURL } from '@/lib/utils/qr-code-generator';

const visualCode = generateEnhancedVisualCodeDataURL(
  'https://tallow.app/transfer?room=${roomCode}',
  {
    size: ${size},
    gridSize: ${gridSize},
    colorScheme: '${colorScheme}',
  }
);

<img src={visualCode} alt="Room code" />`}
        </pre>
      </div>
    </div>
  );
}
