/**
 * SEO Usage Examples
 *
 * Comprehensive examples demonstrating how to use SEO utilities
 * throughout the Tallow application.
 */

import { Metadata } from 'next';
import {
  generateMetadata,
  pageMetadata,
  generateOGImageUrl,
  generateFAQSchema,
  generateBreadcrumbSchema,
  commonFAQs,
  commonBreadcrumbs,
} from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

// ============================================================================
// Example 1: Simple Page with Default Metadata
// ============================================================================

// app/features/page.tsx
export const metadataExample1: Metadata = pageMetadata.features();

export function FeaturesPageExample() {
  return (
    <main>
      <h1>Features</h1>
      {/* Page content */}
    </main>
  );
}

// ============================================================================
// Example 2: Custom Page Metadata
// ============================================================================

// app/advanced-security/page.tsx
export const metadataExample2: Metadata = generateMetadata({
  title: 'Advanced Security Features',
  description: 'Explore Tallow\'s advanced security: post-quantum encryption, triple-ratchet protocol, and onion routing.',
  keywords: ['post-quantum', 'Kyber-1024', 'ML-KEM', 'triple-ratchet', 'onion routing'],
  image: generateOGImageUrl({
    title: 'Advanced Security',
    subtitle: 'Military-Grade Protection',
    theme: 'dark',
  }),
});

export function AdvancedSecurityPageExample() {
  return (
    <main>
      <h1>Advanced Security Features</h1>
      {/* Page content */}
    </main>
  );
}

// ============================================================================
// Example 3: Page with Structured Data
// ============================================================================

// app/help/page.tsx
export const metadataExample3: Metadata = pageMetadata.help();

export function HelpPageExample() {
  // Custom FAQ for help page
  const helpFAQ = generateFAQSchema([
    {
      question: 'How do I start a transfer?',
      answer: 'To start a transfer, visit the app page, scan the QR code or share the link with the recipient, select your files, and click Transfer.',
    },
    {
      question: 'What file size limits exist?',
      answer: 'Tallow supports unlimited file sizes. Transfer as much as you need with no restrictions.',
    },
    {
      question: 'Is my data encrypted?',
      answer: 'Yes, all transfers use end-to-end post-quantum encryption. Only you and your recipient can access the files.',
    },
  ]);

  return (
    <>
      <JsonLd schema={[commonBreadcrumbs.help, helpFAQ]} />
      <main>
        <h1>Help Center</h1>
        {/* Page content */}
      </main>
    </>
  );
}

// ============================================================================
// Example 4: Page with Custom Breadcrumbs
// ============================================================================

// app/docs/api/authentication/page.tsx
export const metadataExample4: Metadata = generateMetadata({
  title: 'Authentication - API Documentation',
  description: 'Learn how to authenticate with the Tallow API using API keys and JWT tokens.',
  keywords: ['API', 'authentication', 'API key', 'JWT', 'security'],
});

export function APIAuthenticationPageExample() {
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://tallow.app' },
    { name: 'Documentation', url: 'https://tallow.app/docs' },
    { name: 'API', url: 'https://tallow.app/docs/api' },
    { name: 'Authentication' },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />
      <main>
        <h1>API Authentication</h1>
        {/* Page content */}
      </main>
    </>
  );
}

// ============================================================================
// Example 5: Homepage with Multiple Schemas
// ============================================================================

// app/page.tsx
export const metadataExample5: Metadata = pageMetadata.home();

export function HomePageExample() {
  return (
    <>
      {/* Organization + Software Application + FAQ */}
      <JsonLd
        schema={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Tallow',
            url: 'https://tallow.app',
            logo: 'https://tallow.app/logo.png',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Tallow',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web',
          },
          commonFAQs.general,
        ]}
      />
      <main>
        <h1>Secure File Transfers. Quantum-Safe.</h1>
        {/* Hero section */}
      </main>
    </>
  );
}

// ============================================================================
// Example 6: Blog Post with Article Schema
// ============================================================================

// app/blog/[slug]/page.tsx
export function generateBlogMetadata(post: {
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
}): Metadata {
  return generateMetadata({
    title: post.title,
    description: post.excerpt,
    keywords: ['blog', 'security', 'privacy', 'encryption'],
    image: generateOGImageUrl({
      title: post.title,
      subtitle: `By ${post.author}`,
      theme: 'dark',
    }),
  });
}

export function BlogPostExample() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Understanding Post-Quantum Cryptography',
    description: 'A deep dive into post-quantum encryption and why it matters.',
    author: {
      '@type': 'Person',
      name: 'Tallow Team',
    },
    datePublished: '2024-01-15T08:00:00Z',
    dateModified: '2024-01-20T10:30:00Z',
    publisher: {
      '@type': 'Organization',
      name: 'Tallow',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tallow.app/logo.png',
      },
    },
  };

  return (
    <>
      <JsonLd schema={articleSchema} />
      <article>
        <h1>Understanding Post-Quantum Cryptography</h1>
        {/* Article content */}
      </article>
    </>
  );
}

