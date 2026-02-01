import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  Zap,
  ArrowLeft,
  ArrowRight,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Chrome,
  AlertCircle,
  XCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface TroubleshootingItem {
  id: string;
  problem: string;
  symptoms: string[];
  solutions: string[];
  severity: 'low' | 'medium' | 'high';
}

const connectionIssues: TroubleshootingItem[] = [
    {
      id: 'no-connection',
      problem: 'Cannot establish connection',
      symptoms: [
        'Connection status stays at "Connecting..."',
        '"Connection failed" error message',
        'Code accepted but nothing happens',
      ],
      solutions: [
        'Check your internet connection is stable',
        'Ensure the connection code is typed correctly',
        'Try generating a new connection code',
        'Check if firewall is blocking WebRTC connections',
        'Try using Internet P2P instead of Local Network',
        'Disable VPN temporarily and retry',
      ],
      severity: 'high',
    },
    {
      id: 'code-expired',
      problem: 'Connection code expired',
      symptoms: [
        '"Code expired" error message',
        'Code no longer works after waiting',
      ],
      solutions: [
        'Connection codes expire after 5 minutes for security',
        'Generate a new code and share immediately',
        'Ensure both parties are ready before generating code',
      ],
      severity: 'low',
    },
    {
      id: 'device-not-found',
      problem: 'Device not appearing in local network list',
      symptoms: [
        'Other device not showing in device list',
        'Device list is empty',
        'Only shows own device',
      ],
      solutions: [
        'Confirm both devices are on the same WiFi network',
        'Click the refresh button to scan again',
        'Check if the other device has Tallow open',
        'Try disabling and re-enabling WiFi',
        'Some networks (guest, enterprise) block device discovery',
        'Use connection code or QR code as alternative',
      ],
      severity: 'medium',
    },
    {
      id: 'connection-drops',
      problem: 'Connection keeps dropping',
      symptoms: [
        'Transfer starts then suddenly stops',
        'Frequent disconnections mid-transfer',
        '"Connection lost" messages',
      ],
      solutions: [
        'Move closer to WiFi router for stronger signal',
        'Avoid switching browser tabs during transfer',
        'Close other bandwidth-heavy applications',
        'On mobile: keep screen on and disable battery saver',
        'Try using a wired ethernet connection if possible',
        'Check for network congestion (too many devices)',
      ],
      severity: 'high',
    },
];

const transferIssues: TroubleshootingItem[] = [
    {
      id: 'slow-transfer',
      problem: 'Transfer is very slow',
      symptoms: [
        'Progress bar moves slowly',
        'Transfer speed below expected',
        'Large files take hours',
      ],
      solutions: [
        'Use Local Network mode when on same WiFi (much faster)',
        'Check your internet upload/download speed',
        'Move closer to the WiFi router',
        'Close other apps using bandwidth',
        'VPN/Tor will reduce speed - disable if not needed',
        'Try at off-peak hours for better network conditions',
      ],
      severity: 'medium',
    },
    {
      id: 'transfer-stuck',
      problem: 'Transfer stuck at certain percentage',
      symptoms: [
        'Progress bar frozen',
        'No movement for several minutes',
        'Transfer appears hung',
      ],
      solutions: [
        'Wait a few more minutes - large files may have pauses',
        'Check if either device went to sleep',
        'Refresh the page and try again',
        'If it happens repeatedly, try smaller files first',
        'Check network connection on both devices',
      ],
      severity: 'medium',
    },
    {
      id: 'file-corrupted',
      problem: 'Received file appears corrupted',
      symptoms: [
        'File cannot be opened',
        'Image shows errors or artifacts',
        'Document has garbled text',
      ],
      solutions: [
        'Re-send the file - this is rare and usually a one-time issue',
        'Check if file is corrupted on source device first',
        'Ensure transfer completed fully (100%)',
        'Try without password protection to isolate the issue',
        'Clear browser cache and retry',
      ],
      severity: 'high',
    },
    {
      id: 'file-not-downloading',
      problem: 'File received but not downloading',
      symptoms: [
        'Transfer shows complete but no file',
        'Download prompt does not appear',
        'File seems to vanish',
      ],
      solutions: [
        'Check browser download settings/folder',
        'Some browsers block automatic downloads - check notifications',
        'Try right-clicking and "Save As" if available',
        'Disable popup blocker for Tallow',
        'Check if file is in browser Downloads section',
      ],
      severity: 'medium',
    },
];

