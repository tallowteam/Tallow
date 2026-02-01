/**
 * Utility Types for Tallow Application
 *
 * Common TypeScript utility types to improve type safety and reduce boilerplate.
 * These types work with strict mode enabled.
 */

// ============================================
// Basic Utility Types
// ============================================

/**
 * Makes all properties required and non-nullable
 */
export type RequiredNonNullable<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Makes specific properties required
 */
export type RequiredKeys<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

/**
 * Makes all properties optional and nullable
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of a specific type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Safe array access return type (with noUncheckedIndexedAccess)
 */
export type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

// ============================================
// Async/Promise Utility Types
// ============================================

/**
 * Extract the resolved type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Make a function async
 */
export type AsyncReturnType<T extends (...args: any[]) => any> = ReturnType<T> extends Promise<infer U>
  ? U
  : ReturnType<T>;

/**
 * Type-safe error handling result
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async operation state
 */
export type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// ============================================
// React Utility Types
// ============================================

/**
 * Component props with children
 */
export type PropsWithRequiredChildren<P = {}> = P & {
  children: React.ReactNode;
};

/**
 * Extract props from a component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Event handler type
 */
export type EventHandler<T = HTMLElement, E = React.SyntheticEvent<T>> = (event: E) => void;

/**
 * Form field change handler
 */
export type ChangeHandler<T = HTMLInputElement> = (
  event: React.ChangeEvent<T>
) => void;

/**
 * Click handler type
 */
export type ClickHandler<T = HTMLElement> = (
  event: React.MouseEvent<T>
) => void;

/**
 * Keyboard handler type
 */
export type KeyboardHandler<T = HTMLElement> = (
  event: React.KeyboardEvent<T>
) => void;

// ============================================
// Validation & Type Guards
// ============================================

/**
 * Type guard helper
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Maybe type (null or undefined)
 */
export type Maybe<T> = T | null | undefined;

/**
 * Non-empty array
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Ensure at least one property is defined
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

/**
 * Exactly one property is defined
 */
export type ExactlyOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? Required<Pick<T, K>> & Partial<Record<Exclude<keyof T, K>, never>>
  : never;

// ============================================
// API & Data Types
// ============================================

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/**
 * API response wrapper
 */
export type ApiResponse<T> = Result<T, ApiError>;

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Request status
 */
export type RequestStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

// ============================================
// Object Manipulation Types
// ============================================

/**
 * Pick properties that are not functions
 */
export type DataOnly<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
  }[keyof T]
>;

/**
 * Pick properties that are functions
 */
export type MethodsOnly<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
  }[keyof T]
>;

/**
 * Make specific properties readonly
 */
export type ReadonlyKeys<T, K extends keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P];
};

/**
 * Deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Mutable (remove readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// ============================================
// String Manipulation Types
// ============================================

/**
 * String literal union from object keys
 */
export type StringKeys<T> = Extract<keyof T, string>;

/**
 * Camel case to snake case
 */
export type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S;

/**
 * Transform object keys to snake_case
 */
export type SnakeCaseKeys<T> = {
  [K in keyof T as CamelToSnake<StringKeys<T>>]: T[K];
};

// ============================================
// Function Utility Types
// ============================================

/**
 * Extract function parameters
 */
export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * Extract first parameter
 */
export type FirstParameter<T extends (...args: any) => any> = Parameters<T>[0];

/**
 * Make function parameters required
 */
export type RequiredParameters<T extends (...args: any[]) => any> = (
  ...args: RequiredNonNullable<Parameters<T>>
) => ReturnType<T>;

/**
 * Void function type
 */
export type VoidFunction<Args extends any[] = []> = (...args: Args) => void;

/**
 * Async function type
 */
export type AsyncFunction<Args extends any[] = [], R = void> = (
  ...args: Args
) => Promise<R>;

// ============================================
// Conditional Types
// ============================================

/**
 * If true, return T, else return F
 */
export type If<Condition extends boolean, T, F> = Condition extends true
  ? T
  : F;

/**
 * Check if type is any
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Check if type is never
 */
export type IsNever<T> = [T] extends [never] ? true : false;

/**
 * Check if type is unknown
 */
export type IsUnknown<T> = IsNever<T> extends false
  ? T extends unknown
    ? unknown extends T
      ? IsAny<T> extends false
        ? true
        : false
      : false
    : false
  : false;

// ============================================
// Brand Types (Nominal Typing)
// ============================================

/**
 * Create a branded type for nominal typing
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Common branded types
 */
export type UserId = Brand<string, 'UserId'>;
export type DeviceId = Brand<string, 'DeviceId'>;
export type TransferId = Brand<string, 'TransferId'>;
export type Timestamp = Brand<number, 'Timestamp'>;
export type PositiveNumber = Brand<number, 'PositiveNumber'>;
export type Email = Brand<string, 'Email'>;
export type URL = Brand<string, 'URL'>;

// ============================================
// Type Helpers
// ============================================

/**
 * Create a type-safe enum
 */
export const createEnum = <T extends Record<string, string>>(
  obj: T
): Readonly<T> => Object.freeze(obj);

/**
 * Type assertion helper
 */
export function assertType<T>(_value: unknown): asserts _value is T {
  // Runtime validation should be done before calling this
}

/**
 * Exhaustive switch helper
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(
  obj: T
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Type-safe Object.fromEntries
 */
export function typedFromEntries<K extends PropertyKey, V>(
  entries: Iterable<readonly [K, V]>
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>;
}

// ============================================
// Array Utility Types
// ============================================

/**
 * Tuple of specific length
 */
export type Tuple<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;

type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

/**
 * Readonly array
 */
export type ReadonlyArray<T> = readonly T[];

/**
 * Non-empty readonly array
 */
export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]];

// ============================================
// Record Utility Types
// ============================================

/**
 * Partial record (some keys may be missing)
 */
export type PartialRecord<K extends PropertyKey, V> = Partial<Record<K, V>>;

/**
 * Required record
 */
export type RequiredRecord<K extends PropertyKey, V> = Record<K, V>;

/**
 * Record with value constraints
 */
export type ValueRecord<K extends PropertyKey, V> = {
  [P in K]: V;
};

// ============================================
// Export all utility types
// ============================================
// Note: Built-in utility types (Partial, Required, etc.) are globally available
// and don't need to be re-exported
