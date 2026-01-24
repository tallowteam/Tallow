'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FileInfo } from '@/lib/types';
import { generateUUID } from '@/lib/utils/uuid';
import { saveFileToDirectory } from '@/lib/storage/download-location';

export interface FileWithData extends FileInfo {
    file: File;
}

export function useFileTransfer() {
    const [files, setFiles] = useState<FileWithData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((fileList: FileList | File[]) => {
        const newFiles: FileWithData[] = Array.from(fileList).map((file) => ({
            id: generateUUID(),
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            lastModified: new Date(file.lastModified),
            file: file, // Store the actual File object
        }));
        setFiles((prev) => [...prev, ...newFiles]);
        return newFiles;
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    const openFilePicker = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            // Reset input so the same file can be selected again
            e.target.value = '';
        }
    }, [addFiles]);

    const getTotalSize = useCallback(() => {
        return files.reduce((acc, f) => acc + f.size, 0);
    }, [files]);

    const getFileById = useCallback((id: string) => {
        return files.find((f) => f.id === id);
    }, [files]);

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

// Download a file blob - saves to configured directory or falls back to browser download
export async function downloadFile(blob: Blob, filename: string, relativePath?: string): Promise<void> {
    // Try saving to user-configured directory first (with subdirectory support for folders)
    const saved = await saveFileToDirectory(blob, filename, relativePath);
    if (saved) return;

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

// Download multiple files
export async function downloadFiles(files: Array<{ blob: Blob; name: string }>): Promise<void> {
    for (const { blob, name } of files) {
        await downloadFile(blob, name);
    }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format speed for display
export function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

// Format time duration
export function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--:--';
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// Get file extension
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

// Get MIME type from filename
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
