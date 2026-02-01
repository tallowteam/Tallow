/**
 * UseCaseGrid Component Examples
 *
 * This file demonstrates various ways to use the UseCaseGrid component
 * for showcasing different user personas and their use cases.
 */

import { UseCaseGrid, UseCase } from "./use-case-grid";

/**
 * Example 1: Basic Usage with Default Use Cases
 *
 * The simplest way to use the component with predefined use cases
 */
export function BasicUseCaseExample() {
  return (
    <div className="container-full py-24">
      <UseCaseGrid />
    </div>
  );
}

/**
 * Example 2: Custom Use Cases
 *
 * Demonstrates how to provide custom use cases for different industries
 */
export function CustomUseCaseExample() {
  const customUseCases: UseCase[] = [
    {
      id: "education",
      icon: "GraduationCap",
      persona: "Educators",
      scenario: "Professor sharing lecture materials with students securely",
      features: [
        "Student group sharing",
        "Assignment submissions",
        "Resource distribution",
        "Privacy-first approach",
      ],
    },
    {
      id: "research",
      icon: "Microscope",
      persona: "Researchers",
      scenario: "Scientists collaborating on sensitive research data",
      features: [
        "Large dataset transfers",
        "Peer review sharing",
        "Lab collaboration",
        "Data integrity",
      ],
    },
    {
      id: "finance",
      icon: "TrendingUp",
      persona: "Financial Advisors",
      scenario: "Advisor sending confidential reports to clients",
      features: [
        "Client confidentiality",
        "Compliance tracking",
        "Secure document exchange",
        "Audit logging",
      ],
    },
  ];

  return (
    <div className="container-full py-24">
      <UseCaseGrid useCases={customUseCases} />
    </div>
  );
}

/**
 * Example 3: With Custom Styling
 *
 * Shows how to apply custom styles to the component
 */
export function StyledUseCaseExample() {
  return (
    <div className="section-content bg-background">
      <div className="container-full">
        <UseCaseGrid className="max-w-7xl mx-auto" />
      </div>
    </div>
  );
}

/**
 * Example 4: On Dark Background Section
 *
 * Demonstrates usage in a dark section with proper contrast
 */
export function DarkSectionUseCaseExample() {
  return (
    <div className="section-dark">
      <div className="container-full">
        <UseCaseGrid />
      </div>
    </div>
  );
}

/**
 * Example 5: With Additional Context
 *
 * Shows how to combine the component with additional content
 */
export function ContextualUseCaseExample() {
  return (
    <div className="section-content">
      <div className="container-full">
        {/* Intro Section */}
        <div className="text-center mb-24">
          <span className="label-lg text-primary mb-4 block">
            Real-World Applications
          </span>
          <h2 className="display-lg mb-6">
            Trusted by Professionals Worldwide
          </h2>
          <p className="body-xl max-w-3xl mx-auto">
            From journalists protecting sources to healthcare providers
            ensuring HIPAA compliance, Tallow serves the most demanding
            security requirements across industries.
          </p>
        </div>

        {/* Use Case Grid */}
        <UseCaseGrid />

        {/* CTA Section */}
        <div className="text-center mt-24">
          <p className="body-lg mb-6">
            Ready to experience secure file sharing?
          </p>
          <button className="btn-primary">Get Started Free</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: Subset of Use Cases
 *
 * Shows how to display only specific use cases
 */
export function SubsetUseCaseExample() {
  const selectedUseCases: UseCase[] = [
    {
      id: "privacy-advocates",
      icon: "Shield",
      persona: "Privacy Advocates",
      scenario: "Journalist protecting sources while sharing sensitive documents",
      features: [
        "Maximum privacy mode",
        "Tor support",
        "Traffic obfuscation",
        "Metadata stripping",
      ],
    },
    {
      id: "healthcare-providers",
      icon: "Heart",
      persona: "Healthcare Providers",
      scenario: "Doctor sharing patient records with specialist",
      features: [
        "HIPAA compliance",
        "Encryption",
        "Audit trails",
        "Secure storage",
      ],
    },
    {
      id: "legal-professionals",
      icon: "Scale",
      persona: "Legal Professionals",
      scenario: "Lawyer sharing case files with co-counsel",
      features: [
        "Encryption",
        "Access controls",
        "Transfer logs",
        "Confidentiality",
      ],
    },
  ];

  return (
    <div className="container-full py-24">
      <UseCaseGrid useCases={selectedUseCases} />
    </div>
  );
}

/**
 * Example 7: Landing Page Integration
 *
 * Full landing page section with use cases
 */
export function LandingPageUseCaseSection() {
  return (
    <section className="section-content-lg" aria-labelledby="use-cases-section">
      <div className="container-full">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <span className="label">Use Cases</span>
          </div>
          <h2 className="display-lg mb-6">Built for Every Industry</h2>
          <p className="body-xl max-w-3xl mx-auto text-muted-foreground">
            Whether you're a journalist, developer, or healthcare professional,
            Tallow provides the security and features you need.
          </p>
        </div>

        {/* Use Case Grid */}
        <UseCaseGrid />

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 pt-24 border-t border-border">
          <div className="text-center">
            <div className="stat-number text-primary mb-2">10,000+</div>
            <p className="body-md">Active Users</p>
          </div>
          <div className="text-center">
            <div className="stat-number text-primary mb-2">50+</div>
            <p className="body-md">Countries</p>
          </div>
          <div className="text-center">
            <div className="stat-number text-primary mb-2">99.9%</div>
            <p className="body-md">Uptime</p>
          </div>
        </div>
      </div>
    </section>
  );
}
