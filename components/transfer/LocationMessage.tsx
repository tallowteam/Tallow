'use client';

/**
 * LocationMessage Component
 * Display shared location in chat message bubbles
 * Features:
 * - Static map preview
 * - Formatted coordinates
 * - "Open in Maps" link (platform-aware)
 * - Compact design for chat
 */

import {
  formatCoordinates,
  getStaticMapUrl,
  getMapsUrl,
  type GeolocationResult,
} from '@/lib/geo/location-sharing';
import styles from './LocationMessage.module.css';

export interface LocationMessageProps {
  location: GeolocationResult;
  isSent?: boolean;
}

export default function LocationMessage({
  location,
  isSent = false,
}: LocationMessageProps) {
  const { latitude, longitude, accuracy } = location;

  const handleOpenMaps = () => {
    const url = getMapsUrl(latitude, longitude);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`${styles.locationMessage} ${isSent ? styles.sent : styles.received}`}>
      {/* Map Preview */}
      <div className={styles.mapContainer}>
        <img
          src={getStaticMapUrl(latitude, longitude, 15, 280, 160)}
          alt="Shared location"
          className={styles.mapImage}
          loading="lazy"
        />
        <div className={styles.mapOverlay}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
      </div>

      {/* Location Info */}
      <div className={styles.locationInfo}>
        <div className={styles.coordinates}>
          {formatCoordinates(latitude, longitude)}
        </div>
        <div className={styles.accuracy}>
          Accuracy: ±{Math.round(accuracy)}m
        </div>
      </div>

      {/* Actions */}
      <button
        className={styles.openMapsButton}
        onClick={handleOpenMaps}
        type="button"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open in Maps
      </button>
    </div>
  );
}
