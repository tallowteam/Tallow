import { describe, expect, it } from 'vitest';
import {
  TABLE_VIRTUALIZATION_THRESHOLD,
  TRANSFER_HISTORY_OVERSCAN_ROWS,
  TRANSFER_HISTORY_ROW_HEIGHT_PX,
  TRANSFER_HISTORY_VIEWPORT_HEIGHT_PX,
  shouldVirtualizeTransferList,
} from '@/lib/ui/table-tactician';

describe('table tactician tokens', () => {
  it('defines the virtualization threshold at 100 items', () => {
    expect(TABLE_VIRTUALIZATION_THRESHOLD).toBe(100);
  });

  it('defines transfer history virtualization dimensions', () => {
    expect(TRANSFER_HISTORY_ROW_HEIGHT_PX).toBe(84);
    expect(TRANSFER_HISTORY_VIEWPORT_HEIGHT_PX).toBe(504);
    expect(TRANSFER_HISTORY_OVERSCAN_ROWS).toBe(6);
  });

  it('enables virtualization only when the list exceeds 100 items', () => {
    expect(shouldVirtualizeTransferList(100)).toBe(false);
    expect(shouldVirtualizeTransferList(101)).toBe(true);
  });
});
