import { describe, expect, it } from 'vitest';
import { ICON_SIZES, ICON_STROKES, isAllowedIconSize } from '@/lib/ui/icon-armor';

describe('icon armor tokens', () => {
  it('exposes the allowed icon size set', () => {
    expect(Object.values(ICON_SIZES)).toEqual([16, 20, 24, 32]);
  });

  it('exposes the allowed stroke widths', () => {
    expect(Object.values(ICON_STROKES)).toEqual([1.5, 2]);
  });

  it('validates icon size allowlist', () => {
    expect(isAllowedIconSize(16)).toBe(true);
    expect(isAllowedIconSize(24)).toBe(true);
    expect(isAllowedIconSize(18)).toBe(false);
  });
});
