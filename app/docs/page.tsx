'use client';

import Link from 'next/link';
import { Container, Section } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import styles from './page.module.css';

export default function DocsPage() {
  return (
    <div className={styles.docsHome}>
      {/* Header */}
      <header className={styles.header}>
        <Container>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Tallow Documentation</h1>
            <p className={styles.subtitle}>
              Complete guide to building secure, fast file transfers with Tallow
            </p>
          </div>
        </Container>
      </header>

      {/* Quick Start */}
      <Section className={styles.section}>
        <Container>
          <h2 className={styles.sectionTitle}>Quick Start</h2>
          <div className={styles.grid}>
            <Card className={styles.card}>
              <CardHeader>
                <h3 className={styles.cardTitle}>Getting Started</h3>
                <p className={styles.cardDescription}>
                  Installation and basic setup
                </p>
              </CardHeader>
              <CardBody>
                <p className={styles.cardContent}>
                  Learn how to install Tallow components and set up your development environment.
                </p>
              </CardBody>
              <CardFooter>
                <Link href="/docs/getting-started" className={styles.link}>
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className={styles.card}>
              <CardHeader>
                <h3 className={styles.cardTitle}>Component Library</h3>
                <p className={styles.cardDescription}>
                  Browse all available components
                </p>
              </CardHeader>
              <CardBody>
                <p className={styles.cardContent}>
                  Explore our component library with detailed examples and usage patterns.
                </p>
              </CardBody>
              <CardFooter>
                <Link href="/docs/components" className={styles.link}>
                  <Button variant="primary" size="sm">
                    Browse Components
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className={styles.card}>
              <CardHeader>
                <h3 className={styles.cardTitle}>Design System</h3>
                <p className={styles.cardDescription}>
                  Colors, typography, and tokens
                </p>
              </CardHeader>
              <CardBody>
                <p className={styles.cardContent}>
                  Understand our design system foundation and design tokens.
                </p>
              </CardBody>
              <CardFooter>
                <Link href="/docs/design-system" className={styles.link}>
                  <Button variant="primary" size="sm">
                    View Design System
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </Container>
      </Section>

      {/* Features Overview */}
      <Section className={`${styles.section} ${styles.sectionAlt}`}>
        <Container>
          <h2 className={styles.sectionTitle}>Documentation Sections</h2>
          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>01</div>
              <h3 className={styles.featureTitle}>Component Reference</h3>
              <p className={styles.featureDescription}>
                Complete API documentation for all UI components, including props, variants, and usage examples.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>02</div>
              <h3 className={styles.featureTitle}>Design Tokens</h3>
              <p className={styles.featureDescription}>
                Comprehensive design system with colors, spacing, typography, and other design tokens.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>03</div>
              <h3 className={styles.featureTitle}>Code Examples</h3>
              <p className={styles.featureDescription}>
                Real-world examples and code snippets demonstrating best practices and patterns.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>04</div>
              <h3 className={styles.featureTitle}>Live Previews</h3>
              <p className={styles.featureDescription}>
                Interactive component previews showing all variants and states.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>05</div>
              <h3 className={styles.featureTitle}>API Reference</h3>
              <p className={styles.featureDescription}>
                Complete backend API documentation with endpoints, parameters, and responses.
              </p>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>06</div>
              <h3 className={styles.featureTitle}>Best Practices</h3>
              <p className={styles.featureDescription}>
                Guidelines and best practices for building secure, performant applications.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Categories */}
      <Section className={styles.section}>
        <Container>
          <h2 className={styles.sectionTitle}>Component Categories</h2>
          <div className={styles.categoriesGrid}>
            <Link href="/docs/components?category=ui" className={styles.categoryCard}>
              <h3>UI Components</h3>
              <p>Buttons, Cards, Inputs, Modals, and more</p>
            </Link>
            <Link href="/docs/components?category=layout" className={styles.categoryCard}>
              <h3>Layout</h3>
              <p>Container, Section, Grid, Stack components</p>
            </Link>
            <Link href="/docs/components?category=forms" className={styles.categoryCard}>
              <h3>Forms</h3>
              <p>Input, Select, and form-related components</p>
            </Link>
            <Link href="/docs/components?category=feedback" className={styles.categoryCard}>
              <h3>Feedback</h3>
              <p>Toast, Spinner, Badge components</p>
            </Link>
            <Link href="/docs/components?category=navigation" className={styles.categoryCard}>
              <h3>Navigation</h3>
              <p>Tabs, Breadcrumb, Sidebar, Pagination</p>
            </Link>
            <Link href="/docs/components?category=effects" className={styles.categoryCard}>
              <h3>Effects</h3>
              <p>Animations, transitions, and visual effects</p>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Resources */}
      <Section className={`${styles.section} ${styles.sectionAlt}`}>
        <Container>
          <h2 className={styles.sectionTitle}>Resources</h2>
          <div className={styles.resourcesGrid}>
            <Card className={styles.resourceCard}>
              <CardHeader>
                <h3 className={styles.resourceTitle}>API Documentation</h3>
              </CardHeader>
              <CardBody>
                <p className={styles.resourceDescription}>
                  Detailed API reference for backend integration
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm" fullWidth>
                  View API Docs
                </Button>
              </CardFooter>
            </Card>

            <Card className={styles.resourceCard}>
              <CardHeader>
                <h3 className={styles.resourceTitle}>GitHub Repository</h3>
              </CardHeader>
              <CardBody>
                <p className={styles.resourceDescription}>
                  Source code and contribution guidelines
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm" fullWidth>
                  View Repository
                </Button>
              </CardFooter>
            </Card>

            <Card className={styles.resourceCard}>
              <CardHeader>
                <h3 className={styles.resourceTitle}>Live Playground</h3>
              </CardHeader>
              <CardBody>
                <p className={styles.resourceDescription}>
                  Interactive component sandbox
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm" fullWidth>
                  Open Playground
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className={styles.cta}>
        <Container>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to get started?</h2>
            <p className={styles.ctaDescription}>
              Explore our components and build amazing things with Tallow
            </p>
            <div className={styles.ctaActions}>
              <Link href="/docs/getting-started">
                <Button variant="primary" size="lg">
                  Get Started Now
                </Button>
              </Link>
              <Link href="/docs/components">
                <Button variant="secondary" size="lg">
                  Browse Components
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
