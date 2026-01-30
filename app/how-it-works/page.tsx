"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Download,
  Wifi,
  Globe,
  ArrowRight,
  Shield,
  Key,
  Lock,
  Radio,
  Server,
  CheckCircle2,
  Zap,
  Hash,
  FileText,
  Scissors,
  RefreshCw,
  Mail,
  Eye,
  Smartphone,
  Monitor,
  ArrowLeftRight,
  Play,
  Pause,
  ChevronDown,
  ExternalLink,
  Binary,
  Cpu,
  Sparkles,
  Menu,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Design Constants - Euveka Grayscale System
// ============================================================================

const ACCENT_GLOW = "rgba(254, 254, 252, 0.15)";

// ============================================================================
// Data Definitions
// ============================================================================

const senderSteps = [
  {
    step: "01",
    title: "Select Files",
    desc: "Drag and drop, or paste text. No size limits.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Get Your Code",
    desc: "Unique 3-word phrase or 6-character code.",
    icon: Key,
  },
  {
    step: "03",
    title: "Share the Code",
    desc: "Send via any channel - text, email, verbal.",
    icon: Mail,
  },
  {
    step: "04",
    title: "Transfer",
    desc: "Post-quantum encrypted, direct P2P connection.",
    icon: Zap,
  },
];

const receiverSteps = [
  {
    step: "01",
    title: "Get the Code",
    desc: "Receive the phrase or code from sender.",
    icon: Key,
  },
  {
    step: "02",
    title: "Enter It",
    desc: "Paste the code in Tallow's receive section.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Verify (SAS)",
    desc: "Optional: verify emoji/word to prevent MITM.",
    icon: Shield,
  },
  {
    step: "04",
    title: "Download",
    desc: "Files arrive directly, decrypted on your device.",
    icon: Download,
  },
];

const p2pConnectionSteps = [
  {
    step: 1,
    title: "Code Generation",
    icon: Key,
    description:
      "Sender generates a unique connection code (e.g., 'apple-banana-cherry' or 'A7K9P2')",
    technical:
      "8-character cryptographically secure random code using Web Crypto API",
  },
  {
    step: 2,
    title: "Signaling Server",
    icon: Server,
    description:
      "Both peers connect to signaling server to exchange connection metadata",
    technical:
      "WebSocket connection for SDP offer/answer exchange only - no file data passes through",
  },
  {
    step: 3,
    title: "ICE Candidates",
    icon: Radio,
    description: "Discover all possible network paths between peers",
    technical:
      "STUN servers discover public IPs; TURN servers provide relay fallback",
  },
  {
    step: 4,
    title: "DTLS Handshake",
    icon: Shield,
    description: "Establish encrypted connection directly between peers",
    technical: "WebRTC's DTLS-SRTP provides transport-layer encryption",
  },
  {
    step: 5,
    title: "DataChannel Open",
    icon: ArrowLeftRight,
    description: "Create bidirectional data stream for file transfer",
    technical: "Ordered, reliable DataChannel with 64KB chunk size",
  },
  {
    step: 6,
    title: "Direct P2P Transfer",
    icon: Zap,
    description:
      "Files flow directly between devices - no server in the middle",
    technical: "End-to-end encrypted chunks streamed at network speed",
  },
];

const encryptionSteps = [
  {
    step: 1,
    title: "Hybrid Key Generation",
    icon: Key,
    description: "Generate post-quantum + classical key pairs",
    details: [
      {
        label: "ML-KEM-768",
        value: "NIST-standardized post-quantum KEM (1184-byte public key)",
      },
      {
        label: "X25519",
        value: "Classical ECDH for backward compatibility (32-byte key)",
      },
    ],
  },
  {
    step: 2,
    title: "Key Exchange",
    icon: RefreshCw,
    description: "Exchange public keys, derive shared secret",
    details: [
      {
        label: "KEM Encapsulation",
        value: "Sender encapsulates 256-bit secret to receiver's public key",
      },
      {
        label: "HKDF-SHA-256",
        value: "Derive session key from hybrid shared secret",
      },
    ],
  },
  {
    step: 3,
    title: "File Chunking",
    icon: Scissors,
    description: "Split files into 64KB chunks for streaming",
    details: [
      { label: "Chunk Size", value: "64 KB (65,536 bytes) optimal for WebRTC" },
      {
        label: "Indexing",
        value: "Sequential chunk numbers for ordered reassembly",
      },
    ],
  },
  {
    step: 4,
    title: "Per-Chunk Encryption",
    icon: Lock,
    description: "Each chunk encrypted with AES-256-GCM",
    details: [
      { label: "Algorithm", value: "AES-256-GCM authenticated encryption" },
      { label: "Nonce", value: "Unique 96-bit nonce per chunk" },
      { label: "Auth Tag", value: "128-bit authentication tag" },
    ],
  },
  {
    step: 5,
    title: "Integrity Verification",
    icon: Hash,
    description: "BLAKE3 hash ensures data integrity",
    details: [
      { label: "File Hash", value: "Full file hash computed before encryption" },
      { label: "Chunk Hash", value: "Per-chunk hash for corruption detection" },
    ],
  },
];

