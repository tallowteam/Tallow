# Navigation Components

Production-ready navigation components for Tallow built with React 19, Next.js 16, and TypeScript strict mode.

## Components

### 1. Tabs

Tab navigation with smooth animations and keyboard support.

**Features:**
- Controlled and uncontrolled modes
- Horizontal tab layout with animated indicator
- Icon support
- Keyboard navigation (Arrow keys, Home, End)
- Two variants: default and pills
- ARIA compliant

**Usage:**

```tsx
import { Tabs } from '@/components/navigation';

const items = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <Icon />,
    content: <div>Overview content</div>
  },
  {
    id: 'settings',
    label: 'Settings',
    content: <div>Settings content</div>
  },
  {
    id: 'disabled',
    label: 'Disabled',
    disabled: true
  },
];

// Uncontrolled
<Tabs items={items} defaultValue="overview" />

// Controlled
const [activeTab, setActiveTab] = useState('overview');
<Tabs items={items} value={activeTab} onValueChange={setActiveTab} />

// Pills variant
<Tabs items={items} variant="pills" />
```

---

### 2. Breadcrumb

Breadcrumb navigation with truncation support.

**Features:**
- Dynamic items with links
- Home icon support
- Custom separator
- Truncation for long paths
- ARIA navigation

**Usage:**

```tsx
import { Breadcrumb } from '@/components/navigation';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Tallow', href: '/projects/tallow' },
    { label: 'Current Page' }
  ]}
  showHomeIcon
  maxItems={4}
/>

// Custom separator
<Breadcrumb
  items={items}
  separator={<span>→</span>}
/>
```

---

### 3. Pagination

Pagination with page numbers and items per page selector.

**Features:**
- Page numbers with ellipsis
- Previous/Next buttons
- Items per page selector
- Total count display
- Keyboard navigation
- ARIA compliant

**Usage:**

```tsx
import { Pagination } from '@/components/navigation';

const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
  itemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={100}
  showItemsPerPage
  showTotal
  siblingCount={1}
/>
```

---

### 4. Sidebar

Collapsible sidebar with nested menu items.

**Features:**
- Nested menu items
- Active state detection (using Next.js pathname)
- Collapse/expand functionality
- Icons and badges
- Keyboard navigation
- ARIA compliant

**Usage:**

```tsx
import { Sidebar } from '@/components/navigation';

const items = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
    badge: 3,
    children: [
      { id: 'overview', label: 'Overview', href: '/dashboard/overview' },
      { id: 'analytics', label: 'Analytics', href: '/dashboard/analytics' }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <SettingsIcon />
  }
];

<Sidebar
  items={items}
  defaultCollapsed={false}
  onCollapsedChange={(collapsed) => console.log(collapsed)}
/>
```

---

### 5. Dropdown

Dropdown menu with keyboard navigation.

**Features:**
- Custom trigger element
- Menu items with icons
- Dividers
- Keyboard navigation (Arrow keys, Enter, Escape)
- Click outside to close
- Focus management
- ARIA compliant

**Usage:**

```tsx
import { Dropdown } from '@/components/navigation';

<Dropdown
  trigger={
    <button className="px-4 py-2 bg-white text-black rounded-lg">
      Menu
    </button>
  }
  items={[
    {
      id: 'edit',
      label: 'Edit',
      icon: <EditIcon />,
      onClick: () => console.log('Edit')
    },
    { id: 'divider1', type: 'divider' },
    {
      id: 'delete',
      label: 'Delete',
      danger: true,
      onClick: () => console.log('Delete')
    },
    {
      id: 'disabled',
      label: 'Disabled',
      disabled: true
    }
  ]}
  align="right"
/>
```

---

### 6. CommandPalette

Command palette with fuzzy search (⌘K).

**Features:**
- Search input with fuzzy matching
- Command groups
- Keyboard shortcuts display
- Recent commands
- Keyboard navigation
- Portal rendering
- ARIA compliant

**Usage:**

