import { generateUUID } from './uuid';

// Utility functions for file operations

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

export function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

export function getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const iconMap: Record<string, string> = {
        // Images
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        svg: '🖼️',
        webp: '🖼️',

        // Videos
        mp4: '🎬',
        avi: '🎬',
        mov: '🎬',
        mkv: '🎬',
        webm: '🎬',

        // Audio
        mp3: '🎵',
        wav: '🎵',
        flac: '🎵',
        ogg: '🎵',

        // Documents
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        txt: '📝',
        md: '📝',

        // Archives
        zip: '📦',
        rar: '📦',
        '7z': '📦',
        tar: '📦',
        gz: '📦',

        // Code
        js: '💻',
        ts: '💻',
        py: '💻',
        java: '💻',
        cpp: '💻',
        c: '💻',
        html: '💻',
        css: '💻',
    };

    return iconMap[ext || ''] || '📎';
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export async function createFileChunks(
    file: File,
    chunkSize: number = 1024 * 1024 // 1MB default
): Promise<Blob[]> {
    const chunks: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
        const end = Math.min(offset + chunkSize, file.size);
        chunks.push(file.slice(offset, end));
        offset = end;
    }

    return chunks;
}

export function generateDeviceId(): string {
    // Generate a persistent device ID
    if (typeof window !== 'undefined') {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = generateUUID();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }
    return generateUUID();
}

/**
 * Get platform type using privacy-preserving feature detection
 * Avoids userAgent fingerprinting by using minimal feature detection
 */
export function getPlatform(): 'mobile' | 'desktop' | 'web' {
    if (typeof window === 'undefined') return 'web';

    // Use feature detection instead of userAgent parsing
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;

    // Mobile detection via touch + small screen
    if (isTouchDevice && isSmallScreen) {
        return 'mobile';
    }

    // Desktop (includes tablets in landscape)
    return 'desktop';
}

export function getDeviceName(): string {
    const platform = getPlatform();
    const platformNames: Record<typeof platform, string> = {
        mobile: 'Mobile Device',
        desktop: 'Desktop',
        web: 'Web Browser',
    };

    return platformNames[platform];
}

export async function calculateFileHash(file: File | Blob): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isImageFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext || '');
}

export function isVideoFile(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext || '');
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
