/**
 * JSON-LD Component
 *
 * Renders structured data as JSON-LD script tag.
 * Type-safe rendering of schema.org structured data.
 *
 * Note: Uses dangerouslySetInnerHTML for JSON-LD which is safe because:
 * 1. JSON.stringify automatically escapes dangerous characters
 * 2. Content is TypeScript-validated structured data (not user input)
 * 3. JSON-LD requires script tag with JSON content (standard practice)
 */

import React from 'react';
import type {
  Organization,
  SoftwareApplication,
  FAQPage,
  BreadcrumbList,
  WebPage,
} from '@/lib/seo/structured-data';

/**
 * All supported schema types
 */
export type Schema =
  | Organization
  | SoftwareApplication
  | FAQPage
  | BreadcrumbList
  | WebPage
  | Record<string, unknown>;

/**
 * Props for JsonLd component
 */
export interface JsonLdProps {
  schema: Schema | Schema[];
}

/**
 * Safely stringify schema for JSON-LD
 * JSON.stringify escapes dangerous characters automatically
 */
function safeStringify(schema: Schema): string {
  return JSON.stringify(schema);
}

/**
 * Renders JSON-LD structured data
 *
 * @example
 * ```tsx
 * import { JsonLd } from '@/components/seo/JsonLd';
 * import { generateOrganizationSchema } from '@/lib/seo/structured-data';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <JsonLd schema={generateOrganizationSchema()} />
 *       <main>...</main>
 *     </>
 *   );
 * }
 * ```
 */
export function JsonLd({ schema }: JsonLdProps): React.ReactElement {
  // Handle both single schema and array of schemas
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((s, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStringify(s) }}
        />
      ))}
    </>
  );
}

/**
 * Type-safe helper for rendering organization schema
 */
export function OrganizationJsonLd({ schema }: { schema: Organization }): React.ReactElement {
  return <JsonLd schema={schema} />;
}

/**
 * Type-safe helper for rendering software application schema
 */
export function SoftwareApplicationJsonLd({ schema }: { schema: SoftwareApplication }): React.ReactElement {
  return <JsonLd schema={schema} />;
}

/**
 * Type-safe helper for rendering FAQ schema
 */
export function FAQJsonLd({ schema }: { schema: FAQPage }): React.ReactElement {
  return <JsonLd schema={schema} />;
}

/**
 * Type-safe helper for rendering breadcrumb schema
 */
export function BreadcrumbJsonLd({ schema }: { schema: BreadcrumbList }): React.ReactElement {
  return <JsonLd schema={schema} />;
}

/**
 * Type-safe helper for rendering web page schema
 */
export function WebPageJsonLd({ schema }: { schema: WebPage }): React.ReactElement {
  return <JsonLd schema={schema} />;
}
