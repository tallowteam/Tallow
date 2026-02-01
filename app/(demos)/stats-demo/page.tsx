'use client';

/**
 * Stats Demo Page
 * Showcases Euveka-style statistics components for TALLOW
 */


import {
  StatCounter,
  StatsRow,
  StatsGrid,
  TallowStatsSection,
  PercentageStat,
  SpeedStat,
  TimeStat,
  CountStat,
  type StatItem,
} from '@/components/stats';

// ============================================================================
// DEMO DATA
// ============================================================================

const transferStats: StatItem[] = [
  {
    id: 'speed',
    value: 2.5,
    suffix: 'GB/s',
    label: 'Transfer Speed',
    sublabel: 'Peak local network',
    decimals: 1,
  },
  {
    id: 'latency',
    value: 90,
    suffix: 'ms',
    label: 'Avg Latency',
    sublabel: 'End-to-end encryption',
  },
  {
    id: 'uptime',
    value: 99.9,
    suffix: '%',
    label: 'Uptime',
    sublabel: 'P2P reliability',
    decimals: 1,
  },
  {
    id: 'users',
    value: 50000,
    suffix: '+',
    label: 'Active Users',
    sublabel: 'Growing daily',
  },
];

const securityStats: StatItem[] = [
  {
    id: 'encryption-bits',
    value: 256,
    label: 'Bit Encryption',
    sublabel: 'AES-256-GCM',
  },
  {
    id: 'data-stored',
    value: 0,
    label: 'Data Stored',
    sublabel: 'Zero-knowledge',
  },
  {
    id: 'security-score',
    value: 100,
    suffix: '%',
    label: 'Security Score',
    sublabel: 'Independent audit',
  },
];

const compactStats: StatItem[] = [
  { id: 'files', value: 1000000, suffix: '+', label: 'Files Transferred' },
  { id: 'tb', value: 500, suffix: 'TB', label: 'Data Moved' },
  { id: 'countries', value: 120, suffix: '+', label: 'Countries' },
  { id: 'rating', value: 4.9, label: 'App Rating', decimals: 1 },
  { id: 'downloads', value: 250000, suffix: '+', label: 'Downloads' },
  { id: 'time-saved', value: 40, suffix: '%', label: 'Time Saved' },
];

// ============================================================================
// DEMO PAGE
// ============================================================================

export default function StatsDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="py-16 md:py-24 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display font-light text-5xl md:text-6xl lg:text-7xl text-foreground mb-6"
              style={{ letterSpacing: '-0.03em' }}>
            Euveka Stats
          </h1>
          <p className="font-sans text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Elegant statistics displays with animated count-up, dashed separators,
            and scroll-triggered animations.
          </p>
        </div>
      </header>

      {/* Section 1: Pre-configured TALLOW Stats */}
      <TallowStatsSection className="border-b border-border/30" />

      {/* Section 2: Custom Stats Row */}
      <section className="py-20 md:py-32 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-light text-3xl md:text-4xl text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}>
              Transfer Performance
            </h2>
            <p className="font-sans text-muted-foreground">
              Real-time statistics from our network
            </p>
          </div>

          <StatsRow
            stats={transferStats}
            size="lg"
            variant="default"
            separatorStyle="dashed"
            staggerDelay={0.2}
          />
        </div>
      </section>

      {/* Section 3: Security Stats with Different Separator */}
      <section className="py-20 md:py-32 bg-card/30 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-light text-3xl md:text-4xl text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}>
              Security Standards
            </h2>
            <p className="font-sans text-muted-foreground">
              Enterprise-grade protection for your data
            </p>
          </div>

          <StatsRow
            stats={securityStats}
            size="xl"
            variant="centered"
            separatorStyle="gradient"
          />
        </div>
      </section>

      {/* Section 4: Stats Grid */}
      <section className="py-20 md:py-32 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-light text-3xl md:text-4xl text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}>
              Platform Overview
            </h2>
            <p className="font-sans text-muted-foreground">
              A comprehensive look at TALLOW in numbers
            </p>
          </div>

          <StatsGrid
            stats={compactStats}
            columns={3}
            size="md"
            staggerDelay={0.1}
          />
        </div>
      </section>

      {/* Section 5: Individual Stat Examples */}
      <section className="py-20 md:py-32 border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-light text-3xl md:text-4xl text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}>
              Component Variants
            </h2>
            <p className="font-sans text-muted-foreground">
              Different sizes and specialized stat types
            </p>
          </div>

          {/* Size Variants */}
          <div className="mb-20">
            <h3 className="text-xl font-medium text-foreground mb-8 text-center">
              Size Variants
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
              <div className="p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">Small</p>
                <StatCounter value={1234} label="Files" suffix="+" size="sm" />
              </div>
              <div className="p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">Medium</p>
                <StatCounter value={5678} label="Users" suffix="+" size="md" />
              </div>
              <div className="p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">Large</p>
                <StatCounter value={9012} label="Downloads" suffix="+" size="lg" />
              </div>
              <div className="p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">Extra Large</p>
                <StatCounter value={3456} label="Stars" suffix="+" size="xl" />
              </div>
              <div className="p-6 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">2X Large</p>
                <StatCounter value={99} label="Score" suffix="%" size="2xl" />
              </div>
            </div>
          </div>

          {/* Specialized Types */}
          <div>
            <h3 className="text-xl font-medium text-foreground mb-8 text-center">
              Specialized Types
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">PercentageStat</p>
                <PercentageStat value={85} label="Efficiency" sublabel="Optimized transfers" />
              </div>
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">SpeedStat</p>
                <SpeedStat value={1.8} label="Avg Speed" decimals={1} unit="GB/s" />
              </div>
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">TimeStat</p>
                <TimeStat value={45} label="Avg Time" sublabel="Per 1GB transfer" unit="sec" />
              </div>
              <div className="p-8 rounded-2xl border border-border/50 text-center">
                <p className="text-sm text-muted-foreground mb-4">CountStat</p>
                <CountStat value={25000} label="Users" sublabel="This month" showPlus />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: No Separators + Compact */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-light text-3xl md:text-4xl text-foreground mb-4"
                style={{ letterSpacing: '-0.02em' }}>
              Minimal Style
            </h2>
            <p className="font-sans text-muted-foreground">
              Clean layout without separators
            </p>
          </div>

          <StatsRow
            stats={[
              { id: 's1', value: 10000, suffix: '+', label: 'Files Sent' },
              { id: 's2', value: 80, suffix: '%', label: 'Faster Than Email' },
              { id: 's3', value: 40, suffix: '%', label: 'Storage Saved' },
            ]}
            size="lg"
            variant="spacious"
            showSeparators={false}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Euveka-style stats components for TALLOW
          </p>
        </div>
      </footer>
    </div>
  );
}
