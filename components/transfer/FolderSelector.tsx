'use client';

/**
 * Folder Selector Component
 * Allows users to select folders for transfer with compression options
 */

import { useState, useCallback, useRef } from 'react';
import { Folder, Archive, FileArchive, Settings2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DragDropZone } from '@/components/ui/drag-drop-zone';
import { Progress } from '@/components/ui/progress';
import {
  buildFolderStructure,
  compressFolder,
  formatFileSize,
  FolderStructure,
} from '@/lib/transfer/folder-transfer';
import { toast } from '@/lib/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface FolderSelectorProps {
  onFolderSelected: (folder: FolderStructure, compressed?: Blob) => void;
  disabled?: boolean;
  maxSize?: number;
  allowCompression?: boolean;
}

export function FolderSelector({
  onFolderSelected,
  disabled = false,
  maxSize,
  allowCompression = true,
}: FolderSelectorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);
  const [excludeSystemFiles, setExcludeSystemFiles] = useState(true);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionFile, setCompressionFile] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileExtensionFilter, setFileExtensionFilter] = useState('');

  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = useCallback(
    async (files: FileList) => {
      if (files.length === 0) {return;}

      setIsProcessing(true);
      setCompressionProgress(0);
      setCompressionFile('');

      try {
        // Build folder structure
        const fileFilter = fileExtensionFilter
          ? (file: File) => {
              const ext = file.name.split('.').pop()?.toLowerCase();
              const filters = fileExtensionFilter.split(',').map((f) => f.trim().toLowerCase());
              return ext ? filters.includes(ext) : false;
            }
          : undefined;

        const folderStructure = buildFolderStructure(files, {
          excludeSystemFiles,
          ...(maxSize !== undefined ? { maxSize } : {}),
          ...(fileFilter ? { fileFilter } : {}),
        });

        if (folderStructure.fileCount === 0) {
          toast.error('No files found', {
            description: 'The selected folder contains no files',
          });
          setIsProcessing(false);
          return;
        }

        // Show folder info
        toast.success(`Folder selected: ${folderStructure.name}`, {
          description: `${folderStructure.fileCount} files, ${formatFileSize(folderStructure.totalSize)}`,
        });

        // Compress if enabled
        let compressedBlob: Blob | undefined;
        if (compressionEnabled && allowCompression) {
          compressedBlob = await compressFolder(
            folderStructure,
            (progress, file) => {
              setCompressionProgress(progress);
              setCompressionFile(file);
            }
          );

          const compressionRatio = ((1 - compressedBlob.size / folderStructure.totalSize) * 100).toFixed(1);

          toast.success('Folder compressed', {
            description: `${formatFileSize(compressedBlob.size)} (${compressionRatio}% smaller)`,
          });
        }

        onFolderSelected(folderStructure, compressedBlob);
      } catch (error) {
        console.error('Failed to process folder:', error);
        toast.error('Failed to process folder', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsProcessing(false);
        setCompressionProgress(0);
        setCompressionFile('');
      }
    },
    [
      excludeSystemFiles,
      maxSize,
      fileExtensionFilter,
      compressionEnabled,
      allowCompression,
      onFolderSelected,
    ]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFolderSelect(e.target.files);
        e.target.value = '';
      }
    },
    [handleFolderSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      folderInputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  return (
    <div className="space-y-4">
      {/* Main folder selector */}
      <DragDropZone
        onFilesDropped={handleFolderSelect}
        onFolderDropped={handleFolderSelect}
        allowFolders
        multiple
        disabled={disabled || isProcessing}
      >
        <Card
          className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-3xl ${
            disabled || isProcessing
              ? 'opacity-50 cursor-not-allowed border-border'
              : 'border-border hover:border-accent/60'
          }`}
          role="button"
          tabIndex={disabled || isProcessing ? -1 : 0}
          aria-label="Click or press Enter to select folder, or drag and drop"
          onClick={handleClick}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isProcessing) {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is not in TypeScript types
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            disabled={disabled || isProcessing}
          />

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-secondary">
              {isProcessing ? (
                <Archive className="w-8 h-8 text-muted-foreground animate-pulse" />
              ) : (
                <Folder className="w-8 h-8 text-muted-foreground" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium">
                {isProcessing ? 'Processing folder...' : 'Select Folder'}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {isProcessing
                  ? 'Please wait while we process your folder'
                  : 'Click to browse or drag and drop a folder here'}
              </p>
            </div>

            {/* Compression progress */}
            {isProcessing && compressionProgress > 0 && (
              <div className="w-full max-w-md space-y-2">
                <Progress value={compressionProgress} className="h-2" />
                <p className="text-xs text-muted-foreground truncate">
                  {compressionProgress < 50 ? 'Reading files...' : 'Compressing...'} {compressionFile}
                </p>
              </div>
            )}
          </div>
        </Card>
      </DragDropZone>

      {/* Options */}
      <Card className="p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Folder Options</h4>
          <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Settings2 className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Advanced Folder Options</DialogTitle>
                <DialogDescription>
                  Configure how folders are processed for transfer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* File extension filter */}
                <div className="space-y-2">
                  <Label htmlFor="extension-filter" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    File Extension Filter
                  </Label>
                  <Input
                    id="extension-filter"
                    placeholder="e.g., jpg, png, pdf (leave empty for all)"
                    value={fileExtensionFilter}
                    onChange={(e) => setFileExtensionFilter(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only include files with these extensions (comma-separated)
                  </p>
                </div>

                {/* Max size info */}
                {maxSize && (
                  <div className="p-3 rounded-xl bg-secondary/50">
                    <p className="text-sm">
                      <span className="font-medium">Maximum folder size:</span>{' '}
                      {formatFileSize(maxSize)}
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {/* Compression toggle */}
          {allowCompression && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="compression" className="cursor-pointer">
                  Compress folder before transfer
                </Label>
              </div>
              <Switch
                id="compression"
                checked={compressionEnabled}
                onCheckedChange={setCompressionEnabled}
                disabled={disabled || isProcessing}
              />
            </div>
          )}

          {/* Exclude system files */}
          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-system" className="cursor-pointer">
              Exclude system files (.DS_Store, Thumbs.db, etc.)
            </Label>
            <Switch
              id="exclude-system"
              checked={excludeSystemFiles}
              onCheckedChange={setExcludeSystemFiles}
              disabled={disabled || isProcessing}
            />
          </div>
        </div>

        {/* Compression info */}
        {compressionEnabled && allowCompression && (
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-xs text-muted-foreground">
              Compressing folders can significantly reduce transfer time, especially for text files,
              code, and documents. Already compressed files (images, videos) will see minimal
              reduction.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default FolderSelector;
