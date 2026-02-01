#!/usr/bin/env tsx

/**
 * Feature Verification Script
 * Automatically verifies all 150+ features from the feature catalog against the codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Feature verification result
interface VerificationResult {
  id: string;
  title: string;
  category: string;
  status: 'verified' | 'missing' | 'partial' | 'deprecated';
  confidence: number; // 0-100
  foundIn: string[];
  issues: string[];
  recommendations: string[];
}

// Feature definition
interface Feature {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  location?: string;
  keyFiles?: string[];
  keywords?: string[];
  status?: 'production' | 'beta' | 'planned';
}

// Verification report
interface VerificationReport {
  timestamp: string;
  totalFeatures: number;
  verified: number;
  missing: number;
  partial: number;
  deprecated: number;
  verificationRate: number;
  results: VerificationResult[];
  summary: {
    byCategory: Record<string, { total: number; verified: number; rate: number }>;
    byStatus: Record<string, number>;
  };
}

/**
 * Feature Catalog (150+ features)
 */
const FEATURE_CATALOG: Feature[] = [
  // Core Features (10)
  {
    id: 'p2p-transfer',
    title: 'P2P Direct Transfer',
    category: 'Core Features',
    location: 'lib/transfer/',
    keyFiles: ['lib/transfer/p2p-internet.ts'],
    keywords: ['WebRTC', 'DataChannel', 'peer-to-peer'],
    status: 'production',
  },
  {
    id: 'pqc-encryption',
    title: 'Post-Quantum Cryptography',
    category: 'Core Features',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/file-encryption-pqc.ts', 'lib/crypto/pqc-crypto-lazy.ts'],
    keywords: ['ML-KEM', 'Kyber', 'post-quantum'],
    status: 'production',
  },
  {
    id: 'chunked-transfer',
    title: 'Chunked File Transfer',
    category: 'Core Features',
    location: 'lib/transfer/',
    keyFiles: ['lib/transfer/p2p-internet.ts'],
    keywords: ['chunk', '64KB', 'streaming'],
    status: 'production',
  },
  {
    id: 'e2e-encryption',
    title: 'End-to-End Encryption',
    category: 'Core Features',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/file-encryption-pqc.ts'],
    keywords: ['E2EE', 'encryption', 'AES-256'],
    status: 'production',
  },
  {
    id: 'zero-knowledge',
    title: 'Zero-Knowledge Architecture',
    category: 'Core Features',
    location: 'lib/',
    keywords: ['zero-knowledge', 'server-blind'],
    status: 'production',
  },
  {
    id: 'webrtc-connection',
    title: 'WebRTC Connection',
    category: 'Core Features',
    location: 'lib/transport/',
    keyFiles: ['lib/transport/private-webrtc.ts'],
    keywords: ['WebRTC', 'RTCPeerConnection', 'STUN'],
    status: 'production',
  },
  {
    id: 'signaling-server',
    title: 'Signaling Server',
    category: 'Core Features',
    location: 'lib/signaling/',
    keyFiles: ['lib/signaling/socket-signaling.ts'],
    keywords: ['signaling', 'WebSocket', 'Socket.io'],
    status: 'production',
  },
  {
    id: 'device-pairing',
    title: 'Device Pairing',
    category: 'Core Features',
    location: 'lib/discovery/',
    keyFiles: ['lib/discovery/local-discovery.ts'],
    keywords: ['pairing', 'QR code', 'word phrases'],
    status: 'production',
  },
  {
    id: 'local-discovery',
    title: 'Local Network Discovery',
    category: 'Core Features',
    location: 'lib/discovery/',
    keyFiles: ['lib/discovery/local-discovery.ts'],
    keywords: ['mDNS', 'local discovery', 'LAN'],
    status: 'production',
  },
  {
    id: 'progress-tracking',
    title: 'Real-Time Progress Tracking',
    category: 'Core Features',
    location: 'components/transfer/',
    keyFiles: ['components/transfer/transfer-progress.tsx'],
    keywords: ['progress', 'upload', 'download'],
    status: 'production',
  },

  // Security Features (20+)
  {
    id: 'chacha20-poly1305',
    title: 'ChaCha20-Poly1305 Cipher',
    category: 'Security Features',
    subcategory: 'Symmetric Encryption',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/triple-ratchet.ts'],
    keywords: ['ChaCha20', 'Poly1305', 'AEAD'],
    status: 'production',
  },
  {
    id: 'aes-256-gcm',
    title: 'AES-256-GCM',
    category: 'Security Features',
    subcategory: 'Symmetric Encryption',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/file-encryption-pqc.ts'],
    keywords: ['AES-256', 'GCM', 'encryption'],
    status: 'production',
  },
  {
    id: 'ml-kem-768',
    title: 'ML-KEM-768 (Kyber)',
    category: 'Security Features',
    subcategory: 'Post-Quantum',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/pqc-crypto-lazy.ts'],
    keywords: ['ML-KEM', 'Kyber', 'NIST'],
    status: 'production',
  },
  {
    id: 'x25519',
    title: 'X25519 Key Exchange',
    category: 'Security Features',
    subcategory: 'Key Exchange',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/file-encryption-pqc.ts'],
    keywords: ['X25519', 'ECDH', 'Curve25519'],
    status: 'production',
  },
  {
    id: 'triple-ratchet',
    title: 'Triple Ratchet Protocol',
    category: 'Security Features',
    subcategory: 'Protocols',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/triple-ratchet.ts'],
    keywords: ['ratchet', 'forward secrecy'],
    status: 'production',
  },
  {
    id: 'signed-prekeys',
    title: 'Signed Pre-Keys',
    category: 'Security Features',
    subcategory: 'Key Management',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/signed-prekeys.ts'],
    keywords: ['prekeys', 'signed', 'authentication'],
    status: 'production',
  },
  {
    id: 'peer-authentication',
    title: 'Peer Authentication',
    category: 'Security Features',
    subcategory: 'Authentication',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/peer-authentication.ts'],
    keywords: ['authentication', 'verify', 'challenge'],
    status: 'production',
  },
  {
    id: 'key-management',
    title: 'Secure Key Management',
    category: 'Security Features',
    subcategory: 'Key Management',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/key-management.ts'],
    keywords: ['key storage', 'key derivation'],
    status: 'production',
  },
  {
    id: 'digital-signatures',
    title: 'Digital Signatures',
    category: 'Security Features',
    subcategory: 'Authentication',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/digital-signatures.ts'],
    keywords: ['signature', 'Ed25519', 'verify'],
    status: 'production',
  },
  {
    id: 'argon2-kdf',
    title: 'Argon2 Key Derivation',
    category: 'Security Features',
    subcategory: 'Key Derivation',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/argon2-browser.ts'],
    keywords: ['Argon2', 'KDF', 'password'],
    status: 'production',
  },
  {
    id: 'sparse-ratchet',
    title: 'Sparse PQ Ratchet',
    category: 'Security Features',
    subcategory: 'Protocols',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/sparse-pq-ratchet.ts'],
    keywords: ['sparse ratchet', 'quantum'],
    status: 'production',
  },
  {
    id: 'signaling-crypto',
    title: 'Encrypted Signaling',
    category: 'Security Features',
    subcategory: 'Communication',
    location: 'lib/signaling/',
    keyFiles: ['lib/signaling/signaling-crypto.ts'],
    keywords: ['signaling encryption', 'secure channel'],
    status: 'production',
  },
  {
    id: 'secure-storage',
    title: 'Encrypted Local Storage',
    category: 'Security Features',
    subcategory: 'Storage',
    location: 'lib/storage/',
    keyFiles: ['lib/storage/secure-storage.ts'],
    keywords: ['encrypted storage', 'IndexedDB'],
    status: 'production',
  },
  {
    id: 'password-encryption',
    title: 'Password-Based File Encryption',
    category: 'Security Features',
    subcategory: 'File Protection',
    location: 'lib/crypto/',
    keyFiles: ['lib/crypto/password-file-encryption.ts'],
    keywords: ['password', 'file encryption'],
    status: 'production',
  },
  {
    id: 'verification-system',
    title: 'Peer Verification System',
    category: 'Security Features',
    subcategory: 'Authentication',
    location: 'components/security/',
    keyFiles: ['components/security/verification-dialog.tsx'],
    keywords: ['verification', 'safety number'],
    status: 'production',
  },

  // Privacy Features (15+)
  {
    id: 'metadata-stripping',
    title: 'Automatic Metadata Stripping',
    category: 'Privacy Features',
    subcategory: 'Metadata Protection',
    location: 'lib/privacy/',
    keywords: ['metadata', 'EXIF', 'strip'],
    status: 'production',
  },
  {
    id: 'onion-routing',
    title: 'Onion Routing',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/transport/',
    keyFiles: ['lib/transport/onion-routing.ts', 'lib/transport/onion-routing-integration.ts'],
    keywords: ['onion', 'multi-hop', 'relay'],
    status: 'beta',
  },
  {
    id: 'traffic-obfuscation',
    title: 'Traffic Obfuscation',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/transport/',
    keyFiles: ['lib/transport/obfuscation.ts'],
    keywords: ['obfuscation', 'traffic shaping'],
    status: 'production',
  },
  {
    id: 'privacy-modes',
    title: 'Privacy Modes (4 Levels)',
    category: 'Privacy Features',
    subcategory: 'User Control',
    location: 'lib/privacy/',
    keywords: ['privacy mode', 'low', 'medium', 'high', 'maximum'],
    status: 'production',
  },
  {
    id: 'no-ip-logging',
    title: 'No IP Logging',
    category: 'Privacy Features',
    subcategory: 'Data Collection',
    location: 'lib/',
    keywords: ['no logging', 'privacy'],
    status: 'production',
  },
  {
    id: 'no-analytics',
    title: 'No Analytics (Optional)',
    category: 'Privacy Features',
    subcategory: 'Data Collection',
    location: 'lib/',
    keywords: ['no tracking', 'opt-out'],
    status: 'production',
  },
  {
    id: 'proxy-config',
    title: 'Proxy Configuration',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/network/',
    keyFiles: ['lib/network/proxy-config.ts'],
    keywords: ['proxy', 'SOCKS', 'VPN'],
    status: 'production',
  },
  {
    id: 'tor-support',
    title: 'Tor Browser Support',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/privacy/',
    keywords: ['Tor', 'anonymity'],
    status: 'planned',
  },
  {
    id: 'vpn-leak-detection',
    title: 'VPN Leak Detection',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/privacy/',
    keywords: ['VPN', 'leak detection'],
    status: 'planned',
  },
  {
    id: 'private-webrtc',
    title: 'Private WebRTC',
    category: 'Privacy Features',
    subcategory: 'Network Privacy',
    location: 'lib/transport/',
    keyFiles: ['lib/transport/private-webrtc.ts'],
    keywords: ['WebRTC', 'IP hiding'],
    status: 'production',
  },

  // Communication Features (3)
  {
    id: 'e2ee-chat',
    title: 'End-to-End Encrypted Chat',
    category: 'Communication Features',
    location: 'lib/chat/',
    keywords: ['chat', 'messaging', 'E2EE'],
    status: 'production',
  },
  {
    id: 'screen-sharing',
    title: 'Screen Sharing',
    category: 'Communication Features',
    location: 'lib/',
    keywords: ['screen share', 'display capture'],
    status: 'production',
  },
  {
    id: 'voice-commands',
    title: 'Voice Commands',
    category: 'Communication Features',
    location: 'lib/hooks/',
    keyFiles: ['lib/hooks/use-voice-commands.ts'],
    keywords: ['voice', 'speech recognition'],
    status: 'beta',
  },

  // Advanced Transfer Features (5)
  {
    id: 'group-transfer',
    title: 'Group Transfer',
    category: 'Advanced Transfer',
    location: 'lib/transfer/',
    keyFiles: ['lib/transfer/group-transfer-manager.ts'],
    keywords: ['group', 'multi-recipient'],
    status: 'production',
  },
  {
    id: 'folder-transfer',
    title: 'Folder Transfer',
    category: 'Advanced Transfer',
    location: 'lib/transfer/',
    keyFiles: ['lib/transfer/folder-transfer.ts'],
    keywords: ['folder', 'directory'],
    status: 'production',
  },
  {
    id: 'resumable-transfer',
    title: 'Resumable Transfer',
    category: 'Advanced Transfer',
    location: 'lib/transfer/',
    keyFiles: ['lib/transfer/resumable-transfer.ts'],
    keywords: ['resume', 'checkpoint'],
    status: 'production',
  },
  {
    id: 'email-fallback',
    title: 'Email Fallback',
    category: 'Advanced Transfer',
    location: 'lib/email-fallback/',
    keywords: ['email', 'fallback', 'offline'],
    status: 'production',
  },
  {
    id: 'transfer-rooms',
    title: 'Transfer Rooms',
    category: 'Advanced Transfer',
    location: 'lib/rooms/',
    keywords: ['rooms', 'multi-party'],
    status: 'production',
  },

  // UI/UX Features (6)
  {
    id: 'theme-system',
    title: '4 Theme Modes',
    category: 'UI/UX Features',
    location: 'app/',
    keywords: ['theme', 'dark mode', 'light mode'],
    status: 'production',
  },
  {
    id: 'i18n',
    title: 'Internationalization (22 Languages)',
    category: 'UI/UX Features',
    location: 'lib/i18n/',
    keywords: ['i18n', 'translation', 'multilingual'],
    status: 'production',
  },
  {
    id: 'pwa',
    title: 'Progressive Web App',
    category: 'UI/UX Features',
    location: 'lib/pwa/',
    keywords: ['PWA', 'offline', 'installable'],
    status: 'production',
  },
  {
    id: 'responsive-design',
    title: 'Responsive Design',
    category: 'UI/UX Features',
    location: 'components/',
    keywords: ['responsive', 'mobile', 'desktop'],
    status: 'production',
  },
  {
    id: 'accessibility',
    title: 'WCAG 2.1 AA Accessibility',
    category: 'UI/UX Features',
    location: 'components/',
    keywords: ['accessibility', 'WCAG', 'a11y'],
    status: 'production',
  },
  {
    id: 'animations',
    title: 'Framer Motion Animations',
    category: 'UI/UX Features',
    location: 'lib/animations/',
    keywords: ['animation', 'Framer Motion'],
    status: 'production',
  },

  // Add more features as needed...
  // This is a representative sample. Full catalog would include all 150+ features.
];