const transferModes = [
  {
    id: "local",
    title: "Local Network",
    subtitle: "Same WiFi / LAN",
    icon: Wifi,
    description: "Fastest possible transfer speeds using direct local connection",
    features: [
      "mDNS/DNS-SD automatic device discovery",
      "Direct LAN connection (no internet required)",
      "Maximum throughput - limited only by your network",
      "Zero external server contact",
    ],
    technical: {
      discovery: "Multicast DNS broadcasts on local network",
      connection: "Direct TCP/WebRTC over local IP",
      speed: "Up to 1 Gbps+ on modern networks",
      privacy: "Traffic never leaves your local network",
    },
  },
  {
    id: "internet",
    title: "Internet P2P",
    subtitle: "Anywhere in the world",
    icon: Globe,
    description:
      "Connect across the internet while maintaining peer-to-peer privacy",
    features: [
      "Signaling server for initial connection only",
      "NAT traversal with STUN/TURN servers",
      "Direct P2P after connection established",
      "Relay fallback if direct connection fails",
    ],
    technical: {
      signaling: "WebSocket signaling for SDP exchange",
      nat: "ICE candidates probe all possible paths",
      stun: "STUN discovers public IP and port",
      turn: "TURN relay when direct connection blocked",
    },
  },
  {
    id: "email",
    title: "Email Fallback",
    subtitle: "When P2P fails",
    icon: Mail,
    description:
      "Encrypted file storage when direct connection is impossible",
    features: [
      "Encrypted upload to Cloudflare R2 storage",
      "Time-limited download links (24-48 hours)",
      "Password-protected access",
      "Automatic deletion after download/expiry",
    ],
    technical: {
      storage: "Cloudflare R2 encrypted object storage",
      encryption: "AES-256-GCM with derived password key",
      links: "Cryptographically random, single-use URLs",
      retention: "Auto-purge after configurable period",
    },
  },
];

const faq = [
  {
    q: "What files can I send?",
    a: "Everything - documents, images, videos, archives. No restrictions.",
  },
  {
    q: "Is there a size limit?",
    a: "No limits. Files go directly between devices.",
  },
  {
    q: "Do I need an account?",
    a: "No account needed to transfer. Optional for saved contacts.",
  },
  {
    q: "What is Friends list?",
    a: "Save trusted contacts for instant, code-free sharing.",
  },
  {
    q: "Is it post-quantum secure?",
    a: "Yes! ML-KEM (Kyber) + X25519 hybrid encryption protects against future quantum attacks.",
  },
  {
    q: "What is Traffic Obfuscation?",
    a: "Optional feature that adds padding and decoy traffic to resist traffic analysis.",
  },
  {
    q: "What happens if P2P fails?",
    a: "Tallow automatically offers email fallback with encrypted cloud storage.",
  },
  {
    q: "Can anyone intercept my files?",
    a: "No. End-to-end encryption means only sender and receiver can decrypt files.",
  },
];

// ============================================================================
// Animated Components
// ============================================================================

