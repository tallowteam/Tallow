'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, File, X, Image, Video, Music, FileText, Archive, Folder, Type, Shield, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateUUID } from '@/lib/utils/uuid';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileInfo } from '@/lib/types';
import { DragDropZone } from '@/components/ui/drag-drop-zone';
import { toast } from 'sonner';
import { MetadataViewer } from '@/components/privacy/metadata-viewer';
import { MetadataStripDialog } from '@/components/privacy/metadata-strip-dialog';
import { useMetadataStripper } from '@/lib/hooks/use-metadata-stripper';
import { supportsMetadataStripping, extractMetadata, MetadataInfo } from '@/lib/privacy/metadata-stripper';
import { getPrivacySettings } from '@/lib/privacy/privacy-settings';

export interface FileWithData extends FileInfo {
    file: File;
    isFolder?: boolean;
    folderPath?: string;
    metadata?: MetadataInfo;
    metadataStripped?: boolean;
}

export interface TextShare {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
}

interface FileSelectorWithPrivacyProps {
    onFilesSelected: (files: FileWithData[]) => void;
    selectedFiles: FileWithData[];
    onRemoveFile: (id: string) => void;
    onClearAll: () => void;
    onTextShare?: (text: TextShare) => void;
    sharedTexts?: TextShare[];
    recipientId?: string;
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) {return Image;}
    if (type.startsWith('video/')) {return Video;}
    if (type.startsWith('audio/')) {return Music;}
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) {return Archive;}
    if (type.includes('pdf') || type.includes('doc') || type.includes('text')) {return FileText;}
    return File;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileSelectorWithPrivacy({
    onFilesSelected,
    selectedFiles,
    onRemoveFile,
    onClearAll,
    onTextShare,
    sharedTexts = [],
    recipientId,
}: FileSelectorWithPrivacyProps) {
    const [activeTab, setActiveTab] = useState<'files' | 'folder' | 'text'>('files');
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    const [stripMetadataEnabled, setStripMetadataEnabled] = useState(true);
    const [showMetadataViewer, setShowMetadataViewer] = useState(false);
    const [showStripDialog, setShowStripDialog] = useState(false);
    const [selectedFileForViewer, setSelectedFileForViewer] = useState<File | null>(null);
    const [pendingFiles, setPendingFiles] = useState<FileWithData[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    const { processFiles: processMetadata, checkMetadata: _checkMetadata, isProcessing } = useMetadataStripper();

    // Load privacy settings on mount
    useEffect(() => {
        loadPrivacySettings();
    }, []);

    const loadPrivacySettings = async () => {
        try {
            const settings = await getPrivacySettings();
            setStripMetadataEnabled(settings.stripMetadataEnabled && settings.stripMetadataByDefault);
        } catch (error) {
            console.error('Failed to load privacy settings:', error);
        }
    };

    const processFiles = useCallback(async (fileList: FileList, isFolder: boolean = false) => {
        const filesData: FileWithData[] = [];
        const filesWithMetadata: FileWithData[] = [];

        // First pass: create FileWithData objects and check for metadata
        for (const file of Array.from(fileList)) {
            const folderPath = isFolder ? (file as File & { webkitRelativePath?: string }).webkitRelativePath : undefined;
            const fileData: FileWithData = {
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

            // Check if file supports metadata stripping
            if (supportsMetadataStripping(file.type)) {
                try {
                    const metadata = await extractMetadata(file);
                    fileData.metadata = metadata;

                    if (metadata.hasSensitiveData) {
                        filesWithMetadata.push(fileData);
                    }
                } catch (error) {
                    console.warn('Failed to extract metadata:', error);
                }
            }

            filesData.push(fileData);
        }

        // Check if we need to show confirmation dialog
        const settings = await getPrivacySettings();

        if (
            stripMetadataEnabled &&
            filesWithMetadata.length > 0 &&
            settings.requireConfirmationBeforeStrip
        ) {
            setPendingFiles(filesData);
            setShowStripDialog(true);
        } else if (stripMetadataEnabled && filesWithMetadata.length > 0) {
            // Auto-strip without confirmation
            await stripAndAddFiles(filesData);
        } else {
            // No stripping needed
            onFilesSelected(filesData);
            toast.success(
                filesData.length === 1
                    ? 'File added'
                    : `${filesData.length} files added`
            );
        }
    }, [stripMetadataEnabled, onFilesSelected, recipientId]);

    const stripAndAddFiles = async (files: FileWithData[]) => {
        try {
            const processedFiles: FileWithData[] = [];

            for (const fileData of files) {
                if (supportsMetadataStripping(fileData.file.type) && fileData.metadata?.hasSensitiveData) {
                    // Process the file
                    const processedFile = await processMetadata([fileData.file], recipientId);
                    const strippedFile = processedFile[0];

                    if (strippedFile) {
                        processedFiles.push({
                            ...fileData,
                            file: strippedFile,
                            size: strippedFile.size,
                            metadataStripped: true,
                        });
                    } else {
                        // If stripping failed, use original file
                        processedFiles.push(fileData);
                    }
                } else {
                    processedFiles.push(fileData);
                }
            }

            onFilesSelected(processedFiles);

            const strippedCount = processedFiles.filter(f => f.metadataStripped).length;
            if (strippedCount > 0) {
                toast.success(
                    `Metadata removed from ${strippedCount} file${strippedCount !== 1 ? 's' : ''}`
                );
            }
        } catch (error) {
            console.error('Failed to strip metadata:', error);
            toast.error('Failed to process files');
            onFilesSelected(files);
        }
    };

    const handleStripDialogConfirm = async (shouldStrip: boolean) => {
        if (shouldStrip) {
            await stripAndAddFiles(pendingFiles);
        } else {
            onFilesSelected(pendingFiles);
            toast.success(`${pendingFiles.length} files added (metadata preserved)`);
        }
        setPendingFiles([]);
    };

    const handleViewMetadata = (file: FileWithData) => {
        setSelectedFileForViewer(file.file);
        setShowMetadataViewer(true);
    };

    const handleFilesDropped = useCallback((fileList: FileList) => {
        processFiles(fileList, false);
    }, [processFiles]);

    const handleFolderDropped = useCallback((fileList: FileList) => {
        processFiles(fileList, true);
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
    const filesWithSensitiveMetadata = selectedFiles.filter(f => f.metadata?.hasSensitiveData);

    return (
        <div className="space-y-4">
            {/* Privacy Toggle */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-muted-foreground" />
                        <div>
                            <Label htmlFor="strip-metadata" className="text-sm font-medium">
                                Strip metadata automatically
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Remove GPS, camera info, and timestamps from images/videos
                            </p>
                        </div>
                    </div>
                    <Switch
                        id="strip-metadata"
                        checked={stripMetadataEnabled}
                        onCheckedChange={setStripMetadataEnabled}
                    />
                </div>
            </Card>

            {/* Tab Selector */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-3 h-11 bg-secondary rounded-full p-1">
                    <TabsTrigger value="files" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <File className="w-4 h-4" />
                        Files
                    </TabsTrigger>
                    <TabsTrigger value="folder" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        Folder
                    </TabsTrigger>
                    <TabsTrigger value="text" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        Text
                    </TabsTrigger>
                </TabsList>

                {/* Files Tab */}
                <TabsContent value="files" className="mt-4">
                    <DragDropZone
                        onFilesDropped={handleFilesDropped}
                        multiple
                        allowFolders={false}
                        showPreview
                    >
                        <Card
                            className="p-8 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-3xl border-border hover:border-accent/60"
                            role="button"
                            tabIndex={0}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-secondary">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">Select Files</h3>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        or drag and drop files here
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </DragDropZone>
                </TabsContent>

                {/* Folder Tab */}
                <TabsContent value="folder" className="mt-4">
                    <DragDropZone
                        onFilesDropped={handleFolderDropped}
                        onFolderDropped={handleFolderDropped}
                        multiple
                        allowFolders
                        showPreview
                    >
                        <Card
                            className="p-8 border-2 border-dashed transition-all duration-300 cursor-pointer rounded-3xl border-border hover:border-accent/60"
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
                    </DragDropZone>
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

                    {/* Privacy Summary */}
                    {filesWithSensitiveMetadata.length > 0 && (
                        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                            <div className="flex items-center gap-2 text-sm text-amber-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span>
                                    {filesWithSensitiveMetadata.length} file{filesWithSensitiveMetadata.length !== 1 ? 's' : ''} contain{filesWithSensitiveMetadata.length === 1 ? 's' : ''} sensitive metadata
                                </span>
                            </div>
                        </div>
                    )}

                    <ScrollArea className="h-[200px]">
                        <div className="p-2 space-y-1">
                            {selectedFiles.map((file) => {
                                const FileIcon = getFileIcon(file.type);
                                const hasSensitiveData = file.metadata?.hasSensitiveData;

                                return (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 group transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium truncate">{file.name}</p>
                                                {file.metadataStripped && (
                                                    <Badge variant="outline" className="shrink-0">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Stripped
                                                    </Badge>
                                                )}
                                                {hasSensitiveData && !file.metadataStripped && (
                                                    <Badge variant="outline" className="shrink-0 border-amber-500/50">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Metadata
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                        </div>
                                        {supportsMetadataStripping(file.type) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewMetadata(file);
                                                }}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
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

            {/* Metadata Viewer Dialog */}
            <MetadataViewer
                file={selectedFileForViewer}
                isOpen={showMetadataViewer}
                onClose={() => {
                    setShowMetadataViewer(false);
                    setSelectedFileForViewer(null);
                }}
            />

            {/* Metadata Strip Confirmation Dialog */}
            <MetadataStripDialog
                isOpen={showStripDialog}
                onClose={() => {
                    setShowStripDialog(false);
                    setPendingFiles([]);
                }}
                onConfirm={handleStripDialogConfirm}
                onViewMetadata={() => {
                    const fileWithMetadata = pendingFiles.find(f => f.metadata?.hasSensitiveData);
                    if (fileWithMetadata) {
                        setSelectedFileForViewer(fileWithMetadata.file);
                        setShowMetadataViewer(true);
                    }
                }}
                files={pendingFiles.map(f => ({
                    name: f.name,
                    ...(f.metadata ? { metadata: f.metadata } : {}),
                }))}
                loading={isProcessing}
            />
        </div>
    );
}

export default FileSelectorWithPrivacy;