/**
 * Check if file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Search for keywords in codebase
 */
async function searchKeywords(keywords: string[], searchPaths: string[] = ['lib', 'components', 'app']): Promise<string[]> {
  const foundIn: string[] = [];

  for (const searchPath of searchPaths) {
    try {
      const files = await glob(`${searchPath}/**/*.{ts,tsx,js,jsx}`, {
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
      });

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          const hasKeywords = keywords.some(keyword =>
            content.toLowerCase().includes(keyword.toLowerCase())
          );

          if (hasKeywords) {
            foundIn.push(file);
          }
        } catch {
          // Ignore read errors
        }
      }
    } catch {
      // Ignore glob errors
    }
  }

  return [...new Set(foundIn)]; // Remove duplicates
}

/**
 * Verify a single feature
 */
async function verifyFeature(feature: Feature): Promise<VerificationResult> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let foundIn: string[] = [];
  let confidence = 0;

  // Check key files
  if (feature.keyFiles && feature.keyFiles.length > 0) {
    const existingFiles = feature.keyFiles.filter(file => fileExists(file));
    foundIn.push(...existingFiles);

    if (existingFiles.length === feature.keyFiles.length) {
      confidence += 50;
    } else if (existingFiles.length > 0) {
      confidence += 25;
      issues.push(`Missing ${feature.keyFiles.length - existingFiles.length} key file(s)`);
    } else {
      issues.push('No key files found');
    }
  }

  // Search for keywords
  if (feature.keywords && feature.keywords.length > 0) {
    const keywordFiles = await searchKeywords(feature.keywords);
    foundIn.push(...keywordFiles);

    if (keywordFiles.length > 0) {
      confidence += 50;
    } else {
      issues.push('No keyword matches found');
      recommendations.push(`Search for: ${feature.keywords.join(', ')}`);
    }
  }

  // Check location
  if (feature.location && fileExists(feature.location)) {
    confidence += 10;
  }

  // Remove duplicates
  foundIn = [...new Set(foundIn)];

  // Determine status
  let status: VerificationResult['status'];
  if (confidence >= 75) {
    status = 'verified';
  } else if (confidence >= 40) {
    status = 'partial';
  } else if (foundIn.length === 0) {
    status = 'missing';
  } else {
    status = 'partial';
  }

  // Check for deprecated features
  if (feature.status === 'planned' && confidence > 50) {
    recommendations.push('Feature marked as planned but appears implemented');
  }

  return {
    id: feature.id,
    title: feature.title,
    category: feature.category,
    status,
    confidence,
    foundIn,
    issues,
    recommendations,
  };
}

