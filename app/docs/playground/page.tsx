'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@/components/docs/CodeEditor').then((mod) => mod.CodeEditor),
  { loading: () => <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} />, ssr: false }
);
const LivePreview = dynamic(
  () => import('@/components/docs/LivePreview').then((mod) => mod.LivePreview),
  { loading: () => <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }} />, ssr: false }
);
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';

type ComponentType = 'Button' | 'Card' | 'Badge' | 'Input' | 'Modal' | 'Spinner';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';
type CardVariant = 'default' | 'bordered' | 'elevated' | 'ghost' | 'gradient';
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info';
type SpinnerVariant = 'primary' | 'secondary' | 'white' | 'current';
type CryptoAlgorithm = 'AES-GCM' | 'ChaCha20-Poly1305';
type CompressionAlgorithm = 'gzip' | 'deflate';
type ThemePreview = 'dark' | 'light' | 'high-contrast' | 'colorblind';

export default function PlaygroundPage() {
  // Component Playground State
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('Button');
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>('primary');
  const [buttonSize, setButtonSize] = useState<ButtonSize>('md');
  const [buttonLoading, setButtonLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonFullWidth, setButtonFullWidth] = useState(false);

  const [cardVariant, setCardVariant] = useState<CardVariant>('default');
  const [cardHover, setCardHover] = useState(false);
  const [cardGlow, setCardGlow] = useState(false);

  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>('default');
  const [badgeDot, setBadgeDot] = useState(false);

  const [spinnerVariant, setSpinnerVariant] = useState<SpinnerVariant>('primary');
  const [spinnerSize, setSpinnerSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  const [showModal, setShowModal] = useState(false);

  // Crypto Demo State
  const [cryptoAlgorithm, setCryptoAlgorithm] = useState<CryptoAlgorithm>('AES-GCM');
  const [plaintext, setPlaintext] = useState('Hello, secure world!');
  const [ciphertext, setCiphertext] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [encryptTime, setEncryptTime] = useState(0);
  const [decryptTime, setDecryptTime] = useState(0);

  // Compression Demo State
  const [compressionAlgo, setCompressionAlgo] = useState<CompressionAlgorithm>('gzip');
  const [compressionInput, setCompressionInput] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)
  );
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

  // Theme Preview State
  const [themePreview, setThemePreview] = useState<ThemePreview>('dark');

  // Generate JSX code for selected component
  const generatedCode = useMemo(() => {
    switch (selectedComponent) {
      case 'Button':
        return `<Button
  variant="${buttonVariant}"
  size="${buttonSize}"${buttonLoading ? '\n  loading' : ''}${buttonDisabled ? '\n  disabled' : ''}${buttonFullWidth ? '\n  fullWidth' : ''}
>
  Click me
</Button>`;

      case 'Card':
        return `<Card
  variant="${cardVariant}"${cardHover ? '\n  hover' : ''}${cardGlow ? '\n  glow' : ''}
>
  <CardHeader title="Card Title" />
  <CardContent>
    Card content goes here...
  </CardContent>
</Card>`;

      case 'Badge':
        return `<Badge
  variant="${badgeVariant}"${badgeDot ? '\n  dot' : ''}
>
  Badge Text
</Badge>`;

      case 'Input':
        return `<Input
  label="Email"
  placeholder="Enter your email"
  type="email"
/>`;

      case 'Modal':
        return `<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  Modal content goes here...
</Modal>`;

      case 'Spinner':
        return `<Spinner
  variant="${spinnerVariant}"
  size="${spinnerSize}"
/>`;

      default:
        return '';
    }
  }, [
    selectedComponent,
    buttonVariant,
    buttonSize,
    buttonLoading,
    buttonDisabled,
    buttonFullWidth,
    cardVariant,
    cardHover,
    cardGlow,
    badgeVariant,
    badgeDot,
    spinnerVariant,
    spinnerSize,
  ]);

  // Crypto operations (mock implementation)
  const handleEncrypt = () => {
    const start = performance.now();
    // Mock encryption
    const mockCiphertext = btoa(plaintext + cryptoAlgorithm);
    setCiphertext(mockCiphertext);
    const end = performance.now();
    setEncryptTime(end - start);
    setDecrypted('');
  };

  const handleDecrypt = () => {
    const start = performance.now();
    // Mock decryption
    try {
      const decoded = atob(ciphertext);
      const text = decoded.replace(cryptoAlgorithm, '');
      setDecrypted(text);
    } catch {
      setDecrypted('Failed to decrypt');
    }
    const end = performance.now();
    setDecryptTime(end - start);
  };

  const handleGenerateKey = () => {
    const randomKey = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    alert(`Generated Key: ${randomKey}`);
  };

  // Compression operations (mock implementation)
  const handleCompress = () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(compressionInput);
    setOriginalSize(data.length);
    // Mock compression (approximately 60% reduction)
    setCompressedSize(Math.floor(data.length * 0.4));
  };

  // Design token colors
  const designTokens = [
    { name: 'Primary 500', value: '#5E5CE6', var: '--primary-500' },
    { name: 'Success', value: '#22c55e', var: '--success-500' },
    { name: 'Warning', value: '#f59e0b', var: '--warning-500' },
    { name: 'Error', value: '#ef4444', var: '--error-500' },
    { name: 'Info', value: '#3b82f6', var: '--info-500' },
    { name: 'Gray 900', value: '#18181b', var: '--gray-900' },
    { name: 'Gray 700', value: '#3f3f46', var: '--gray-700' },
    { name: 'Gray 500', value: '#71717a', var: '--gray-500' },
  ];

  return (
    <>
    <Header />
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Interactive Playground</h1>
        <p className={styles.description}>
          Try out components, APIs, and design tokens in real-time. Experiment with props,
          test cryptographic functions, and preview theme variations.
        </p>
      </div>

      <div className={styles.content}>
        {/* Component Playground */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Component Playground</h2>
            <span className={styles.sectionBadge}>Interactive</span>
          </div>

          <div className={styles.splitView}>
            <div className={styles.leftPanel}>
              <div className={styles.controlsCard}>
                <h3 className={styles.controlsTitle}>Component Controls</h3>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Select Component</label>
                  <select
                    className={styles.select}
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
                  >
                    <option value="Button">Button</option>
                    <option value="Card">Card</option>
                    <option value="Badge">Badge</option>
                    <option value="Input">Input</option>
                    <option value="Modal">Modal</option>
                    <option value="Spinner">Spinner</option>
                  </select>
                </div>

                {selectedComponent === 'Button' && (
                  <>
                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Variant</label>
                      <div className={styles.toggleGroup}>
                        {(['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] as const).map(
                          (variant) => (
                            <button
                              key={variant}
                              className={`${styles.toggleButton} ${buttonVariant === variant ? styles.active : ''}`}
                              onClick={() => setButtonVariant(variant)}
                            >
                              {variant}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Size</label>
                      <div className={styles.toggleGroup}>
                        {(['sm', 'md', 'lg', 'icon'] as const).map((size) => (
                          <button
                            key={size}
                            className={`${styles.toggleButton} ${buttonSize === size ? styles.active : ''}`}
                            onClick={() => setButtonSize(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={buttonLoading}
                          onChange={(e) => setButtonLoading(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Loading</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={buttonDisabled}
                          onChange={(e) => setButtonDisabled(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Disabled</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={buttonFullWidth}
                          onChange={(e) => setButtonFullWidth(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Full Width</span>
                      </label>
                    </div>
                  </>
                )}

                {selectedComponent === 'Card' && (
                  <>
                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Variant</label>
                      <div className={styles.toggleGroup}>
                        {(['default', 'bordered', 'elevated', 'ghost', 'gradient'] as const).map(
                          (variant) => (
                            <button
                              key={variant}
                              className={`${styles.toggleButton} ${cardVariant === variant ? styles.active : ''}`}
                              onClick={() => setCardVariant(variant)}
                            >
                              {variant}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={cardHover}
                          onChange={(e) => setCardHover(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Hover Effect</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={cardGlow}
                          onChange={(e) => setCardGlow(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Glow Effect</span>
                      </label>
                    </div>
                  </>
                )}

                {selectedComponent === 'Badge' && (
                  <>
                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Variant</label>
                      <div className={styles.toggleGroup}>
                        {(['default', 'secondary', 'outline', 'success', 'warning', 'error', 'info'] as const).map(
                          (variant) => (
                            <button
                              key={variant}
                              className={`${styles.toggleButton} ${badgeVariant === variant ? styles.active : ''}`}
                              onClick={() => setBadgeVariant(variant)}
                            >
                              {variant}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          className={styles.checkboxInput}
                          checked={badgeDot}
                          onChange={(e) => setBadgeDot(e.target.checked)}
                        />
                        <span className={styles.checkboxLabel}>Show Dot</span>
                      </label>
                    </div>
                  </>
                )}

                {selectedComponent === 'Spinner' && (
                  <>
                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Variant</label>
                      <div className={styles.toggleGroup}>
                        {(['primary', 'secondary', 'white', 'current'] as const).map((variant) => (
                          <button
                            key={variant}
                            className={`${styles.toggleButton} ${spinnerVariant === variant ? styles.active : ''}`}
                            onClick={() => setSpinnerVariant(variant)}
                          >
                            {variant}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.controlGroup}>
                      <label className={styles.controlLabel}>Size</label>
                      <div className={styles.toggleGroup}>
                        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
                          <button
                            key={size}
                            className={`${styles.toggleButton} ${spinnerSize === size ? styles.active : ''}`}
                            onClick={() => setSpinnerSize(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedComponent === 'Modal' && (
                  <div className={styles.controlGroup}>
                    <button
                      className={styles.actionButton}
                      onClick={() => setShowModal(true)}
                    >
                      Open Modal
                    </button>
                  </div>
                )}
              </div>

              <CodeEditor code={generatedCode} readonly label="Generated JSX" />
            </div>

            <div className={styles.rightPanel}>
              <LivePreview label="Live Preview">
                {selectedComponent === 'Button' && (
                  <Button
                    variant={buttonVariant}
                    size={buttonSize}
                    loading={buttonLoading}
                    disabled={buttonDisabled}
                    fullWidth={buttonFullWidth}
                  >
                    {buttonSize === 'icon' ? '🚀' : 'Click me'}
                  </Button>
                )}

                {selectedComponent === 'Card' && (
                  <Card variant={cardVariant} hover={cardHover} glow={cardGlow}>
                    <CardHeader
                      title="Card Title"
                      description="This is a card description"
                    />
                    <CardContent>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Card content goes here. Adjust the variant and options to see
                        different styles.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedComponent === 'Badge' && (
                  <Badge variant={badgeVariant} dot={badgeDot}>
                    Badge Text
                  </Badge>
                )}

                {selectedComponent === 'Input' && (
                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    type="email"
                    helperText="We'll never share your email"
                  />
                )}

                {selectedComponent === 'Modal' && (
                  <div>
                    <Button onClick={() => setShowModal(true)}>Open Modal</Button>
                    <Modal
                      open={showModal}
                      onClose={() => setShowModal(false)}
                      title="Example Modal"
                      size="md"
                    >
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        This is a modal dialog. You can customize its size, behavior, and
                        appearance.
                      </p>
                      <Button onClick={() => setShowModal(false)}>Close</Button>
                    </Modal>
                  </div>
                )}

                {selectedComponent === 'Spinner' && (
                  <Spinner variant={spinnerVariant} size={spinnerSize} />
                )}
              </LivePreview>
            </div>
          </div>
        </section>

        {/* Crypto Demo */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Crypto Demo</h2>
            <span className={styles.sectionBadge}>Security</span>
          </div>

          <div className={styles.splitView}>
            <div className={styles.leftPanel}>
              <div className={styles.controlsCard}>
                <h3 className={styles.controlsTitle}>Encryption Settings</h3>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Algorithm</label>
                  <select
                    className={styles.select}
                    value={cryptoAlgorithm}
                    onChange={(e) => setCryptoAlgorithm(e.target.value as CryptoAlgorithm)}
                  >
                    <option value="AES-GCM">AES-GCM</option>
                    <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Plaintext</label>
                  <textarea
                    className={styles.textarea}
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    placeholder="Enter text to encrypt..."
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button className={styles.actionButton} onClick={handleEncrypt}>
                    Encrypt
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={handleDecrypt}
                    disabled={!ciphertext}
                  >
                    Decrypt
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.secondary}`}
                    onClick={handleGenerateKey}
                  >
                    Generate Key
                  </button>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Encrypt Time</div>
                  <div className={styles.statValue}>{encryptTime.toFixed(2)}ms</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Decrypt Time</div>
                  <div className={styles.statValue}>{decryptTime.toFixed(2)}ms</div>
                </div>
              </div>
            </div>

            <div className={styles.rightPanel}>
              {ciphertext && (
                <div className={styles.controlsCard}>
                  <h3 className={styles.controlsTitle}>Ciphertext (Hex)</h3>
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {ciphertext}
                  </div>
                </div>
              )}

              {decrypted && (
                <div className={styles.controlsCard}>
                  <h3 className={styles.controlsTitle}>Decrypted Result</h3>
                  <div
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {decrypted}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Compression Demo */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Compression Demo</h2>
            <span className={styles.sectionBadge}>Performance</span>
          </div>

          <div className={styles.splitView}>
            <div className={styles.leftPanel}>
              <div className={styles.controlsCard}>
                <h3 className={styles.controlsTitle}>Compression Settings</h3>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Algorithm</label>
                  <select
                    className={styles.select}
                    value={compressionAlgo}
                    onChange={(e) =>
                      setCompressionAlgo(e.target.value as CompressionAlgorithm)
                    }
                  >
                    <option value="gzip">gzip</option>
                    <option value="deflate">deflate</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Input Text</label>
                  <textarea
                    className={styles.textarea}
                    value={compressionInput}
                    onChange={(e) => setCompressionInput(e.target.value)}
                    placeholder="Enter text to compress..."
                  />
                </div>

                <button className={styles.actionButton} onClick={handleCompress}>
                  Compress
                </button>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Original Size</div>
                  <div className={styles.statValue}>{originalSize} bytes</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Compressed Size</div>
                  <div className={styles.statValue}>{compressedSize} bytes</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Reduction</div>
                  <div className={styles.statValue}>
                    {originalSize > 0
                      ? `${Math.round(((originalSize - compressedSize) / originalSize) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.rightPanel}>
              {originalSize > 0 && (
                <div className={styles.controlsCard}>
                  <h3 className={styles.controlsTitle}>Size Comparison</h3>
                  <div className={styles.barChart}>
                    <div
                      className={styles.bar}
                      style={{ height: '100%' }}
                      title={`Original: ${originalSize} bytes`}
                    >
                      <div className={styles.barValue}>{originalSize}</div>
                      <div className={styles.barLabel}>Original</div>
                    </div>
                    <div
                      className={styles.bar}
                      style={{
                        height: `${(compressedSize / originalSize) * 100}%`,
                        background: 'var(--success-500)',
                      }}
                      title={`Compressed: ${compressedSize} bytes`}
                    >
                      <div className={styles.barValue}>{compressedSize}</div>
                      <div className={styles.barLabel}>Compressed</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Theme Preview */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Theme Preview</h2>
            <span className={styles.sectionBadge}>Design</span>
          </div>

          <div className={styles.controlsCard}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Theme</label>
              <div className={styles.toggleGroup}>
                {(['dark', 'light', 'high-contrast', 'colorblind'] as const).map((theme) => (
                  <button
                    key={theme}
                    className={`${styles.toggleButton} ${themePreview === theme ? styles.active : ''}`}
                    onClick={() => setThemePreview(theme)}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Design Token Color Palette</label>
              <div className={styles.palette}>
                {designTokens.map((token) => (
                  <div key={token.var} className={styles.colorSwatch}>
                    <div
                      className={styles.colorPreview}
                      style={{ background: token.value }}
                    />
                    <div className={styles.colorInfo}>
                      <div className={styles.colorName}>{token.name}</div>
                      <div className={styles.colorValue}>{token.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Typography Scale</label>
              <div className={styles.typeScale}>
                <div className={styles.typeExample}>
                  <div className={styles.typeLabel}>text-4xl (2.25rem / 36px)</div>
                  <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    The quick brown fox
                  </div>
                </div>
                <div className={styles.typeExample}>
                  <div className={styles.typeLabel}>text-2xl (1.5rem / 24px)</div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                    The quick brown fox jumps
                  </div>
                </div>
                <div className={styles.typeExample}>
                  <div className={styles.typeLabel}>text-base (1rem / 16px)</div>
                  <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--text-secondary)' }}>
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
                <div className={styles.typeExample}>
                  <div className={styles.typeLabel}>text-sm (0.875rem / 14px)</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Component Samples</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    <Footer />
    </>
  );
}
