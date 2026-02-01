# Quick Integration Guide - Landing Page Components

Step-by-step guide to integrate UseCaseGrid and TechnologyShowcase into your landing page.

## Quick Start (5 minutes)

### Step 1: Import Components

```tsx
// app/page.tsx or app/landing/page.tsx
import { UseCaseGrid } from "@/components/features/use-case-grid";
import { TechnologyShowcase } from "@/components/features/technology-showcase";
```

### Step 2: Add to Landing Page

```tsx
export default function LandingPage() {
  return (
    <main>
      {/* Your existing hero section */}
      <section className="section-hero-dark">
        {/* ... hero content ... */}
      </section>

      {/* Use Cases Section */}
      <section className="section-content">
        <div className="container-full">
          <UseCaseGrid />
        </div>
      </section>

      {/* Technology Section */}
      <section className="section-dark">
        <div className="container-full">
          <TechnologyShowcase />
        </div>
      </section>

      {/* Your existing footer */}
    </main>
  );
}
```

### Step 3: Test

```bash
npm run dev
# Navigate to http://localhost:3000
```

Done! Both components should now appear on your landing page.

---

## Complete Landing Page Example

Here's a full landing page structure with best practices:

```tsx
// app/page.tsx
import { UseCaseGrid } from "@/components/features/use-case-grid";
import { TechnologyShowcase } from "@/components/features/technology-showcase";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="section-hero-dark min-h-screen flex items-center justify-center">
        <div className="container-full text-center">
          <h1 className="display-xl mb-6">
            Secure File Sharing
            <br />
            <span className="text-muted">Without Compromise</span>
          </h1>
          <p className="body-xl max-w-3xl mx-auto mb-12">
            Transfer files peer-to-peer with post-quantum encryption,
            perfect forward secrecy, and zero server access.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/app" className="btn-primary">
              Start Sharing
            </Link>
            <Link href="/how-it-works" className="btn-outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section-content-lg">
        <div className="container-full">
          <UseCaseGrid />
        </div>
      </section>

      {/* Technology Section */}
      <section className="section-dark">
        <div className="container-full">
          <TechnologyShowcase />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-content text-center">
        <div className="container-narrow">
          <h2 className="display-md mb-6">Ready to Get Started?</h2>
          <p className="body-lg mb-8">
            Join thousands of users who trust Tallow for secure file sharing.
          </p>
          <Link href="/app" className="btn-primary">
            Try Tallow Free
          </Link>
        </div>
      </section>
    </main>
  );
}
```

---

## Customization Examples

### Example 1: Industry-Specific Landing Page

```tsx
import { UseCaseGrid, UseCase } from "@/components/features/use-case-grid";

// Healthcare-focused landing page
const healthcareUseCases: UseCase[] = [
  {
    id: "patient-records",
    icon: "FileHeart",
    persona: "Primary Care Physicians",
    scenario: "Securely sharing patient records with specialists",
    features: [
      "HIPAA compliance",
      "End-to-end encryption",
      "Audit trails",
      "Emergency access controls",
    ],
  },
  {
    id: "lab-results",
    icon: "TestTube",
    persona: "Laboratories",
    scenario: "Sending test results to referring physicians",
    features: [
      "Large file support",
      "Automated notifications",
      "Integration with EHR",
      "Secure archiving",
    ],
  },
  // ... more healthcare-specific use cases
];

export default function HealthcareLanding() {
  return (
    <section className="section-content">
      <div className="container-full">
        <div className="text-center mb-16">
          <h2 className="display-md mb-4">
            Built for Healthcare Professionals
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            HIPAA-compliant file sharing designed specifically for
            medical practices, hospitals, and healthcare organizations.
          </p>
        </div>
        <UseCaseGrid useCases={healthcareUseCases} />
      </div>
    </section>
  );
}
```

### Example 2: Two-Column Layout

```tsx
export default function AlternativeLayout() {
  return (
    <section className="section-content">
      <div className="container-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <h2 className="display-md mb-6">
              The Future of File Sharing
            </h2>
            <p className="body-lg mb-8">
              Tallow combines cutting-edge cryptography with
              user-friendly design to create the most secure
              file sharing experience available.
            </p>
            <Link href="/security" className="btn-primary">
              Explore Security Features
            </Link>
          </div>

          {/* Right: Technology Cards */}
          <div>
            <TechnologyShowcase className="lg:ml-8" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Example 3: Tabbed Interface

```tsx
"use client";

import { useState } from "react";
import { UseCaseGrid } from "@/components/features/use-case-grid";
import { TechnologyShowcase } from "@/components/features/technology-showcase";

