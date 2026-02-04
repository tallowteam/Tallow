# Tallow Documentation

Complete documentation for Tallow's component library and API.

## Structure

```
app/docs/
├── page.tsx                          # Documentation home
├── page.module.css
├── getting-started/
│   ├── page.tsx                      # Getting started guide
│   └── page.module.css
├── components/
│   ├── page.tsx                      # Component index
│   ├── page.module.css
│   ├── [component]/                  # Dynamic component pages
│   │   ├── button/
│   │   │   ├── page.tsx              # Button component docs
│   │   │   └── page.module.css
│   │   ├── card/
│   │   ├── input/
│   │   └── ...
│   └── README.md
├── design-system/
│   ├── page.tsx                      # Design system docs
│   ├── page.module.css
│   └── README.md
└── README.md

components/docs/
├── CodeBlock.tsx                     # Syntax highlighted code
├── CodeBlock.module.css
├── ComponentPreview.tsx              # Live component preview
├── ComponentPreview.module.css
├── PropsTable.tsx                    # Props documentation table
├── PropsTable.module.css
├── DocsSidebar.tsx                   # Documentation navigation
├── DocsSidebar.module.css
├── index.ts                          # Barrel export
└── README.md
```

## Documentation Pages

### 1. Documentation Home (`/docs`)
- Overview of documentation sections
- Quick start cards
- Component categories
- Featured resources

### 2. Getting Started (`/docs/getting-started`)
- Installation guide
- Project setup
- Basic usage examples
- Form patterns
- Best practices

### 3. Components Index (`/docs/components`)
- Browse all components by category
- UI Components
- Layout Components
- Form Components
- Feedback Components
- Navigation Components
- Effect Components

### 4. Component Detail (`/docs/components/[component]`)
Example: `/docs/components/button`
- Component overview
- Basic usage
- Variants showcase
- Sizes and states
- Props table
- Code examples
- Best practices
- Related components

### 5. Design System (`/docs/design-system`)
- Color palette
- Background colors
- Typography
- Font sizes and families
- Spacing scale
- Border radius
- Shadows
- Responsive breakpoints

## Documentation Components

### CodeBlock
Syntax-highlighted code display with copy button.

```tsx
import CodeBlock from '@/components/docs/CodeBlock';

<CodeBlock
  language="tsx"
  code={`const greeting = "Hello";`}
  title="Example Code"
  showLineNumbers={true}
/>
```

**Props:**
- `code: string` - Code content
- `language?: string` - Programming language (default: 'tsx')
- `title?: string` - Optional code title
- `showLineNumbers?: boolean` - Show line numbers

### ComponentPreview
Live component preview with title and description.

```tsx
import ComponentPreview from '@/components/docs/ComponentPreview';

<ComponentPreview
  title="Button Variants"
  description="All button styles"
>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
</ComponentPreview>
```

**Props:**
- `children: ReactNode` - Component to preview
- `title?: string` - Preview title
- `description?: string` - Preview description
- `variant?: 'default' | 'light' | 'dark'` - Background variant

### PropsTable
Structured props documentation table.

```tsx
import PropsTable from '@/components/docs/PropsTable';

<PropsTable
  props={[
    {
      name: 'variant',
      type: 'string',
      required: false,
      default: '"primary"',
      description: 'Button style variant'
    }
  ]}
  title="Props"
/>
```

**Props:**
- `props: PropDefinition[]` - Array of prop definitions
- `title?: string` - Table title (default: 'Props')

### DocsSidebar
Documentation navigation sidebar with sections and links.

```tsx
import DocsSidebar from '@/components/docs/DocsSidebar';

// Automatically rendered in documentation pages
<DocsSidebar />
```

Features:
- Logo with branding
- Organized navigation sections
- Active link highlighting
- Footer links
- Responsive sidebar
- Icon support

## Creating Component Documentation

### 1. Create Component Directory
```bash
mkdir app/docs/components/my-component
```