```tsx
import { CommandPalette } from '@/components/navigation';

const [isOpen, setIsOpen] = useState(false);
const [recentCommands, setRecentCommands] = useState<string[]>([]);

// Listen for ⌘K
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(true);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);

const commands = [
  {
    id: 'new-file',
    label: 'New File',
    description: 'Create a new file',
    icon: <FileIcon />,
    group: 'File',
    shortcut: ['⌘', 'N'],
    keywords: ['create', 'add'],
    onSelect: () => console.log('New file')
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Search for files',
    icon: <SearchIcon />,
    group: 'Navigation',
    shortcut: ['⌘', 'F'],
    onSelect: () => console.log('Search')
  }
];

<CommandPalette
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  items={commands}
  recentCommands={recentCommands}
  onRecentUpdate={(id) => {
    setRecentCommands(prev => [id, ...prev.filter(x => x !== id)].slice(0, 5));
  }}
/>
```

---

### 7. Stepper

Step indicator for multi-step processes.

**Features:**
- Horizontal/vertical orientation
- Completed/active/upcoming states
- Click to navigate (optional)
- Description per step
- Custom icons
- Animated transitions
- ARIA compliant

**Usage:**

```tsx
import { Stepper } from '@/components/navigation';

const [currentStep, setCurrentStep] = useState(0);

<Stepper
  steps={[
    {
      id: '1',
      label: 'Account',
      description: 'Create your account',
      icon: <AccountIcon />
    },
    {
      id: '2',
      label: 'Profile',
      description: 'Complete your profile'
    },
    {
      id: '3',
      label: 'Done',
      description: 'Start using the app'
    }
  ]}
  currentStep={currentStep}
  onStepClick={setCurrentStep}
  allowClickNavigation
  orientation="horizontal"
/>

// Vertical orientation
<Stepper
  steps={steps}
  currentStep={currentStep}
  orientation="vertical"
/>
```

---

## Design System

All components follow Tallow's dark theme design system:

- **Background:** Black (`#000000`)
- **Surface:** Zinc-900 (`#18181b`)
- **Border:** Zinc-800 (`#27272a`)
- **Text Primary:** White (`#ffffff`)
- **Text Secondary:** Zinc-400 (`#a1a1aa`)
- **Accent:** White on black for active states

## Accessibility

All components are built with accessibility in mind:

- Full keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly
- Proper semantic HTML

## Keyboard Shortcuts

### Tabs
- `Arrow Left/Right`: Navigate between tabs
- `Home/End`: Jump to first/last tab

### Pagination
- Standard button navigation

### Sidebar
- Standard link navigation
- `Enter`: Expand/collapse nested items

### Dropdown
- `Arrow Up/Down`: Navigate menu items
- `Enter/Space`: Select item
- `Escape`: Close menu
- `Home/End`: Jump to first/last item

### CommandPalette
- `⌘K` or `Ctrl+K`: Open palette
- `Arrow Up/Down`: Navigate commands
- `Enter`: Execute command
- `Escape`: Close palette

### Stepper
- Click navigation (if enabled)

## Performance

All components are optimized for performance:

- React 19 features utilized
- Minimal re-renders
- Efficient event handlers
- CSS transitions instead of JS animations
- Lazy evaluation where applicable

## TypeScript

Full TypeScript support with strict mode:

- Comprehensive type definitions
- Proper inference
- No `any` types
- Exported interfaces for all props

## Examples

See individual component documentation above for usage examples.

## File Structure

```
components/navigation/
├── Tabs.tsx              # Tab navigation
├── Breadcrumb.tsx        # Breadcrumb navigation
├── Pagination.tsx        # Pagination component
├── Sidebar.tsx           # Collapsible sidebar
├── Dropdown.tsx          # Dropdown menu
├── CommandPalette.tsx    # Command palette (⌘K)
├── Stepper.tsx           # Step indicator
├── index.ts              # Barrel exports
└── README.md             # This file
```

## Browser Support

All components work in modern browsers with:
- CSS Grid/Flexbox support
- ES6+ support
- React 19 support

## License

Part of Tallow project.