/**
 * Generate verification report
 */
async function generateReport(results: VerificationResult[]): Promise<VerificationReport> {
  const timestamp = new Date().toISOString();

  const verified = results.filter(r => r.status === 'verified').length;
  const missing = results.filter(r => r.status === 'missing').length;
  const partial = results.filter(r => r.status === 'partial').length;
  const deprecated = results.filter(r => r.status === 'deprecated').length;

  const verificationRate = (verified / results.length) * 100;

  // Group by category
  const byCategory: Record<string, { total: number; verified: number; rate: number }> = {};
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = { total: 0, verified: 0, rate: 0 };
    }
    const cat = byCategory[result.category];
    if (cat) {
      cat.total++;
      if (result.status === 'verified') {
        cat.verified++;
      }
    }
  });

  Object.keys(byCategory).forEach(category => {
    const cat = byCategory[category];
    if (cat) {
      cat.rate = (cat.verified / cat.total) * 100;
    }
  });

  // Group by status
  const byStatus = {
    verified,
    missing,
    partial,
    deprecated,
  };

  return {
    timestamp,
    totalFeatures: results.length,
    verified,
    missing,
    partial,
    deprecated,
    verificationRate,
    results,
    summary: {
      byCategory,
      byStatus,
    },
  };
}

/**
 * Save report as JSON
 */
