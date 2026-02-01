/**
 * TechnologyShowcase Component Examples
 *
 * This file demonstrates various ways to use the TechnologyShowcase component
 * for highlighting cutting-edge technologies used in the application.
 */

import { TechnologyShowcase, Technology } from "./technology-showcase";

/**
 * Example 1: Basic Usage with Default Technologies
 *
 * The simplest way to use the component with predefined technologies
 */
export function BasicTechnologyExample() {
  return (
    <div className="container-full py-24">
      <TechnologyShowcase />
    </div>
  );
}

/**
 * Example 2: Custom Technologies
 *
 * Demonstrates how to provide custom technologies for different features
 */
export function CustomTechnologyExample() {
  const customTechnologies: Technology[] = [
    {
      id: "zero-knowledge",
      icon: "Eye",
      name: "Zero-Knowledge Architecture",
      description:
        "End-to-end encryption ensures that only you and your recipients can access your files. Not even our servers can decrypt your data.",
      why: "Complete privacy with no trust required in the service provider",
      link: "/security",
    },
    {
      id: "distributed-network",
      icon: "Network",
      name: "Distributed Network",
      description:
        "Multi-path routing through a decentralized network of nodes ensures your transfers are fast, reliable, and resistant to censorship.",
      why: "No single point of failure and improved global connectivity",
      link: "/how-it-works",
    },
    {
      id: "blockchain-verification",
      icon: "Shield",
      name: "Blockchain Verification",
      description:
        "Optional blockchain-based integrity verification provides cryptographic proof that your files haven't been tampered with during transfer.",
      why: "Immutable proof of file integrity and transfer authenticity",
      link: "/security",
    },
  ];

  return (
    <div className="container-full py-24">
      <TechnologyShowcase technologies={customTechnologies} />
    </div>
  );
}

/**
 * Example 3: On Dark Background
 *
 * Shows usage in a dark section with proper styling
 */
export function DarkSectionTechnologyExample() {
  return (
    <div className="section-dark">
      <div className="container-full">
        <TechnologyShowcase />
      </div>
    </div>
  );
}

/**
 * Example 4: With Custom Styling
 *
 * Demonstrates custom styling and layout adjustments
 */
export function StyledTechnologyExample() {
  return (
    <div className="section-content bg-muted/30">
      <div className="container-full">
        <TechnologyShowcase className="max-w-7xl mx-auto" />
      </div>
    </div>
  );
}

/**
 * Example 5: Subset of Technologies
 *
 * Shows how to display only specific technologies
 */
export function SubsetTechnologyExample() {
  const selectedTechnologies: Technology[] = [
    {
      id: "ml-kem-768",
      icon: "Shield",
      name: "ML-KEM-768 (Kyber)",
      description:
        "NIST-standardized quantum-resistant encryption protecting against future quantum computers",
      why: "Your files stay secure even in a post-quantum world",
      link: "/security",
    },
    {
      id: "webrtc-datachannels",
      icon: "Zap",
      name: "WebRTC DataChannels",
      description:
        "Browser-native peer-to-peer connections with DTLS-SRTP encryption and NAT traversal",
      why: "Maximum speed with zero server access to your files",
      link: "/how-it-works",
    },
  ];

  return (
    <div className="container-full py-24">
      <TechnologyShowcase technologies={selectedTechnologies} />
    </div>
  );
}

/**
 * Example 6: Landing Page Integration
 *
 * Full landing page section with technology showcase
 */
export function LandingPageTechnologySection() {
  return (
    <section
      className="section-content-lg bg-gradient-to-b from-background to-muted/20"
      aria-labelledby="technology-section"
    >
      <div className="container-full">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <span className="label">Technology</span>
          </div>
          <h2 className="display-lg mb-6">Enterprise-Grade Security</h2>
          <p className="body-xl max-w-3xl mx-auto text-muted-foreground">
            Built on cutting-edge cryptographic standards and peer-to-peer
            networking technology to deliver uncompromising security and
            performance.
          </p>
        </div>

        {/* Technology Showcase */}
        <TechnologyShowcase />

        {/* Additional Info */}
        <div className="mt-24 text-center">
          <div className="inline-flex flex-col items-center gap-4 bg-card p-8 rounded-xl border border-border max-w-2xl mx-auto">
            <h3 className="heading-md">Open Source & Audited</h3>
            <p className="body-md text-muted-foreground">
              Our cryptographic implementation has been independently audited by
              security researchers and is fully open source for community
              review.
            </p>
            <button className="btn-outline">View Security Audit</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Example 7: Side-by-Side Comparison
 *
 * Shows technology showcase alongside competitor comparison
 */
export function ComparisonTechnologyExample() {
  return (
    <div className="section-content">
      <div className="container-full">
        {/* Technology Section */}
        <TechnologyShowcase />

        {/* Comparison Table */}
        <div className="mt-32">
          <h3 className="display-sm text-center mb-12">
            How We Compare
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Tallow</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">
                    Competitors
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-4">Post-Quantum Encryption</td>
                  <td className="text-center p-4 text-green-600">✓</td>
                  <td className="text-center p-4 text-red-600">✗</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">True P2P Transfer</td>
                  <td className="text-center p-4 text-green-600">✓</td>
                  <td className="text-center p-4 text-red-600">✗</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Zero Server Storage</td>
                  <td className="text-center p-4 text-green-600">✓</td>
                  <td className="text-center p-4 text-red-600">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 8: Technology with Testimonials
 *
 * Combines technology showcase with user testimonials
 */
export function TechnologyWithTestimonialsExample() {
  return (
    <div className="section-content-lg">
      <div className="container-full">
        {/* Technology Showcase */}
        <TechnologyShowcase />

        {/* Testimonials */}
        <div className="mt-32">
          <h3 className="display-sm text-center mb-16">
            Trusted by Security Experts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-clean p-8">
              <p className="body-lg mb-6 italic">
                "The implementation of post-quantum cryptography in Tallow is
                impressive. They're ahead of the curve in preparing for the
                quantum computing era."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10" />
                <div>
                  <p className="font-semibold">Dr. Sarah Chen</p>
                  <p className="text-sm text-muted-foreground">
                    Cryptography Researcher
                  </p>
                </div>
              </div>
            </div>
            <div className="card-clean p-8">
              <p className="body-lg mb-6 italic">
                "As a security auditor, I appreciate the transparency and
                attention to detail in Tallow's architecture. It's refreshing
                to see security done right."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10" />
                <div>
                  <p className="font-semibold">Marcus Rodriguez</p>
                  <p className="text-sm text-muted-foreground">
                    Security Consultant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
