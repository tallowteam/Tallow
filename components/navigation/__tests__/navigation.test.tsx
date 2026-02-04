/**
 * Navigation Components - Unit Tests
 *
 * Tests for all navigation components using React Testing Library
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, Breadcrumb, Pagination, Dropdown, Stepper } from '../index';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/overview',
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Tabs', () => {
  const items = [
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Disabled', content: <div>Content 3</div>, disabled: true },
  ];

  it('renders all tabs', () => {
    render(<Tabs items={items} defaultValue="tab1" />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('shows default tab content', () => {
    render(<Tabs items={items} defaultValue="tab1" />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="tab1" />);

    await user.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="tab1" />);

    const tab1 = screen.getByText('Tab 1');
    tab1.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('calls onValueChange in controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Tabs items={items} value="tab1" onValueChange={handleChange} />
    );

    await user.click(screen.getByText('Tab 2'));
    expect(handleChange).toHaveBeenCalledWith('tab2');
  });

  it('disables tabs correctly', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="tab1" />);

    const disabledTab = screen.getByText('Disabled');
    expect(disabledTab).toBeDisabled();

    await user.click(disabledTab);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });
});

describe('Breadcrumb', () => {
  const items = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Current' },
  ];

  it('renders all breadcrumb items', () => {
    render(<Breadcrumb items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(<Breadcrumb items={items} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('shows home icon when enabled', () => {
    const { container } = render(
      <Breadcrumb items={items} showHomeIcon />
    );
    // Home icon should be present
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('truncates long paths', () => {
    const longItems = [
      { label: 'Home', href: '/' },
      { label: 'Level 1', href: '/1' },
      { label: 'Level 2', href: '/2' },
      { label: 'Level 3', href: '/3' },
      { label: 'Level 4', href: '/4' },
      { label: 'Current' },
    ];

    render(<Breadcrumb items={longItems} maxItems={4} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('marks last item as current page', () => {
    render(<Breadcrumb items={items} />);
    const currentItem = screen.getByText('Current');
    expect(currentItem).toHaveAttribute('aria-current', 'page');
  });
});

describe('Pagination', () => {
  it('renders page numbers', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onPageChange when clicking pages', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={handleChange}
      />
    );

    await user.click(screen.getByText('3'));
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={jest.fn()}
      />
    );

    const prevButton = screen.getByLabelText('Go to previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={jest.fn()}
      />
    );

    const nextButton = screen.getByLabelText('Go to next page');
    expect(nextButton).toBeDisabled();
  });

  it('shows items per page selector when enabled', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={jest.fn()}
        itemsPerPage={10}
        onItemsPerPageChange={jest.fn()}
        showItemsPerPage
      />
    );

    expect(screen.getByLabelText('Items per page:')).toBeInTheDocument();
  });

  it('shows total count when enabled', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={jest.fn()}
        itemsPerPage={10}
        totalItems={50}
        showTotal
      />
    );

    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('renders ellipsis for many pages', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={20}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText('...')).toBeInTheDocument();
  });
});

describe('Dropdown', () => {
  const items = [
    { id: '1', label: 'Edit', onClick: jest.fn() },
    { id: 'div', type: 'divider' as const },
    { id: '2', label: 'Delete', danger: true, onClick: jest.fn() },
    { id: '3', label: 'Disabled', disabled: true, onClick: jest.fn() },
  ];

  it('opens menu on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();

    await user.click(screen.getByText('Menu'));
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('closes menu on item click', async () => {
    const user = userEvent.setup();
    const handleEdit = jest.fn();
    const itemsWithHandler = [
      { id: '1', label: 'Edit', onClick: handleEdit },
    ];

    render(
      <Dropdown trigger={<button>Menu</button>} items={itemsWithHandler} />
    );

    await user.click(screen.getByText('Menu'));
    await user.click(screen.getByText('Edit'));

    expect(handleEdit).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />
    );

    const trigger = screen.getByText('Menu');
    trigger.focus();

    await user.keyboard('{Enter}');
    expect(screen.getByText('Edit')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(items[2].onClick).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByText('Menu'));
    expect(screen.getByText('Edit')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  it('does not call onClick for disabled items', async () => {
    const user = userEvent.setup();
    render(
      <Dropdown trigger={<button>Menu</button>} items={items} />
    );

    await user.click(screen.getByText('Menu'));
    const disabledItem = screen.getByText('Disabled');

    await user.click(disabledItem);
    expect(items[3].onClick).not.toHaveBeenCalled();
  });
});

describe('Stepper', () => {
  const steps = [
    { id: '1', label: 'Step 1', description: 'First step' },
    { id: '2', label: 'Step 2', description: 'Second step' },
    { id: '3', label: 'Step 3', description: 'Third step' },
  ];

  it('renders all steps', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('shows descriptions', () => {
    render(<Stepper steps={steps} currentStep={0} />);
    expect(screen.getByText('First step')).toBeInTheDocument();
    expect(screen.getByText('Second step')).toBeInTheDocument();
  });

  it('marks current step correctly', () => {
    render(<Stepper steps={steps} currentStep={1} />);
    const step2 = screen.getByText('Step 2');
    expect(step2.closest('button')).toHaveAttribute('aria-current', 'step');
  });

  it('allows clicking completed steps when enabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Stepper
        steps={steps}
        currentStep={2}
        onStepClick={handleClick}
        allowClickNavigation
      />
    );

    await user.click(screen.getByText('Step 1'));
    expect(handleClick).toHaveBeenCalledWith(0);
  });

  it('does not allow clicking future steps', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Stepper
        steps={steps}
        currentStep={0}
        onStepClick={handleClick}
        allowClickNavigation
      />
    );

    await user.click(screen.getByText('Step 3'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders horizontal orientation', () => {
    const { container } = render(
      <Stepper steps={steps} currentStep={0} orientation="horizontal" />
    );

    const list = container.querySelector('[role="list"]');
    expect(list).toHaveClass('flex', 'items-center');
  });

  it('renders vertical orientation', () => {
    const { container } = render(
      <Stepper steps={steps} currentStep={0} orientation="vertical" />
    );

    const list = container.querySelector('[role="list"]');
    expect(list).toHaveClass('flex-col');
  });
});
