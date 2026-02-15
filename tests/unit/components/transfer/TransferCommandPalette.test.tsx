import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import {
  TransferCommandPalette,
  type TransferCommandAction,
} from '@/components/transfer/TransferCommandPalette';

describe('TransferCommandPalette', () => {
  const openSettings = vi.fn();
  const openHistory = vi.fn();

  const actions: TransferCommandAction[] = [
    {
      id: 'settings',
      label: 'Open settings',
      description: 'Adjust transfer preferences.',
      keywords: ['preferences', 'configuration'],
      onSelect: openSettings,
    },
    {
      id: 'history',
      label: 'Open history',
      description: 'Review past transfers.',
      keywords: ['past', 'transfers'],
      onSelect: openHistory,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens via Ctrl+K keyboard shortcut', () => {
    const onOpenChange = vi.fn();

    render(
      <TransferCommandPalette
        open={false}
        onOpenChange={onOpenChange}
        actions={actions}
      />
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('opens via Cmd+K keyboard shortcut', () => {
    const onOpenChange = vi.fn();

    render(
      <TransferCommandPalette
        open={false}
        onOpenChange={onOpenChange}
        actions={actions}
      />
    );

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('filters commands by search query', async () => {
    render(
      <TransferCommandPalette
        open
        onOpenChange={vi.fn()}
        actions={actions}
      />
    );

    const input = screen.getByLabelText('Search commands');
    await userEvent.type(input, 'settings');

    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open history/i })).not.toBeInTheDocument();
  });

  it('runs selected command and closes palette', async () => {
    const onOpenChange = vi.fn();

    render(
      <TransferCommandPalette
        open
        onOpenChange={onOpenChange}
        actions={actions}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /open settings/i }));

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when Escape is pressed', () => {
    const onOpenChange = vi.fn();

    render(
      <TransferCommandPalette
        open
        onOpenChange={onOpenChange}
        actions={actions}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
