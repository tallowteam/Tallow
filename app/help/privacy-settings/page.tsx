import Link from 'next/link';
import { SiteNav } from '@/components/site-nav';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Camera,
  FileText,
  ArrowLeft,
  Check,
  AlertTriangle,
  Info,
  Settings,
  Zap,
  BookOpen,
  Key,
  Trash2,
} from 'lucide-react';

export default function PrivacySettingsGuidePage() {
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
            <span className="text-foreground">Privacy Settings Guide</span>
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

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Privacy Guide</span>
            </div>

            <h1 className="display-lg mb-6">
              <span className="italic">Privacy Settings</span> Guide
            </h1>

            <p className="body-xl text-hero-muted max-w-3xl">
              Configure metadata stripping, password protection, and other privacy features
              to maximize your file transfer security.
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
                  <a href="#privacy-overview" className="hover:text-primary transition-colors">
                    1. Privacy Features Overview
                  </a>
                </li>
                <li>
                  <a href="#metadata-stripping" className="hover:text-primary transition-colors">
                    2. Metadata Stripping
                  </a>
                </li>
                <li>
                  <a href="#password-protection" className="hover:text-primary transition-colors">
                    3. Password Protection
                  </a>
                </li>
                <li>
                  <a href="#secure-storage" className="hover:text-primary transition-colors">
                    4. Secure Local Storage
                  </a>
                </li>
                <li>
                  <a href="#data-deletion" className="hover:text-primary transition-colors">
                    5. Secure Data Deletion
                  </a>
                </li>
                <li>
                  <a href="#privacy-best-practices" className="hover:text-primary transition-colors">
                    6. Privacy Best Practices
                  </a>
                </li>
              </ul>
            </div>

            {/* Section 1: Privacy Overview */}
            <section id="privacy-overview" className="mb-16">
              <h2 className="display-sm mb-6">1. Privacy Features Overview</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow is built with privacy as a core principle. Beyond encryption, we offer
                multiple privacy features to protect your personal information.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                    <EyeOff className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="heading-sm mb-2">Metadata Stripping</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove GPS coordinates, device info, and other hidden data from images and videos.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="heading-sm mb-2">Password Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    Add a second encryption layer with user-chosen passwords using Argon2id.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-white/20/10 flex items-center justify-center mb-4">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="heading-sm mb-2">Secure Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    Local settings are encrypted. No account or cloud storage required.
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="heading-sm mb-2">Secure Deletion</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete transfer history and cached data with one click.
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">
                      Privacy by Default
                    </h3>
                    <p className="text-muted-foreground">
                      Tallow is designed with privacy-by-default principles. Even without
                      changing any settings, your transfers are encrypted and files are never
                      stored on servers.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Metadata Stripping */}
            <section id="metadata-stripping" className="mb-16">
              <h2 className="display-sm mb-6">2. Metadata Stripping</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Photos and videos contain hidden metadata that can reveal where you were,
                what device you used, and when the file was created. Tallow can automatically
                remove this information.
              </p>

              <h3 className="heading-md mb-4">What Metadata Gets Removed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <h4 className="font-medium">GPS Coordinates</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Latitude, longitude, altitude - reveals exactly where photo was taken
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="w-5 h-5 text-white" />
                    <h4 className="font-medium">Device Information</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Camera make, model, serial number - identifies your device
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    <h4 className="font-medium">Timestamps</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capture date/time, modification date - creates activity timeline
                  </p>
                </div>

                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-5 h-5 text-amber-500" />
                    <h4 className="font-medium">Author & Copyright</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Photographer name, software used - identifies you
                  </p>
                </div>
              </div>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm">How to Enable Metadata Stripping</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Open Privacy Settings</h4>
                        <p className="text-sm text-muted-foreground">
                          Go to Settings &gt; Privacy or click the shield icon in the transfer area
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Enable "Strip Metadata"</h4>
                        <p className="text-sm text-muted-foreground">
                          Toggle on "Remove metadata from images/videos before transfer"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Choose Options (Optional)</h4>
                        <p className="text-sm text-muted-foreground">
                          Select which types of metadata to remove, or use "Strip All" for maximum privacy
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Automatic Processing</h4>
                        <p className="text-sm text-muted-foreground">
                          All photos and videos will now be cleaned before sending
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                      Supported File Types
                    </h3>
                    <p className="text-muted-foreground">
                      Metadata stripping works on: <strong>JPEG, PNG, WebP, HEIC</strong> images
                      and <strong>MP4, MOV</strong> videos. Other file types pass through unchanged.
                      Quality is preserved at 95% for recompressed images.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Password Protection */}
            <section id="password-protection" className="mb-16">
              <h2 className="display-sm mb-6">3. Password Protection</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Add an additional encryption layer on top of the PQC encryption. The recipient
                will need to know the password to decrypt the file.
              </p>

              <div className="bg-background border border-border rounded-lg p-6 mb-6">
                <h3 className="heading-sm mb-4">Password Encryption Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong>Argon2id</strong> key derivation (600,000 iterations, 256MB memory)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong>AES-256-GCM</strong> authenticated encryption
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong>BLAKE3</strong> integrity verification
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Unique <strong>random salt</strong> per file
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="heading-md mb-4">How to Password Protect Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h4 className="font-medium mb-4">When Sending:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Select files to send</li>
                    <li>Click the <strong>lock icon</strong> or "Add Password"</li>
                    <li>Enter a strong password</li>
                    <li>Optionally add a hint</li>
                    <li>Send the file normally</li>
                    <li>Share password separately with recipient</li>
                  </ol>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h4 className="font-medium mb-4">When Receiving:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>File arrives with lock indicator</li>
                    <li>Password dialog appears</li>
                    <li>Enter the password from sender</li>
                    <li>Click "Decrypt"</li>
                    <li>File is decrypted locally</li>
                    <li>Original file is available</li>
                  </ol>
                </div>
              </div>

              <h3 className="heading-md mb-4">Password Strength Meter</h3>
              <div className="bg-background border border-border rounded-lg p-6 mb-6">
                <p className="text-muted-foreground mb-4">
                  The password strength meter helps you create strong passwords:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-red-500 rounded" />
                    <span className="text-sm">Very Weak - Do not use</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-orange-500 rounded" />
                    <span className="text-sm">Weak - Add more characters</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-yellow-500 rounded" />
                    <span className="text-sm">Fair - Minimum recommended</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-lime-500 rounded" />
                    <span className="text-sm">Strong - Good for most uses</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-green-500 rounded" />
                    <span className="text-sm">Very Strong - Excellent</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/20/10 border border-white/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-white mb-2">Password Tips</h3>
                    <ul className="text-muted-foreground space-y-1">
                      <li>Use at least 12 characters</li>
                      <li>Mix uppercase, lowercase, numbers, and symbols</li>
                      <li>Avoid dictionary words or personal info</li>
                      <li>Use a password manager to generate and store</li>
                      <li>Share the password through a different channel than the file</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Secure Storage */}
            <section id="secure-storage" className="mb-16">
              <h2 className="display-sm mb-6">4. Secure Local Storage</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Tallow stores settings and preferences locally on your device, never on servers.
                This data is encrypted using your browser's secure storage APIs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-3">What Is Stored Locally</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      User preferences (theme, language)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Device identity keys
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Friends list (encrypted)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Transfer history (optional)
                    </li>
                  </ul>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <h3 className="font-medium mb-3">What Is NOT Stored</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      File contents
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Transfer encryption keys
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Passwords
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Connection codes
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-700 dark:text-green-400 mb-2">
                      Zero Server Storage
                    </h3>
                    <p className="text-muted-foreground">
                      Tallow never uploads your files to any server. Transfers happen directly
                      between devices. The signaling server only coordinates connections - it
                      never sees file contents or metadata.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Secure Deletion */}
            <section id="data-deletion" className="mb-16">
              <h2 className="display-sm mb-6">5. Secure Data Deletion</h2>

              <p className="body-lg text-muted-foreground mb-6">
                Delete all locally stored data with one click. This includes transfer history,
                device identities, friends list, and all preferences.
              </p>

              <div className="bg-background border border-border rounded-lg overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-border bg-secondary/30">
                  <h3 className="heading-sm">How to Clear All Data</h3>
                </div>
                <div className="p-6">
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                    <li>Go to <strong>Settings</strong> &gt; <strong>Privacy</strong></li>
                    <li>Scroll to "Data Management" section</li>
                    <li>Click <strong>"Clear All Data"</strong></li>
                    <li>Confirm the action in the dialog</li>
                    <li>All local data is permanently deleted</li>
                    <li>Page reloads with fresh state</li>
                  </ol>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                      This Action Cannot Be Undone
                    </h3>
                    <p className="text-muted-foreground">
                      Clearing data permanently removes your device identity. You will need to
                      re-add friends and reconfigure settings. Make sure you want to do this
                      before confirming.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Best Practices */}
            <section id="privacy-best-practices" className="mb-16">
              <h2 className="display-sm mb-6">6. Privacy Best Practices</h2>

              <div className="space-y-4">
                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Always Strip Metadata for Photos</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable metadata stripping for any photos you share publicly or with
                        people you do not fully trust.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Use Password Protection for Sensitive Files</h3>
                      <p className="text-sm text-muted-foreground">
                        Add an extra password layer for confidential documents, financial files,
                        or anything you want doubly protected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Share Passwords Separately</h3>
                      <p className="text-sm text-muted-foreground">
                        Never include the password in the same message as the file. Use a different
                        channel (e.g., phone call for password, text for file).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Clear History Regularly</h3>
                      <p className="text-sm text-muted-foreground">
                        If using a shared computer, clear transfer history after each session
                        to remove any traces of your activity.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Verify Recipients</h3>
                      <p className="text-sm text-muted-foreground">
                        Before sending sensitive files, verify you are connecting to the right
                        person. Use a voice call to confirm the connection code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section className="bg-secondary/30 rounded-lg p-8">
              <h2 className="heading-md mb-4">Configure Your Privacy Settings</h2>
              <p className="text-muted-foreground mb-6">
                Take control of your privacy with Tallow's comprehensive settings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/app/settings">
                  <Button size="lg">
                    <Settings className="w-5 h-5 mr-2" />
                    Open Settings
                  </Button>
                </Link>
                <Link href="/privacy">
                  <Button size="lg" variant="outline">
                    Read Privacy Policy
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
            <Link href="/help/pqc-encryption" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">PQC Encryption</h3>
              <p className="text-sm text-muted-foreground">Learn about quantum-safe encryption.</p>
            </Link>
            <Link href="/help/file-transfer" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">File Transfer Guide</h3>
              <p className="text-sm text-muted-foreground">Send and receive files securely.</p>
            </Link>
            <Link href="/metadata-demo" className="card-feature hover:shadow-lg transition-all hover:-translate-y-1">
              <EyeOff className="w-6 h-6 text-primary mb-3" />
              <h3 className="heading-sm mb-2">Metadata Demo</h3>
              <p className="text-sm text-muted-foreground">Try metadata stripping live.</p>
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
              <Link href="/privacy" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Privacy
              </Link>
              <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">
                Security
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Your privacy, protected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
