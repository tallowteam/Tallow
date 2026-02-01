import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Download,
  Wifi,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Folder,
  Users,
  BookOpen,
  QrCode,
  Monitor,
  Smartphone,
} from 'lucide-react';

export default function FileTransferGuidePage() {
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
            <span className="text-foreground">File Transfer Guide</span>
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
              <Upload className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Tutorial</span>
            </div>

            <h1 className="display-lg mb-6">
              Complete <span className="italic">File Transfer</span> Guide
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl">
              Learn how to send and receive files using Tallow's secure peer-to-peer transfer system.
              Step-by-step instructions for all transfer modes.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-content-lg">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Table of Contents */}
            <div className="bg-secondary/30 rounded-lg p-6 mb-12">
              <h2 className="heading-md mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                In This Guide
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#transfer-modes" className="hover:text-primary transition-colors">
                    1. Understanding Transfer Modes
                  </a>
                </li>
                <li>
                  <a href="#sending-files" className="hover:text-primary transition-colors">
                    2. How to Send Files
                  </a>
                </li>
                <li>
                  <a href="#receiving-files" className="hover:text-primary transition-colors">
                    3. How to Receive Files
                  </a>
                </li>
                <li>
                  <a href="#folder-transfer" className="hover:text-primary transition-colors">
                    4. Sending Folders
                  </a>
                </li>
                <li>
                  <a href="#group-transfer" className="hover:text-primary transition-colors">
                    5. Group Transfer (Multiple Recipients)
                  </a>
                </li>
                <li>
                  <a href="#advanced-options" className="hover:text-primary transition-colors">
                    6. Advanced Options
                  </a>
                </li>
                <li>
                  <a href="#tips" className="hover:text-primary transition-colors">
                    7. Tips for Best Performance
                  </a>
                </li>
              </ul>
            </div>

            {/* Section 1: Transfer Modes */}
            <section id="transfer-modes" className="mb-16">
              <h2 className="display-sm mb-6">1. Understanding Transfer Modes</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow offers two transfer modes optimized for different situations. Both use the
                same quantum-safe encryption but differ in how devices connect.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-white/20/10 flex items-center justify-center mb-4">
                    <Wifi className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="heading-sm mb-2">Local Network</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Best for devices on the same WiFi network. Fastest possible speeds with
                    direct device-to-device connection.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Speeds up to 1 Gbps+</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Auto-discovery of devices</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>QR code pairing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>No internet required</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="heading-sm mb-2">Internet P2P</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    For transferring to anyone, anywhere in the world. Uses connection codes
                    for easy pairing.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Works anywhere globally</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Simple connection codes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>NAT traversal included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>TURN fallback for reliability</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/20/10 border border-white/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">Which Should I Choose?</h3>
                    <p className="text-muted-foreground">
                      Use <strong>Local Network</strong> when both devices are on the same WiFi
                      (same home/office). Use <strong>Internet P2P</strong> when devices are in
                      different locations. When in doubt, Internet P2P always works.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Sending Files */}
            <section id="sending-files" className="mb-16">
              <h2 className="display-sm mb-6">2. How to Send Files</h2>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Internet P2P Method
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Open Tallow App</h4>
                        <p className="text-sm text-muted-foreground">
                          Navigate to <Link href="/app" className="text-primary hover:underline">/app</Link> in your browser
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Select "Internet P2P" Tab</h4>
                        <p className="text-sm text-muted-foreground">
                          Click on the Internet P2P tab to enable global transfers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Get Connection Code</h4>
                        <p className="text-sm text-muted-foreground">
                          Ask the receiver to generate a code and share it with you
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Enter Code & Connect</h4>
                        <p className="text-sm text-muted-foreground">
                          Type the 8-character code and click "Connect"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">5</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Select Files</h4>
                        <p className="text-sm text-muted-foreground">
                          Click "Select Files" or drag and drop files onto the transfer area
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Transfer Begins</h4>
                        <p className="text-sm text-muted-foreground">
                          Watch the progress bar as your file is encrypted and transferred
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-primary" />
                    Local Network Method
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Open App on Both Devices</h4>
                        <p className="text-sm text-muted-foreground">
                          Make sure both devices are connected to the same WiFi network
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Select "Local Network" Tab</h4>
                        <p className="text-sm text-muted-foreground">
                          Devices will automatically discover each other
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Select Receiving Device</h4>
                        <p className="text-sm text-muted-foreground">
                          Click on the device you want to send to from the list
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Optional: Scan QR Code</h4>
                        <p className="text-sm text-muted-foreground">
                          For faster pairing, scan the QR code displayed on the other device
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Drop Files to Transfer</h4>
                        <p className="text-sm text-muted-foreground">
                          Drag files onto the connected device card to start transfer
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Receiving Files */}
            <section id="receiving-files" className="mb-16">
              <h2 className="display-sm mb-6">3. How to Receive Files</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Receiving files is even simpler than sending. Here is how:
              </p>

              <div className="bg-background border border-border rounded-lg p-6 mb-6">
                <h3 className="heading-sm mb-4">Internet P2P Receiving</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs text-primary-foreground">1</div>
                    <p className="text-muted-foreground">
                      Click <strong>"Generate Code"</strong> to create your unique connection code
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs text-primary-foreground">2</div>
                    <p className="text-muted-foreground">
                      Share the 8-character code with the sender (via text, call, etc.)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs text-primary-foreground">3</div>
                    <p className="text-muted-foreground">
                      Wait for the sender to connect (status will update)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <p className="text-muted-foreground">
                      Files automatically download when transfer completes
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Code Expiration</h3>
                    <p className="text-muted-foreground">
                      Connection codes expire after <strong>5 minutes</strong> for security.
                      If a code expires, simply generate a new one. This prevents unauthorized
                      connection attempts.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Folder Transfer */}
            <section id="folder-transfer" className="mb-16">
              <h2 className="display-sm mb-6">4. Sending Folders</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow supports transferring entire folder structures with all subfolders and files intact.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background border border-border rounded-lg p-6">
                  <Folder className="w-8 h-8 text-primary mb-4" />
                  <h3 className="heading-sm mb-2">Structure Preserved</h3>
                  <p className="text-sm text-muted-foreground">
                    All folder hierarchies and file relationships are maintained exactly
                    as they were on the source device.
                  </p>
                </div>
                <div className="bg-background border border-border rounded-lg p-6">
                  <Shield className="w-8 h-8 text-primary mb-4" />
                  <h3 className="heading-sm mb-2">Same Encryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Each file in the folder is individually encrypted with the same
                    post-quantum protection as single file transfers.
                  </p>
                </div>
              </div>

              <div className="bg-background border border-border rounded-lg p-6">
                <h3 className="font-medium mb-4">How to Send a Folder:</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Click <strong>"Select Folder"</strong> instead of "Select Files"</li>
                  <li>Choose the folder you want to send</li>
                  <li>Review the folder contents in the preview</li>
                  <li>Click <strong>"Send"</strong> to start the transfer</li>
                  <li>Receiver gets the complete folder structure</li>
                </ol>
              </div>
            </section>

            {/* Section 5: Group Transfer */}
            <section id="group-transfer" className="mb-16">
              <h2 className="display-sm mb-6">5. Group Transfer (Multiple Recipients)</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Send files to multiple people at once. Each recipient gets their own
                independently encrypted copy.
              </p>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="heading-sm">Group Transfer Steps</h3>
                </div>
                <div className="p-6">
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                    <li>Click <strong>"Group Transfer"</strong> button</li>
                    <li>Add recipients (up to 10) by entering their connection codes</li>
                    <li>Each recipient generates their own code and shares it with you</li>
                    <li>Select files to send to all recipients</li>
                    <li>Click <strong>"Send to All"</strong></li>
                    <li>Track individual progress for each recipient</li>
                    <li>Each transfer uses unique encryption keys</li>
                  </ol>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">
                      Independent Security
                    </h3>
                    <p className="text-muted-foreground">
                      If one connection fails or is compromised, it does not affect the others.
                      Each recipient has their own unique encryption keys generated through
                      separate key exchanges.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Advanced Options */}
            <section id="advanced-options" className="mb-16">
              <h2 className="display-sm mb-6">6. Advanced Options</h2>

              <div className="space-y-4">
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="heading-sm mb-2">Password Protection</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add an extra layer of encryption with a password. The recipient will
                        need the password to decrypt the file.
                      </p>
                      <Link href="/help/privacy-settings" className="text-sm text-primary hover:underline">
                        Learn more about password protection
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/20/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="heading-sm mb-2">Metadata Stripping</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically remove GPS coordinates, device info, and other metadata
                        from images before sending.
                      </p>
                      <Link href="/help/privacy-settings" className="text-sm text-primary hover:underline">
                        Learn more about metadata stripping
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="heading-sm mb-2">Resumable Transfers</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        If a large transfer is interrupted, you can resume from where it
                        stopped instead of starting over.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Automatic for files over 100MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Tips */}
            <section id="tips" className="mb-16">
              <h2 className="display-sm mb-6">7. Tips for Best Performance</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Wifi className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Use Local Network When Possible</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Local transfers are significantly faster than Internet P2P
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Keep Browser Tab Active</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Do not minimize or switch tabs during transfer
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Mobile: Keep Screen On</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Disable battery saver and keep screen active
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-medium">Strong WiFi Signal</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Move closer to router for faster speeds
                  </p>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className="bg-secondary/30 rounded-lg p-8">
              <h2 className="heading-md mb-4">Ready to Transfer?</h2>
              <p className="text-muted-foreground mb-6">
                Start your first secure file transfer now. No account required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app">
                  <Button size="lg">
                    Open Tallow App
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/help/troubleshooting">
                  <Button size="lg" variant="outline">
                    Troubleshooting Guide
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      <section className="border-t border-border py-16">
        <div className="container mx-auto px-6">
          <h2 className="heading-md mb-8">Related Help Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/help/device-connection" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <QrCode className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Device Connection Guide</h3>
              <p className="text-sm text-muted-foreground">Learn about connecting devices via QR codes and codes.</p>
            </Link>
            <Link href="/help/pqc-encryption" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">PQC Encryption</h3>
              <p className="text-sm text-muted-foreground">Understand how quantum-safe encryption works.</p>
            </Link>
            <Link href="/help/troubleshooting" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <AlertTriangle className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Troubleshooting</h3>
              <p className="text-sm text-muted-foreground">Fix common connection and transfer issues.</p>
            </Link>
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
            <p className="text-sm text-muted-foreground">Secure file sharing made simple</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
