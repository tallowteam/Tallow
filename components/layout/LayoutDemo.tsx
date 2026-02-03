'use client';

import { useState } from 'react';
import { Container, ContainerSize } from './Container';
import { Section, SectionVariant } from './Section';
import { Grid, GridColumns, GridGap } from './Grid';
import { Stack, StackDirection, StackGap } from './Stack';
import { Button } from '@/components/ui/button';

// Map shadcn-style variant to Tallow's button variants
type DemoVariant = 'default' | 'outline';
const mapVariant = (variant: DemoVariant): 'primary' | 'secondary' =>
  variant === 'default' ? 'primary' : 'secondary';

/**
 * Visual demonstration of all layout components
 * Use this component to preview and test layout variations
 *
 * @example
 * ```tsx
 * import { LayoutDemo } from '@/components/layout/LayoutDemo';
 *
 * <LayoutDemo />
 * ```
 */
export function LayoutDemo() {
  const [containerSize, setContainerSize] = useState<ContainerSize>('lg');
  const [sectionVariant, setSectionVariant] = useState<SectionVariant>('default');
  const [gridCols, setGridCols] = useState<GridColumns>(3);
  const [gridGap, setGridGap] = useState<GridGap>('md');
  const [stackDirection, setStackDirection] = useState<StackDirection>('vertical');
  const [stackGap, setStackGap] = useState<StackGap>('md');

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <Container size="xl">
        <Stack direction="vertical" gap="xl">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-zinc-100">
              Layout Components Demo
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Interactive demonstration of Tallow's layout system
            </p>
          </div>

          {/* Container Demo */}
          <Section variant="accent">
            <Container>
              <Stack direction="vertical" gap="lg">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    Container Component
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    Responsive content container with max-width variants
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">
                    Container Size
                  </label>
                  <Stack direction="horizontal" gap="sm" className="mt-2" wrap>
                    {(['sm', 'md', 'lg', 'xl', 'full'] as ContainerSize[]).map((size) => (
                      <Button
                        key={size}
                        size="sm"
                        variant={containerSize === size ? 'primary' : 'secondary'}
                        onClick={() => setContainerSize(size)}
                      >
                        {size.toUpperCase()}
                      </Button>
                    ))}
                  </Stack>
                </div>

                <Container size={containerSize} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                  <div className="text-center text-sm text-zinc-300">
                    Container size: <strong>{containerSize}</strong>
                  </div>
                  <div className="mt-2 text-center text-xs text-zinc-500">
                    Resize your browser to see responsive behavior
                  </div>
                </Container>
              </Stack>
            </Container>
          </Section>

          {/* Section Demo */}
          <Section variant="default">
            <Container>
              <Stack direction="vertical" gap="lg">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    Section Component
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    Page sections with consistent spacing and background variants
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300">
                    Section Variant
                  </label>
                  <Stack direction="horizontal" gap="sm" className="mt-2" wrap>
                    {(['default', 'accent', 'muted', 'gradient'] as SectionVariant[]).map((variant) => (
                      <Button
                        key={variant}
                        size="sm"
                        variant={sectionVariant === variant ? 'primary' : 'secondary'}
                        onClick={() => setSectionVariant(variant)}
                      >
                        {variant}
                      </Button>
                    ))}
                  </Stack>
                </div>

                <Section variant={sectionVariant} className="rounded-lg border border-zinc-700">
                  <div className="text-center text-sm text-zinc-300">
                    Section variant: <strong>{sectionVariant}</strong>
                  </div>
                </Section>
              </Stack>
            </Container>
          </Section>

          {/* Grid Demo */}
          <Section variant="muted">
            <Container>
              <Stack direction="vertical" gap="lg">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    Grid Component
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    Responsive grid system with configurable columns and gaps
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">
                      Grid Columns
                    </label>
                    <Stack direction="horizontal" gap="sm" className="mt-2" wrap>
                      {([1, 2, 3, 4] as GridColumns[]).map((cols) => (
                        <Button
                          key={cols}
                          size="sm"
                          variant={gridCols === cols ? 'primary' : 'secondary'}
                          onClick={() => setGridCols(cols)}
                        >
                          {cols} col
                        </Button>
                      ))}
                    </Stack>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300">
                      Grid Gap
                    </label>
                    <Stack direction="horizontal" gap="sm" className="mt-2" wrap>
                      {(['sm', 'md', 'lg', 'xl'] as GridGap[]).map((gap) => (
                        <Button
                          key={gap}
                          size="sm"
                          variant={gridGap === gap ? 'primary' : 'secondary'}
                          onClick={() => setGridGap(gap)}
                        >
                          {gap}
                        </Button>
                      ))}
                    </Stack>
                  </div>
                </div>

                <Grid cols={gridCols} gap={gridGap}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-24 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-300"
                    >
                      Item {i + 1}
                    </div>
                  ))}
                </Grid>
              </Stack>
            </Container>
          </Section>

          {/* Stack Demo */}
          <Section variant="gradient">
            <Container>
              <Stack direction="vertical" gap="lg">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    Stack Component
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    Flex-based stack for consistent spacing and alignment
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300">
                      Stack Direction
                    </label>
                    <Stack direction="horizontal" gap="sm" className="mt-2">
                      {(['vertical', 'horizontal'] as StackDirection[]).map((dir) => (
                        <Button
                          key={dir}
                          size="sm"
                          variant={stackDirection === dir ? 'primary' : 'secondary'}
                          onClick={() => setStackDirection(dir)}
                        >
                          {dir}
                        </Button>
                      ))}
                    </Stack>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300">
                      Stack Gap
                    </label>
                    <Stack direction="horizontal" gap="sm" className="mt-2" wrap>
                      {(['xs', 'sm', 'md', 'lg', 'xl'] as StackGap[]).map((gap) => (
                        <Button
                          key={gap}
                          size="sm"
                          variant={stackGap === gap ? 'primary' : 'secondary'}
                          onClick={() => setStackGap(gap)}
                        >
                          {gap}
                        </Button>
                      ))}
                    </Stack>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                  <Stack direction={stackDirection} gap={stackGap}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex h-16 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-6 text-zinc-300"
                      >
                        Item {i + 1}
                      </div>
                    ))}
                  </Stack>
                </div>
              </Stack>
            </Container>
          </Section>

          {/* Usage Example */}
          <Section variant="accent">
            <Container>
              <Stack direction="vertical" gap="lg">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100">
                    Complete Example
                  </h2>
                  <p className="mt-2 text-zinc-400">
                    Combining all layout components for a feature section
                  </p>
                </div>

                <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-6">
                  <pre className="overflow-x-auto text-sm text-zinc-300">
                    <code>{`<Section variant="gradient" id="features">
  <Container size="lg">
    <Stack direction="vertical" gap="xl" align="center">
      <div className="text-center">
        <h2>Features</h2>
        <p>Discover what makes Tallow special</p>
      </div>

      <Grid cols={3} gap="lg">
        <FeatureCard />
        <FeatureCard />
        <FeatureCard />
      </Grid>

      <Stack direction="horizontal" gap="md">
        <Button>Get Started</Button>
        <Button variant="outline">Learn More</Button>
      </Stack>
    </Stack>
  </Container>
</Section>`}</code>
                  </pre>
                </div>
              </Stack>
            </Container>
          </Section>
        </Stack>
      </Container>
    </div>
  );
}
