/**
 * FeatureCard Component Usage Examples
 *
 * This file demonstrates all variants and configurations of the FeatureCard component.
 * Copy and paste these examples into your application as needed.
 */

import { FeatureCard, FeatureCardGrid } from "./feature-card";
import type { Feature } from "@/lib/features/types";

// ============================================
// EXAMPLE 1: Compact Variant (Grid Display)
// ============================================
// Best for: Feature catalogs, overview pages, category listings

const exampleFeature1: Feature = {
  id: "pqc-encryption",
  title: "Post-Quantum Encryption",
  description: "Industry-leading quantum-resistant encryption using Kyber-1024 for future-proof security.",
  status: "production",
  complexity: "advanced",
  icon: "shield-check",
  location: "lib/crypto/pqc-crypto.ts",
  tags: ["security", "encryption", "quantum-safe"],
};

export function CompactExample() {
  return (
    <FeatureCardGrid>
      <FeatureCard
        feature={exampleFeature1}
        variant="compact"
        showStatus
        onClick={() => console.log("Feature clicked")}
      />
      {/* Add more compact cards */}
    </FeatureCardGrid>
  );
}

// ============================================
// EXAMPLE 2: Detailed Variant (Full Info)
// ============================================
// Best for: Feature detail pages, documentation

const exampleFeature2: Feature = {
  id: "webrtc-transfer",
  title: "WebRTC P2P Transfer",
  description: "Direct peer-to-peer file transfers with zero server storage using WebRTC data channels.",
  status: "production",
  complexity: "intermediate",
  icon: "radio",
  location: "lib/transport/private-webrtc.ts",
  techSpecs: {
    protocol: "WebRTC",
    maxFileSize: "Unlimited",
    encryption: "DTLS-SRTP",
  } as any,
  codeExamples: [
    {
      language: "typescript",
      description: "Initialize a WebRTC connection",
      code: `import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';

const { connect, sendFile } = useP2PConnection({
  onConnected: () => console.log('Connected!'),
  onProgress: (progress) => console.log(progress),
});

// Send a file
await sendFile(myFile);`,
    },
  ],
  relatedFeatures: ["encryption", "signaling-server"],
  tags: ["webrtc", "p2p", "transfer"],
  metadata: {
    linesOfCode: 1247,
    testCoverage: 89,
    lastUpdated: "2024-01-20",
  },
};

export function DetailedExample() {
  return (
    <div className="max-w-2xl">
      <FeatureCard
        feature={exampleFeature2}
        variant="detailed"
        showStatus
        showTechSpecs
        showCodeExample
        onClick={() => console.log("Feature clicked")}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 3: Interactive Variant (With Actions)
// ============================================
// Best for: Feature showcases, landing pages

const exampleFeature3: Feature = {
  id: "group-transfer",
  title: "Group Transfers",
  description: "Send files to multiple recipients simultaneously with individual encryption.",
  status: "beta",
  complexity: "intermediate",
  icon: "users",
  location: "lib/transfer/group-transfer-manager.ts",
  techSpecs: {
    maxRecipients: "10",
    protocol: "Multi-peer WebRTC",
    encryption: "Per-recipient E2EE",
  } as any,
  documentation: "https://docs.example.com/group-transfers",
  tags: ["group", "multi-user", "collaboration"],
};

export function InteractiveExample() {
  return (
    <div className="max-w-2xl">
      <FeatureCard
        feature={exampleFeature3}
        variant="interactive"
        showStatus
        showTechSpecs
        onClick={() => console.log("Opening demo...")}
      />
    </div>
  );
}

// ============================================
// EXAMPLE 4: Status Badge Variations
// ============================================
// Demonstrates all status types

const statusExamples: Feature[] = [
  {
    id: "prod-feature",
    title: "Production Feature",
    description: "Fully tested and production-ready",
    status: "production",
    icon: "check-circle",
    location: "lib/example.ts",
  },
  {
    id: "beta-feature",
    title: "Beta Feature",
    description: "In testing phase, may have bugs",
    status: "beta",
    icon: "flask",
    location: "lib/example.ts",
  },
  {
    id: "experimental-feature",
    title: "Experimental Feature",
    description: "Early development, use with caution",
    status: "experimental",
    icon: "zap",
    location: "lib/example.ts",
  },
  {
    id: "planned-feature",
    title: "Planned Feature",
    description: "Planned for future implementation",
    status: "planned",
    icon: "calendar",
    location: "lib/example.ts",
  },
];

export function StatusBadgeExample() {
  return (
    <FeatureCardGrid>
      {statusExamples.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
          variant="compact"
          showStatus
        />
      ))}
    </FeatureCardGrid>
  );
}

