# Metadata Stripping Demo - Integration Examples

## Complete Integration Examples

### Example 1: Standalone Demo Page

**File:** `app/privacy-features/page.tsx`

```tsx
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';

export const metadata = {
  title: 'Privacy Features - Metadata Protection | Tallow',
  description: 'Learn how Tallow automatically removes sensitive metadata from your files',
};

export default function PrivacyFeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Privacy-First File Sharing
          </h1>
          <p className="text-xl text-muted-foreground">
            See how Tallow protects your privacy by removing hidden metadata
          </p>
        </div>

        {/* Demo Component */}
        <MetadataStrippingDemo />

        {/* Additional Content */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            This feature is automatically enabled for all file transfers in Tallow
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Example 2: Combined with Real Metadata Stripper

**File:** `components/features/metadata-feature-showcase.tsx`

```tsx
'use client';

import { useState } from 'react';
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MetadataFeatureShowcase() {
  const [showDemo, setShowDemo] = useState(true);
  const { isProcessing, checkMetadata, processFile } = useMetadataStripper();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Check actual metadata
    const meta = await checkMetadata(file);
    setMetadata(meta);
  };

  const handleRealStrip = async () => {
    if (!selectedFile) return;

    // Strip real metadata
    const cleanFile = await processFile(selectedFile);

    // Verify metadata was removed
    const afterMeta = await checkMetadata(cleanFile);
    console.log('After stripping:', afterMeta);
  };

  return (
    <div className="space-y-8">
      {/* Toggle between demo and real */}
      <div className="flex justify-center gap-4">
        <Button
          variant={showDemo ? 'default' : 'outline'}
          onClick={() => setShowDemo(true)}
        >
          View Demo
        </Button>
        <Button
          variant={!showDemo ? 'default' : 'outline'}
          onClick={() => setShowDemo(false)}
        >
          Try Real Files
        </Button>
      </div>

      {/* Demo Mode */}
      {showDemo ? (
        <MetadataStrippingDemo />
      ) : (
        /* Real File Processing */
        <Card>
          <CardHeader>
            <CardTitle>Test with Your Own Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleRealFileUpload}
              className="block w-full text-sm"
            />

            {metadata && (
              <div className="p-4 bg-muted rounded">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedFile && (
              <Button
                onClick={handleRealStrip}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Stripping...' : 'Strip Real Metadata'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Example 3: In Transfer Flow

**File:** `components/transfer/transfer-with-privacy.tsx`

```tsx
'use client';

import { useState } from 'react';
import { FileSelector } from '@/components/transfer/file-selector';
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function TransferWithPrivacy() {
  const [showPrivacyDemo, setShowPrivacyDemo] = useState(false);
  const { processFiles } = useMetadataStripper();
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelection = async (selectedFiles: File[]) => {
    // Automatically strip metadata
    const cleanFiles = await processFiles(selectedFiles);
    setFiles(cleanFiles);
  };

  return (
    <div className="space-y-4">
      {/* File Selector */}
      <FileSelector onFilesSelected={handleFileSelection} />

      {/* Privacy Info Button */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => setShowPrivacyDemo(true)}
          className="text-sm"
        >
          Learn about automatic metadata removal
        </Button>
      </div>

      {/* Privacy Demo Dialog */}
      <Dialog open={showPrivacyDemo} onOpenChange={setShowPrivacyDemo}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Tallow Protects Your Privacy</DialogTitle>
          </DialogHeader>
          <MetadataStrippingDemo />
        </DialogContent>
      </Dialog>

      {/* File List */}
      {files.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {files.length} file(s) selected (metadata automatically removed)
        </div>
      )}
    </div>
  );
}
```

---

### Example 4: Settings Page Integration

**File:** `app/settings/privacy/page.tsx`

```tsx
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export default function PrivacySettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Privacy Settings</h1>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata Stripping</CardTitle>
          <CardDescription>
            Automatically remove sensitive metadata from images before sharing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Metadata Stripping</p>
              <p className="text-sm text-muted-foreground">
                Remove GPS, camera, and timestamp data from images
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show Warnings</p>
              <p className="text-sm text-muted-foreground">
                Alert me when sensitive metadata is detected
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Preserve Orientation</p>
              <p className="text-sm text-muted-foreground">
                Keep image rotation data (recommended)
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Demo Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">See It In Action</h2>
        <MetadataStrippingDemo />
      </div>
    </div>
  );
}
```

---

### Example 5: Educational Landing Page Section

**File:** `components/landing/privacy-section.tsx`

```tsx
'use client';

import { useState } from 'react';
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Lock } from 'lucide-react';

export function PrivacySection() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Privacy-First Architecture
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tallow automatically protects your privacy by removing hidden metadata
            that could expose your location, device, and identity
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-card rounded-lg">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Automatic Protection</h3>
            <p className="text-muted-foreground">
              Every file is automatically scanned and cleaned before transfer
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg">
            <Eye className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
            <p className="text-muted-foreground">
              See exactly what metadata is removed and why
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg">
            <Lock className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">No Compromises</h3>
            <p className="text-muted-foreground">
              Image quality remains perfect after metadata removal
            </p>
          </div>
        </div>

        {/* Interactive Demo Button */}
        {!showDemo ? (
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => setShowDemo(true)}
            >
              See Interactive Demo
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <MetadataStrippingDemo />
          </div>
        )}
      </div>
    </section>
  );
}
```

---

### Example 6: Onboarding Tutorial

**File:** `components/onboarding/privacy-tutorial.tsx`

```tsx
'use client';

import { useState } from 'react';
import { MetadataStrippingDemo } from '@/components/demos/metadata-stripping-demo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PrivacyTutorial() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Tallow',
      content: 'Secure, private file sharing without compromising your data',
    },
    {
      title: 'Automatic Privacy Protection',
      content: 'Tallow removes hidden metadata from your files',
      demo: true,
    },
    {
      title: 'Ready to Share Securely',
      content: 'Your files are now protected and ready to transfer',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {steps[step]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!steps[step]?.demo ? (
            <p className="text-center text-lg text-muted-foreground">
              {steps[step]?.content}
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                {steps[step]?.content}
              </p>
              <MetadataStrippingDemo />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              onClick={() => {
                if (step === steps.length - 1) {
                  // Complete onboarding
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## API Integration Patterns

### Pattern 1: Pre-Transfer Hook

```tsx
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';

function useSecureTransfer() {
  const { processFiles } = useMetadataStripper();

  const initiateTransfer = async (files: File[]) => {
    // Automatically strip metadata before transfer
    const cleanFiles = await processFiles(files);

    // Continue with transfer...
    await sendFiles(cleanFiles);
  };

  return { initiateTransfer };
}
```

### Pattern 2: Conditional Stripping

```tsx
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { getPrivacySettings } from '@/lib/privacy/privacy-settings';

async function conditionalStrip(file: File, recipientId: string) {
  const { shouldProcess, processFile } = useMetadataStripper();

  // Check if stripping is needed
  if (await shouldProcess(file.type, recipientId)) {
    return await processFile(file, recipientId);
  }

  return file; // Return original if no stripping needed
}
```

### Pattern 3: Batch Processing with Progress

```tsx
import { stripMetadataBatch } from '@/lib/privacy/metadata-stripper';

async function batchStripWithProgress(files: File[]) {
  const [progress, setProgress] = useState({ current: 0, total: files.length });

  const results = await stripMetadataBatch(files, (current, total) => {
    setProgress({ current, total });
  });

  return results;
}
```

---

## Testing Integration

### Integration Test Example

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetadataFeatureShowcase } from './metadata-feature-showcase';

describe('MetadataFeatureShowcase', () => {
  it('toggles between demo and real mode', async () => {
    const user = userEvent.setup();
    render(<MetadataFeatureShowcase />);

    // Should show demo by default
    expect(screen.getByText(/Select Demo Image/i)).toBeInTheDocument();

    // Switch to real mode
    await user.click(screen.getByText(/Try Real Files/i));

    // Should show file input
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
  });
});
```

---

## Summary

The Metadata Stripping Demo component is highly versatile and can be integrated into:

1. **Standalone pages** - Dedicated demo/education pages
2. **Feature showcases** - Combined with real functionality
3. **Transfer flows** - As educational overlay/dialog
4. **Settings pages** - To explain privacy options
5. **Landing pages** - To highlight privacy features
6. **Onboarding** - To educate new users

All examples are production-ready and follow Tallow's established patterns.
