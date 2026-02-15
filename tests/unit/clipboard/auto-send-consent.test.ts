import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupAutoSend } from '@/lib/clipboard/auto-send';
import type { ClipboardMonitor } from '@/lib/clipboard/clipboard-monitor';

function dispatchPasteEvent(options: { text?: string; files?: File[] }) {
  const event = new Event('paste') as ClipboardEvent;
  const clipboardData = {
    files: options.files ?? [],
    items: [],
    getData: (type: string) => (type === 'text/plain' ? options.text ?? '' : ''),
  };

  Object.defineProperty(event, 'clipboardData', {
    value: clipboardData,
    configurable: true,
  });

  document.dispatchEvent(event);
}

async function flushClipboardTasks() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('clipboard auto-send consent discipline', () => {
  let monitor: ClipboardMonitor | null = null;

  afterEach(() => {
    if (monitor) {
      monitor.destroy();
      monitor = null;
    }
    vi.restoreAllMocks();
  });

  it('does not send pasted text when user declines confirmation', async () => {
    const onSendText = vi.fn();
    const onConfirmationRequired = vi.fn().mockResolvedValue(false);

    monitor = setupAutoSend(
      {
        enabled: true,
        sendText: true,
      },
      {
        onSendText,
        onConfirmationRequired,
      }
    );

    dispatchPasteEvent({ text: 'secret payload' });
    await flushClipboardTasks();

    expect(onConfirmationRequired).toHaveBeenCalledTimes(1);
    expect(onSendText).not.toHaveBeenCalled();
  });

  it('sends pasted text only after explicit confirmation approval', async () => {
    const onSendText = vi.fn();
    const onConfirmationRequired = vi.fn().mockResolvedValue(true);

    monitor = setupAutoSend(
      {
        enabled: true,
        sendText: true,
      },
      {
        onSendText,
        onConfirmationRequired,
      }
    );

    dispatchPasteEvent({ text: 'clipboard hello' });
    await flushClipboardTasks();

    expect(onConfirmationRequired).toHaveBeenCalledTimes(1);
    expect(onSendText).toHaveBeenCalledWith('clipboard hello', undefined);
  });

  it('never auto-sends clipboard payloads when confirmation callback is absent', async () => {
    const onSendText = vi.fn();

    monitor = setupAutoSend(
      {
        enabled: true,
        sendText: true,
      },
      {
        onSendText,
      }
    );

    dispatchPasteEvent({ text: 'no consent callback' });
    await flushClipboardTasks();

    expect(onSendText).not.toHaveBeenCalled();
  });

  it('requires confirmation before file payloads are queued for send', async () => {
    const onSend = vi.fn();
    const onConfirmationRequired = vi.fn().mockResolvedValue(false);
    const file = new File(['clipboard-file'], 'clipboard.txt', { type: 'text/plain' });

    monitor = setupAutoSend(
      {
        enabled: true,
        sendDocuments: true,
      },
      {
        onSend,
        onConfirmationRequired,
      }
    );

    dispatchPasteEvent({ files: [file] });
    await flushClipboardTasks();

    expect(onConfirmationRequired).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });
});
