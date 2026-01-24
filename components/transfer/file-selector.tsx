'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Image, Video, Music, FileText, Archive, Folder, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils/uuid';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileInfo } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/language-context';

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

interface FileSelectorProps {
    onFilesSelected: (files: FileWithData[]) => void;
    selectedFiles: FileWithData[];
    onRemoveFile: (id: string) => void;
    onClearAll: () => void;
    onTextShare?: (text: TextShare) => void;
    sharedTexts?: TextShare[];
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) return Archive;
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return FileText;
    return File;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
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
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'files' | 'folder' | 'text'>('files');
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFiles = useCallback((fileList: FileList, isFolder: boolean = false) => {
        const files: FileWithData[] = Array.from(fileList).map((file) => ({
            id: generateUUID(),
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            lastModified: new Date(file.lastModified),
            file: file,
            isFolder,
            folderPath: isFolder ? (file as File & { webkitRelativePath?: string }).webkitRelativePath : undefined,
        }));
        onFilesSelected(files);
    }, [onFilesSelected]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
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
        if (!textContent.trim()) return;

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
            if (!acc[folderName]) acc[folderName] = [];
            acc[folderName].push(file);
        }
        return acc;
    }, {} as Record<string, FileWithData[]>);

    return (
        <div className="space-y-4">
            {/* Tab Selector */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3 h-11 bg-secondary rounded-full p-1">
                    <TabsTrigger value="files" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <File className="w-4 h-4" />
                        {t('app.files')}
                    </TabsTrigger>
                    <TabsTrigger value="folder" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        {t('app.folder')}
                    </TabsTrigger>
                    <TabsTrigger value="text" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        {t('app.text')}
                    </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="mt-4">
                    <Card
                        className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-3xl ${isDragging
                            ? 'border-accent bg-accent/10 scale-[1.01]'
                            : 'border-border hover:border-accent/60'
                            }`}
                        role="button"
                        tabIndex={0}
                        aria-label="Click or press Enter to select files, or drag and drop"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-accent/30 scale-110' : 'bg-secondary'}`}>
                                <Upload className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">
                                    {isDragging ? t('app.dropFiles') : t('app.selectFiles')}
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {t('app.dropFiles')}
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Folder Tab */}
                <TabsContent value="folder" className="mt-4">
                    <Card
                        className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-3xl ${isDragging
                            ? 'border-accent bg-accent/10 scale-[1.01]'
                            : 'border-border hover:border-accent/60'
                            }`}
                        onClick={() => folderInputRef.current?.click()}
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
                            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-secondary">
                                <Folder className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium">Select Entire Folder</h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    all files inside will be included
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Text Tab */}
                <TabsContent value="text" className="mt-4">
                    <Card className="p-6 rounded-3xl space-y-4">
                        <Input
                            placeholder="Title (optional)"
                            value={textTitle}
                            onChange={(e) => setTextTitle(e.target.value)}
                            className="rounded-xl"
                        />
                        <Textarea
                            placeholder="Enter text to share..."
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="min-h-[150px] rounded-xl resize-none"
                        />
                        <Button
                            onClick={handleTextSubmit}
                            disabled={!textContent.trim()}
                            className="rounded-full"
                        >
                            <Type className="w-4 h-4 mr-2" />
                            Add Text
                        </Button>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <Card className="overflow-hidden rounded-2xl">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</h4>
                            <p className="text-sm text-muted-foreground">Total: {formatFileSize(totalSize)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClearAll} className="rounded-full">
                            Clear All
                        </Button>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="p-2 space-y-1">
                            {/* Show folder groups */}
                            {Object.entries(folderGroups).map(([folderName, files]) => (
                                <div key={folderName} className="mb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                        <Folder className="w-4 h-4" />
                                        <span>{folderName}/</span>
                                        <span className="text-xs">({files.length} files)</span>
                                    </div>
                                </div>
                            ))}
                            {/* Individual files */}
                            {selectedFiles.filter(f => !f.folderPath).map((file) => {
                                const FileIcon = getFileIcon(file.type);
                                return (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 group transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveFile(file.id);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
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
                <Card className="overflow-hidden rounded-2xl">
                    <div className="p-4 border-b border-border">
                        <h4 className="font-medium">{sharedTexts.length} text{sharedTexts.length !== 1 ? 's' : ''} to share</h4>
                    </div>
                    <ScrollArea className="h-[150px]">
                        <div className="p-2 space-y-1">
                            {sharedTexts.map((text) => (
                                <div
                                    key={text.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                        <Type className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{text.title}</p>
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
