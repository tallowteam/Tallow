'use client';

/**
 * Folder Tree Component
 * Displays folder structure with expand/collapse functionality
 */

import React, { useState, useMemo, memo } from 'react';
import {
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileCode,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderStructure,
  FolderTreeNode,
  buildFolderTree,
  formatFileSize,
  getFolderStats,
} from '@/lib/transfer/folder-transfer';
import { cn } from '@/lib/utils';

export interface FolderTreeProps {
  folderStructure: FolderStructure;
  showStats?: boolean;
  maxHeight?: number | string;
  className?: string;
}

interface TreeNodeProps {
  node: FolderTreeNode;
  level: number;
  onNodeClick?: (node: FolderTreeNode) => void;
}

function getFileIcon(filename: string): React.ElementType {
  const ext = filename.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, React.ElementType> = {
    // Images
    jpg: Image,
    jpeg: Image,
    png: Image,
    gif: Image,
    webp: Image,
    svg: Image,
    // Videos
    mp4: Video,
    webm: Video,
    mov: Video,
    avi: Video,
    // Audio
    mp3: Music,
    wav: Music,
    ogg: Music,
    // Archives
    zip: Archive,
    rar: Archive,
    '7z': Archive,
    tar: Archive,
    gz: Archive,
    // Code
    js: Code,
    ts: Code,
    jsx: Code,
    tsx: Code,
    py: Code,
    java: Code,
    cpp: Code,
    c: Code,
    go: Code,
    rs: Code,
    // Documents
    txt: FileText,
    md: FileText,
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    html: FileCode,
    css: FileCode,
    json: FileCode,
    xml: FileCode,
  };

  return iconMap[ext || ''] || File;
}

const TreeNode = memo(function TreeNode({ node, level, onNodeClick }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    if (isFolder && hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    if (isFolder) {
      handleToggle();
    }
  };

  const Icon = isFolder ? (isExpanded ? FolderOpen : Folder) : getFileIcon(node.name);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/50 cursor-pointer group transition-colors',
          level === 0 && 'font-medium'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Expand/collapse chevron */}
        {isFolder && hasChildren && (
          <button
            className="w-4 h-4 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Spacer for files */}
        {(!isFolder || !hasChildren) && <div className="w-4" />}

        {/* Icon */}
        <Icon
          className={cn(
            'w-4 h-4 shrink-0',
            isFolder ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        {/* Name */}
        <span className="flex-1 truncate text-sm">{node.name}</span>

        {/* Size badge */}
        {node.size > 0 && (
          <Badge variant="secondary" className="text-xs font-normal">
            {formatFileSize(node.size)}
          </Badge>
        )}

        {/* Children count for folders */}
        {isFolder && hasChildren && (
          <Badge variant="outline" className="text-xs font-normal">
            {node.children!.length}
          </Badge>
        )}
      </div>

      {/* Children */}
      {isFolder && hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              {...(onNodeClick ? { onNodeClick } : {})}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

export function FolderTree({
  folderStructure,
  showStats = true,
  maxHeight = 400,
  className,
}: FolderTreeProps) {
  const tree = useMemo(() => buildFolderTree(folderStructure), [folderStructure]);
  const stats = useMemo(() => getFolderStats(folderStructure), [folderStructure]);

  const [expandAll, setExpandAll] = useState(false);

  const handleExpandAll = () => {
    setExpandAll(!expandAll);
    // This is a simple implementation - you might want to manage expansion state more explicitly
  };

  return (
    <Card className={cn('overflow-hidden rounded-2xl', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            <h3 className="font-medium">{folderStructure.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="rounded-full"
            >
              {expandAll ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Files</p>
              <p className="text-sm font-medium">{stats.totalFiles}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Folders</p>
              <p className="text-sm font-medium">{stats.totalFolders}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Size</p>
              <p className="text-sm font-medium">{formatFileSize(stats.totalSize)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Depth</p>
              <p className="text-sm font-medium">{stats.depth} levels</p>
            </div>
          </div>
        )}
      </div>

      {/* Tree */}
      <ScrollArea style={{ height: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}>
        <div className="p-2">
          <TreeNode node={tree} level={0} />
        </div>
      </ScrollArea>

      {/* File type breakdown */}
      {showStats && Object.keys(stats.fileTypes).length > 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">File Types</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.fileTypes)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([ext, count]) => (
                <Badge key={ext} variant="secondary" className="text-xs">
                  .{ext} ({count})
                </Badge>
              ))}
            {Object.keys(stats.fileTypes).length > 8 && (
              <Badge variant="secondary" className="text-xs">
                +{Object.keys(stats.fileTypes).length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default FolderTree;
