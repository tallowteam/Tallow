'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Beaker,
  Monitor,
  FileText,
  Palette,
  Layout,
  Home,
  HelpCircle,
  Zap,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Demo Layout
 *
 * Provides a visually distinct wrapper for all demo pages featuring:
 * - Purple/violet gradient demo mode banner (different from main app)
 * - Clear "DEMO MODE" indicator badge
 * - Demo-specific navigation
 * - Quick access to other demos
 * - Back to main app navigation
 * - Helpful tooltips throughout
 * - Fully mobile responsive
 */

const demoLinks = [
  {
    href: '/transfer-demo',
    label: 'Transfer',
    icon: Zap,
    description: 'File transfer simulation',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    href: '/metadata-demo',
    label: 'Metadata',
    icon: FileText,
    description: 'Privacy metadata stripping',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    href: '/screen-share-demo',
    label: 'Screen Share',
    icon: Monitor,
    description: 'Secure screen sharing',
    color: 'text-white',
    bgColor: 'bg-white/20/10',
    borderColor: 'border-white/20',
  },
  {
    href: '/ui-demo',
    label: 'UI Components',
    icon: Palette,
    description: 'Toast & drag-drop',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    href: '/advanced',
    label: 'Architecture',
    icon: Layout,
    description: 'System diagrams',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
];

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentDemo = demoLinks.find((link) => pathname === link.href);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Demo Mode Banner - Visually distinct with purple gradient */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-violet-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12 md:h-14">
            {/* Left: Demo indicator and back button */}
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
                  className="bg-white/20 text-white border-white/30 font-bold text-xs tracking-wide"
                >
                  DEMO MODE
                </Badge>
              </div>
            </div>

            {/* Center: Current demo name - Hidden on mobile */}
            <div className="hidden md:flex items-center">
              {currentDemo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        'border-white/40 text-white gap-1.5 bg-white/10 cursor-help'
                      )}
                    >
                      <currentDemo.icon className="h-3.5 w-3.5" />
                      {currentDemo.label} Demo
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {currentDemo.description}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Right: Navigation icons */}
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
                <TooltipContent side="bottom">Go to Tallow homepage</TooltipContent>
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
                <TooltipContent side="bottom">Help and documentation</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Mode Info Banner - Collapsible context */}
      <div className="bg-violet-500/5 border-b border-violet-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-2.5 text-sm">
            <Info className="h-4 w-4 text-violet-500 shrink-0" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Demo Mode:</span>{' '}
              <span className="hidden sm:inline">
                These are interactive demonstrations of Tallow features. No actual data is transferred or stored.
              </span>
              <span className="sm:hidden">
                Interactive feature demonstrations
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Demo Navigation - Horizontal scrollable */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-12 md:top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-xs text-muted-foreground mr-2 shrink-0 hidden sm:inline">
              Demos:
            </span>
            {demoLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0',
                        isActive
                          ? cn(link.bgColor, link.color, 'border', link.borderColor)
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', isActive && link.color)} />
                      <span>{link.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{link.description}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Demo Content - With subtle background gradient based on demo type */}
      <main
        id="main-content"
        className={cn(
          'flex-1',
          currentDemo && `bg-gradient-to-b ${currentDemo.bgColor.replace('bg-', 'from-').replace('/10', '/5')} via-transparent to-transparent`
        )}
      >
        {children}
      </main>

      {/* Demo Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Demo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {demoLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group p-4 rounded-xl border transition-all',
                    isActive
                      ? cn('border-2', link.borderColor, link.bgColor)
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                        isActive ? link.bgColor : 'bg-muted group-hover:bg-primary/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? link.color : 'text-muted-foreground group-hover:text-primary'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'font-medium transition-colors',
                        isActive ? link.color : 'text-foreground'
                      )}
                    >
                      {link.label}
                    </span>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </Link>
              );
            })}
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Beaker className="h-4 w-4 text-violet-500" />
              <span>Explore Tallow's features through interactive demonstrations</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                href="/app"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Open App
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Docs
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
