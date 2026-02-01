import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Code,
  Shield,
  Zap,
  Book,
  Terminal,
  GitBranch,
  Package,
  ArrowRight,
  ExternalLink,
  Eye,
} from 'lucide-react';

const apiSections = [
    {
      title: 'Getting Started',
      icon: Book,
      items: [
        { name: 'Introduction', description: 'Overview of Tallow API' },
        { name: 'Installation', description: 'Setup and dependencies' },
        { name: 'Quick Start', description: 'Your first transfer in 5 minutes' },
        { name: 'Configuration', description: 'Environment setup and options' },
      ],
    },
    {
      title: 'Core Features',
      icon: Zap,
      items: [
        { name: 'File Transfer API', description: 'P2P file transfer methods' },
        { name: 'PQC Encryption', description: 'Post-quantum cryptography integration' },
        { name: 'WebRTC Connections', description: 'Real-time communication setup' },
        { name: 'Signaling Protocol', description: 'Connection negotiation' },
      ],
    },
    {
      title: 'Security',
      icon: Shield,
      items: [
        { name: 'Key Management', description: 'PQC and classical key handling' },
        { name: 'Password Protection', description: 'Argon2id implementation' },
        { name: 'Metadata Stripping', description: 'Privacy-preserving tools' },
        { name: 'Onion Routing', description: 'Traffic obfuscation' },
      ],
    },
    {
      title: 'Advanced',
      icon: Terminal,
      items: [
        { name: 'Group Transfer', description: 'Multi-recipient transfers' },
        { name: 'Resumable Transfers', description: 'Checkpoint system' },
        { name: 'Screen Sharing', description: 'Real-time streaming API' },
        { name: 'Encrypted Chat', description: 'Secure messaging protocol' },
      ],
    },
];

const codeExamples = [
    {
      title: 'Basic File Transfer',
      language: 'TypeScript',
      code: `import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';
import { useFileTransfer } from '@/lib/hooks/use-file-transfer';

function FileTransfer() {
  const { connect, isConnected } = useP2PConnection();
  const { sendFile, progress } = useFileTransfer();

  const handleSend = async (file: File) => {
    await connect('connection-code');
    await sendFile(file);
  };

  return <button onClick={() => handleSend(file)}>Send</button>;
}`,
    },
    {
      title: 'PQC Encryption',
      language: 'TypeScript',
      code: `import { pqCrypto } from '@/lib/crypto/pqc-crypto';

// Generate PQC key pair
const { publicKey, privateKey } = await pqCrypto.generateKeyPair();

// Encrypt data
const { ciphertext, nonce } = await pqCrypto.encrypt(
  data,
  sessionKey
);

// Decrypt data
const decrypted = await pqCrypto.decrypt(
  { ciphertext, nonce },
  sessionKey
);`,
    },
    {
      title: 'Group Transfer',
      language: 'TypeScript',
      code: `import { GroupTransferManager } from '@/lib/transfer/group-transfer-manager';

const manager = new GroupTransferManager();

// Add recipients
manager.addRecipient({
  id: 'user-1',
  name: 'Alice',
  publicKey: alicePublicKey,
});

// Send to all
await manager.sendToAll(files);`,
    },
  ];

const resources = [
  {
    title: 'Help Center',
    description: 'User guides, FAQs, and tutorials',
    icon: Book,
    link: '/help',
    external: false,
  },
  {
    title: 'Architecture Overview',
    description: 'System design and component interaction',
    icon: GitBranch,
    link: '/security',
    external: false,
  },
  {
    title: 'Security Audit',
    description: 'Third-party security review results',
    icon: Shield,
    link: '/security',
    external: false,
  },
  {
    title: 'GitHub Repository',
    description: 'Source code and issue tracking',
    icon: Package,
    link: 'https://github.com/yourusername/tallow',
    external: true,
  },
  {
    title: 'Privacy Policy',
    description: 'How we handle your data',
    icon: Eye,
    link: '/privacy',
    external: false,
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero Section */}
      <section className="section-hero-dark grid-pattern">
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Code className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">Developer Documentation</span>
            </div>

            <h1 className="display-xl mb-6">
              Build with <span className="italic">Tallow</span>
            </h1>

            <p className="body-xl text-hero-muted max-w-2xl mx-auto mb-8">
              Complete API documentation, code examples, and integration guides for building secure file transfer applications.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#quick-start">
                <Button size="lg" variant="outline" className="border-hero-fg text-hero-fg hover:bg-hero-fg hover:text-hero-bg">
                  Quick Start
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="https://github.com/yourusername/tallow" target="_blank">
                <Button size="lg">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* API Sections */}
      <section className="section-content-lg border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="display-md mb-4">API Documentation</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate Tallow's secure file transfer capabilities into your application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {apiSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="card-feature">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="heading-md">{section.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <button
                        key={item.name}
                        className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors group"
                      >
                        <div className="font-medium mb-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section id="quick-start" className="section-content-lg border-t border-border bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="display-md mb-4">Code Examples</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Ready-to-use code snippets to jumpstart your integration.
            </p>
          </div>

          <div className="space-y-8 max-w-5xl mx-auto">
            {codeExamples.map((example) => (
              <div key={example.title} className="bg-background border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-medium">{example.title}</h3>
                  <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {example.language}
                  </span>
                </div>
                <div className="p-6">
                  <pre className="overflow-x-auto text-sm">
                    <code className="font-mono text-muted-foreground">{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="section-content border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="display-md mb-4">Additional Resources</h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Explore more documentation, guides, and community resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {resources.map((resource) => {
              const Icon = resource.icon;
              const LinkComponent = resource.external ? 'a' : Link;
              const linkProps = resource.external
                ? { href: resource.link, target: '_blank', rel: 'noopener noreferrer' }
                : { href: resource.link };

              return (
                <LinkComponent
                  key={resource.title}
                  {...linkProps}
                  className="group card-feature hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="heading-sm group-hover:text-primary transition-colors">
                          {resource.title}
                        </h3>
                        {resource.external && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <p className="body-sm text-muted-foreground">{resource.description}</p>
                    </div>
                  </div>
                </LinkComponent>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-dark">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="display-md mb-6">Ready to start building?</h2>
            <p className="body-xl text-hero-muted mb-8">
              Integrate Tallow's secure file transfer into your application today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" variant="outline" className="border-hero-fg text-hero-fg hover:bg-hero-fg hover:text-hero-bg">
                  Try Live Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="https://github.com/yourusername/tallow" target="_blank">
                <Button size="lg">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Fork on GitHub
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
              <Link
                href="/features"
                className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Features
              </Link>
              <Link
                href="/help"
                className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Help
              </Link>
              <Link
                href="/docs"
                className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                API Docs
              </Link>
              <Link
                href="/privacy"
                className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Privacy
              </Link>
              <Link
                href="/security"
                className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
              >
                Security
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Open source • Privacy first</p>
          </div>
        </div>
      </footer>
    </div>
  );
}