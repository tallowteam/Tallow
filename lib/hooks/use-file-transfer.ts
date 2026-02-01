'use client';

/**
 * @fileoverview Custom hook for managing file selection and drag-and-drop operations
 * @module hooks/use-file-transfer
 */

import { useState, useCallback, useRef } from 'react';
import { FileInfo } from '@/lib/types';
import { generateUUID } from '@/lib/utils/uuid';
import { saveFileToDirectory } from '@/lib/storage/download-location';

/**
 * File information with actual File object
 * @interface FileWithData
 * @extends {FileInfo}
 */
export interface FileWithData extends FileInfo {
    /** The actual File object from browser */
    file: File;
}

/**
 * Custom hook for managing file selection, drag-and-drop, and file operations
 *
 * Provides comprehensive file management including drag-and-drop support,
 * file picker integration, and file list management.
 *
 * @returns File transfer state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   files,
 *   isDragging,
 *   addFiles,
 *   removeFile,
 *   clearFiles,
 *   handleDragOver,
 *   handleDrop
 * } = useFileTransfer();
 * ```
 */
export function useFileTransfer() {
    const [files, setFiles] = useState<FileWithData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * Add files to the transfer queue
     *
     * @param {FileList | File[]} fileList - Files to add
     * @returns {FileWithData[]} Array of added files with metadata
     */
    const addFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles: FileWithData[] = Array.from(fileList).map((file) => ({
            id: generateUUID(),
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            path: null,
            lastModified: file.lastModified,
            thumbnail: null,
            hash: '', // Will be computed during transfer
            file: file, // Store the actual File object
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        return newFiles;
    }, []);

    /**
     * Remove a file from the transfer queue
     *
     * @param {string} id - ID of file to remove
     */
    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    /**
     * Clear all files from the transfer queue
     */
    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    /**
     * Programmatically open the file picker dialog
     */
    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    /**
     * Handle drag over event for drag-and-drop
     *
     * @param {React.DragEvent} e - Drag event
     */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    /**
     * Handle drag leave event for drag-and-drop
     *
     * @param {React.DragEvent} e - Drag event
     */
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    /**
     * Handle file drop event for drag-and-drop
     *
     * @param {React.DragEvent} e - Drop event
     */
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles]);

    /**
     * Handle file input change event
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     */
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            // Reset input so the same file can be selected again
            e.target.value = '';
        }
    }, [addFiles]);

    /**
     * Calculate total size of all files in queue
     *
     * @returns {number} Total size in bytes
     */
    const getTotalSize = useCallback(() => {
        return files.reduce((acc, f) => acc + f.size, 0);
    }, [files]);

    /**
     * Get file metadata by ID
     *
     * @param {string} id - File ID
     * @returns {FileWithData | undefined} File metadata or undefined if not found
     */
    const getFileById = useCallback((id: string) => {
        return files.find((f) => f.id === id);
    }, [files]);

    /**
     * Get array of all File objects
     *
     * @returns {File[]} Array of File objects
     */
    const getAllFiles = useCallback(() => {
        return files.map((f) => f.file);
    }, [files]);

    return {
        files,
        isDragging,
        inputRef,
        addFiles,
        removeFile,
        clearFiles,
        openFilePicker,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileInputChange,
        getTotalSize,
        getFileById,
        getAllFiles,
    };
}

/**
 * Download a file blob to the user's system
 *
 * Attempts to save to user-configured directory first, falls back to browser download.
 * Supports subdirectories via relativePath parameter.
 *
 * @param {Blob} blob - File blob to download
 * @param {string} filename - Name for the downloaded file
 * @param {string} [relativePath] - Optional relative path for subdirectories
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await downloadFile(blob, 'document.pdf');
 * await downloadFile(blob, 'file.txt', 'folder/subfolder');
 * ```
 */
export async function downloadFile(blob: Blob, filename: string, relativePath?: string): Promise<void> {
    // Try saving to user-configured directory first (with subdirectory support for folders)
    const saved = await saveFileToDirectory(blob, filename, relativePath);
    if (saved) {return;}

    // Fallback: trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download multiple files sequentially
 *
 * @param {Array<{ blob: Blob; name: string }>} files - Array of files to download
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await downloadFiles([
 *   { blob: blob1, name: 'file1.txt' },
 *   { blob: blob2, name: 'file2.pdf' }
 * ]);
 * ```
 */
export async function downloadFiles(files: Array<{ blob: Blob; name: string }>): Promise<void> {
    for (const { blob, name } of files) {
        await downloadFile(blob, name);
    }
}

/**
 * Format file size in human-readable format
 *
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string (e.g., "1.5 MB")
 *
 * @example
 * ```typescript
 * formatFileSize(1024); // "1.00 KB"
 * formatFileSize(1048576); // "1.00 MB"
 * ```
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format transfer speed in human-readable format
 *
 * @param {number} bytesPerSecond - Speed in bytes per second
 * @returns {string} Formatted speed string (e.g., "1.5 MB/s")
 *
 * @example
 * ```typescript
 * formatSpeed(1048576); // "1.00 MB/s"
 * ```
 */
export function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

/**
 * Format time duration in human-readable format
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string (e.g., "2m 30s", "1h 5m")
 *
 * @example
 * ```typescript
 * formatTime(90); // "1m 30s"
 * formatTime(3665); // "1h 1m"
 * ```
 */
export function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {return '--:--';}
    if (seconds < 60) {return `${Math.floor(seconds)}s`;}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;}
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Extract file extension from filename
 *
 * @param {string} filename - Name of the file
 * @returns {string} File extension in lowercase (without dot)
 *
 * @example
 * ```typescript
 * getFileExtension('document.pdf'); // "pdf"
 * getFileExtension('archive.tar.gz'); // "gz"
 * ```
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get MIME type from filename extension
 *
 * @param {string} filename - Name of the file
 * @returns {string} MIME type string
 *
 * @example
 * ```typescript
 * getMimeType('document.pdf'); // "application/pdf"
 * getMimeType('image.png'); // "image/png"
 * getMimeType('unknown.xyz'); // "application/octet-stream"
 * ```
 */
export function getMimeType(filename: string): string {
    const ext = getFileExtension(filename);
    const mimeTypes: Record<string, string> = {
        // Images
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        // Documents
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        // Video
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        // Audio
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        // Archives
        'zip': 'application/zip',
        'rar': 'application/vnd.rar',
        '7z': 'application/x-7z-compressed',
        'tar': 'application/x-tar',
        'gz': 'application/gzip',
        // Code
        'js': 'text/javascript',
        'ts': 'text/typescript',
        'json': 'application/json',
        'html': 'text/html',
        'css': 'text/css',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
