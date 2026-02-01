/**
 * Sample Feature Data for Carousel
 *
 * This file contains curated top features to showcase in the carousel.
 * Based on the comprehensive feature catalog.
 */

import type { Feature } from "./types";

/**
 * Top 30 features for carousel showcase
 * Selected based on impact, uniqueness, and user value
 */
export const topFeatures: Feature[] = [
  // === Core Transfer Features ===
  {
    id: "p2p-webrtc",
    title: "Direct P2P Transfer",
    description: "Lightning-fast peer-to-peer file transfers using WebRTC. No server intermediaries, maximum speed.",
    status: "production",
    complexity: "beginner",
    icon: "zap",
    location: "lib/transfer/p2p-internet.ts",
    tags: ["core", "p2p", "webrtc", "performance"],
  },
  {
    id: "e2e-encryption",
    title: "End-to-End Encryption",
    description: "Military-grade AES-256-GCM encryption. Your files are encrypted before leaving your device.",
    status: "production",
    complexity: "intermediate",
    icon: "shield",
    location: "lib/crypto/file-encryption-pqc.ts",
    tags: ["security", "encryption", "privacy"],
  },
  {
    id: "pqc-encryption",
    title: "Post-Quantum Cryptography",
    description: "Future-proof encryption using Kyber-1024 and Dilithium-5. Protected against quantum computers.",
    status: "production",
    complexity: "advanced",
    icon: "atom",
    location: "lib/crypto/pqc-crypto-lazy.ts",
    tags: ["security", "quantum", "advanced"],
  },

  // === Discovery & Connection ===
  {
    id: "local-discovery",
    title: "Local Network Discovery",
    description: "Automatically find nearby devices on your network. No setup required.",
    status: "production",
    complexity: "beginner",
    icon: "wifi",
    location: "lib/discovery/local-discovery.ts",
    tags: ["discovery", "local", "network"],
  },
  {
    id: "qr-sharing",
    title: "QR Code Sharing",
    description: "Share files instantly by scanning a QR code. Perfect for mobile-to-desktop transfers.",
    status: "production",
    complexity: "beginner",
    icon: "qr-code",
    location: "components/transfer/qr-code-generator.tsx",
    tags: ["sharing", "mobile", "qr"],
  },
  {
    id: "word-codes",
    title: "Word Phrase Codes",
    description: "Human-readable 6-word codes for easy connection. No typing long strings.",
    status: "production",
    complexity: "beginner",
    icon: "text",
    location: "lib/transfer/word-phrase-codes.ts",
    tags: ["ux", "sharing", "codes"],
  },

  // === Advanced Transfer Features ===
  {
    id: "folder-transfer",
    title: "Folder Transfer",
    description: "Transfer entire folders with structure preserved. Supports nested directories.",
    status: "production",
    complexity: "intermediate",
    icon: "folder",
    location: "lib/transfer/folder-transfer.ts",
    tags: ["folders", "bulk", "structure"],
  },
  {
    id: "resumable-transfer",
    title: "Resumable Transfers",
    description: "Resume interrupted transfers automatically. Never lose progress on large files.",
    status: "production",
    complexity: "intermediate",
    icon: "rotate-cw",
    location: "lib/transfer/resumable-transfer.ts",
    tags: ["reliability", "resume", "large-files"],
  },
  {
    id: "group-transfer",
    title: "Group Transfer",
    description: "Send files to multiple recipients simultaneously. One-to-many broadcasting.",
    status: "production",
    complexity: "intermediate",
    icon: "users",
    location: "lib/transfer/group-transfer-manager.ts",
    tags: ["group", "multicast", "collaboration"],
  },

  // === Privacy & Security ===
  {
    id: "onion-routing",
    title: "Onion Routing",
    description: "Multi-layer encryption and routing for maximum privacy. Tor-like anonymity.",
    status: "production",
    complexity: "advanced",
    icon: "layers",
    location: "lib/transport/onion-routing.ts",
    tags: ["privacy", "anonymity", "tor"],
  },
  {
    id: "metadata-stripping",
    title: "Metadata Stripping",
    description: "Automatically remove EXIF and metadata from images. Protect your privacy.",
    status: "production",
    complexity: "intermediate",
    icon: "eye-off",
    location: "lib/hooks/use-metadata-stripper.ts",
    tags: ["privacy", "metadata", "images"],
  },
  {
    id: "password-protection",
    title: "Password Protection",
    description: "Add password protection to individual files. Extra layer of security.",
    status: "production",
    complexity: "beginner",
    icon: "lock",
    location: "lib/crypto/password-file-encryption.ts",
    tags: ["security", "password", "encryption"],
  },

  // === Communication ===
  {
    id: "p2p-chat",
    title: "Encrypted Chat",
    description: "Private text messaging with end-to-end encryption. No servers, no logs.",
    status: "production",
    complexity: "intermediate",
    icon: "message-square",
    location: "lib/chat/chat-manager.ts",
    tags: ["chat", "messaging", "communication"],
  },
  {
    id: "screen-sharing",
    title: "Screen Sharing",
    description: "Share your screen in real-time. Perfect for remote support and presentations.",
    status: "production",
    complexity: "intermediate",
    icon: "monitor",
    location: "lib/hooks/use-screen-share.ts",
    tags: ["screen", "sharing", "collaboration"],
  },
  {
    id: "email-fallback",
    title: "Email Fallback",
    description: "Send files via encrypted email when P2P isn't available. Always connected.",
    status: "production",
    complexity: "intermediate",
    icon: "mail",
    location: "lib/email-fallback/email-manager.ts",
    tags: ["fallback", "email", "reliability"],
  },

  // === User Experience ===
  {
    id: "drag-drop",
    title: "Drag & Drop",
    description: "Simply drag files to share. Intuitive and fast.",
    status: "production",
    complexity: "beginner",
    icon: "move",
    location: "components/ui/drag-drop-zone.tsx",
    tags: ["ux", "interface", "drag-drop"],
  },
  {
    id: "transfer-queue",
    title: "Transfer Queue",
    description: "Queue multiple transfers. Manage them all in one place.",
    status: "production",
    complexity: "beginner",
    icon: "list",
    location: "components/transfer/transfer-queue.tsx",
    tags: ["queue", "management", "ux"],
  },
  {
    id: "progress-tracking",
    title: "Real-time Progress",
    description: "See transfer progress with speed, ETA, and completion percentage.",
    status: "production",
    complexity: "beginner",
    icon: "activity",
    location: "components/transfer/transfer-progress.tsx",
    tags: ["progress", "tracking", "ux"],
  },

  // === Device Management ===
  {
    id: "device-sync",
    title: "Device Synchronization",
    description: "Sync your devices automatically. Keep your files up to date everywhere.",
    status: "beta",
    complexity: "intermediate",
    icon: "refresh-cw",
    location: "lib/storage/my-devices.ts",
    tags: ["sync", "devices", "automation"],
  },
  {
    id: "friend-management",
    title: "Friends List",
    description: "Save trusted contacts. Transfer files with one click.",
    status: "production",
    complexity: "beginner",
    icon: "user-plus",
    location: "lib/storage/friends.ts",
    tags: ["friends", "contacts", "ux"],
  },

  // === Performance ===
  {
    id: "chunked-transfer",
    title: "Chunked Transfer",
    description: "Split large files into chunks for faster, more reliable transfers.",
    status: "production",
    complexity: "advanced",
    icon: "grid",
    location: "lib/transfer/encryption.ts",
    tags: ["performance", "chunks", "optimization"],
  },
  {
    id: "compression",
    title: "Smart Compression",
    description: "Automatic compression for faster transfers. Decompressed transparently.",
    status: "production",
    complexity: "intermediate",
    icon: "package",
    location: "lib/transfer/encryption.ts",
    tags: ["compression", "performance", "optimization"],
  },

  // === Platform Features ===
  {
    id: "pwa",
    title: "Progressive Web App",
    description: "Install as a native app. Works offline with full functionality.",
    status: "production",
    complexity: "beginner",
    icon: "smartphone",
    location: "lib/pwa/install-prompt.ts",
    tags: ["pwa", "mobile", "offline"],
  },
  {
    id: "offline-support",
    title: "Offline Support",
    description: "Full functionality offline on local network. No internet required.",
    status: "production",
    complexity: "intermediate",
    icon: "wifi-off",
    location: "lib/pwa/offline-manager.ts",
    tags: ["offline", "local", "pwa"],
  },

  // === Accessibility ===
  {
    id: "i18n",
    title: "Internationalization",
    description: "Support for 10+ languages. RTL support included.",
    status: "production",
    complexity: "beginner",
    icon: "globe",
    location: "lib/i18n/language-context.tsx",
    tags: ["i18n", "languages", "accessibility"],
  },
  {
    id: "high-contrast",
    title: "High Contrast Mode",
    description: "WCAG AAA compliant high contrast theme. Maximum accessibility.",
    status: "production",
    complexity: "beginner",
    icon: "contrast",
    location: "app/globals.css",
    tags: ["accessibility", "a11y", "contrast"],
  },
  {
    id: "keyboard-nav",
    title: "Keyboard Navigation",
    description: "Full keyboard support. Navigate without a mouse.",
    status: "production",
    complexity: "beginner",
    icon: "keyboard",
    location: "components/transfer/transfer-card.tsx",
    tags: ["accessibility", "keyboard", "a11y"],
  },

  // === Advanced Security ===
  {
    id: "digital-signatures",
    title: "Digital Signatures",
    description: "Verify file integrity with cryptographic signatures. Tamper-proof transfers.",
    status: "production",
    complexity: "advanced",
    icon: "file-signature",
    location: "lib/crypto/digital-signatures.ts",
    tags: ["security", "signatures", "verification"],
  },
  {
    id: "peer-verification",
    title: "Peer Verification",
    description: "Verify recipient identity with safety numbers. Prevent MITM attacks.",
    status: "production",
    complexity: "advanced",
    icon: "shield-check",
    location: "lib/crypto/peer-authentication.ts",
    tags: ["security", "verification", "mitm"],
  },
  {
    id: "secure-storage",
    title: "Encrypted Storage",
    description: "Locally stored data is encrypted. Protected even if device is compromised.",
    status: "production",
    complexity: "intermediate",
    icon: "database",
    location: "lib/storage/secure-storage.ts",
    tags: ["security", "storage", "encryption"],
  },
];

