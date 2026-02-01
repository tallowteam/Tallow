'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check, Contrast, Sparkles, Trees, Waves } from 'lucide-react';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

/* =============================================================================
   TYPE DEFINITIONS
   ============================================================================= */

type Theme = 'light' | 'dark' | 'euveka' | 'euveka-light' | 'high-contrast' | 'forest' | 'ocean' | 'system';

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/* =============================================================================
   THEME OPTIONS CONFIGURATION
   ============================================================================= */

/**
 * Theme options with EUVEKA styling
 * All themes use EUVEKA grayscale base (#191610 dark, #fefefc light)
 * with different accent colors
 */
const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    icon: Sun,
    description: 'EUVEKA cream (#fefefc)',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: Moon,
    description: 'EUVEKA charcoal (#191610)',
  },
  {
    value: 'euveka',
    label: 'Euveka Dark',
    icon: Sparkles,
    description: 'Charcoal + electric blue',
  },
  {
    value: 'euveka-light',
    label: 'Euveka Light',
    icon: Sparkles,
    description: 'Cream + electric blue',
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    icon: Contrast,
    description: 'WCAG AAA accessible',
  },
  {
    value: 'forest',
    label: 'Forest',
    icon: Trees,
    description: 'EUVEKA + green accent',
  },
  {
    value: 'ocean',
    label: 'Ocean',
    icon: Waves,
    description: 'EUVEKA + cyan accent',
  },
  {
    value: 'system',
    label: 'System',
    icon: Monitor,
    description: 'Match device settings',
  },
];

/* =============================================================================
   ANIMATION VARIANTS - Spring Physics
   ============================================================================= */

// Spring transition configuration for organic feel
const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 0.8,
};

const softSpringTransition: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
};

// Icon rotation + scale animation variants
const iconVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
    opacity: 0,
  },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: springTransition,
  },
  exit: {
    scale: 0,
    rotate: 180,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  tap: {
    scale: 0.9,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
    },
  },
};

// Checkmark animation with bounce
const checkVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
    rotate: -45,
  },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
      delay: 0.1,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    rotate: 45,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
};

// Dropdown menu content animation
const menuContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: softSpringTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
};