function StepCard({
  step,
  title,
  desc,
  icon: Icon,
  index,
  variant = "sender",
}: {
  step: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  index: number;
  variant?: "sender" | "receiver";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-500",
        variant === "sender"
          ? "bg-[#111110] border-[#262626] hover:border-[#444440]"
          : "bg-[#0d0d0c] border-[#262626] hover:border-[#444440]"
      )}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
      </div>

      {/* Top line accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#fefefc]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-start gap-4">
        <div className="shrink-0">
          <div className="w-14 h-14 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center group-hover:border-[#444440] group-hover:shadow-[0_0_20px_rgba(254,254,252,0.05)] transition-all duration-500">
            <Icon className="w-6 h-6 text-[#fefefc] group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl font-bold text-[#262626] group-hover:text-[#444440] transition-colors duration-300">
              {step}
            </span>
            <h3 className="text-lg font-semibold text-[#fefefc] group-hover:text-white transition-colors duration-300">
              {title}
            </h3>
          </div>
          <p className="text-[#888880] text-sm leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ConnectionFlowDiagram() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isPlaying) {return;}
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % p2pConnectionSteps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="w-full"
    >
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#fefefc] text-[#0a0a08] hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(254,254,252,0.1)] hover:shadow-[0_0_40px_rgba(254,254,252,0.2)]"
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isPlaying ? "Pause" : "Play"} Walkthrough
          </span>
        </button>
      </div>

      {/* Timeline */}
      <div className="relative mb-8">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-[#262626] rounded-full">
          <motion.div
            className="h-full bg-[#fefefc] rounded-full"
            initial={{ width: "0%" }}
            animate={{
              width: `${((activeStep + 1) / p2pConnectionSteps.length) * 100}%`,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ boxShadow: `0 0 10px ${ACCENT_GLOW}` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {p2pConnectionSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-2",
                  index <= activeStep
                    ? "bg-[#fefefc] border-[#fefefc] shadow-[0_0_20px_rgba(254,254,252,0.2)]"
                    : "bg-[#0a0a08] border-[#262626]"
                )}
                aria-label={`Step ${index + 1}: ${step.title}`}
              >
                <StepIcon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    index <= activeStep ? "text-[#0a0a08]" : "text-[#555550]"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Details */}
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-2xl bg-[#111110] border border-[#262626] relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-[#1a1a18] border border-[#444440] shadow-[0_0_20px_rgba(254,254,252,0.05)]">
            {p2pConnectionSteps[activeStep] &&
              (() => {
                const Icon = p2pConnectionSteps[activeStep].icon;
                return <Icon className="w-6 h-6 text-[#fefefc]" />;
              })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-[#888880]">
                Step {activeStep + 1}
              </span>
              <h3 className="text-xl font-semibold text-[#fefefc]">
                {p2pConnectionSteps[activeStep]?.title}
              </h3>
            </div>
            <p className="text-[#888880] mb-4">
              {p2pConnectionSteps[activeStep]?.description}
            </p>
            <div className="p-3 rounded-lg bg-[#1a1a18] border border-[#262626]">
              <p className="text-xs font-medium text-[#555550] uppercase tracking-wider mb-1">
                Technical Detail
              </p>
              <p className="text-sm font-mono text-[#aaaaaa]">
                {p2pConnectionSteps[activeStep]?.technical}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visual Representation */}
      <div className="mt-8 p-6 rounded-2xl bg-[#111110] border border-[#262626]">
        <div className="flex items-center justify-between gap-8">
          {/* Sender Device */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={
                activeStep >= 4
                  ? { scale: [1, 1.05, 1], boxShadow: [`0 0 20px ${ACCENT_GLOW}`] }
                  : {}
              }
              transition={{ duration: 1, repeat: activeStep >= 4 ? Infinity : 0 }}
              className="w-16 h-16 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center"
            >
              <Monitor className="w-8 h-8 text-[#fefefc]" />
            </motion.div>
            <span className="text-sm font-medium text-[#fefefc]">Sender</span>
          </div>

          {/* Connection Line with Animation */}
          <div className="flex-1 relative">
            <div className="h-1 bg-[#262626] rounded-full">
              <motion.div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  activeStep >= 5
                    ? "bg-[#fefefc]"
                    : activeStep >= 3
                      ? "bg-[#888880]"
                      : "bg-[#555550]"
                )}
                animate={{ width: `${Math.min(100, (activeStep / 5) * 100)}%` }}
                transition={{ duration: 0.5 }}
                style={{
                  boxShadow:
                    activeStep >= 5
                      ? "0 0 15px rgba(254, 254, 252, 0.3)"
                      : activeStep >= 3
                        ? "0 0 15px rgba(136, 136, 128, 0.3)"
                        : `0 0 15px ${ACCENT_GLOW}`,
                }}
              />
            </div>
            {activeStep >= 1 && activeStep < 5 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="w-10 h-10 rounded-full bg-[#0a0a08] border-2 border-[#555550] flex items-center justify-center shadow-[0_0_15px_rgba(85,85,80,0.3)]">
                  <Server className="w-5 h-5 text-[#888880]" />
                </div>
                <p className="text-xs text-center mt-2 text-[#888880]">
                  Signaling
                </p>
              </motion.div>
            )}
          </div>

          {/* Receiver Device */}
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={
                activeStep >= 4
                  ? { scale: [1, 1.05, 1], boxShadow: [`0 0 20px ${ACCENT_GLOW}`] }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: activeStep >= 4 ? Infinity : 0,
                delay: 0.5,
              }}
              className="w-16 h-16 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center"
            >
              <Smartphone className="w-8 h-8 text-[#fefefc]" />
            </motion.div>
            <span className="text-sm font-medium text-[#fefefc]">Receiver</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EncryptionLayerDiagram() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
      className="w-full space-y-4"
    >
      {encryptionSteps.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
              "rounded-2xl border transition-all duration-300 overflow-hidden",
              expandedStep === index
                ? "border-[#444440] shadow-[0_0_30px_rgba(254,254,252,0.03)]"
                : "border-[#262626]"
            )}
          >
            <button
              onClick={() =>
                setExpandedStep(expandedStep === index ? null : index)
              }
              className="w-full p-5 flex items-center gap-4 bg-[#111110] hover:bg-[#161614] transition-colors"
              aria-expanded={expandedStep === index}
            >
              <div
                className={cn(
                  "p-3 rounded-xl transition-all duration-300",
                  expandedStep === index
                    ? "bg-[#fefefc] shadow-[0_0_20px_rgba(254,254,252,0.15)]"
                    : "bg-[#1a1a18] border border-[#262626]"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    expandedStep === index ? "text-[#0a0a08]" : "text-[#fefefc]"
                  )}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#888880]">
                    Step {step.step}
                  </span>
                  <h3 className="font-semibold text-[#fefefc]">{step.title}</h3>
                </div>
                <p className="text-sm text-[#888880]">{step.description}</p>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-[#555550] transition-transform duration-300",
                  expandedStep === index && "rotate-180"
                )}
              />
            </button>

            {expandedStep === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-5 bg-[#0d0d0c] border-t border-[#262626]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {step.details.map((detail, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#111110] border border-[#262626]"
                    >
                      <p className="text-xs font-medium text-[#888880] uppercase tracking-wider mb-1">
                        {detail.label}
                      </p>
                      <p className="text-sm font-mono text-[#aaaaaa]">
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function TransferModeSelector() {
  const [selectedMode, setSelectedMode] = useState("local");
  const mode = transferModes.find((m) => m.id === selectedMode)!;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Mode Tabs */}
      <div className="flex gap-3 mb-6">
        {transferModes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={cn(
                "flex-1 p-4 rounded-xl border-2 transition-all duration-300",
                selectedMode === m.id
                  ? "bg-[#111110] border-[#444440] shadow-[0_0_20px_rgba(254,254,252,0.05)]"
                  : "bg-[#0d0d0c] border-[#262626] hover:border-[#333330]"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 mx-auto mb-2 transition-colors",
                  selectedMode === m.id ? "text-[#fefefc]" : "text-[#555550]"
                )}
              />
              <p
                className={cn(
                  "font-medium text-sm transition-colors",
                  selectedMode === m.id ? "text-[#fefefc]" : "text-[#888880]"
                )}
              >
                {m.title}
              </p>
              <p className="text-xs text-[#555550]">{m.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Mode Details */}
      <motion.div
        key={selectedMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 rounded-2xl bg-[#111110] border border-[#444440] relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

        <div className="relative flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-[#1a1a18] border border-[#444440] shadow-[0_0_15px_rgba(254,254,252,0.05)]">
            <mode.icon className="w-6 h-6 text-[#fefefc]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#fefefc]">{mode.title}</h3>
            <p className="text-[#888880]">{mode.description}</p>
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-[#555550]">
              Features
            </h4>
            <ul className="space-y-2">
              {mode.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#fefefc]" />
                  <span className="text-[#aaaaaa]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Details */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-[#555550]">
              Technical
            </h4>
            <div className="space-y-2">
              {Object.entries(mode.technical).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-[#1a1a18] border border-[#262626]">
                  <p className="text-xs font-medium text-[#555550] capitalize">
                    {key}
                  </p>
                  <p className="text-sm font-mono text-[#aaaaaa]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DataFlowVisualization() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const flowSteps = [
    { icon: FileText, label: "Select\nFiles", color: "#fefefc" },
    { icon: Scissors, label: "Chunk\n64KB", color: "#cccccc" },
    { icon: Lock, label: "Encrypt\nAES-256", color: "#aaaaaa" },
    { icon: Radio, label: "WebRTC\nTransfer", color: "#888880" },
    { icon: Key, label: "Decrypt\nVerify", color: "#aaaaaa" },
    { icon: Download, label: "Save\nFiles", color: "#fefefc" },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="w-full p-6 rounded-2xl bg-[#111110] border border-[#262626]"
    >
      <h4 className="font-semibold mb-6 text-center text-[#fefefc]">
        Complete Data Flow
      </h4>

      {/* Flow Diagram */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex flex-col items-center min-w-[80px]"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 border bg-white/5 border-[#333330]"
                  style={{
                    boxShadow: `0 0 15px rgba(254, 254, 252, 0.05)`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: step.color }} />
                </div>
                <span className="text-xs text-center font-medium text-[#888880] whitespace-pre-line">
                  {step.label}
                </span>
              </motion.div>

              {index < flowSteps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={isInView ? { opacity: 1, width: 24 } : {}}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  <ArrowRight className="w-4 h-4 text-[#444440] mx-2 shrink-0" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Badges */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {[
          { label: "End-to-End Encrypted" },
          { label: "Post-Quantum Secure" },
          { label: "Zero Knowledge" },
        ].map((badge) => (
          <span
            key={badge.label}
            className="px-4 py-2 rounded-full text-xs font-medium border bg-white/5 border-[#333330] text-[#aaaaaa]"
          >
            {badge.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        isOpen
          ? "bg-[#111110] border-[#444440]"
          : "bg-[#0d0d0c] border-[#262626] hover:border-[#333330]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <h3 className="font-semibold text-[#fefefc] pr-4">{q}</h3>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-[#555550] shrink-0 transition-transform duration-300",
            isOpen && "rotate-180 text-[#fefefc]"
          )}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="px-5 pb-5"
        >
          <p className="text-[#888880] leading-relaxed">{a}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function HowItWorksPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a08] overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-[#0a0a08]/90 backdrop-blur-xl border-b border-[#262626]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-8 h-8 rounded-lg bg-[#fefefc] flex items-center justify-center"
              >
                <Sparkles className="w-4 h-4 text-[#0a0a08]" />
              </motion.div>
              <span className="text-[#fefefc] text-xl font-semibold tracking-tight group-hover:text-white transition-colors">
                tallow
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How it works", "Security", "Docs"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  className={cn(
                    "relative text-sm font-medium transition-colors group",
                    item === "How it works"
                      ? "text-[#fefefc]"
                      : "text-[#888880] hover:text-[#fefefc]"
                  )}
                >
                  {item}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-[#fefefc] transition-all duration-300",
                      item === "How it works" ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-[#888880] hover:text-[#fefefc] transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/app" className="hidden sm:block">
                <Button
                  size="sm"
                  className="bg-[#fefefc] hover:bg-white text-[#0a0a08] font-medium px-5 h-10 rounded-full shadow-[0_0_20px_rgba(254,254,252,0.1)] hover:shadow-[0_0_30px_rgba(254,254,252,0.2)] transition-all"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={
          mobileMenuOpen
            ? { opacity: 1, pointerEvents: "auto" as const }
            : { opacity: 0, pointerEvents: "none" as const }
        }
        className="fixed inset-0 z-[100] md:hidden"
      >
        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { opacity: 1 } : { opacity: 0 }}
          className="absolute inset-0 bg-[#0a0a08]/98 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />

        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { x: 0 } : { x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative h-full flex flex-col p-8"
        >
          <div className="flex items-center justify-between mb-16">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#fefefc] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0a0a08]" />
              </div>
              <span className="text-[#fefefc] text-xl font-semibold">tallow</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#888880] hover:text-[#fefefc] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-6">
            {["Features", "How it works", "Security", "Docs"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 50 }}
                animate={
                  mobileMenuOpen
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: 50 }
                }
                transition={{ delay: i * 0.1 + 0.1 }}
              >
                <Link
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-semibold text-[#fefefc] hover:text-white transition-colors"
                >
                  {item}
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="pt-8 border-t border-[#262626]">
            <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
              <Button
                size="lg"
                className="w-full bg-[#fefefc] hover:bg-white text-[#0a0a08] font-semibold h-14 rounded-full shadow-[0_0_30px_rgba(254,254,252,0.15)]"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-[80vh] flex items-center justify-center pt-32 pb-20 overflow-hidden"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#262626] to-transparent" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111110] border border-[#262626] mb-8"
              >
                <Eye className="w-4 h-4 text-[#fefefc]" />
                <span className="text-sm text-[#888880]">Technical Deep Dive</span>
              </motion.div>

              {/* Hero Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#fefefc] tracking-[-0.02em] leading-[0.95] mb-6"
              >
                <span className="block">How Tallow</span>
                <motion.span
                  className="block bg-gradient-to-r from-[#fefefc] via-[#aaaaaa] to-[#fefefc] bg-clip-text text-transparent bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  actually works
                </motion.span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-[#888880] max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Understand exactly how Tallow protects your files with
                post-quantum encryption, peer-to-peer connections, and
                zero-knowledge architecture.
              </motion.p>

              {/* Tech badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {["WebRTC P2P", "ML-KEM-768", "AES-256-GCM", "BLAKE3"].map(
                  (tag) => (
                    <motion.span
                      key={tag}
                      whileHover={{
                        scale: 1.05,
                        borderColor: "#444440",
                        boxShadow: "0 0 15px rgba(254, 254, 252, 0.05)",
                      }}
                      className="px-4 py-2 rounded-full bg-[#111110] border border-[#262626] text-sm font-mono text-[#888880] transition-all cursor-default"
                    >
                      {tag}
                    </motion.span>
                  )
                )}
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-[#555550]"
            >
              <span className="text-xs uppercase tracking-widest">Scroll</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Quick Connection Types */}
        <section className="py-16 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="group p-8 rounded-2xl bg-[#111110] border border-[#262626] text-center hover:border-[#444440] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center mx-auto mb-4 group-hover:border-[#444440] group-hover:shadow-[0_0_20px_rgba(254,254,252,0.05)] transition-all">
                  <Wifi className="w-7 h-7 text-[#fefefc]" />
                </div>
                <h3 className="text-lg font-semibold text-[#fefefc] mb-2">
                  Local WiFi
                </h3>
                <p className="text-sm text-[#888880]">
                  Fastest speeds via mDNS discovery
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group p-8 rounded-2xl bg-[#111110] border border-[#262626] text-center hover:border-[#444440] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center mx-auto mb-4 group-hover:border-[#444440] group-hover:shadow-[0_0_20px_rgba(254,254,252,0.05)] transition-all">
                  <Globe className="w-7 h-7 text-[#fefefc]" />
                </div>
                <h3 className="text-lg font-semibold text-[#fefefc] mb-2">
                  Internet
                </h3>
                <p className="text-sm text-[#888880]">
                  Worldwide via WebRTC P2P
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* P2P Connection Flow */}
        <section className="py-24 md:py-32 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-16"
              >
                <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                  Connection Flow
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                  P2P Connection <span className="text-[#888880]">Step by Step</span>
                </h2>
                <p className="text-[#888880] text-lg max-w-2xl mx-auto">
                  Step-by-step walkthrough of how WebRTC establishes a direct
                  peer-to-peer connection for file transfer.
                </p>
              </motion.div>

              <ConnectionFlowDiagram />

              {/* Signaling Server Explanation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="mt-12 p-6 rounded-2xl bg-[#111110] border border-[#262626]"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-[#333330] shrink-0">
                    <Server className="w-6 h-6 text-[#888880]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-[#fefefc]">
                      The Signaling Server: Connection Only, No Data
                    </h3>
                    <p className="text-[#888880] mb-4">
                      The signaling server helps peers find each other and
                      exchange connection metadata (SDP offers/answers and ICE
                      candidates). Once the P2P connection is established, the
                      signaling server is no longer involved.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "No file data passes through" },
                        { label: "Only connection metadata" },
                        { label: "Encrypted WebSocket" },
                      ].map((badge) => (
                        <span
                          key={badge.label}
                          className="px-3 py-1 rounded-full text-xs font-medium border bg-white/5 border-[#333330] text-[#aaaaaa]"
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Encryption Process */}
        <section className="py-24 md:py-32 bg-[#0d0d0c] border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-16"
              >
                <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                  Encryption
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                  How Your Files Are <span className="text-[#888880]">Protected</span>
                </h2>
                <p className="text-[#888880] text-lg max-w-2xl mx-auto">
                  Hybrid ML-KEM-768 + X25519 key exchange with AES-256-GCM
                  authenticated encryption.
                </p>
              </motion.div>

              <EncryptionLayerDiagram />

              {/* Key Exchange Visual */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className="mt-12 p-8 rounded-2xl bg-[#111110] border border-[#262626]"
              >
                <h3 className="font-semibold mb-8 text-center text-[#fefefc]">
                  Hybrid Key Exchange
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[#333330] flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(254,254,252,0.05)]">
                      <Binary className="w-8 h-8 text-[#fefefc]" />
                    </div>
                    <h4 className="font-medium mb-1 text-[#fefefc]">ML-KEM-768</h4>
                    <p className="text-sm text-[#888880]">Post-quantum KEM</p>
                    <p className="text-xs font-mono mt-2 text-[#555550]">
                      1184-byte public key
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-4xl font-bold text-[#333330]">+</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[#333330] flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(254,254,252,0.05)]">
                      <Cpu className="w-8 h-8 text-[#888880]" />
                    </div>
                    <h4 className="font-medium mb-1 text-[#fefefc]">X25519</h4>
                    <p className="text-sm text-[#888880]">Classical ECDH</p>
                    <p className="text-xs font-mono mt-2 text-[#555550]">
                      32-byte public key
                    </p>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <ArrowRight className="w-6 h-6 mx-auto rotate-90 text-[#444440] mb-3" />
                  <div className="inline-block px-6 py-3 rounded-full bg-white/5 border border-[#333330]">
                    <p className="font-mono text-sm text-[#aaaaaa]">
                      HKDF-SHA-256 derives 256-bit session key
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Transfer Modes */}
        <section className="py-24 md:py-32 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-16"
              >
                <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                  Transfer Modes
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                  Three Ways to <span className="text-[#888880]">Connect</span>
                </h2>
                <p className="text-[#888880] text-lg max-w-2xl mx-auto">
                  Each optimized for different scenarios and network conditions.
                </p>
              </motion.div>

              <TransferModeSelector />
            </div>
          </div>
        </section>

        {/* Data Flow */}
        <section className="py-24 md:py-32 bg-[#0d0d0c] border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-16"
              >
                <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                  Data Flow
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] tracking-tight mb-6">
                  From Selection to Download
                </h2>
                <p className="text-[#888880] text-lg max-w-2xl mx-auto">
                  Every step is encrypted and verified.
                </p>
              </motion.div>

              <DataFlowVisualization />
            </div>
          </div>
        </section>

        {/* Sender Steps */}
        <section className="py-24 md:py-32 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex items-center gap-4 mb-12"
              >
                <div className="w-14 h-14 rounded-xl bg-[#fefefc] flex items-center justify-center shadow-[0_0_30px_rgba(254,254,252,0.1)]">
                  <Upload className="w-6 h-6 text-[#0a0a08]" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#fefefc]">
                    Sending Files
                  </h2>
                  <p className="text-sm text-[#888880] uppercase tracking-wider">
                    Quick Start Guide
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {senderSteps.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step.step}
                    title={step.title}
                    desc={step.desc}
                    icon={step.icon}
                    index={i}
                    variant="sender"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Receiver Steps */}
        <section className="py-24 md:py-32 bg-[#0d0d0c] border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="flex items-center gap-4 mb-12"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center">
                  <Download className="w-6 h-6 text-[#fefefc]" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-[#fefefc]">
                    Receiving Files
                  </h2>
                  <p className="text-sm text-[#888880] uppercase tracking-wider">
                    Quick Start Guide
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {receiverSteps.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step.step}
                    title={step.title}
                    desc={step.desc}
                    icon={step.icon}
                    index={i}
                    variant="receiver"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security Callout */}
        <section className="py-24 md:py-32 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-[#111110] border border-[#262626] relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />

              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(254,254,252,0.05)]">
                  <Shield className="w-10 h-10 text-[#fefefc]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] tracking-tight mb-4">
                  Military-Grade <span className="text-[#888880]">Privacy</span>
                </h2>
                <p className="text-[#888880] text-lg mb-8 max-w-2xl mx-auto">
                  Post-quantum ML-KEM encryption with Triple Ratchet forward
                  secrecy. Optional traffic obfuscation and onion routing for
                  maximum privacy.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {[
                    "Post-Quantum",
                    "Triple Ratchet",
                    "Zero Knowledge",
                    "E2E Encrypted",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-5 py-2.5 rounded-full bg-[#1a1a18] border border-[#262626] text-sm font-medium uppercase tracking-wider text-[#888880]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href="/security"
                  className="inline-flex items-center text-sm font-medium uppercase tracking-wider text-[#fefefc] hover:text-white transition-colors"
                >
                  Full Security Details{" "}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Try It Yourself */}
        <section className="py-24 md:py-32 bg-[#0d0d0c] border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] tracking-tight">
                  Try It <span className="text-[#888880]">Yourself</span>
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    href: "/app",
                    icon: Zap,
                    title: "Start Transferring",
                    desc: "Send files now - no account needed",
                  },
                  {
                    href: "/transfer-demo",
                    icon: Eye,
                    title: "Speed Demo",
                    desc: "See transfer speeds in action",
                  },
                  {
                    href: "/metadata-demo",
                    icon: FileText,
                    title: "Metadata Stripping",
                    desc: "See privacy features in action",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <Link href={item.href} className="block group">
                        <div className="p-6 rounded-2xl bg-[#111110] border border-[#262626] text-center hover:border-[#444440] transition-all duration-300">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border group-hover:scale-110 transition-transform duration-300 bg-white/5 border-[#333330]">
                            <Icon className="w-6 h-6 text-[#fefefc]" />
                          </div>
                          <h3 className="font-semibold text-[#fefefc] mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-[#888880] mb-3">
                            {item.desc}
                          </p>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#fefefc]">
                            Try Now <ExternalLink className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 md:py-32 border-b border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] tracking-tight">
                  Questions<span className="text-[#888880]">?</span>
                </h2>
              </motion.div>

              <div className="space-y-3">
                {faq.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 md:py-40 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.03] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-white/[0.03] rounded-full blur-[150px]" />
          </div>

          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 right-[10%] w-32 h-32 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 left-[10%] w-24 h-24 rounded-2xl bg-gradient-to-br from-[#262626] to-transparent border border-[#262626]"
            />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-6xl font-bold text-[#fefefc] tracking-tight mb-6 leading-tight">
                Ready to Share
                <br />
                <span className="bg-gradient-to-r from-[#fefefc] to-[#888880] bg-clip-text text-transparent">
                  Securely
                </span>
                ?
              </h2>
              <p className="text-[#888880] text-lg md:text-xl mb-10 leading-relaxed">
                No account needed. Start transferring in seconds.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-[#fefefc] hover:bg-white text-[#0a0a08] font-semibold px-10 h-14 rounded-full shadow-[0_0_50px_rgba(254,254,252,0.15)] hover:shadow-[0_0_70px_rgba(254,254,252,0.25)] transition-all duration-300 text-base"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/security">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[#262626] bg-transparent text-[#fefefc] hover:bg-[#111110] hover:border-[#333330] px-10 h-14 rounded-full transition-all duration-300 text-base"
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Security Details
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-[#555550]">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#fefefc]" />
                  <span className="text-sm">No sign-up</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#fefefc]" />
                  <span className="text-sm">No file limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#fefefc]" />
                  <span className="text-sm">100% free</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] py-12 bg-[#0a0a08]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#fefefc] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#0a0a08]" />
              </div>
              <span className="text-[#fefefc] text-xl font-semibold">tallow</span>
            </Link>

            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-xs font-medium uppercase tracking-widest text-[#555550] hover:text-[#fefefc] transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/security"
                className="text-xs font-medium uppercase tracking-widest text-[#555550] hover:text-[#fefefc] transition-colors"
              >
                Security
              </Link>
              <Link
                href="/terms"
                className="text-xs font-medium uppercase tracking-widest text-[#555550] hover:text-[#fefefc] transition-colors"
              >
                Terms
              </Link>
            </div>

            <p className="text-sm text-[#555550]">Open source. Privacy first.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
