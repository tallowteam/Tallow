'use client';

import { useRef, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MermaidDiagram } from '@/components/docs/MermaidDiagram';
import { architectureDiagrams } from '@/lib/docs/architecture-diagrams';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight } from '@/components/icons';
import styles from './page.module.css';

interface TableOfContentsItem {
  id: string;
  title: string;
  description: string;
}

const tableOfContents: TableOfContentsItem[] = [
  {
    id: 'system-overview',
    title: 'System Overview',
    description: 'High-level architecture showing all major components and data flows',
  },
  {
    id: 'crypto-architecture',
    title: 'Cryptographic Architecture',
    description: 'Encryption layers, key exchange, and security mechanisms',
  },
  {
    id: 'transfer-flow',
    title: 'File Transfer Flow',
    description: 'Complete sequence of file encryption, chunking, and decryption',
  },
  {
    id: 'discovery-flow',
    title: 'Device Discovery',
    description: 'mDNS local discovery and room code signaling flows',
  },
  {
    id: 'state-management',
    title: 'State Management',
    description: 'Zustand stores architecture and component integration',
  },
  {
    id: 'deployment-architecture',
    title: 'Deployment Infrastructure',
    description: 'Self-hosted deployment with Docker, Cloudflare, and monitoring',
  },
];

const diagramDetails = {
  'system-overview': {
    title: 'System Overview',
    description:
      'The Tallow system architecture consists of browser-based clients that communicate through WebRTC for peer-to-peer transfers. When direct P2P connection is not possible due to NAT/firewall constraints, data is relayed through TURN servers. Device discovery happens either through local mDNS broadcasts for LAN devices, or through room codes that connect to the signaling server for remote transfers.',
    icon: '🌐',
  },
  'crypto-architecture': {
    title: 'Cryptographic Architecture',
    description:
      'Tallow implements multiple encryption layers for defense in depth. File transfers use ChaCha20-Poly1305 authenticated encryption with keys derived from post-quantum (ML-KEM-768) and classical (X25519) key exchange. Messages in chat are protected by a Triple Ratchet protocol for forward secrecy. Digital signatures using Ed25519 provide peer identity verification.',
    icon: '🔐',
  },
  'transfer-flow': {
    title: 'File Transfer Flow',
    description:
      'Files are encrypted using ChaCha20-Poly1305 before transmission. The encrypted stream is then divided into 64KB chunks with metadata (sequence number, checksum). Chunks are sent across the P2P WebRTC data channel, and the receiver reassembles them in order, verifies checksums, then decrypts the original file. This design enables resumable transfers and corruption detection.',
    icon: '📦',
  },
  'discovery-flow': {
    title: 'Device Discovery',
    description:
      'Tallow supports two discovery mechanisms: (1) mDNS for local network devices - devices broadcast themselves and listener devices discover them through Bonjour-compatible mDNS; (2) Room codes for remote discovery - a user generates a temporary room code that both devices join through the signaling server, which exchanges WebRTC offers/answers to establish the P2P connection. Both paths verify device identity using TLS certificates.',
    icon: '🔍',
  },
  'state-management': {
    title: 'State Management',
    description:
      'Tallow uses Zustand for lightweight state management with separate stores for devices, transfers, settings, and friends. Each store provides actions that call plain TypeScript modules (no framework dependencies). Components subscribe directly to store changes. This architecture enables testing modules independently and keeps the state logic decoupled from React.',
    icon: '🗄️',
  },
  'deployment-architecture': {
    title: 'Deployment Infrastructure',
    description:
      'Tallow can be self-hosted on a Synology NAS or any Linux server running Docker. The application runs in an Alpine-based container with Next.js. Cloudflare Tunnel provides secure internet access without exposing your home IP. A separate coturn TURN server handles NAT traversal for WebRTC connections. Application logs and metrics are collected for monitoring.',
    icon: '🚀',
  },
};

