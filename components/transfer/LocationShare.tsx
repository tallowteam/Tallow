'use client';

/**
 * LocationShare Component
 * UI for sharing location in chat with privacy controls
 * Features:
 * - Permission request flow
 * - Privacy toggle (approximate vs exact location)
 * - Map preview before sharing
 * - Loading states and error handling
 */

import { useState, useCallback } from 'react';
import {
  getCurrentLocation,
  isGeolocationAvailable,
  getLocationPermissionState,
  getGeolocationErrorMessage,
  formatCoordinates,
  getStaticMapUrl,
  type GeolocationResult,
} from '@/lib/geo/location-sharing';
import styles from './LocationShare.module.css';

export interface LocationShareProps {
  onShare: (location: GeolocationResult) => void;
  onCancel: () => void;
  isOpen: boolean;
}

type LocationShareState =
  | { status: 'initial' }
  | { status: 'requesting-permission' }
  | { status: 'loading' }
  | { status: 'preview'; location: GeolocationResult }
  | { status: 'error'; message: string };

export default function LocationShare({
  onShare,
  onCancel,
  isOpen,
}: LocationShareProps) {
  const [state, setState] = useState<LocationShareState>({ status: 'initial' });
  const [useApproximateLocation, setUseApproximateLocation] = useState(true);

  const handleRequestLocation = useCallback(async () => {
    if (!isGeolocationAvailable()) {
      setState({
        status: 'error',
        message: 'Location sharing is not supported by your browser',
      });
      return;
    }

    // Check permission state first
    const permissionState = await getLocationPermissionState();
    if (permissionState === 'denied') {
      setState({
        status: 'error',
        message: 'Location access denied. Please enable location permissions in your browser settings.',
      });
      return;
    }

    setState({ status: 'loading' });

    try {
      const location = await getCurrentLocation({
        enableHighAccuracy: !useApproximateLocation,
        timeout: 15000, // 15 seconds for GPS fix
        reduceAccuracy: useApproximateLocation,
      });

      setState({ status: 'preview', location });
    } catch (error) {
      const errorMessage =
        error instanceof GeolocationPositionError
          ? getGeolocationErrorMessage(error)
          : 'Failed to get location. Please try again.';

      setState({ status: 'error', message: errorMessage });
    }
  }, [useApproximateLocation]);

  const handleShare = useCallback(() => {
    if (state.status === 'preview') {
      onShare(state.location);
      setState({ status: 'initial' });
    }
  }, [state, onShare]);

  const handleCancel = useCallback(() => {
    setState({ status: 'initial' });
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    setState({ status: 'initial' });
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>Share Location</h3>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {state.status === 'initial' && (
            <>
              <div className={styles.infoSection}>
                <div className={styles.iconWrapper}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <p className={styles.description}>
                  Share your current location with the recipient. Your location
                  will be encrypted end-to-end.
                </p>
              </div>

              {/* Privacy Toggle */}
              <div className={styles.privacySection}>
                <label className={styles.privacyToggle}>
                  <input
                    type="checkbox"
                    checked={useApproximateLocation}
                    onChange={(e) => setUseApproximateLocation(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <div className={styles.toggleTrack}>
                    <div className={styles.toggleThumb} />
                  </div>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>
                      Share approximate location
                    </span>
                    <span className={styles.toggleSubtitle}>
                      Reduces accuracy to ~1km for privacy
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.shareButton}
                  onClick={handleRequestLocation}
                  type="button"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Get Location
                </button>
              </div>
            </>
          )}

          {state.status === 'loading' && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Getting your location...</p>
              <span className={styles.loadingSubtext}>
                This may take a few seconds
              </span>
            </div>
          )}

          {state.status === 'preview' && (
            <>
              {/* Map Preview */}
              <div className={styles.mapPreview}>
                <img
                  src={getStaticMapUrl(
                    state.location.latitude,
                    state.location.longitude,
                    14,
                    600,
                    300
                  )}
                  alt="Location preview"
                  className={styles.mapImage}
                />
              </div>

              {/* Coordinates */}
              <div className={styles.coordinatesSection}>
                <div className={styles.coordinatesLabel}>Coordinates</div>
                <div className={styles.coordinatesValue}>
                  {formatCoordinates(
                    state.location.latitude,
                    state.location.longitude
                  )}
                </div>
                <div className={styles.accuracyBadge}>
                  Accuracy: ±{Math.round(state.location.accuracy)}m
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.shareButton}
                  onClick={handleShare}
                  type="button"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Share Location
                </button>
              </div>
            </>
          )}

          {state.status === 'error' && (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className={styles.errorMessage}>{state.message}</p>
              <div className={styles.actions}>
                <button
                  className={styles.cancelButton}
                  onClick={handleCancel}
                  type="button"
                >
                  Close
                </button>
                <button
                  className={styles.retryButton}
                  onClick={handleRetry}
                  type="button"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
