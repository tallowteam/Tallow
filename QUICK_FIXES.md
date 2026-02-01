# Quick Fixes for Immediate TypeScript Errors

This guide provides immediate fixes for the current TypeScript errors in the codebase.

## Error 1: VerificationDialog not found (app/app/page.tsx:1817)

**Error:**
```
Cannot find name 'VerificationDialog'
```

**Fix:**
Add missing import at the top of the file:

```typescript
import { VerificationDialog } from '@/components/security/verification-dialog';
```

Or if the component doesn't exist, comment out the usage temporarily:

```typescript
// TODO: Implement VerificationDialog
// {showVerification && <VerificationDialog />}
```

---

## Error 2: ProxyConfig Promise type mismatch (app/app/settings/page.tsx:188)

**Error:**
```
Argument of type 'Promise<ProxyConfig>' is not assignable to parameter of type 'SetStateAction<ProxyConfig>'
```

**Current Code:**
```typescript
setProxyConfig(loadProxyConfig());
```

**Fix:**
Use async/await or handle the promise properly:

```typescript
// Option 1: Use useEffect with async
useEffect(() => {
  const loadConfig = async () => {
    const config = await loadProxyConfig();
    setProxyConfig(config);
  };
  void loadConfig();
}, []);

// Option 2: Use then
useEffect(() => {
  loadProxyConfig().then(setProxyConfig);
}, []);
```

---

## Error 3: Missing lucide-react exports (components/app/MobileGestureSettings.tsx)

**Error:**
```
Module '"lucide-react"' has no exported member 'SwipeRight'
Module '"lucide-react"' has no exported member 'SwipeLeft'
```

**Fix:**
Replace with existing lucide-react icons:

```typescript
// Old (doesn't exist)
import { SwipeRight, SwipeLeft } from 'lucide-react';

// New (use alternatives)
import { ChevronRight, ChevronLeft, Hand } from 'lucide-react';

// Or use generic gesture icon
import { Touchpad, MousePointer2 } from 'lucide-react';
```

---

## Error 4: Motion props type conflict (components/ui/button-animated.tsx:75)

**Error:**
```
Type '{ children: ...; }' is not assignable to type 'Omit<HTMLMotionProps<"button">, "ref">'
Types of property 'onDrag' are incompatible
```

**Fix:**
Explicitly type the motion component props:

```typescript
import { motion, HTMLMotionProps } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'onDrag'> &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'>;

const AnimatedButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  (props, ref) => {
    return <motion.button ref={ref} {...props} />;
  }
);
```

Or remove the conflicting onDrag:

```typescript
const { onDrag, ...restProps } = props;
return <motion.button {...restProps} />;
```

---

## Error 5: Duplicate buttonVariants export (components/ui/index.ts:26)

**Error:**
```
Module './button' has already exported a member named 'buttonVariants'
```

**Fix:**
Check the export in components/ui/index.ts:

```typescript
// Option 1: Only export once
export { Button, buttonVariants } from './button';
// Remove any other buttonVariants exports

// Option 2: Rename one of them
export {
  Button,
  buttonVariants
} from './button';
export {
  buttonVariants as animatedButtonVariants
} from './button-animated';
```

---

## Error 6: Promise type mismatch (components/ui/toast-examples.tsx:221)

**Error:**
```
Argument of type 'Promise<unknown>' is not assignable to parameter of type 'PromiseT<{ name: string; }>'
```

**Fix:**
Add proper type to the promise:

```typescript
// Old
const promise = new Promise((resolve) => {
  setTimeout(() => resolve({ name: 'John' }), 2000);
});

// New
interface UserData {
  name: string;
}

const promise = new Promise<UserData>((resolve) => {
  setTimeout(() => resolve({ name: 'John' }), 2000);
});

toast.promise(promise, {
  loading: 'Loading...',
  success: (data) => `Welcome ${data.name}!`,
  error: 'Error occurred',
});
```

---

## Error 7: Motion component type errors (lib/animations/animated-components.tsx)

**Error:**
Multiple type conflicts with motion.div props

**Fix:**
Create a proper type for animated components:

