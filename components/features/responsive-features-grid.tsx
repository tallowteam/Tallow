'use client';

import React from 'react';
import { SectionContainer } from '@/components/ui/responsive-container';
import { FeatureGrid } from '@/components/ui/responsive-grid';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface ResponsiveFeaturesGridProps {
  features: Feature[];
}

export function ResponsiveFeaturesGrid({ features }: ResponsiveFeaturesGridProps) {
  return (
    <SectionContainer spacing="default" className="border-t border-border">
      <FeatureGrid>
        {features.map((feature, i) => (
          <div
            key={i}
            className="rounded-xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8 transition-all duration-300 hover:border-border-hover hover:shadow-lg animate-fade-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-secondary mb-4 sm:mb-5 md:mb-6">
              <feature.icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-[1.375rem] font-light tracking-tight mb-2 sm:mb-3 leading-tight">
              {feature.title}
            </h3>
            <p className="text-sm sm:text-[0.9375rem] md:text-base text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </FeatureGrid>
    </SectionContainer>
  );
}

export function ResponsiveSection({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionContainer spacing="default" className={className}>
      {children}
    </SectionContainer>
  );
}
