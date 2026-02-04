/**
 * Tallow Design System - Component Examples
 *
 * This file demonstrates how to use the design system tokens and utility classes
 * to build consistent, production-ready UI components.
 *
 * Location: C:\Users\aamir\Documents\Apps\Tallow\DESIGN_SYSTEM_EXAMPLES.tsx
 */

import React from 'react';

/* ============================================================================
   EXAMPLE 1: HERO SECTION
   ============================================================================ */

export function HeroSection() {
  return (
    <section className="container flex flex-col items-center justify-center gap-8 py-24">
      {/* Main heading with gradient text */}
      <h1 className="h1 gradient-text text-center animate-fadeIn">
        Secure File Transfer
      </h1>

      {/* Lead paragraph */}
      <p className="lead text-center text-secondary animate-slideInUp" style={{ maxWidth: '48rem' }}>
        End-to-end encrypted file sharing with zero knowledge architecture.
        Your files, your privacy, completely secure.
      </p>

      {/* Call-to-action buttons */}
      <div className="flex gap-4 animate-scaleIn">
        <button className="bg-accent text-primary font-semibold rounded-lg px-8 py-4 shadow-lg glow">
          Get Started
        </button>
        <button className="bg-secondary text-primary font-medium rounded-lg px-8 py-4 shadow-md">
          Learn More
        </button>
      </div>
    </section>
  );
}

