import { describe, expect, it } from 'vitest';
import {
  RADIX_SURGEON_BEHAVIOR_PRIMITIVES,
  RADIX_SURGEON_COMPOSITION_SURFACES,
  isRadixSurgeonBehaviorPrimitive,
} from '@/lib/ui/radix-surgeon';

describe('radix surgeon tokens', () => {
  it('defines governed behavior primitives for overlay accessibility', () => {
    expect(RADIX_SURGEON_BEHAVIOR_PRIMITIVES).toEqual([
      'dialog',
      'focus-trap',
      'escape-dismiss',
      'backdrop-dismiss',
    ]);
  });

  it('defines composition surfaces that consume shared overlay behavior', () => {
    expect(RADIX_SURGEON_COMPOSITION_SURFACES).toEqual([
      'components/ui/Modal.tsx',
      'components/ui/ConfirmDialog.tsx',
      'components/transfer/TransferCommandPalette.tsx',
    ]);
  });

  it('detects governed behavior primitive identifiers', () => {
    expect(isRadixSurgeonBehaviorPrimitive('dialog')).toBe(true);
    expect(isRadixSurgeonBehaviorPrimitive('escape-dismiss')).toBe(true);
    expect(isRadixSurgeonBehaviorPrimitive('menu')).toBe(false);
  });
});
