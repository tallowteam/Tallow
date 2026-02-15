export const RADIX_SURGEON_BEHAVIOR_PRIMITIVES = [
  'dialog',
  'focus-trap',
  'escape-dismiss',
  'backdrop-dismiss',
] as const;

export const RADIX_SURGEON_COMPOSITION_SURFACES = [
  'components/ui/Modal.tsx',
  'components/ui/ConfirmDialog.tsx',
  'components/transfer/TransferCommandPalette.tsx',
] as const;

export type RadixSurgeonBehaviorPrimitive =
  (typeof RADIX_SURGEON_BEHAVIOR_PRIMITIVES)[number];

export function isRadixSurgeonBehaviorPrimitive(
  primitive: string
): primitive is RadixSurgeonBehaviorPrimitive {
  return (RADIX_SURGEON_BEHAVIOR_PRIMITIVES as readonly string[]).includes(primitive);
}
