'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileIcon, FolderIcon, Image, Video, Music, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropZoneProps {
  onFilesDropped: (files: FileList) => void;
  onFolderDropped?: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number; // in bytes
  children?: React.ReactNode;
  className?: string;
  showPreview?: boolean;
  allowFolders?: boolean;
}

interface DragState {
  isDragging: boolean;
  fileCount: number;
  hasFolder: boolean;
  fileTypes: Set<string>;
}

function getFileTypeCategory(type: string): string {
  if (type.startsWith('image/')) {return 'image';}
  if (type.startsWith('video/')) {return 'video';}
  if (type.startsWith('audio/')) {return 'audio';}
  if (type.includes('pdf')) {return 'document';}
  return 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * EUVEKA Drag Drop Zone Component
 *
 * Design Specifications:
 * - Border-radius: 24px (rounded-3xl for overlay, 12px rounded-xl for inner elements)
 * - Border: 2px dashed with EUVEKA colors
 * - Background: #fefefc (light) / #191610 (dark)
 * - Accent: #b2987d
 * - Border color: #e5dac7 (light) / #544a36 (dark)
 * - Transition: all 0.3s ease
 */
export function DragDropZone({
  onFilesDropped,
  onFolderDropped,
  accept: _accept,
  multiple = true,
  disabled = false,
  maxSize,
  children,
  className = '',
  showPreview = true,
  allowFolders = true,
}: DragDropZoneProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    fileCount: 0,
    hasFolder: false,
    fileTypes: new Set(),
  });

  const dragCounterRef = useRef(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Analyze dragged items
  const analyzeDragItems = useCallback((items: DataTransferItemList | DataTransfer): DragState => {
    const files = items instanceof DataTransferItemList ? Array.from(items) : items.files ? Array.from(items.files) : [];
    const fileTypes = new Set<string>();
    let hasFolder = false;

    files.forEach((item) => {
      if (item instanceof DataTransferItem) {
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry?.();
          if (entry?.isDirectory) {
            hasFolder = true;
            fileTypes.add('folder');
          } else {
            const type = getFileTypeCategory(item.type);
            fileTypes.add(type);
          }
        }
      } else if (item instanceof File) {
        const type = getFileTypeCategory(item.type);
        fileTypes.add(type);
      }
    });

    return {
      isDragging: true,
      fileCount: files.length,
      hasFolder,
      fileTypes,
    };
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {return;}

    dragCounterRef.current += 1;

    if (dragCounterRef.current === 1 && e.dataTransfer.items) {
      const state = analyzeDragItems(e.dataTransfer.items);
      setDragState(state);
    }
  }, [disabled, analyzeDragItems]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {return;}

    // Set drop effect
    e.dataTransfer.dropEffect = 'copy';
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {return;}

    dragCounterRef.current -= 1;

    if (dragCounterRef.current === 0) {
      setDragState({
        isDragging: false,
        fileCount: 0,
        hasFolder: false,
        fileTypes: new Set(),
      });
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {return;}

    dragCounterRef.current = 0;
    setDragState({
      isDragging: false,
      fileCount: 0,
      hasFolder: false,
      fileTypes: new Set(),
    });

    const { files } = e.dataTransfer;

    if (files && files.length > 0) {
      // Check for folders
      const items = e.dataTransfer.items;
      let hasFolder = false;

      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item) {
            const entry = item.webkitGetAsEntry?.();
            if (entry?.isDirectory) {
              hasFolder = true;
              break;
            }
          }
        }
      }

      if (hasFolder && allowFolders && onFolderDropped) {
        onFolderDropped(files);
      } else {
        onFilesDropped(files);
      }
    }
  }, [disabled, onFilesDropped, onFolderDropped, allowFolders]);

  // Reset drag counter on unmount
  useEffect(() => {
    return () => {
      dragCounterRef.current = 0;
    };
  }, []);

  const getPreviewIcons = () => {
    const icons = [];
    const typeArray = Array.from(dragState.fileTypes);

    if (dragState.hasFolder) {
      icons.push(
        <FolderIcon key="folder" className="w-8 h-8 text-[#b2987d] animate-bounce-subtle" />
      );
    }

    typeArray.slice(0, 3).forEach((type, idx) => {
      if (type === 'folder') {return;}

      const IconComponent = type === 'image' ? Image :
        type === 'video' ? Video :
          type === 'audio' ? Music :
            type === 'document' ? FileText :
              FileIcon;

      icons.push(
        <IconComponent
          key={`${type}-${idx}`}
          className="w-8 h-8 text-[#b2987d] animate-bounce-subtle"
          style={{ animationDelay: `${idx * 0.1}s` }}
        />
      );
    });

    return icons;
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${className}`}
      role="region"
      aria-label="File drop zone - drag and drop files here to upload"
      aria-describedby="drop-zone-instructions"
    >
      <span id="drop-zone-instructions" className="sr-only">
        Drag and drop files here to upload{allowFolders ? ', folders are also supported' : ''}.
        {multiple ? ' Multiple files can be dropped at once.' : ' Only single file at a time.'}
        {maxSize ? ` Maximum file size: ${formatFileSize(maxSize)}.` : ''}
      </span>
      {children}

      {/* EUVEKA Styled Drag Overlay */}
      <AnimatePresence>
        {dragState.isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 pointer-events-none"
          >
            {/* EUVEKA styled backdrop */}
            <div className="absolute inset-0 bg-[#b2987d]/10 backdrop-blur-sm rounded-3xl border-2 border-dashed border-[#b2987d] dark:bg-[#b2987d]/5" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8" role="status" aria-live="polite">
              {/* Animated Icons */}
              <div className="flex items-center justify-center gap-4">
                {showPreview && dragState.fileCount > 0 ? (
                  getPreviewIcons()
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="p-4 rounded-full bg-[#b2987d]/20"
                  >
                    <Upload className="w-16 h-16 text-[#b2987d]" />
                  </motion.div>
                )}
              </div>

              {/* File Count Badge with EUVEKA styling */}
              {dragState.fileCount > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="px-6 py-3 bg-[#191610] dark:bg-[#fefefc] text-[#fefefc] dark:text-[#191610] rounded-[60px] shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">
                      {dragState.fileCount}
                    </span>
                    <span className="text-sm">
                      {dragState.fileCount === 1 ? 'file' : 'files'}
                    </span>
                    {dragState.hasFolder && (
                      <>
                        <span className="text-sm opacity-60">+</span>
                        <FolderIcon className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Drop Message with EUVEKA styling */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-center"
              >
                <h3 className="text-2xl font-semibold text-[#191610] dark:text-[#fefefc] mb-2">
                  Drop to upload
                </h3>
                <p className="text-sm text-[#b2987d]">
                  {dragState.hasFolder && allowFolders
                    ? 'Folders will be uploaded with structure intact'
                    : multiple
                      ? 'Multiple files supported'
                      : 'Single file only'}
                </p>
                {maxSize && (
                  <p className="text-xs text-[#b2987d]/70 mt-1">
                    Max size: {formatFileSize(maxSize)}
                  </p>
                )}
              </motion.div>

              {/* Animated Particles with EUVEKA accent */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-[#b2987d] rounded-full"
                    initial={{
                      x: '50%',
                      y: '50%',
                      scale: 0,
                      opacity: 0,
                    }}
                    animate={{
                      x: `${Math.random() * 100}%`,
                      y: `${Math.random() * 100}%`,
                      scale: [0, 1, 0],
                      opacity: [0, 0.6, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