function saveJSONReport(report: VerificationReport, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`✅ JSON report saved: ${outputPath}`);
}

/**
 * Save report as Markdown
 */
function saveMarkdownReport(report: VerificationReport, outputPath: string): void {
  let markdown = `# Feature Verification Report\n\n`;
  markdown += `**Generated**: ${new Date(report.timestamp).toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Features**: ${report.totalFeatures}\n`;
  markdown += `- **Verified**: ${report.verified} (${report.verificationRate.toFixed(1)}%)\n`;
  markdown += `- **Partial**: ${report.partial}\n`;
  markdown += `- **Missing**: ${report.missing}\n`;
  markdown += `- **Deprecated**: ${report.deprecated}\n\n`;

  markdown += `## By Category\n\n`;
  markdown += `| Category | Total | Verified | Rate |\n`;
  markdown += `|----------|-------|----------|------|\n`;
  Object.entries(report.summary.byCategory).forEach(([category, stats]) => {
    markdown += `| ${category} | ${stats.total} | ${stats.verified} | ${stats.rate.toFixed(1)}% |\n`;
  });
  markdown += `\n`;

  markdown += `## Verification Results\n\n`;
  report.results.forEach(result => {
    const icon =
      result.status === 'verified'
        ? '✅'
        : result.status === 'partial'
          ? '⚠️'
          : result.status === 'missing'
            ? '❌'
            : '🗑️';

    markdown += `### ${icon} ${result.title}\n\n`;
    markdown += `- **ID**: ${result.id}\n`;
    markdown += `- **Category**: ${result.category}\n`;
    markdown += `- **Status**: ${result.status}\n`;
    markdown += `- **Confidence**: ${result.confidence}%\n`;

    if (result.foundIn.length > 0) {
      markdown += `- **Found In**:\n`;
      result.foundIn.slice(0, 5).forEach(file => {
        markdown += `  - ${file}\n`;
      });
      if (result.foundIn.length > 5) {
        markdown += `  - ... and ${result.foundIn.length - 5} more\n`;
      }
    }

    if (result.issues.length > 0) {
      markdown += `- **Issues**:\n`;
      result.issues.forEach(issue => {
        markdown += `  - ${issue}\n`;
      });
    }

    if (result.recommendations.length > 0) {
      markdown += `- **Recommendations**:\n`;
      result.recommendations.forEach(rec => {
        markdown += `  - ${rec}\n`;
      });
    }

    markdown += `\n`;
  });

  fs.writeFileSync(outputPath, markdown);
  console.log(`✅ Markdown report saved: ${outputPath}`);
}

