# Type Safety Quick Reference

## Common Type Guards

### Basic Type Checking
```typescript
import { isString, isNumber, isObject, isArray } from '@/lib/types/type-guards';

// String validation
if (isString(value)) {
  console.log(value.toUpperCase()); // ✅ Type-safe
}

// Number validation
if (isNumber(value)) {
  console.log(value.toFixed(2)); // ✅ Type-safe
}

// Object validation
if (isObject(value)) {
  console.log(Object.keys(value)); // ✅ Type-safe
}

// Array validation
if (isArray(value)) {
  console.log(value.map(x => x)); // ✅ Type-safe
}
```

### Property Checking
```typescript
import { hasProperty, hasTypedProperty } from '@/lib/types/type-guards';

// Check if property exists
if (hasProperty(obj, 'name')) {
  console.log(obj.name); // ✅ Type-safe
}

// Check if property exists with specific type
if (hasTypedProperty(obj, 'age', isNumber)) {
  console.log(obj.age.toFixed()); // ✅ Type-safe
}
```

### Array Element Validation
```typescript
import { isArrayOf } from '@/lib/types/type-guards';

// Validate array of strings
if (isArrayOf(value, isString)) {
  value.forEach(str => console.log(str.toUpperCase())); // ✅ Type-safe
}

// Validate array of numbers
if (isArrayOf(value, isNumber)) {
  const sum = value.reduce((a, b) => a + b, 0); // ✅ Type-safe
}
```

## Message Type Validation

### WebRTC Messages
```typescript
import { isInternalMessage, isFileMeta } from '@/lib/types/messaging-types';

// Validate data channel message
channel.onmessage = (event) => {
  const data: unknown = JSON.parse(event.data);

  if (!isInternalMessage(data)) {
    console.warn('Invalid message');
    return;
  }

  switch (data.type) {
    case 'file-meta':
      console.log(data.meta.name); // ✅ Type-safe
      break;
    case 'complete':
      console.log(data.fileId); // ✅ Type-safe
      break;
    case 'error':
      console.log(data.message); // ✅ Type-safe
      break;
  }
};
```

### Signaling Messages
```typescript
import {
  isGroupAnswerMessage,
  isGroupICECandidateMessage
} from '@/lib/types/messaging-types';

// Validate signaling message
socket.on('group-answer', (data: unknown) => {
  if (!isGroupAnswerMessage(data)) {
    console.warn('Invalid answer message');
    return;
  }

  console.log(data.groupId); // ✅ Type-safe
  console.log(data.from); // ✅ Type-safe
  console.log(data.answer); // ✅ Type-safe
});
```

### Chat Messages
```typescript
import { isChatEvent } from '@/lib/types/messaging-types';

// Validate chat event
manager.on('chat-event', (event: unknown) => {
  if (!isChatEvent(event)) {
    console.warn('Invalid chat event');
    return;
  }

  if (event.type === 'message' && event.message) {
    console.log(event.message.content); // ✅ Type-safe
  }
});
```

## File Transfer Types

### Resumable Transfer Metadata
```typescript
import {
  isResumableFileMetadata,
  isChunkPayload
} from '@/lib/types/messaging-types';

// Validate file metadata
function handleMetadata(data: unknown): void {
  if (!isResumableFileMetadata(data)) {
    throw new Error('Invalid metadata');
  }

  console.log(data.originalName); // ✅ Type-safe
  console.log(data.originalSize); // ✅ Type-safe
  console.log(data.fileHash); // ✅ Type-safe (number[])
}

// Validate chunk payload
function handleChunk(data: unknown): void {
  if (!isChunkPayload(data)) {
    throw new Error('Invalid chunk');
  }

  console.log(data.index); // ✅ Type-safe
  console.log(data.data); // ✅ Type-safe (number[])
  console.log(data.nonce); // ✅ Type-safe (number[])
}
```

## Error Handling

### Type-Safe Error Handling
```typescript
import { toAppError } from '@/lib/utils/error-handling';

// Always use unknown for catch blocks
try {
  await someOperation();
} catch (error: unknown) {
  const appError = toAppError(error, {
    operation: 'some-operation',
    component: 'MyComponent',
  });

  console.error(appError.message); // ✅ Type-safe
  console.error(appError.code); // ✅ Type-safe
}
```

## Storage Validation

### LocalStorage Deserialization
```typescript
// Define stored format
interface StoredData {
  id: string;
  name: string;
  timestamp: string;
}

// Create type guard
function isStoredData(value: unknown): value is StoredData {
  return (
    isObject(value) &&
    hasProperty(value, 'id') && isString(value.id) &&
    hasProperty(value, 'name') && isString(value.name) &&
    hasProperty(value, 'timestamp') && isString(value.timestamp)
  );
}

// Use type guard
function loadData(): MyData | null {
  const stored = localStorage.getItem('my-data');
  if (!stored) return null;

  const parsed: unknown = JSON.parse(stored);
  if (!isStoredData(parsed)) {
    console.warn('Invalid stored data');
    return null;
  }

  // Transform to runtime type
  return {
    id: parsed.id,
    name: parsed.name,
    timestamp: new Date(parsed.timestamp),
  };
}
```