export default function TabbedLanding() {
  const [activeTab, setActiveTab] = useState<"use-cases" | "technology">("use-cases");

  return (
    <section className="section-content">
      <div className="container-full">
        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-16">
          <button
            onClick={() => setActiveTab("use-cases")}
            className={`btn-outline ${
              activeTab === "use-cases" ? "bg-primary text-white" : ""
            }`}
          >
            Use Cases
          </button>
          <button
            onClick={() => setActiveTab("technology")}
            className={`btn-outline ${
              activeTab === "technology" ? "bg-primary text-white" : ""
            }`}
          >
            Technology
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "use-cases" ? (
          <UseCaseGrid />
        ) : (
          <TechnologyShowcase />
        )}
      </div>
    </section>
  );
}
```

---

## SEO Optimization

Add proper metadata for search engines:

```tsx
// app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tallow - Secure File Sharing with Post-Quantum Encryption",
  description:
    "Transfer files securely with quantum-resistant encryption, perfect forward secrecy, and true peer-to-peer connections. HIPAA compliant, zero server storage.",
  keywords: [
    "secure file sharing",
    "post-quantum encryption",
    "peer-to-peer transfer",
    "HIPAA compliant",
    "end-to-end encryption",
  ],
  openGraph: {
    title: "Tallow - Secure File Sharing",
    description: "The most secure way to share files online",
    url: "https://tallow.app",
    siteName: "Tallow",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tallow - Secure File Sharing",
    description: "The most secure way to share files online",
    images: ["/twitter-image.png"],
  },
};

export default function LandingPage() {
  // ... component code
}
```

---

## Performance Optimization

### Lazy Loading Components

```tsx
import dynamic from "next/dynamic";

// Lazy load components that are below the fold
const UseCaseGrid = dynamic(
  () => import("@/components/features/use-case-grid").then(mod => mod.UseCaseGrid),
  { ssr: true }
);

const TechnologyShowcase = dynamic(
  () => import("@/components/features/technology-showcase").then(mod => mod.TechnologyShowcase),
  { ssr: true }
);
```

### Preload Critical Resources

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://analytics.example.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Analytics Integration

Track user interactions:

```tsx
"use client";

import { UseCaseGrid } from "@/components/features/use-case-grid";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    // Track page view
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: "Landing Page",
        page_location: window.location.href,
      });
    }
  }, []);

  return (
    <section className="section-content">
      <div className="container-full">
        <UseCaseGrid />
      </div>
    </section>
  );
}
```

---

## A/B Testing Setup

```tsx
"use client";

import { UseCaseGrid } from "@/components/features/use-case-grid";
import { TechnologyShowcase } from "@/components/features/technology-showcase";
import { useEffect, useState } from "react";

export default function ABTestLanding() {
  const [variant, setVariant] = useState<"A" | "B">("A");

  useEffect(() => {
    // Simple A/B test: 50/50 split
    setVariant(Math.random() > 0.5 ? "A" : "B");
  }, []);

  return (
    <section className="section-content">
      <div className="container-full">
        {variant === "A" ? (
          // Variant A: Use Cases first
          <>
            <UseCaseGrid />
            <div className="mt-32">
              <TechnologyShowcase />
            </div>
          </>
        ) : (
          // Variant B: Technology first
          <>
            <TechnologyShowcase />
            <div className="mt-32">
              <UseCaseGrid />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
```

---

## Internationalization (i18n)

```tsx
// app/[locale]/page.tsx
import { UseCaseGrid, UseCase } from "@/components/features/use-case-grid";
import { getTranslations } from "@/lib/i18n";

export default async function LocalizedLanding({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations(locale);

  const localizedUseCases: UseCase[] = [
    {
      id: "privacy-advocates",
      icon: "Shield",
      persona: t("useCases.privacyAdvocates.persona"),
      scenario: t("useCases.privacyAdvocates.scenario"),
      features: t("useCases.privacyAdvocates.features"),
    },
    // ... more localized use cases
  ];

  return (
    <section className="section-content">
      <div className="container-full">
        <UseCaseGrid useCases={localizedUseCases} />
      </div>
    </section>
  );
}
```

---

## Troubleshooting

### Component Not Rendering

```bash
# Check imports
import { UseCaseGrid } from "@/components/features/use-case-grid";

# Verify file exists
ls components/features/use-case-grid.tsx

# Check for TypeScript errors
npm run type-check
```

### Styling Issues

```bash
# Ensure Tailwind is processing the file
# Add to tailwind.config.js:
content: [
  "./components/**/*.{js,ts,jsx,tsx}",
  "./app/**/*.{js,ts,jsx,tsx}",
]

# Rebuild
npm run build
```

### Animation Not Working

```tsx
// Check Framer Motion is installed
npm list framer-motion

// Verify reduced motion setting
// Open DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion
```

---

## Production Checklist

Before deploying to production:

- [ ] Test on mobile devices (iOS, Android)
- [ ] Verify accessibility with screen reader
- [ ] Check performance with Lighthouse
- [ ] Test dark mode appearance
- [ ] Verify all links work correctly
- [ ] Test with slow 3G network
- [ ] Check browser compatibility
- [ ] Validate HTML/CSS
- [ ] Test keyboard navigation
- [ ] Verify analytics tracking
- [ ] Test with ad blockers enabled
- [ ] Check GDPR compliance (if EU users)

---

## Next Steps

1. **Review Examples**: Check `*.example.tsx` files for more patterns
2. **Run Tests**: Execute test suite to ensure everything works
3. **Customize**: Adapt components to match your brand
4. **Monitor**: Track user engagement with analytics
5. **Iterate**: A/B test different layouts and messaging

---

## Support Resources

- **Documentation**: `README-LANDING-COMPONENTS.md`
- **Examples**: `use-case-grid.example.tsx`, `technology-showcase.example.tsx`
- **Tests**: `*.test.tsx` files
- **Design System**: `app/globals.css`
- **Type Definitions**: Component source files

---

## Version History

- **v1.0.0** (2026-01-26): Initial release with UseCaseGrid and TechnologyShowcase
