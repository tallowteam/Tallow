/**
 * Open Graph Image Generation
 *
 * Generates dynamic OG images using Next.js ImageResponse.
 * Creates branded images for social sharing.
 */

import { ImageResponse } from 'next/og';
import { SEO } from '@/lib/seo/constants';

export const runtime = 'edge';
export const alt = SEO.images.og.alt;
export const size = {
  width: SEO.images.og.width,
  height: SEO.images.og.height,
};
export const contentType = 'image/png';

/**
 * Generate Open Graph image
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #fff 0%, #e5e5e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 'bold',
              color: '#000',
            }}
          >
            T
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            marginBottom: 20,
            maxWidth: 1000,
            lineHeight: 1.1,
          }}
        >
          Secure File Transfers
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 42,
            color: '#a0a0a0',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.3,
          }}
        >
          Post-quantum encryption. Zero knowledge. No cloud storage.
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 40,
            padding: '12px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              fill="#fff"
              fillOpacity="0.9"
            />
          </svg>
          <span
            style={{
              fontSize: 28,
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Quantum-Safe
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
