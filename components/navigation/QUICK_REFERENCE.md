# Navigation Components - Quick Reference

Fast reference guide for Tallow navigation components.

## Import

```tsx
import { Tabs, Breadcrumb, Pagination, Sidebar, Dropdown, CommandPalette, Stepper } from '@/components/navigation';
```

---

## Tabs

```tsx
// Basic
<Tabs items={[{ id: '1', label: 'Tab 1', content: <div>Content</div> }]} defaultValue="1" />

// Controlled
<Tabs items={items} value={active} onValueChange={setActive} />

// Pills variant
<Tabs items={items} variant="pills" />

// With icons
<Tabs items={[{ id: '1', label: 'Home', icon: <Icon />, content: <div /> }]} />
```

**Keyboard:** Arrow keys, Home, End

---

## Breadcrumb

```tsx
// Basic
<Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Current' }]} />

// With home icon
<Breadcrumb items={items} showHomeIcon />

// Truncated
<Breadcrumb items={longItems} maxItems={4} />

// Custom separator
<Breadcrumb items={items} separator={<span>→</span>} />
```

---

## Pagination

```tsx
// Full featured
<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
  itemsPerPage={10}
  onItemsPerPageChange={setPerPage}
  totalItems={100}
  showItemsPerPage
  showTotal
/>

// Simple
<Pagination currentPage={1} totalPages={10} onPageChange={setPage} />
```

---

## Sidebar

```tsx
<Sidebar
  items={[
    {
      id: 'item',
      label: 'Item',
      href: '/path',
      icon: <Icon />,
      badge: 3,
      children: [{ id: 'child', label: 'Child', href: '/path/child' }]
    }
  ]}
  defaultCollapsed={false}
  onCollapsedChange={(collapsed) => console.log(collapsed)}
/>
```

**Features:** Auto-detects active route, nested items, collapsible

---

## Dropdown

```tsx
<Dropdown
  trigger={<button>Menu</button>}
  items={[
    { id: '1', label: 'Edit', icon: <Icon />, onClick: () => {} },
    { id: 'div', type: 'divider' },
    { id: '2', label: 'Delete', danger: true, onClick: () => {} }
  ]}
  align="right"
/>
```

**Keyboard:** Arrow keys, Enter, Escape, Home, End

---

## CommandPalette

```tsx
// Setup keyboard listener
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

// Render palette
<CommandPalette
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  items={[
    {
      id: 'cmd',
      label: 'Command',
      description: 'Description',
      icon: <Icon />,
      group: 'Group',
      shortcut: ['⌘', 'K'],
      keywords: ['search', 'terms'],
      onSelect: () => {}
    }
  ]}
  recentCommands={recent}
  onRecentUpdate={setRecent}
/>
```

**Keyboard:** Arrow keys, Enter, Escape

---

## Stepper

```tsx
// Horizontal
<Stepper
  steps={[
    { id: '1', label: 'Step 1', description: 'Description' },
    { id: '2', label: 'Step 2' }
  ]}
  currentStep={0}
  onStepClick={setStep}
  allowClickNavigation
  orientation="horizontal"
/>

// Vertical
<Stepper steps={steps} currentStep={1} orientation="vertical" />

// With icons
<Stepper
  steps={[{ id: '1', label: 'Step', icon: <Icon /> }]}
  currentStep={0}
/>
```

---

## Common Props

All components support:
- `className` - Additional CSS classes
- Full TypeScript types
- ARIA attributes
- Keyboard navigation

## Styling

Components use Tailwind classes with Tallow's dark theme:
- Background: `bg-black`, `bg-zinc-900`
- Border: `border-zinc-800`
- Text: `text-white`, `text-zinc-400`
- Focus: `focus-visible:ring-2 focus-visible:ring-white`

## Accessibility

All components include:
- Proper ARIA roles and labels
- Keyboard navigation
- Focus management
- Screen reader support

## Performance Tips

1. **Tabs**: Use React.memo for expensive content
2. **Pagination**: Memoize onPageChange callback
3. **Sidebar**: Keep items array stable (useMemo)
4. **Dropdown**: Items array should be memoized
5. **CommandPalette**: Lazy load heavy command handlers
6. **Stepper**: Keep steps array stable

## Common Patterns

### Tabs with URL sync
```tsx
const [tab, setTab] = useState(searchParams.get('tab') || 'default');
const handleChange = (newTab: string) => {
  setTab(newTab);
  router.push(`?tab=${newTab}`);
};
```

### Pagination with data fetching
```tsx
const [page, setPage] = useState(1);
const { data, isLoading } = useQuery(['items', page], () => fetchItems(page));
```

### Command Palette with search
```tsx
const commands = useMemo(() => [
  // Define commands
], []);
```

### Stepper with form
```tsx
const [step, setStep] = useState(0);
const nextStep = () => {
  if (validateStep(step)) {
    setStep(s => s + 1);
  }
};
```

## Dark Theme Colors

```tsx
// Background
bg-black          // #000000
bg-zinc-900       // #18181b

// Border
border-zinc-800   // #27272a

// Text
text-white        // #ffffff
text-zinc-400     // #a1a1aa
text-zinc-500     // #71717a
text-zinc-600     // #52525b

// States
hover:bg-zinc-900
hover:text-white
focus-visible:ring-white
```

## TypeScript

All components export their prop types:

```tsx
import type { TabsProps, TabItem } from '@/components/navigation';
import type { SidebarProps, SidebarItem } from '@/components/navigation';
// etc.
```

## Files

```
components/navigation/
├── Tabs.tsx              - Tab navigation
├── Breadcrumb.tsx        - Breadcrumb
├── Pagination.tsx        - Pagination
├── Sidebar.tsx           - Sidebar
├── Dropdown.tsx          - Dropdown menu
├── CommandPalette.tsx    - Command palette
├── Stepper.tsx           - Step indicator
├── index.ts              - Exports
├── README.md             - Full documentation
├── examples.tsx          - Usage examples
└── QUICK_REFERENCE.md    - This file
```
