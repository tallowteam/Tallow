# Diagram Integration Examples

Real-world examples of how to integrate Tallow's architecture diagrams into various contexts.

## Table of Contents

- [Documentation Pages](#documentation-pages)
- [Blog Posts](#blog-posts)
- [Presentation Slides](#presentation-slides)
- [Educational Content](#educational-content)
- [Interactive Tutorials](#interactive-tutorials)
- [API Documentation](#api-documentation)
- [Security Reports](#security-reports)

---

## Documentation Pages

### Technical Documentation

```tsx
// app/docs/architecture/page.tsx
import { SystemArchitectureDiagram } from '@/components/diagrams';

export default function ArchitectureDocs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">System Architecture</h1>

      <p className="text-lg text-muted-foreground mb-8">
        Tallow uses a peer-to-peer architecture with WebRTC for direct file transfers.
        The system is designed for security, privacy, and performance.
      </p>

      {/* Diagram with full context */}
      <div className="my-12">
        <SystemArchitectureDiagram showLabels={true} />
      </div>

      <h2 className="text-2xl font-semibold mt-12 mb-4">
        Components Overview
      </h2>

      <p className="text-muted-foreground mb-4">
        As shown in the diagram above, the system consists of...
      </p>
    </div>
  );
}
```

### Connection Guide

```tsx
// app/docs/webrtc/page.tsx
import { WebRTCFlowDiagram } from '@/components/diagrams';

export default function WebRTCGuide() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
      <h1>Understanding WebRTC Connections</h1>

      <p>
        WebRTC enables direct peer-to-peer connections between browsers.
        Here's how Tallow establishes a connection:
      </p>

      <div className="not-prose my-8">
        <WebRTCFlowDiagram showLabels={true} />
      </div>

      <h2>Step-by-Step Breakdown</h2>

      <h3>1. Signaling Phase</h3>
      <p>
        Peers exchange Session Description Protocol (SDP) messages...
      </p>

      <h3>2. ICE Candidate Discovery</h3>
      <p>
        Interactive Connectivity Establishment finds the best network path...
      </p>
    </article>
  );
}
```

---

## Blog Posts

### Security Focused Post

```tsx
// app/blog/post-quantum-encryption/page.tsx
import { EncryptionFlowDiagram } from '@/components/diagrams';

export default function PostQuantumBlog() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Post-Quantum Encryption in Tallow
        </h1>
        <p className="text-muted-foreground">
          Published on January 27, 2026 • 5 min read
        </p>
      </header>

      <div className="prose prose-lg dark:prose-invert">
        <p>
          With quantum computers on the horizon, we've implemented ML-KEM-768
          alongside X25519 for hybrid post-quantum security.
        </p>

        <h2>How It Works</h2>
      </div>

      {/* Visual explanation */}
      <div className="my-12 -mx-4 md:mx-0">
        <EncryptionFlowDiagram showLabels={true} />
      </div>

      <div className="prose prose-lg dark:prose-invert">
        <p>
          As illustrated above, our encryption pipeline combines the best
          of classical and post-quantum cryptography...
        </p>
      </div>
    </article>
  );
}
```

### Technical Deep Dive

```tsx
// app/blog/triple-ratchet-explained/page.tsx
import { TripleRatchetDiagram } from '@/components/diagrams';

export default function TripleRatchetPost() {
  return (
    <article className="max-w-4xl mx-auto">
      <h1>The Triple Ratchet Protocol Explained</h1>

      <p className="lead">
        Learn how Tallow achieves forward secrecy and post-compromise
        security for continuous sessions.
      </p>

      {/* Interactive diagram */}
      <div className="my-16 bg-card rounded-xl p-8 border border-border">
        <TripleRatchetDiagram showLabels={true} />
      </div>

      <section>
        <h2>Why Triple Ratchet?</h2>
        <p>
          While Signal's Double Ratchet is excellent for messaging,
          we extended it to a Triple Ratchet for file transfers...
        </p>
      </section>
    </article>
  );
}
```

---

## Presentation Slides

### Slide Deck

```tsx
// app/presentation/page.tsx
'use client';

import { useState } from 'react';
import {
  SystemArchitectureDiagram,
  WebRTCFlowDiagram,
  EncryptionFlowDiagram,
  TripleRatchetDiagram,
} from '@/components/diagrams';

const slides = [
  {
    title: 'Tallow Overview',
    component: SystemArchitectureDiagram,
  },
  {
    title: 'Connection Flow',
    component: WebRTCFlowDiagram,
  },
  {
    title: 'Encryption Pipeline',
    component: EncryptionFlowDiagram,
  },
  {
    title: 'Key Rotation',
    component: TripleRatchetDiagram,
  },
];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const Slide = slides[currentSlide].component;

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-6xl">
          <h1 className="text-5xl font-bold mb-12 text-center">
            {slides[currentSlide].title}
          </h1>

          {/* Diagram - no labels for cleaner presentation */}
          <Slide showLabels={false} />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-4 py-2 rounded bg-white/10 disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm">
          {currentSlide + 1} / {slides.length}
        </span>

        <button
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="px-4 py-2 rounded bg-white/10 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Educational Content

### Interactive Learning Module

```tsx
// app/learn/encryption/page.tsx
'use client';

import { useState } from 'react';
import { EncryptionFlowDiagram } from '@/components/diagrams';
import { Button } from '@/components/ui/button';

export default function EncryptionLesson() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLabels, setShowLabels] = useState(false);

  const steps = [
    {
      title: 'Introduction',
      content: 'Let\'s explore how Tallow encrypts your files...',
    },
    {
      title: 'Key Generation',
      content: 'First, we generate hybrid post-quantum keys...',
    },
    {
      title: 'File Chunking',
      content: 'Large files are split into 64KB chunks...',
    },
    {
      title: 'Encryption',
      content: 'Each chunk is encrypted with ChaCha20-Poly1305...',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Lesson content */}
        <div>
          <h1 className="text-3xl font-bold mb-4">
            {steps[currentStep].title}
          </h1>

          <p className="text-lg text-muted-foreground mb-6">
            {steps[currentStep].content}
          </p>

          {/* Progress controls */}
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </div>

        {/* Diagram */}
        <div className="bg-card rounded-xl border border-border">
          <EncryptionFlowDiagram showLabels={showLabels} />
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mt-8 flex gap-2 justify-center">
        {steps.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 w-12 rounded-full transition-colors ${
              idx === currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Interactive Tutorials

### Step-by-Step Tutorial

```tsx
// app/tutorial/first-transfer/page.tsx
'use client';

import { useState } from 'react';
import { WebRTCFlowDiagram } from '@/components/diagrams';
import { CheckCircle2, Circle } from 'lucide-react';

const tutorialSteps = [
  { id: 1, title: 'Select Files', completed: false },
  { id: 2, title: 'Generate Connection', completed: false },
  { id: 3, title: 'Share Code', completed: false },
  { id: 4, title: 'Wait for Connection', completed: false },
  { id: 5, title: 'Transfer Files', completed: false },
];

export default function FirstTransferTutorial() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Your First File Transfer</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Steps sidebar */}
        <div className="md:col-span-1">
          <div className="space-y-2">
            {tutorialSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-3 rounded ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-50 dark:bg-green-950/30'
                    : 'bg-muted'
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content with diagram */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              How Connections Work
            </h2>
            <WebRTCFlowDiagram showLabels={true} />
          </div>

          <div className="prose prose-sm dark:prose-invert">
            <p>
              Follow the steps on the left to complete your first transfer.
              The diagram above shows what's happening behind the scenes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## API Documentation

### Developer Documentation

```tsx
// app/docs/api/encryption/page.tsx
import { EncryptionFlowDiagram } from '@/components/diagrams';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EncryptionAPI() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Encryption API</h1>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="my-8">
            <EncryptionFlowDiagram showLabels={true} />
          </div>

          <div className="prose prose-sm dark:prose-invert">
            <p>
              The encryption API provides post-quantum secure file encryption
              using a hybrid approach combining ML-KEM-768 and X25519.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted">
              <h3 className="font-mono text-sm mb-2">
                encryptFile(file: File, publicKey: Uint8Array)
              </h3>
              <p className="text-sm text-muted-foreground">
                Encrypts a file using hybrid post-quantum encryption.
              </p>
            </div>
            {/* More API docs... */}
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
            <code>{`import { encryptFile } from '@/lib/crypto';

const encrypted = await encryptFile(file, recipientPublicKey);`}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Security Reports

### Security Audit Report

```tsx
// app/security/audit-report/page.tsx
import {
  SystemArchitectureDiagram,
  EncryptionFlowDiagram,
  TripleRatchetDiagram,
} from '@/components/diagrams';

export default function SecurityAuditReport() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Security Audit Report</h1>
        <p className="text-muted-foreground">
          Comprehensive security analysis of Tallow's architecture
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          Report Date: January 2026 | Version: 1.0
        </div>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">1. System Overview</h2>
        <p className="text-muted-foreground mb-6">
          The following diagram illustrates Tallow's complete system architecture:
        </p>
        <div className="bg-card rounded-xl border border-border p-6">
          <SystemArchitectureDiagram showLabels={true} />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">2. Encryption Analysis</h2>
        <p className="text-muted-foreground mb-6">
          Analysis of the post-quantum encryption implementation:
        </p>
        <div className="bg-card rounded-xl border border-border p-6">
          <EncryptionFlowDiagram showLabels={true} />
        </div>

        <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
            ✓ Findings: Implementation follows NIST standards for post-quantum cryptography
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">3. Key Management</h2>
        <p className="text-muted-foreground mb-6">
          Evaluation of the Triple Ratchet protocol implementation:
        </p>
        <div className="bg-card rounded-xl border border-border p-6">
          <TripleRatchetDiagram showLabels={true} />
        </div>

        <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
            ✓ Findings: Forward secrecy and post-compromise security properly implemented
          </p>
        </div>
      </section>
    </div>
  );
}
```

---

## Tips for Best Integration

### 1. Context Matters
```tsx
// In technical docs - show all details
<EncryptionFlowDiagram showLabels={true} />

// In marketing - cleaner look
<EncryptionFlowDiagram showLabels={false} />
```

### 2. Responsive Layouts
```tsx
// Stack on mobile, side-by-side on desktop
<div className="grid md:grid-cols-2 gap-8">
  <div>
    <h2>How It Works</h2>
    <p>Explanation text...</p>
  </div>
  <div>
    <WebRTCFlowDiagram />
  </div>
</div>
```

### 3. Print Optimization
```tsx
<div className="print:bg-white print:p-8">
  <SystemArchitectureDiagram showLabels={true} />
</div>
```

### 4. Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const EncryptionFlowDiagram = lazy(() =>
  import('@/components/diagrams').then(m => ({
    default: m.EncryptionFlowDiagram
  }))
);

<Suspense fallback={<DiagramSkeleton />}>
  <EncryptionFlowDiagram />
</Suspense>
```

---

## Next Steps

1. Browse the [README.md](./README.md) for component documentation
2. Visit `/architecture-diagrams` for live demos
3. Check [ARCHITECTURE.md](../../ARCHITECTURE.md) for system details
4. Explore [SECURITY.md](../../SECURITY.md) for security specifications

---

**Happy diagramming!** 🎨
