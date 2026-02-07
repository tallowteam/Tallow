'use client';

import React, { type HTMLAttributes } from 'react';
import { Shield, Lock, Zap, Users, EyeOff, RefreshCw } from '@/components/icons';
import { useStaggeredIntersectionObserver, useReducedMotion } from '@/lib/hooks/use-intersection-observer';
import styles from './features.module.css';

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
}

export interface FeaturesProps extends HTMLAttributes<HTMLElement> {
  variant?: 'cards' | 'list' | 'minimal';
  title?: string;
  description?: string;
  features?: Feature[];
  animated?: boolean;
}

const defaultFeatures: Feature[] = [
  {
    icon: Shield,
    title: 'End-to-End Encryption',
    description: 'Your files are encrypted on your device before transfer. No servers ever see your data in plain text.',
    badge: 'Zero-Knowledge',
  },
  {
    icon: Lock,
    title: 'Post-Quantum Cryptography',
    description: 'Protected against future quantum computers with ML-KEM-768 Kyber encryption, ensuring long-term security.',
    badge: 'ML-KEM-768',
  },
  {
    icon: Zap,
    title: 'Direct P2P Transfers',
    description: 'Files transfer directly between devices with no intermediary servers, maximizing speed and privacy.',
  },
  {
    icon: Users,
    title: 'Group Transfers',
    description: 'Send files to up to 10 recipients simultaneously with the same security guarantees.',
    badge: 'Up to 10',
  },
  {
    icon: EyeOff,
    title: 'Metadata Stripping',
    description: 'Automatically removes sensitive metadata from images, videos, and documents before transfer.',
  },
  {
    icon: RefreshCw,
    title: 'Resumable Transfers',
    description: 'Network interruption? Resume exactly where you left off without starting over.',
  },
];

export function Features({
  variant = 'cards',
  title = 'Privacy-First File Sharing',
  description = 'Built from the ground up with security and privacy as core principles, not afterthoughts.',
  features = defaultFeatures,
  animated = true,
  className = '',
  ...props
}: FeaturesProps) {
  const { setRef, isVisible } = useStaggeredIntersectionObserver(features.length, {
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '-50px',
  });

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <section className={`${styles.features} ${className}`} {...props}>
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.header}>
          {title && (
            <h2 className={styles.title}>
              {title}
            </h2>
          )}
          {description && (
            <p className={styles.description}>
              {description}
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div
          className={`${styles.grid} ${styles[variant]}`}
          data-variant={variant}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              ref={setRef(index)}
              feature={feature}
              variant={variant}
              animated={shouldAnimate}
              isVisible={isVisible(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
  variant: 'cards' | 'list' | 'minimal';
  animated: boolean;
  isVisible: boolean;
  index: number;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ feature, animated, isVisible, index }, ref) => {
    const Icon = feature.icon;
    const animationDelay = animated ? `${index * 75}ms` : '0ms';

    const animationClass = animated
      ? isVisible
        ? styles.fadeUpVisible
        : styles.fadeUpHidden
      : '';

    return (
      <div
        ref={ref}
        className={`${styles.feature} ${animationClass}`}
        style={{ animationDelay }}
      >
        {/* Icon Container */}
        <div className={styles.iconContainer}>
          <div className={styles.iconWrapper}>
            <Icon className={`${styles.icon ?? ''}`} aria-hidden="true" />
          </div>
          {feature.badge && (
            <span className={styles.badge}>{feature.badge}</span>
          )}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureDescription}>{feature.description}</p>
        </div>
      </div>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

// Export individual feature component for custom layouts
export function FeatureItem({
  icon: Icon,
  title,
  description,
  badge,
  className = '',
}: Feature & { className?: string }) {
  return (
    <div className={`${styles.feature} ${className}`}>
      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          <Icon className={`${styles.icon ?? ''}`} aria-hidden="true" />
        </div>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      <div className={styles.content}>
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}
