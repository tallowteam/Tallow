import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input label="Name" onChange={handleChange} />);

    const input = screen.getByLabelText('Name');
    await user.type(input, 'John');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('John');
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('displays helper text', () => {
    render(<Input label="Password" helperText="Must be 8 characters" />);
    expect(screen.getByText('Must be 8 characters')).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(
      <Input
        label="Email"
        helperText="Enter your email"
        error="Invalid email"
      />
    );
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('renders leading icon', () => {
    render(
      <Input
        label="Search"
        leadingIcon={<span data-testid="leading-icon">🔍</span>}
      />
    );
    expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
  });

  it('renders trailing icon', () => {
    render(
      <Input
        label="Amount"
        trailingIcon={<span data-testid="trailing-icon">$</span>}
      />
    );
    expect(screen.getByTestId('trailing-icon')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<Input label="Disabled" disabled />);
    expect(screen.getByLabelText('Disabled')).toBeDisabled();
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Input label="Full" fullWidth />);
    expect(container.firstChild).toHaveClass('fullWidth');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input label="Test" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('generates unique id when not provided', () => {
    const { container: container1 } = render(<Input label="First" />);
    const { container: container2 } = render(<Input label="Second" />);

    const input1 = container1.querySelector('input');
    const input2 = container2.querySelector('input');

    expect(input1?.id).toBeDefined();
    expect(input2?.id).toBeDefined();
    expect(input1?.id).not.toBe(input2?.id);
  });

  it('uses provided id', () => {
    render(<Input label="Test" id="custom-id" />);
    expect(screen.getByLabelText('Test')).toHaveAttribute('id', 'custom-id');
  });

  it('associates error message with input via aria-describedby', () => {
    render(<Input label="Email" id="email-input" error="Invalid" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-describedby', 'email-input-error');
  });
});
