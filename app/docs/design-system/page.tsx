'use client';

import { Container, Section } from '@/components/layout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import DocsSidebar from '@/components/docs/DocsSidebar';
import styles from './page.module.css';

export default function DesignSystemPage() {
  const colors = [
    { name: 'Primary', value: '#7c3aed', token: '--color-accent-primary' },
    { name: 'Secondary', value: '#6366f1', token: '--color-accent-secondary' },
    { name: 'Tertiary', value: '#3b82f6', token: '--color-accent-tertiary' },
    { name: 'Success', value: '#10b981', token: '--color-success' },
    { name: 'Warning', value: '#f59e0b', token: '--color-warning' },
    { name: 'Error', value: '#ef4444', token: '--color-error' },
  ];

  const fontSizes = [
    { name: 'XS', size: '12px', token: '--font-size-xs' },
    { name: 'SM', size: '14px', token: '--font-size-sm' },
    { name: 'Base', size: '16px', token: '--font-size-base' },
    { name: 'LG', size: '18px', token: '--font-size-lg' },
    { name: 'XL', size: '20px', token: '--font-size-xl' },
    { name: '2XL', size: '24px', token: '--font-size-2xl' },
    { name: '3XL', size: '30px', token: '--font-size-3xl' },
    { name: '4XL', size: '36px', token: '--font-size-4xl' },
    { name: '5XL', size: '48px', token: '--font-size-5xl' },
  ];

  const spacing = [
    { name: '1', size: '4px', token: '--spacing-1' },
    { name: '2', size: '8px', token: '--spacing-2' },
    { name: '3', size: '12px', token: '--spacing-3' },
    { name: '4', size: '16px', token: '--spacing-4' },
    { name: '6', size: '24px', token: '--spacing-6' },
    { name: '8', size: '32px', token: '--spacing-8' },
    { name: '12', size: '48px', token: '--spacing-12' },
    { name: '16', size: '64px', token: '--spacing-16' },
    { name: '24', size: '96px', token: '--spacing-24' },
  ];

  const borderRadius = [
    { name: 'SM', size: '4px', token: '--radius-sm' },
    { name: 'Base', size: '6px', token: '--radius-base' },
    { name: 'MD', size: '8px', token: '--radius-md' },
    { name: 'LG', size: '12px', token: '--radius-lg' },
    { name: 'XL', size: '16px', token: '--radius-xl' },
    { name: '2XL', size: '24px', token: '--radius-2xl' },
    { name: 'Full', size: '9999px', token: '--radius-full' },
  ];

  return (
    <div className={styles.page}>
      <DocsSidebar />

      <main className={styles.content}>
        <Container>
          <Section>
            <h1 className={styles.title}>Design System</h1>
            <p className={styles.intro}>
              Complete design system documentation with colors, typography, spacing, and more.
            </p>

            {/* Colors */}
            <h2 className={styles.sectionTitle}>Colors</h2>
            <p className={styles.text}>
              Our color palette is carefully crafted to provide excellent contrast and visual hierarchy.
            </p>
            <div className={styles.colorsGrid}>
              {colors.map((color) => (
                <Card key={color.token} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color.value }}
                  />
                  <div className={styles.colorInfo}>
                    <h4 className={styles.colorName}>{color.name}</h4>
                    <code className={styles.colorCode}>{color.value}</code>
                    <code className={styles.colorToken}>{color.token}</code>
                  </div>
                </Card>
              ))}
            </div>

            {/* Background Colors */}
            <h2 className={styles.sectionTitle}>Background Colors</h2>
            <p className={styles.text}>
              Background colors for different layers and contexts.
            </p>
            <div className={styles.backgroundGrid}>
              <Card className={styles.bgCard}>
                <div className={styles.bgSwatch} style={{ backgroundColor: '#0a0a0a' }} />
                <p className={styles.bgLabel}>Primary</p>
                <code className={styles.bgToken}>--color-background-primary</code>
              </Card>
              <Card className={styles.bgCard}>
                <div className={styles.bgSwatch} style={{ backgroundColor: '#111111' }} />
                <p className={styles.bgLabel}>Secondary</p>
                <code className={styles.bgToken}>--color-background-secondary</code>
              </Card>
              <Card className={styles.bgCard}>
                <div className={styles.bgSwatch} style={{ backgroundColor: '#171717' }} />
                <p className={styles.bgLabel}>Tertiary</p>
                <code className={styles.bgToken}>--color-background-tertiary</code>
              </Card>
              <Card className={styles.bgCard}>
                <div className={styles.bgSwatch} style={{ backgroundColor: '#1a1a1a' }} />
                <p className={styles.bgLabel}>Elevated</p>
                <code className={styles.bgToken}>--color-background-elevated</code>
              </Card>
            </div>

            {/* Typography */}
            <h2 className={styles.sectionTitle}>Typography</h2>
            <p className={styles.text}>
              Font sizes, weights, and line heights for consistent typography across the application.
            </p>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Font Sizes</h3>
              <div className={styles.fontSizesTable}>
                {fontSizes.map((font) => (
                  <div key={font.token} className={styles.fontSizeRow}>
                    <div
                      className={styles.fontSizePreview}
                      style={{ fontSize: font.size }}
                    >
                      Preview
                    </div>
                    <div className={styles.fontSizeInfo}>
                      <p className={styles.fontSizeName}>{font.name}</p>
                      <code className={styles.fontSizeValue}>{font.size}</code>
                      <code className={styles.fontSizeToken}>{font.token}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Font Families</h3>
              <div className={styles.fontFamilies}>
                <Card>
                  <CardHeader>
                    <h4 className={styles.fontFamilyName}>Sans Serif</h4>
                  </CardHeader>
                  <CardBody>
                    <p
                      style={{
                        fontFamily:
                          'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto',
                      }}
                    >
                      Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
                    </p>
                    <code>--font-family-sans</code>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className={styles.fontFamilyName}>Monospace</h4>
                  </CardHeader>
                  <CardBody>
                    <p style={{ fontFamily: 'Geist Mono, ui-monospace' }}>
                      Geist Mono, ui-monospace, SFMono-Regular
                    </p>
                    <code>--font-family-mono</code>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Spacing */}
            <h2 className={styles.sectionTitle}>Spacing Scale</h2>
            <p className={styles.text}>
              Consistent spacing values for margins, padding, and gaps.
            </p>
            <div className={styles.spacingGrid}>
              {spacing.map((space) => (
                <Card key={space.token} className={styles.spacingCard}>
                  <div
                    className={styles.spacingSwatch}
                    style={{
                      width: Math.min(parseInt(space.size), 100) + 'px',
                      height: '20px',
                      background: 'var(--gradient-accent)',
                    }}
                  />
                  <div className={styles.spacingInfo}>
                    <p className={styles.spacingName}>{space.name}</p>
                    <code className={styles.spacingValue}>{space.size}</code>
                    <code className={styles.spacingToken}>{space.token}</code>
                  </div>
                </Card>
              ))}
            </div>

            {/* Border Radius */}
            <h2 className={styles.sectionTitle}>Border Radius</h2>
            <p className={styles.text}>
              Rounded corner values for different component styles.
            </p>
            <div className={styles.borderRadiusGrid}>
              {borderRadius.map((radius) => (
                <Card key={radius.token} className={styles.radiusCard}>
                  <div
                    className={styles.radiusSwatch}
                    style={{ borderRadius: radius.size }}
                  />
                  <div className={styles.radiusInfo}>
                    <p className={styles.radiusName}>{radius.name}</p>
                    <code className={styles.radiusValue}>{radius.size}</code>
                    <code className={styles.radiusToken}>{radius.token}</code>
                  </div>
                </Card>
              ))}
            </div>

            {/* Shadows */}
            <h2 className={styles.sectionTitle}>Shadows</h2>
            <p className={styles.text}>
              Shadow effects for depth and elevation.
            </p>
            <div className={styles.shadowsGrid}>
              {[
                { name: 'SM', token: '--shadow-sm' },
                { name: 'Base', token: '--shadow-base' },
                { name: 'MD', token: '--shadow-md' },
                { name: 'LG', token: '--shadow-lg' },
                { name: 'XL', token: '--shadow-xl' },
              ].map((shadow) => (
                <Card key={shadow.token} className={styles.shadowCard}>
                  <div
                    className={styles.shadowSwatch}
                    style={{
                      boxShadow: `var(${shadow.token})`,
                    }}
                  />
                  <div className={styles.shadowInfo}>
                    <p className={styles.shadowName}>{shadow.name}</p>
                    <code className={styles.shadowToken}>{shadow.token}</code>
                  </div>
                </Card>
              ))}
            </div>

            {/* Breakpoints */}
            <h2 className={styles.sectionTitle}>Responsive Breakpoints</h2>
            <p className={styles.text}>
              Breakpoints for responsive design media queries.
            </p>
            <div className={styles.breakpointsTable}>
              {[
                { name: 'Mobile (SM)', width: '640px', token: '--breakpoint-sm' },
                { name: 'Tablet (MD)', width: '768px', token: '--breakpoint-md' },
                { name: 'Laptop (LG)', width: '1024px', token: '--breakpoint-lg' },
                { name: 'Desktop (XL)', width: '1280px', token: '--breakpoint-xl' },
                { name: 'TV (2XL)', width: '1536px', token: '--breakpoint-2xl' },
              ].map((bp) => (
                <div key={bp.token} className={styles.breakpointRow}>
                  <div className={styles.breakpointName}>{bp.name}</div>
                  <div className={styles.breakpointWidth}>{bp.width}</div>
                  <div className={styles.breakpointToken}>{bp.token}</div>
                </div>
              ))}
            </div>
          </Section>
        </Container>
      </main>
    </div>
  );
}
