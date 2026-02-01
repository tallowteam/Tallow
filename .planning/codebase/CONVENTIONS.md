# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- Components: kebab-case (e.g., `device-card.tsx`, `transfer-card.tsx`)
- Utilities/Hooks: kebab-case (e.g., `use-file-transfer.ts`, `key-management.ts`)
- Pages: kebab-case (e.g., `page.tsx` in directory structure like `app/app/history/page.tsx`)
- Types/Constants: pascalCase or camelCase in file names with `.ts` extension (e.g., `types.ts`)
- API routes: kebab-case with `route.ts` suffix (e.g., `send-welcome/route.ts`, `create-checkout-session/route.ts`)

**Functions:**
- Regular functions: camelCase (e.g., `formatFileSize`, `generateSessionKeys`, `dhRatchetStep`)
- React components (default exports): PascalCase (e.g., `function Home()`, `export function TransferCard()`)
- Helper/utility functions: camelCase (e.g., `formatSpeed`, `formatTime`, `getPlatformIcon`)
- Async functions: camelCase with async prefix (e.g., `async generateSessionKeys()`, `async loadTranslations()`)
- Private methods: camelCase with underscore prefix (e.g., `private cleanupExpiredKeys()`, `private skipMessageKeys()`)

**Variables:**
- Local variables: camelCase (e.g., `isActive`, `isPaused`, `transfer`, `sessionKey`)
- Constants: UPPER_SNAKE_CASE for module-level constants (e.g., `KEY_LIFETIME_MS`, `MAX_MESSAGES_PER_KEY`, `MAX_SKIP`)
- State variables: camelCase (e.g., `const [files, setFiles]`, `const [isDragging, setIsDragging]`)
- Event handler variables: `on` prefix followed by camelCase (e.g., `onPause`, `onResume`, `onCancel`)
- Refs: use `Ref` suffix (e.g., `inputRef`, `canvasRef`)

**Types:**
- Interfaces: PascalCase (e.g., `Device`, `Transfer`, `SessionKeyPair`, `RatchetState`)
- Type aliases: PascalCase (e.g., `TransferEvent`, `LanguageCode`)
- Generic type parameters: single UPPERCASE letter or descriptive PascalCase (e.g., `<T>`, `<HybridKeyPair>`)

**CSS/Tailwind Classes:**
- Use kebab-case for custom class names (e.g., `.card-feature`, `.section-dark`, `.animate-fade-up`)
- Tailwind utility classes: use standard Tailwind format (e.g., `text-muted-foreground`, `bg-primary`, `rounded-xl`)
- Data attributes for component slots: `data-slot="button"`, `data-variant="default"`

## Code Style

**Formatting:**
- ESLint 9 configured via `eslint-config-next` (NextJS core web vitals and TypeScript rules)
- Uses `defineConfig` from eslint/config
- Prettier formatting available but not explicitly configured in codebase
- 2-space indentation inferred from most source files
- Trailing semicolons are used consistently

**Linting:**
- ESLint configuration in `eslint.config.mjs` extends NextJS rules for React and TypeScript
- Core rules from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Directories ignored: `.next/`, `out/`, `build/`, `next-env.d.ts`
- No custom ESLint rules beyond NextJS defaults observed

**Client Components:**
- Use `'use client'` directive at top of file for client-side components (e.g., pages, context providers, interactive components)
- Server components are default (no directive needed)
- All event handlers, state management, and browser APIs require `'use client'`

**Imports:**
- Path aliases configured: `@/*` maps to root directory per `tsconfig.json`
- Group imports: external packages first, then path aliases (`@/`), then relative imports
- Use destructuring for named imports (e.g., `import { Button } from '@/components/ui/button'`)
- Default imports for hooks and context providers (e.g., `import { Providers }`)
- Dynamic imports for code splitting: `const mod = await import(...)` (used in language loader)

## TypeScript Usage

**Strict Mode:**
- `strict: true` in `tsconfig.json` enforces:
  - No implicit any types
  - Strict null checking
  - Strict function parameter types
