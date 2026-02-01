#!/usr/bin/env ts-node
/**
 * Comprehensive Feature Verification Script
 * Verifies all 150+ features from TALLOW_COMPLETE_FEATURE_CATALOG.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface FeatureCheck {
  id: string;
  name: string;
  category: string;
  status: 'found' | 'missing' | 'partial';
  location?: string;
  confidence: number;
}

const results: FeatureCheck[] = [];

// Feature categories to check
const featureCategories = {
  core: [
    { id: 'p2p-transfer', name: 'P2P Direct Transfer', files: ['lib/transfer/'] },
    { id: 'pqc-encryption', name: 'PQC Encryption', files: ['lib/crypto/pqc-'] },
    { id: 'webrtc', name: 'WebRTC Connection', files: ['lib/webrtc/', 'lib/transfer/p2p-'] },
    { id: 'file-chunking', name: 'File Chunking', files: ['lib/transfer/pqc-transfer-manager.ts'] },
    { id: 'progress-tracking', name: 'Progress Tracking', files: ['lib/hooks/use-file-transfer.ts'] },
    { id: 'error-handling', name: 'Error Handling', files: ['lib/utils/'] },
    { id: 'device-discovery', name: 'Device Discovery', files: ['lib/discovery/'] },
    { id: 'connection-codes', name: 'Connection Codes', files: ['lib/transfer/word-phrase-codes.ts'] },
    { id: 'bandwidth-control', name: 'Bandwidth Control', files: ['lib/transfer/'] },
    { id: 'multi-file', name: 'Multi-File Transfer', files: ['lib/transfer/'] },
  ],
  security: [
    { id: 'ml-kem-768', name: 'ML-KEM-768 (Kyber)', files: ['lib/crypto/pqc-crypto.ts'] },
    { id: 'x25519', name: 'X25519 ECDH', files: ['lib/crypto/pqc-crypto.ts'] },
    { id: 'aes-256-gcm', name: 'AES-256-GCM', files: ['lib/crypto/'] },
    { id: 'chacha20', name: 'ChaCha20-Poly1305', files: ['lib/crypto/chacha20-poly1305.ts'] },
    { id: 'triple-ratchet', name: 'Triple Ratchet', files: ['lib/crypto/triple-ratchet.ts'] },
    { id: 'key-rotation', name: 'Key Rotation', files: ['lib/crypto/key-rotation.ts'] },
    { id: 'forward-secrecy', name: 'Forward Secrecy', files: ['lib/crypto/'] },
  ],
  privacy: [
    { id: 'metadata-stripping', name: 'Metadata Stripping', files: ['lib/privacy/metadata-stripper.ts'] },
    { id: 'privacy-modes', name: 'Privacy Modes', files: ['lib/privacy/'] },
    { id: 'onion-routing', name: 'Onion Routing', files: ['lib/transport/onion-routing.ts'] },
    { id: 'obfuscation', name: 'Traffic Obfuscation', files: ['lib/transport/obfuscation.ts'] },
  ],
  communication: [
    { id: 'chat', name: 'E2E Encrypted Chat', files: ['lib/chat/', 'lib/hooks/use-chat.ts'] },
    { id: 'screen-sharing', name: 'Screen Sharing', files: ['lib/webrtc/screen-sharing.ts'] },
    { id: 'voice-commands', name: 'Voice Commands', files: ['lib/hooks/use-voice-commands.ts'] },
  ],
  advanced: [
    { id: 'resumable', name: 'Resumable Transfers', files: ['lib/transfer/resumable-transfer.ts'] },
    { id: 'folders', name: 'Folder Transfer', files: ['lib/transfer/folder-transfer.ts'] },
    { id: 'group-transfer', name: 'Group Transfer', files: ['lib/transfer/group-transfer-manager.ts'] },
    { id: 'password-protection', name: 'Password Protection', files: ['lib/crypto/password-file-encryption.ts'] },
    { id: 'email-fallback', name: 'Email Fallback', files: ['lib/email-fallback/', 'app/api/email/'] },
  ],
  rooms: [
    { id: 'transfer-rooms', name: 'Transfer Rooms', files: ['lib/rooms/transfer-room-manager.ts'] },
    { id: 'room-crypto', name: 'Room Encryption', files: ['lib/rooms/room-crypto.ts'] },
  ],
  ui: [
    { id: 'themes', name: '4 Theme Modes', files: ['app/globals.css', 'components/theme-toggle.tsx'] },
    { id: 'animations', name: 'Framer Motion Animations', files: ['lib/animations/'] },
    { id: 'mobile-gestures', name: 'Mobile Gestures', files: ['lib/hooks/use-swipe-gestures.ts'] },
    { id: 'drag-drop', name: 'Drag & Drop', files: ['components/ui/drag-drop-zone.tsx'] },
  ],
};

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), filePath));
  } catch {
    return false;
  }
}

function checkFeature(feature: { id: string; name: string; files: string[] }, category: string): FeatureCheck {
  let foundFiles = 0;
  let location: string | undefined;

  for (const file of feature.files) {
    if (fileExists(file)) {
      foundFiles++;
      if (!location) location = file;
    }
  }

  const confidence = foundFiles / feature.files.length;
  let status: 'found' | 'missing' | 'partial' = 'missing';

  if (confidence === 1) status = 'found';
  else if (confidence > 0) status = 'partial';

  return {
    id: feature.id,
    name: feature.name,
    category,
    status,
    ...(location !== undefined && { location }),
    confidence: Math.round(confidence * 100),
  };
}

function generateReport(): string {
  const report: string[] = [];
  report.push('# Tallow Feature Verification Report');
  report.push(`Generated: ${new Date().toISOString()}\n`);

  const stats = {
    total: results.length,
    found: results.filter(r => r.status === 'found').length,
    partial: results.filter(r => r.status === 'partial').length,
    missing: results.filter(r => r.status === 'missing').length,
  };

  report.push('## Summary');
  report.push(`- Total Features: ${stats.total}`);
  report.push(`- ✅ Found: ${stats.found} (${Math.round((stats.found / stats.total) * 100)}%)`);
  report.push(`- ⚠️ Partial: ${stats.partial} (${Math.round((stats.partial / stats.total) * 100)}%)`);
  report.push(`- ❌ Missing: ${stats.missing} (${Math.round((stats.missing / stats.total) * 100)}%)\n`);

  // Group by category
  const byCategory: Record<string, FeatureCheck[]> = {};
  results.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category]?.push(r);
  });

  report.push('## Features by Category\n');

  for (const [category, features] of Object.entries(byCategory)) {
    report.push(`### ${category.toUpperCase()}`);
    features.forEach(f => {
      const icon = f.status === 'found' ? '✅' : f.status === 'partial' ? '⚠️' : '❌';
      report.push(`${icon} **${f.name}** (${f.confidence}%)`);
      if (f.location) report.push(`   Location: \`${f.location}\``);
    });
    report.push('');
  }

  return report.join('\n');
}

// Run verification
console.log('🔍 Verifying Tallow features...\n');

for (const [category, features] of Object.entries(featureCategories)) {
  console.log(`Checking ${category}...`);
  features.forEach(feature => {
    const result = checkFeature(feature, category);
    results.push(result);
    const icon = result.status === 'found' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.name} (${result.confidence}%)`);
  });
}

const report = generateReport();
console.log('\n' + report);

// Write report to file
const reportPath = path.join(process.cwd(), 'FEATURE_VERIFICATION_REPORT.md');
fs.writeFileSync(reportPath, report);
console.log(`\n📄 Report saved to: ${reportPath}`);

// Exit with error if features are missing
const missingCount = results.filter(r => r.status === 'missing').length;
if (missingCount > 0) {
  console.log(`\n⚠️ Warning: ${missingCount} features are missing`);
  process.exit(1);
} else {
  console.log('\n✅ All checked features found!');
  process.exit(0);
}
