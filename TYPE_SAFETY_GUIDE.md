# TypeScript Strict Mode & ESLint Configuration Guide

## Overview

This document outlines the comprehensive type safety improvements implemented in the Tallow application, including TypeScript strict mode configuration and ESLint rules for code quality, accessibility, and security.

## TypeScript Strict Mode Configuration

### Enabled Strict Checks

The following strict mode options are now enabled in `tsconfig.json`:

#### Core Strict Flags
- **`strict: true`** - Enables all strict type-checking options
- **`strictNullChecks: true`** - Enforces strict null checking
- **`noImplicitAny: true`** - Raises error on expressions with implied 'any' type
- **`strictFunctionTypes: true`** - Enables strict checking of function types
- **`strictBindCallApply: true`** - Enables strict bind, call, and apply methods
- **`strictPropertyInitialization: true`** - Ensures class properties are initialized
- **`noImplicitThis: true`** - Raises error on 'this' with implied 'any' type
- **`alwaysStrict: true`** - Parse in strict mode and emit "use strict"

#### Additional Safety Checks
- **`noUncheckedIndexedAccess: true`** - Adds undefined to index signature results
- **`exactOptionalPropertyTypes: true`** - Differentiates between undefined and missing properties
- **`noImplicitReturns: true`** - Ensures all code paths return a value
- **`noFallthroughCasesInSwitch: true`** - Prevents fallthrough in switch statements
- **`noUnusedLocals: true`** - Reports errors on unused local variables
- **`noUnusedParameters: true`** - Reports errors on unused parameters
- **`noPropertyAccessFromIndexSignature: true`** - Requires explicit types for index signatures
- **`allowUnusedLabels: false`** - Disallows unused labels
- **`allowUnreachableCode: false`** - Disallows unreachable code

### Migration Strategy

#### Phase 1: Identify Type Errors (Current)
Run the type checker to identify all errors:
```bash
npm run type-check
```

#### Phase 2: Fix Critical Type Errors
Priority order for fixes:
1. `any` types in public APIs
2. Null/undefined handling
3. Function return types
4. Type assertions that should be type guards

#### Phase 3: Gradual Enhancement
- Add explicit return types to functions
- Replace `any` with proper types or `unknown`
- Add proper null checks
- Use type guards instead of assertions

## ESLint Configuration

### Installed Plugins

1. **@typescript-eslint/eslint-plugin** - TypeScript-specific linting rules
2. **eslint-plugin-react-hooks** - React Hooks linting (Critical for React 19)
3. **eslint-plugin-jsx-a11y** - Accessibility linting (WCAG compliance)
4. **eslint-plugin-security** - Security vulnerability detection

### Rule Categories

#### 1. TypeScript Strict Mode Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `@typescript-eslint/no-explicit-any` | error | Disallow usage of the any type |
| `@typescript-eslint/no-unsafe-assignment` | error | Disallow unsafe assignments |
| `@typescript-eslint/no-unsafe-member-access` | error | Disallow unsafe member access |
| `@typescript-eslint/no-unsafe-call` | error | Disallow unsafe function calls |
| `@typescript-eslint/explicit-function-return-type` | warn | Require explicit return types |
| `@typescript-eslint/strict-boolean-expressions` | error | Enforce strict boolean checks |
| `@typescript-eslint/no-floating-promises` | error | Require promise handling |
| `@typescript-eslint/no-non-null-assertion` | error | Disallow non-null assertions |

#### 2. React Hooks Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `react-hooks/rules-of-hooks` | error | Enforce Rules of Hooks |
| `react-hooks/exhaustive-deps` | error | Verify dependency arrays |

#### 3. Accessibility Rules (WCAG Compliance)

All jsx-a11y rules are enabled to ensure WCAG 2.1 Level AA compliance:

- Alt text for images
- ARIA attributes validation
- Keyboard accessibility
- Label associations
- Interactive element focus management
- Role validations
- Semantic HTML usage

#### 4. Security Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `security/detect-unsafe-regex` | error | Detect potentially unsafe regex |
| `security/detect-eval-with-expression` | error | Detect eval() usage |
| `security/detect-object-injection` | warn | Detect object injection |
| `security/detect-possible-timing-attacks` | warn | Detect timing attack vulnerabilities |

### Running Linting

```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Run type checking
npm run type-check

# Run both type checking and linting
npm run quality
```

## Pre-commit Hooks

### Husky Configuration

Pre-commit hooks automatically run before each commit to ensure code quality:

