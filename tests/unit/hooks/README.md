# React Hooks Unit Tests

Comprehensive unit tests for React hooks using @testing-library/react's `renderHook` API and Vitest.

## Quick Start

### Run all hook tests
```bash
npm test tests/unit/hooks
```

### Run specific test file
```bash
npm test tests/unit/hooks/use-file-transfer.test.ts
npm test tests/unit/hooks/use-unified-discovery.test.ts
npm test tests/unit/hooks/use-chat-integration.test.ts
npm test tests/unit/hooks/use-performance.test.ts
npm test tests/unit/hooks/use-screen-capture.test.ts
npm test tests/unit/hooks/use-notifications.test.ts
```

### Watch mode (re-run tests on file changes)
```bash
npm test -- --watch tests/unit/hooks
```

### Coverage report
```bash
npm test -- --coverage tests/unit/hooks
```

### UI mode (interactive test runner)
```bash
npm test -- --ui tests/unit/hooks
```

## Test Files Overview

### 1. use-file-transfer.test.ts
Tests file selection, drag-and-drop, and file management.

**Key Areas**:
- File addition and removal
- Drag and drop events
- File input handling
- Total size calculation
- Large file lists

**Example Test**:
```typescript
it('should add a single file', () => {
  const { result } = renderHook(() => useFileTransfer());
  const mockFile = createMockFile('test.txt', 1024);

  act(() => {
    result.current.addFiles([mockFile]);
  });

  expect(result.current.files).toHaveLength(1);
  expect(result.current.files[0].name).toBe('test.txt');
});
```

### 2. use-unified-discovery.test.ts
Tests device discovery via mDNS and signaling server.

**Key Areas**:
- Start/stop discovery
- Device list updates
- Connection method selection
- Device filtering
- Status tracking

**Example Test**:
```typescript
it('should start discovery', async () => {
  const { result } = renderHook(() => useUnifiedDiscovery({ autoStart: false }));

  await act(async () => {
    await result.current.startDiscovery();
  });

  expect(mockUnifiedDiscovery.start).toHaveBeenCalled();
});
```

### 3. use-chat-integration.test.ts
Tests chat functionality during file transfers.

**Key Areas**:
- Chat initialization
- Message events
- Unread count tracking
- Error handling
- Cleanup

**Example Test**:
```typescript
it('should increment unread count on new message from peer', async () => {
  const { result } = renderHook(() =>
    useChatIntegration({
      dataChannel: mockDataChannel,
      sessionKeys: mockSessionKeys,
      currentUserId: 'user-1',
      currentUserName: 'User 1',
      enabled: true,
    })
  );

  await waitFor(() => {
    expect(result.current.isReady).toBe(true);
  });

  act(() => {
    eventCallback?.({ type: 'message', message: mockMessage });
  });

  expect(result.current.unreadCount).toBe(1);
});
```

### 4. use-performance.test.ts
Tests performance monitoring and metrics collection.

**Key Areas**:
- Performance marking
- Web Vitals tracking
- Long task detection
- Render time measurement
- Async timing

**Example Test**:
```typescript
it('should collect metrics', async () => {
  const { result } = renderHook(() => usePerformance({ trackWebVitals: true }));

  act(() => {
    metricCallback?.(mockMetric);
  });

  await waitFor(() => {
    expect(result.current.metrics).toHaveLength(1);
  });
});
```

### 5. use-screen-capture.test.ts
Tests screen sharing and capture functionality.

**Key Areas**:
- Start/stop capture
- Quality control
- Audio toggle
- PQC protection
- Error handling

**Example Test**:
```typescript
it('should start screen capture', async () => {
  const { result } = renderHook(() => useScreenCapture());

  let stream: MediaStream | null = null;

  await act(async () => {
    stream = await result.current.startCapture();
  });

  expect(mockScreenSharingManager.startSharing).toHaveBeenCalled();
  expect(stream).toBeInstanceOf(MediaStream);
});
```

### 6. use-notifications.test.ts
Tests notification management and toast integration.

**Key Areas**:
- General notifications
- Transfer notifications
- Connection notifications
- Browser notifications
- Settings sync

