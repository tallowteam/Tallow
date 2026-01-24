'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ArrowLeft,
    Upload,
    Download,
    Search,
    Trash2,
    FileText,
    Clock,
    TrendingUp,
    Calendar,
    Filter,
} from 'lucide-react';
import {
    TransferRecord,
    getAllTransfers,
    getTransferStats,
    deleteTransfer,
    clearHistory,
    formatDataSize,
} from '@/lib/storage/transfer-history';
import { secureLog } from '@/lib/utils/secure-logger';

export default function HistoryPage() {
    const [transfers, setTransfers] = useState<TransferRecord[]>([]);
    const [stats, setStats] = useState<{
        totalTransfers: number;
        totalSent: number;
        totalReceived: number;
        totalDataSent: number;
        totalDataReceived: number;
        averageSpeed: number;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'send' | 'receive'>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                const [allTransfers, allStats] = await Promise.all([
                    getAllTransfers(),
                    getTransferStats(),
                ]);
                setTransfers(allTransfers);
                setStats(allStats);
            } catch (error) {
                secureLog.error('Failed to load history:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Filter transfers
    const filteredTransfers = transfers.filter(t => {
        // Direction filter
        if (filter !== 'all' && t.direction !== filter) return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesFile = t.files.some(f => f.name.toLowerCase().includes(query));
            const matchesPeer = t.peerName.toLowerCase().includes(query);
            if (!matchesFile && !matchesPeer) return false;
        }

        return true;
    });

    // Group by date
    const groupedTransfers = filteredTransfers.reduce((acc, transfer) => {
        const date = transfer.startedAt.toDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(transfer);
        return acc;
    }, {} as Record<string, TransferRecord[]>);

    const handleDelete = useCallback(async (id: string) => {
        await deleteTransfer(id);
        setTransfers(prev => prev.filter(t => t.id !== id));
    }, []);

    const handleClearAll = useCallback(async () => {
        if (confirm('Are you sure you want to clear all transfer history?')) {
            await clearHistory();
            setTransfers([]);
        }
    }, []);

    const formatDate = (date: Date) => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const dateStr = date.toDateString();

        if (dateStr === today) return 'Today';
        if (dateStr === yesterday) return 'Yesterday';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Minimal Header - Euveka Style */}
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/app">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <h1 className="heading-sm">Transfer History</h1>
                        </div>

                        {transfers.length > 0 && (
                            <Button variant="outline" size="sm" onClick={handleClearAll}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Stats */}
                    {stats && stats.totalTransfers > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="card-feature p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="stat-number text-2xl">{stats.totalTransfers}</p>
                                        <p className="label">Total Transfers</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-feature p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="stat-number text-2xl">{formatDataSize(stats.totalDataSent)}</p>
                                        <p className="label">Sent</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-feature p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                        <Download className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="stat-number text-2xl">{formatDataSize(stats.totalDataReceived)}</p>
                                        <p className="label">Received</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-feature p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="stat-number text-2xl">{formatDataSize(stats.averageSpeed)}/s</p>
                                        <p className="label">Avg Speed</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files or devices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className={filter !== 'all' ? 'text-foreground border-border hover:bg-muted' : ''}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'send' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('send')}
                                className={filter !== 'send' ? 'text-foreground border-border hover:bg-muted' : ''}
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Sent
                            </Button>
                            <Button
                                variant={filter === 'receive' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('receive')}
                                className={filter !== 'receive' ? 'text-foreground border-border hover:bg-muted' : ''}
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Received
                            </Button>
                        </div>
                    </div>

                    {/* Transfer List */}
                    {isLoading ? (
                        <Card className="p-12 rounded-xl border border-border bg-card text-center">
                            <p className="text-muted-foreground">Loading history...</p>
                        </Card>
                    ) : filteredTransfers.length === 0 ? (
                        <Card className="p-12 rounded-xl border border-border bg-card text-center">
                            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Transfer History</h3>
                            <p className="text-muted-foreground">
                                {searchQuery ? 'No transfers match your search' : 'Your transfer history will appear here'}
                            </p>
                        </Card>
                    ) : (
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-6">
                                {Object.entries(groupedTransfers).map(([date, dayTransfers]) => (
                                    <div key={date}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-sm text-muted-foreground">
                                                {formatDate(new Date(date))}
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            {dayTransfers.map((transfer) => (
                                                <Card key={transfer.id} className="p-4 rounded-xl border border-border bg-card">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transfer.direction === 'send'
                                                                ? 'bg-green-500/20'
                                                                : 'bg-blue-500/20'
                                                                }`}>
                                                                {transfer.direction === 'send' ? (
                                                                    <Upload className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <Download className="w-5 h-5 text-blue-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {transfer.files.length === 1
                                                                        ? transfer.files[0].name
                                                                        : `${transfer.files.length} files`}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {transfer.direction === 'send' ? 'To' : 'From'}{' '}
                                                                    <span className="font-medium">{transfer.peerName}</span>
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {formatDataSize(transfer.totalSize)}
                                                                    </Badge>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {formatDuration(transfer.duration)}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant={transfer.status === 'completed' ? 'default' : 'destructive'}
                                                                        className="text-xs"
                                                                    >
                                                                        {transfer.status}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(transfer.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-foreground" />
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </main >
        </div >
    );
}