1. **lint-staged** - Runs ESLint on staged files only
2. **Type checking** - Validates TypeScript types (on pre-push)

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (use sparingly)
git commit --no-verify -m "your message"
```

## Common Type Errors & Fixes

### 1. Implicit Any

**Error:**
```typescript
function processData(data) { // Error: Parameter 'data' implicitly has an 'any' type
  return data.value;
}
```

**Fix:**
```typescript
interface Data {
  value: string;
}

function processData(data: Data): string {
  return data.value;
}
```

### 2. Null/Undefined Handling

**Error:**
```typescript
function getName(user: User) {
  return user.name.toUpperCase(); // Error: 'name' is possibly undefined
}
```

**Fix:**
```typescript
function getName(user: User): string | undefined {
  return user.name?.toUpperCase();
}

// Or with null check
function getName(user: User): string {
  if (!user.name) {
    throw new Error('User name is required');
  }
  return user.name.toUpperCase();
}
```

### 3. Array Index Access

**Error:**
```typescript
const items = ['a', 'b', 'c'];
const first = items[0]; // Type: string | undefined (with noUncheckedIndexedAccess)
first.toUpperCase(); // Error: 'first' is possibly undefined
```

**Fix:**
```typescript
const items = ['a', 'b', 'c'];
const first = items[0];
if (first !== undefined) {
  first.toUpperCase(); // OK
}

// Or use optional chaining
const upper = items[0]?.toUpperCase();
```

### 4. Async/Promise Handling

**Error:**
```typescript
async function loadData() {
  fetchData(); // Error: Promise returned is not being handled
}
```

**Fix:**
```typescript
async function loadData(): Promise<void> {
  await fetchData();
  // Or if fire-and-forget is intentional:
  void fetchData();
}
```

### 5. Type Assertions vs Type Guards

**Bad:**
```typescript
function processValue(value: unknown) {
  return (value as string).toUpperCase();
}
```

**Good:**
```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }
  throw new Error('Value must be a string');
}
```

## React-Specific Type Safety

### 1. Component Props

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  // Implementation
}
```

### 2. Event Handlers

```typescript
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
  // Handle click
}

function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
  const value = event.target.value;
  // Handle change
}
```

### 3. Hooks with TypeScript

```typescript
// useState with explicit type
const [count, setCount] = useState<number>(0);

// useRef with DOM element
const inputRef = useRef<HTMLInputElement>(null);

// useCallback with typed parameters
const handleSubmit = useCallback((data: FormData): void => {
  // Handle submission
}, []);

// Custom hook with return type
function useCustomHook(): { value: string; setValue: (v: string) => void } {
  const [value, setValue] = useState<string>('');
  return { value, setValue };
}
```

## Accessibility Best Practices

### Required Patterns

1. **Alt text for images:**
```tsx
<img src="photo.jpg" alt="Description of the image" />
```

2. **Label associations:**
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

3. **Keyboard navigation:**
```tsx
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</button>
```

4. **ARIA attributes:**
```tsx
<button aria-label="Close dialog" onClick={handleClose}>
  <XIcon />
</button>
```

## Security Best Practices

1. **Avoid eval()** - Never use `eval()` or `new Function()`
2. **Validate user input** - Always validate and sanitize
3. **Use parameterized queries** - Prevent SQL injection
4. **Avoid object injection** - Be careful with bracket notation
5. **Timing-safe comparisons** - Use constant-time comparisons for secrets

## VSCode Integration

Add these settings to `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.strictNullChecks": true
}
```

## Breaking Changes

### Type Safety Improvements

1. **Stricter null checks** - Code may need explicit null/undefined handling
2. **No implicit any** - All parameters and variables need explicit types
3. **Indexed access** - Array/object access now includes undefined in type
4. **Promise handling** - All promises must be awaited or explicitly ignored

### Migration Path

For existing code with errors:

1. **Temporary:** Add `// @ts-expect-error` with explanation
2. **Short-term:** Use type assertions sparingly with `as` keyword
3. **Long-term:** Refactor to proper types and null handling

Example:
```typescript
// Temporary workaround (to be fixed)
// @ts-expect-error - Legacy code, needs refactoring
const value = legacyFunction();

// Better approach
const value = legacyFunction() as ExpectedType;

// Best approach (refactor the function)
function legacyFunction(): ExpectedType {
  // Properly typed implementation
}
```

## Resources

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint TypeScript](https://typescript-eslint.io/)
- [React Accessibility](https://react.dev/learn/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Security](https://owasp.org/www-project-web-security-testing-guide/)

## Support

For questions or issues with type safety:
1. Check this guide first
2. Review TypeScript errors carefully
3. Use type guards instead of assertions
4. Ask for help in code reviews

---

**Last Updated:** 2026-01-25
**TypeScript Version:** 5.9.3
**ESLint Version:** 9.39.2
