'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Zap,
  Users,
  Folder,
  MessageSquare,
  Monitor,
  Lock,
  Eye,
  Search,
  BookOpen,
  Play,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Settings,
  Upload,
  Code,
  FileText,
  ArrowRight,
  AlertCircle,
  Info,
  X,
  Keyboard,
  Terminal,
  Github,
  Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface Demo {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  demoPath: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
}

interface Guide {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  tags: string[];
  isExternal?: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  color: string;
}

// ============================================================================
// Data
// ============================================================================

const categories = [
  { id: 'all', label: 'All Topics', icon: BookOpen },
  { id: 'getting-started', label: 'Getting Started', icon: Lightbulb },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'features', label: 'Features', icon: Settings },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertCircle },
  { id: 'developer', label: 'Developer', icon: Code },
];

const demos: Demo[] = [
  {
    id: 'file-transfer',
    title: 'Basic File Transfer',
    description: 'Learn how to send files using P2P connection codes',
    icon: Upload,
    demoPath: '/app',
    difficulty: 'beginner',
    keywords: ['transfer', 'send', 'file', 'p2p', 'code'],
  },
  {
    id: 'group-transfer',
    title: 'Group Transfer',
    description: 'Send files to multiple recipients simultaneously',
    icon: Users,
    demoPath: '/app',
    difficulty: 'intermediate',
    keywords: ['group', 'multiple', 'recipients', 'batch'],
  },
  {
    id: 'password-protection',
    title: 'Password Protection',
    description: 'Add extra security with password encryption',
    icon: Lock,
    demoPath: '/app',
    difficulty: 'intermediate',
    keywords: ['password', 'security', 'encrypt', 'protect'],
  },
  {
    id: 'metadata-stripping',
    title: 'Metadata Stripping',
    description: 'Remove EXIF data and location info from images',
    icon: Eye,
    demoPath: '/metadata-demo',
    difficulty: 'beginner',
    keywords: ['metadata', 'exif', 'location', 'privacy', 'image'],
  },
  {
    id: 'screen-sharing',
    title: 'Screen Sharing',
    description: 'Share your screen with post-quantum encryption',
    icon: Monitor,
    demoPath: '/screen-share-demo',
    difficulty: 'advanced',
    keywords: ['screen', 'share', 'streaming', 'webrtc'],
  },
  {
    id: 'folder-transfer',
    title: 'Folder Transfer',
    description: 'Send entire directories with structure intact',
    icon: Folder,
    demoPath: '/app',
    difficulty: 'intermediate',
    keywords: ['folder', 'directory', 'structure', 'batch'],
  },
  {
    id: 'encrypted-chat',
    title: 'Encrypted Chat',
    description: 'Real-time messaging with end-to-end encryption',
    icon: MessageSquare,
    demoPath: '/app',
    difficulty: 'beginner',
    keywords: ['chat', 'message', 'encrypt', 'realtime'],
  },
  {
    id: 'transfer-speed',
    title: 'Transfer Speed Demo',
    description: 'See post-quantum encryption performance',
    icon: Zap,
    demoPath: '/transfer-demo',
    difficulty: 'advanced',
    keywords: ['speed', 'performance', 'benchmark', 'pqc'],
  },
];

