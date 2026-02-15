import { describe, expect, it } from 'vitest';
import { cva } from '@/lib/ui/cva';

describe('component forger cva utility', () => {
  it('applies default variants when no overrides are provided', () => {
    const buttonClass = cva('base', {
      variants: {
        tone: {
          primary: 'tone-primary',
          ghost: 'tone-ghost',
        },
      },
      defaultVariants: {
        tone: 'primary',
      },
    });

    expect(buttonClass()).toBe('base tone-primary');
  });

  it('applies explicit variant overrides and custom className', () => {
    const buttonClass = cva('base', {
      variants: {
        tone: {
          primary: 'tone-primary',
          ghost: 'tone-ghost',
        },
        size: {
          md: 'size-md',
          lg: 'size-lg',
        },
      },
      defaultVariants: {
        tone: 'primary',
        size: 'md',
      },
    });

    expect(
      buttonClass({
        tone: 'ghost',
        size: 'lg',
        className: 'external',
      })
    ).toBe('base tone-ghost size-lg external');
  });

  it('ignores unknown variant selections and keeps base classes', () => {
    const classBuilder = cva('base', {
      variants: {
        state: {
          active: 'is-active',
        },
      },
      defaultVariants: {
        state: 'active',
      },
    });

    expect(classBuilder({ state: 'inactive' })).toBe('base');
  });
});