/* ============================================================================
   EXAMPLE 2: FEATURE CARD GRID
   ============================================================================ */

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="bg-secondary rounded-xl shadow-md p-6 flex flex-col gap-4 animate-slideInUp"
      style={{
        border: '1px solid var(--color-border-primary)',
        transition: 'var(--transition-base)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      {/* Icon container with glow */}
      <div
        className="flex items-center justify-center rounded-lg"
        style={{
          width: '3rem',
          height: '3rem',
          background: 'var(--gradient-accent)',
          boxShadow: 'var(--glow-sm)',
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="h4 text-primary">{title}</h3>

      {/* Description */}
      <p className="body text-secondary">{description}</p>
    </div>
  );
}

export function FeatureGrid() {
  const features = [
    {
      icon: <span className="text-primary">🔒</span>,
      title: 'End-to-End Encryption',
      description: 'Military-grade encryption ensures your files are secure from sender to receiver.',
    },
    {
      icon: <span className="text-primary">⚡</span>,
      title: 'Lightning Fast',
      description: 'Optimized peer-to-peer transfer with automatic resume capability.',
    },
    {
      icon: <span className="text-primary">🌐</span>,
      title: 'Zero Knowledge',
      description: 'We never see your data. Everything is encrypted on your device.',
    },
  ];

  return (
    <section className="container py-16">
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================================
   EXAMPLE 3: BUTTON COMPONENT VARIANTS
   ============================================================================ */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-lg flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-accent text-primary shadow-lg glow',
    secondary: 'bg-secondary text-primary shadow-md',
    outline: 'bg-transparent text-accent border border-accent',
    ghost: 'bg-transparent text-secondary',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={{
        transition: 'var(--transition-base)',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/* ============================================================================
   EXAMPLE 4: INPUT COMPONENT
   ============================================================================ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      {label && (
        <label className="small font-medium text-primary">
          {label}
        </label>
      )}

      {/* Input field */}
      <input
        className={`px-4 py-3 rounded-md bg-secondary text-primary border ${
          error ? 'border-error' : 'border-primary'
        } ${className}`}
        style={{
          outline: 'none',
          transition: 'var(--transition-fast)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--color-error)'
            : 'var(--color-accent-primary)';
          e.currentTarget.style.boxShadow = error
            ? '0 0 0 3px var(--color-error-bg)'
            : '0 0 0 3px rgba(124, 58, 237, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'var(--color-error)'
            : 'var(--color-border-primary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />

      {/* Helper text or error message */}
      {(helperText || error) && (
        <span className={`caption ${error ? 'text-error' : 'text-tertiary'}`}>
          {error || helperText}
        </span>
      )}
    </div>
  );
}

/* ============================================================================
   EXAMPLE 5: CARD COMPONENT
   ============================================================================ */

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  const variantStyles = {
    default: {
      backgroundColor: 'var(--color-background-secondary)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-border-primary)',
    },
    elevated: {
      backgroundColor: 'var(--color-background-elevated)',
      boxShadow: 'var(--shadow-lg)',
      border: 'none',
    },
    outlined: {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      border: '2px solid var(--color-border-secondary)',
    },
  };

  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </div>
  );
}

/* ============================================================================
   EXAMPLE 6: STATUS BADGE
   ============================================================================ */

interface BadgeProps {
  children: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, status = 'info' }: BadgeProps) {
  const statusStyles = {
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success)',
      borderColor: 'var(--color-success-border)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning)',
      borderColor: 'var(--color-warning-border)',
    },
    error: {
      backgroundColor: 'var(--color-error-bg)',
      color: 'var(--color-error)',
      borderColor: 'var(--color-error-border)',
    },
    info: {
      backgroundColor: 'var(--color-info-bg)',
      color: 'var(--color-info)',
      borderColor: 'var(--color-info-border)',
    },
  };

  return (
    <span
      className="small font-medium rounded-full px-3 py-1 inline-flex items-center gap-1"
      style={{
        ...statusStyles[status],
        border: `1px solid ${statusStyles[status].borderColor}`,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================================
   EXAMPLE 7: LOADING SPINNER
   ============================================================================ */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  const sizes = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem',
  };

  return (
    <div
      className="animate-spin rounded-full"
      style={{
        width: sizes[size],
        height: sizes[size],
        border: '3px solid var(--color-background-secondary)',
        borderTopColor: 'var(--color-accent-primary)',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/* ============================================================================
   EXAMPLE 8: MODAL/DIALOG
   ============================================================================ */

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed backdrop-blur-sm animate-fadeIn"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'var(--color-background-overlay)',
          zIndex: 'var(--z-modal-backdrop)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed flex items-center justify-center"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 'var(--z-modal)',
          pointerEvents: 'none',
        }}
      >
        <div
          className="bg-elevated rounded-2xl shadow-2xl animate-scaleIn"
          style={{
            maxWidth: '32rem',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            pointerEvents: 'all',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6"
            style={{ borderBottom: '1px solid var(--color-border-primary)' }}
          >
            <h2 className="h3 text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================================
   EXAMPLE 9: ALERT/NOTIFICATION
   ============================================================================ */

interface AlertProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ variant, title, children, onClose }: AlertProps) {
  const variantConfig = {
    success: {
      bg: 'var(--color-success-bg)',
      border: 'var(--color-success-border)',
      color: 'var(--color-success)',
      icon: '✓',
    },
    warning: {
      bg: 'var(--color-warning-bg)',
      border: 'var(--color-warning-border)',
      color: 'var(--color-warning)',
      icon: '⚠',
    },
    error: {
      bg: 'var(--color-error-bg)',
      border: 'var(--color-error-border)',
      color: 'var(--color-error)',
      icon: '✕',
    },
    info: {
      bg: 'var(--color-info-bg)',
      border: 'var(--color-info-border)',
      color: 'var(--color-info)',
      icon: 'ℹ',
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className="rounded-lg p-4 flex gap-3 animate-slideInDown"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
      role="alert"
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 font-bold rounded-full flex items-center justify-center"
        style={{
          width: '1.5rem',
          height: '1.5rem',
          color: config.color,
        }}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        {title && (
          <div className="font-semibold text-primary mb-1">
            {title}
          </div>
        )}
        <div className="text-secondary small">
          {children}
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-secondary hover:text-primary"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ============================================================================
   EXAMPLE 10: PROGRESS BAR
   ============================================================================ */

interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, showLabel = false, size = 'md' }: ProgressBarProps) {
  const heights = {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="small text-secondary">Progress</span>
          <span className="small font-medium text-primary">{clampedValue}%</span>
        </div>
      )}

      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: heights[size],
          backgroundColor: 'var(--color-background-secondary)',
        }}
      >
        <div
          className="h-full rounded-full glow"
          style={{
            width: `${clampedValue}%`,
            background: 'var(--gradient-accent)',
            transition: 'width var(--transition-slow)',
          }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   USAGE EXAMPLE - COMPLETE PAGE
   ============================================================================ */

export function ExamplePage() {
  return (
    <div className="bg-primary min-h-screen">
      <HeroSection />
      <FeatureGrid />

      <section className="container py-16">
        <div className="flex flex-col gap-8 max-w-2xl mx-auto">
          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button variant="primary" size="lg">Primary Button</Button>
            <Button variant="secondary" size="md">Secondary</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          {/* Inputs */}
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            helperText="We'll never share your email"
          />

          {/* Alerts */}
          <Alert variant="success" title="Success!">
            Your file transfer completed successfully.
          </Alert>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge status="success">Active</Badge>
            <Badge status="warning">Pending</Badge>
            <Badge status="error">Failed</Badge>
            <Badge status="info">New</Badge>
          </div>

          {/* Progress */}
          <ProgressBar value={75} showLabel size="lg" />
        </div>
      </section>
    </div>
  );
}
