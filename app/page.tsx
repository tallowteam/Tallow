import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { FeatureBlock } from '@/components/landing/FeatureBlock';
import { TransferVisual, SecurityVisual, PlatformVisual } from '@/components/landing/FeatureVisuals';
import { HowItWorksPreview } from '@/components/landing/HowItWorksPreview';
import { PullQuote } from '@/components/landing/PullQuote';
import { Stats } from '@/components/landing/Stats';
import { CTA } from '@/components/landing/CTA';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Marquee />

      <FeatureBlock
        number="01"
        label="TRANSFER"
        headline="Lightning-fast peer-to-peer."
        description="Your files travel directly from device to device with zero intermediaries. No cloud storage, no server bottlenecks — just pure P2P speed at your network's maximum capacity. WebRTC ensures the fastest possible connection while maintaining end-to-end encryption."
      >
        <TransferVisual />
      </FeatureBlock>

      <FeatureBlock
        number="02"
        label="SECURITY"
        headline="Future-proof encryption."
        description="Protected against both current and future threats with ML-KEM-768 post-quantum cryptography. Your files are encrypted with military-grade AES-256-GCM, ensuring security that will withstand even the quantum computers of tomorrow."
        reversed
      >
        <SecurityVisual />
      </FeatureBlock>

      <FeatureBlock
        number="03"
        label="PLATFORM"
        headline="Works everywhere."
        description="No apps to install, no accounts to create. Tallow runs in any modern browser — Chrome, Firefox, Safari, Edge. Desktop, mobile, tablet. One codebase, infinite compatibility."
      >
        <PlatformVisual />
      </FeatureBlock>

      <HowItWorksPreview />
      <PullQuote />
      <Stats />
      <CTA />
    </>
  );
}
