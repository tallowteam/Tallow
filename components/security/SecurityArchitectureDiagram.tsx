'use client';

import styles from './SecurityArchitectureDiagram.module.css';

interface ArchitectureLayer {
  id: number;
  name: string;
  components: string[];
  color: string;
  size: number;
}

const architectureLayers: ArchitectureLayer[] = [
  {
    id: 1,
    name: 'Application Layer',
    components: ['React UI', 'File Processing', 'User Controls'],
    color: 'var(--primary-500)',
    size: 100,
  },
  {
    id: 2,
    name: 'Transport Layer',
    components: ['WebRTC P2P', 'DTLS 1.3', 'SCTP'],
    color: 'var(--info-500)',
    size: 80,
  },
  {
    id: 3,
    name: 'Encryption Layer',
    components: ['ML-KEM-768', 'AES-256-GCM', 'X25519'],
    color: 'var(--primary-600)',
    size: 60,
  },
  {
    id: 4,
    name: 'Network Layer',
    components: ['Onion Routing', 'NAT Traversal', 'STUN/TURN'],
    color: 'var(--success-500)',
    size: 40,
  },
  {
    id: 5,
    name: 'Privacy Layer',
    components: ['Metadata Stripping', 'Secure Deletion', 'Zero Logs'],
    color: 'var(--warning-500)',
    size: 20,
  },
];

export default function SecurityArchitectureDiagram() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.badge}>5-Layer Architecture</span>
        <h2 className={styles.title}>Security Stack</h2>
        <p className={styles.description}>
          Defense-in-depth architecture with multiple independent security layers
          protecting your data at every stage.
        </p>
      </div>

      <div className={styles.diagram}>
        <svg
          viewBox="0 0 400 400"
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Define gradients */}
          <defs>
            <radialGradient id="layerGlow1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="layerGlow2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--info-500)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--info-500)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="layerGlow3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary-600)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary-600)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="layerGlow4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--success-500)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--success-500)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="layerGlow5" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--warning-500)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--warning-500)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric rings - reverse order so largest is in back */}
          {architectureLayers.slice().reverse().map((layer, index) => {
            const actualIndex = architectureLayers.length - 1 - index;
            const radius = 50 + actualIndex * 30;
            const circumference = 2 * Math.PI * radius;

            return (
              <g key={layer.id} className={styles.layerGroup}>
                {/* Glow effect */}
                <circle
                  cx="200"
                  cy="200"
                  r={radius}
                  fill={`url(#layerGlow${layer.id})`}
                  className={styles.layerGlow}
                  style={{
                    animationDelay: `${actualIndex * 150}ms`,
                  }}
                />

                {/* Main ring */}
                <circle
                  cx="200"
                  cy="200"
                  r={radius}
                  fill="none"
                  stroke={layer.color}
                  strokeWidth="2"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference}
                  className={styles.layerRing}
                  style={{
                    animationDelay: `${actualIndex * 150}ms`,
                  }}
                />
              </g>
            );
          })}

          {/* Center shield icon */}
          <g className={styles.centerIcon}>
            <circle cx="200" cy="200" r="25" fill="var(--bg-surface)" stroke="var(--primary-500)" strokeWidth="2" />
            <path
              d="M200 180 l-12 6 v6 c0 6 4 11.6 12 13 c8 -1.4 12 -7 12 -13 v-6 Z"
              fill="none"
              stroke="var(--primary-500)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M196 195 l2 2 l4 -4"
              fill="none"
              stroke="var(--primary-500)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* Layer labels */}
        <div className={styles.labels}>
          {architectureLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={styles.labelCard}
              style={{
                animationDelay: `${(index + 1) * 150}ms`,
              }}
            >
              <div
                className={styles.labelIndicator}
                style={{ backgroundColor: layer.color }}
              />
              <div className={styles.labelContent}>
                <h3 className={styles.labelTitle}>
                  Layer {layer.id}: {layer.name}
                </h3>
                <div className={styles.labelComponents}>
                  {layer.components.map((component, i) => (
                    <span key={i} className={styles.component}>
                      {component}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="none" stroke="var(--primary-500)" strokeWidth="2" />
            </svg>
            <span>Independent security layers</span>
          </div>
          <div className={styles.legendItem}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 2 L8 14" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 10 L8 14 L12 10" stroke="var(--primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Data flows from outer to inner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