// Menu item stagger animation
const menuItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -12,
  },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      delay: index * 0.05,
    },
  }),
  hover: {
    x: 4,
    backgroundColor: 'var(--accent-subtle)',
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// Icon container hover glow effect
const glowVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  hover: {
    opacity: 1,
    scale: 1.2,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

/* =============================================================================
   ANIMATED ICON COMPONENT
   ============================================================================= */

interface AnimatedIconProps {
  iconKey: 'sun' | 'moon' | 'contrast' | 'monitor' | 'trees' | 'waves';
  className?: string;
}

function AnimatedIcon({ iconKey, className }: AnimatedIconProps) {
  const iconMap = {
    sun: Sun,
    moon: Moon,
    contrast: Contrast,
    monitor: Monitor,
    trees: Trees,
    waves: Waves,
  };

  // EUVEKA-styled color map with accent blue (#fefefc)
  const colorMap = {
    sun: 'text-[#fefefc]', // EUVEKA electric blue
    moon: 'text-[#fefefc]', // EUVEKA electric blue
    contrast: 'text-yellow-400 dark:text-yellow-300',
    monitor: 'text-[var(--text-muted)]',
    trees: 'text-[#22c55e]', // Forest green accent
    waves: 'text-[#fefefc]', // Ocean white accent
  };

  const Icon = iconMap[iconKey];

  return (
    <motion.div
      key={iconKey}
      variants={iconVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center"
    >
      <Icon
        className={cn('w-5 h-5 transition-colors duration-200', colorMap[iconKey], className)}
        aria-hidden="true"
      />
    </motion.div>
  );
}

/* =============================================================================
   THEME TOGGLE - PRIMARY COMPONENT

   A modern theme toggle with dropdown menu featuring:
   - Three modes: Light, Dark, System
   - Animated icon transitions with spring physics
   - Glassmorphism dropdown styling
   - Electric Blue accent for selected state
   - Smooth checkmark indicators
   ============================================================================= */

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Get the current icon based on resolved theme
  const getCurrentIcon = React.useCallback((): 'sun' | 'moon' | 'contrast' | 'monitor' | 'trees' | 'waves' => {
    if (!mounted) {return 'sun';}
    if (theme === 'high-contrast') {return 'contrast';}
    if (theme === 'forest') {return 'trees';}
    if (theme === 'ocean') {return 'waves';}
    if (theme === 'system') {return resolvedTheme === 'dark' ? 'moon' : 'sun';}
    return resolvedTheme === 'dark' ? 'moon' : 'sun';
  }, [mounted, theme, resolvedTheme]);

  // Get accessible label
  const getAriaLabel = React.useCallback(() => {
    if (!mounted) {return 'Toggle theme';}
    let currentLabel: string;
    if (theme === 'system') {
      currentLabel = `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
    } else if (theme === 'high-contrast') {
      currentLabel = 'High Contrast';
    } else if (theme === 'forest') {
      currentLabel = 'Forest';
    } else if (theme === 'ocean') {
      currentLabel = 'Ocean';
    } else if (theme === 'dark') {
      currentLabel = 'Dark';
    } else {
      currentLabel = 'Light';
    }
    return `Change theme. Current: ${currentLabel}`;
  }, [mounted, theme, resolvedTheme]);

  // SSR placeholder
  if (!mounted) {
    return (
      <div
        className={cn(
          'relative w-10 h-10 rounded-xl',
          'bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)]',
          'flex items-center justify-center'
        )}
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </div>
    );
  }

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        <motion.button
          className={cn(
            // Base styles
            'relative w-10 h-10 rounded-xl overflow-hidden',
            'flex items-center justify-center',
            // Background with subtle transparency
            'bg-[var(--bg-secondary)]/80 dark:bg-[var(--bg-tertiary)]/80',
            'backdrop-blur-sm',
            // Border
            'border border-[var(--border-light)] dark:border-[var(--border)]',
            // Hover state
            'hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-quaternary)]',
            'hover:border-[var(--border)] dark:hover:border-[var(--border-light)]',
            // Focus state
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
            // Transition
            'transition-colors duration-200',
            // Active state glow when open
            isOpen && 'ring-2 ring-[var(--accent)]/30 border-[var(--accent)]/50'
          )}
          whileHover="hover"
          whileTap="tap"
          aria-label={getAriaLabel()}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {/* Glow effect background */}
          <motion.div
            className={cn(
              'absolute inset-0 rounded-xl opacity-0',
              'bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5'
            )}
            variants={glowVariants}
            initial="initial"
            animate={isOpen ? 'hover' : 'initial'}
          />

          {/* Icon container */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <AnimatedIcon key={getCurrentIcon()} iconKey={getCurrentIcon()} />
            </AnimatePresence>
          </div>

          <span className="sr-only">Toggle theme</span>
        </motion.button>
      </DropdownMenuPrimitive.Trigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content
              align="end"
              sideOffset={8}
              asChild
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                variants={menuContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  // Glassmorphism effect
                  'min-w-[200px] p-2',
                  'bg-[var(--glass-bg-strong)] dark:bg-[var(--glass-bg-strong)]',
                  'backdrop-blur-xl',
                  // Border and shadow
                  'border border-[var(--glass-border)]',
                  'shadow-xl shadow-black/5 dark:shadow-black/20',
                  // Rounded corners
                  'rounded-2xl',
                  // Z-index
                  'z-50'
                )}
              >
                {/* Menu header */}
                <div className="px-3 py-2 mb-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    Appearance
                  </p>
                </div>

                {/* Theme options */}
                {themeOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;

                  return (
                    <DropdownMenuPrimitive.Item
                      key={option.value}
                      onSelect={() => setTheme(option.value)}
                      asChild
                    >
                      <motion.div
                        custom={index}
                        variants={menuItemVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        className={cn(
                          // Base styles
                          'flex items-center gap-3 w-full',
                          'px-3 py-2.5 rounded-xl',
                          'cursor-pointer select-none outline-none',
                          // Hover and focus states
                          'hover:bg-[var(--accent-subtle)] dark:hover:bg-[var(--accent-subtle)]',
                          'focus:bg-[var(--accent-subtle)] dark:focus:bg-[var(--accent-subtle)]',
                          // Selected state background
                          isSelected && 'bg-[var(--accent-subtle)]',
                          // Transition
                          'transition-colors duration-150'
                        )}
                      >
                        {/* Icon container */}
                        <motion.div
                          className={cn(
                            'flex items-center justify-center w-9 h-9 rounded-xl',
                            'transition-all duration-200',
                            isSelected
                              ? 'bg-[var(--accent)]/15 dark:bg-[var(--accent)]/25'
                              : 'bg-[var(--bg-tertiary)] dark:bg-[var(--bg-quaternary)]'
                          )}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon
                            className={cn(
                              'w-4 h-4 transition-colors duration-200',
                              isSelected
                                ? 'text-[var(--accent)]'
                                : 'text-[var(--text-muted)]'
                            )}
                            aria-hidden="true"
                          />
                        </motion.div>

                        {/* Label and description */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium transition-colors duration-200',
                              isSelected
                                ? 'text-[var(--text-primary)]'
                                : 'text-[var(--text-secondary)]'
                            )}
                          >
                            {option.label}
                          </p>
                          <p
                            className={cn(
                              'text-xs transition-colors duration-200',
                              isSelected
                                ? 'text-[var(--text-muted)]'
                                : 'text-[var(--text-disabled)]'
                            )}
                          >
                            {option.description}
                          </p>
                        </div>

                        {/* Animated checkmark */}
                        <div className="w-5 h-5 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {isSelected && (
                              <motion.div
                                variants={checkVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                              >
                                <Check
                                  className="w-4 h-4 text-[var(--accent)]"
                                  aria-hidden="true"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </DropdownMenuPrimitive.Item>
                  );
                })}

                {/* Visual indicator dots */}
                <motion.div
                  className="mt-2 pt-2 border-t border-[var(--border-light)] dark:border-[var(--border)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 py-1.5">
                    {themeOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all duration-200',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
                          theme === option.value
                            ? 'bg-[var(--accent)] scale-125'
                            : 'bg-[var(--border)] dark:bg-[var(--border-light)] hover:bg-[var(--text-muted)]'
                        )}
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                        animate={
                          theme === option.value
                            ? { scale: [1.25, 1.4, 1.25] }
                            : {}
                        }
                        transition={{
                          repeat: theme === option.value ? Infinity : 0,
                          repeatType: 'reverse',
                          duration: 1.5,
                          ease: 'easeInOut',
                        }}
                        aria-label={`Select ${option.label} theme`}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  );
}

/* =============================================================================
   THEME TOGGLE SIMPLE - Cycle Toggle Version

   A compact toggle that cycles through themes on click:
   Light -> Dark -> System -> Light...
   ============================================================================= */

export function ThemeToggleSimple() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = React.useCallback(() => {
    const themeOrder: Theme[] = ['light', 'dark', 'high-contrast', 'forest', 'ocean', 'system'];
    const currentTheme = (theme as Theme) ?? 'system';
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    if (nextTheme) {
      setTheme(nextTheme);
    }
  }, [theme, setTheme]);

  const getIconKey = React.useCallback((): 'sun' | 'moon' | 'contrast' | 'monitor' | 'trees' | 'waves' => {
    if (!mounted) {
      return 'sun';
    }
    if (theme === 'system') {
      return 'monitor';
    }
    if (theme === 'high-contrast') {
      return 'contrast';
    }
    if (theme === 'forest') {
      return 'trees';
    }
    if (theme === 'ocean') {
      return 'waves';
    }
    return resolvedTheme === 'dark' ? 'moon' : 'sun';
  }, [mounted, theme, resolvedTheme]);

  const getAriaLabel = React.useCallback(() => {
    if (!mounted) {
      return 'Toggle theme';
    }
    let currentLabel: string;
    if (theme === 'system') {
      currentLabel = `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`;
    } else if (theme === 'high-contrast') {
      currentLabel = 'High Contrast';
    } else if (theme === 'forest') {
      currentLabel = 'Forest';
    } else if (theme === 'ocean') {
      currentLabel = 'Ocean';
    } else if (theme === 'dark') {
      currentLabel = 'Dark';
    } else {
      currentLabel = 'Light';
    }
    return `Change theme. Current: ${currentLabel}. Click to cycle.`;
  }, [mounted, theme, resolvedTheme]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'relative w-10 h-10 rounded-xl',
          'bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)]',
          'flex items-center justify-center'
        )}
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </div>
    );
  }

  const iconKey = getIconKey();

  return (
    <motion.button
      onClick={cycleTheme}
      className={cn(
        'relative w-10 h-10 rounded-xl overflow-hidden',
        'flex items-center justify-center',
        'bg-[var(--bg-secondary)]/80 dark:bg-[var(--bg-tertiary)]/80',
        'backdrop-blur-sm',
        'border border-[var(--border-light)] dark:border-[var(--border)]',
        'hover:bg-[var(--bg-tertiary)] dark:hover:bg-[var(--bg-quaternary)]',
        'hover:border-[var(--border)] dark:hover:border-[var(--border-light)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
        'transition-colors duration-200',
        'group'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      aria-label={getAriaLabel()}
    >
      {/* Glow effect on hover - EUVEKA accent colors */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0',
          'bg-gradient-to-br',
          iconKey === 'sun' && 'from-[#fefefc]/15 to-[#fefefc]/5', // EUVEKA blue
          iconKey === 'moon' && 'from-[#fefefc]/15 to-[#fefefc]/5', // EUVEKA blue
          iconKey === 'contrast' && 'from-yellow-400/20 to-yellow-500/10',
          iconKey === 'monitor' && 'from-[var(--accent)]/10 to-[var(--accent)]/5',
          iconKey === 'trees' && 'from-[#22c55e]/15 to-[#22c55e]/5', // Forest green
          iconKey === 'waves' && 'from-[#fefefc]/15 to-[#fefefc]/5' // Ocean white
        )}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <div className="relative w-5 h-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <AnimatedIcon key={iconKey} iconKey={iconKey} />
        </AnimatePresence>
      </div>

      {/* Ring indicator - EUVEKA accent colors */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-xl border-2 opacity-0',
          iconKey === 'sun' && 'border-[#fefefc]/40', // EUVEKA blue
          iconKey === 'moon' && 'border-[#fefefc]/40', // EUVEKA blue
          iconKey === 'contrast' && 'border-yellow-400/50',
          iconKey === 'monitor' && 'border-[var(--accent)]/40',
          iconKey === 'trees' && 'border-[#22c55e]/40', // Forest green
          iconKey === 'waves' && 'border-[#fefefc]/40' // Ocean white
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />

      <span className="sr-only">Toggle theme</span>
    </motion.button>
  );
}

/* =============================================================================
   THEME TOGGLE PILL - Segmented Control Version

   A pill-shaped toggle showing all three options visible at once
   ============================================================================= */

export function ThemeTogglePill() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate the position of the sliding indicator
  const getIndicatorPosition = React.useCallback(() => {
    if (theme === 'light') {
      return 0;
    }
    if (theme === 'dark') {
      return 1;
    }
    if (theme === 'high-contrast') {
      return 2;
    }
    return 3;
  }, [theme]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-10 w-[172px] rounded-full',
          'bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)]'
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-1 p-1',
        'rounded-full',
        'bg-[var(--bg-secondary)]/80 dark:bg-[var(--bg-tertiary)]/80',
        'backdrop-blur-sm',
        'border border-[var(--border-light)] dark:border-[var(--border)]'
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {/* Animated sliding indicator */}
      <motion.div
        className={cn(
          'absolute h-8 w-10 rounded-full',
          'bg-[var(--card-bg)] dark:bg-[var(--card-bg)]',
          'shadow-sm shadow-black/5 dark:shadow-black/20',
          'border border-[var(--border-light)]/50'
        )}
        initial={false}
        animate={{
          x: getIndicatorPosition() * 40,
        }}
        transition={springTransition}
        style={{ left: 4 }}
      />

      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;

        return (
          <motion.button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'relative z-10 flex items-center justify-center',
              'w-10 h-8 rounded-full',
              'transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
              'focus-visible:ring-offset-1'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${option.label} theme`}
          >
            <Icon
              className={cn(
                'w-4 h-4 transition-colors duration-300',
                isSelected
                  ? option.value === 'light'
                    ? 'text-[#fefefc]' // EUVEKA blue
                    : option.value === 'dark'
                    ? 'text-[#fefefc]' // EUVEKA blue
                    : option.value === 'high-contrast'
                    ? 'text-yellow-400'
                    : option.value === 'forest'
                    ? 'text-[#22c55e]' // Forest green
                    : option.value === 'ocean'
                    ? 'text-[#fefefc]' // Ocean white
                    : 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)]'
              )}
              aria-hidden="true"
            />
          </motion.button>
        );
      })}
    </div>
  );
}

/* =============================================================================
   THEME TOGGLE MINIMAL - Icon Only with Tooltip

   A minimal icon-only toggle for tight spaces
   ============================================================================= */

export function ThemeToggleMinimal() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)]" />
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'relative w-8 h-8 rounded-lg overflow-hidden',
        'flex items-center justify-center',
        'bg-transparent',
        'hover:bg-[var(--bg-secondary)] dark:hover:bg-[var(--bg-tertiary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        'transition-colors duration-200'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {resolvedTheme === 'dark' ? (
            <motion.div
              key="moon"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon
                className="w-4 h-4 text-indigo-400"
                aria-hidden="true"
              />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun
                className="w-4 h-4 text-amber-500"
                aria-hidden="true"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
