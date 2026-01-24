import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tallow - Secure File Transfer',
        short_name: 'Tallow',
        description: 'End-to-end encrypted P2P file sharing with post-quantum cryptography',
        start_url: '/app',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        orientation: 'any',
        categories: ['utilities', 'productivity'],
        icons: [
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        share_target: {
            action: '/app',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
                title: 'title',
                text: 'text',
                url: 'url',
                files: [
                    {
                        name: 'files',
                        accept: ['*/*'],
                    },
                ],
            },
        },
    };
}
