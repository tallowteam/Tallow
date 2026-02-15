import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';
import { cva } from '@/lib/ui/cva';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
  interactive?: boolean;
}

const cardVariants = cva(styles.card, {
  variants: {
    variant: {
      default: styles.default,
      bordered: styles.bordered,
      elevated: styles.elevated,
      ghost: styles.ghost,
      gradient: styles.gradient,
    },
    padding: {
      none: styles['padding-none'],
      sm: styles['padding-sm'],
      md: styles['padding-md'],
      lg: styles['padding-lg'],
    },
    hover: {
      true: styles.hover,
      false: '',
    },
    glow: {
      true: styles.glow,
      false: '',
    },
    interactive: {
      true: styles.interactive,
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    hover: 'false',
    glow: 'false',
    interactive: 'false',
  },
});

const cardHeaderVariants = cva(styles.header);
const cardContentVariants = cva(styles.content, {
  variants: {
    noPadding: {
      true: styles.noPadding,
      false: '',
    },
  },
  defaultVariants: {
    noPadding: 'false',
  },
});
const cardFooterVariants = cva(styles.footer);

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      glow = false,
      interactive = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = cardVariants({
      variant,
      padding,
      hover: hover ? 'true' : 'false',
      glow: glow ? 'true' : 'false',
      interactive: interactive ? 'true' : 'false',
      className,
    });

    // Add tabIndex for interactive cards if not already present.
    const tabIndex = interactive && props.tabIndex === undefined ? 0 : props.tabIndex;

    return (
      <div ref={ref} className={classes} tabIndex={tabIndex} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  (
    {
      title,
      description,
      action,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cardHeaderVariants({ className })} {...props}>
        <div className={styles.headerContent}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {description && <p className={styles.description}>{description}</p>}
          {children}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ noPadding = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cardContentVariants({
          noPadding: noPadding ? 'true' : 'false',
          className,
        })}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={cardFooterVariants({ className })} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
