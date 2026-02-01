'use client';

import * as React from 'react';
import { PageLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatBytes } from '@/lib/utils';
import {
  Download,
  Upload,
  Search,
  Trash2,
  FileIcon,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TransferRecord {
  id: string;
  fileName: string;
  fileSize: number;
  direction: 'sent' | 'received';
  deviceName: string;
  status: 'completed' | 'failed';
  timestamp: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const mockHistory: TransferRecord[] = [
  {
    id: '1',
    fileName: 'presentation.pptx',
    fileSize: 15728640,
    direction: 'sent',
    deviceName: 'MacBook Pro',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '2',
    fileName: 'photo-album.zip',
    fileSize: 524288000,
    direction: 'received',
    deviceName: 'iPhone 15',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: '3',
    fileName: 'document.pdf',
    fileSize: 2097152,
    direction: 'sent',
    deviceName: 'iPad Pro',
    status: 'failed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: '4',
    fileName: 'video.mp4',
    fileSize: 1073741824,
    direction: 'received',
    deviceName: 'Desktop PC',
    status: 'completed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {return `${diffMins}m ago`;}
  if (diffHours < 24) {return `${diffHours}h ago`;}
  if (diffDays < 7) {return `${diffDays}d ago`;}
  return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════════
// HISTORY ITEM
// ═══════════════════════════════════════════════════════════════════════════

interface HistoryItemProps {
  record: TransferRecord;
  onDelete?: () => void;
}

function HistoryItem({ record, onDelete }: HistoryItemProps) {
  const DirectionIcon = record.direction === 'sent' ? Upload : Download;

  return (
    <motion.div
      className="flex items-center gap-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      layout
    >
      {/* File icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)]">
        <FileIcon className="h-5 w-5 text-[var(--color-primary-500)]" />
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-[var(--text-primary)]">
            {record.fileName}
          </p>
          <Badge
            variant={record.status === 'completed' ? 'success' : 'error'}
            size="sm"
          >
            {record.status}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <DirectionIcon className="h-3 w-3" />
            {record.direction === 'sent' ? 'Sent to' : 'Received from'} {record.deviceName}
          </span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span>{formatBytes(record.fileSize)}</span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(record.timestamp)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function HistoryPage() {
  const [history, setHistory] = React.useState<TransferRecord[]>(mockHistory);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'sent' | 'received'>('all');

  // Filter history
  const filteredHistory = history.filter((record) => {
    const matchesSearch = record.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' || record.direction === filter;
    return matchesSearch && matchesFilter;
  });

  // Handle delete
  const handleDelete = React.useCallback((id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Handle clear all
  const handleClearAll = React.useCallback(() => {
    setHistory([]);
  }, []);

  // Stats
  const totalSent = history.filter((r) => r.direction === 'sent').length;
  const totalReceived = history.filter((r) => r.direction === 'received').length;
  const totalSize = history.reduce((sum, r) => sum + r.fileSize, 0);

  return (
    <PageLayout
      title="Transfer History"
      description="View your past file transfers"
      maxWidth="xl"
      actions={
        history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )
      }
    >
      {history.length > 0 ? (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {history.length}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Total Transfers</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {totalSent} / {totalReceived}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Sent / Received</p>
            </Card>
            <Card padding="sm" className="text-center">
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatBytes(totalSize)}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Total Data</p>
            </Card>
          </div>

          {/* Search and filter */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="sm:max-w-xs"
            />
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'sent' ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => setFilter('sent')}
              >
                Sent
              </Button>
              <Button
                variant={filter === 'received' ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => setFilter('received')}
              >
                Received
              </Button>
            </div>
          </div>

          {/* History list */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((record) => (
                <HistoryItem
                  key={record.id}
                  record={record}
                  onDelete={() => handleDelete(record.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filteredHistory.length === 0 && searchQuery && (
            <Card className="py-12 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No transfers match &ldquo;{searchQuery}&rdquo;
              </p>
            </Card>
          )}
        </>
      ) : (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
              <Clock className="h-8 w-8 text-[var(--text-tertiary)]" />
            </div>
            <div>
              <p className="text-lg font-medium text-[var(--text-primary)]">
                No transfer history
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Your file transfer history will appear here
              </p>
            </div>
            <Button variant="primary" leftIcon={<Upload className="h-4 w-4" />}>
              Start a Transfer
            </Button>
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
