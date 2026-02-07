import { generateUUID } from './uuid';

// Utility functions for file operations

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'folder' | 'other';

export function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Show more precision for smaller files
    const decimals = i <= 1 ? 0 : 1;

    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

export function formatDuration(seconds: number): string {
    if (seconds < 60) {return `${Math.round(seconds)}s`;}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;}

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

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
    if (!mimeType) {return 'other';}

    // Image files
    if (mimeType.startsWith('image/')) {
        return 'image';
    }

    // Video files
    if (mimeType.startsWith('video/')) {
        return 'video';
    }

    // Audio files
    if (mimeType.startsWith('audio/')) {
        return 'audio';
    }

    // Document files
    if (
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('word') ||
        mimeType.includes('text') ||
        mimeType.includes('msword') ||
        mimeType.includes('officedocument') ||
        mimeType.includes('spreadsheet') ||
        mimeType.includes('presentation')
    ) {
        return 'document';
    }

    // Archive files
    if (
        mimeType.includes('zip') ||
        mimeType.includes('rar') ||
        mimeType.includes('7z') ||
        mimeType.includes('tar') ||
        mimeType.includes('gzip') ||
        mimeType.includes('compress')
    ) {
        return 'archive';
    }

    // Code files
    if (
        mimeType.includes('javascript') ||
        mimeType.includes('typescript') ||
        mimeType.includes('json') ||
        mimeType.includes('xml') ||
        mimeType.includes('html') ||
        mimeType.includes('css') ||
        mimeType.includes('python') ||
        mimeType.includes('java') ||
        mimeType.includes('c++') ||
        mimeType.startsWith('text/x-')
    ) {
        return 'code';
    }

    return 'other';
}

/**
 * Check if file is an image that can be previewed
 */
export function isPreviewableImage(mimeType: string): boolean {
    return (
        mimeType === 'image/jpeg' ||
        mimeType === 'image/jpg' ||
        mimeType === 'image/png' ||
        mimeType === 'image/gif' ||
        mimeType === 'image/webp' ||
        mimeType === 'image/svg+xml'
    );
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1]?.toLowerCase() ?? '';
    }
    return '';
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
    if (typeof window === 'undefined') {return 'web';}

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
