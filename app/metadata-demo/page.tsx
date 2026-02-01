'use client';

/**
 * Metadata Stripping Demo Page
 *
 * Standalone demonstration of Tallow's privacy-preserving metadata removal
 * from images. Shows before/after comparison with educational content.
 *
 * This demo is completely self-contained and works independently.
 */

import { DemoLayout, DemoSection, DemoCard } from '@/components/demos/demo-layout';
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import {
  Shield,
  MapPin,
  Camera,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react';

export default function MetadataDemoPage() {
  return (
    <DemoLayout
      title="Metadata Stripping Demo"
      description="Learn how Tallow protects your privacy by automatically removing hidden metadata from images before transfer. See exactly what information is stripped and why it matters."
      demoType="metadata"
      features={[
        'GPS Removal',
        'Camera Info Stripping',
        'Timestamp Removal',
        'Author Data Cleanup',
        'Automatic Detection',
      ]}
      instructions={[
        'Click "Select Demo Image" to load a sample image with metadata',
        'Review the sensitive metadata found in the original file',
        'Click "Strip Metadata" to see how Tallow removes this information',
        'Compare the before/after views to understand what data is removed',
      ]}
    >
      {/* Main Demo Component */}
      <DemoSection>
        <MetadataStrippingDemo />
      </DemoSection>

      {/* Privacy Risks Section */}
      <DemoSection className="mt-8">
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Why Metadata is a Privacy Risk</h2>
              <p className="text-sm text-muted-foreground">
                Most people don't realize their photos contain hidden data that can reveal sensitive personal information.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DemoCard
              icon={<MapPin className="h-5 w-5 text-red-500" />}
              title="Location Tracking"
            >
              <p className="text-sm text-muted-foreground">
                GPS coordinates can reveal your home address, workplace, frequently visited locations,
                and travel patterns with pinpoint accuracy.
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                High Risk: Can expose physical location
              </p>
            </DemoCard>

            <DemoCard
              icon={<Camera className="h-5 w-5 text-white" />}
              title="Device Fingerprinting"
            >
              <p className="text-sm text-muted-foreground">
                Camera model, serial numbers, and software versions can be used to identify and track
                you across different platforms.
              </p>
              <p className="text-xs text-white mt-2 font-medium">
                Medium Risk: Enables cross-platform tracking
              </p>
            </DemoCard>

            <DemoCard
              icon={<Calendar className="h-5 w-5 text-purple-500" />}
              title="Timeline Reconstruction"
            >
              <p className="text-sm text-muted-foreground">
                Timestamps reveal when photos were taken, allowing someone to reconstruct your
                daily schedule and routine.
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                Medium Risk: Reveals patterns and habits
              </p>
            </DemoCard>

            <DemoCard
              icon={<User className="h-5 w-5 text-orange-500" />}
              title="Identity Exposure"
            >
              <p className="text-sm text-muted-foreground">
                Author fields, copyright notices, and editing history may contain your real name,
                username, or other identifying information.
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                High Risk: Direct identity exposure
              </p>
            </DemoCard>
          </div>
        </div>
      </DemoSection>

      {/* How Tallow Protects You */}
      <DemoSection className="mt-8">
        <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-6">
          <div className="flex items-start gap-3 mb-6">
            <Shield className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2">How Tallow Protects You</h2>
              <p className="text-sm text-muted-foreground">
                Tallow automatically handles metadata stripping so you can share files without worry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Automatic Detection</h3>
                <p className="text-sm text-muted-foreground">
                  When you select files to transfer, Tallow automatically scans for metadata
                  in images, videos, and documents.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Smart Stripping</h3>
                <p className="text-sm text-muted-foreground">
                  Sensitive metadata is removed while preserving image quality, orientation,
                  and essential properties like color profile.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Transfer</h3>
                <p className="text-sm text-muted-foreground">
                  Only the cleaned file is sent to recipients, protected by end-to-end encryption
                  during transfer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* Supported Formats */}
      <DemoSection className="mt-8">
        <div className="rounded-2xl bg-muted/30 border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Supported File Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { format: 'JPEG', desc: 'Full EXIF support' },
              { format: 'PNG', desc: 'Text chunks' },
              { format: 'WebP', desc: 'EXIF & XMP' },
              { format: 'HEIC', desc: 'Apple format' },
              { format: 'MP4', desc: 'Video metadata' },
              { format: 'MOV', desc: 'QuickTime' },
            ].map((item) => (
              <div key={item.format} className="text-center p-4 rounded-xl bg-background border border-border">
                <div className="text-lg font-bold text-primary">{item.format}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </DemoSection>

      {/* Privacy Statistics */}
      <DemoSection className="mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">93%</div>
            <div className="text-sm text-muted-foreground">Photos contain GPS data</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-white/20/10 to-white/50/5 border border-white/20 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">100%</div>
            <div className="text-sm text-muted-foreground">Have device info</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">0%</div>
            <div className="text-sm text-muted-foreground">After stripping</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">&lt;1s</div>
            <div className="text-sm text-muted-foreground">Processing time</div>
          </div>
        </div>
      </DemoSection>
    </DemoLayout>
  );
}
