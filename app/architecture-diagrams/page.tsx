'use client';

/**
 * Architecture Diagrams Demo Page
 *
 * Standalone visualization of Tallow's system architecture and
 * cryptographic flows. Educational diagrams for technical documentation.
 *
 * This demo is completely self-contained and works independently.
 */

import { useState } from 'react';
import {
  WebRTCFlowDiagram,
  EncryptionFlowDiagram,
  TripleRatchetDiagram,
  SystemArchitectureDiagram,
} from '@/components/diagrams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  EyeOff,
  Download,
  FileText,
  ArrowLeft,
  Home,
  Layers,
  Network,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import Link from 'next/link';

const diagrams = [
  {
    id: 'system',
    title: 'System Architecture',
    description: 'High-level overview of the complete Tallow system including all major components',
    component: SystemArchitectureDiagram,
    icon: Layers,
    color: 'text-white',
    bgColor: 'bg-white/20/10',
  },
  {
    id: 'webrtc',
    title: 'WebRTC Connection Flow',
    description: 'Step-by-step peer-to-peer connection establishment via signaling',
    component: WebRTCFlowDiagram,
    icon: Network,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    id: 'encryption',
    title: 'Encryption Flow',
    description: 'Post-quantum hybrid encryption pipeline for secure file transfers',
    component: EncryptionFlowDiagram,
    icon: Lock,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'ratchet',
    title: 'Triple Ratchet Protocol',
    description: 'Forward secrecy and key rotation mechanism for continuous security',
    component: TripleRatchetDiagram,
    icon: RefreshCw,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

export default function ArchitectureDiagramsPage() {
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <Link href="/app">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Open App
              </Button>
            </Link>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            Demo Mode
          </span>
        </div>
      </header>

      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Architecture Diagrams
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Educational visualizations of Tallow's system components and cryptographic flows.
                Use these diagrams to understand how secure file transfer works.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
                className="gap-2"
              >
                {showLabels ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Labels
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Labels
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="bg-white/5 dark:bg-white/5 border-white/20 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-white" />
              How to Use These Diagrams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Scroll down to view each diagram section</li>
              <li>Use the <strong>Show/Hide Labels</strong> toggle to simplify or detail the diagrams</li>
              <li>Use the quick navigation at the bottom to jump between diagrams</li>
              <li>Diagrams are theme-aware and will adapt to light/dark mode</li>
            </ol>
            <p className="mt-4 text-sm text-white">
              These diagrams are designed for educational purposes and can be used in documentation,
              presentations, or technical discussions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-16">
          {diagrams.map((diagram) => {
            const IconComponent = diagram.icon;

            return (
              <section key={diagram.id} id={diagram.id}>
                {/* Diagram Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${diagram.bgColor}`}>
                        <IconComponent className={`h-5 w-5 ${diagram.color}`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground mb-1">
                          {diagram.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {diagram.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // In a real implementation, this would export to SVG/PNG
                        console.log(`Export ${diagram.id} diagram`);
                      }}
                      title="Export diagram"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>

                {/* Diagram Component */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <diagram.component showLabels={showLabels} />
                </div>
              </section>
            );
          })}
        </div>

        {/* Footer Information */}
        <div className="mt-16 p-6 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Using These Diagrams
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  These diagrams are designed to be educational and can be used in documentation,
                  presentations, or technical discussions about Tallow's architecture.
                </p>
                <p>
                  All diagrams are theme-aware and responsive, automatically adapting to light,
                  dark, and high-contrast modes. They can be toggled to show or hide detailed
                  labels depending on your needs.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded bg-background border border-border">
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Import in Your Code
                  </h4>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`import {
  SystemArchitectureDiagram,
  WebRTCFlowDiagram,
  EncryptionFlowDiagram,
  TripleRatchetDiagram,
} from '@/components/diagrams';`}
                  </pre>
                </div>

                <div className="p-3 rounded bg-background border border-border">
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Usage Example
                  </h4>
                  <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`<WebRTCFlowDiagram
  showLabels={true}
  className="max-w-4xl"
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-8 p-4 rounded-lg bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Quick Navigation
          </h3>
          <div className="flex flex-wrap gap-2">
            {diagrams.map((diagram) => {
              const IconComponent = diagram.icon;
              return (
                <a
                  key={diagram.id}
                  href={`#${diagram.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
                >
                  <IconComponent className={`h-3.5 w-3.5 ${diagram.color}`} />
                  {diagram.title}
                </a>
              );
            })}
          </div>
        </div>

        {/* Other Demos Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Explore More Demos</CardTitle>
            <CardDescription>
              Check out other interactive demonstrations of Tallow's features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/transfer-demo">
                <Button variant="outline" size="sm">
                  File Transfer Demo
                </Button>
              </Link>
              <Link href="/metadata-demo">
                <Button variant="outline" size="sm">
                  Metadata Stripping Demo
                </Button>
              </Link>
              <Link href="/screen-share-demo">
                <Button variant="outline" size="sm">
                  Screen Sharing Demo
                </Button>
              </Link>
              <Link href="/ui-demo">
                <Button variant="outline" size="sm">
                  UI Components Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 mt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Ready to experience secure file transfer?
          </p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              <Layers className="h-5 w-5" />
              Launch Tallow App
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
