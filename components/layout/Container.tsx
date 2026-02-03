import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main' | 'aside';
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
};

/**
 * Container component for consistent content width and centering
 *
 * @example
 * ```tsx
 * <Container size="lg">
 *   <h1>Page content</h1>
 * </Container>
 * ```
 */
export function Container({
  children,
  size = 'lg',
  className,
  as: Component = 'div',
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  );
}
