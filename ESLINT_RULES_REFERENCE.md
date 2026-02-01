# ESLint Rules Quick Reference

## TypeScript Rules

### Critical (Errors)

| Rule | What it catches | Example |
|------|----------------|---------|
| `no-explicit-any` | Using `any` type | ❌ `function test(data: any)` → ✅ `function test(data: UserData)` |
| `no-unsafe-assignment` | Unsafe type assignments | ❌ `const x = obj as any` → ✅ `const x = isUser(obj) ? obj : null` |
| `no-unsafe-member-access` | Accessing members of `any` | ❌ `anyVar.prop` → ✅ Properly typed access |
| `no-floating-promises` | Unhandled promises | ❌ `fetchData()` → ✅ `await fetchData()` |
| `no-non-null-assertion` | Using `!` operator | ❌ `user!.name` → ✅ `user?.name` |

### Important (Warnings)

| Rule | What it catches | Example |
|------|----------------|---------|
| `explicit-function-return-type` | Missing return types | ❌ `function getData()` → ✅ `function getData(): Promise<Data>` |
| `no-unnecessary-condition` | Redundant checks | ❌ `if (true && condition)` → ✅ `if (condition)` |

## React Hooks Rules

### Rules of Hooks (Error)

```typescript
// ❌ BAD: Conditional hook
if (condition) {
  useState(0);
}

// ✅ GOOD: Hook at top level
const [value, setValue] = useState(0);
if (condition) {
  setValue(1);
}
```

### Exhaustive Dependencies (Error)

```typescript
// ❌ BAD: Missing dependency
useEffect(() => {
  doSomething(value);
}, []); // 'value' is missing

// ✅ GOOD: All dependencies included
useEffect(() => {
  doSomething(value);
}, [value]);
```

## Accessibility Rules

### Images (Error)

```tsx
// ❌ BAD: No alt text
<img src="photo.jpg" />

// ✅ GOOD: Descriptive alt text
<img src="photo.jpg" alt="User profile photo" />

// ✅ GOOD: Decorative images
<img src="divider.png" alt="" role="presentation" />
```

### Form Labels (Error)

```tsx
// ❌ BAD: No label association
<label>Email</label>
<input type="email" />

// ✅ GOOD: Explicit association
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ GOOD: Implicit association
<label>
  Email
  <input type="email" />
</label>
```

### Keyboard Events (Error)

```tsx
// ❌ BAD: onClick without keyboard support
<div onClick={handleClick}>Click me</div>

// ✅ GOOD: With keyboard support
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  role="button"
  tabIndex={0}
>
  Click me
</div>

// ✅ BETTER: Use semantic HTML
<button onClick={handleClick}>Click me</button>
```

### ARIA Attributes (Error)

```tsx
// ❌ BAD: Invalid ARIA
<div aria-label="Close" aria-pressed="yes">×</div>

// ✅ GOOD: Correct ARIA usage
<button aria-label="Close dialog" aria-pressed={false}>
  ×
</button>
```

### Interactive Elements (Error)

```tsx
// ❌ BAD: Non-interactive element with onClick
<div onClick={handleClick}>Click</div>

// ✅ GOOD: Proper interactive element
<button onClick={handleClick}>Click</button>

// ✅ ACCEPTABLE: With proper ARIA
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click
</div>
```

## Security Rules

### Object Injection (Warning)

```typescript
// ❌ RISKY: User-controlled property access
const value = obj[userInput];

// ✅ SAFER: Validate input first
const allowedKeys = ['name', 'email', 'age'];
const value = allowedKeys.includes(userInput)
  ? obj[userInput as keyof typeof obj]
  : null;
```

### Unsafe Regex (Error)

```typescript
// ❌ BAD: ReDoS vulnerable
const regex = /^(a+)+$/;

// ✅ GOOD: Non-vulnerable pattern
const regex = /^a+$/;
```

### Eval Usage (Error)

```typescript
// ❌ NEVER: Using eval
eval(userCode);

// ✅ GOOD: Use safer alternatives
const func = new Function('return ' + safeExpression)();
// Or better: Parse JSON, use a templating library, etc.
```

### Timing Attacks (Warning)

```typescript
// ❌ RISKY: Direct comparison of secrets
if (userToken === storedToken) { }

// ✅ SAFER: Constant-time comparison
import { timingSafeEqual } from 'crypto';
if (timingSafeEqual(
  Buffer.from(userToken),
  Buffer.from(storedToken)
)) { }
```

## General Best Practices

### Console Statements (Warning)

```typescript
// ❌ Avoid in production
console.log('Debug info');

// ✅ Allowed
console.warn('Warning message');
console.error('Error occurred');
console.info('Info message');
```

### Equality (Error)

```typescript
// ❌ BAD: Loose equality
if (value == null) { }

// ✅ GOOD: Strict equality
if (value === null || value === undefined) { }
if (value == null) { } // This is actually ok for null/undefined check
```

### Const vs Let (Error)

```typescript
// ❌ BAD: Unnecessary let
let name = 'John';

// ✅ GOOD: Use const when not reassigned
const name = 'John';

// ✅ GOOD: Use let when reassigned
let count = 0;
count++;
```

### Curly Braces (Error)

```typescript
// ❌ BAD: Missing braces
if (condition) doSomething();

// ✅ GOOD: Always use braces
if (condition) {
  doSomething();
}
```

## Quick Fixes

### Auto-fix Available

Many rules can be automatically fixed:

```bash
# Fix all auto-fixable issues
npm run lint:fix
```

Rules with auto-fix:
- Prefer const
- Curly braces
- Self-closing components
- Prefer optional chaining
- Prefer nullish coalescing

### Manual Fixes Required

Some rules require manual intervention:
- Adding explicit types
- Handling null/undefined cases
- Adding accessibility attributes
- Refactoring unsafe code patterns

## Common Patterns

### Optional Chaining

```typescript
// ❌ Old way
const name = user && user.profile && user.profile.name;

// ✅ New way
const name = user?.profile?.name;
```

### Nullish Coalescing

```typescript
// ❌ Problematic with 0, '', false
const value = input || 'default';

// ✅ Only null/undefined
const value = input ?? 'default';
```

### Type Guards

```typescript
// ❌ Type assertion
function process(value: unknown) {
  const str = value as string;
  return str.toUpperCase();
}

// ✅ Type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }
  throw new Error('Expected string');
}
```

## IDE Integration

### VS Code

Install extensions:
- ESLint (dbaeumer.vscode-eslint)
- Error Lens (usernamehw.errorlens)

Enable auto-fix on save in settings.json:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### WebStorm

ESLint is built-in. Enable:
1. Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
2. Check "Automatic ESLint configuration"
3. Check "Run eslint --fix on save"

## Disabling Rules

### File-level

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// File contents
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### Line-level

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = legacyFunction();
```

### Block-level

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
const data: any = legacyFunction();
const more: any = anotherLegacy();
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### ⚠️ Use Sparingly

Only disable rules when:
1. Dealing with legacy code (with migration plan)
2. Working with poorly-typed libraries
3. False positives (consider reporting to ESLint)

Always add a comment explaining why:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// TODO: Add proper types once @types/legacy-lib is updated
const data: any = legacyLib.getData();
```

---

**Quick Help:**
- Run `npm run lint` to check all files
- Run `npm run lint:fix` to auto-fix issues
- Run `npm run type-check` to verify types
- Check `TYPE_SAFETY_GUIDE.md` for detailed examples
