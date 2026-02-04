# SEO Utilities

Comprehensive SEO infrastructure for Tallow built with Next.js 16.1.2 App Router.

## Overview

This package provides:
- **Type-safe metadata generation** for all pages
- **JSON-LD structured data** for rich search results
- **Automatic sitemap generation** with priorities
- **Dynamic Open Graph images** for social sharing
- **Robots.txt configuration** for crawler control

## Quick Start

### 1. Basic Page Metadata

```tsx
// app/features/page.tsx
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata.features();

export default function FeaturesPage() {
  return <main>...</main>;
}
```

### 2. Custom Metadata

```tsx
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Custom Page Title',
  description: 'Custom page description for SEO',
  keywords: ['custom', 'keywords', 'seo'],
  image: '/custom-og-image.png',
});
```

### 3. Structured Data

```tsx
import { JsonLd } from '@/components/seo/JsonLd';
import { generateOrganizationSchema, generateFAQSchema } from '@/lib/seo';

export default function Page() {
  return (
    <>
      <JsonLd schema={generateOrganizationSchema()} />
      <JsonLd schema={generateFAQSchema([
        {
          question: 'Is it secure?',
          answer: 'Yes, military-grade encryption.',
        },
      ])} />
      <main>...</main>
    </>
  );
}
```

## Components

### JsonLd

Renders structured data as JSON-LD script tags.

```tsx
import { JsonLd } from '@/components/seo/JsonLd';

// Single schema
<JsonLd schema={organizationSchema} />

// Multiple schemas
<JsonLd schema={[orgSchema, faqSchema]} />
```

Type-safe helpers:
```tsx
<OrganizationJsonLd schema={organizationSchema} />
<FAQJsonLd schema={faqSchema} />
<BreadcrumbJsonLd schema={breadcrumbSchema} />
<WebPageJsonLd schema={webPageSchema} />
<SoftwareApplicationJsonLd schema={softwareSchema} />
```

## API Reference

### Constants

```typescript
import { SEO, PAGE_SEO, STRUCTURED_DATA } from '@/lib/seo';

// Site configuration
SEO.site.name          // 'Tallow'
SEO.site.url           // 'https://tallow.app'
SEO.site.domain        // 'tallow.app'

// Social handles
SEO.social.twitter     // '@tallow'
SEO.social.github      // 'https://github.com/tallow'

// Page metadata
PAGE_SEO.home.title
PAGE_SEO.app.description
PAGE_SEO.security.keywords
```

### Metadata Generation

#### generateMetadata()

Generate page metadata with defaults.

```typescript
interface MetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
}

generateMetadata(options?: MetadataOptions): Metadata
```

Example:
```tsx
export const metadata = generateMetadata({
  title: 'Advanced Security Features',
  description: 'Learn about post-quantum encryption',
  keywords: ['security', 'encryption'],
  canonical: '/security',
});
```

#### pageMetadata

Pre-configured metadata for common pages.

```typescript
pageMetadata.home()      // Homepage
pageMetadata.app()       // App page
pageMetadata.features()  // Features page
pageMetadata.privacy()   // Privacy policy
pageMetadata.security()  // Security page
pageMetadata.terms()     // Terms of service
pageMetadata.help()      // Help center
pageMetadata.docs()      // Documentation
```

#### generateOGImageUrl()

Generate Open Graph image URLs with parameters.

```typescript
generateOGImageUrl({
  title: 'Custom Title',
  subtitle: 'Custom Subtitle',
  theme: 'dark'
})
// Returns: '/api/og?title=Custom+Title&subtitle=...'
```

### Structured Data

#### generateOrganizationSchema()

```typescript
const schema = generateOrganizationSchema();
<JsonLd schema={schema} />
```

