'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
    CheckCircle2,
    XCircle,
    Loader2,
    Zap,
    MoreVertical,
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
import { PageTransition } from '@/lib/animations/page-transition';

// Status badge component with micro-interactions
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, {
        bg: string;
        text: string;
        icon: React.ReactNode;
        glow: string;
    }> = {
        completed: {
            bg: 'bg-[var(--success-subtle)]',
            text: 'text-[var(--success)]',
            icon: <CheckCircle2 className="w-3 h-3" />,
            glow: 'shadow-[0_0_12px_var(--success-subtle)]',
        },
        failed: {
            bg: 'bg-[var(--error-subtle)]',
            text: 'text-[var(--error)]',
            icon: <XCircle className="w-3 h-3" />,
            glow: 'shadow-[0_0_12px_var(--error-subtle)]',
        },
        cancelled: {
            bg: 'bg-[var(--warning-subtle)]',
            text: 'text-[var(--warning)]',
            icon: <XCircle className="w-3 h-3" />,
            glow: '',
        },
        pending: {
            bg: 'bg-[var(--accent-subtle)]',
            text: 'text-[var(--accent)]',
            icon: <Loader2 className="w-3 h-3 animate-spin" />,
            glow: 'shadow-[0_0_12px_var(--accent-subtle)]',
        },
    };

    const config = statusConfig[status] ?? statusConfig['pending'];

    return (
        <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
            ${config?.bg ?? ''} ${config?.text ?? ''} ${config?.glow ?? ''}
            transition-all duration-300 hover:scale-105
        `}>
            {config?.icon}
            <span className="capitalize">{status}</span>
        </span>
    );
}

// Stat card component
function StatCard({
    icon: Icon,
    value,
    label,
    accentColor = 'var(--accent)',
    delay = 0
}: {
    icon: React.ElementType;
    value: string;
    label: string;
    accentColor?: string;
    delay?: number;
}) {
    return (
        <div
            className="group relative overflow-hidden rounded-xl sm:rounded-2xl 3xl:rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 sm:p-5 3xl:p-6
                       transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]
                       hover:-translate-y-1 animate-fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Accent line on top */}
            <div
                className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
            />

            <div className="flex items-center gap-3 sm:gap-4 3xl:gap-5">
                <div
                    className="w-10 h-10 sm:w-12 sm:h-12 3xl:w-14 3xl:h-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{
                        background: `${accentColor}15`,
                        boxShadow: `0 0 0 0 ${accentColor}20`
                    }}
                >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 3xl:w-7 3xl:h-7" style={{ color: accentColor }} />
                </div>
                <div>
                    <p className="text-xl sm:text-2xl 3xl:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        {value}
                    </p>
                    <p className="text-xs sm:text-sm 3xl:text-base text-[var(--text-muted)] font-medium">
                        {label}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Transfer list item with micro-interactions
function TransferItem({
    transfer,
    onDelete,
    index
}: {
    transfer: TransferRecord;
    onDelete: (id: string) => void;
    index: number;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const formatDuration = (ms: number) => {
        if (ms < 1000) {return `${ms}ms`;}
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) {return `${seconds}s`;}
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div
            className="group relative rounded-xl 3xl:rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3 sm:p-4 3xl:p-5
                       transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)]
                       hover:-translate-y-0.5 animate-fade-up"
            style={{ animationDelay: `${index * 50}ms` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowActions(false); }}
        >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
                {/* Left: Icon and Info */}
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Direction Icon */}
                    <div className={`
                        relative w-10 h-10 sm:w-11 sm:h-11 3xl:w-14 3xl:h-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl flex items-center justify-center flex-shrink-0
                        transition-all duration-300
                        ${transfer.direction === 'send'
                            ? 'bg-[var(--success-subtle)]'
                            : 'bg-[var(--accent-subtle)]'
                        }
                        ${isHovered ? 'scale-110' : ''}
                    `}>
                        {transfer.direction === 'send' ? (
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 text-[var(--success)]" />
                        ) : (
                            <Download className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6 text-[var(--accent)]" />
                        )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base 3xl:text-lg font-semibold text-[var(--text-primary)] truncate">
                            {transfer.files.length === 1
                                ? transfer.files[0]?.name || 'Unknown file'
                                : `${transfer.files.length} files`}
                        </p>
                        <p className="text-xs sm:text-sm 3xl:text-base text-[var(--text-muted)] mt-0.5">
                            {transfer.direction === 'send' ? 'Sent to' : 'Received from'}{' '}
                            <span className="text-[var(--text-secondary)] font-medium">
                                {transfer.peerName}
                            </span>
                        </p>

                        {/* Meta badges */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5">
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md
                                           bg-[var(--bg-subtle)] text-[10px] sm:text-xs 3xl:text-sm text-[var(--text-muted)] font-medium">
                                <FileText className="w-3 h-3 3xl:w-4 3xl:h-4" />
                                {formatDataSize(transfer.totalSize)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md
                                           bg-[var(--bg-subtle)] text-xs text-[var(--text-muted)] font-medium">
                                <Zap className="w-3 h-3" />
                                {formatDuration(transfer.duration)}
                            </span>
                            <StatusBadge status={transfer.status} />
                        </div>
                    </div>
                </div>

                {/* Right: Time and Actions */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {formatTime(transfer.startedAt)}
                    </span>

                    {/* Actions */}
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`w-8 h-8 rounded-lg transition-all duration-200
                                       ${isHovered ? 'opacity-100' : 'opacity-0'}
                                       hover:bg-[var(--error-subtle)] hover:text-[var(--error)]`}
                            onClick={() => setShowActions(!showActions)}
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>

                        {showActions && (
                            <div className="absolute right-0 top-full mt-1 z-10 min-w-[120px]
                                           rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]
                                           shadow-[var(--shadow-lg)] animate-scale-in overflow-hidden">
                                <button
                                    onClick={() => onDelete(transfer.id)}
                                    className="w-full px-3 py-2 text-sm text-left text-[var(--error)]
                                             hover:bg-[var(--error-subtle)] transition-colors duration-150
                                             flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Filter button component
function FilterButton({
    active,
    onClick,
    children,
    icon: Icon
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon?: React.ElementType;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-300
                ${active
                    ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-glow)]'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]'
                }
            `}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
}

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
        if (filter !== 'all' && t.direction !== filter) {return false;}

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesFile = t.files.some(f => f.name.toLowerCase().includes(query));
            const matchesPeer = t.peerName.toLowerCase().includes(query);
            if (!matchesFile && !matchesPeer) {return false;}
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

        if (dateStr === today) {return 'Today';}
        if (dateStr === yesterday) {return 'Yesterday';}
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[var(--bg)]">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-xl">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 3xl:px-12 py-3 sm:py-4 3xl:py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/app">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-xl hover:bg-[var(--bg-subtle)] transition-all duration-200"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                                <div>
                                    <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                                        Transfer History
                                    </h1>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {transfers.length} total transfers
                                    </p>
                                </div>
                            </div>

                            {transfers.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="rounded-full border-[var(--border)] hover:border-[var(--error)]
                                             hover:text-[var(--error)] hover:bg-[var(--error-subtle)]
                                             transition-all duration-300"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 sm:px-6 lg:px-8 3xl:px-12 py-6 sm:py-8 3xl:py-10">
                    <div className="max-w-5xl 3xl:max-w-6xl 4xl:max-w-7xl mx-auto space-y-6 sm:space-y-8 3xl:space-y-10">

                        {/* Stats Grid */}
                        {stats && stats.totalTransfers > 0 && (
                            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 3xl:gap-6">
                                <StatCard
                                    icon={FileText}
                                    value={stats.totalTransfers.toString()}
                                    label="Total Transfers"
                                    accentColor="var(--accent)"
                                    delay={0}
                                />
                                <StatCard
                                    icon={Upload}
                                    value={formatDataSize(stats.totalDataSent)}
                                    label="Data Sent"
                                    accentColor="var(--success)"
                                    delay={100}
                                />
                                <StatCard
                                    icon={Download}
                                    value={formatDataSize(stats.totalDataReceived)}
                                    label="Data Received"
                                    accentColor="#fefefc"
                                    delay={200}
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    value={`${formatDataSize(stats.averageSpeed)}/s`}
                                    label="Average Speed"
                                    accentColor="var(--warning)"
                                    delay={300}
                                />
                            </div>
                        )}

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                <Input
                                    placeholder="Search files or devices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 h-11 rounded-xl bg-[var(--bg-subtle)] border-[var(--border)]
                                             focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]
                                             transition-all duration-300"
                                />
                            </div>

                            {/* Filter Pills */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[var(--text-muted)] mr-1" />
                                <FilterButton
                                    active={filter === 'all'}
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </FilterButton>
                                <FilterButton
                                    active={filter === 'send'}
                                    onClick={() => setFilter('send')}
                                    icon={Upload}
                                >
                                    Sent
                                </FilterButton>
                                <FilterButton
                                    active={filter === 'receive'}
                                    onClick={() => setFilter('receive')}
                                    icon={Download}
                                >
                                    Received
                                </FilterButton>
                            </div>
                        </div>

                        {/* Transfer List */}
                        {isLoading ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-16 text-center">
                                <Loader2 className="w-10 h-10 text-[var(--accent)] mx-auto mb-4 animate-spin" />
                                <p className="text-[var(--text-muted)]">Loading history...</p>
                            </div>
                        ) : filteredTransfers.length === 0 ? (
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-16 text-center
                                          animate-fade-up">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-[var(--text-muted)]" />
                                </div>
                                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                                    No Transfer History
                                </h3>
                                <p className="text-[var(--text-muted)] max-w-sm mx-auto">
                                    {searchQuery
                                        ? 'No transfers match your search criteria'
                                        : 'Your file transfer history will appear here once you start sharing files'}
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="h-[600px] pr-2">
                                <div className="space-y-8">
                                    {Object.entries(groupedTransfers).map(([date, dayTransfers]) => (
                                        <div key={date} className="animate-fade-up">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                                                    <Calendar className="w-4 h-4 text-[var(--accent)]" />
                                                </div>
                                                <h3 className="font-semibold text-sm text-[var(--text-secondary)] uppercase tracking-wide">
                                                    {formatDate(new Date(date))}
                                                </h3>
                                                <div className="flex-1 h-px bg-[var(--border)]" />
                                                <span className="text-xs text-[var(--text-muted)] font-medium">
                                                    {dayTransfers.length} transfer{dayTransfers.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>

                                            {/* Transfer Items */}
                                            <div className="space-y-3">
                                                {dayTransfers.map((transfer, index) => (
                                                    <TransferItem
                                                        key={transfer.id}
                                                        transfer={transfer}
                                                        onDelete={handleDelete}
                                                        index={index}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
