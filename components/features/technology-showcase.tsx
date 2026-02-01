"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Technology interface defining the structure of each technology
 */
export interface Technology {
  id: string;
  icon: string; // Lucide icon name
  name: string;
  description: string;
  why: string;
  link: string;
}

/**
 * TechnologyShowcaseProps interface
 */
export interface TechnologyShowcaseProps {
  technologies?: Technology[];
  className?: string;
}

/**
 * Default technologies showcasing cutting-edge tech used in Tallow
 */
const DEFAULT_TECHNOLOGIES: Technology[] = [
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
    id: "triple-ratchet",
    icon: "Repeat",
    name: "Triple Ratchet Protocol",
    description:
      "Combined classical and post-quantum key rotation with automatic rekeying every 5 minutes",
    why: "Past messages remain secure even if future keys are compromised",
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

/**
 * Get Lucide icon component by name
 */
const getIconComponent = (iconName: string): React.ComponentType<any> => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || LucideIcons.FileText;
};

/**
 * Technology Card Component
 */
const TechnologyCard = ({ technology }: { technology: Technology }) => {
  const Icon = getIconComponent(technology.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <div
        className={cn(
          "card-feature h-full flex flex-col",
          "rounded-xl p-8 lg:p-10 bg-card",
          "transition-all duration-300"
        )}
        role="article"
        aria-labelledby={`tech-${technology.id}-title`}
      >
        {/* Large Icon */}
        <div
          className="rounded-2xl bg-primary/10 p-6 w-fit mb-8"
          aria-hidden="true"
        >
          <Icon className="size-12 text-primary" />
        </div>

        {/* Tech Name */}
        <h3
          id={`tech-${technology.id}-title`}
          className="display-sm text-3xl font-light tracking-tight mb-4"
        >
          {technology.name}
        </h3>

        {/* Description */}
        <p className="body-lg text-base text-muted-foreground mb-6 leading-relaxed">
          {technology.description}
        </p>

        {/* Why This Matters Section */}
        <div className="mt-auto pt-6 border-t border-border">
          <h4 className="label text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Why This Matters
          </h4>
          <p className="text-sm text-foreground font-medium mb-6">
            {technology.why}
          </p>

          {/* Learn More Link */}
          <Link
            href={technology.link}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
            aria-label={`Learn more about ${technology.name}`}
          >
            Learn More
            <LucideIcons.ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * TechnologyShowcase Component
 *
 * Highlights cutting-edge technologies used in Tallow.
 * Displays 3 key technologies in large cards with descriptions and "Why This Matters" sections.
 * Grid: 3 columns on desktop, 1 column (stacked) on mobile.
 *
 * @example
 * ```tsx
 * // With default technologies
 * <TechnologyShowcase />
 *
 * // With custom technologies
 * <TechnologyShowcase technologies={customTechnologies} />
 * ```
 */
export function TechnologyShowcase({
  technologies = DEFAULT_TECHNOLOGIES,
  className,
}: TechnologyShowcaseProps) {
  return (
    <section
      className={cn("w-full", className)}
      aria-labelledby="technology-heading"
    >
      {/* Section Header */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          id="technology-heading"
          className="display-md text-4xl sm:text-5xl font-light tracking-tight mb-4"
        >
          Cutting-Edge Technology
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="body-lg text-lg text-muted-foreground max-w-3xl mx-auto"
        >
          Powered by the latest advancements in cryptography and peer-to-peer
          networking to ensure maximum security and performance
        </motion.p>
      </div>

      {/* Grid */}
      <div
        className={cn(
          "grid gap-6 lg:gap-8",
          "grid-cols-1", // Mobile: 1 column (stacked)
          "lg:grid-cols-3" // Desktop: 3 columns
        )}
        role="list"
        aria-label="Technology showcase"
      >
        {technologies.map((technology) => (
          <TechnologyCard key={technology.id} technology={technology} />
        ))}
      </div>

      {/* Optional CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center mt-16"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Want to dive deeper into our security architecture?
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="default" size="lg" asChild>
            <Link href="/security">
              <LucideIcons.Shield className="size-4" />
              Security Documentation
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/how-it-works">
              <LucideIcons.Book className="size-4" />
              How It Works
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

// Export for external use
export { DEFAULT_TECHNOLOGIES };