const faqs: FAQ[] = [
  // Getting Started
  {
    id: 'what-is-tallow',
    question: 'What is Tallow?',
    answer:
      'Tallow is a privacy-focused, peer-to-peer file sharing platform with post-quantum encryption (ML-KEM-768). It enables direct transfers between devices without storing files on any server, ensuring complete privacy and unlimited file sizes.',
    category: 'getting-started',
    keywords: ['tallow', 'what', 'about', 'introduction'],
  },
  {
    id: 'how-to-start',
    question: 'How do I get started?',
    answer:
      'Simply visit the app page, choose between Local Network or Internet P2P connection, and either generate a code to receive files or enter a code to send files. No account or installation required!',
    category: 'getting-started',
    keywords: ['start', 'begin', 'how', 'first', 'setup'],
  },
  {
    id: 'account-required',
    question: 'Do I need to create an account?',
    answer:
      'No! Tallow works without any accounts, sign-ups, or personal information. Just open the app and start sharing.',
    category: 'getting-started',
    keywords: ['account', 'signup', 'register', 'login'],
  },
  {
    id: 'cost',
    question: 'Is Tallow free to use?',
    answer:
      'Yes, Tallow is completely free and open-source. There are no file size limits, transfer limits, or hidden fees.',
    category: 'getting-started',
    keywords: ['free', 'cost', 'price', 'pay'],
  },
  {
    id: 'supported-devices',
    question: 'What devices are supported?',
    answer:
      'Tallow works on any device with a modern web browser - Windows, macOS, Linux, iOS, Android, and Chrome OS. No installation required.',
    category: 'getting-started',
    keywords: ['devices', 'support', 'browser', 'mobile', 'desktop'],
  },

  // Security
  {
    id: 'post-quantum',
    question: 'What is post-quantum encryption?',
    answer:
      'Post-quantum encryption (ML-KEM-768, formerly Kyber) is a NIST-standardized encryption algorithm designed to resist attacks from quantum computers. Tallow uses hybrid encryption combining ML-KEM-768 with X25519 for maximum security.',
    category: 'security',
    keywords: ['post-quantum', 'pqc', 'kyber', 'encryption', 'quantum'],
  },
  {
    id: 'how-secure',
    question: 'How secure is Tallow?',
    answer:
      'Tallow uses military-grade encryption: ML-KEM-768 (post-quantum) + X25519 (classical) + AES-256-GCM. All encryption happens on your device before transfer. Files are never stored on servers, and we never see your data.',
    category: 'security',
    keywords: ['secure', 'security', 'safe', 'protection'],
  },
  {
    id: 'password-protection-faq',
    question: 'How does password protection work?',
    answer:
      'Password protection adds a second layer of encryption using Argon2id with 600,000 iterations. Your file is encrypted first with the session key, then again with your password. Even if someone intercepts the transfer, they need both keys to decrypt.',
    category: 'security',
    keywords: ['password', 'protection', 'argon2', 'encrypt'],
  },
  {
    id: 'metadata-removal',
    question: 'What metadata does Tallow strip?',
    answer:
      'Tallow can remove EXIF data (camera info, settings), GPS coordinates, device identifiers, timestamps, and other sensitive metadata from images (JPEG, PNG, WebP) and videos (MP4) before transfer.',
    category: 'security',
    keywords: ['metadata', 'exif', 'gps', 'strip', 'remove'],
  },
  {
    id: 'vpn-tor',
    question: 'Can I use Tallow with VPN or Tor?',
    answer:
      'Yes! Tallow automatically detects and optimizes for VPN/Tor connections. It includes onion routing simulation and traffic obfuscation for enhanced privacy.',
    category: 'security',
    keywords: ['vpn', 'tor', 'proxy', 'anonymous'],
  },
  {
    id: 'zero-knowledge',
    question: 'What is zero-knowledge architecture?',
    answer:
      'Zero-knowledge means we never have access to your files, encryption keys, or transfer history. All cryptographic operations happen locally on your device. Even if our servers were compromised, your data remains protected.',
    category: 'security',
    keywords: ['zero-knowledge', 'privacy', 'architecture', 'server'],
  },

  // Features
  {
    id: 'file-size-limit',
    question: 'Is there a file size limit?',
    answer:
      'No! Tallow has no file size limits. You can transfer files of any size, limited only by your available bandwidth and storage space.',
    category: 'features',
    keywords: ['size', 'limit', 'large', 'file'],
  },
  {
    id: 'local-vs-internet',
    question: "What's the difference between Local Network and Internet P2P?",
    answer:
      'Local Network: Fastest transfers when both devices are on the same WiFi (up to 1 Gbps+). Internet P2P: Works anywhere in the world using connection codes and NAT traversal (speed depends on your internet connection).',
    category: 'features',
    keywords: ['local', 'internet', 'network', 'wifi', 'p2p'],
  },
  {
    id: 'group-transfer-faq',
    question: 'How does group transfer work?',
    answer:
      'Group transfer lets you send files to multiple recipients at once. Each recipient gets their own encrypted copy with independent PQC keys. You can set custom passwords and expiration times for each recipient.',
    category: 'features',
    keywords: ['group', 'multiple', 'recipients', 'batch'],
  },
  {
    id: 'folder-transfer-faq',
    question: 'Can I send folders?',
    answer:
      'Yes! Tallow preserves folder structure when transferring directories. All files maintain their relative paths and can be reconstructed exactly on the receiving end.',
    category: 'features',
    keywords: ['folder', 'directory', 'structure'],
  },
  {
    id: 'resumable-transfers',
    question: 'What happens if transfer is interrupted?',
    answer:
      'Tallow supports resumable transfers. If a connection drops, you can resume from where it stopped without re-transferring the entire file.',
    category: 'features',
    keywords: ['resume', 'interrupt', 'pause', 'continue'],
  },
  {
    id: 'screen-sharing-faq',
    question: 'How does screen sharing work?',
    answer:
      'Screen sharing captures your screen at up to 4K resolution with audio, encrypts the stream with post-quantum encryption, and transmits it in real-time via WebRTC. Perfect for presentations and support.',
    category: 'features',
    keywords: ['screen', 'share', 'stream', 'video'],
  },
  {
    id: 'chat-faq',
    question: 'Is the chat feature encrypted?',
    answer:
      'Yes! Chat messages use end-to-end encryption with HMAC-SHA256 authentication, replay attack protection, and XSS prevention. Messages are never stored on servers.',
    category: 'features',
    keywords: ['chat', 'message', 'encrypt', 'secure'],
  },
  {
    id: 'offline-mode',
    question: 'Does Tallow work offline?',
    answer:
      'Tallow is a Progressive Web App (PWA) that can be installed and works offline for viewing your transfer history. However, actual file transfers require an internet or local network connection.',
    category: 'features',
    keywords: ['offline', 'pwa', 'install', 'app'],
  },

  // Troubleshooting
  {
    id: 'connection-failed',
    question: "Why can't I connect?",
    answer:
      'Common issues: 1) Check your internet connection. 2) Ensure both devices have the correct code. 3) Try regenerating the connection code. 4) Check firewall settings. 5) For local network, ensure both devices are on the same WiFi.',
    category: 'troubleshooting',
    keywords: ['connect', 'fail', 'error', 'problem'],
  },
  {
    id: 'slow-transfer',
    question: 'Why is my transfer slow?',
    answer:
      'Transfer speed depends on: 1) Your internet/WiFi speed (slowest connection matters). 2) Network congestion. 3) VPN/Tor usage (adds latency). 4) Device performance. For fastest speeds, use Local Network mode on the same WiFi.',
    category: 'troubleshooting',
    keywords: ['slow', 'speed', 'fast', 'performance'],
  },
  {
    id: 'browser-compatibility',
    question: 'Which browsers are supported?',
    answer:
      'Tallow works best on modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. WebRTC and modern crypto APIs are required. Mobile browsers are fully supported.',
    category: 'troubleshooting',
    keywords: ['browser', 'chrome', 'firefox', 'safari', 'edge'],
  },
  {
    id: 'mobile-issues',
    question: 'Issues on mobile devices?',
    answer:
      'On mobile: 1) Keep the browser tab active during transfer. 2) Disable battery saver modes. 3) Ensure stable WiFi/data connection. 4) For large files, keep device plugged in.',
    category: 'troubleshooting',
    keywords: ['mobile', 'phone', 'android', 'iphone', 'ios'],
  },
  {
    id: 'code-expired',
    question: 'My connection code expired',
    answer:
      'Connection codes are valid for 5 minutes. If expired, simply regenerate a new code and share it again. This prevents unauthorized access attempts.',
    category: 'troubleshooting',
    keywords: ['code', 'expired', 'timeout', 'regenerate'],
  },
  {
    id: 'firewall-issues',
    question: 'Firewall or corporate network issues?',
    answer:
      'If behind a strict firewall: 1) Try using a VPN. 2) Ensure WebRTC is not blocked. 3) Check if ports 443 and 3478-3479 are open. 4) Contact your IT department about WebRTC restrictions.',
    category: 'troubleshooting',
    keywords: ['firewall', 'corporate', 'blocked', 'network'],
  },

  // Developer
  {
    id: 'api-access',
    question: 'Is there an API available?',
    answer:
      'Yes! Tallow provides React hooks and TypeScript APIs for integration. Check our documentation for useP2PConnection, useFileTransfer, and usePQCTransfer hooks.',
    category: 'developer',
    keywords: ['api', 'developer', 'hooks', 'integrate'],
  },
  {
    id: 'self-host',
    question: 'Can I self-host Tallow?',
    answer:
      'Yes! Tallow is open-source and can be self-hosted. You need to run the signaling server and deploy the Next.js frontend. Docker images are available for easy deployment.',
    category: 'developer',
    keywords: ['self-host', 'deploy', 'docker', 'server'],
  },
  {
    id: 'contribute',
    question: 'How can I contribute?',
    answer:
      'Contributions are welcome! Check our GitHub repository for open issues, feature requests, and contribution guidelines. We accept bug fixes, new features, documentation, and translations.',
    category: 'developer',
    keywords: ['contribute', 'github', 'open-source', 'help'],
  },
];

