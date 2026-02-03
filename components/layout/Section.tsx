import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SectionVariant = 'default' | 'accent' | 'muted' | 'gradient';

interface SectionProps {
  children: ReactNode;
  variant?: SectionVariant;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}

const variantClasses: Record<SectionVariant, string> = {
  default: 'bg-transparent',
  accent: 'bg-zinc-900/50',
  muted: 'bg-zinc-950/30',
  gradient:
    'bg-gradient-to-b from-zinc-950/0 via-zinc-900/30 to-zinc-950/0',
};

/**
 * Section component for consistent vertical spacing and optional backgrounds
 *
 * @example
 * ```tsx
 * <Section variant="gradient" id="features">
 *   <Container>
 *     <h2>Features</h2>
 *   </Container>
 * </Section>
 * ```
 */
export function Section({
  children,
  variant = 'default',
  className,
  id,
  as: Component = 'section',
}: SectionProps) {
  return (
    <Component
      id={id}
      className={cn(
        'relative py-12 sm:py-16 lg:py-24',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}