// ============================================
// EXAMPLE 5: Responsive Grid Layout
// ============================================
// Desktop: 3 columns, Tablet: 2 columns, Mobile: 1 column

export function ResponsiveGridExample() {
  const features: Feature[] = [
    exampleFeature1,
    exampleFeature2,
    exampleFeature3,
    // Add more features...
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="display-md mb-8">Feature Catalog</h2>
      <FeatureCardGrid>
        {features.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            variant="compact"
            showStatus
            onClick={() => console.log(`Clicked: ${feature.id}`)}
          />
        ))}
      </FeatureCardGrid>
    </div>
  );
}

// ============================================
// EXAMPLE 6: With Dialog Integration
// ============================================
// Open a detail dialog when clicking a card

import { useState } from "react";

export function WithDialogExample() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <>
      <FeatureCardGrid>
        <FeatureCard
          feature={exampleFeature1}
          variant="compact"
          showStatus
          onClick={() => setSelectedFeature(exampleFeature1)}
        />
        {/* More cards */}
      </FeatureCardGrid>

      {/* Feature Detail Dialog would go here */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-auto">
            <FeatureCard
              feature={selectedFeature}
              variant="detailed"
              showStatus
              showTechSpecs
              showCodeExample
            />
            <button
              onClick={() => setSelectedFeature(null)}
              className="m-4 px-4 py-2 bg-primary text-primary-foreground rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// EXAMPLE 7: Custom Styling
// ============================================
// Override default styles with className prop

export function CustomStyledExample() {
  return (
    <FeatureCard
      feature={exampleFeature1}
      variant="compact"
      showStatus
      className="border-2 border-primary bg-primary/5 hover:bg-primary/10"
    />
  );
}

// ============================================
// EXAMPLE 8: Filtered Feature List
// ============================================
// Filter features by status or tags

export function FilteredExample() {
  const allFeatures: Feature[] = [
    exampleFeature1,
    exampleFeature2,
    exampleFeature3,
  ];

  const [filter, setFilter] = useState<"all" | "production" | "beta">("all");

  const filteredFeatures = allFeatures.filter((f) =>
    filter === "all" ? true : f.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setFilter("all")}>All</button>
        <button onClick={() => setFilter("production")}>Production</button>
        <button onClick={() => setFilter("beta")}>Beta</button>
      </div>

      <FeatureCardGrid>
        {filteredFeatures.map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            variant="compact"
            showStatus
          />
        ))}
      </FeatureCardGrid>
    </div>
  );
}

// ============================================
// EXAMPLE 9: Keyboard Navigation
// ============================================
// Cards are fully accessible with keyboard navigation

export function KeyboardNavigationExample() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Use Tab to navigate between cards, Enter or Space to activate
      </p>
      <FeatureCardGrid>
        {[exampleFeature1, exampleFeature2, exampleFeature3].map((feature) => (
          <FeatureCard
            key={feature.id}
            feature={feature}
            variant="compact"
            showStatus
            onClick={() => alert(`Activated: ${feature.title}`)}
          />
        ))}
      </FeatureCardGrid>
    </div>
  );
}

// ============================================
// EXAMPLE 10: Theme-Aware Cards
// ============================================
// Cards automatically adapt to light/dark/high-contrast modes

export function ThemeAwareExample() {
  return (
    <div className="space-y-6">
      <div className="bg-background p-6 rounded-lg">
        <h3 className="heading-sm mb-4">Light Mode</h3>
        <FeatureCard
          feature={exampleFeature1}
          variant="compact"
          showStatus
        />
      </div>

      <div className="bg-hero-bg text-hero-fg p-6 rounded-lg dark">
        <h3 className="heading-sm mb-4">Dark Mode</h3>
        <FeatureCard
          feature={exampleFeature1}
          variant="compact"
          showStatus
        />
      </div>

      <div className="high-contrast p-6 rounded-lg">
        <h3 className="heading-sm mb-4">High Contrast Mode</h3>
        <FeatureCard
          feature={exampleFeature1}
          variant="compact"
          showStatus
        />
      </div>
    </div>
  );
}
