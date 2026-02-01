'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Search,
  Shield,
  Zap,
  Folder,
  Wifi,
  Eye,
  Monitor,
  Smartphone,
  Settings,
  BookOpen,
} from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  const categories = [
    { id: 'all', label: 'All Questions', icon: BookOpen },
    { id: 'getting-started', label: 'Getting Started', icon: Zap },
    { id: 'security', label: 'Security & Encryption', icon: Shield },
    { id: 'transfers', label: 'File Transfers', icon: Folder },
    { id: 'connectivity', label: 'Connectivity', icon: Wifi },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'technical', label: 'Technical', icon: Monitor },
  ];

  const faqs: FAQ[] = [
    // Getting Started
    {
      id: 'what-is-tallow',
      question: 'What is Tallow?',
      answer: 'Tallow is a privacy-focused, peer-to-peer file sharing platform with post-quantum encryption. It enables direct transfers between devices without storing files on any server, ensuring complete privacy and unlimited file sizes. Files are encrypted end-to-end using ML-KEM-768 (formerly Kyber) combined with X25519 for quantum-safe security.',
      category: 'getting-started',
    },
    {
      id: 'how-to-start',
      question: 'How do I get started?',
      answer: 'Simply visit the app page, choose between Local Network (for same WiFi) or Internet P2P (for anywhere). To receive: generate a code and share it. To send: enter the receiver\'s code, select files, and transfer. No account or installation required - it works directly in your browser.',
      category: 'getting-started',
    },
    {
      id: 'account-required',
      question: 'Do I need to create an account?',
      answer: 'No! Tallow works without any accounts, sign-ups, or personal information. Just open the app and start sharing. Your privacy is protected because we never collect identifying information about you.',
      category: 'getting-started',
    },
    {
      id: 'is-free',
      question: 'Is Tallow free to use?',
      answer: 'Yes, Tallow is completely free and open-source. There are no file size limits, transfer limits, or hidden fees. We believe secure file sharing should be accessible to everyone.',
      category: 'getting-started',
    },
    {
      id: 'supported-browsers',
      question: 'Which browsers support Tallow?',
      answer: 'Tallow works on all modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, and their mobile versions. Internet Explorer is not supported. For the best experience, use the latest version of your browser.',
      category: 'getting-started',
    },

    // Security & Encryption
    {
      id: 'post-quantum',
      question: 'What is post-quantum encryption?',
      answer: 'Post-quantum encryption (ML-KEM-768, formerly Kyber) is a NIST-standardized encryption algorithm designed to resist attacks from quantum computers. Tallow uses hybrid encryption combining ML-KEM-768 with X25519 for maximum security against both current and future threats.',
      category: 'security',
    },
    {
      id: 'how-secure',
      question: 'How secure is Tallow?',
      answer: 'Tallow uses military-grade encryption: ML-KEM-768 (post-quantum) + X25519 (classical) for key exchange, plus ChaCha20-Poly1305 for data encryption. All encryption happens on your device before transfer. Files are never stored on servers, and we never see your data.',
      category: 'security',
    },
    {
      id: 'nist-approved',
      question: 'Is the encryption NIST approved?',
      answer: 'Yes. ML-KEM (formerly Kyber) was selected by NIST in 2024 as the primary post-quantum key encapsulation standard after years of rigorous cryptographic analysis. It is considered the gold standard for quantum-resistant encryption.',
      category: 'security',
    },
    {
      id: 'e2e-encryption',
      question: 'Is the encryption end-to-end?',
      answer: 'Yes, all encryption is end-to-end. Files are encrypted on the sender\'s device and can only be decrypted by the intended recipient. Our signaling server facilitates connections but never has access to encryption keys or file contents.',
      category: 'security',
    },
    {
      id: 'password-protection',
      question: 'How does password protection work?',
      answer: 'Password protection adds a second layer of encryption using Argon2id with 600,000 iterations and 256MB memory cost. Your file is encrypted first with the session key, then again with a key derived from your password. Even if someone intercepts the transfer, they need both keys to decrypt.',
      category: 'security',
    },
    {
      id: 'can-intercept',
      question: 'Can anyone intercept my files?',
      answer: 'While network traffic could theoretically be intercepted, it would be useless to an attacker. All data is encrypted with post-quantum algorithms before transmission. Even with unlimited computing power, the encryption cannot be broken. Only the intended recipient with the correct keys can decrypt.',
      category: 'security',
    },
    {
      id: 'quantum-computers',
      question: 'What if quantum computers never become powerful enough?',
      answer: 'Even in that scenario, you lose nothing. The hybrid approach means you still have full classical security from X25519. Post-quantum encryption is additional protection, not a replacement. Think of it as future-proof insurance.',
      category: 'security',
    },

    // File Transfers
    {
      id: 'file-size-limit',
      question: 'Is there a file size limit?',
      answer: 'No! Tallow has no file size limits. You can transfer files of any size, limited only by your available bandwidth, storage space, and browser memory. For very large files (4GB+), ensure you have sufficient RAM.',
      category: 'transfers',
    },
    {
      id: 'multiple-files',
      question: 'Can I send multiple files at once?',
      answer: 'Yes! You can select multiple files to transfer in a single session. Each file is encrypted individually and transferred sequentially or in parallel depending on your connection.',
      category: 'transfers',
    },
    {
      id: 'folder-transfer',
      question: 'Can I send entire folders?',
      answer: 'Yes! Tallow preserves folder structure when transferring directories. All files maintain their relative paths and can be reconstructed exactly on the receiving end. Click "Select Folder" instead of "Select Files" to transfer a directory.',
      category: 'transfers',
    },
    {
      id: 'resumable',
      question: 'What happens if a transfer is interrupted?',
      answer: 'Tallow supports resumable transfers for large files. If a connection drops, you can resume from where it stopped without re-transferring the entire file. This is automatic for files over 100MB.',
      category: 'transfers',
    },
    {
      id: 'transfer-speed',
      question: 'How fast are transfers?',
      answer: 'Speed depends on your connection. Local Network transfers can reach 100MB/s+ on fast WiFi. Internet P2P depends on both users\' internet speeds - typically 1-20MB/s for typical home connections. The encryption overhead is negligible.',
      category: 'transfers',
    },
    {
      id: 'group-transfer',
      question: 'Can I send to multiple people at once?',
      answer: 'Yes! Group transfer lets you send files to up to 10 recipients simultaneously. Each recipient gets their own independently encrypted copy with unique PQC keys. Individual failures do not affect other transfers.',
      category: 'transfers',
    },

    // Connectivity
    {
      id: 'local-vs-internet',
      question: 'What\'s the difference between Local Network and Internet P2P?',
      answer: 'Local Network: Fastest transfers when both devices are on the same WiFi (up to 100MB/s+), uses auto-discovery, no internet required. Internet P2P: Works anywhere in the world using connection codes, requires internet, speed depends on your connection.',
      category: 'connectivity',
    },
    {
      id: 'connection-codes',
      question: 'How do connection codes work?',
      answer: 'Connection codes are 8-character random codes that pair devices. The receiver generates a code and shares it with the sender. Codes expire after 5 minutes for security and can only be used once.',
      category: 'connectivity',
    },
    {
      id: 'code-expired',
      question: 'Why did my connection code expire?',
      answer: 'Connection codes expire after 5 minutes for security. This prevents unauthorized connection attempts if a code is shared accidentally or intercepted. Simply generate a new code and share it again.',
      category: 'connectivity',
    },
    {
      id: 'nat-traversal',
      question: 'Does Tallow work behind firewalls and NATs?',
      answer: 'Yes! Tallow includes full NAT traversal support using STUN and TURN servers. It works with all common NAT types including symmetric NATs. The TURN relay is used as a fallback when direct connections are not possible.',
      category: 'connectivity',
    },
    {
      id: 'vpn-tor',
      question: 'Can I use Tallow with VPN or Tor?',
      answer: 'Yes! Tallow automatically detects and works with VPN and Tor connections. Note that VPN/Tor will typically reduce transfer speeds due to additional routing. The post-quantum encryption provides security independent of your network.',
      category: 'connectivity',
    },

    // Privacy
    {
      id: 'metadata-removal',
      question: 'What metadata does Tallow strip?',
      answer: 'Tallow can remove EXIF data (camera info, settings), GPS coordinates, device identifiers (make, model, serial), timestamps, author/copyright info, and other metadata from images (JPEG, PNG, WebP, HEIC) and videos (MP4, MOV).',
      category: 'privacy',
    },
    {
      id: 'data-collection',
      question: 'Does Tallow collect any data?',
      answer: 'No. Tallow does not collect personal data, usage analytics, or file information. We do not use cookies for tracking. Settings are stored locally on your device. The signaling server only sees encrypted connection data, never file contents.',
      category: 'privacy',
    },
    {
      id: 'server-storage',
      question: 'Are my files stored on any server?',
      answer: 'No. Files are transferred directly between devices (peer-to-peer) and are never uploaded to or stored on any server. The signaling server only coordinates connections - it never touches file data.',
      category: 'privacy',
    },
    {
      id: 'transfer-history',
      question: 'Is my transfer history saved?',
      answer: 'Transfer history is stored locally on your device only, never on servers. You can clear it anytime from Settings > Privacy > Clear History. If you want no history at all, you can disable it in settings.',
      category: 'privacy',
    },
    {
      id: 'gdpr-compliance',
      question: 'Is Tallow GDPR compliant?',
      answer: 'Yes. Tallow is designed with privacy-by-default principles. We collect no personal data, all processing happens on-device, and you have full control over any locally stored data. The metadata stripping feature helps you share files without exposing personal information.',
      category: 'privacy',
    },

    // Features
    {
      id: 'screen-sharing',
      question: 'Does Tallow support screen sharing?',
      answer: 'Yes! Tallow includes post-quantum encrypted screen sharing. Share your screen at up to 4K resolution with audio, all encrypted with the same quantum-resistant algorithms used for file transfers.',
      category: 'features',
    },
    {
      id: 'encrypted-chat',
      question: 'Is the chat feature encrypted?',
      answer: 'Yes! Chat messages use end-to-end encryption with HMAC-SHA256 authentication, replay attack protection, and XSS prevention. Messages are transmitted in real-time and never stored on servers.',
      category: 'features',
    },
    {
      id: 'offline-mode',
      question: 'Does Tallow work offline?',
      answer: 'Partially. Tallow is a Progressive Web App (PWA) that can be installed on your device. The app interface works offline, but transfers require network connectivity since they are peer-to-peer. Local Network mode can work without internet if both devices are on the same WiFi.',
      category: 'features',
    },
    {
      id: 'friends-list',
      question: 'Can I save contacts for quick transfers?',
      answer: 'Yes! You can save frequently contacted people to your Friends list. They appear for quick transfers without needing new codes each time. Friend data is stored locally and encrypted.',
      category: 'features',
    },
    {
      id: 'my-devices',
      question: 'Can I link my own devices?',
      answer: 'Yes! The "My Devices" feature lets you link your phone, tablet, and computer for seamless transfers between your own devices. Linked devices appear automatically and connect with a single tap.',
      category: 'features',
    },

    // Mobile
    {
      id: 'mobile-support',
      question: 'Does Tallow work on mobile phones?',
      answer: 'Yes! Tallow is fully optimized for mobile browsers including Chrome, Safari, and Firefox on iOS and Android. The responsive design adapts to any screen size.',
      category: 'mobile',
    },
    {
      id: 'mobile-app',
      question: 'Is there a native mobile app?',
      answer: 'Tallow is a Progressive Web App (PWA) that can be installed to your home screen for an app-like experience. There is no separate app store download required - just visit the site and click "Install" when prompted.',
      category: 'mobile',
    },
    {
      id: 'mobile-background',
      question: 'Can I transfer in the background on mobile?',
      answer: 'Mobile browsers typically pause background tabs. For best results, keep Tallow in the foreground during transfers, keep the screen on, and disable battery saver mode. Plug in for large transfers.',
      category: 'mobile',
    },
    {
      id: 'ios-downloads',
      question: 'Where do files download on iOS?',
      answer: 'On iOS Safari, files typically download to the Files app > Downloads folder, not the Photos app. Check the Files app if you do not see your downloaded file. You can then move it to Photos if desired.',
      category: 'mobile',
    },

    // Technical
    {
      id: 'open-source',
      question: 'Is Tallow open source?',
      answer: 'Yes! Tallow is fully open source. You can review the code, audit the encryption implementation, and even self-host your own instance. Check our GitHub repository for the source code.',
      category: 'technical',
    },
    {
      id: 'self-host',
      question: 'Can I self-host Tallow?',
      answer: 'Yes! Tallow can be self-hosted on your own server or Synology NAS. This gives you complete control over your infrastructure. See our deployment documentation for instructions.',
      category: 'technical',
    },
    {
      id: 'webrtc',
      question: 'What technology does Tallow use?',
      answer: 'Tallow is built with Next.js and uses WebRTC for peer-to-peer connections. Encryption uses WebAssembly implementations of ML-KEM-768 and ChaCha20-Poly1305. The signaling server uses Socket.IO over WebSockets.',
      category: 'technical',
    },
    {
      id: 'api-available',
      question: 'Is there an API for developers?',
      answer: 'Yes! Tallow provides a developer API for integrating secure file transfers into your own applications. See the API Documentation section for code examples and integration guides.',
      category: 'technical',
    },
  ];

  const toggleFAQ = (id: string) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFAQs(newExpanded);
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const expandAll = () => {
    setExpandedFAQs(new Set(filteredFAQs.map(f => f.id)));
  };

  const collapseAll = () => {
    setExpandedFAQs(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Breadcrumb */}
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/help" className="hover:text-foreground transition-colors">
              Help Center
            </Link>
            <span>/</span>
            <span className="text-foreground">FAQ</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="section-hero-dark grid-pattern">
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Link href="/help" className="inline-flex items-center text-hero-muted hover:text-hero-fg mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Center
            </Link>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20/10 border border-white/20 mb-6">
              <HelpCircle className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">FAQ</span>
            </div>

            <h1 className="display-lg mb-6">
              Frequently Asked <span className="italic">Questions</span>
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl mb-8">
              Find answers to {faqs.length}+ common questions about Tallow's features, security, privacy, and more.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-hero-bg/50 border-hero-fg/20 text-hero-fg placeholder:text-hero-muted"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 overflow-x-auto py-4 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              const count = category.id === 'all'
                ? faqs.length
                : faqs.filter(f => f.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-primary-foreground/20' : 'bg-background'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-content-lg">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Expand All
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No questions found matching your search.</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredFAQs.map((faq) => {
                  const isExpanded = expandedFAQs.has(faq.id);
                  return (
                    <div key={faq.id} className="bg-background border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <span className="font-medium pr-4">{faq.question}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 flex-shrink-0 text-primary" />
                        ) : (
                          <ChevronDown className="w-5 h-5 flex-shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-4 pt-2 text-muted-foreground border-t border-border">
                          <p className="leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="border-t border-border py-16 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="heading-md mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-8">
              If you cannot find the answer you are looking for, check out our detailed guides or report an issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/help">
                <Button size="lg" variant="outline">
                  Browse All Guides
                </Button>
              </Link>
              <Link href="https://github.com/yourusername/tallow/issues" target="_blank">
                <Button size="lg">
                  Ask a Question
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
              tallow
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/help" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Help
              </Link>
              <Link href="/features" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Features
              </Link>
              <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Security
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Questions answered</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