Generates:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Tallow",
  "url": "https://tallow.app",
  "logo": "https://tallow.app/logo.png",
  ...
}
```

#### generateSoftwareApplicationSchema()

```typescript
const schema = generateSoftwareApplicationSchema();
<JsonLd schema={schema} />
```

#### generateFAQSchema()

```typescript
const schema = generateFAQSchema([
  {
    question: 'Is Tallow secure?',
    answer: 'Yes, Tallow uses military-grade encryption...',
  },
  {
    question: 'Does it store files?',
    answer: 'No, all transfers are peer-to-peer...',
  },
]);
```

#### generateBreadcrumbSchema()

```typescript
const schema = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://tallow.app' },
  { name: 'Features', url: 'https://tallow.app/features' },
  { name: 'Security' }, // Current page (no URL)
]);
```

#### generateWebPageSchema()

```typescript
const schema = generateWebPageSchema({
  name: 'Security Features',
  description: 'Learn about our security...',
  url: 'https://tallow.app/security',
});
```

### Pre-configured Schemas

#### commonFAQs

```typescript
import { commonFAQs } from '@/lib/seo';

// Security FAQs
<JsonLd schema={commonFAQs.security} />

// General FAQs
<JsonLd schema={commonFAQs.general} />
```

#### commonBreadcrumbs

```typescript
import { commonBreadcrumbs } from '@/lib/seo';

<JsonLd schema={commonBreadcrumbs.app} />
<JsonLd schema={commonBreadcrumbs.features} />
<JsonLd schema={commonBreadcrumbs.help} />
<JsonLd schema={commonBreadcrumbs.docs} />
```

## Complete Page Example

```tsx
// app/features/page.tsx
import { Metadata } from 'next';
import { pageMetadata, commonBreadcrumbs, generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = pageMetadata.features();

export default function FeaturesPage() {
  const faqSchema = generateFAQSchema([
    {
      question: 'What encryption does Tallow use?',
      answer: 'Tallow uses post-quantum encryption including Kyber-1024 and ML-KEM.',
    },
  ]);

  return (
    <>
      <JsonLd schema={[commonBreadcrumbs.features, faqSchema]} />
      <main>
        <h1>Features</h1>
        {/* ... */}
      </main>
    </>
  );
}
```

## Sitemap & Robots

### Sitemap

Automatically generated at `/sitemap.xml`:
```typescript
// app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tallow.app',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // ... more pages
  ];
}
```

### Robots.txt

Automatically generated at `/robots.txt`:
```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
    ],
    sitemap: 'https://tallow.app/sitemap.xml',
  };
}
```

## Open Graph Images

### Default OG Image

Automatically generated at `/opengraph-image`:
```tsx
// app/opengraph-image.tsx
export default async function Image() {
  return new ImageResponse(/* ... */);
}
```

### Page-specific OG Images

```tsx
// app/features/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export default async function Image() {
  return new ImageResponse(
    <div>Features Page OG Image</div>
  );
}
```

## Best Practices

### 1. Unique Titles

Every page should have a unique title:
```tsx
export const metadata = generateMetadata({
  title: 'Unique Page Title',
});
```

### 2. Descriptive Meta Descriptions

Keep descriptions under 160 characters:
```tsx
export const metadata = generateMetadata({
  description: 'Clear, concise description under 160 chars',
});
```

### 3. Relevant Keywords

Use targeted keywords:
```tsx
export const metadata = generateMetadata({
  keywords: ['primary keyword', 'secondary keyword', 'tertiary'],
});
```

### 4. Structured Data

Add relevant structured data to every page:
```tsx
<JsonLd schema={[breadcrumb, faq, webPage]} />
```

### 5. Canonical URLs

Set canonical URLs for duplicate content:
```tsx
export const metadata = generateMetadata({
  canonical: '/canonical-page-url',
});
```

## Testing

### Verify Metadata

```bash
curl -I https://tallow.app
```

### Test Structured Data

Use Google's Rich Results Test:
https://search.google.com/test/rich-results

### Check Sitemap

```bash
curl https://tallow.app/sitemap.xml
```

### Verify Robots.txt

```bash
curl https://tallow.app/robots.txt
```

## SEO Checklist

- [ ] Unique title on every page
- [ ] Meta description under 160 chars
- [ ] Relevant keywords
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URLs
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Mobile-friendly
- [ ] Fast page load (Core Web Vitals)
- [ ] HTTPS enabled
- [ ] Valid HTML
- [ ] Accessible content

## Performance

All SEO utilities are:
- **Zero runtime overhead** - Generated at build time
- **Type-safe** - Full TypeScript support
- **Edge-compatible** - Works with Edge Runtime
- **Tree-shakeable** - Import only what you need

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
