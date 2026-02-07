# Docs Sidebar - Quick Reference

## Component Props

### DocsSidebar
```tsx
interface DocsSidebarProps {
  activeSection?: string;           // Currently active section (e.g., "#introduction")
  onLinkClick?: (href: string) => void;  // Callback when link clicked
  isMobileMenuOpen?: boolean;       // Mobile drawer open state
  onMobileMenuClose?: () => void;   // Close mobile drawer callback
}
```

## File Structure
```
components/docs/
├── DocsSidebar.tsx           # Main component
├── DocsSidebar.module.css    # Styles
├── index.ts                  # Exports
├── SIDEBAR_IMPLEMENTATION.md # Full documentation
└── QUICK_REFERENCE.md        # This file
```

## Key Features

### 1. Collapsible Sections
- Click section header to expand/collapse
- Smooth animation
- ChevronDown/ChevronRight icons

### 2. Search & Filter
- Real-time filtering
- Searches both section titles and link titles
- Auto-expands matching sections
- Clear button (X icon)

### 3. Active Section Tracking
- Purple accent on active link
- Purple bar indicator (2px width)
- Auto-expands section containing active link

### 4. Responsive Behavior
- **Desktop (≥1024px)**: Fixed 280px sidebar
- **Mobile (<1024px)**: Slide-in drawer with overlay

### 5. Accessibility
- Full keyboard navigation
- ARIA labels and attributes
- Focus management
- Screen reader support

## Usage in Page

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { DocsSidebar } from '@/components/docs';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('#introduction');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Smooth scroll handler
  const handleLinkClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      setActiveSection(href);
    }
  };

  // IntersectionObserver for active tracking
  useEffect(() => {
    const sections = document.querySelectorAll('[data-section]');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section');
            if (id) setActiveSection(`#${id}`);
          }
        });
      },
      { rootMargin: '-100px 0px -66% 0px', threshold: 0 }
    );

    sections.forEach(section => observerRef.current?.observe(section));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className={styles.docsLayout}>
      {/* Mobile Menu Button */}
      <button
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu />
        <span>Documentation</span>
      </button>

      {/* Sidebar */}
      <DocsSidebar
        activeSection={activeSection}
        onLinkClick={handleLinkClick}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Content */}
      <main className={styles.main}>
        <section data-section="introduction" id="introduction">
          <h1>Introduction</h1>
          <p>Content...</p>
        </section>
      </main>
    </div>
  );
}
```

## CSS Layout

```css
/* Two-column layout */
.docsLayout {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  min-width: 0;
}

@media (min-width: 1024px) {
  .main {
    margin-left: 280px; /* Sidebar width */
  }
}

/* Mobile menu button */
.mobileMenuButton {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  z-index: 998;
}

@media (min-width: 1024px) {
  .mobileMenuButton {
    display: none;
  }
}

/* Content container */
.contentContainer {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}
```

## Content Sections

Each section needs:
1. `data-section` attribute (for IntersectionObserver)
2. `id` attribute (for anchor links)
3. Matching href in sidebar links

```tsx
<section
  data-section="topic-name"
  id="topic-name"
  className={styles.contentSection}
>
  <div className={styles.contentContainer}>
    <h2>Topic Name</h2>
    <p>Content...</p>
  </div>
</section>
```

## Sidebar Configuration

Edit `sections` array in `DocsSidebar.tsx`:

```tsx
const sections: SidebarSection[] = [
  {
    title: 'Section Name',
    icon: IconComponent,  // From @/components/icons
    links: [
      { title: 'Link Title', href: '#section-id' },
    ],
  },
];
```

## Color Customization

Purple accent (default: #5E5CE6):

```css
/* In DocsSidebar.module.css */
.link.active {
  color: var(--color-accent);           /* Purple text */
  background-color: var(--color-accent-subtle);  /* Purple bg */
}

.link.active::before {
  background-color: var(--color-accent); /* Purple indicator bar */
}
```

## Animation Timing

```css
/* Expand/collapse */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile drawer */
.mobileDrawer {
  transition: transform var(--transition-base); /* 250ms */
}
```

## Common Modifications

### Change sidebar width
```css
.sidebar {
  width: 320px; /* Default: 280px */
}

@media (min-width: 1024px) {
  .main {
    margin-left: 320px; /* Match sidebar width */
  }
}
```

### Adjust sticky offset
```css
.sidebar {
  top: 100px; /* Default: 80px */
}
```

### Disable search
Remove or hide `.searchContainer` in JSX or CSS:
```css
.searchContainer {
  display: none;
}
```

## Keyboard Shortcuts

- **Tab**: Navigate through links
- **Enter/Space**: Activate link or toggle section
- **Escape**: Close mobile drawer (when open)

## Performance Tips

1. **useMemo** for search filtering (already implemented)
2. **IntersectionObserver** for scroll tracking (more efficient than scroll events)
3. **CSS transforms** for animations (GPU-accelerated)
4. Keep section list under 20 items for optimal performance

## Troubleshooting

### Active section not updating
- Check `data-section` attribute matches `id`
- Verify IntersectionObserver is set up correctly
- Adjust `rootMargin` if sections are too close together

### Smooth scroll not working
- Ensure element IDs match href without `#`
- Check for conflicting scroll behavior in CSS
- Verify offset calculation accounts for header height

### Mobile drawer not closing
- Verify `onMobileMenuClose` prop is passed
- Check overlay click handler is not prevented
- Ensure z-index layering is correct

## Browser DevTools

Debug IntersectionObserver:
```js
// In browser console
const observer = observerRef.current;
console.log(observer);
```

Check active section state:
```tsx
console.log('Active section:', activeSection);
```

## Testing Checklist

- [ ] Desktop: Sidebar visible and sticky
- [ ] Mobile: Floating button appears
- [ ] Mobile: Drawer slides in smoothly
- [ ] Mobile: Overlay closes drawer
- [ ] Search filters correctly
- [ ] Sections expand/collapse
- [ ] Active section highlights on scroll
- [ ] Links scroll to correct section
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