- `noEmit: true` - compilation is for type checking only, transpilation handled by Next.js

**Type Annotations:**
- Props interfaces: always defined (e.g., `interface TransferCardProps { ... }`)
- Component parameters explicitly typed: `export function Button({ className, variant, size }: React.ComponentProps<"button"> & VariantProps<...>)`
- Function return types specified for public APIs (e.g., `async generateSessionKeys(...): Promise<SessionKeyPair>`)
- Generic types used with async operations (e.g., `Promise<SessionKeyPair>`)
- Record types for key-value mappings (e.g., `Record<LanguageCode, Record<string, string>>`)

**Type Definitions:**
- Core types in `lib/types.ts`: Device, FileInfo, Transfer, TransferOptions, Settings, TransferEvent, FriendTransfer, ProtectedFile
- Crypto-specific types in respective modules (e.g., `SessionKeyPair`, `RatchetState` in `key-management.ts`)
- Type unions for state variants (e.g., `status: 'pending' | 'connecting' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled'`)

## Error Handling

**Patterns:**
- Async/await with try-catch for crypto operations (e.g., `try { ... } catch { ... }`)
- Error assertions in tests with `expect(...).rejects.toThrow()`
- Fallback returns on failure (e.g., file operations return null/generic names on decryption failure)
- Silent catches with console.error for non-critical operations (e.g., QR generation fallback, copy-to-clipboard failures)
- Explicit error messages in thrown errors (e.g., `throw new Error('Ratchet state not found for session')`)

**Security-Critical:**
- Crypto module wraps decryption failures: `await expect(crypto.decrypt(...)).rejects.toThrow()`
- Key material wiping on error: `secureDelete()` called in catch blocks
- Input validation before crypto operations (e.g., key size validation in `encapsulate()`)

## Comment Conventions

**JSDoc/TSDoc:**
- Module-level documentation with security impact markers:
  ```typescript
  /**
   * Ephemeral Key Management Module
   *
   * Implements secure key rotation with Double Ratchet protocol
   * for forward secrecy and post-compromise security.
   *
   * SECURITY IMPACT: 10 | PRIVACY IMPACT: 8
   * PRIORITY: CRITICAL
   */
  ```
- Method documentation with markdown descriptions:
  ```typescript
  /**
   * Securely wipe key material from memory
   *
   * Note: JavaScript doesn't guarantee memory clearing, but this helps:
   * 1. Overwrites with random data
   * 2. Overwrites with zeros
   * 3. Marks for garbage collection
   */
  ```
- Inline comments for complex logic sections:
  ```typescript
  // Store: hash(ciphertext) + hash(publicKey) -> sharedSecret
  // This allows decapsulate to recover it if they have the matching secret key
  ```

**Section Comments:**
- Large code blocks organized with section headers:
  ```typescript
  // ============================================================================
  // Per-Session Key Generation
  // ============================================================================
  ```

**When to Comment:**
- Complex algorithms (crypto, ratcheting, key derivation)
- Non-obvious implementation choices (why silent catch for QR, why fallback to generic names)
- Security-sensitive operations and their rationale
- Workarounds and platform-specific code

**When NOT to Comment:**
- Self-explanatory code (variable names are clear)
- Straightforward UI component logic
- Simple getter/setter patterns

## Component Design

**React Patterns:**
- Functional components with hooks (all components are functional)
- Props interfaces defined before component (e.g., `interface TransferCardProps { ... }`)
- Use of `'use client'` for components with state or interactivity
- Hook usage: `useState`, `useCallback`, `useRef`, `useEffect`, `useContext` from React 19
- Conditional rendering with ternary operators and logical AND (`&&`)

**Component Organization:**
- Single responsibility: each component has one clear purpose
- Props are optional with `?` notation (e.g., `onPause?: (id: string) => void`)
- Event handlers follow `on{ActionName}` pattern (e.g., `onPause`, `onResume`)
- Component exports: `export function ComponentName()` or `export default ComponentName`

