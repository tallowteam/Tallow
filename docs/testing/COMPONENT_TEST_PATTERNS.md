# Component Test Patterns

Reusable patterns for testing React components in Tallow.

## Table of Contents

- [UI Components](#ui-components)
- [App Components](#app-components)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Effect Components](#effect-components)

## UI Components

### Button Component

```typescript
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  // Test all variants
  it.each(['primary', 'secondary', 'ghost', 'danger'])
    ('should render %s variant', (variant) => {
      render(<Button variant={variant}>Text</Button>);
      expect(screen.getByRole('button')).toHaveClass(variant);
    });

  // Test loading state
  it('should show spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  // Test interactions
  it('should call onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // Test accessibility
  it('should be keyboard accessible', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Press</Button>);

    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalled();
  });
});
```

### Input Component

```typescript
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  // Test controlled component
  it('should work as controlled component', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <Input value="" onChange={onChange} />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    expect(onChange).toHaveBeenCalled();

    rerender(<Input value="a" onChange={onChange} />);
    expect(input).toHaveValue('a');
  });

  // Test error state
  it('should display error message', () => {
    render(<Input error="Required field" />);

    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  // Test validation
  it('should validate on blur', async () => {
    const onBlur = vi.fn((e) => {
      if (!e.target.value) {
        // Trigger validation
      }
    });
    const user = userEvent.setup();

    render(<Input onBlur={onBlur} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab();

    expect(onBlur).toHaveBeenCalled();
  });
});
```

### Card Component

```typescript
import { render, screen } from '@/tests/utils/render';
import { Card, CardHeader, CardBody, CardFooter } from './Card';

describe('Card', () => {
  // Test composition
  it('should render with all sections', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  // Test variants
  it('should apply interactive styles', () => {
    const { container } = render(
      <Card variant="interactive">Interactive</Card>
    );

    expect(container.firstChild).toHaveClass('interactive');
  });

  // Test as clickable
  it('should be clickable when interactive', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Card variant="interactive" onClick={onClick}>
        Click me
      </Card>
    );

    await user.click(screen.getByText('Click me').parentElement!);
    expect(onClick).toHaveBeenCalled();
  });
});
```

## App Components

### TransferProgress Component

```typescript
import { render, screen } from '@/tests/utils/render';
import { createMockTransfer } from '@/tests/utils/mocks/zustand';
import { TransferProgress } from './TransferProgress';

describe('TransferProgress', () => {
  // Test with mock data
  it('should display transfer info', () => {
    const transfer = createMockTransfer({
      files: [{ name: 'test.pdf', size: 1024 }],
      progress: 50,
    });

    render(<TransferProgress transfer={transfer} />);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  // Test actions
  it('should pause transfer', async () => {
    const transfer = createMockTransfer({ status: 'transferring' });
    const onPause = vi.fn();
    const user = userEvent.setup();

    render(
      <TransferProgress
        transfer={transfer}
        onPause={onPause}
        onResume={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /pause/i }));
    expect(onPause).toHaveBeenCalledWith(transfer.id);
  });

  // Test state changes
  it('should update speed display', () => {
    const transfer = createMockTransfer({ speed: 1024 * 1024 });
    const { rerender } = render(<TransferProgress transfer={transfer} />);

    expect(screen.getByText(/1 MB\/s/)).toBeInTheDocument();

    // Update speed
    rerender(
      <TransferProgress
        transfer={{ ...transfer, speed: 2 * 1024 * 1024 }}
      />
    );

    expect(screen.getByText(/2 MB\/s/)).toBeInTheDocument();
  });
});
```

### DeviceCard Component

```typescript
import { render, screen } from '@/tests/utils/render';
import { createMockDevice } from '@/tests/utils/mocks/zustand';
import { DeviceCard } from './DeviceCard';

describe('DeviceCard', () => {
  // Test online/offline states
  it('should show online indicator', () => {
    const device = createMockDevice({ isOnline: true });
    render(<DeviceCard device={device} />);

    expect(screen.getByText(/online/i)).toBeInTheDocument();
  });

  // Test selection
  it('should handle selection', async () => {
    const device = createMockDevice();
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<DeviceCard device={device} onSelect={onSelect} />);

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(device);
  });

  // Test favorite toggle
  it('should toggle favorite', async () => {
    const device = createMockDevice({ isFavorite: false });
    const onToggleFavorite = vi.fn();
    const user = userEvent.setup();

    render(
      <DeviceCard
        device={device}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const favoriteBtn = screen.getByRole('button', { name: /favorite/i });
    await user.click(favoriteBtn);

    expect(onToggleFavorite).toHaveBeenCalledWith(device.id);
  });
});
```

## Layout Components

### Header Component

```typescript
import { render, screen } from '@/tests/utils/render';
import { Header } from './Header';

describe('Header', () => {
  // Test navigation
  it('should have navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /app/i })).toBeInTheDocument();
  });

  // Test mobile menu
  it('should toggle mobile menu', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: /menu/i });
    await user.click(menuButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Test sticky behavior
  it('should be sticky on scroll', () => {
    const { container } = render(<Header />);

    const header = container.querySelector('header');
    expect(header).toHaveStyle({ position: 'sticky' });
  });
});
```

### Footer Component

```typescript
import { render, screen } from '@/tests/utils/render';
import { Footer } from './Footer';

describe('Footer', () => {
  // Test links
  it('should have legal links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument();
  });

  // Test copyright
  it('should show current year', () => {
    render(<Footer />);

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(year.toString()))).toBeInTheDocument();
  });
});
```

## Form Components

### Form with Validation

```typescript
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  // Test validation
  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  // Test submission
  it('should submit valid form', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      message: 'Hello',
    });
  });

  // Test error handling
  it('should display server errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();

    render(<ContactForm onSubmit={onSubmit} />);

    // Fill and submit
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Wait for error
    await screen.findByText(/server error/i);
  });
});
```

## Effect Components

### FadeIn Component

```typescript
import { render } from '@/tests/utils/render';
import { FadeIn } from './FadeIn';

describe('FadeIn', () => {
  // Test with IntersectionObserver mock
  it('should fade in when visible', () => {
    const { container } = render(
      <FadeIn>
        <div>Content</div>
      </FadeIn>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ opacity: 0 });

    // Simulate intersection
    const [callback] = (IntersectionObserver as any).mock.calls[0];
    callback([{ isIntersecting: true }]);

    expect(wrapper).toHaveStyle({ opacity: 1 });
  });
});
```

### Counter Component

```typescript
import { render, screen, waitFor } from '@/tests/utils/render';
import { Counter } from './Counter';

describe('Counter', () => {
  // Test animation
  it('should count up to target', async () => {
    render(<Counter target={100} duration={100} />);

    // Initially 0
    expect(screen.getByText('0')).toBeInTheDocument();

    // Wait for count to complete
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  // Test with custom formatter
  it('should format number', async () => {
    render(
      <Counter
        target={1000}
        formatter={(n) => `${n.toLocaleString()}`}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });
});
```

## Testing Hooks

### Custom Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDeviceStore } from '@/lib/stores/device-store';

describe('useDeviceStore', () => {
  it('should add device', () => {
    const { result } = renderHook(() => useDeviceStore());

    const device = createMockDevice();

    act(() => {
      result.current.addDevice(device);
    });

    expect(result.current.devices).toContain(device);
  });

  it('should select device', () => {
    const { result } = renderHook(() => useDeviceStore());

    const device = createMockDevice();

    act(() => {
      result.current.selectDevice(device);
    });

    expect(result.current.selectedDevice).toEqual(device);
  });
});
```

## Snapshot Testing

Use sparingly for components with stable output.

```typescript
import { render } from '@/tests/utils/render';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should match snapshot', () => {
    const { container } = render(<Badge>New</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

## Performance Testing

```typescript
import { render } from '@/tests/utils/render';
import { HeavyComponent } from './HeavyComponent';

describe('HeavyComponent Performance', () => {
  it('should render within time limit', () => {
    const start = performance.now();
    render(<HeavyComponent items={Array.from({ length: 1000 })} />);
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // 100ms budget
  });
});
```