## Creating Custom Type Guards

### Basic Pattern
```typescript
import { isObject, hasProperty, isString, isNumber } from '@/lib/types/type-guards';

// 1. Define your interface
interface User {
  id: string;
  name: string;
  age: number;
  email?: string;
}

// 2. Create type guard
function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    hasProperty(value, 'id') && isString(value.id) &&
    hasProperty(value, 'name') && isString(value.name) &&
    hasProperty(value, 'age') && isNumber(value.age)
    // Optional properties don't need to be checked
  );
}

// 3. Use type guard
function processUser(data: unknown): void {
  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }

  console.log(data.name); // ✅ Type-safe
  console.log(data.email?.toLowerCase()); // ✅ Type-safe with optional chaining
}
```

### Discriminated Union Pattern
```typescript
// 1. Define discriminated union
type Action =
  | { type: 'add'; item: string }
  | { type: 'remove'; id: number }
  | { type: 'clear' };

// 2. Create type guard
function isAction(value: unknown): value is Action {
  if (!isObject(value) || !hasProperty(value, 'type') || !isString(value.type)) {
    return false;
  }

  const type = value.type;

  if (type === 'add') {
    return hasProperty(value, 'item') && isString(value.item);
  }

  if (type === 'remove') {
    return hasProperty(value, 'id') && isNumber(value.id);
  }

  if (type === 'clear') {
    return true;
  }

  return false;
}

// 3. Use with exhaustive switch
function handleAction(action: unknown): void {
  if (!isAction(action)) {
    throw new Error('Invalid action');
  }

  switch (action.type) {
    case 'add':
      console.log('Adding:', action.item); // ✅ Type-safe
      break;
    case 'remove':
      console.log('Removing:', action.id); // ✅ Type-safe
      break;
    case 'clear':
      console.log('Clearing'); // ✅ Type-safe
      break;
  }
}
```

## Best Practices

### 1. Never Use `any`
```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good
function process(data: unknown) {
  if (isObject(data) && hasProperty(data, 'value')) {
    return data.value;
  }
  throw new Error('Invalid data format');
}
```

### 2. Validate All External Data
```typescript
// ❌ Bad
const response = await fetch('/api/data');
const data = await response.json(); // any
processData(data);

// ✅ Good
const response = await fetch('/api/data');
const data: unknown = await response.json();

if (!isValidData(data)) {
  throw new Error('Invalid API response');
}

processData(data); // Type-safe
```

### 3. Use Discriminated Unions for State
```typescript
// ❌ Bad
interface State {
  status: string;
  data?: any;
  error?: any;
}

// ✅ Good
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Data }
  | { status: 'error'; error: Error };

function render(state: State) {
  switch (state.status) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data.value; // ✅ Type-safe
    case 'error':
      return state.error.message; // ✅ Type-safe
  }
}
```

### 4. Add Explicit Return Types
```typescript
// ❌ Bad
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// ✅ Good
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Invalid user data');
  }

  return data;
}
```

### 5. Use Type Guards in Callbacks
```typescript
// ✅ Good pattern for event handlers
socket.on('message', (data: unknown) => {
  if (!isValidMessage(data)) {
    console.warn('Invalid message received');
    return;
  }

  handleMessage(data); // Type-safe
});

dataChannel.onmessage = (event) => {
  const data: unknown = JSON.parse(event.data);

  if (!isInternalMessage(data)) {
    console.warn('Invalid data channel message');
    return;
  }

  handleInternalMessage(data); // Type-safe
};
```

## Common Patterns Cheat Sheet

```typescript
// ✅ Check if value is defined
if (isDefined(value)) {
  // value is not null or undefined
}

// ✅ Optional property validation
if (isOptional(value.prop, isString)) {
  // value.prop is string | undefined
}

// ✅ Array element validation
if (isArrayOf(arr, isNumber)) {
  const sum = arr.reduce((a, b) => a + b, 0);
}

// ✅ Union type guard
const isStringOrNumber = createUnionGuard(isString, isNumber);
if (isStringOrNumber(value)) {
  // value is string | number
}

// ✅ Safe casting
const user = safeCast(data, isUser);
if (user) {
  // user is User
}

// ✅ Strict casting (throws)
const user = strictCast(data, isUser, 'Expected User object');
// user is User (or throws)

// ✅ Type assertion
assertType(data, isUser, 'Expected User object');
// data is now User (or throws)
```

## VS Code Integration

Add this to `.vscode/settings.json` for better type checking:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.noImplicitAny": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Resources

- **Type Guards:** `lib/types/type-guards.ts`
- **Messaging Types:** `lib/types/messaging-types.ts`
- **Error Handling:** `lib/utils/error-handling.ts`
- **Full Documentation:** `TYPE_SAFETY_COMPLETE_FIXES.md`
- **Implementation Summary:** `TYPE_SAFETY_IMPLEMENTATION_SUMMARY.md`