const guides: Guide[] = [
  // In-depth help guides
  {
    title: 'File Transfer Guide',
    description: 'Complete walkthrough for sending and receiving files',
    icon: Upload,
    link: '/help/file-transfer',
    tags: ['Tutorial', 'Transfer', 'Step-by-Step'],
  },
  {
    title: 'Device Connection Guide',
    description: 'How to connect devices via local network or internet',
    icon: Monitor,
    link: '/help/device-connection',
    tags: ['Tutorial', 'Connection', 'Network'],
  },
  {
    title: 'Post-Quantum Encryption',
    description: 'Understanding PQC and how Tallow protects your data',
    icon: Shield,
    link: '/help/pqc-encryption',
    tags: ['Security', 'PQC', 'Encryption'],
  },
  {
    title: 'Privacy Settings Guide',
    description: 'Configure metadata stripping and privacy options',
    icon: Eye,
    link: '/help/privacy-settings',
    tags: ['Privacy', 'Settings', 'Metadata'],
  },
  {
    title: 'Troubleshooting Guide',
    description: 'Fix common connection and transfer issues quickly',
    icon: AlertCircle,
    link: '/help/troubleshooting',
    tags: ['Help', 'Issues', 'Fixes'],
  },
  {
    title: 'Complete FAQ',
    description: 'Browse 40+ answers to common questions',
    icon: HelpCircle,
    link: '/help/faq',
    tags: ['FAQ', 'Questions', 'Answers'],
  },
  // Main documentation pages
  {
    title: 'Security Architecture',
    description: "Deep dive into Tallow's encryption and security design",
    icon: Lock,
    link: '/security',
    tags: ['Security', 'Architecture', 'Technical'],
  },
  {
    title: 'Privacy Policy',
    description: 'Learn about our privacy commitments and data handling',
    icon: Eye,
    link: '/privacy',
    tags: ['Privacy', 'Policy', 'Legal'],
  },
  {
    title: 'Interactive Demos',
    description: 'Try all features with hands-on interactive demonstrations',
    icon: Play,
    link: '/ui-demo',
    tags: ['Tutorial', 'Demo', 'Hands-on'],
  },
  {
    title: 'API Documentation',
    description: 'Technical documentation for developers and integrators',
    icon: Code,
    link: '/docs',
    tags: ['Developer', 'API', 'Integration'],
  },
  {
    title: 'How It Works',
    description: 'Step-by-step explanation of P2P transfer process',
    icon: Lightbulb,
    link: '/how-it-works',
    tags: ['Tutorial', 'P2P', 'WebRTC'],
  },
  {
    title: 'All Features',
    description: 'Complete catalog of Tallow features and capabilities',
    icon: Settings,
    link: '/features',
    tags: ['Features', 'Overview', 'Catalog'],
  },
];

