'use client';

/**
 * useAsyncResource Hook
 * React 19 use() hook wrapper for data fetching with Suspense
 */

import { use, cache } from 'react';

export type ResourceStatus = 'pending' | 'fulfilled' | 'rejected';

export interface AsyncResource<T> {
  read: () => T;
  status: ResourceStatus;
  value?: T;
  error?: Error;
}

/**
 * Create a suspense-compatible resource from a promise
 */
export function createResource<T>(promise: Promise<T>): AsyncResource<T> {
  let status: ResourceStatus = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (value) => {
      status = 'fulfilled';
      result = value;
    },
    (err) => {
      status = 'rejected';
      error = err;
    }
  );

  return {
    read() {
      if (status === 'pending') {
        throw suspender; // Suspense will catch this
      } else if (status === 'rejected') {
        throw error;
      }
      return result;
    },
    get status() {
      return status;
    },
    get value() {
      return result;
    },
    get error() {
      return error;
    },
  };
}

/**
 * Hook for async data fetching with React 19 use() hook
 */
export function useAsyncResource<T>(fetcher: () => Promise<T>): T {
  const resource = use(fetcher());
  return resource;
}

/**
 * Create a cached resource fetcher
 * Uses React's cache() for automatic deduplication
 */
export function createCachedResource<TArgs extends unknown[], TReturn>(
  fetcher: (...args: TArgs) => Promise<TReturn>
) {
  const cachedFetcher = cache(fetcher);

  return function useCachedResource(...args: TArgs): TReturn {
    return use(cachedFetcher(...args));
  };
}

/**
 * Example usage:
 *
 * // In a server component or async function
 * const getDevices = createCachedResource(async (userId: string) => {
 *   const response = await fetch(`/api/devices?userId=${userId}`);
 *   return response.json();
 * });
 *
 * // In a client component with Suspense
 * function DeviceList({ userId }: { userId: string }) {
 *   const devices = getDevices(userId);
 *   return <div>{devices.map(device => <DeviceCard key={device.id} device={device} />)}</div>;
 * }
 *
 * // Parent component
 * <Suspense fallback={<Skeleton />}>
 *   <DeviceList userId="123" />
 * </Suspense>
 */

export default useAsyncResource;