const browserIssues: TroubleshootingItem[] = [
    {
      id: 'camera-not-working',
      problem: 'QR scanner camera not working',
      symptoms: [
        'Black screen when scanning QR code',
        'Camera permission denied message',
        'No camera option available',
      ],
      solutions: [
        'Allow camera permissions when browser prompts',
        'Check browser settings to enable camera for this site',
        'Make sure no other app is using the camera',
        'On iOS Safari: go to Settings > Safari > Camera',
        'Try refreshing the page after granting permission',
        'Use connection code instead of QR if camera fails',
      ],
      severity: 'low',
    },
    {
      id: 'browser-not-supported',
      problem: 'Browser compatibility issues',
      symptoms: [
        'Page does not load correctly',
        'Features missing or broken',
        '"Browser not supported" message',
      ],
      solutions: [
        'Use Chrome, Firefox, Safari, or Edge (latest versions)',
        'Update your browser to the latest version',
        'Disable browser extensions that might interfere',
        'Try incognito/private mode to rule out extensions',
        'WebRTC must be enabled (usually is by default)',
      ],
      severity: 'medium',
    },
    {
      id: 'storage-full',
      problem: 'Storage or memory issues',
      symptoms: [
        '"Storage quota exceeded" error',
        'Page crashes during large transfers',
        'Slow performance over time',
      ],
      solutions: [
        'Clear browser cache and site data for Tallow',
        'Close other browser tabs to free memory',
        'For very large files (4GB+), ensure 8GB+ RAM available',
        'Restart browser if performance degrades',
        'Try in a fresh browser profile',
      ],
      severity: 'medium',
    },
];

const mobileSIssues: TroubleshootingItem[] = [
    {
      id: 'mobile-screen-off',
      problem: 'Transfer fails when screen turns off',
      symptoms: [
        'Transfer stops when phone screen locks',
        'App loses connection in background',
        'Transfer resets when returning to app',
      ],
      solutions: [
        'Keep screen on during transfer (tap occasionally)',
        'Disable auto-lock temporarily in device settings',
        'Disable battery saver mode',
        'Keep the browser in foreground',
        'Plug in charger for long transfers',
      ],
      severity: 'high',
    },
    {
      id: 'mobile-slow',
      problem: 'Very slow on mobile',
      symptoms: [
        'Mobile transfers much slower than desktop',
        'Progress moves very slowly',
        'Heating up during transfer',
      ],
      solutions: [
        'Connect to WiFi instead of mobile data',
        'Move closer to WiFi router',
        'Close background apps to free resources',
        'Try smaller files on mobile',
        'Some older phones have slower encryption',
      ],
      severity: 'medium',
    },
    {
      id: 'ios-issues',
      problem: 'iOS Safari specific issues',
      symptoms: [
        'Files not downloading on iPhone',
        'Page refresh loses state',
        'Certain features not working',
      ],
      solutions: [
        'iOS Safari may save files to Files app instead of Photos',
        'Check the Files app > Downloads folder',
        'Keep Safari in foreground during transfer',
        'Do not switch to other apps mid-transfer',
        'Try Chrome for iOS as alternative',
      ],
      severity: 'medium',
    },
  ];

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: 'bg-green-500/10 text-green-700 dark:text-green-400',
    medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    high: 'bg-red-500/10 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded ${colors[severity]}`}>
      {severity === 'low' && 'Easy Fix'}
      {severity === 'medium' && 'Common Issue'}
      {severity === 'high' && 'Critical'}
    </span>
  );
}

