# SEO Integration Guide

Complete guide to integrating SEO utilities into Tallow pages.

## Table of Contents

- [Quick Start](#quick-start)
- [Page-by-Page Integration](#page-by-page-integration)
- [Advanced Usage](#advanced-usage)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Update Homepage

```tsx
// app/page.tsx
import { pageMetadata, generateOrganizationSchema, commonFAQs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.home();

export default function HomePage() {
  return (
    <>
      <JsonLd
        schema={[
          generateOrganizationSchema(),
          commonFAQs.general,
        ]}
      />
      <main>{/* existing content */}</main>
    </>
  );
}
```

### 2. Update App Page

```tsx
// app/app/page.tsx
import { pageMetadata, commonBreadcrumbs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.app();

export default function AppPage() {
  return (
    <>
      <JsonLd schema={commonBreadcrumbs.app} />
      <main>{/* existing content */}</main>
    </>
  );
}
```

### 3. Update Features Page

```tsx
// app/features/page.tsx
import { pageMetadata, commonBreadcrumbs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.features();

export default function FeaturesPage() {
  return (
    <>
      <JsonLd schema={commonBreadcrumbs.features} />
      <main>{/* existing content */}</main>
    </>
  );
}
```

## Page-by-Page Integration

### Security Page

```tsx
// app/security/page.tsx
import { pageMetadata, commonBreadcrumbs, commonFAQs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.security();

export default function SecurityPage() {
  return (
    <>
      <JsonLd
        schema={[
          commonBreadcrumbs.app,
          commonFAQs.security,
        ]}
      />
      <main>{/* content */}</main>
    </>
  );
}
```

### Privacy Policy Page

```tsx
// app/privacy/page.tsx
import { pageMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.privacy();

export default function PrivacyPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://tallow.app' },
    { name: 'Privacy Policy' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <main>{/* content */}</main>
    </>
  );
}
```

### Terms of Service Page

```tsx
// app/terms/page.tsx
import { pageMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.terms();

export default function TermsPage() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://tallow.app' },
    { name: 'Terms of Service' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <main>{/* content */}</main>
    </>
  );
}
```

### Help Center Page

```tsx
// app/help/page.tsx
import { pageMetadata, commonBreadcrumbs, generateFAQSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.help();

export default function HelpPage() {
  const helpFAQ = generateFAQSchema([
    {
      question: 'How do I start a transfer?',
      answer: 'Visit the app page, scan QR code or share link, select files, and transfer.',
    },
    {
      question: 'What file sizes are supported?',
      answer: 'Unlimited file sizes with no restrictions.',
    },
  ]);

  return (
    <>
      <JsonLd schema={[commonBreadcrumbs.help, helpFAQ]} />
      <main>{/* content */}</main>
    </>
  );
}
```

### Documentation Page

```tsx
// app/docs/page.tsx
import { pageMetadata, commonBreadcrumbs } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata = pageMetadata.docs();

export default function DocsPage() {
  return (
    <>
      <JsonLd schema={commonBreadcrumbs.docs} />
      <main>{/* content */}</main>
    </>
  );
}
```

## Advanced Usage

### Custom OG Images per Page

```tsx
// app/features/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
        }}
      >
        <div style={{ fontSize: 72, color: '#fff' }}>
          Tallow Features
        </div>
      </div>
    ),
    size
  );
}
```

### Dynamic Pages with generateMetadata

```tsx
// app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { generateMetadata as genMeta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);

  return genMeta({
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    image: post.coverImage,
  });
}

export default function BlogPostPage() {
  return <article>{/* content */}</article>;
}
```

### Multi-language Support

```tsx
// app/[locale]/page.tsx
import { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const translations: Record<string, { title: string; description: string }> = {
    en: {
      title: 'Secure File Transfers',
      description: 'Transfer files with quantum-safe encryption',
    },
    es: {
      title: 'Transferencias Seguras',
      description: 'Transfiere archivos con cifrado cuántico',
    },
  };

  const t = translations[params.locale] || translations.en;

  return generateMetadata({
    title: t.title,
    description: t.description,
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        es: '/es',
      },
    },
  });
}
```

## Testing & Validation

### 1. Local Testing

```bash
# Start development server
npm run dev

# Visit pages and check HTML source
curl http://localhost:3000 | grep -A 10 '<meta'
```

### 2. Sitemap Verification

```bash
# Build the project
npm run build

# Check sitemap
curl http://localhost:3000/sitemap.xml
```

### 3. Robots.txt Verification

```bash
curl http://localhost:3000/robots.txt
```

### 4. Structured Data Testing

Use Google's Rich Results Test:
1. Visit: https://search.google.com/test/rich-results
2. Enter page URL or paste HTML
3. Verify schemas are recognized

### 5. Open Graph Testing

Use Facebook's Sharing Debugger:
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter page URL
3. Check OG tags and image preview

### 6. Twitter Card Testing

Use Twitter's Card Validator:
1. Visit: https://cards-dev.twitter.com/validator
2. Enter page URL
3. Verify card preview

## Troubleshooting

### Metadata Not Showing

**Problem**: Metadata not appearing in page source

**Solution**:
```tsx
// Ensure metadata is exported at top level
export const metadata: Metadata = pageMetadata.home();

// NOT inside component
export default function Page() {
  // ❌ Wrong place
  const metadata = pageMetadata.home();
}
```

### Structured Data Errors

**Problem**: Google Search Console shows structured data errors

**Solution**:
1. Validate JSON-LD syntax
2. Check required fields are present
3. Use type-safe schema generators

```tsx
// ✅ Correct
const schema = generateFAQSchema([
  { question: 'Q1', answer: 'A1' },
]);

// ❌ Wrong - missing required fields
const schema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
};
```

### OG Image Not Generating

**Problem**: Open Graph image returns 500 error

**Solution**:
1. Check `export const runtime = 'edge'`
2. Verify ImageResponse import
3. Test image generation locally

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'; // ✅ Correct import

export const runtime = 'edge'; // ✅ Required
export const size = { width: 1200, height: 630 }; // ✅ Required

export default async function Image() {
  return new ImageResponse(/* ... */);
}
```

### Sitemap Not Found

**Problem**: /sitemap.xml returns 404

**Solution**:
1. Ensure `app/sitemap.ts` exists
2. Export default function returning `MetadataRoute.Sitemap`
3. Rebuild project

```bash
npm run build
npm start
```

### Build Errors

**Problem**: TypeScript errors during build

**Solution**:
```bash
# Run type check
npm run type-check

# Fix import paths
# ✅ Correct
import { generateMetadata } from '@/lib/seo';

# ❌ Wrong
import { generateMetadata } from '@/lib/seo/metadata';
```

## Performance Checklist

- [ ] All metadata generated at build time
- [ ] No client-side metadata generation
- [ ] OG images use Edge Runtime
- [ ] Structured data is static
- [ ] No dynamic imports for SEO utilities
- [ ] Sitemap includes all pages
- [ ] Robots.txt is optimized

## SEO Audit Checklist

- [ ] Unique title on every page
- [ ] Meta description under 160 chars
- [ ] Keywords relevant to content
- [ ] Open Graph tags complete
- [ ] Twitter Card tags complete
- [ ] Canonical URLs set
- [ ] Structured data valid
- [ ] Sitemap accessible
- [ ] Robots.txt correct
- [ ] Mobile-friendly
- [ ] Fast page load
- [ ] HTTPS enabled

## Next Steps

1. **Integrate on all pages**: Add metadata and structured data to every page
2. **Test thoroughly**: Use validation tools to check implementation
3. **Monitor**: Set up Google Search Console and Analytics
4. **Optimize**: Continuously improve based on performance data

## Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
