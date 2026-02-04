'use client';

import { Container, Section } from '@/components/layout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import DocsSidebar from '@/components/docs/DocsSidebar';
import Link from 'next/link';
import styles from './page.module.css';

interface ComponentInfo {
  name: string;
  category: string;
  description: string;
  slug: string;
}

const components: ComponentInfo[] = [
  // UI Components
  {
    name: 'Button',
    category: 'UI',
    description: 'Interactive button with multiple variants and sizes',
    slug: 'button',
  },
  {
    name: 'Card',
    category: 'UI',
    description: 'Container for grouping related content',
    slug: 'card',
  },
  {
    name: 'Input',
    category: 'UI',
    description: 'Text input field with validation support',
    slug: 'input',
  },
  {
    name: 'Badge',
    category: 'UI',
    description: 'Label for highlighting information',
    slug: 'badge',
  },
  {
    name: 'Modal',
    category: 'UI',
    description: 'Dialog for important user interactions',
    slug: 'modal',
  },
  {
    name: 'Spinner',
    category: 'UI',
    description: 'Loading indicator animation',
    slug: 'spinner',
  },
  {
    name: 'Tooltip',
    category: 'UI',
    description: 'Hover tooltip for additional information',
    slug: 'tooltip',
  },

  // Layout Components
  {
    name: 'Container',
    category: 'Layout',
    description: 'Responsive width container with max-width',
    slug: 'container',
  },
  {
    name: 'Section',
    category: 'Layout',
    description: 'Full-width section with padding',
    slug: 'section',
  },
  {
    name: 'Grid',
    category: 'Layout',
    description: 'CSS Grid-based layout component',
    slug: 'grid',
  },
  {
    name: 'Stack',
    category: 'Layout',
    description: 'Flexbox-based spacing component',
    slug: 'stack',
  },
  {
    name: 'Header',
    category: 'Layout',
    description: 'Page header component',
    slug: 'header',
  },
  {
    name: 'Footer',
    category: 'Layout',
    description: 'Page footer component',
    slug: 'footer',
  },

  // Form Components
  {
    name: 'Select',
    category: 'Forms',
    description: 'Dropdown select component',
    slug: 'select',
  },
  {
    name: 'Checkbox',
    category: 'Forms',
    description: 'Multiple selection checkbox',
    slug: 'checkbox',
  },
  {
    name: 'Radio',
    category: 'Forms',
    description: 'Single selection radio button',
    slug: 'radio',
  },

  // Feedback Components
  {
    name: 'Toast',
    category: 'Feedback',
    description: 'Temporary notification messages',
    slug: 'toast',
  },
  {
    name: 'Alert',
    category: 'Feedback',
    description: 'Important alert notification',
    slug: 'alert',
  },

  // Navigation Components
  {
    name: 'Tabs',
    category: 'Navigation',
    description: 'Tabbed content navigation',
    slug: 'tabs',
  },
  {
    name: 'Breadcrumb',
    category: 'Navigation',
    description: 'Navigation path breadcrumb',
    slug: 'breadcrumb',
  },
  {
    name: 'Sidebar',
    category: 'Navigation',
    description: 'Side navigation menu',
    slug: 'sidebar',
  },
  {
    name: 'Pagination',
    category: 'Navigation',
    description: 'Page navigation component',
    slug: 'pagination',
  },

  // Effect Components
  {
    name: 'FadeIn',
    category: 'Effects',
    description: 'Fade in animation effect',
    slug: 'fade-in',
  },
  {
    name: 'Typewriter',
    category: 'Effects',
    description: 'Typewriter text animation',
    slug: 'typewriter',
  },
  {
    name: 'GradientText',
    category: 'Effects',
    description: 'Gradient text effect',
    slug: 'gradient-text',
  },
];

const categories = [...new Set(components.map((c) => c.category))];

export default function ComponentsPage() {
  return (
    <div className={styles.page}>
      <DocsSidebar />

      <main className={styles.content}>
        <Container>
          <Section>
            <h1 className={styles.title}>Component Library</h1>
            <p className={styles.intro}>
              Browse all available components in the Tallow component library.
            </p>

            {/* Categories */}
            {categories.map((category) => (
              <div key={category} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{category} Components</h2>
                <div className={styles.componentsGrid}>
                  {components
                    .filter((c) => c.category === category)
                    .map((component) => (
                      <Link
                        key={component.slug}
                        href={`/docs/components/${component.slug}`}
                      >
                        <Card className={styles.componentCard}>
                          <CardHeader>
                            <h3 className={styles.componentName}>
                              {component.name}
                            </h3>
                          </CardHeader>
                          <CardBody>
                            <p className={styles.componentDescription}>
                              {component.description}
                            </p>
                          </CardBody>
                        </Card>
                      </Link>
                    ))}
                </div>
              </div>
            ))}

            {/* Quick Links */}
            <div className={styles.quickLinks}>
              <h2 className={styles.quickLinksTitle}>Quick Navigation</h2>
              <div className={styles.linkGrid}>
                {categories.map((category) => (
                  <a
                    key={category}
                    href={`#${category.toLowerCase()}`}
                    className={styles.quickLink}
                  >
                    {category} Components
                  </a>
                ))}
              </div>
            </div>
          </Section>
        </Container>
      </main>
    </div>
  );
}