export default function ArchitecturePage() {
  const [activeSection, setActiveSection] = useState('system-overview');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sections = document.querySelectorAll('[data-diagram-section]');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-diagram-section');
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      {
        rootMargin: '-100px 0px -66% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      observerRef.current?.observe(section);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleTocClick = (id: string) => {
    const element = document.querySelector(`[data-diagram-section="${id}"]`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.heroGradient} />
          </div>
          <div className={styles.heroContent}>
            <Badge variant="secondary">Architecture</Badge>
            <h1 className={styles.heroTitle}>
              Tallow
              <br />
              <span className={styles.heroGradient}>Architecture Diagrams</span>
            </h1>
            <p className={styles.heroDescription}>
              Explore the complete system architecture, cryptographic design, and deployment infrastructure behind Tallow.
              From P2P connections to encryption layers, understand how Tallow keeps your transfers secure.
            </p>
          </div>
        </section>

        <div className={styles.contentWrapper}>
          {/* Table of Contents Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.tocContainer}>
              <h2 className={styles.tocTitle}>Contents</h2>
              <nav className={styles.toc}>
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTocClick(item.id)}
                    className={`${styles.tocItem} ${
                      activeSection === item.id ? styles.tocItemActive : ''
                    }`}
                    type="button"
                  >
                    <span className={styles.tocItemTitle}>{item.title}</span>
                    <span className={styles.tocItemDescription}>{item.description}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {/* System Overview */}
            <section
              className={styles.section}
              data-diagram-section="system-overview"
              id="system-overview"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['system-overview'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>System Overview</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['system-overview'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.SYSTEM_OVERVIEW} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Key Components</h3>
                  <ul className={styles.featureList}>
                    <li>
                      <strong>Browser App:</strong> React-based client with WebRTC and discovery services
                    </li>
                    <li>
                      <strong>WebRTC Peer:</strong> Direct P2P connection between devices using data channels
                    </li>
                    <li>
                      <strong>Signaling Server:</strong> Manages WebRTC offer/answer exchange and room codes
                    </li>
                    <li>
                      <strong>mDNS Daemon:</strong> Local network discovery using Bonjour-compatible protocol
                    </li>
                    <li>
                      <strong>TURN Server:</strong> Relays data when direct P2P connection fails due to NAT
                    </li>
                  </ul>
                </div>
              </Card>
            </section>

            {/* Crypto Architecture */}
            <section
              className={styles.section}
              data-diagram-section="crypto-architecture"
              id="crypto-architecture"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['crypto-architecture'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Cryptographic Architecture</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['crypto-architecture'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.CRYPTO_ARCHITECTURE} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Security Mechanisms</h3>
                  <div className={styles.gridContent}>
                    <div>
                      <h4 className={styles.subTitle}>Key Exchange</h4>
                      <p>
                        <strong>ML-KEM-768:</strong> Post-quantum key encapsulation mechanism (NIST-standardized)
                      </p>
                      <p>
                        <strong>X25519:</strong> Classical elliptic curve Diffie-Hellman for interoperability
                      </p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>File Encryption</h4>
                      <p>
                        <strong>ChaCha20-Poly1305:</strong> Stream cipher with authenticated encryption (AEAD)
                      </p>
                      <p>Provides confidentiality and integrity for file data</p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>Message Encryption</h4>
                      <p>
                        <strong>Triple Ratchet:</strong> Forward-secret key derivation for chat messages
                      </p>
                      <p>Ensures compromise of one key doesn't expose past messages</p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>Digital Signatures</h4>
                      <p>
                        <strong>Ed25519:</strong> EdDSA signature scheme for peer authentication
                      </p>
                      <p>Verifies device identity and prevents man-in-the-middle attacks</p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Transfer Flow */}
            <section
              className={styles.section}
              data-diagram-section="transfer-flow"
              id="transfer-flow"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['transfer-flow'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>File Transfer Flow</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['transfer-flow'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.TRANSFER_FLOW} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Transfer Process</h3>
                  <ol className={styles.processSteps}>
                    <li>
                      <strong>Selection:</strong> Sender chooses file to transfer
                    </li>
                    <li>
                      <strong>Encryption:</strong> File is encrypted with ChaCha20-Poly1305 using derived key
                    </li>
                    <li>
                      <strong>Chunking:</strong> Encrypted stream divided into 64KB chunks with metadata
                    </li>
                    <li>
                      <strong>Transmission:</strong> Chunks sent over WebRTC data channel (P2P or relayed)
                    </li>
                    <li>
                      <strong>Reassembly:</strong> Receiver reorders chunks by sequence number and verifies checksums
                    </li>
                    <li>
                      <strong>Decryption:</strong> Decrypts reassembled stream and verifies AEAD authentication tag
                    </li>
                    <li>
                      <strong>Save:</strong> Original file saved to receiver's device
                    </li>
                  </ol>
                </div>
              </Card>
            </section>

            {/* Discovery Flow */}
            <section
              className={styles.section}
              data-diagram-section="discovery-flow"
              id="discovery-flow"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['discovery-flow'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Device Discovery</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['discovery-flow'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.DISCOVERY_FLOW} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Discovery Methods</h3>
                  <div className={styles.gridContent}>
                    <div>
                      <h4 className={styles.subTitle}>mDNS Discovery</h4>
                      <p>
                        Automatic discovery of devices on the same local network. Devices broadcast a
                        <code>_tallow._tcp.local</code> service advertisement.
                      </p>
                      <p className={styles.featuresNote}>
                        No configuration needed • Zero external servers • Works with firewalls
                      </p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>Room Code Discovery</h4>
                      <p>
                        Temporary 6-digit codes that both devices join through the signaling server. Codes
                        expire after transfer or timeout period.
                      </p>
                      <p className={styles.featuresNote}>
                        Works across networks • No port forwarding • Human-readable
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* State Management */}
            <section
              className={styles.section}
              data-diagram-section="state-management"
              id="state-management"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['state-management'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>State Management</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['state-management'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.STATE_MANAGEMENT} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Store Architecture</h3>
                  <div className={styles.gridContent}>
                    <div>
                      <h4 className={styles.subTitle}>device-store</h4>
                      <p>Connected peers, local mDNS devices, device status and metadata</p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>transfer-store</h4>
                      <p>Active transfers, progress tracking, file metadata, completion status</p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>settings-store</h4>
                      <p>User preferences, theme selection, privacy settings, application configuration</p>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>friends-store</h4>
                      <p>Saved peers, custom nicknames, favorite devices, contact management</p>
                    </div>
                  </div>
                  <div className={styles.note}>
                    <strong>Architecture Pattern:</strong> Each store has pure TypeScript action modules that can
                    be tested independently. Components subscribe to store updates via hooks.
                  </div>
                </div>
              </Card>
            </section>

            {/* Deployment Architecture */}
            <section
              className={styles.section}
              data-diagram-section="deployment-architecture"
              id="deployment-architecture"
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  {diagramDetails['deployment-architecture'].icon}
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Deployment Infrastructure</h2>
                  <p className={styles.sectionDescription}>
                    {diagramDetails['deployment-architecture'].description}
                  </p>
                </div>
              </div>

              <MermaidDiagram diagram={architectureDiagrams.DEPLOYMENT_ARCHITECTURE} />

              <Card variant="default" padding="md">
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>Deployment Stack</h3>
                  <div className={styles.gridContent}>
                    <div>
                      <h4 className={styles.subTitle}>Local Server</h4>
                      <ul className={styles.featureList}>
                        <li>Synology NAS (Intel-based)</li>
                        <li>Docker container (Alpine Linux)</li>
                        <li>Next.js application</li>
                        <li>SQLite database</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>Internet Access</h4>
                      <ul className={styles.featureList}>
                        <li>Cloudflare Tunnel (secure ingress)</li>
                        <li>Cloudflare WAF (DDoS protection)</li>
                        <li>Custom domain via DNS</li>
                        <li>Automatic HTTPS/TLS</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>WebRTC Relay</h4>
                      <ul className={styles.featureList}>
                        <li>coturn TURN server</li>
                        <li>STUN for IP detection</li>
                        <li>NAT traversal support</li>
                        <li>Bandwidth-efficient relaying</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className={styles.subTitle}>Monitoring</h4>
                      <ul className={styles.featureList}>
                        <li>Structured JSON logging</li>
                        <li>Prometheus metrics</li>
                        <li>Health check endpoints</li>
                        <li>Real-time observability</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Additional Resources */}
            <section className={styles.section}>
              <Card variant="elevated" padding="lg" className={styles.resourcesCard}>
                <div className={styles.cardContent}>
                  <h2 className={styles.sectionTitle}>Learn More</h2>
                  <p className={styles.sectionDescription}>
                    Dive deeper into specific aspects of Tallow's architecture and implementation.
                  </p>

                  <div className={styles.resourcesGrid}>
                    <a href="/docs/security" className={styles.resourceLink}>
                      <div>
                        <h3>Security Overview</h3>
                        <p>Comprehensive security documentation and threat models</p>
                      </div>
                      <ArrowRight />
                    </a>

                    <a href="/docs/encryption" className={styles.resourceLink}>
                      <div>
                        <h3>Encryption Details</h3>
                        <p>Deep dive into cryptographic algorithms and implementation</p>
                      </div>
                      <ArrowRight />
                    </a>

                    <a href="/docs/device-discovery" className={styles.resourceLink}>
                      <div>
                        <h3>Device Discovery</h3>
                        <p>mDNS configuration and room code system details</p>
                      </div>
                      <ArrowRight />
                    </a>

                    <a href="/docs/self-hosting" className={styles.resourceLink}>
                      <div>
                        <h3>Self-Hosting Guide</h3>
                        <p>Step-by-step setup for deploying Tallow on your infrastructure</p>
                      </div>
                      <ArrowRight />
                    </a>
                  </div>
                </div>
              </Card>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