**Example Test**:
```typescript
it('should notify transfer complete', () => {
  const { result } = renderHook(() => useNotifications());

  act(() => {
    result.current.notifyTransferComplete('document.pdf', 'received');
  });

  expect(mockSuccess).toHaveBeenCalledWith(
    'Successfully received: document.pdf',
    { title: 'File Received' }
  );
});
```

## Test Structure

Each test file follows this structure:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock dependencies
vi.mock('@/lib/module', () => ({
  mockFunction: vi.fn(),
}));

describe('useHookName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something', () => {
      const { result } = renderHook(() => useHookName());

      act(() => {
        result.current.action();
      });

      expect(result.current.state).toBe(expected);
    });
  });
});
```

## Common Test Patterns

### Testing State Updates
```typescript
act(() => {
  result.current.updateState();
});

expect(result.current.state).toBe(newValue);
```

### Testing Async Operations
```typescript
await act(async () => {
  await result.current.asyncAction();
});

await waitFor(() => {
  expect(result.current.isReady).toBe(true);
});
```

### Testing Cleanup
```typescript
const { unmount } = renderHook(() => useHook());

unmount();

expect(mockCleanup).toHaveBeenCalled();
```

### Testing Props Changes
```typescript
const { result, rerender } = renderHook(
  ({ enabled }) => useHook({ enabled }),
  { initialProps: { enabled: false } }
);

rerender({ enabled: true });

expect(result.current.isActive).toBe(true);
```

### Testing Timers
```typescript
vi.useFakeTimers();

act(() => {
  result.current.startTimer();
});

act(() => {
  vi.advanceTimersByTime(1000);
});

expect(result.current.elapsed).toBe(1000);

vi.useRealTimers();
```

## Mocking Strategies

### Module Mocking
```typescript
vi.mock('@/lib/utils/uuid', () => ({
  generateUUID: vi.fn(() => 'mock-uuid'),
}));
```

### Class Mocking
```typescript
const mockManager = {
  method: vi.fn(),
};

vi.mock('@/lib/manager', () => ({
  Manager: vi.fn(() => mockManager),
}));
```

### Browser API Mocking
```typescript
global.navigator = {
  mediaDevices: {
    getDisplayMedia: vi.fn(),
  },
} as any;
```

### Callback Capture
```typescript
let callback: ((data: any) => void) | null = null;

mockManager.on.mockImplementation((event, cb) => {
  callback = cb;
  return () => { callback = null; };
});

// Later in test:
act(() => {
  callback?.(mockData);
});
```

## Debugging Tests

### Run a single test
```bash
npm test -- -t "should add a single file"
```

### Enable debug logging
```bash
DEBUG=* npm test tests/unit/hooks
```

### Use Vitest UI for debugging
```bash
npm test -- --ui tests/unit/hooks
```

### Check test coverage
```bash
npm test -- --coverage --coverage.reporter=html tests/unit/hooks
# Open coverage/index.html in browser
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly builds

CI Configuration: `.github/workflows/test.yml`

## Test Statistics

- **Total Tests**: 262
- **Total Lines**: ~24,400
- **Average Test Duration**: <10ms per test
- **Coverage Target**: >90%

## Troubleshooting

### Tests timing out
**Solution**: Increase timeout in vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
});
```

### Mock not working
**Solution**: Ensure mock is defined before import:
```typescript
vi.mock('@/lib/module', () => ({ ... }));
// Must come before any imports that use the module
import { useHook } from '@/lib/hooks/use-hook';
```

### Act warnings
**Solution**: Wrap state updates in act():
```typescript
act(() => {
  result.current.updateState();
});
```

### Async warnings
**Solution**: Use waitFor() for async state updates:
```typescript
await waitFor(() => {
  expect(result.current.isReady).toBe(true);
});
```

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use descriptive test names
3. Test both happy and error paths
4. Include edge cases
5. Mock external dependencies
6. Clean up in afterEach/beforeEach
7. Update this README if adding new patterns

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React Hooks](https://react-hooks-testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)

---

**Last Updated**: February 6, 2026
**Test Coverage**: 262 tests across 6 hook files