function IssueSection({ title, icon, issues }: { title: string; icon: React.ReactNode; issues: TroubleshootingItem[] }) {
  return (
    <div className="mb-12">
      <h3 className="heading-md mb-6 flex items-center gap-3">
        {icon}
        {title}
      </h3>
      <div className="space-y-4">
        {issues.map((issue) => (
          <div key={issue.id} className="bg-background border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h4 className="font-medium">{issue.problem}</h4>
              <SeverityBadge severity={issue.severity} />
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h5 className="text-sm font-medium text-muted-foreground mb-2">Symptoms:</h5>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {issue.symptoms.map((symptom, i) => (
                    <li key={i}>{symptom}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Solutions:
                </h5>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-6">
                  {issue.solutions.map((solution, i) => (
                    <li key={i}>{solution}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TroubleshootingGuidePage() {
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
            <span className="text-foreground">Troubleshooting</span>
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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-500">Troubleshooting</span>
            </div>

            <h1 className="display-lg mb-6">
              <span className="italic">Troubleshooting</span> Guide
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl">
              Solutions for common issues with connections, transfers, browsers, and mobile devices.
              Find your problem and follow the step-by-step fixes.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Diagnosis */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-6 py-8">
          <h2 className="heading-md mb-6">Quick Diagnosis</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="#connection-issues" className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors">
              <WifiOff className="w-6 h-6 text-red-500 mb-2" />
              <h3 className="font-medium mb-1">Connection Problems</h3>
              <p className="text-xs text-muted-foreground">Cannot connect, code expired, devices not found</p>
            </a>
            <a href="#transfer-issues" className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors">
              <Clock className="w-6 h-6 text-amber-500 mb-2" />
              <h3 className="font-medium mb-1">Transfer Issues</h3>
              <p className="text-xs text-muted-foreground">Slow speeds, stuck progress, corrupted files</p>
            </a>
            <a href="#browser-issues" className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors">
              <Chrome className="w-6 h-6 text-white mb-2" />
              <h3 className="font-medium mb-1">Browser Issues</h3>
              <p className="text-xs text-muted-foreground">Camera, compatibility, storage problems</p>
            </a>
            <a href="#mobile-issues" className="bg-background border border-border rounded-lg p-4 hover:border-primary transition-colors">
              <Smartphone className="w-6 h-6 text-purple-500 mb-2" />
              <h3 className="font-medium mb-1">Mobile Issues</h3>
              <p className="text-xs text-muted-foreground">Screen off, slow transfer, iOS specific</p>
            </a>
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
                Quick Navigation
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#connection-issues" className="hover:text-primary transition-colors">
                    Connection Issues (4 problems)
                  </a>
                </li>
                <li>
                  <a href="#transfer-issues" className="hover:text-primary transition-colors">
                    Transfer Issues (4 problems)
                  </a>
                </li>
                <li>
                  <a href="#browser-issues" className="hover:text-primary transition-colors">
                    Browser Issues (3 problems)
                  </a>
                </li>
                <li>
                  <a href="#mobile-issues" className="hover:text-primary transition-colors">
                    Mobile Issues (3 problems)
                  </a>
                </li>
                <li>
                  <a href="#still-stuck" className="hover:text-primary transition-colors">
                    Still Stuck? Get Help
                  </a>
                </li>
              </ul>
            </div>

            {/* Connection Issues */}
            <section id="connection-issues">
              <IssueSection
                title="Connection Issues"
                icon={<WifiOff className="w-6 h-6 text-red-500" />}
                issues={connectionIssues}
              />
            </section>

            {/* Transfer Issues */}
            <section id="transfer-issues">
              <IssueSection
                title="Transfer Issues"
                icon={<Clock className="w-6 h-6 text-amber-500" />}
                issues={transferIssues}
              />
            </section>

            {/* Browser Issues */}
            <section id="browser-issues">
              <IssueSection
                title="Browser Issues"
                icon={<Chrome className="w-6 h-6 text-white" />}
                issues={browserIssues}
              />
            </section>

            {/* Mobile Issues */}
            <section id="mobile-issues">
              <IssueSection
                title="Mobile Issues"
                icon={<Smartphone className="w-6 h-6 text-purple-500" />}
                issues={mobileSIssues}
              />
            </section>

            {/* Browser Compatibility Table */}
            <section className="mb-12">
              <h3 className="heading-md mb-6 flex items-center gap-3">
                <Monitor className="w-6 h-6 text-primary" />
                Browser Compatibility
              </h3>
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Browser</th>
                      <th className="text-center px-4 py-3 font-medium">Version</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-6 py-3">Chrome</td>
                      <td className="text-center px-4 py-3">90+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Firefox</td>
                      <td className="text-center px-4 py-3">88+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Safari</td>
                      <td className="text-center px-4 py-3">14+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Edge</td>
                      <td className="text-center px-4 py-3">90+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Chrome Mobile</td>
                      <td className="text-center px-4 py-3">90+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Safari iOS</td>
                      <td className="text-center px-4 py-3">14+</td>
                      <td className="text-center px-4 py-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-3">Internet Explorer</td>
                      <td className="text-center px-4 py-3">Any</td>
                      <td className="text-center px-4 py-3">
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Still Stuck */}
            <section id="still-stuck" className="bg-secondary/30 rounded-lg p-8">
              <h2 className="heading-md mb-4 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                Still Having Issues?
              </h2>
              <p className="text-muted-foreground mb-6">
                If the solutions above did not fix your problem, here are more resources:
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Try a Complete Reset</h3>
                    <p className="text-sm text-muted-foreground">
                      Clear browser cache, restart browser, and try again with a fresh page load.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Check Service Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify Tallow's signaling servers are online. Brief outages may occur during updates.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium">Report a Bug</h3>
                    <p className="text-sm text-muted-foreground">
                      If you have found a reproducible bug, please report it on GitHub with steps to reproduce.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="https://github.com/yourusername/tallow/issues" target="_blank">
                  <Button size="lg">
                    Report an Issue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/help">
                  <Button size="lg" variant="outline">
                    Back to Help Center
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
              <Wifi className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Device Connection Guide</h3>
              <p className="text-sm text-muted-foreground">Learn how to connect devices properly.</p>
            </Link>
            <Link href="/help/file-transfer" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">File Transfer Guide</h3>
              <p className="text-sm text-muted-foreground">Step-by-step transfer instructions.</p>
            </Link>
            <Link href="/help/privacy-settings" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Privacy Settings</h3>
              <p className="text-sm text-muted-foreground">Configure privacy features.</p>
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
            <p className="text-sm text-muted-foreground">We are here to help</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