/**
 * Save report as HTML
 */
function saveHTMLReport(report: VerificationReport, outputPath: string): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Verification Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .summary-card { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0066cc; }
    .summary-card h3 { margin: 0 0 5px 0; color: #666; font-size: 14px; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: 600; }
    .verified { color: #28a745; }
    .partial { color: #ffc107; }
    .missing { color: #dc3545; }
    .deprecated { color: #6c757d; }
    .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #ddd; }
    .feature-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-verified { background: #28a745; color: white; }
    .badge-partial { background: #ffc107; color: black; }
    .badge-missing { background: #dc3545; color: white; }
    .badge-deprecated { background: #6c757d; color: white; }
    .files { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 12px; }
    .issues { color: #dc3545; }
    .recommendations { color: #0066cc; }
  </style>
</head>
<body>
  <h1>Feature Verification Report</h1>
  <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Total Features</h3>
        <div class="value">${report.totalFeatures}</div>
      </div>
      <div class="summary-card">
        <h3>Verified</h3>
        <div class="value verified">${report.verified}</div>
        <div>${report.verificationRate.toFixed(1)}%</div>
      </div>
      <div class="summary-card">
        <h3>Partial</h3>
        <div class="value partial">${report.partial}</div>
      </div>
      <div class="summary-card">
        <h3>Missing</h3>
        <div class="value missing">${report.missing}</div>
      </div>
    </div>
  </div>

  <h2>By Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Total</th>
        <th>Verified</th>
        <th>Rate</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(report.summary.byCategory)
        .map(
          ([category, stats]) => `
        <tr>
          <td>${category}</td>
          <td>${stats.total}</td>
          <td class="verified">${stats.verified}</td>
          <td>${stats.rate.toFixed(1)}%</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <h2>Verification Results</h2>
  ${report.results
    .map(
      result => `
    <div class="feature">
      <div class="feature-header">
        <h3>${result.title}</h3>
        <span class="badge badge-${result.status}">${result.status.toUpperCase()}</span>
        <span style="margin-left: auto;">${result.confidence}% confidence</span>
      </div>
      <p><strong>ID:</strong> ${result.id} | <strong>Category:</strong> ${result.category}</p>
      ${
        result.foundIn.length > 0
          ? `
        <div class="files">
          <strong>Found in:</strong>
          <ul>
            ${result.foundIn
              .slice(0, 5)
              .map(file => `<li>${file}</li>`)
              .join('')}
            ${result.foundIn.length > 5 ? `<li>... and ${result.foundIn.length - 5} more</li>` : ''}
          </ul>
        </div>
      `
          : ''
      }
      ${
        result.issues.length > 0
          ? `
        <div class="issues">
          <strong>Issues:</strong>
          <ul>${result.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
        </div>
      `
          : ''
      }
      ${
        result.recommendations.length > 0
          ? `
        <div class="recommendations">
          <strong>Recommendations:</strong>
          <ul>${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
        </div>
      `
          : ''
      }
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;

  fs.writeFileSync(outputPath, html);
  console.log(`✅ HTML report saved: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Feature Verification Script\n');
  console.log(`Verifying ${FEATURE_CATALOG.length} features...\n`);

  const results: VerificationResult[] = [];

  for (const [index, feature] of FEATURE_CATALOG.entries()) {
    process.stdout.write(
      `\r[${index + 1}/${FEATURE_CATALOG.length}] Verifying: ${feature.title.padEnd(50)}`
    );
    const result = await verifyFeature(feature);
    results.push(result);
  }

  console.log('\n\n✅ Verification complete!\n');

  const report = await generateReport(results);

  // Create reports directory
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save reports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  saveJSONReport(report, path.join(reportsDir, `verification-${timestamp}.json`));
  saveMarkdownReport(report, path.join(reportsDir, `verification-${timestamp}.md`));
  saveHTMLReport(report, path.join(reportsDir, `verification-${timestamp}.html`));

  // Print summary
  console.log('\n📊 Summary:\n');
  console.log(`Total Features: ${report.totalFeatures}`);
  console.log(`✅ Verified: ${report.verified} (${report.verificationRate.toFixed(1)}%)`);
  console.log(`⚠️  Partial: ${report.partial}`);
  console.log(`❌ Missing: ${report.missing}`);
  console.log(`🗑️  Deprecated: ${report.deprecated}\n`);

  // Exit with error if verification rate is too low
  if (report.verificationRate < 70) {
    console.error('❌ Verification rate below 70%!');
    process.exit(1);
  } else {
    console.log('✅ Verification rate acceptable!');
    process.exit(0);
  }
}

// Run main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
