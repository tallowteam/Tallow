'use client';

import { useRef } from 'react';
import Link from "next/link";
import { motion, useInView } from 'framer-motion';
import {
    Shield, Lock, Key, Eye, Fingerprint, Layers, Radio, Globe,
    Database, Zap, Award, CheckCircle2,
    Code2,
    Binary, Hash, KeyRound, ShieldCheck, RefreshCw,
    MemoryStick, HardDrive, Trash2, Clock, Activity,
    ArrowRight, Sparkles, ExternalLink
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};


const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    }
};

// ============================================================================
// Animated Section Component
// ============================================================================

function AnimatedSection({
    children,
    className = '',
    delay = 0
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeInUp}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// Bento Card Component
// ============================================================================

function BentoCard({
    icon: Icon,
    title,
    description,
    status,
    statusColor,
    className = '',
    delay = 0,
    size = 'default'
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    status?: string;
    statusColor?: string;
    className?: string;
    delay?: number;
    size?: 'default' | 'large' | 'wide';
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const sizeClasses = {
        default: '',
        large: 'md:col-span-2 md:row-span-2',
        wide: 'md:col-span-2',
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={`group relative overflow-hidden rounded-2xl bg-[#111110] border border-[#262626] p-6 md:p-8 transition-all duration-500 hover:border-[#444440] hover:bg-[#161614] ${sizeClasses[size]} ${className}`}
        >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
            </div>

            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#fefefc]/30 to-[#888880]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon with glow */}
            <div className="relative mb-4 flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center group-hover:border-[#444440] group-hover:shadow-[0_0_20px_rgba(254,254,252,0.05)] transition-all duration-500">
                    <Icon className="w-6 h-6 text-[#fefefc] group-hover:scale-110 transition-transform duration-300" />
                </div>
                {status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor || 'bg-white/10 text-[#fefefc]'}`}>
                        {status}
                    </span>
                )}
            </div>

            <h3 className="text-lg md:text-xl font-semibold text-[#fefefc] mb-2 group-hover:text-white transition-colors duration-300">
                {title}
            </h3>
            <p className="text-[#888880] text-sm md:text-base leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}

// ============================================================================
// Algorithm Card Component
// ============================================================================

function AlgorithmCard({
    icon: Icon,
    title,
    category,
    specs,
    useCase,
    notes,
    delay = 0
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    category: string;
    specs: Record<string, string>;
    useCase: string;
    notes: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-2xl bg-[#111110] border border-[#262626] p-6 transition-all duration-500 hover:border-[#444440]"
        >
            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a1a18] border border-[#262626] flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(254,254,252,0.05)] transition-all duration-500 shrink-0">
                    <Icon className="w-5 h-5 text-[#fefefc]" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-[#fefefc] group-hover:text-white transition-colors">{title}</h3>
                    <p className="text-xs text-[#888880]">{category}</p>
                </div>
            </div>

            {/* Specs */}
            <div className="bg-[#1a1a18] rounded-lg p-3 mb-4 space-y-2 border border-[#262626]">
                <p className="text-xs font-medium text-[#888880] uppercase tracking-wider">Specifications</p>
                {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                        <span className="text-[#888880] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="font-mono text-xs text-[#fefefc]">{value}</span>
                    </div>
                ))}
            </div>

            {/* Use Case */}
            <div className="mb-3">
                <p className="text-xs font-medium text-[#888880] uppercase tracking-wider mb-1">Use Case</p>
                <p className="text-sm text-[#aaaaaa]">{useCase}</p>
            </div>

            {/* Notes */}
            <div className="pt-3 border-t border-[#262626]">
                <p className="text-xs text-[#888880] italic">{notes}</p>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Protocol Card Component
// ============================================================================

function ProtocolCard({
    icon: Icon,
    title,
    subtitle,
    description,
    securityProperties,
    implementation,
    delay = 0
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle: string;
    description: string;
    securityProperties: string[];
    implementation: Record<string, string>;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-2xl bg-[#111110] border border-[#262626] p-6 md:p-8 transition-all duration-500 hover:border-[#444440]"
        >
            {/* Gradient background on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
            </div>

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-white/5 border border-[#333330] flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(254,254,252,0.05)] transition-all duration-500 shrink-0">
                    <Icon className="w-7 h-7 text-[#fefefc]" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-[#fefefc] mb-1">{title}</h3>
                    <p className="text-sm font-medium text-[#888880]">{subtitle}</p>
                </div>
            </div>

            <p className="text-[#aaaaaa] mb-6">{description}</p>

            {/* Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Security Properties */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#888880] mb-3">Security Properties</h4>
                    <ul className="space-y-2">
                        {securityProperties.map((prop, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#fefefc]" />
                                <span className="text-[#aaaaaa]">{prop}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Implementation */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#888880] mb-3">Implementation</h4>
                    <div className="space-y-3">
                        {Object.entries(implementation).map(([key, value]) => (
                            <div key={key}>
                                <p className="text-xs text-[#888880] uppercase tracking-wider mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-sm font-mono bg-[#1a1a18] text-[#fefefc] px-3 py-1.5 rounded border border-[#262626]">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Security Audit Badges Data
// ============================================================================

const auditBadges = [
    {
        icon: ShieldCheck,
        title: "Zero Vulnerabilities",
        status: "PASS",
        desc: "npm audit: 0 vulnerabilities across 423 packages",
        statusColor: "bg-white/10 text-[#fefefc]"
    },
    {
        icon: Award,
        title: "Post-Quantum Ready",
        status: "CERTIFIED",
        desc: "NIST ML-KEM-768 (Kyber) implementation",
        statusColor: "bg-white/10 text-[#fefefc]"
    },
    {
        icon: Code2,
        title: "Open Source",
        status: "PUBLIC",
        desc: "All cryptographic code available for audit on GitHub",
        statusColor: "bg-white/10 text-[#888880]"
    },
    {
        icon: CheckCircle2,
        title: "Security Audit",
        status: "JAN 2026",
        desc: "Comprehensive security testing completed",
        statusColor: "bg-white/10 text-[#fefefc]"
    },
];

// ============================================================================
// Encryption Suite Data
// ============================================================================

const encryptionSuite = [
    {
        icon: Key,
        title: "ML-KEM-768 (Kyber)",
        category: "Post-Quantum KEM",
        specs: {
            keySize: "1184 bytes public, 2400 bytes private",
            security: "NIST Level 3 (~AES-192)",
            performance: "~0.5ms encaps, ~0.6ms decaps"
        },
        useCase: "Post-quantum key encapsulation for hybrid key exchange",
        notes: "NIST-standardized lattice-based cryptography resistant to quantum attacks"
    },
    {
        icon: KeyRound,
        title: "X25519",
        category: "Elliptic Curve Key Exchange",
        specs: {
            keySize: "32 bytes public/private",
            security: "~128-bit security level",
            performance: "~0.1ms key generation"
        },
        useCase: "Classical ECDH component in hybrid key exchange",
        notes: "Curve25519-based, constant-time implementation resistant to side-channel attacks"
    },
    {
        icon: Lock,
        title: "AES-256-GCM",
        category: "Authenticated Encryption",
        specs: {
            keySize: "256 bits (32 bytes)",
            nonceSize: "96 bits (12 bytes)",
            tagSize: "128 bits (16 bytes)"
        },
        useCase: "Primary symmetric encryption for file data chunks",
        notes: "Hardware-accelerated on most platforms, provides confidentiality and authenticity"
    },
    {
        icon: Zap,
        title: "ChaCha20-Poly1305",
        category: "Stream Cipher AEAD",
        specs: {
            keySize: "256 bits (32 bytes)",
            nonceSize: "96 bits (12 bytes)",
            performance: "~3 GB/s software"
        },
        useCase: "Alternative cipher for environments without AES acceleration",
        notes: "Constant-time software implementation, excellent for mobile devices"
    },
    {
        icon: Hash,
        title: "SHA-256",
        category: "Cryptographic Hash",
        specs: {
            outputSize: "256 bits (32 bytes)",
            blockSize: "512 bits (64 bytes)",
            performance: "~500 MB/s"
        },
        useCase: "File integrity verification, key derivation, digital signatures",
        notes: "NIST-approved, collision-resistant hash function"
    },
    {
        icon: Binary,
        title: "HKDF-SHA-256",
        category: "Key Derivation Function",
        specs: {
            algorithm: "HMAC-based Extract-and-Expand",
            outputSize: "Configurable (typically 32 bytes)",
            rounds: "Single-pass"
        },
        useCase: "Deriving session keys, chain keys, and message keys from master secrets",
        notes: "Formally analyzed KDF with perfect forward secrecy properties"
    },
];

// ============================================================================
// Advanced Protocols Data
// ============================================================================

const advancedProtocols = [
    {
        icon: Layers,
        title: "Triple Ratchet Protocol",
        subtitle: "Hybrid Double + Sparse PQ Ratchet",
        description: "Combines classical Double Ratchet (X25519) with Sparse PQ Ratchet (ML-KEM-768) for forward secrecy and post-quantum security",
        securityProperties: [
            "Forward secrecy: Past messages secure even if current key compromised",
            "Post-compromise security: Future messages secure after key rotation",
            "Post-quantum security: Resistant to quantum computer attacks",
            "Out-of-order message handling with skipped key storage"
        ],
        implementation: {
            ratchetInterval: "Every message for DH, every 10 messages for PQ",
            keyRotation: "Automatic chain key derivation per message",
            storage: "Max 1000 skipped keys in memory"
        }
    },
    {
        icon: RefreshCw,
        title: "Sparse PQ Ratchet",
        subtitle: "Continuous Post-Quantum Key Agreement",
        description: "Implements Signal's ML-KEM Braid specification for bandwidth-efficient post-quantum ratcheting",
        securityProperties: [
            "Periodic post-quantum key exchanges (every 10 messages)",
            "Epoch-based security: Quantum security refreshed regularly",
            "Bandwidth optimized: Only occasional PQ operations",
            "Hybrid with classical ratchet for backwards compatibility"
        ],
        implementation: {
            epochThreshold: "10 messages or 5 minutes",
            kemAlgorithm: "ML-KEM-768 (NIST-standardized Kyber)",
            epochStorage: "Current epoch + pending inbound/outbound KEMs"
        }
    },
    {
        icon: Fingerprint,
        title: "Signed Prekeys Protocol",
        subtitle: "Identity-Bound Key Exchange",
        description: "Long-term identity keys sign ephemeral prekeys to prevent impersonation and ensure authenticated key exchange",
        securityProperties: [
            "Identity binding: Prekeys cryptographically tied to user identity",
            "Impersonation prevention: Signature verification required",
            "Key rotation: Prekeys refreshed periodically",
            "Deniability: Session keys derived from signed prekeys"
        ],
        implementation: {
            signatureAlgorithm: "Ed25519",
            prekeyLifetime: "7 days",
            prekeyCount: "100 prekeys generated per batch"
        }
    },
    {
        icon: CheckCircle2,
        title: "SAS Verification Protocol",
        subtitle: "Man-in-the-Middle Protection",
        description: "Short Authentication String allows out-of-band verification of shared secret to detect MITM attacks",
        securityProperties: [
            "MITM detection: Compare codes via independent channel",
            "Human-friendly: Emoji or memorable word sequences",
            "Collision resistance: 1 in 1 million chance of false match",
            "Constant-time comparison: Side-channel resistant"
        ],
        implementation: {
            wordCount: "3 words from 64-word dictionary",
            emojiOption: "Available for visual verification",
            numericOption: "6-digit code alternative"
        }
    },
];

// ============================================================================
// Secure Storage Features
// ============================================================================

const secureStorageFeatures = [
    {
        icon: Database,
        title: "Encrypted LocalStorage",
        desc: "All sensitive data encrypted with AES-256-GCM before storage. Master key stored in non-extractable IndexedDB CryptoKey."
    },
    {
        icon: KeyRound,
        title: "Secure Key Management",
        desc: "Master encryption keys stored as non-extractable CryptoKey objects. Keys never accessible to JavaScript, only WebCrypto API."
    },
    {
        icon: MemoryStick,
        title: "Memory Protection",
        desc: "Sensitive data wiped from memory using multi-pass overwrite (random, zeros, 0xFF, zeros). Automatic cleanup on session end."
    },
    {
        icon: Trash2,
        title: "Secure Deletion",
        desc: "Three-pass secure wipe for all cryptographic material. Ephemeral keys automatically deleted after configurable lifetime."
    },
    {
        icon: HardDrive,
        title: "Temp File Storage",
        desc: "Temporary files encrypted during transfer, automatically purged after completion or timeout."
    },
];

// ============================================================================
// Memory Security Features
// ============================================================================

const memorySecurityFeatures = [
    {
        icon: MemoryStick,
        title: "Sensitive Data Handling",
        desc: "All cryptographic keys and secrets wrapped in secure containers with automatic lifecycle management and disposal tracking."
    },
    {
        icon: Trash2,
        title: "Buffer Clearing",
        desc: "Multi-pass memory wiping (random -> zero -> 0xFF -> zero) for all sensitive buffers. Cryptographically secure random overwrite pass."
    },
    {
        icon: ShieldCheck,
        title: "Stack Protection",
        desc: "Stack canaries detect buffer overflows. Memory pool with secure allocation/deallocation tracking prevents leaks."
    },
    {
        icon: Eye,
        title: "Side-Channel Resistance",
        desc: "Constant-time comparisons for all security-critical operations. Timing-safe equality checks prevent timing attacks."
    },
    {
        icon: Activity,
        title: "Heap Inspection Detection",
        desc: "Monitors for debugger attachment and heap inspection. Emergency wipe triggered if suspicious activity detected."
    },
    {
        icon: Clock,
        title: "Memory Pressure Monitoring",
        desc: "Tracks JavaScript heap usage. Triggers cleanup and garbage collection suggestions under high memory pressure."
    },
];

// ============================================================================
// Compliance & Standards
// ============================================================================

const complianceStandards = [
    {
        name: "NIST Post-Quantum Cryptography",
        standard: "ML-KEM-768 (FIPS 203)",
        status: "Compliant",
        desc: "Implements NIST-standardized Module-Lattice-Based Key-Encapsulation Mechanism"
    },
    {
        name: "OWASP Security Practices",
        standard: "Top 10 2021",
        status: "Aligned",
        desc: "Follows OWASP guidelines for cryptographic storage, authentication, and session management"
    },
    {
        name: "Web Crypto API Standards",
        standard: "W3C Recommendation",
        status: "Compliant",
        desc: "Uses standardized WebCrypto API for all cryptographic operations"
    },
    {
        name: "Signal Protocol Specification",
        standard: "Double Ratchet + X3DH",
        status: "Adapted",
        desc: "Based on Signal's proven Double Ratchet and Triple Ratchet specifications"
    },
];

// ============================================================================
// Protocol Stack
// ============================================================================

const protocols = [
    { name: "Key Exchange", value: "ML-KEM-768 + X25519" },
    { name: "Symmetric Encryption", value: "AES-256-GCM / ChaCha20-Poly1305" },
    { name: "Key Derivation", value: "HKDF-SHA-256" },
    { name: "Hashing", value: "SHA-256" },
    { name: "Digital Signatures", value: "Ed25519" },
    { name: "Password KDF", value: "PBKDF2-SHA-256 (600k iterations)" },
    { name: "Forward Secrecy", value: "Triple Ratchet + Sparse PQ Ratchet" },
    { name: "Authentication", value: "Signed Prekeys + SAS" },
    { name: "Transport", value: "WebRTC (DTLS-SRTP)" },
    { name: "Signaling", value: "Encrypted WebSocket" },
];

// ============================================================================
// Main Component
// ============================================================================

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-[#0a0a08]">
            <SiteNav />

            {/* Hero Section */}
            <section className="relative min-h-[70vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/[0.01] rounded-full blur-[100px]" />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(rgba(254,254,252,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(254,254,252,0.02) 1px, transparent 1px)',
                        backgroundSize: '64px 64px'
                    }} />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-[#333330] mb-8"
                        >
                            <Sparkles className="w-4 h-4 text-[#fefefc]" />
                            <span className="text-sm font-medium text-[#fefefc]">Post-Quantum Secure</span>
                        </motion.div>

                        {/* Icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="w-20 h-20 rounded-2xl bg-[#fefefc] flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(254,254,252,0.15)]"
                        >
                            <Shield className="w-10 h-10 text-[#0a0a08]" />
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-5xl md:text-7xl font-bold text-[#fefefc] mb-6 tracking-tight"
                        >
                            Security
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-xl md:text-2xl text-[#888880] max-w-2xl mx-auto mb-10 leading-relaxed"
                        >
                            Military-grade encryption with post-quantum protection.
                            Your files are secure against both current and future threats.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap items-center justify-center gap-4"
                        >
                            <Link
                                href="/app"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#fefefc] text-[#0a0a08] font-semibold rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(254,254,252,0.1)] hover:shadow-[0_0_40px_rgba(254,254,252,0.2)]"
                            >
                                Start Secure Transfer
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="https://github.com/tallow"
                                target="_blank"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#111110] text-[#fefefc] font-semibold rounded-full border border-[#262626] hover:border-[#444440] transition-all duration-300"
                            >
                                View Source
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Security Audit Badges */}
            <section className="py-20 border-t border-[#262626]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Security Certifications
                            </h2>
                            <p className="text-lg text-[#888880] max-w-2xl mx-auto">
                                Tallow undergoes continuous security testing. All cryptographic implementations are open source.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {auditBadges.map((badge, i) => (
                                <BentoCard
                                    key={i}
                                    icon={badge.icon}
                                    title={badge.title}
                                    description={badge.desc}
                                    status={badge.status}
                                    statusColor={badge.statusColor}
                                    delay={i * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How We Protect You - Bento Grid */}
            <section className="py-20 bg-[#0d0d0c]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                How We Protect You
                            </h2>
                            <p className="text-lg text-[#888880] max-w-2xl mx-auto">
                                Multiple layers of security ensure your files remain private and secure.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <BentoCard
                                icon={Key}
                                title="Post-Quantum Encryption"
                                description="ML-KEM-768 (Kyber) + X25519 hybrid key exchange protects against both classical and quantum computing attacks."
                                delay={0}
                                size="wide"
                            />
                            <BentoCard
                                icon={Lock}
                                title="AES-256-GCM"
                                description="All file data is encrypted with AES-256-GCM authenticated encryption. Each chunk has its own nonce."
                                delay={0.1}
                            />
                            <BentoCard
                                icon={Layers}
                                title="Triple Ratchet"
                                description="Forward secrecy through continuous key rotation. Compromising one key cannot decrypt past or future messages."
                                delay={0.2}
                            />
                            <BentoCard
                                icon={Fingerprint}
                                title="SAS Verification"
                                description="Short Authentication String verification prevents man-in-the-middle attacks with emoji or word codes."
                                delay={0.3}
                            />
                            <BentoCard
                                icon={Eye}
                                title="Traffic Obfuscation"
                                description="Optional padding and decoy traffic makes file sizes and transfer patterns undetectable."
                                delay={0.4}
                            />
                            <BentoCard
                                icon={Radio}
                                title="Onion Routing"
                                description="Multi-hop encrypted routing hides true source and destination from network observers."
                                delay={0.5}
                            />
                            <BentoCard
                                icon={Globe}
                                title="Zero Knowledge"
                                description="Our servers never see your files, keys, or metadata. All encryption happens client-side."
                                delay={0.6}
                                size="wide"
                            />
                            <BentoCard
                                icon={Shield}
                                title="Signed Prekeys"
                                description="Identity-bound signed prekeys ensure you always connect to the intended recipient."
                                delay={0.7}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Encryption Suite */}
            <section className="py-20 border-t border-[#262626]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Complete Encryption Suite
                            </h2>
                            <p className="text-lg text-[#888880] max-w-3xl mx-auto">
                                Six battle-tested cryptographic algorithms working together to protect your data.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {encryptionSuite.map((algo, i) => (
                                <AlgorithmCard
                                    key={i}
                                    icon={algo.icon}
                                    title={algo.title}
                                    category={algo.category}
                                    specs={algo.specs}
                                    useCase={algo.useCase}
                                    notes={algo.notes}
                                    delay={i * 0.08}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Advanced Protocols */}
            <section className="py-20 bg-[#0d0d0c]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Advanced Cryptographic Protocols
                            </h2>
                            <p className="text-lg text-[#888880] max-w-3xl mx-auto">
                                State-of-the-art protocols providing forward secrecy, post-quantum security, and authenticated key exchange.
                            </p>
                        </AnimatedSection>

                        <div className="space-y-6">
                            {advancedProtocols.map((protocol, i) => (
                                <ProtocolCard
                                    key={i}
                                    icon={protocol.icon}
                                    title={protocol.title}
                                    subtitle={protocol.subtitle}
                                    description={protocol.description}
                                    securityProperties={protocol.securityProperties}
                                    implementation={protocol.implementation}
                                    delay={i * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Secure Storage */}
            <section className="py-20 border-t border-[#262626]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Secure Storage Architecture
                            </h2>
                            <p className="text-lg text-[#888880] max-w-3xl mx-auto">
                                Multi-layered storage security ensures sensitive data remains protected at rest.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {secureStorageFeatures.map((feature, i) => (
                                <BentoCard
                                    key={i}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.desc}
                                    delay={i * 0.08}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Memory Security */}
            <section className="py-20 bg-[#0d0d0c]">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Memory Security
                            </h2>
                            <p className="text-lg text-[#888880] max-w-3xl mx-auto">
                                Advanced memory protection prevents key leakage through memory dumps and side-channel attacks.
                            </p>
                        </AnimatedSection>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {memorySecurityFeatures.map((feature, i) => (
                                <BentoCard
                                    key={i}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.desc}
                                    delay={i * 0.08}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Protocol Stack */}
            <section className="py-20 border-t border-[#262626]">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Cryptographic Protocol Stack
                            </h2>
                        </AnimatedSection>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                            className="space-y-3"
                        >
                            {protocols.map((protocol, i) => (
                                <motion.div
                                    key={i}
                                    variants={fadeInUp}
                                    className="group flex items-center justify-between p-5 rounded-xl bg-[#111110] border border-[#262626] hover:border-[#444440] transition-all duration-300"
                                >
                                    <span className="font-medium text-[#fefefc] group-hover:text-white transition-colors">{protocol.name}</span>
                                    <span className="text-[#888880] font-mono text-sm">{protocol.value}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Compliance & Standards */}
            <section className="py-20 bg-[#0d0d0c]">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <AnimatedSection className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Compliance & Standards
                            </h2>
                            <p className="text-lg text-[#888880] max-w-3xl mx-auto">
                                Tallow adheres to internationally recognized cryptographic standards.
                            </p>
                        </AnimatedSection>

                        <div className="space-y-4">
                            {complianceStandards.map((standard, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-[#111110] border border-[#262626] hover:border-[#444440] transition-all duration-300"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-[#fefefc]">{standard.name}</h3>
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-white/10 text-[#fefefc]">
                                                {standard.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#888880]">{standard.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm text-[#888880]">{standard.standard}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 border-t border-[#262626]">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-[#fefefc] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(254,254,252,0.1)]">
                                <Lock className="w-8 h-8 text-[#0a0a08]" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] mb-4">
                                Ready to Transfer Securely?
                            </h2>
                            <p className="text-lg text-[#888880] mb-8">
                                Experience military-grade encryption with post-quantum protection. Your files, your privacy.
                            </p>
                            <Link
                                href="/app"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#fefefc] text-[#0a0a08] font-semibold rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(254,254,252,0.1)] hover:shadow-[0_0_50px_rgba(254,254,252,0.2)] text-lg"
                            >
                                Start Secure Transfer
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#262626] py-12 bg-[#0a0a08]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link href="/" className="text-xl tracking-tight lowercase font-serif text-[#fefefc]">
                            tallow
                        </Link>
                        <div className="flex items-center gap-6">
                            <Link href="/privacy" className="text-xs font-medium uppercase tracking-widest text-[#888880] hover:text-[#fefefc] transition-colors">Privacy</Link>
                            <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-[#fefefc]">Security</Link>
                            <Link href="/terms" className="text-xs font-medium uppercase tracking-widest text-[#888880] hover:text-[#fefefc] transition-colors">Terms</Link>
                        </div>
                        <p className="text-sm text-[#888880]">Open source - Privacy first</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
