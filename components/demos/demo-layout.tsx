'use client';

/**
 * Demo Layout Wrapper
 *
 * Provides a consistent visual experience for all demo pages that is
 * distinct from the main application. Features include:
 * - Demo mode indicator badge
 * - Different navigation/header
 * - Subtle different color scheme (purple tint for demos)
 * - Back to main app navigation
 * - Helpful tooltips and instructions
 * - Mobile responsive design
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Beaker,
  Home,
  HelpCircle,
  ExternalLink,
  MonitorPlay,
  Shield,
  Palette,
  Zap,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface DemoLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
  demoType: 'transfer' | 'metadata' | 'screen-share' | 'ui';
  features?: string[];
  instructions?: string[];
}

const demoConfig = {
  transfer: {
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    label: 'Transfer Demo',
    gradient: 'from-amber-500/5 via-transparent to-transparent',
  },
  metadata: {
    icon: Shield,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    label: 'Privacy Demo',
    gradient: 'from-emerald-500/5 via-transparent to-transparent',
  },
  'screen-share': {
    icon: MonitorPlay,
    color: 'text-white',
    bgColor: 'bg-white/20/10',
    borderColor: 'border-white/20',
    label: 'Screen Share Demo',
    gradient: 'from-white/20/5 via-transparent to-transparent',
  },
  ui: {
    icon: Palette,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    label: 'UI Demo',
    gradient: 'from-purple-500/5 via-transparent to-transparent',
  },
};

const demoPages = [
  { href: '/transfer-demo', label: 'File Transfer', type: 'transfer' as const },
  { href: '/metadata-demo', label: 'Metadata Stripping', type: 'metadata' as const },
  { href: '/screen-share-demo', label: 'Screen Sharing', type: 'screen-share' as const },
  { href: '/ui-demo', label: 'UI Components', type: 'ui' as const },
];

export function DemoLayout({
  children,
  title,
  description,
  demoType,
  features = [],
  instructions = [],
}: DemoLayoutProps) {
  const config = demoConfig[demoType];
  const DemoIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner - Fixed at top */}
      <div
        className={cn(
          'sticky top-0 z-50 border-b',
          'bg-gradient-to-r from-violet-600/90 via-purple-600/90 to-indigo-600/90',
          'backdrop-blur-md'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12 md:h-14">
            {/* Left: Back button and demo indicator */}
            <div className="flex items-center gap-2 md:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-white hover:bg-white/20 gap-1.5"
                  >
                    <Link href="/app">
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Back to App</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Return to the main Tallow application
                </TooltipContent>
              </Tooltip>

              <div className="h-6 w-px bg-white/20 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-white/90" />
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 font-semibold text-xs"
                >
                  DEMO MODE
                </Badge>
              </div>
            </div>

            {/* Center: Demo type badge - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'border-white/40 text-white gap-1.5',
                  'bg-white/10'
                )}
              >
                <DemoIcon className="h-3.5 w-3.5" />
                {config.label}
              </Badge>
            </div>

            {/* Right: Home and help */}
            <div className="flex items-center gap-1 md:gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-white hover:bg-white/20 h-8 w-8"
                  >
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">Go to homepage</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Go to Tallow homepage
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-white hover:bg-white/20 h-8 w-8"
                  >
                    <Link href="/help">
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Get help</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Help and documentation
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Navigation - Other demos */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-muted-foreground mr-2 shrink-0">
              Other demos:
            </span>
            {demoPages.map((demo) => {
              const isActive = demo.type === demoType;
              const demoConf = demoConfig[demo.type];
              const Icon = demoConf.icon;

              return (
                <Link
                  key={demo.href}
                  href={demo.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0',
                    isActive
                      ? cn(demoConf.bgColor, demoConf.color, 'border', demoConf.borderColor)
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {demo.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn('relative', `bg-gradient-to-b ${config.gradient}`)}>
        {/* Page Header */}
        <div className="container mx-auto px-4 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl',
                  config.bgColor,
                  'border',
                  config.borderColor
                )}
              >
                <DemoIcon className={cn('h-6 w-6', config.color)} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                  {title}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              {description}
            </p>
          </motion.div>
        </div>

        {/* Instructions Panel - Collapsible on mobile */}
        {(features.length > 0 || instructions.length > 0) && (
          <div className="container mx-auto px-4 pb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={cn(
                'p-4 rounded-xl border',
                config.bgColor,
                config.borderColor,
                'backdrop-blur-sm'
              )}
            >
              <div className="flex items-start gap-3">
                <Info className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-2">Quick Start Guide</h3>

                  {instructions.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {instructions.map((instruction, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className={cn(
                            'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium',
                            config.bgColor, config.color
                          )}>
                            {idx + 1}
                          </span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs font-normal"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Main Demo Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pb-12"
        >
          {children}
        </motion.div>

        {/* Footer Navigation */}
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/app" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Main App
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/docs" className="gap-2">
                    Documentation
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Try another demo:</span>
                {demoPages
                  .filter((d) => d.type !== demoType)
                  .slice(0, 2)
                  .map((demo) => (
                    <Link
                      key={demo.href}
                      href={demo.href}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {demo.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Demo Section Component
 * Use this to wrap individual sections within a demo page
 */
interface DemoSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function DemoSection({ children, title, description, className }: DemoSectionProps) {
  return (
    <div className={cn('container mx-auto px-4', className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold mb-1">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Demo Card Component
 * A styled card specifically for demo content
 */
interface DemoCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function DemoCard({ children, title, description, icon, className }: DemoCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/50 backdrop-blur-sm p-6',
        'shadow-soft transition-shadow hover:shadow-soft-lg',
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-start gap-3 mb-4">
          {icon && (
            <div className="p-2 rounded-lg bg-muted shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Demo Tooltip Component
 * Enhanced tooltip with demo styling
 */
interface DemoTooltipProps {
  children: ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function DemoTooltip({ children, content, side = 'top' }: DemoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