```typescript
import { HTMLMotionProps, motion } from 'framer-motion';
import { ComponentPropsWithoutRef } from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;
type MotionDivProps = Omit<HTMLMotionProps<'div'>, keyof DivProps> & DivProps;

export const AnimatedDiv: React.FC<MotionDivProps> = (props) => {
  return <motion.div {...props} />;
};

// Use it
<AnimatedDiv
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="container"
>
  Content
</AnimatedDiv>
```

Or use a type assertion for motion props:

```typescript
const motionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
} as const;

<motion.div {...motionProps} className="container">
  Content
</motion.div>
```

---

## Common Patterns to Fix

### Pattern 1: Missing Return Types

**Bad:**
```typescript
function getData() {
  return fetch('/api/data');
}
```

**Good:**
```typescript
async function getData(): Promise<Response> {
  return fetch('/api/data');
}

// Or with parsed data
async function getData(): Promise<DataType> {
  const response = await fetch('/api/data');
  return response.json();
}
```

### Pattern 2: Any Types

**Bad:**
```typescript
function process(data: any) {
  return data.value;
}
```

**Good:**
```typescript
interface Data {
  value: string;
}

function process(data: Data): string {
  return data.value;
}

// Or if truly unknown
function process(data: unknown): string {
  if (isData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}

function isData(value: unknown): value is Data {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof value.value === 'string'
  );
}
```

### Pattern 3: Null/Undefined Handling

**Bad:**
```typescript
function getName(user: User) {
  return user.profile.name.toUpperCase();
}
```

**Good:**
```typescript
function getName(user: User): string | undefined {
  return user.profile?.name?.toUpperCase();
}

// Or with default
function getName(user: User): string {
  return user.profile?.name?.toUpperCase() ?? 'Unknown';
}

// Or with assertion
function getName(user: User): string {
  if (!user.profile?.name) {
    throw new Error('User profile name is required');
  }
  return user.profile.name.toUpperCase();
}
```

### Pattern 4: Array Access

**Bad:**
```typescript
const items = ['a', 'b', 'c'];
const first = items[0];
console.log(first.toUpperCase()); // Error: possibly undefined
```

**Good:**
```typescript
const items = ['a', 'b', 'c'];
const first = items[0];
if (first !== undefined) {
  console.log(first.toUpperCase());
}

// Or use optional chaining
const upper = items[0]?.toUpperCase();

// Or assert non-empty
const items: [string, ...string[]] = ['a', 'b', 'c'];
const first = items[0]; // always defined
console.log(first.toUpperCase());
```

### Pattern 5: Event Handlers

**Bad:**
```typescript
function handleClick(e) {
  e.preventDefault();
}
```

**Good:**
```typescript
function handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
  e.preventDefault();
}

// Or for form submission
function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
  e.preventDefault();
  // Handle form
}

// Or for input change
function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
  setValue(e.target.value);
}
```

---

## Quick Commands

### Check all errors
```bash
npm run type-check
```

### Fix auto-fixable ESLint errors
```bash
npm run lint:fix
```

### Check specific file
```bash
npx tsc --noEmit path/to/file.ts
```

### Check and watch
```bash
npm run type-check:watch
```

---

## Priority Order

Fix errors in this order:

1. **Import errors** (missing imports, wrong paths)
2. **Type definition errors** (interfaces, types)
3. **Promise handling** (async/await, void promises)
4. **Null/undefined** (optional chaining, null checks)
5. **Any types** (replace with proper types)
6. **Return types** (add explicit return types)
7. **Component props** (type all component props)

---

## Testing After Fixes

After each fix:

1. Run type check: `npm run type-check`
2. Run lint: `npm run lint`
3. Test the affected functionality
4. Check related components
5. Run unit tests if available
6. Run E2E tests for critical paths

---

## Getting Help

If stuck on a specific error:

1. Check TYPE_SAFETY_GUIDE.md for detailed examples
2. Check ESLINT_RULES_REFERENCE.md for rule-specific help
3. Search TypeScript playground for similar patterns
4. Check the TypeScript error code (TS####)
5. Ask in code review or team chat

---

## Useful VS Code Shortcuts

- **F12**: Go to definition
- **Shift+F12**: Find all references
- **Ctrl+Space**: Trigger autocomplete
- **Ctrl+.**: Quick fix (show code actions)
- **F8**: Go to next error
- **Shift+F8**: Go to previous error

---

**Last Updated:** 2026-01-25
**Total Known Errors:** ~50
**Critical Errors:** ~7 (listed above)
