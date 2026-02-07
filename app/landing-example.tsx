'use client';

/**
 * Landing Page Example with Features Section
 *
 * This demonstrates how to use the Features component in a complete landing page.
 * You can use this as a reference or copy sections to your actual landing page.
 */

import { Features } from '@/components/sections/Features';
import { Button } from '@/components/ui';
import { ArrowRight } from '@/components/icons';

export default function LandingExample() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        padding: 'var(--space-32) var(--space-4)',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'var(--font-size-6xl)',
          fontWeight: 'var(--font-weight-bold)',
          lineHeight: 'var(--line-height-tight)',
          marginBottom: 'var(--space-6)',
          letterSpacing: 'var(--letter-spacing-tight)',
        }}>
          Secure File Sharing, <br />Built for Privacy
        </h1>
        <p style={{
          fontSize: 'var(--font-size-xl)',
          color: 'var(--color-text-secondary)',
          lineHeight: 'var(--line-height-relaxed)',
          marginBottom: 'var(--space-8)',
        }}>
          Transfer files directly between devices with military-grade encryption.
          No servers, no storage, no tracking. Your data stays yours.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <Button size="lg">
            Get Started
            <ArrowRight style={{ marginLeft: 'var(--space-2)', width: '20px', height: '20px' }} />
          </Button>
          <Button variant="secondary" size="lg">
            View on GitHub
          </Button>
        </div>
      </section>

      {/* Features Section - Card Layout (Recommended) */}
      <Features
        variant="cards"
        title="Privacy-First File Sharing"
        description="Built from the ground up with security and privacy as core principles, not afterthoughts."
        animated
      />

      {/* Alternative: List Layout */}
      {/*
      <Features
        variant="list"
        title="Why Choose Tallow"
        description="The most secure way to share files, backed by cryptographic guarantees."
        animated={true}
      />
      */}

      {/* Alternative: Minimal Layout */}
      {/*
      <Features
        variant="minimal"
        title="Privacy First, Always"
        description="Every feature designed with your privacy in mind."
        animated={true}
      />
      */}

      {/* CTA Section */}
      <section style={{
        padding: 'var(--space-32) var(--space-4)',
        textAlign: 'center',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}>
        <h2 style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-4)',
        }}>
          Ready to share securely?
        </h2>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-8)',
        }}>
          Start transferring files with end-to-end encryption today.
        </p>
        <Button size="lg">
          Start Transfer
          <ArrowRight style={{ marginLeft: 'var(--space-2)', width: '20px', height: '20px' }} />
        </Button>
      </section>
    </div>
  );
}
