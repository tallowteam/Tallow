'use client';

/**
 * Location Sharing Utilities
 * Privacy-first geolocation for chat messages
 * Features:
 * - Navigator geolocation API integration
 * - Privacy controls (reduce precision to ~1km)
 * - OpenStreetMap static tiles
 * - Haversine distance calculation
 * - Coordinate formatting
 */

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number;
}

export interface LocationSharingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number; // milliseconds
  maximumAge?: number; // milliseconds
  reduceAccuracy?: boolean; // Privacy mode: reduce to ~1km
}

const DEFAULT_OPTIONS: Required<LocationSharingOptions> = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 0, // Don't use cached position
  reduceAccuracy: false,
};

// Precision reduction (privacy mode)
const PRIVACY_PRECISION = 0.01; // ~1.1km at equator

/**
 * Check if geolocation is available in this browser
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Get current location from browser Geolocation API
 * @throws {GeolocationPositionError} if permission denied or unavailable
 */
export async function getCurrentLocation(
  options: LocationSharingOptions = {}
): Promise<GeolocationResult> {
  if (!isGeolocationAvailable()) {
    throw new Error('Geolocation is not supported by this browser');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let { latitude, longitude } = position.coords;
        const { accuracy } = position.coords;

        // Apply privacy reduction if enabled
        if (opts.reduceAccuracy) {
          latitude = Math.round(latitude / PRIVACY_PRECISION) * PRIVACY_PRECISION;
          longitude = Math.round(longitude / PRIVACY_PRECISION) * PRIVACY_PRECISION;
        }

        resolve({
          latitude,
          longitude,
          accuracy: opts.reduceAccuracy ? 1100 : accuracy, // ~1.1km when reduced
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        timeout: opts.timeout,
        maximumAge: opts.maximumAge,
      }
    );
  });
}

/**
 * Format coordinates as human-readable string
 * Example: "40.7128° N, 74.0060° W"
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDirection = lat >= 0 ? 'N' : 'S';
  const lngDirection = lng >= 0 ? 'E' : 'W';

  const absLat = Math.abs(lat).toFixed(4);
  const absLng = Math.abs(lng).toFixed(4);

  return `${absLat}° ${latDirection}, ${absLng}° ${lngDirection}`;
}

/**
 * Get OpenStreetMap static tile URL for location preview
 * Uses staticmap.openstreetmap.de service
 * @param lat Latitude
 * @param lng Longitude
 * @param zoom Zoom level (1-18, default 14)
 * @param width Image width in pixels (default 300)
 * @param height Image height in pixels (default 200)
 */
export function getStaticMapUrl(
  lat: number,
  lng: number,
  zoom: number = 14,
  width: number = 300,
  height: number = 200
): string {
  // OpenStreetMap Static Map API
  // Format: https://staticmap.openstreetmap.de/staticmap.php?center=LAT,LNG&zoom=ZOOM&size=WIDTHxHEIGHT&markers=LAT,LNG,red
  const baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php';
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    markers: `${lat},${lng},red-pushpin`,
    maptype: 'mapnik',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  a: GeolocationResult,
  b: GeolocationResult
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;

  const aVal =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 * Automatically switches between meters and kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get platform-specific maps URL (Google Maps on Android/web, Apple Maps on iOS)
 */
export function getMapsUrl(lat: number, lng: number): string {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // Apple Maps
    return `maps://maps.apple.com/?q=${lat},${lng}`;
  }

  // Google Maps (works on Android and web)
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Get geolocation permission state
 * Returns 'granted', 'denied', 'prompt', or 'unsupported'
 */
export async function getLocationPermissionState(): Promise<
  'granted' | 'denied' | 'prompt' | 'unsupported'
> {
  if (!('permissions' in navigator)) {
    return 'unsupported';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    // Permissions API not fully supported
    return 'unsupported';
  }
}

/**
 * Parse GeolocationPositionError for user-friendly messages
 */
export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please enable location permissions.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable. Please check your device settings.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'Failed to get location. Please try again.';
  }
}