/**
 * Features grouped by category for carousel
 */
export const featuredCategories = [
  {
    id: "core",
    name: "Core Features",
    features: topFeatures.filter((f) => f.tags?.includes("core")),
  },
  {
    id: "security",
    name: "Security & Privacy",
    features: topFeatures.filter(
      (f) => f.tags?.includes("security") || f.tags?.includes("privacy")
    ),
  },
  {
    id: "collaboration",
    name: "Communication",
    features: topFeatures.filter(
      (f) =>
        f.tags?.includes("chat") ||
        f.tags?.includes("sharing") ||
        f.tags?.includes("collaboration")
    ),
  },
  {
    id: "ux",
    name: "User Experience",
    features: topFeatures.filter((f) => f.tags?.includes("ux")),
  },
];

/**
 * Get random selection of features
 */
export function getRandomFeatures(count: number = 20): Feature[] {
  const shuffled = [...topFeatures].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, topFeatures.length));
}

/**
 * Get features by status
 */
export function getFeaturesByStatus(status: Feature["status"]): Feature[] {
  return topFeatures.filter((f) => f.status === status);
}

/**
 * Get features by tag
 */
export function getFeaturesByTag(tag: string): Feature[] {
  return topFeatures.filter((f) => f.tags?.includes(tag));
}
