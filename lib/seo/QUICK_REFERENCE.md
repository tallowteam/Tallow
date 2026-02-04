# SEO Quick Reference

Fast reference for Tallow SEO utilities.

## Import Paths

```tsx
// Main exports
import {
  SEO,                           // Constants
  pageMetadata,                  // Pre-configured metadata
  generateMetadata,              // Custom metadata generator
  commonFAQs,                    // Pre-built FAQ schemas
  commonBreadcrumbs,             // Pre-built breadcrumb schemas
  generateFAQSchema,             // Custom FAQ generator
  generateBreadcrumbSchema,      // Custom breadcrumb generator
  generateOrganizationSchema,    // Organization schema
  generateSoftwareApplicationSchema, // Software schema
} from '@/lib/seo';

// JSON-LD component
import { JsonLd } from '@/components/seo/JsonLd';
```

## Common Patterns

### Standard Page

```tsx
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata.features();

export default function Page() {
  return <main>...</main>;
}
```

### Page with Breadcrumbs

```tsx
import { pageMetadata, commonBreadcrumbs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.app();

export default function Page() {
  return (
    <>
      <JsonLd schema={commonBreadcrumbs.app} />
      <main>...</main>
    </>
  );
}
```

### Page with FAQs

```tsx
import { pageMetadata, commonFAQs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.security();

export default function Page() {
  return (
    <>
      <JsonLd schema={commonFAQs.security} />
      <main>...</main>
    </>
  );
}
```

### Custom Metadata

```tsx
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Custom Title',
  description: 'Custom description',
  keywords: ['keyword1', 'keyword2'],
});
```

### Custom FAQ

```tsx
import { generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

const faq = generateFAQSchema([
  { question: 'Q1?', answer: 'A1' },
  { question: 'Q2?', answer: 'A2' },
]);

<JsonLd schema={faq} />
```

### Multiple Schemas

```tsx
import { JsonLd } from '@/components/seo/JsonLd';
import {
  generateOrganizationSchema,
  commonFAQs,
  commonBreadcrumbs,
} from '@/lib/seo';

<JsonLd
  schema={[
    generateOrganizationSchema(),
    commonBreadcrumbs.app,
    commonFAQs.general,
  ]}
/>
```

## Pre-configured Metadata

```tsx
pageMetadata.home()      // Homepage
pageMetadata.app()       // App page
pageMetadata.features()  // Features
pageMetadata.privacy()   // Privacy Policy
pageMetadata.security()  // Security
pageMetadata.terms()     // Terms of Service
pageMetadata.help()      // Help Center
pageMetadata.docs()      // Documentation
```

## Pre-configured Schemas

```tsx
// FAQs
commonFAQs.security      // Security FAQs
commonFAQs.general       // General FAQs

// Breadcrumbs
commonBreadcrumbs.app        // Home > App
commonBreadcrumbs.features   // Home > Features
commonBreadcrumbs.help       // Home > Help
commonBreadcrumbs.docs       // Home > Docs
```

## Custom Schema Generators

```tsx
// Organization
generateOrganizationSchema()

// Software Application
generateSoftwareApplicationSchema()

// FAQ
generateFAQSchema([
  { question: 'string', answer: 'string' }
])

// Breadcrumb
generateBreadcrumbSchema([
  { name: 'Home', url: 'https://...' },
  { name: 'Page' }
])

// Web Page
generateWebPageSchema({
  name: 'Page Name',
  description: 'Description',
  url: 'https://...'
})
```

## Constants

```tsx
import { SEO } from '@/lib/seo';

SEO.site.name          // 'Tallow'
SEO.site.url           // 'https://tallow.app'
SEO.site.domain        // 'tallow.app'
SEO.social.twitter     // '@tallow'
SEO.company.email      // 'hello@tallow.app'
```

## File Locations

```
app/
├── sitemap.ts              # Sitemap generation
├── robots.ts               # Robots.txt generation
├── opengraph-image.tsx     # Default OG image
└── [page]/
    ├── page.tsx            # Add metadata export here
    └── opengraph-image.tsx # Optional: page-specific OG image

lib/seo/
├── constants.ts            # SEO constants
├── metadata.ts             # Metadata utilities
├── structured-data.ts      # Schema generators
├── types.ts                # TypeScript types
└── index.ts                # Main exports

components/seo/
└── JsonLd.tsx              # JSON-LD component
```

## Testing URLs

```bash
# Local
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
http://localhost:3000/opengraph-image

# Production
https://tallow.app/sitemap.xml
https://tallow.app/robots.txt
https://tallow.app/opengraph-image
```

## Validation Tools

- **Rich Results**: https://search.google.com/test/rich-results
- **Facebook OG**: https://developers.facebook.com/tools/debug/
- **Twitter Cards**: https://cards-dev.twitter.com/validator
- **Schema Validator**: https://validator.schema.org/

## Common Options

### generateMetadata()

```tsx
generateMetadata({
  title: string,              // Page title
  description: string,        // Meta description
  keywords: string[],         // Keywords array
  image: string,              // OG image path
  noIndex: boolean,           // Prevent indexing
  canonical: string,          // Canonical URL
  alternates: {               // Language alternates
    canonical: string,
    languages: Record<string, string>
  }
})
```

### generateFAQSchema()

```tsx
generateFAQSchema([
  {
    question: string,         // Question text
    answer: string           // Answer text
  }
])
```

### generateBreadcrumbSchema()

```tsx
generateBreadcrumbSchema([
  {
    name: string,            // Item name
    url?: string            // Optional URL (omit for current page)
  }
])
```

## Best Practices

1. **Unique titles**: Every page should have unique metadata
2. **Description length**: Keep under 160 characters
3. **Relevant keywords**: Use 5-10 targeted keywords
4. **Structured data**: Add JSON-LD to all pages
5. **Canonical URLs**: Set for duplicate content
6. **OG images**: 1200x630px for optimal display
7. **Build-time generation**: All SEO data generated at build

## Common Mistakes

❌ **Don't**:
```tsx
// Inside component
export default function Page() {
  const metadata = pageMetadata.home(); // Wrong!
}
```

✅ **Do**:
```tsx
// Top level export
export const metadata = pageMetadata.home(); // Correct!

export default function Page() {
  return <main>...</main>;
}
```

❌ **Don't**:
```tsx
// Client component with metadata
'use client';
export const metadata = pageMetadata.home(); // Won't work!
```

✅ **Do**:
```tsx
// Server component (default)
export const metadata = pageMetadata.home(); // Works!
```

## Performance Tips

- ✅ Use pre-configured metadata when possible
- ✅ Generate structured data at build time
- ✅ Use Edge Runtime for OG images
- ✅ Keep schemas static (no dynamic data)
- ✅ Import only what you need (tree-shaking)

## TypeScript

All utilities are fully typed:

```tsx
import type {
  MetadataOptions,
  FAQItem,
  BreadcrumbItem,
} from '@/lib/seo/types';
```

## Quick Commands

```bash
# Type check
npm run type-check

# Build
npm run build

# Start production
npm start

# Test sitemap
curl http://localhost:3000/sitemap.xml

# Test robots
curl http://localhost:3000/robots.txt
```

## Support

For issues or questions:
- Check: `lib/seo/README.md`
- Check: `lib/seo/INTEGRATION_GUIDE.md`
- Check: `lib/seo/examples.tsx`
