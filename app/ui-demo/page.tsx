'use client';

/**
 * UI Components Demo Page
 *
 * Standalone demonstration of Tallow's UI component library including
 * toast notifications and drag & drop functionality.
 *
 * This demo is completely self-contained and works independently.
 */

import { useState } from 'react';
import { DemoLayout, DemoSection, DemoCard } from '@/components/demos/demo-layout';
import { ToastExamples } from '@/components/ui/toast-examples';
import { DragDropZone } from '@/components/ui/drag-drop-zone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/utils/toast';
import {
  Upload,
  FileIcon,
  FolderIcon,
  Trash2,
  Bell,
  MousePointerClick,
  Sparkles,
  CheckCircle,
  Accessibility,
  Paintbrush,
} from 'lucide-react';

export default function UIDemoPage() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesDropped = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    setFiles(prev => [...prev, ...newFiles]);
    toast.fileUploaded(
      newFiles.length === 1 ? newFiles[0]?.name || 'Unknown file' : `${newFiles.length} files`,
      newFiles.length
    );
  };

  const handleFolderDropped = (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`Added folder with ${newFiles.length} files`);
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (!file) { return; }
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast.fileDeleted(file.name, () => {
      setFiles(prev => {
        const newFiles = [...prev];
        newFiles.splice(index, 0, file);
        return newFiles;
      });
    });
  };

  const clearAll = () => {
    const backup = [...files];
    setFiles([]);
    toast.withUndo('Cleared all files', () => {
      setFiles(backup);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) { return '0 B'; }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <DemoLayout
      title="UI Components Demo"
      description="Explore Tallow's enhanced toast notification system and drag & drop functionality with smooth animations and accessibility features."
      demoType="ui"
      features={[
        'Toast Notifications',
        'Drag & Drop',
        'Undo Actions',
        'Theme-aware',
        'Accessible',
        'Animated',
      ]}
      instructions={[
        'Switch between Toast and Drag & Drop tabs to explore each feature',
        'Click any button in the Toast tab to see different notification types',
        'Drag files or folders onto the drop zones to see the animated upload',
        'Try the "Delete with Undo" button to see reversible actions',
      ]}
    >
      <DemoSection>
        <Tabs defaultValue="toasts" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="toasts" className="gap-2">
              <Bell className="h-4 w-4" />
              Toast Notifications
            </TabsTrigger>
            <TabsTrigger value="drag-drop" className="gap-2">
              <MousePointerClick className="h-4 w-4" />
              Drag & Drop
            </TabsTrigger>
          </TabsList>

          {/* Toast Examples */}
          <TabsContent value="toasts" className="space-y-8">
            <div className="flex justify-center">
              <ToastExamples />
            </div>

            <Card className="p-6 rounded-2xl max-w-2xl mx-auto">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Toast Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Custom variants with icons (success, error, warning, info)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Action buttons with custom callbacks</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Undo functionality for reversible actions</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Persistent error toasts that require dismissal</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Queue management (max 3 concurrent)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Specialized helpers for common operations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Accessibility className="h-4 w-4 text-white mt-0.5 shrink-0" />
                      <span className="text-sm">ARIA live regions for screen readers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Paintbrush className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Theme-aware styling (light/dark mode)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drag & Drop Demo */}
          <TabsContent value="drag-drop" className="space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
              {/* File Drop Zone */}
              <DemoCard
                title="File Drop Zone"
                icon={<FileIcon className="h-5 w-5 text-white" />}
              >
                <DragDropZone
                  onFilesDropped={handleFilesDropped}
                  multiple
                  allowFolders={false}
                  showPreview
                >
                  <div className="p-12 border-2 border-dashed border-border hover:border-accent/60 rounded-2xl transition-colors text-center cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-2">Drop files here</h4>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                </DragDropZone>
              </DemoCard>

              {/* Folder Drop Zone */}
              <DemoCard
                title="Folder Drop Zone"
                icon={<FolderIcon className="h-5 w-5 text-amber-500" />}
              >
                <DragDropZone
                  onFilesDropped={handleFolderDropped}
                  onFolderDropped={handleFolderDropped}
                  multiple
                  allowFolders
                  showPreview
                >
                  <div className="p-12 border-2 border-dashed border-border hover:border-accent/60 rounded-2xl transition-colors text-center cursor-pointer">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <FolderIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-2">Drop folder here</h4>
                    <p className="text-sm text-muted-foreground">
                      entire directory will be included
                    </p>
                  </div>
                </DragDropZone>
              </DemoCard>
            </div>

            {/* Dropped Files List */}
            {files.length > 0 && (
              <Card className="p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <CardTitle className="text-lg">
                      Dropped Files
                    </CardTitle>
                    <CardDescription>
                      {files.length} file{files.length !== 1 ? 's' : ''} -{' '}
                      {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="rounded-full"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 group transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          {file.type && (
                            <Badge variant="secondary" className="text-xs">
                              {file.type.split('/')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Features List */}
            <Card className="p-6 rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Drag & Drop Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Animated drag overlay with blur effect</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">File count badge during drag</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">File type detection with preview icons</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Folder drag & drop support</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Particle animation effects</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Smooth enter/exit animations</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">Mobile-friendly touch support</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Accessibility className="h-4 w-4 text-white mt-0.5 shrink-0" />
                      <span className="text-sm">Keyboard accessible</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DemoSection>

      {/* Documentation Section */}
      <DemoSection className="mt-8">
        <Card className="p-6 rounded-2xl bg-secondary/30">
          <CardHeader className="p-0 mb-4">
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Toast System</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  See <code className="px-2 py-1 bg-secondary rounded">TOAST_SYSTEM.md</code> for:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All toast variants</li>
                  <li>Action buttons</li>
                  <li>Undo functionality</li>
                  <li>Specialized helpers</li>
                  <li>Best practices</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Drag & Drop</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  See <code className="px-2 py-1 bg-secondary rounded">DRAG_DROP_SYSTEM.md</code> for:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Component props</li>
                  <li>Animation details</li>
                  <li>File validation</li>
                  <li>Integration examples</li>
                  <li>Accessibility features</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DemoSection>
    </DemoLayout>
  );
}
