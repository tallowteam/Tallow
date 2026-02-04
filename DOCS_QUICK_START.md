# Documentation Quick Start Guide

## Access Documentation

```bash
# Start development server
npm run dev

# Visit documentation home
http://localhost:3000/docs
```

## Main Documentation URLs

| Section | URL | Purpose |
|---------|-----|---------|
| Home | `/docs` | Documentation overview |
| Getting Started | `/docs/getting-started` | Installation & setup |
| Components | `/docs/components` | Component browser |
| Button Component | `/docs/components/button` | Example component docs |
| Design System | `/docs/design-system` | Colors, spacing, typography |

## Creating New Component Documentation

### 1. Create Directory
```bash
mkdir app/docs/components/card
```

### 2. Create Documentation Page
```tsx
// app/docs/components/card/page.tsx
'use client';

import { Container, Section } from '@/components/layout';
import CodeBlock from '@/components/docs/CodeBlock';
import ComponentPreview from '@/components/docs/ComponentPreview';
import PropsTable from '@/components/docs/PropsTable';
import DocsSidebar from '@/components/docs/DocsSidebar';
import styles from './page.module.css';

export default function CardComponentPage() {
  const props = [
    {
      name: 'variant',
      type: '"default" | "highlighted" | "interactive"',
      required: false,
      default: '"default"',
      description: 'Card visual style',
    },
  ];

  return (
    <div className={styles.page}>
      <DocsSidebar />
      <main className={styles.content}>
        <Container>
          <Section>
            <h1>Card Component</h1>
            <p>Container for grouping related content.</p>

            <h2>Basic Usage</h2>
            <ComponentPreview>
              <Card>
                <CardHeader>
                  <h3>Card Title</h3>
                </CardHeader>
                <CardBody>
                  <p>Card content goes here</p>
                </CardBody>
              </Card>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`import { Card, CardHeader, CardBody } from '@/components/ui';

<Card>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
</Card>`}
            />

            <h2>Props</h2>
            <PropsTable props={props} />
          </Section>
        </Container>
      </main>
    </div>
  );
}
```

### 3. Create Styles
```css
/* app/docs/components/card/page.module.css */
.page {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.content {
  padding: var(--spacing-12) 0;
}

/* Copy from button/page.module.css as template */
```

### 4. Update Component Index
```tsx
// app/docs/components/page.tsx
const components = [
  {
    name: 'Card',
    category: 'UI',
    description: 'Container for grouping related content',
    slug: 'card',
  },
  // ... other components
];
```

## Documentation Components API

### CodeBlock
Display syntax-highlighted code with copy button.

```tsx
<CodeBlock
  language="tsx"
  code={`const greeting = "Hello";`}
  title="Example Code"
  showLineNumbers={true}
/>
```

**Props:**
- `code: string` - Code to display (required)
- `language?: string` - Language for syntax highlighting (default: 'tsx')
- `title?: string` - Optional code title
- `showLineNumbers?: boolean` - Show line numbers (default: false)

### ComponentPreview
Live component showcase.

```tsx
<ComponentPreview
  title="Button Variants"
  description="All available button styles"
>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
</ComponentPreview>
```

**Props:**
- `children: ReactNode` - Component to preview (required)
- `title?: string` - Preview title
- `description?: string` - Preview description
- `variant?: 'default' | 'light' | 'dark'` - Background style

### PropsTable
Structured props documentation.

```tsx
<PropsTable
  props={[
    {
      name: 'onClick',
      type: '(event: MouseEvent) => void',
      required: false,
      default: 'undefined',
      description: 'Click event handler',
    },
  ]}
  title="Props"
/>
```

**Props:**
- `props: PropDefinition[]` - Array of prop definitions (required)
- `title?: string` - Table title (default: 'Props')

### DocsSidebar
Navigation sidebar (auto-included in pages).

```tsx
import DocsSidebar from '@/components/docs/DocsSidebar';

<DocsSidebar />
```

Auto-generates navigation from nav sections.

## Sidebar Navigation

Edit `components/docs/DocsSidebar.tsx`:

```tsx
const navSections: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Documentation', href: '/docs', icon: '📚' },
      { title: 'Getting Started', href: '/docs/getting-started', icon: '🚀' },
    ],
  },
  // Add more sections...
];
```

## Design System Tokens

### Colors
```css
--color-accent-primary: #7c3aed
--color-accent-secondary: #6366f1
--color-accent-tertiary: #3b82f6
--color-success: #10b981
--color-warning: #f59e0b
--color-error: #ef4444
```

