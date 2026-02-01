'use client';

import { useState, useCallback, useRef } from 'react';
import {
    Upload,
    File,
    X,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    Folder,
    Type,
    Sparkles,
    FileCode,
    FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils/uuid';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileInfo } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/language-context';
import { DragDropZone } from '@/components/ui/drag-drop-zone';
import { toast } from '@/lib/utils/toast';
import { announce } from '@/components/accessibility/live-region-provider';
import { cn } from '@/lib/utils';

export interface FileWithData extends FileInfo {
    file: File;
    isFolder?: boolean;
    folderPath?: string;
}

export interface TextShare {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
}

export interface FileSelectorProps {
    onFilesSelected: (files: FileWithData[]) => void;
    selectedFiles: FileWithData[];
    onRemoveFile: (id: string) => void;
    onClearAll: () => void;
    onTextShare?: (text: TextShare) => void;
    sharedTexts?: TextShare[];
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) {return Image;}
    if (type.startsWith('video/')) {return Video;}
    if (type.startsWith('audio/')) {return Music;}
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {return Archive;}
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) {return FileText;}
    if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.includes('html') || type.includes('css')) {return FileCode;}
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {return FileSpreadsheet;}
    return File;
}

function getFileIconColor(type: string) {
    if (type.startsWith('image/')) {return 'text-pink-500';}
    if (type.startsWith('video/')) {return 'text-purple-500';}
    if (type.startsWith('audio/')) {return 'text-amber-500';}
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {return 'text-orange-500';}
    if (type.includes('pdf')) {return 'text-red-500';}
    if (type.includes('doc') || type.includes('text')) {return 'text-[#fefefc]';}
    if (type.includes('javascript') || type.includes('typescript') || type.includes('json')) {return 'text-yellow-500';}
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) {return 'text-emerald-500';}
    return 'text-zinc-500';
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileSelector({
    onFilesSelected,
    selectedFiles,
    onRemoveFile,
    onClearAll,
    onTextShare,
    sharedTexts = []
}: FileSelectorProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'files' | 'folder' | 'text'>('files');
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback((fileList: FileList, isFolder: boolean = false) => {
        const files: FileWithData[] = Array.from(fileList).map((file) => {
            const folderPath = isFolder ? (file as File & { webkitRelativePath?: string }).webkitRelativePath : undefined;
            return {
                id: generateUUID(),
                name: file.name,
                size: file.size,
                type: file.type || 'application/octet-stream',
                path: folderPath || null,
                lastModified: file.lastModified,
                thumbnail: null,
                hash: '', // Will be computed during transfer
                file: file,
                isFolder,
                ...(folderPath ? { folderPath } : {}),
            };
        });
        onFilesSelected(files);

        // Show success toast
        const firstFile = files[0];
        toast.fileUploaded(
            files.length === 1 && firstFile ? firstFile.name : `${files.length} files`,
            files.length
        );

        // Announce to screen readers (WCAG 4.1.3)
        announce(
            files.length === 1 && firstFile
                ? `File selected: ${firstFile.name}`
                : `${files.length} files selected successfully`
        );
    }, [onFilesSelected]);

    const handleFilesDropped = useCallback((fileList: FileList) => {
        processFiles(fileList, false);
        setIsDragOver(false);
    }, [processFiles]);

    const handleFolderDropped = useCallback((fileList: FileList) => {
        processFiles(fileList, true);
        setIsDragOver(false);
    }, [processFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files, false);
            e.target.value = '';
        }
    }, [processFiles]);

    const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files, true);
            e.target.value = '';
        }
    }, [processFiles]);

    const handleTextSubmit = useCallback(() => {
        if (!textContent.trim()) {return;}

        const text: TextShare = {
            id: generateUUID(),
            title: textTitle.trim() || 'Untitled',
            content: textContent,
            createdAt: new Date(),
        };

        onTextShare?.(text);
        setTextTitle('');
        setTextContent('');
    }, [textTitle, textContent, onTextShare]);

    const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    const folderGroups = selectedFiles.reduce((acc, file) => {
        if (file.folderPath) {
            const folderName = file.folderPath.split('/')[0];
            if (folderName) {
                if (!acc[folderName]) {acc[folderName] = [];}
                acc[folderName].push(file);
            }
        }
        return acc;
    }, {} as Record<string, FileWithData[]>);

    return (
        <div className="space-y-5">
            {/* Tab Selector - Modern pill style */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-1.5 gap-1">
                    <TabsTrigger
                        value="files"
                        className={cn(
                            'rounded-xl font-medium transition-all duration-300',
                            'data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900',
                            'data-[state=active]:shadow-md data-[state=active]:shadow-[#fefefc]/10',
                            'data-[state=active]:text-[#fefefc]',
                            'flex items-center gap-2'
                        )}
                    >
                        <File className="w-4 h-4" aria-hidden="true" />
                        {t('app.files')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="folder"
                        className={cn(
                            'rounded-xl font-medium transition-all duration-300',
                            'data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900',
                            'data-[state=active]:shadow-md data-[state=active]:shadow-[#fefefc]/10',
                            'data-[state=active]:text-[#fefefc]',
                            'flex items-center gap-2'
                        )}
                    >
                        <Folder className="w-4 h-4" aria-hidden="true" />
                        {t('app.folder')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="text"
                        className={cn(
                            'rounded-xl font-medium transition-all duration-300',
                            'data-[state=active]:bg-white data-[state=active]:dark:bg-zinc-900',
                            'data-[state=active]:shadow-md data-[state=active]:shadow-[#fefefc]/10',
                            'data-[state=active]:text-[#fefefc]',
                            'flex items-center gap-2'
                        )}
                    >
                        <Type className="w-4 h-4" aria-hidden="true" />
                        {t('app.text')}
                    </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="mt-5">
                    <DragDropZone
                        onFilesDropped={handleFilesDropped}
                        multiple
                        allowFolders={false}
                        showPreview
                    >
                        <Card
                            className={cn(
                                'relative p-10 border-2 border-dashed cursor-pointer rounded-3xl overflow-hidden',
                                'bg-zinc-50/50 dark:bg-zinc-900/50',
                                'transition-all duration-300 ease-out',
                                'hover:border-[#fefefc]/50 hover:bg-[#fefefc]/5',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fefefc] focus-visible:ring-offset-2',
                                isDragOver
                                    ? 'border-[#fefefc] bg-[#fefefc]/10 scale-[1.02]'
                                    : 'border-zinc-200 dark:border-zinc-700'
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label="Click or press Enter to select files, or drag and drop"
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    fileInputRef.current?.click();
                                }
                            }}
                            onDragOver={() => setIsDragOver(true)}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={() => setIsDragOver(false)}
                        >
                            {/* Background gradient effect */}
                            <div className={cn(
                                'absolute inset-0 opacity-0 transition-opacity duration-500',
                                'bg-gradient-to-br from-[#fefefc]/10 via-transparent to-[#fefefc]/5',
                                isDragOver && 'opacity-100'
                            )} />

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="relative flex flex-col items-center text-center space-y-4">
                                <div className={cn(
                                    'w-20 h-20 rounded-2xl flex items-center justify-center',
                                    'bg-gradient-to-br from-[#fefefc]/20 to-[#fefefc]/5',
                                    'transition-all duration-300',
                                    isDragOver && 'scale-110 from-[#fefefc]/30 to-[#fefefc]/10'
                                )}>
                                    <Upload className={cn(
                                        'w-10 h-10 text-[#fefefc] transition-transform duration-300',
                                        isDragOver && '-translate-y-1'
                                    )} aria-hidden="true" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {t('app.selectFiles')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        {t('app.dropFiles')}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        Any file type, up to 10GB each
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </DragDropZone>
                </TabsContent>

                {/* Folder Tab */}
                <TabsContent value="folder" className="mt-5">
                    <DragDropZone
                        onFilesDropped={handleFolderDropped}
                        onFolderDropped={handleFolderDropped}
                        multiple
                        allowFolders
                        showPreview
                    >
                        <Card
                            className={cn(
                                'relative p-10 border-2 border-dashed cursor-pointer rounded-3xl overflow-hidden',
                                'bg-zinc-50/50 dark:bg-zinc-900/50',
                                'transition-all duration-300 ease-out',
                                'hover:border-amber-500/50 hover:bg-amber-500/5',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                                'border-zinc-200 dark:border-zinc-700'
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label="Click or press Enter to select a folder, or drag and drop"
                            onClick={() => folderInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    folderInputRef.current?.click();
                                }
                            }}
                        >
                            <input
                                ref={folderInputRef}
                                type="file"
                                // @ts-expect-error webkitdirectory is not in the types
                                webkitdirectory=""
                                directory=""
                                multiple
                                className="hidden"
                                onChange={handleFolderSelect}
                            />
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-500/5">
                                    <Folder className="w-10 h-10 text-amber-500" aria-hidden="true" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-foreground">Share a Folder</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs">
                                        Everything inside will be included, keeping the folder structure
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </DragDropZone>
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text" className="mt-5">
                    <Card className="p-6 rounded-3xl space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">Quick text sharing - notes, links, code snippets</span>
                        </div>
                        <Input
                            placeholder="Title (optional)"
                            value={textTitle}
                            onChange={(e) => setTextTitle(e.target.value)}
                            className="rounded-xl border-zinc-200 dark:border-zinc-700 focus:border-[#fefefc] focus:ring-[#fefefc]/20"
                        />
                        <Textarea
                            placeholder="Enter text to share..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="min-h-[150px] rounded-xl resize-none border-zinc-200 dark:border-zinc-700 focus:border-[#fefefc] focus:ring-[#fefefc]/20"
                        />
                        <Button
                            onClick={handleTextSubmit}
                            disabled={!textContent.trim()}
                            className={cn(
                                'rounded-xl font-medium transition-all duration-300',
                                'bg-[#fefefc] hover:bg-[#0055DD] text-white',
                                'hover:shadow-lg hover:shadow-[#fefefc]/25',
                                'disabled:opacity-50 disabled:shadow-none'
                            )}
                        >
                            <Type className="w-4 h-4 mr-2" aria-hidden="true" />
                            Add Text
                        </Button>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Selected Files List - Modern bento card */}
            {selectedFiles.length > 0 && (
                <Card className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50">
                        <div className="flex-1">
                            <h4 className="font-semibold text-foreground">
                                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Total: {formatFileSize(totalSize)}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            className="rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                        >
                            <X className="w-4 h-4 mr-1" aria-hidden="true" />
                            Clear All
                        </Button>
                    </div>
                    <ScrollArea className="h-[220px]">
                        <div className="p-3 space-y-1">
                            {/* Show folder groups */}
                            {Object.entries(folderGroups).map(([folderName, files]) => (
                                <div key={folderName} className="mb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/5 rounded-xl">
                                        <Folder className="w-4 h-4" aria-hidden="true" />
                                        <span className="font-medium">{folderName}/</span>
                                        <span className="text-xs text-muted-foreground">({files.length} files)</span>
                                    </div>
                                </div>
                            ))}
                            {/* Individual files */}
                            {selectedFiles.filter(f => !f.folderPath).map((file) => {
                                const FileIcon = getFileIcon(file.type);
                                const iconColor = getFileIconColor(file.type);
                                return (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            'flex items-center gap-3 p-3 rounded-xl group',
                                            'transition-all duration-200',
                                            'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                                            'bg-zinc-100 dark:bg-zinc-800'
                                        )}>
                                            <FileIcon className={cn('w-5 h-5', iconColor)} aria-hidden="true" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-foreground">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                        {/* 44px touch target - always visible on mobile, hover on desktop */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-11 w-11 sm:h-9 sm:w-9 rounded-xl',
                                                'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                                                'transition-all duration-200',
                                                'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFile(file.id);
                                            }}
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <X className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </Card>
            )}

            {/* Shared Texts List */}
            {sharedTexts.length > 0 && (
                <Card className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                        <h4 className="font-semibold text-foreground">
                            {sharedTexts.length} text{sharedTexts.length !== 1 ? 's' : ''} to share
                        </h4>
                    </div>
                    <ScrollArea className="h-[150px]">
                        <div className="p-3 space-y-1">
                            {sharedTexts.map((text) => (
                                <div
                                    key={text.id}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-xl',
                                        'transition-all duration-200',
                                        'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                    )}
                                >
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center shrink-0">
                                        <Type className="w-5 h-5 text-violet-500" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate text-foreground">{text.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{text.content.slice(0, 50)}...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            )}
        </div>
    );
}

export default FileSelector;