**shadcn/ui Integration:**
- UI components imported from `@/components/ui/` directory
- CVA (Class Variance Authority) used for component variants:
  ```typescript
  const buttonVariants = cva("base-classes", {
    variants: {
      variant: { default: "...", outline: "...", ghost: "..." },
      size: { default: "...", sm: "...", lg: "...", icon: "..." }
    }
  })
  ```
- Components wrapped with `Slot` from `@radix-ui/react-slot` for polymorphism (`asChild` prop)
- Data attributes for visual testing: `data-slot="button"`, `data-variant="default"`

## Styling & CSS

**Tailwind v4:**
- Configured via `@tailwindcss/postcss` in PostCSS config
- Responsive prefixes for breakpoints: `sm:`, `md:`, `lg:` (e.g., `md:grid-cols-2`, `sm:flex-row`)
- Theme colors: `primary`, `secondary`, `destructive`, `muted`, `background`, `foreground`, etc.
- Utility classes for spacing: `gap-`, `p-`, `px-`, `py-`, `mb-`, `mt-` with values
- Animation classes: `animate-fade-up`, `animate-spin`, `animate-pulse`
- Transition utilities: `transition-all`, `transition-opacity`, `duration-300`

**Custom Styles:**
- Global CSS in `app/globals.css` (imported in root layout)
- Custom animation definitions (e.g., `@keyframes fadeUp` for `animate-fade-up`)
- CSS variables for theme colors and fonts
- Font variables from local fonts: `--font-inter`, `--font-geist-mono`, `--font-cormorant`

**Class Composition:**
- Use `cn()` utility from `lib/utils.ts` to merge Tailwind classes:
  ```typescript
  className={cn(buttonVariants({ variant, size, className }))}
  ```
- `cn()` implemented with `clsx` and `tailwind-merge` to handle class conflicts

**Dark Mode:**
- Managed via `next-themes` provider in `components/providers.tsx`
- Theme classes applied to `<html>` element
- Color schemes: light, dark, system
- No manual dark: prefix needed - themes handle it via provider

## Import Organization

**Order:**
1. React and Next.js imports
2. External library imports (lucide-react, @radix-ui, sonner, etc.)
3. Path alias imports (`@/`)
4. Types imports (when separate from components)

**Example:**
```typescript
import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Send, Shield } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { Transfer } from "@/lib/types';
```

**Barrel Files:**
- Used for UI components (all exported from `components/ui/index`)
- Used for types (all exported from `lib/types.ts`)
- Not used extensively elsewhere; most feature imports are specific

## Security Patterns

**Cryptography:**
- All crypto operations delegated to `lib/crypto/` modules
- Key management via singleton `EphemeralKeyManager`
- Secure memory wiping with multi-pass overwrite (random, zeros, 0xFF)
- Constant-time comparison for authentication (`constantTimeEqual()`)

**Data Privacy:**
- Filename encryption: original names never stored in plaintext
- Chunk integrity: SHA-256 hashes with AEAD (AES-256-GCM)
- PQC hybrid approach: Kyber768 (ML-KEM) + X25519

**Storage:**
- Secure localStorage API usage (via `next-themes` for theme)
- No sensitive data in localStorage
- Language preferences and theme stored, never credentials

## Test Naming Conventions

**Unit Tests:**
- File suffix: `.test.ts` (e.g., `pqc-crypto.test.ts`)
- Test descriptions include requirement IDs (e.g., `CRYPTO-01: Key Generation`)
- Nested describe blocks for test organization: `describe('Suite') { describe('Feature') { it(...) } }`

**E2E Tests:**
- File suffix: `.spec.ts` (e.g., `app.spec.ts`, `landing.spec.ts`)
- Test descriptions use readable English (e.g., `'renders hero section with headline and CTA'`)
- `test.describe()` for test grouping
- `test.beforeEach()` for setup
- Locator-based assertions: `expect(page.locator(...)).toBeVisible()`

---

*Convention analysis: 2026-01-23*
