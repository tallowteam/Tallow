/**
 * Type Guards Library
 * Runtime type validation for TypeScript strict mode
 *
 * @module types/type-guards
 */

/**
 * Type guard for string values
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for number values (excluding NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard for boolean values
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for object values (excludes null and arrays)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for arrays
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for arrays with element type checking
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * Type guard for non-null values
 */
export function isNonNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Type guard for non-undefined values
 */
export function isNonUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Type guard for defined values (non-null and non-undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for valid dates
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Type guard for objects with specific property
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Type guard for objects with specific typed property
 */
export function hasTypedProperty<K extends string, T>(
  obj: unknown,
  key: K,
  guard: (value: unknown) => value is T
): obj is Record<K, T> {
  return hasProperty(obj, key) && guard(obj[key]);
}

/**
 * Type guard for Error objects
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for functions
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard for Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    isObject(value) &&
    isFunction((value as Record<string, unknown>)['then']) &&
    isFunction((value as Record<string, unknown>)['catch'])
  );
}

/**
 * Type guard for ArrayBuffer
 */
export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * Type guard for Uint8Array
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

/**
 * Type guard for Blob
 */
export function isBlob(value: unknown): value is Blob {
  return value instanceof Blob;
}

/**
 * Type guard for File
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Create a type guard for union types
 */
export function createUnionGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return guards.some(guard => guard(value));
  };
}

/**
 * Create a type guard for intersection types
 */
export function createIntersectionGuard<T>(
  ...guards: Array<(value: unknown) => value is T>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    return guards.every(guard => guard(value));
  };
}

/**
 * Type guard for optional values (value or undefined)
 */
export function isOptional<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | undefined {
  return value === undefined || guard(value);
}

/**
 * Type guard for nullable values (value or null)
 */
export function isNullable<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | null {
  return value === null || guard(value);
}

/**
 * Type guard for maybe values (value, null, or undefined)
 */
export function isMaybe<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): value is T | null | undefined {
  return value === null || value === undefined || guard(value);
}

/**
 * Assert that a value matches a type guard
 * Throws if validation fails
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(errorMessage || 'Type assertion failed');
  }
}

/**
 * Validate and cast a value to a specific type
 * Returns null if validation fails
 */
export function safeCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): T | null {
  return guard(value) ? value : null;
}

/**
 * Validate and cast a value to a specific type
 * Throws if validation fails
 */
export function strictCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (!guard(value)) {
    throw new TypeError(errorMessage || 'Type cast failed');
  }
  return value;
}
