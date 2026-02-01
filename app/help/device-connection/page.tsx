import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Wifi,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Info,
  QrCode,
  Monitor,
  Laptop,
  RefreshCw,
  BookOpen,
  Shield,
  Zap,
  HelpCircle,
} from 'lucide-react';

export default function DeviceConnectionGuidePage() {
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
            <span className="text-foreground">Device Connection Guide</span>
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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <QrCode className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-500">Tutorial</span>
            </div>

            <h1 className="display-lg mb-6">
              <span className="italic">Device Connection</span> Guide
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl">
              Learn how to connect devices for file transfers using QR codes, connection codes,
              and automatic discovery.
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
                  <a href="#connection-methods" className="hover:text-primary transition-colors">
                    1. Connection Methods Overview
                  </a>
                </li>
                <li>
                  <a href="#qr-codes" className="hover:text-primary transition-colors">
                    2. QR Code Connection
                  </a>
                </li>
                <li>
                  <a href="#connection-codes" className="hover:text-primary transition-colors">
                    3. Connection Codes
                  </a>
                </li>
                <li>
                  <a href="#auto-discovery" className="hover:text-primary transition-colors">
                    4. Automatic Device Discovery
                  </a>
                </li>
                <li>
                  <a href="#device-management" className="hover:text-primary transition-colors">
                    5. Managing Connected Devices
                  </a>
                </li>
                <li>
                  <a href="#connection-issues" className="hover:text-primary transition-colors">
                    6. Troubleshooting Connection Issues
                  </a>
                </li>
              </ul>
            </div>

            {/* Section 1: Connection Methods */}
            <section id="connection-methods" className="mb-16">
              <h2 className="display-sm mb-6">1. Connection Methods Overview</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow offers multiple ways to connect devices depending on your situation.
                All methods establish the same secure, encrypted connection.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <QrCode className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="heading-sm mb-2">QR Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Fastest method when devices are nearby
                  </p>
                  <div className="mt-4 text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-400 inline-block">
                    Recommended
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <Monitor className="w-10 h-10 text-purple-500 mx-auto mb-4" />
                  <h3 className="heading-sm mb-2">Connection Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Works anywhere, share via text or call
                  </p>
                  <div className="mt-4 text-xs px-2 py-1 rounded bg-white/20/10 text-white inline-block">
                    Most Versatile
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6 text-center">
                  <Wifi className="w-10 h-10 text-white mx-auto mb-4" />
                  <h3 className="heading-sm mb-2">Auto Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Devices find each other on same network
                  </p>
                  <div className="mt-4 text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 inline-block">
                    Local Only
                  </div>
                </div>
              </div>

              <div className="bg-white/20/10 border border-white/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">Same Security, Different Methods</h3>
                    <p className="text-muted-foreground">
                      No matter which connection method you use, all transfers use the same
                      post-quantum encryption. The connection method only affects how devices
                      initially find each other, not the security of the transfer itself.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: QR Codes */}
            <section id="qr-codes" className="mb-16">
              <h2 className="display-sm mb-6">2. QR Code Connection</h2>

              <p className="body-lg text-muted-foreground mb-6">
                QR codes are the fastest way to connect when both devices are physically nearby.
                One device displays the code, the other scans it.
              </p>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm">How to Connect with QR Code</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Receiver Side */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">R</div>
                        Receiver (Shows QR Code)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs text-primary">1</div>
                          <p className="text-sm text-muted-foreground">
                            Open Tallow and select "Local Network"
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs text-primary">2</div>
                          <p className="text-sm text-muted-foreground">
                            Click "Show QR Code" button
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs text-primary">3</div>
                          <p className="text-sm text-muted-foreground">
                            A QR code will appear on screen
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Keep the QR code visible for scanning
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sender Side */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">S</div>
                        Sender (Scans QR Code)
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-xs text-purple-600">1</div>
                          <p className="text-sm text-muted-foreground">
                            Open Tallow and select "Local Network"
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-xs text-purple-600">2</div>
                          <p className="text-sm text-muted-foreground">
                            Click "Scan QR Code" button
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-xs text-purple-600">3</div>
                          <p className="text-sm text-muted-foreground">
                            Point camera at the QR code
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Connection establishes automatically
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-2">Camera Permission Required</h3>
                    <p className="text-muted-foreground">
                      Your browser will ask for camera permission to scan QR codes. This is only
                      used for scanning and is not recorded or stored. If you deny permission,
                      you can still use connection codes instead.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Connection Codes */}
            <section id="connection-codes" className="mb-16">
              <h2 className="display-sm mb-6">3. Connection Codes</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Connection codes are 8-character codes that let you connect devices anywhere in the world.
                Share the code via text message, phone call, or any other channel.
              </p>

              <div className="bg-background border border-border rounded-lg p-6 mb-6">
                <h3 className="heading-sm mb-4">Code Format</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {['A', '7', 'K', 'M', '2', 'P', 'X', '9'].map((char, i) => (
                      <div key={i} className="w-10 h-12 bg-secondary border border-border rounded flex items-center justify-center font-mono text-xl font-bold">
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>8 uppercase letters and numbers</li>
                  <li>Excludes confusing characters (0, O, I, L)</li>
                  <li>Cryptographically random generation</li>
                  <li>Over 1 trillion possible combinations</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Generate a Code (To Receive)</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to "Internet P2P" tab</li>
                    <li>Click "Generate Code"</li>
                    <li>Share the code with sender</li>
                    <li>Wait for connection</li>
                  </ol>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Enter a Code (To Send)</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to "Internet P2P" tab</li>
                    <li>Get code from receiver</li>
                    <li>Type it in the code field</li>
                    <li>Click "Connect"</li>
                  </ol>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">Security Features</h3>
                    <ul className="text-muted-foreground space-y-1">
                      <li><strong>Single Use:</strong> Codes can only be used once</li>
                      <li><strong>5 Minute Expiry:</strong> Codes expire after 5 minutes</li>
                      <li><strong>Rate Limited:</strong> Brute force attempts are blocked</li>
                      <li><strong>Verified Connection:</strong> Both devices confirm the match</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Auto Discovery */}
            <section id="auto-discovery" className="mb-16">
              <h2 className="display-sm mb-6">4. Automatic Device Discovery</h2>

              <p className="body-lg text-muted-foreground mb-6">
                When both devices are on the same WiFi network, they can automatically discover
                each other without codes or QR scanning.
              </p>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm">How Auto Discovery Works</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/20/10 flex items-center justify-center flex-shrink-0">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Same Network Detection</h4>
                        <p className="text-sm text-muted-foreground">
                          Tallow uses mDNS/Bonjour to find other Tallow instances on your network
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Continuous Scanning</h4>
                        <p className="text-sm text-muted-foreground">
                          Devices list updates automatically as devices join or leave the network
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Verification Required</h4>
                        <p className="text-sm text-muted-foreground">
                          Even with auto-discovery, connections require confirmation on both devices
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="heading-md mb-4">Discovered Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <Laptop className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Device Name</h4>
                  <p className="text-xs text-muted-foreground">Shows computer/device name</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <Monitor className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Device Type</h4>
                  <p className="text-xs text-muted-foreground">Desktop, laptop, mobile, tablet</p>
                </div>
                <div className="bg-background border border-border rounded-lg p-4 text-center">
                  <Wifi className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">Connection Quality</h4>
                  <p className="text-xs text-muted-foreground">Signal strength indicator</p>
                </div>
              </div>

              <div className="bg-white/20/10 border border-white/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">Network Requirements</h3>
                    <p className="text-muted-foreground">
                      Auto-discovery requires both devices to be on the same network subnet.
                      Some enterprise networks or guest networks may block device discovery.
                      If devices are not appearing, use connection codes or QR codes instead.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Device Management */}
            <section id="device-management" className="mb-16">
              <h2 className="display-sm mb-6">5. Managing Connected Devices</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Once connected, you can manage your devices and trusted connections.
              </p>

              <div className="space-y-4">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">My Devices</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Link your own devices for easy transfers between your phone, tablet, and computer.
                    Linked devices appear automatically in the device list.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Settings &gt; My Devices</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">One-time setup</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Instant connection</span>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">Friends List</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Save frequently contacted people to your friends list. They will appear for
                    quick transfers without needing new codes each time.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Settings &gt; Friends</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Add by code</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Optional nicknames</span>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2">Connection History</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    View recent transfers and connections. Clear history at any time for privacy.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-secondary">History tab</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">Transfer logs</span>
                    <span className="text-xs px-2 py-1 rounded bg-secondary">One-click clear</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Troubleshooting */}
            <section id="connection-issues" className="mb-16">
              <h2 className="display-sm mb-6">6. Troubleshooting Connection Issues</h2>

              <div className="space-y-4">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    Device not appearing in list
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-7">
                    <li>Ensure both devices are on the same WiFi network</li>
                    <li>Refresh the device list using the refresh button</li>
                    <li>Check if Tallow is open and in the foreground on both devices</li>
                    <li>Try using a connection code instead</li>
                  </ul>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    Connection code not working
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-7">
                    <li>Check if the code has expired (5 minute limit)</li>
                    <li>Verify you typed the code correctly (case sensitive)</li>
                    <li>Generate a new code and try again</li>
                    <li>Ensure both devices have internet connectivity</li>
                  </ul>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    QR code scanner not working
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-7">
                    <li>Allow camera permissions when prompted</li>
                    <li>Ensure adequate lighting on the QR code</li>
                    <li>Hold the camera steady and at the right distance</li>
                    <li>If it fails, use the connection code shown below the QR code</li>
                  </ul>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-500" />
                    Connection keeps dropping
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-2 ml-7">
                    <li>Move closer to the WiFi router</li>
                    <li>Check for network congestion or interference</li>
                    <li>Try switching between Local Network and Internet P2P modes</li>
                    <li>Keep the browser tab active during transfers</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className="bg-secondary/30 rounded-lg p-8">
              <h2 className="heading-md mb-4">Ready to Connect?</h2>
              <p className="text-muted-foreground mb-6">
                Now that you understand device connections, try transferring your first file.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app">
                  <Button size="lg">
                    Open Tallow App
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/help/file-transfer">
                  <Button size="lg" variant="outline">
                    File Transfer Guide
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
            <Link href="/help/file-transfer" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">File Transfer Guide</h3>
              <p className="text-sm text-muted-foreground">Learn how to send and receive files.</p>
            </Link>
            <Link href="/help/pqc-encryption" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">PQC Encryption</h3>
              <p className="text-sm text-muted-foreground">Understand quantum-safe security.</p>
            </Link>
            <Link href="/help/troubleshooting" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <AlertTriangle className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Troubleshooting</h3>
              <p className="text-sm text-muted-foreground">Fix common issues.</p>
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
            <p className="text-sm text-muted-foreground">Connect securely, anywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