### 2. Create Documentation Page
```tsx
// app/docs/components/my-component/page.tsx
'use client';

import { Container, Section } from '@/components/layout';
import CodeBlock from '@/components/docs/CodeBlock';
import ComponentPreview from '@/components/docs/ComponentPreview';
import PropsTable from '@/components/docs/PropsTable';
import DocsSidebar from '@/components/docs/DocsSidebar';

export default function MyComponentPage() {
  const props = [
    {
      name: 'prop1',
      type: 'string',
      required: true,
      description: 'Description of prop1'
    }
  ];

  return (
    <div className={styles.page}>
      <DocsSidebar />
      <main className={styles.content}>
        <Container>
          <Section>
            <h1>My Component</h1>

            <h2>Overview</h2>
            <p>Description...</p>

            <h2>Basic Usage</h2>
            <ComponentPreview>
              <MyComponent />
            </ComponentPreview>

            <h2>Examples</h2>
            <CodeBlock language="tsx" code={`...`} />

            <h2>Props</h2>
            <PropsTable props={props} />
          </Section>
        </Container>
      </main>
    </div>
  );
}
```

### 3. Add Styles
```css
/* page.module.css */
.page {
  display: grid;
  grid-template-columns: 280px 1fr;
}

.content {
  padding: var(--spacing-12) 0;
}

.title {
  font-size: 3.5rem;
  font-weight: 800;
}
```

### 4. Update Component Index
Add component to `/docs/components/page.tsx`:

```tsx
const components: ComponentInfo[] = [
  {
    name: 'My Component',
    category: 'UI',
    description: 'Brief description',
    slug: 'my-component',
  },
  // ...
];
```

## Documentation Guidelines

### Content Standards
- Keep examples concise and runnable
- Show real-world use cases
- Include edge cases and common patterns
- Provide before/after comparisons

### Code Examples
- Use actual component imports
- Show complete, working examples
- Include all necessary props
- Add comments for non-obvious code

### Props Documentation
- Describe what each prop does
- Explain accepted values
- Show default values
- Indicate required vs optional

### Visual Design
- Use component previews for all components
- Show multiple variants and states
- Include spacing and typography examples
- Provide color swatches with tokens

### SEO Optimization
- Use descriptive headings
- Include meta descriptions
- Structure content with proper hierarchy
- Add related component links

## Styling Guidelines

### CSS Variables
Use design system tokens consistently:

```css
.element {
  color: var(--color-foreground-primary);
  background: var(--color-background-secondary);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

### Responsive Design
- Mobile-first approach
- Use breakpoints from design system
- Test all screen sizes
- Ensure readable on small devices

### Dark Mode
- All pages support dark theme
- Use CSS custom properties
- Test contrast ratios
- Ensure readability in both modes

## Navigation

### Main Navigation
- Documentation Home
- Getting Started
- Components
- Design System

### Component Navigation
- Component Index
- Individual component pages
- Related components
- Quick navigation sidebar

### Footer Links
- GitHub Repository
- Issue Tracker
- Support
- Related Projects

## Performance

### Optimization Tips
- Lazy load component previews
- Use code splitting for large examples
- Optimize images and screenshots
- Cache static content

### Build Optimization
- Extract static documentation
- Pre-generate component pages
- Minimize CSS and JavaScript
- Enable code highlighting

## Deployment

The documentation is deployed with the main application.

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

### Documentation URL
- Development: `http://localhost:3000/docs`
- Production: `https://tallow.app/docs`

## Maintenance

### Regular Updates
- Review component changes
- Update examples
- Fix broken links
- Refresh screenshots

### Version Management
- Tag versions with releases
- Maintain backward compatibility
- Document breaking changes
- Provide upgrade guides

## Contributing

When adding new components:
1. Create component directory in `app/docs/components`
2. Write comprehensive documentation
3. Add examples and props table
4. Update component index
5. Test on multiple screen sizes
6. Submit pull request

---

For questions or issues, please file an issue or contact the team.
