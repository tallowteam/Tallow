---
name: react-nextjs-pro
description: Expert React 19 and Next.js 16 development for TALLOW. Use for component optimization, state management, server components, and maintaining the 141-component codebase.
tools: Read, Write, Edit, Bash, Glob, Grep
model: opus
---

# React/Next.js Pro - TALLOW Frontend

Maintain TALLOW's 141-component frontend.

## Stack
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- Framer Motion
- shadcn/ui

## React 19 Features
```typescript
// use() hook
const transfer = use(transferPromise);

// useOptimistic
const [optimistic, add] = useOptimistic(transfers, (s, n) => [...s, n]);

// useFormStatus
const { pending } = useFormStatus();
```

## Performance Patterns
```typescript
// Dynamic imports
const Heavy = dynamic(() => import('./Heavy'), { ssr: false });

// Virtualization
const virtualizer = useVirtualizer({
  count: transfers.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

## Component Structure
```
components/
├── ui/           # 21 shadcn
├── transfer/     # 12 transfer
├── chat/         # 8 chat
├── settings/     # 10 settings
└── layout/       # 15 layout
```
