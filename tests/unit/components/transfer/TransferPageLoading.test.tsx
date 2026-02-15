import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import TransferLoading from '@/app/transfer/loading';

describe('Transfer loading skeleton', () => {
  it('renders an immediate non-blank loading status surface', () => {
    render(<TransferLoading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('data-transfer-loading');
    expect(screen.getByText('Loading transfer workspace...')).toBeInTheDocument();
  });

  it('streams loading sections in progressive stages', () => {
    const { container } = render(<TransferLoading />);

    const stages = Array.from(container.querySelectorAll('[data-stream-stage]')).map((node) =>
      node.getAttribute('data-stream-stage')
    );

    expect(stages).toEqual(['1', '2', '3']);
  });

  it('matches transfer dashboard panel skeleton structure', () => {
    const { container } = render(<TransferLoading />);

    expect(container.querySelector('[data-skeleton="trust-strip"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="mode-selector"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="power-actions"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="connection-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="top-row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="bottom-row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="drop-zone"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="device-list"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="transfer-progress"]')).toBeInTheDocument();
    expect(container.querySelector('[data-skeleton="transfer-history"]')).toBeInTheDocument();
  });
});
