'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Eye, EyeOff, FileX, Network, Lock, Database,
  Fingerprint, Radio, Globe, Trash2, Key, ShieldCheck,
  AlertTriangle, CheckCircle2, Zap, Activity,
  MapPin, Camera, Clock, User, Server, ArrowRight, Info,
  Scale, FileText, UserCheck, HardDrive, XCircle,
  Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Animated section wrapper
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
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  category,
  delay = 0
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  category: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-[#111110] border border-[#262626] p-6 transition-all duration-500 hover:border-[#444440] hover:bg-[#161614]"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
      </div>

      <div className="relative">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#888880] mb-3 block">
          {category}
        </span>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center shrink-0 group-hover:border-[#444440] group-hover:shadow-[0_0_20px_rgba(254,254,252,0.05)] transition-all duration-500">
            <Icon className="w-5 h-5 text-[#fefefc]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#fefefc] mb-1 group-hover:text-white transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-[#888880] leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Privacy mode card
function PrivacyModeCard({
  level,
  description,
  features,
  useCase,
  intensity,
  delay = 0
}: {
  level: string;
  description: string;
  features: string[];
  useCase: string;
  intensity: 'low' | 'medium' | 'high' | 'max';
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const intensityStyles = {
    low: { bg: 'bg-white/5', border: 'border-[#333330]', text: 'text-[#888880]' },
    medium: { bg: 'bg-white/5', border: 'border-[#444440]', text: 'text-[#aaaaaa]' },
    high: { bg: 'bg-white/10', border: 'border-[#555550]', text: 'text-[#cccccc]' },
    max: { bg: 'bg-white/10', border: 'border-[#666660]', text: 'text-[#fefefc]' },
  };

  const style = intensityStyles[intensity];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl bg-[#111110] border border-[#262626] p-6 transition-all duration-500 hover:border-[#444440]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 rounded-full ${style.bg} ${style.border} border`}>
          <span className={`text-sm font-semibold ${style.text}`}>{level}</span>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-[#fefefc] mb-2">{description}</h3>
      <div className="space-y-2 mb-4">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#fefefc] mt-0.5 shrink-0" />
            <p className="text-sm text-[#888880]">{feature}</p>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-[#262626]">
        <p className="text-xs text-[#555550] uppercase tracking-wider mb-1">Best For</p>
        <p className="text-sm text-[#fefefc]">{useCase}</p>
      </div>
    </motion.div>
  );
}

// Stat card
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="text-center p-6 rounded-2xl bg-[#111110] border border-[#262626]">
      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-[#fefefc]" />
      </div>
      <div className="text-3xl font-bold text-[#fefefc] mb-2">{value}</div>
      <p className="text-sm text-[#888880]">{label}</p>
    </div>
  );
}

export default function PrivacyPage() {
  // Privacy features data
  const privacyFeatures = [
    {
      icon: Shield,
      title: 'Zero-Knowledge Architecture',
      description: 'We never see your files, metadata, or transfer history. Everything stays between your devices.',
      category: 'Core Privacy'
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All transfers encrypted with AES-256-GCM and ML-KEM-768. Only sender and receiver have keys.',
      category: 'Encryption'
    },
    {
      icon: FileX,
      title: 'Automatic Metadata Stripping',
      description: 'Remove EXIF, GPS, camera data, and file metadata before transfer. Privacy by default.',
      category: 'Metadata Protection'
    },
    {
      icon: EyeOff,
      title: 'No Server Storage',
      description: 'Files never touch our servers. Direct peer-to-peer transfer only.',
      category: 'Core Privacy'
    },
    {
      icon: Trash2,
      title: 'Ephemeral Signaling',
      description: 'Connection data auto-deleted after establishment. No logs, no history.',
      category: 'Data Minimization'
    },
    {
      icon: Network,
      title: 'Traffic Obfuscation',
      description: 'Disguise WebRTC traffic patterns to prevent traffic analysis.',
      category: 'Network Privacy'
    },
    {
      icon: Globe,
      title: 'Onion Routing (Optional)',
      description: 'Multi-hop encrypted relay routing for maximum anonymity.',
      category: 'Network Privacy'
    },
    {
      icon: Eye,
      title: 'Privacy Modes',
      description: '4 configurable privacy levels from Low to Maximum based on your threat model.',
      category: 'User Control'
    },
    {
      icon: Database,
      title: 'Encrypted Local Storage',
      description: 'Keys and preferences encrypted with AES-256-GCM in IndexedDB.',
      category: 'Storage'
    },
    {
      icon: Key,
      title: 'Perfect Forward Secrecy',
      description: 'New keys for every session. Past transfers stay secure even if current key compromised.',
      category: 'Encryption'
    },
    {
      icon: Fingerprint,
      title: 'No Tracking',
      description: 'No analytics, no cookies, no fingerprinting, no advertising networks.',
      category: 'Data Minimization'
    },
    {
      icon: ShieldCheck,
      title: 'Open Source Audit',
      description: 'Publicly auditable code. Trust through transparency, not promises.',
      category: 'Transparency'
    },
    {
      icon: Radio,
      title: 'Peer Authentication',
      description: 'Verify peer identity with SAS codes or QR scanning before transfer.',
      category: 'Security'
    },
    {
      icon: Activity,
      title: 'Privacy Monitoring',
      description: 'Real-time privacy metrics and threat indicators in-app.',
      category: 'User Control'
    },
    {
      icon: Zap,
      title: 'Secure Memory Handling',
      description: 'Automatic secure deletion of sensitive data from memory.',
      category: 'Memory Protection'
    }
  ];

  // Privacy modes data
  const privacyModes = [
    {
      level: 'Low',
      intensity: 'low' as const,
      description: 'Balanced privacy and convenience',
      features: [
        'Standard encryption (AES-256-GCM)',
        'Local discovery enabled',
        'Recent transfers stored locally',
        'Basic metadata retention'
      ],
      useCase: 'Trusted networks, casual file sharing'
    },
    {
      level: 'Medium',
      intensity: 'medium' as const,
      description: 'Enhanced privacy protection',
      features: [
        'Hybrid encryption (AES + ML-KEM-768)',
        'Local discovery disabled by default',
        'Limited transfer history (24h)',
        'Metadata stripping enabled'
      ],
      useCase: 'Default recommended mode for most users'
    },
    {
      level: 'High',
      intensity: 'high' as const,
      description: 'Strong privacy guarantees',
      features: [
        'Post-quantum encryption only',
        'No local discovery',
        'No transfer history storage',
        'Aggressive metadata removal',
        'Traffic obfuscation enabled'
      ],
      useCase: 'Sensitive documents, public networks'
    },
    {
      level: 'Maximum',
      intensity: 'max' as const,
      description: 'Maximum anonymity and security',
      features: [
        'Full PQC encryption suite',
        'Onion routing (multi-hop)',
        'Zero local storage',
        'Complete metadata stripping',
        'Memory cleared after each operation',
        'Randomized packet timing'
      ],
      useCase: 'Whistleblowers, journalists, high-risk scenarios'
    }
  ];

  // Metadata before/after data
  const metadataBeforeAfter = [
    {
      category: 'Location Data',
      icon: MapPin,
      before: ['GPS: 40.7128, -74.0060 (New York)', 'Altitude: 10.5 meters', 'Location: Times Square, NYC'],
      after: ['[Removed]', '[Removed]', '[Removed]'],
      risk: 'critical'
    },
    {
      category: 'Device Information',
      icon: Camera,
      before: ['Camera: iPhone 15 Pro', 'Serial: DNQXK3KFHP7Y', 'Lens: 24mm f/1.78'],
      after: ['[Removed]', '[Removed]', '[Removed]'],
      risk: 'high'
    },
    {
      category: 'Timestamps',
      icon: Clock,
      before: ['Created: 2025-01-15 14:32:05', 'Modified: 2025-01-15 14:35:22', 'Digitized: 2025-01-15 14:32:05'],
      after: ['[Removed]', '[Removed]', '[Removed]'],
      risk: 'medium'
    },
    {
      category: 'Author Information',
      icon: User,
      before: ['Artist: John Smith', 'Copyright: (c) 2025 John Smith', 'Software: Adobe Lightroom 7.1'],
      after: ['[Removed]', '[Removed]', '[Removed]'],
      risk: 'medium'
    }
  ];

  // GDPR rights data
  const gdprRights = [
    {
      right: 'Right to Access',
      explanation: "Since we don't collect data, there's nothing to access. Your files exist only on your devices.",
      icon: Eye
    },
    {
      right: 'Right to Erasure',
      explanation: 'Clear all local data anytime via Settings. We have no server-side data to delete.',
      icon: Trash2
    },
    {
      right: 'Right to Portability',
      explanation: 'Your files never leave your control. Export preferences from Settings.',
      icon: Database
    },
    {
      right: 'Right to Object',
      explanation: 'No profiling or automated decision-making occurs. Zero data processing.',
      icon: XCircle
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a08] overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a08]/90 backdrop-blur-xl border-b border-[#262626]"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-center justify-between h-16 md:h-20">
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

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How it works', 'Security', 'Privacy'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(' ', '-')}`}
                  className={`relative text-sm font-medium transition-colors group ${
                    item === 'Privacy' ? 'text-[#fefefc]' : 'text-[#888880] hover:text-[#fefefc]'
                  }`}
                >
                  {item}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#fefefc] transition-all duration-300 ${
                    item === 'Privacy' ? 'w-full' : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              ))}
            </div>

            <Link href="/app">
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
      </motion.nav>

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.02] rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111110] border border-[#262626] mb-8"
              >
                <Shield className="w-4 h-4 text-[#fefefc]" />
                <span className="text-sm text-[#888880]">Privacy First</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#fefefc] tracking-[-0.02em] leading-[1.1] mb-6"
              >
                Your Privacy is{' '}
                <span className="bg-gradient-to-r from-[#fefefc] via-[#aaaaaa] to-[#fefefc] bg-clip-text text-transparent">
                  Non-Negotiable
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-[#888880] max-w-2xl mx-auto leading-relaxed"
              >
                Zero-knowledge architecture. No data collection. No tracking. No compromises.
                15+ privacy features built into every transfer.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Privacy Stats */}
        <section className="relative py-16 border-y border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard value="0" label="Data Points Collected" icon={CheckCircle2} />
              <StatCard value="0" label="Third-Party Trackers" icon={CheckCircle2} />
              <StatCard value="0" label="Server Storage" icon={CheckCircle2} />
              <StatCard value="100%" label="Open Source" icon={CheckCircle2} />
            </div>
          </div>
        </section>

        {/* Zero-Knowledge Architecture */}
        <section className="py-24 md:py-32">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="max-w-3xl mb-16">
              <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                Architecture
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6 leading-tight">
                Zero-Knowledge by{' '}
                <span className="text-[#888880]">Design</span>
              </h2>
              <p className="text-[#888880] text-lg md:text-xl leading-relaxed">
                Our infrastructure is designed so we <strong className="text-[#fefefc]">cannot</strong> access your data,
                even if we wanted to. Privacy by design, not by policy.
              </p>
            </AnimatedSection>

            {/* Data Flow Diagram */}
            <AnimatedSection delay={0.2} className="mb-12">
              <div className="rounded-2xl bg-[#111110] border border-[#262626] p-8">
                <h3 className="text-xl font-semibold text-[#fefefc] mb-8 text-center">How Your Files Travel</h3>
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
                  <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-[#333330] min-w-[140px]">
                    <HardDrive className="w-8 h-8 text-[#fefefc] mb-2" />
                    <span className="font-semibold text-[#fefefc]">Your Device</span>
                    <span className="text-xs text-[#888880]">Encrypted locally</span>
                  </div>

                  <ArrowRight className="w-6 h-6 text-[#555550] rotate-90 lg:rotate-0" />

                  <div className="flex flex-col items-center p-4 rounded-xl bg-[#1a1a18] border border-dashed border-[#333330] min-w-[140px]">
                    <Server className="w-8 h-8 text-[#555550] mb-2" />
                    <span className="font-semibold text-[#888880]">Signaling Only</span>
                    <span className="text-xs text-[#555550]">Connection handshake</span>
                    <span className="text-xs text-[#888880] mt-1">No file data passes</span>
                  </div>

                  <ArrowRight className="w-6 h-6 text-[#555550] rotate-90 lg:rotate-0" />

                  <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-[#444440] min-w-[140px]">
                    <Network className="w-8 h-8 text-[#fefefc] mb-2" />
                    <span className="font-semibold text-[#fefefc]">Direct P2P</span>
                    <span className="text-xs text-[#888880]">End-to-end encrypted</span>
                  </div>

                  <ArrowRight className="w-6 h-6 text-[#555550] rotate-90 lg:rotate-0" />

                  <div className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-[#333330] min-w-[140px]">
                    <HardDrive className="w-8 h-8 text-[#fefefc] mb-2" />
                    <span className="font-semibold text-[#fefefc]">Recipient Device</span>
                    <span className="text-xs text-[#888880]">Decrypted locally</span>
                  </div>
                </div>
                <p className="text-center text-sm text-[#888880] mt-8">
                  Files are encrypted on your device before transfer and only decrypted on the recipient&apos;s device.
                  Our servers never see unencrypted content.
                </p>
              </div>
            </AnimatedSection>

            {/* What We Cannot See */}
            <div className="grid md:grid-cols-2 gap-6">
              <AnimatedSection delay={0.3}>
                <div className="rounded-2xl bg-[#111110] border border-[#262626] p-6 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#333330] flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-[#fefefc]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#fefefc]">What We Cannot See</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      'File contents (end-to-end encrypted)',
                      'File names or types',
                      'Who is sending to whom',
                      'Transfer timing or frequency',
                      'Your IP address (with relay mode)',
                      'Any metadata from your files'
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#fefefc] mt-0.5 shrink-0" />
                        <p className="text-sm text-[#888880]">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <div className="rounded-2xl bg-[#111110] border border-[#262626] p-6 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#333330] flex items-center justify-center">
                      <Info className="w-5 h-5 text-[#888880]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#fefefc]">Minimal Signaling Data</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      'Temporary room IDs (deleted after connection)',
                      'Encrypted WebRTC signaling (we cannot read)',
                      'ICE candidates for NAT traversal',
                      'Connection timestamps (not logged)'
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-[#888880] mt-0.5 shrink-0" />
                        <p className="text-sm text-[#888880]">{item}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[#555550] mt-6 pt-4 border-t border-[#262626]">
                    All signaling data is ephemeral and purged when connection is established or times out.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Privacy Features Grid */}
        <section className="py-24 md:py-32 border-t border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="mb-16">
              <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                Features
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#fefefc] tracking-tight mb-4">
                15+ Privacy Features
              </h2>
              <p className="text-[#888880] text-lg max-w-2xl">
                Every feature designed with privacy as the foundation, not an afterthought.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {privacyFeatures.map((feature, i) => (
                <FeatureCard
                  key={i}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  category={feature.category}
                  delay={i * 0.03}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Metadata Stripping Section */}
        <section className="py-24 md:py-32 border-t border-[#262626] bg-[#0d0d0c]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                Metadata Protection
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                Metadata Stripping
              </h2>
              <p className="text-[#888880] text-lg md:text-xl leading-relaxed">
                Your photos and documents contain hidden data that reveals your location,
                identity, and device information. See what we remove.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {metadataBeforeAfter.map((item, i) => {
                const Icon = item.icon;
                const riskStyles = {
                  critical: { bg: 'bg-white/10', border: 'border-[#555550]', text: 'text-[#fefefc]' },
                  high: { bg: 'bg-white/5', border: 'border-[#444440]', text: 'text-[#cccccc]' },
                  medium: { bg: 'bg-white/5', border: 'border-[#333330]', text: 'text-[#aaaaaa]' }
                };
                const riskStyle = riskStyles[item.risk as keyof typeof riskStyles];

                return (
                  <AnimatedSection key={i} delay={i * 0.1}>
                    <div className="rounded-2xl bg-[#111110] border border-[#262626] p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl ${riskStyle.bg} ${riskStyle.border} border flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${riskStyle.text}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#fefefc]">{item.category}</h3>
                          <span className={`text-xs uppercase tracking-wide ${riskStyle.text}`}>
                            {item.risk} privacy risk
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg ${riskStyle.bg} border ${riskStyle.border}`}>
                          <p className="text-xs font-semibold mb-2 text-[#888880]">BEFORE</p>
                          {item.before.map((line, j) => (
                            <p key={j} className="text-xs text-[#888880] font-mono truncate" title={line}>
                              {line}
                            </p>
                          ))}
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-[#333330]">
                          <p className="text-xs font-semibold mb-2 text-[#fefefc]">AFTER</p>
                          {item.after.map((line, j) => (
                            <p key={j} className="text-xs text-[#fefefc] font-mono">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>

            <AnimatedSection delay={0.4}>
              <div className="rounded-2xl bg-[#111110] border border-[#262626] p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#333330] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-[#888880]" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#fefefc] mb-2">Metadata Stripping Settings</h4>
                    <p className="text-sm text-[#888880]">
                      Metadata stripping is enabled by default in Medium, High, and Maximum privacy modes.
                      You can toggle it per-transfer or disable globally in Low privacy mode.
                      Orientation data is preserved by default to ensure photos display correctly.
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Privacy Modes */}
        <section className="py-24 md:py-32 border-t border-[#262626]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[#888880] text-sm font-semibold uppercase tracking-wider mb-4 block">
                Customization
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                Privacy Modes
              </h2>
              <p className="text-[#888880] text-lg md:text-xl leading-relaxed">
                Choose your privacy level based on your threat model and use case.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6">
              {privacyModes.map((mode, i) => (
                <PrivacyModeCard
                  key={i}
                  level={mode.level}
                  description={mode.description}
                  features={mode.features}
                  useCase={mode.useCase}
                  intensity={mode.intensity}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* GDPR & Compliance */}
        <section className="py-24 md:py-32 border-t border-[#262626] bg-[#0d0d0c]">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[#333330] flex items-center justify-center mx-auto mb-6">
                <Scale className="w-8 h-8 text-[#fefefc]" />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                Compliance & Your Rights
              </h2>
              <p className="text-[#888880] text-lg md:text-xl leading-relaxed">
                GDPR, CCPA, and global privacy regulations considered by design.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {gdprRights.map((item, i) => {
                const Icon = item.icon;
                return (
                  <AnimatedSection key={i} delay={i * 0.1}>
                    <div className="rounded-2xl bg-[#111110] border border-[#262626] p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#1a1a18] border border-[#262626] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-[#fefefc]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#fefefc] mb-2">{item.right}</h3>
                          <p className="text-sm text-[#888880]">{item.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>

            {/* Data Retention */}
            <AnimatedSection delay={0.4}>
              <div className="rounded-2xl bg-[#111110] border border-[#262626] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <FileText className="w-6 h-6 text-[#fefefc]" />
                  <h3 className="text-xl font-semibold text-[#fefefc]">Data Retention Policy</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-white/5 border border-[#333330] text-center">
                    <h4 className="font-semibold text-[#fefefc] mb-2">Server-Side Data</h4>
                    <p className="text-4xl font-bold text-[#fefefc] mb-1">0 days</p>
                    <p className="text-sm text-[#888880]">No files or metadata stored</p>
                  </div>
                  <div className="p-6 rounded-xl bg-white/5 border border-[#444440] text-center">
                    <h4 className="font-semibold text-[#fefefc] mb-2">Signaling Data</h4>
                    <p className="text-4xl font-bold text-[#fefefc] mb-1">0 sec</p>
                    <p className="text-sm text-[#888880]">Deleted after connection</p>
                  </div>
                  <div className="p-6 rounded-xl bg-white/5 border border-[#555550] text-center">
                    <h4 className="font-semibold text-[#fefefc] mb-2">Local History</h4>
                    <p className="text-4xl font-bold text-[#fefefc] mb-1">0-24h</p>
                    <p className="text-sm text-[#888880]">User-configurable</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Privacy Policy (Legal) */}
        <section className="py-24 md:py-32 border-t border-[#262626]">
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center mb-12 pb-8 border-b border-[#262626]">
              <h2 className="text-2xl md:text-3xl font-bold text-[#fefefc] mb-4">Privacy Policy</h2>
              <p className="text-[#888880]">Last updated: January 2026</p>
            </AnimatedSection>

            <div className="space-y-12">
              <AnimatedSection delay={0.1}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Overview</h3>
                <p className="text-[#888880] leading-relaxed">
                  Tallow is designed with privacy as its core principle. We do not collect, store, or process your files.
                  All transfers happen directly between devices using peer-to-peer connections. This privacy policy
                  explains what minimal data we handle and how we protect your rights.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Data We Do Not Collect</h3>
                <div className="space-y-3">
                  {[
                    'File contents - your files never pass through our servers',
                    'File names, types, or metadata',
                    'Personal information or accounts (no registration required)',
                    'IP addresses of transfer participants (relay mode available)',
                    'Transfer history, logs, or analytics',
                    'Cookies, tracking pixels, or fingerprinting data',
                    'Location data or device identifiers'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-[#888880] mt-0.5 shrink-0" />
                      <p className="text-[#888880]">{item}</p>
                    </div>
                  ))}
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Signaling Server</h3>
                <p className="text-[#888880] leading-relaxed mb-4">
                  Our signaling server facilitates the initial connection between peers. It handles:
                </p>
                <div className="space-y-2">
                  {[
                    'Temporary room IDs for connection establishment (deleted after connection)',
                    'Encrypted WebRTC signaling messages (we cannot read them)',
                    'ICE candidates for NAT traversal (not logged)'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <ChevronRight className="w-4 h-4 text-[#555550] mt-1 shrink-0" />
                      <p className="text-[#888880]">{item}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[#888880] mt-4">
                  All signaling data is ephemeral and automatically purged when the connection is established or times out.
                  We do not maintain any persistent logs of connection attempts.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.25}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Local Storage</h3>
                <p className="text-[#888880] leading-relaxed">
                  Tallow stores preferences and cryptographic keys locally in your browser using IndexedDB and localStorage.
                  This data is encrypted with AES-256-GCM using non-extractable keys and never leaves your device.
                  You can clear it at any time through your browser settings or the app&apos;s Settings page.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Third-Party Services</h3>
                <p className="text-[#888880] leading-relaxed">
                  Tallow does not integrate with any analytics, advertising, or tracking services.
                  We do not share any data with third parties. The only external services used are
                  STUN/TURN servers for WebRTC connectivity, which only see encrypted connection metadata.
                  In relay mode, TURN servers cannot see file contents due to end-to-end encryption.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.35}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Open Source</h3>
                <p className="text-[#888880] leading-relaxed">
                  Tallow is open source. You can audit the code yourself to verify our privacy claims.
                  We believe transparency is the strongest form of trust. The complete source code,
                  including all cryptographic implementations, is publicly available for review.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Your Rights</h3>
                <p className="text-[#888880] leading-relaxed">
                  Since we don&apos;t collect personal data, traditional data subject rights (access, rectification,
                  erasure, portability) apply only to locally stored data, which you fully control. There is no
                  server-side data to request, modify, or delete. Your files and transfer history exist only on
                  your own devices.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.45}>
                <h3 className="text-xl font-semibold text-[#fefefc] mb-4">Changes</h3>
                <p className="text-[#888880] leading-relaxed">
                  If we update this policy, changes will be reflected on this page with an updated date.
                  Our commitment to zero data collection will not change. Any material changes will be
                  prominently announced.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={0.5}>
                <div className="rounded-xl bg-white/5 border border-[#333330] p-6 mt-8">
                  <div className="flex items-start gap-3">
                    <UserCheck className="w-5 h-5 text-[#fefefc] mt-0.5 shrink-0" />
                    <p className="text-[#888880]">
                      <strong className="text-[#fefefc]">Questions?</strong> Tallow is open source - review the code or open an issue on GitHub.
                      We believe in transparency and are happy to explain any aspect of our privacy implementation.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 md:py-32 border-t border-[#262626] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.03] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white/[0.03] rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
            <AnimatedSection className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                Ready for{' '}
                <span className="bg-gradient-to-r from-[#fefefc] to-[#888880] bg-clip-text text-transparent">
                  private transfers
                </span>
                ?
              </h2>
              <p className="text-[#888880] text-lg md:text-xl mb-10 leading-relaxed">
                Experience true privacy with zero-knowledge file transfer.
                No accounts, no tracking, no compromises.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/app">
                  <Button
                    size="lg"
                    className="bg-[#fefefc] hover:bg-white text-[#0a0a08] font-semibold px-10 h-14 rounded-full shadow-[0_0_50px_rgba(254,254,252,0.15)] hover:shadow-[0_0_70px_rgba(254,254,252,0.2)] transition-all duration-300 text-base"
                  >
                    Start Transferring
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/security">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[#262626] bg-transparent text-[#fefefc] hover:bg-[#111110] hover:border-[#333330] px-10 h-14 rounded-full transition-all duration-300 text-base"
                  >
                    View Security Details
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
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
              <Link href="/privacy" className="text-[#fefefc] text-sm font-medium">Privacy</Link>
              <Link href="/security" className="text-[#888880] hover:text-[#fefefc] text-sm font-medium transition-colors">Security</Link>
              <Link href="/terms" className="text-[#888880] hover:text-[#fefefc] text-sm font-medium transition-colors">Terms</Link>
            </div>

            <p className="text-sm text-[#555550]">Open source - Privacy first</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