// ============================================================================
// Example 7: Product/Feature Page with Offer Schema
// ============================================================================

// app/pricing/page.tsx
export const metadataExample7: Metadata = generateMetadata({
  title: 'Pricing - Free Secure File Transfers',
  description: 'Tallow is completely free. No limits on file size, transfer speed, or number of transfers.',
  keywords: ['pricing', 'free', 'cost', 'plans'],
});

export function PricingPageExample() {
  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: 'Tallow Free Plan',
    description: 'Free unlimited secure file transfers',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    seller: {
      '@type': 'Organization',
      name: 'Tallow',
    },
  };

  return (
    <>
      <JsonLd schema={offerSchema} />
      <main>
        <h1>Pricing</h1>
        <p>Always Free. No Hidden Costs.</p>
      </main>
    </>
  );
}

// ============================================================================
// Example 8: NoIndex Page (Admin, Internal)
// ============================================================================

// app/admin/dashboard/page.tsx
export const metadataExample8: Metadata = generateMetadata({
  title: 'Admin Dashboard',
  description: 'Internal admin dashboard',
  noIndex: true, // Prevent indexing
});

export function AdminDashboardExample() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      {/* Admin content */}
    </main>
  );
}

// ============================================================================
// Example 9: Canonical URL for Duplicate Content
// ============================================================================

// app/features/alternative-url/page.tsx
export const metadataExample9: Metadata = generateMetadata({
  title: 'Features',
  description: 'Tallow features',
  canonical: '/features', // Point to canonical version
});

export function AlternativeFeaturesPageExample() {
  return (
    <main>
      <h1>Features</h1>
      {/* Duplicate content with canonical pointing to /features */}
    </main>
  );
}

// ============================================================================
// Example 10: Multi-language Page
// ============================================================================

// app/[locale]/page.tsx
export function generateLocalizedMetadata(locale: string): Metadata {
  const titles: Record<string, string> = {
    en: 'Tallow - Secure File Transfers. Quantum-Safe.',
    es: 'Tallow - Transferencias Seguras de Archivos. Seguro Cuántico.',
    fr: 'Tallow - Transferts de Fichiers Sécurisés. Sécurité Quantique.',
  };

  return generateMetadata({
    title: titles[locale] || titles.en,
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        es: '/es',
        fr: '/fr',
      },
    },
  });
}

// ============================================================================
// Complete Real-World Example: Security Page
// ============================================================================

// app/security/page.tsx
export const completeSecurityMetadata: Metadata = generateMetadata({
  title: 'Security - Military-Grade Encryption',
  description: 'Tallow uses post-quantum cryptography, triple-ratchet protocol, and onion routing to ensure military-grade security for your file transfers.',
  keywords: [
    'post-quantum cryptography',
    'Kyber-1024',
    'ML-KEM',
    'triple-ratchet',
    'onion routing',
    'end-to-end encryption',
    'zero knowledge',
    'military-grade security',
  ],
  image: generateOGImageUrl({
    title: 'Military-Grade Security',
    subtitle: 'Post-Quantum Encryption',
    theme: 'dark',
  }),
  canonical: '/security',
});

export function CompleteSecurityPageExample() {
  // Breadcrumb navigation
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://tallow.app' },
    { name: 'Security' },
  ]);

  // Security-specific FAQs
  const securityFAQ = generateFAQSchema([
    {
      question: 'What is post-quantum encryption?',
      answer: 'Post-quantum encryption uses algorithms resistant to attacks from quantum computers. Tallow implements Kyber-1024 and ML-KEM, both NIST-approved standards.',
    },
    {
      question: 'How does the triple-ratchet protocol work?',
      answer: 'The triple-ratchet protocol provides forward secrecy by constantly rotating encryption keys. Even if one key is compromised, past and future messages remain secure.',
    },
    {
      question: 'What is onion routing?',
      answer: 'Onion routing adds multiple layers of encryption and routes traffic through multiple nodes, making it nearly impossible to trace the connection between sender and receiver.',
    },
  ]);

  return (
    <>
      <JsonLd schema={[breadcrumb, securityFAQ, commonFAQs.security]} />
      <main>
        <h1>Military-Grade Security</h1>
        <section>
          <h2>Post-Quantum Cryptography</h2>
          {/* Content */}
        </section>
        <section>
          <h2>Triple-Ratchet Protocol</h2>
          {/* Content */}
        </section>
        <section>
          <h2>Onion Routing</h2>
          {/* Content */}
        </section>
      </main>
    </>
  );
}
