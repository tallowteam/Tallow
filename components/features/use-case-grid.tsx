"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UseCase interface defining the structure of each use case
 */
export interface UseCase {
  id: string;
  icon: string; // Lucide icon name
  persona: string;
  scenario: string;
  features: string[];
}

/**
 * UseCaseGridProps interface
 */
export interface UseCaseGridProps {
  useCases?: UseCase[];
  className?: string;
}

/**
 * Default use cases showcasing different user personas
 */
const DEFAULT_USE_CASES: UseCase[] = [
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
    id: "enterprise-teams",
    icon: "Users",
    persona: "Enterprise Teams",
    scenario: "Marketing team sharing campaign assets with multiple stakeholders",
    features: [
      "Group transfer",
      "Transfer rooms",
      "Email fallback",
      "API access",
    ],
  },
  {
    id: "creative-professionals",
    icon: "Palette",
    persona: "Creative Professionals",
    scenario: "Photographer sending RAW files to client",
    features: [
      "Large file support",
      "Folder transfers",
      "Resumable transfers",
      "Fast P2P",
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
  {
    id: "developers",
    icon: "Code",
    persona: "Developers",
    scenario: "DevOps team sharing deployment artifacts",
    features: [
      "API access",
      "Self-hosting",
      "CLI tools",
      "Automation",
    ],
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
 * UseCase Card Component
 */
const UseCaseCard = ({ useCase }: { useCase: UseCase }) => {
  const Icon = getIconComponent(useCase.icon);

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
          "rounded-xl p-8 bg-card",
          "transition-all duration-300 cursor-pointer"
        )}
        role="article"
        aria-labelledby={`use-case-${useCase.id}-title`}
      >
        {/* Icon */}
        <div
          className="rounded-xl bg-primary/10 p-4 w-fit mb-6"
          aria-hidden="true"
        >
          <Icon className="size-8 text-primary" />
        </div>

        {/* Persona */}
        <h3
          id={`use-case-${useCase.id}-title`}
          className="heading-md text-2xl font-semibold mb-3"
        >
          {useCase.persona}
        </h3>

        {/* Scenario */}
        <p className="body-lg text-base text-muted-foreground mb-6 flex-1">
          {useCase.scenario}
        </p>

        {/* Features */}
        <div className="space-y-2">
          <h4 className="label-lg text-sm font-medium uppercase tracking-wider text-foreground">
            Key Features
          </h4>
          <ul
            className="space-y-2"
            aria-label={`Key features for ${useCase.persona}`}
          >
            {useCase.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <LucideIcons.Check
                  className="size-4 text-primary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * UseCaseGrid Component
 *
 * Showcases 6 real-world use case scenarios for different user personas.
 * Displays in a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile.
 * Features hover effects with lift animation and smooth transitions.
 *
 * @example
 * ```tsx
 * // With default use cases
 * <UseCaseGrid />
 *
 * // With custom use cases
 * <UseCaseGrid useCases={customUseCases} />
 * ```
 */
export function UseCaseGrid({
  useCases = DEFAULT_USE_CASES,
  className,
}: UseCaseGridProps) {
  return (
    <section
      className={cn("w-full", className)}
      aria-labelledby="use-cases-heading"
    >
      {/* Section Header */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          id="use-cases-heading"
          className="display-md text-4xl sm:text-5xl font-light tracking-tight mb-4"
        >
          Built for Everyone
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="body-lg text-lg text-muted-foreground max-w-2xl mx-auto"
        >
          See how Tallow empowers different professionals with secure,
          privacy-first file sharing
        </motion.p>
      </div>

      {/* Grid */}
      <div
        className={cn(
          "grid gap-6",
          "grid-cols-1", // Mobile: 1 column
          "md:grid-cols-2", // Tablet: 2 columns
          "lg:grid-cols-3" // Desktop: 3 columns
        )}
        role="list"
        aria-label="Use case scenarios"
      >
        {useCases.map((useCase) => (
          <UseCaseCard key={useCase.id} useCase={useCase} />
        ))}
      </div>
    </section>
  );
}

// Export for external use
export { DEFAULT_USE_CASES };
