import { describe, expect, it } from 'vitest';
import {
  COMPOSITOR_SAFE_MOTION_PROPERTIES,
  MOTION_CARD_HOVER_Y_PX,
  MOTION_DURATION_MS,
  MOTION_TAP_SCALE,
  isCompositorSafeMotionProperty,
} from '@/lib/ui/motion-choreographer';

describe('motion choreographer tokens', () => {
  it('exposes 300ms as the default motion duration', () => {
    expect(MOTION_DURATION_MS).toBe(300);
  });

  it('locks card hover and tap motion values', () => {
    expect(MOTION_CARD_HOVER_Y_PX).toBe(-2);
    expect(MOTION_TAP_SCALE).toBe(0.98);
  });

  it('only allows compositor-safe motion properties', () => {
    expect(COMPOSITOR_SAFE_MOTION_PROPERTIES).toEqual(['transform', 'opacity']);
    expect(isCompositorSafeMotionProperty('transform')).toBe(true);
    expect(isCompositorSafeMotionProperty('opacity')).toBe(true);
    expect(isCompositorSafeMotionProperty('background-color')).toBe(false);
  });
});