### Spacing
```css
--spacing-1: 0.25rem (4px)
--spacing-2: 0.5rem (8px)
--spacing-4: 1rem (16px)
--spacing-6: 1.5rem (24px)
--spacing-8: 2rem (32px)
--spacing-12: 3rem (48px)
--spacing-16: 4rem (64px)
--spacing-24: 6rem (96px)
```

### Typography
```css
--font-size-xs: 0.75rem (12px)
--font-size-sm: 0.875rem (14px)
--font-size-base: 1rem (16px)
--font-size-lg: 1.125rem (18px)
--font-size-xl: 1.25rem (20px)
--font-size-2xl: 1.5rem (24px)
--font-size-3xl: 1.875rem (30px)
--font-size-4xl: 2.25rem (36px)
--font-size-5xl: 3rem (48px)
```

### Border Radius
```css
--radius-sm: 0.25rem (4px)
--radius-base: 0.375rem (6px)
--radius-md: 0.5rem (8px)
--radius-lg: 0.75rem (12px)
--radius-xl: 1rem (16px)
--radius-2xl: 1.5rem (24px)
--radius-full: 9999px
```

## Common Documentation Patterns

### Component with Multiple Variants
```tsx
<h2>Variants</h2>
<ComponentPreview title="All Variants">
  <Component variant="primary">Primary</Component>
  <Component variant="secondary">Secondary</Component>
  <Component variant="danger">Danger</Component>
</ComponentPreview>

<CodeBlock language="tsx" code={`<Component variant="primary">Primary</Component>`} />
```

### Props Documentation
```tsx
<h2>Props</h2>
<PropsTable
  props={[
    {
      name: 'variant',
      type: 'string',
      required: false,
      default: '"primary"',
      description: 'Component style variant',
    },
  ]}
/>
```

### Code Examples
```tsx
<h2>Usage Examples</h2>
<Card>
  <CardHeader>
    <h3>Form Submission</h3>
  </CardHeader>
  <CardBody>
    <CodeBlock
      language="tsx"
      title="Form with Button"
      code={`...`}
    />
  </CardBody>
</Card>
```

## File Structure Template

```css
/* page.module.css */

.page {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
}

.content {
  padding: var(--spacing-12) 0;
}

.title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  margin-bottom: var(--spacing-4);
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sectionTitle {
  font-size: clamp(1.75rem, 3vw, 2rem);
  font-weight: 700;
  margin-top: var(--spacing-20);
  margin-bottom: var(--spacing-8);
  border-bottom: 1px solid var(--color-border-secondary);
}

.text {
  color: var(--color-foreground-secondary);
  line-height: 1.7;
  margin-bottom: var(--spacing-8);
}

/* Responsive */
@media (max-width: 1024px) {
  .page {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .title { font-size: 2rem; }
  .sectionTitle { font-size: 1.5rem; }
}
```

## Checklist for New Component Documentation

- [ ] Create component directory
- [ ] Create `page.tsx` with documentation
- [ ] Create `page.module.css` with styles
- [ ] Add overview section
- [ ] Add basic usage with ComponentPreview
- [ ] Add code example with CodeBlock
- [ ] Add props table with PropsTable
- [ ] Add multiple variants/states
- [ ] Add best practices section
- [ ] Add related components
- [ ] Update components index
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Verify links work
- [ ] Check accessibility

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Documentation will be available at /docs
```

## Troubleshooting

### Sidebar not showing
- Ensure `DocsSidebar` is imported in page
- Check grid layout in `page.module.css`
- Verify navigation sections in sidebar component

### Styles not applying
- Check CSS module imports
- Verify CSS variable names
- Ensure media queries are correct
- Check specificity

### Code highlighting not working
- Verify language prop on CodeBlock
- Check supported language list
- Test with simpler code first

### Mobile layout broken
- Check grid-template-columns in CSS
- Verify responsive breakpoints
- Test on actual mobile device
- Check media query syntax

## Resources

- **Main Docs:** `app/docs/README.md`
- **Design System:** `app/globals.css`
- **Example:** `app/docs/components/button/`
- **Components:** `components/docs/`

## Support

For questions or issues:
1. Check existing documentation pages
2. Review component examples
3. Refer to design system tokens
4. Examine CSS module patterns
5. Test in development mode

---

**Ready to add documentation? Pick a component and follow the steps above!**
