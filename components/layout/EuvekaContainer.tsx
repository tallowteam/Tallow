import React, { type HTMLAttributes } from 'react';
import styles from './EuvekaContainer.module.css';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface EuvekaContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: ContainerSize;
  className?: string;
}

/**
 * EuvekaContainer - Max-width container with responsive padding
 *
 * @param size - Container max-width (sm: 800px, md: 1000px, lg: 1200px, xl: 1400px)
 * @param className - Additional CSS classes
 *
 * @example
 * <EuvekaContainer size="lg">
 *   <h1>Centered Content</h1>
 * </EuvekaContainer>
 */
export function EuvekaContainer({
  children,
  size = 'lg',
  className = '',
  ...props
}: EuvekaContainerProps) {
  const containerClasses = [
    styles.container,
    styles[`size-${size}`],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
}
