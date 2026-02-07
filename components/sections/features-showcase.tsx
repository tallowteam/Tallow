'use client';

/**
 * Features Section Showcase
 *
 * This file demonstrates all three variants of the Features component
 * with different layouts and styling options.
 */

import { Features, FeatureItem } from './Features';
import { Shield, Lock, Zap, Users, EyeOff, RefreshCw } from '@/components/icons';

// Example 1: Default Card Layout (Recommended)
export function FeaturesCardVariant() {
  return (
    <Features
      variant="cards"
      title="Enterprise-Grade Security"
      description="Built from the ground up with security and privacy as core principles, not afterthoughts."
      animated
    />
  );
}

// Example 2: List Layout (Compact)
export function FeaturesListVariant() {
  return (
    <Features
      variant="list"
      title="Why Choose Tallow"
      description="The most secure way to share files, backed by cryptographic guarantees."
      animated
    />
  );
}

// Example 3: Minimal Layout (Clean)
export function FeaturesMinimalVariant() {
  return (
    <Features
      variant="minimal"
      title="Privacy First, Always"
      description="Every feature designed with your privacy in mind."
      animated
    />
  );
}

// Example 4: Custom Features Array
export function FeaturesCustom() {
  const customFeatures = [
    {
      icon: Shield,
      title: 'Military-Grade Encryption',
      description: 'AES-256-GCM encryption ensures your files remain secure in transit and at rest.',
      badge: 'AES-256',
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge Architecture',
      description: 'We cannot access your files even if we wanted to. True end-to-end encryption.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Direct peer-to-peer connections mean maximum transfer speeds with minimum latency.',
    },
  ];

  return (
    <Features
      variant="cards"
      title="Custom Features"
      features={customFeatures}
      animated
    />
  );
}

// Example 5: Individual Feature Items (for custom layouts)
export function FeaturesCustomLayout() {
  return (
    <section style={{ padding: 'var(--space-24) 0' }}>
      <div className="container">
        <h2 style={{
          fontSize: 'var(--font-size-4xl)',
          textAlign: 'center',
          marginBottom: 'var(--space-16)'
        }}>
          Custom Layout Example
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)'
        }}>
          <FeatureItem
            icon={Shield}
            title="End-to-End Encryption"
            description="Your files are encrypted before they leave your device."
            badge="E2EE"
          />
          <FeatureItem
            icon={Lock}
            title="Post-Quantum Safe"
            description="Protected against future quantum threats."
            badge="PQC"
          />
          <FeatureItem
            icon={Zap}
            title="High Performance"
            description="Optimized for speed without compromising security."
          />
          <FeatureItem
            icon={Users}
            title="Multi-Recipient"
            description="Share with multiple people simultaneously."
          />
          <FeatureItem
            icon={EyeOff}
            title="Privacy Focused"
            description="Metadata stripped automatically."
          />
          <FeatureItem
            icon={RefreshCw}
            title="Fault Tolerant"
            description="Resume interrupted transfers seamlessly."
          />
        </div>
      </div>
    </section>
  );
}

// Example 6: Without animation
export function FeaturesNoAnimation() {
  return (
    <Features
      variant="cards"
      title="Static Features"
      description="For pages where you want instant display without animation."
      animated={false}
    />
  );
}