const quickActions: QuickAction[] = [
  {
    title: 'Start Transferring',
    description: 'Jump right in and send your first file',
    icon: Zap,
    link: '/app',
    color: 'text-green-500',
  },
  {
    title: 'How It Works',
    description: 'Learn about P2P technology and encryption',
    icon: Info,
    link: '/how-it-works',
    color: 'text-white',
  },
  {
    title: 'All Features',
    description: 'Explore everything Tallow can do',
    icon: Settings,
    link: '/features',
    color: 'text-purple-500',
  },
  {
    title: 'View Security',
    description: 'Learn about our encryption and security',
    icon: Shield,
    link: '/security',
    color: 'text-orange-500',
  },
];

const keyboardShortcuts = [
  { key: '/', description: 'Focus search' },
  { key: 'Esc', description: 'Clear search / Close expanded' },
  { key: 'j/k', description: 'Navigate FAQs' },
  { key: 'Enter', description: 'Expand/collapse FAQ' },
];

// ============================================================================
// Component
// ============================================================================

export default function HelpPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const faqRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['demos', 'faqs', 'guides'])
  );
  const [focusedFAQIndex, setFocusedFAQIndex] = useState(-1);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchesCategory) {
        return false;
      }

      if (searchQuery === '') {
        return true;
      }

      const query = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some((k) => k.includes(query))
      );
    });
  }, [searchQuery, selectedCategory]);

  // Filter demos based on search
  const filteredDemos = useMemo(() => {
    if (searchQuery === '') {
      return demos;
    }

    const query = searchQuery.toLowerCase();
    return demos.filter(
      (demo) =>
        demo.title.toLowerCase().includes(query) ||
        demo.description.toLowerCase().includes(query) ||
        demo.keywords.some((k) => k.includes(query))
    );
  }, [searchQuery]);

  // Filter guides based on search
  const filteredGuides = useMemo(() => {
    if (searchQuery === '') {
      return guides;
    }

    const query = searchQuery.toLowerCase();
    return guides.filter(
      (guide) =>
        guide.title.toLowerCase().includes(query) ||
        guide.description.toLowerCase().includes(query) ||
        guide.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Toggle FAQ expansion
  const toggleFAQ = useCallback((id: string) => {
    setExpandedFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Expand all FAQs
  const expandAllFAQs = useCallback(() => {
    setExpandedFAQs(new Set(filteredFAQs.map((f) => f.id)));
  }, [filteredFAQs]);

  // Collapse all FAQs
  const collapseAllFAQs = useCallback(() => {
    setExpandedFAQs(new Set());
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }

      // Clear search on Escape
      if (e.key === 'Escape') {
        if (searchQuery) {
          clearSearch();
        } else if (expandedFAQs.size > 0) {
          collapseAllFAQs();
        }
        setShowKeyboardHelp(false);
      }

      // Show keyboard help on ?
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
      }

      // FAQ navigation with j/k
      if (filteredFAQs.length > 0) {
        if (e.key === 'j') {
          e.preventDefault();
          setFocusedFAQIndex((prev) => Math.min(prev + 1, filteredFAQs.length - 1));
        }
        if (e.key === 'k') {
          e.preventDefault();
          setFocusedFAQIndex((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter' && focusedFAQIndex >= 0) {
          const faq = filteredFAQs[focusedFAQIndex];
          if (faq) {
            toggleFAQ(faq.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    searchQuery,
    clearSearch,
    expandedFAQs.size,
    collapseAllFAQs,
    filteredFAQs,
    focusedFAQIndex,
    toggleFAQ,
  ]);

  // Focus management for FAQ navigation
  useEffect(() => {
    if (focusedFAQIndex >= 0 && focusedFAQIndex < filteredFAQs.length) {
      const faq = filteredFAQs[focusedFAQIndex];
      if (faq) {
        const ref = faqRefs.current.get(faq.id);
        ref?.focus();
      }
    }
  }, [focusedFAQIndex, filteredFAQs]);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const difficultyColors = {
    beginner: 'text-green-600 bg-green-500/10 border-green-500/20',
    intermediate: 'text-white bg-white/20/10 border-white/20',
    advanced: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started':
        return Lightbulb;
      case 'security':
        return Shield;
      case 'features':
        return Settings;
      case 'troubleshooting':
        return AlertCircle;
      case 'developer':
        return Code;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-help-title"
        >
          {/* Backdrop button for closing */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={() => setShowKeyboardHelp(false)}
            aria-label="Close dialog"
          />
          <div
            className="relative bg-background border border-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="keyboard-help-title" className="text-xl font-semibold flex items-center gap-3">
                <Keyboard className="w-6 h-6" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close keyboard shortcuts help"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-4">
              {keyboardShortcuts.map((shortcut) => (
                <li key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-base text-muted-foreground">{shortcut.description}</span>
                  <kbd className="px-3 py-1.5 text-sm bg-secondary rounded-lg border border-border font-mono">
                    {shortcut.key}
                  </kbd>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-6">
              Press <kbd className="px-2 py-0.5 bg-secondary rounded-lg text-sm">?</kbd> to toggle this help
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="section-hero-dark grid-pattern" aria-labelledby="help-title">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <HelpCircle className="w-4 h-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium text-primary">Help Center</span>
            </div>

            <h1 id="help-title" className="text-display-xl mb-8">
              How can we <span className="italic">help</span> you?
            </h1>

            <p className="text-body-xl text-hero-muted max-w-2xl mx-auto mb-10">
              Find answers, explore features, and learn everything about Tallow
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <label htmlFor="help-search" className="sr-only">
                Search help articles, guides, or FAQs
              </label>
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={searchInputRef}
                id="help-search"
                type="search"
                placeholder="Search for help articles, guides, or FAQs... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-14 h-16 text-base sm:text-lg bg-hero-bg/50 border-hero-fg/20 text-hero-fg placeholder:text-hero-muted rounded-2xl"
                aria-describedby="search-hint"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-hero-fg/10 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-5 h-5 text-hero-muted" />
                </button>
              )}
              <span id="search-hint" className="sr-only">
                Press forward slash to focus search, Escape to clear
              </span>
            </div>

            {/* Quick Stats */}
            <div
              className="grid grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mt-12 sm:mt-16 max-w-xl mx-auto"
              role="list"
              aria-label="Help center statistics"
            >
              <div role="listitem" className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-2">{demos.length}</div>
                <div className="text-sm sm:text-base text-hero-muted">Interactive Demos</div>
              </div>
              <div role="listitem" className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-2">{faqs.length}</div>
                <div className="text-sm sm:text-base text-hero-muted">FAQ Articles</div>
              </div>
              <div role="listitem" className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-2">{guides.length}</div>
                <div className="text-sm sm:text-base text-hero-muted">In-Depth Guides</div>
              </div>
            </div>

            {/* Quick Navigation */}
            <nav className="flex flex-wrap justify-center gap-3 mt-10" aria-label="Quick navigation">
              <button
                onClick={() => scrollToSection('demos-section')}
                className="px-4 py-2 text-sm font-medium bg-hero-fg/10 hover:bg-hero-fg/20 rounded-full transition-colors"
              >
                Demos
              </button>
              <button
                onClick={() => scrollToSection('faq-section')}
                className="px-4 py-2 text-sm font-medium bg-hero-fg/10 hover:bg-hero-fg/20 rounded-full transition-colors"
              >
                FAQs
              </button>
              <button
                onClick={() => scrollToSection('guides-section')}
                className="px-4 py-2 text-sm font-medium bg-hero-fg/10 hover:bg-hero-fg/20 rounded-full transition-colors"
              >
                Guides
              </button>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="px-4 py-2 text-sm font-medium bg-hero-fg/10 hover:bg-hero-fg/20 rounded-full transition-colors flex items-center gap-1.5"
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>
            </nav>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section
        className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm"
        aria-label="Filter by category"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-4 sm:py-5 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Help categories"
          >
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              const count =
                category.id === 'all'
                  ? faqs.length
                  : faqs.filter((f) => f.category === category.id).length;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setFocusedFAQIndex(-1);
                  }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="faq-list"
                  className={cn(
                    'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium">{category.label}</span>
                  <span
                    className={cn(
                      'text-xs px-1.5 rounded-full',
                      isActive ? 'bg-primary-foreground/20' : 'bg-background/50'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="main-content">
        {/* Search Results Summary */}
        {searchQuery && (
          <div
            className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 border-b border-border"
            role="status"
            aria-live="polite"
          >
            <p className="text-base text-muted-foreground">
              Found {filteredDemos.length} demos, {filteredFAQs.length} FAQs, and{' '}
              {filteredGuides.length} guides for "{searchQuery}"
              <button onClick={clearSearch} className="ml-3 text-primary hover:underline font-medium">
                Clear search
              </button>
            </p>
          </div>
        )}

        {/* Interactive Demos Section */}
        <section
          id="demos-section"
          className="py-16 sm:py-20 lg:py-24 scroll-mt-20"
          aria-labelledby="demos-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 sm:mb-14 lg:mb-16">
              <button
                onClick={() => toggleSection('demos')}
                className="flex items-center gap-4 mb-6 group w-full text-left"
                aria-expanded={expandedSections.has('demos')}
                aria-controls="demos-content"
              >
                <div className="flex items-center gap-4">
                  <Play className="w-7 h-7 text-primary" aria-hidden="true" />
                  <h2 id="demos-heading" className="text-display-sm">
                    Interactive Demos
                  </h2>
                </div>
                <ChevronDown
                  className={cn(
                    'w-6 h-6 transition-transform',
                    expandedSections.has('demos') ? 'rotate-180' : ''
                  )}
                  aria-hidden="true"
                />
                <span className="ml-auto text-base text-muted-foreground">
                  {filteredDemos.length} demos
                </span>
              </button>
              <p className="text-body-lg text-muted-foreground max-w-3xl">
                Learn by doing. Try out Tallow's features with hands-on interactive demonstrations.
              </p>
            </div>

            {expandedSections.has('demos') && (
              <div
                id="demos-content"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8"
                role="list"
                aria-label="Interactive demos"
              >
                {filteredDemos.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <Search
                      className="w-14 h-14 text-muted-foreground mx-auto mb-6 opacity-50"
                      aria-hidden="true"
                    />
                    <p className="text-lg text-muted-foreground">
                      No demos found for "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                ) : (
                  filteredDemos.map((demo) => {
                    const Icon = demo.icon;

                    return (
                      <Link
                        key={demo.id}
                        href={demo.demoPath}
                        className="group p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        role="listitem"
                        aria-label={`${demo.title} - ${demo.difficulty} difficulty`}
                      >
                        <div className="flex items-start justify-between mb-5">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                            aria-hidden="true"
                          >
                            <Icon className="w-7 h-7" />
                          </div>
                          <span
                            className={cn(
                              'text-xs font-medium px-3 py-1.5 rounded-full border',
                              difficultyColors[demo.difficulty]
                            )}
                          >
                            {demo.difficulty}
                          </span>
                        </div>

                        <h3 className="text-heading-sm mb-3 group-hover:text-primary transition-colors">
                          {demo.title}
                        </h3>
                        <p className="text-body-sm text-muted-foreground mb-5">{demo.description}</p>

                        <div className="flex items-center text-primary text-sm font-semibold">
                          Try Demo
                          <ArrowRight
                            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                            aria-hidden="true"
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq-section"
          className="py-16 sm:py-20 lg:py-24 border-t border-border bg-secondary/30 scroll-mt-20"
          aria-labelledby="faq-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 sm:mb-14 lg:mb-16">
              <button
                onClick={() => toggleSection('faqs')}
                className="flex items-center gap-4 mb-6 group w-full text-left"
                aria-expanded={expandedSections.has('faqs')}
                aria-controls="faq-content"
              >
                <div className="flex items-center gap-4">
                  <BookOpen className="w-7 h-7 text-primary" aria-hidden="true" />
                  <h2 id="faq-heading" className="text-display-sm">
                    Frequently Asked Questions
                  </h2>
                </div>
                <ChevronDown
                  className={cn(
                    'w-6 h-6 transition-transform',
                    expandedSections.has('faqs') ? 'rotate-180' : ''
                  )}
                  aria-hidden="true"
                />
                <span className="ml-auto text-base text-muted-foreground">
                  {filteredFAQs.length} questions
                </span>
              </button>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <p className="text-body-lg text-muted-foreground max-w-3xl">
                  Find quick answers to common questions about Tallow's features and security.
                </p>
                {expandedSections.has('faqs') && filteredFAQs.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      onClick={expandAllFAQs}
                      className="text-sm font-medium text-primary hover:underline"
                      aria-label="Expand all FAQ items"
                    >
                      Expand all
                    </button>
                    <span className="text-muted-foreground">|</span>
                    <button
                      onClick={collapseAllFAQs}
                      className="text-sm font-medium text-primary hover:underline"
                      aria-label="Collapse all FAQ items"
                    >
                      Collapse all
                    </button>
                  </div>
                )}
              </div>
            </div>

            {expandedSections.has('faqs') && (
              <div
                id="faq-content"
                className="max-w-4xl mx-auto space-y-4"
                role="list"
                aria-label="FAQ list"
              >
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-16" role="status">
                    <Search
                      className="w-14 h-14 text-muted-foreground mx-auto mb-6 opacity-50"
                      aria-hidden="true"
                    />
                    <p className="text-lg text-muted-foreground">
                      No results found. Try a different search term or category.
                    </p>
                  </div>
                ) : (
                  filteredFAQs.map((faq, index) => {
                    const isExpanded = expandedFAQs.has(faq.id);
                    const isFocused = focusedFAQIndex === index;
                    const CategoryIcon = getCategoryIcon(faq.category);

                    return (
                      <div
                        key={faq.id}
                        className={cn(
                          'bg-background border rounded-xl overflow-hidden transition-all',
                          isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        )}
                      >
                        <button
                          ref={(el) => {
                            if (el) {
                              faqRefs.current.set(faq.id, el);
                            }
                          }}
                          onClick={() => toggleFAQ(faq.id)}
                          onFocus={() => setFocusedFAQIndex(index)}
                          className="w-full px-5 sm:px-7 py-5 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors focus:outline-none focus-visible:bg-secondary/50"
                          aria-expanded={isExpanded}
                          aria-controls={`faq-answer-${faq.id}`}
                          id={`faq-question-${faq.id}`}
                        >
                          <div className="flex items-center gap-4 pr-4 flex-1 min-w-0">
                            <CategoryIcon
                              className="w-5 h-5 text-muted-foreground flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium text-base truncate">{faq.question}</span>
                          </div>
                          <ChevronRight
                            className={cn(
                              'w-5 h-5 flex-shrink-0 transition-transform',
                              isExpanded ? 'rotate-90 text-primary' : 'text-muted-foreground'
                            )}
                            aria-hidden="true"
                          />
                        </button>
                        <div
                          id={`faq-answer-${faq.id}`}
                          role="region"
                          aria-labelledby={`faq-question-${faq.id}`}
                          className={cn(
                            'overflow-hidden transition-all duration-300',
                            isExpanded ? 'max-h-96' : 'max-h-0'
                          )}
                        >
                          <div className="px-5 sm:px-7 pb-6 pt-3 text-muted-foreground border-t border-border">
                            <p className="leading-relaxed text-base">{faq.answer}</p>
                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-sm text-muted-foreground/60">Category:</span>
                              <span className="text-sm px-3 py-1 rounded-lg bg-secondary capitalize">
                                {faq.category.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>

        {/* In-Depth Guides */}
        <section
          id="guides-section"
          className="py-16 sm:py-20 lg:py-24 border-t border-border scroll-mt-20"
          aria-labelledby="guides-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 sm:mb-14 lg:mb-16">
              <button
                onClick={() => toggleSection('guides')}
                className="flex items-center gap-4 mb-6 group w-full text-left"
                aria-expanded={expandedSections.has('guides')}
                aria-controls="guides-content"
              >
                <div className="flex items-center gap-4">
                  <FileText className="w-7 h-7 text-primary" aria-hidden="true" />
                  <h2 id="guides-heading" className="text-display-sm">
                    In-Depth Guides
                  </h2>
                </div>
                <ChevronDown
                  className={cn(
                    'w-6 h-6 transition-transform',
                    expandedSections.has('guides') ? 'rotate-180' : ''
                  )}
                  aria-hidden="true"
                />
                <span className="ml-auto text-base text-muted-foreground">
                  {filteredGuides.length} guides
                </span>
              </button>
              <p className="text-body-lg text-muted-foreground max-w-3xl">
                Comprehensive documentation covering security architecture, privacy features, and
                technical details.
              </p>
            </div>

            {expandedSections.has('guides') && (
              <div
                id="guides-content"
                className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-8 max-w-5xl mx-auto"
                role="list"
                aria-label="Documentation guides"
              >
                {filteredGuides.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <Search
                      className="w-14 h-14 text-muted-foreground mx-auto mb-6 opacity-50"
                      aria-hidden="true"
                    />
                    <p className="text-lg text-muted-foreground">
                      No guides found for "{searchQuery}". Try a different search term.
                    </p>
                  </div>
                ) : (
                  filteredGuides.map((guide) => {
                    const Icon = guide.icon;
                    return (
                      <Link
                        key={guide.title}
                        href={guide.link}
                        className="group p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        role="listitem"
                        target={guide.isExternal ? '_blank' : undefined}
                        rel={guide.isExternal ? 'noopener noreferrer' : undefined}
                        aria-label={`${guide.title} - ${guide.description}`}
                      >
                        <div className="flex items-start gap-5 mb-5">
                          <div
                            className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all flex-shrink-0"
                            aria-hidden="true"
                          >
                            <Icon className="w-8 h-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-heading-sm mb-3 group-hover:text-primary transition-colors">
                              {guide.title}
                            </h3>
                            <p className="text-body-sm text-muted-foreground">{guide.description}</p>
                          </div>
                        </div>

                        <div
                          className="flex items-center flex-wrap gap-2.5 mb-5"
                          aria-label="Guide tags"
                        >
                          {guide.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center text-primary text-sm font-semibold">
                          Read Guide
                          {guide.isExternal ? (
                            <ExternalLink
                              className="w-4 h-4 ml-2"
                              aria-label="(opens in new tab)"
                            />
                          ) : (
                            <ArrowRight
                              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section
          className="py-16 sm:py-20 lg:py-24 border-t border-border bg-secondary/30"
          aria-labelledby="quick-links-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 id="quick-links-heading" className="text-display-sm text-center mb-12 sm:mb-16">
                Quick Actions
              </h2>

              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8"
                role="list"
                aria-label="Quick action links"
              >
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.title}
                      href={action.link}
                      className="p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl text-center group hover:shadow-lg transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      role="listitem"
                      aria-label={`${action.title} - ${action.description}`}
                    >
                      <Icon className={cn('w-10 h-10 mx-auto mb-5', action.color)} aria-hidden="true" />
                      <h3 className="text-heading-sm mb-3">{action.title}</h3>
                      <p className="text-body-sm text-muted-foreground">{action.description}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section
          className="py-16 sm:py-20 lg:py-24 border-t border-border"
          aria-labelledby="resources-heading"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 id="resources-heading" className="text-display-sm text-center mb-12 sm:mb-16">
                Additional Resources
              </h2>

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8"
                role="list"
                aria-label="Additional resources"
              >
                <div className="p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl" role="listitem">
                  <div className="flex items-center gap-4 mb-5">
                    <Github className="w-7 h-7 text-primary" aria-hidden="true" />
                    <h3 className="text-heading-sm">GitHub Repository</h3>
                  </div>
                  <p className="text-body-sm text-muted-foreground mb-5">
                    View source code, report issues, and contribute to the project.
                  </p>
                  <Link
                    href="https://github.com/AamirAlam/tallow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                    aria-label="Visit GitHub repository (opens in new tab)"
                  >
                    Visit Repository
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Link>
                </div>

                <div className="p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl" role="listitem">
                  <div className="flex items-center gap-4 mb-5">
                    <Terminal className="w-7 h-7 text-primary" aria-hidden="true" />
                    <h3 className="text-heading-sm">Developer API</h3>
                  </div>
                  <p className="text-body-sm text-muted-foreground mb-5">
                    Integrate Tallow into your applications with our TypeScript API.
                  </p>
                  <Link
                    href="/docs"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  >
                    View Documentation
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Link>
                </div>

                <div className="p-6 sm:p-7 lg:p-8 bg-card border border-border rounded-2xl" role="listitem">
                  <div className="flex items-center gap-4 mb-5">
                    <Mail className="w-7 h-7 text-primary" aria-hidden="true" />
                    <h3 className="text-heading-sm">Contact Support</h3>
                  </div>
                  <p className="text-body-sm text-muted-foreground mb-5">
                    Can't find what you're looking for? Get in touch with us directly.
                  </p>
                  <Link
                    href="https://github.com/AamirAlam/tallow/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                    aria-label="Report an issue on GitHub (opens in new tab)"
                  >
                    Report an Issue
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 sm:py-24 lg:py-32 bg-secondary" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 id="cta-heading" className="text-display-md mb-8">
                Ready to get started?
              </h2>
              <p className="text-body-xl text-muted-foreground mb-10">
                Experience secure, private file sharing with post-quantum encryption.
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Link href="/app">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 text-base"
                    aria-label="Start transferring files now"
                  >
                    Start Transferring
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-base"
                    aria-label="Learn how Tallow works"
                  >
                    Learn How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-10 sm:py-14 lg:py-16 bg-background" role="contentinfo">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <Link
              href="/"
              className="text-2xl tracking-tight lowercase font-serif text-foreground"
              aria-label="Tallow home"
            >
              tallow
            </Link>
            <nav
              className="flex items-center flex-wrap justify-center gap-5 sm:gap-8"
              aria-label="Footer navigation"
            >
              <Link
                href="/features"
                className="text-sm font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Features
              </Link>
              <Link
                href="/help"
                className="text-sm font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                aria-current="page"
              >
                Help
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Privacy
              </Link>
              <Link
                href="/security"
                className="text-sm font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Security
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Terms
              </Link>
            </nav>
            <p className="text-base text-muted-foreground">Open source - Privacy first</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
