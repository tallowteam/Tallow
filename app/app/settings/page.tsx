'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    ArrowLeft,
    Download,
    Trash2,
    Clipboard,
    Globe,
    Users,
    UserMinus,
    ShieldCheck,
    Copy,
    Lock,
    EyeOff,
    AlertTriangle,
    Shield,
    Sun,
    Moon,
    Palette,
    FolderOpen,
    Eye,
    ChevronRight,
    Key,
    RefreshCw,
    Mic,
    MicOff,
    Hand,
    Smartphone,
    Settings,
    Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { getDeviceId } from '@/lib/auth/user-identity';
import { clearHistory } from '@/lib/storage/transfer-history';
import { clearClipboardHistory } from '@/lib/features/clipboard-sync';
import { getProxyConfig, saveProxyConfig, ProxyConfig } from '@/lib/network/proxy-config';
import {
    isFileSystemAccessSupported,
    chooseDownloadDirectory,
    getDownloadDirectoryName,
    resetDownloadDirectory,
} from '@/lib/storage/download-location';
import {
    getFriends,
    removeFriend,
    updateFriendSettings,
    getMyFriendCode,
    formatFriendCode,
    Friend,
    cleanupExpiredRequests,
} from '@/lib/storage/friends';
import { PageTransition } from '@/lib/animations/page-transition';

interface Settings {
    autoAcceptFiles: boolean;
    clipboardSync: boolean;
    notifications: boolean;
    saveLocation: string;
    bandwidthLimit: number;
}

const SETTINGS_KEY = 'tallow_settings';

function getSettings(): Settings {
    if (typeof window === 'undefined') {
        return {
            autoAcceptFiles: false,
            clipboardSync: true,
            notifications: true,
            saveLocation: 'Downloads',
            bandwidthLimit: 0,
        };
    }

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch { }

    return {
        autoAcceptFiles: false,
        clipboardSync: true,
        notifications: true,
        saveLocation: 'Downloads',
        bandwidthLimit: 0,
    };
}

function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Modern Section Card Component
function SectionCard({
    children,
    title,
    icon: Icon,
    description,
    variant = 'default',
    className = '',
}: {
    children: React.ReactNode;
    title: string;
    icon?: React.ElementType;
    description?: string;
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
    className?: string;
}) {
    const variantStyles = {
        default: 'border-[var(--border)] bg-[var(--bg-elevated)]',
        accent: 'border-[var(--accent)]/30 bg-[var(--accent-subtle)]',
        success: 'border-emerald-500/30 bg-emerald-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        danger: 'border-red-500/30 bg-red-500/5',
        info: 'border-[var(--accent)]/30 bg-[var(--accent-subtle)]',
    };

    const iconStyles = {
        default: 'text-[var(--text-secondary)]',
        accent: 'text-[var(--accent)]',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        danger: 'text-red-500',
        info: 'text-[var(--accent)]',
    };

    return (
        <section
            className={`rounded-2xl 3xl:rounded-3xl border p-4 sm:p-6 3xl:p-8 transition-all duration-300 hover:shadow-lg ${variantStyles[variant]} ${className}`}
        >
            <div className="flex items-center gap-3 3xl:gap-4 mb-4 sm:mb-5 3xl:mb-6">
                {Icon && (
                    <div className={`flex items-center justify-center w-10 h-10 3xl:w-12 3xl:h-12 rounded-xl 3xl:rounded-2xl bg-[var(--bg-subtle)] ${iconStyles[variant]}`}>
                        <Icon className="w-5 h-5 3xl:w-6 3xl:h-6" />
                    </div>
                )}
                <div>
                    <h2 className="text-base sm:text-lg 3xl:text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                    {description && (
                        <p className="text-xs sm:text-sm 3xl:text-base text-[var(--text-muted)]">{description}</p>
                    )}
                </div>
            </div>
            {children}
        </section>
    );
}

// Setting Row Component with Toggle
function SettingToggle({
    title,
    description,
    checked,
    onCheckedChange,
    disabled = false,
}: {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between py-3 sm:py-4 3xl:py-5 border-b border-[var(--border)] last:border-0">
            <div className="flex-1 pr-3 sm:pr-4">
                <p className="text-sm sm:text-base 3xl:text-lg font-medium text-[var(--text-primary)]">{title}</p>
                <p className="text-xs sm:text-sm 3xl:text-base text-[var(--text-muted)] mt-0.5">{description}</p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                className="data-[state=checked]:bg-[var(--accent)] shrink-0 h-5 w-9 sm:h-6 sm:w-11 3xl:h-7 3xl:w-12"
            />
        </div>
    );
}

// Option Button Group
function OptionGroup({
    options,
    value,
    onChange,
    disabled = false,
}: {
    options: { label: string; value: string | number }[];
    value: string | number;
    onChange: (value: string | number) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2 3xl:gap-3">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    disabled={disabled}
                    className={`
                        px-3 sm:px-4 3xl:px-5 py-2 3xl:py-2.5 rounded-xl text-xs sm:text-sm 3xl:text-base font-medium transition-all duration-200 touch-target
                        ${value === opt.value
                            ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25'
                            : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] border border-[var(--border)]'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

// Appearance Settings Component
function AppearanceSettings() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
                ))}
            </div>
        );
    }

    const themes = [
        { id: 'light', label: 'Light', icon: Sun },
        { id: 'dark', label: 'Dark', icon: Moon },
        { id: 'system', label: 'System', icon: Palette },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {themes.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTheme(id)}
                        className={`
                            relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                            ${theme === id
                                ? 'border-[var(--accent)] bg-[var(--accent-subtle)] shadow-md shadow-[var(--accent)]/20'
                                : 'border-[var(--border)] bg-[var(--bg-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-inset)]'
                            }
                        `}
                    >
                        <Icon className={`w-6 h-6 ${theme === id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} />
                        <span className={`text-sm font-medium ${theme === id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                            {label}
                        </span>
                        {theme === id && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--accent)]" />
                        )}
                    </button>
                ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">
                Currently using {resolvedTheme === 'dark' ? 'dark' : 'light'} mode
            </p>
        </div>
    );
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        autoAcceptFiles: false,
        clipboardSync: true,
        notifications: true,
        saveLocation: 'Downloads',
        bandwidthLimit: 0,
    });
    const [deviceId, setDeviceIdLocal] = useState('');
    const [proxyConfig, setProxyConfigState] = useState<ProxyConfig>({
        mode: 'auto',
        customTurnServers: [],
        forceRelay: false,
        connectionTimeout: 30000,
        maxRetries: 3,
        retryDelay: 2000,
    });
    const [friends, setFriendsState] = useState<Friend[]>([]);
    const [myFriendCode, setMyFriendCode] = useState('');
    const [friendCodeCopied, setFriendCodeCopied] = useState(false);
    const [advancedPrivacyMode, setAdvancedPrivacyMode] = useState(false);
    const [onionRoutingEnabled, setOnionRoutingEnabled] = useState(false);
    const [onionHopCount, setOnionHopCount] = useState(3);
    const [saveLocationName, setSaveLocationName] = useState<string>('Downloads');
    const [fsAccessSupported, setFsAccessSupported] = useState(false);

    // Security settings
    const [keyRotationInterval, setKeyRotationInterval] = useState(5 * 60 * 1000);
    const [autoVerifyFriends, setAutoVerifyFriends] = useState(true);
    const [verificationMethod, setVerificationMethod] = useState<'emoji' | 'words'>('emoji');
    const [encryptionAlgorithm, setEncryptionAlgorithm] = useState<'aes-256-gcm' | 'chacha20-poly1305'>('aes-256-gcm');

    // Voice Commands settings
    const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
    const [voiceLanguage, setVoiceLanguage] = useState('en-US');
    const [voiceContinuous, setVoiceContinuous] = useState(false);

    // Mobile Gestures settings
    const [gesturesEnabled, setGesturesEnabled] = useState(true);
    const [swipeThreshold, setSwipeThreshold] = useState(100);
    const [pinchZoomEnabled, setPinchZoomEnabled] = useState(true);
    const [pullToRefreshEnabled, setPullToRefreshEnabled] = useState(true);
    const [longPressThreshold, setLongPressThreshold] = useState(500);

    useEffect(() => {
        setSettings(getSettings());
        setDeviceIdLocal(getDeviceId());
        getProxyConfig().then(setProxyConfigState);
        cleanupExpiredRequests();
        setFriendsState(getFriends());
        setMyFriendCode(getMyFriendCode());

        const savedPrivacyMode = localStorage.getItem('tallow_advanced_privacy_mode');
        if (savedPrivacyMode === 'true') {
            setAdvancedPrivacyMode(true);
        }

        const savedOnionRouting = localStorage.getItem('tallow_onion_routing');
        if (savedOnionRouting === 'true') {
            setOnionRoutingEnabled(true);
        }
        const savedHopCount = localStorage.getItem('tallow_onion_hop_count');
        if (savedHopCount) {
            setOnionHopCount(parseInt(savedHopCount, 10));
        }

        const savedRotationInterval = localStorage.getItem('tallow_key_rotation_interval');
        if (savedRotationInterval) {
            setKeyRotationInterval(parseInt(savedRotationInterval, 10));
        }
        const savedAutoVerify = localStorage.getItem('tallow_auto_verify_friends');
        if (savedAutoVerify !== null) {
            setAutoVerifyFriends(savedAutoVerify === 'true');
        }
        const savedVerificationMethod = localStorage.getItem('tallow_verification_method') as 'emoji' | 'words' | null;
        if (savedVerificationMethod) {
            setVerificationMethod(savedVerificationMethod);
        }
        const savedEncryption = localStorage.getItem('tallow_encryption_algorithm') as 'aes-256-gcm' | 'chacha20-poly1305' | null;
        if (savedEncryption) {
            setEncryptionAlgorithm(savedEncryption);
        }

        const savedVoiceEnabled = localStorage.getItem('tallow_voice_commands_enabled');
        if (savedVoiceEnabled !== null) {
            setVoiceCommandsEnabled(savedVoiceEnabled === 'true');
        }
        const savedVoiceLanguage = localStorage.getItem('tallow_voice_language');
        if (savedVoiceLanguage) {
            setVoiceLanguage(savedVoiceLanguage);
        }
        const savedVoiceContinuous = localStorage.getItem('tallow_voice_continuous');
        if (savedVoiceContinuous !== null) {
            setVoiceContinuous(savedVoiceContinuous === 'true');
        }

        const savedGesturesEnabled = localStorage.getItem('tallow_gestures_enabled');
        if (savedGesturesEnabled !== null) {
            setGesturesEnabled(savedGesturesEnabled === 'true');
        }
        const savedSwipeThreshold = localStorage.getItem('tallow_swipe_threshold');
        if (savedSwipeThreshold) {
            setSwipeThreshold(parseInt(savedSwipeThreshold, 10));
        }
        const savedPinchZoom = localStorage.getItem('tallow_pinch_zoom_enabled');
        if (savedPinchZoom !== null) {
            setPinchZoomEnabled(savedPinchZoom === 'true');
        }
        const savedPullToRefresh = localStorage.getItem('tallow_pull_to_refresh_enabled');
        if (savedPullToRefresh !== null) {
            setPullToRefreshEnabled(savedPullToRefresh === 'true');
        }
        const savedLongPressThreshold = localStorage.getItem('tallow_long_press_threshold');
        if (savedLongPressThreshold) {
            setLongPressThreshold(parseInt(savedLongPressThreshold, 10));
        }

        setFsAccessSupported(isFileSystemAccessSupported());
        getDownloadDirectoryName().then(name => {
            if (name) {
                setSaveLocationName(name);
                handleSettingChange('saveLocation', name);
            }
        });
    }, []);

    const handleSettingChange = useCallback((key: keyof Settings, value: boolean | string | number) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
        toast.success('Settings saved');
    }, [settings]);

    const handleClearHistory = useCallback(async () => {
        if (confirm('Are you sure you want to clear all transfer history?')) {
            await clearHistory();
            toast.success('Transfer history cleared');
        }
    }, []);

    const handleClearClipboard = useCallback(() => {
        if (confirm('Clear clipboard sync history?')) {
            clearClipboardHistory();
            toast.success('Clipboard history cleared');
        }
    }, []);

    const handleCopyFriendCode = useCallback(() => {
        navigator.clipboard.writeText(formatFriendCode(myFriendCode));
        setFriendCodeCopied(true);
        toast.success('Friend code copied!');
        setTimeout(() => setFriendCodeCopied(false), 2000);
    }, [myFriendCode]);

    const handleRemoveFriend = useCallback((friendId: string, friendName: string) => {
        if (confirm(`Remove ${friendName} from your friends list?`)) {
            removeFriend(friendId);
            setFriendsState(prev => prev.filter(f => f.id !== friendId));
            toast.success(`Removed ${friendName}`);
        }
    }, []);

    const handleToggleFriendPasscode = useCallback((friendId: string, requirePasscode: boolean) => {
        const updated = updateFriendSettings(friendId, { requirePasscode });
        if (updated) {
            setFriendsState(prev => prev.map(f => f.id === friendId ? updated : f));
            toast.success(requirePasscode ? 'Passcode now required for this friend' : 'Passcode no longer required');
        }
    }, []);

    const handleChooseSaveLocation = useCallback(async () => {
        const name = await chooseDownloadDirectory();
        if (name) {
            setSaveLocationName(name);
            handleSettingChange('saveLocation', name);
            toast.success(`Save location set to "${name}"`);
        }
    }, [handleSettingChange]);

    const handleResetSaveLocation = useCallback(async () => {
        await resetDownloadDirectory();
        setSaveLocationName('Downloads');
        handleSettingChange('saveLocation', 'Downloads');
        toast.success('Save location reset to Downloads');
    }, [handleSettingChange]);

    const handleRemoveAllFriends = useCallback(() => {
        if (confirm('Are you sure you want to remove ALL friends? This cannot be undone.')) {
            friends.forEach(f => removeFriend(f.id));
            setFriendsState([]);
            toast.success('All friends removed');
        }
    }, [friends]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[var(--bg)]">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 3xl:px-12 py-3 sm:py-4 3xl:py-5">
                        <div className="flex items-center gap-4">
                            <Link href="/app">
                                <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-inset)] transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                                </button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-subtle)]">
                                    <Settings className="w-5 h-5 text-[var(--accent)]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
                                    <p className="text-sm text-[var(--text-muted)]">Customize your experience</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 sm:px-6 lg:px-8 3xl:px-12 py-6 sm:py-8 3xl:py-10">
                    <div className="max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto space-y-5 sm:space-y-6 3xl:space-y-8">
                        {/* Device ID Card */}
                        <SectionCard title="Device Identity" icon={Sparkles} variant="accent">
                            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wider">Your Device ID</p>
                                <code className="block text-sm font-mono text-[var(--text-primary)] break-all">
                                    {deviceId}
                                </code>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-3">
                                Your unique device identifier for secure peer-to-peer connections
                            </p>
                        </SectionCard>

                        {/* Privacy & Anonymity Quick Link */}
                        <Link href="/app/privacy-settings" className="block">
                            <div className="group rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-r from-[var(--accent-subtle)] to-transparent p-6 transition-all duration-300 hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent)]/10 group-hover:bg-[var(--accent)]/20 transition-colors">
                                            <Eye className="w-6 h-6 text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Privacy & Anonymity</h2>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                VPN leak detection, Tor support, IP masking
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-[var(--accent)] group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        {/* Appearance Settings */}
                        <SectionCard title="Appearance" icon={Palette} description="Choose your preferred theme">
                            <AppearanceSettings />
                        </SectionCard>

                        {/* Transfer Settings */}
                        <SectionCard title="Transfer Settings" icon={Download} description="Configure file transfer behavior">
                            <div className="space-y-0">
                                <SettingToggle
                                    title="Auto-accept files"
                                    description="Automatically accept incoming transfers from known devices"
                                    checked={settings.autoAcceptFiles}
                                    onCheckedChange={(v) => handleSettingChange('autoAcceptFiles', v)}
                                />

                                <SettingToggle
                                    title="Notifications"
                                    description="Show notifications for transfers"
                                    checked={settings.notifications}
                                    onCheckedChange={(v) => handleSettingChange('notifications', v)}
                                />

                                <div className="py-4 border-b border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="font-medium text-[var(--text-primary)]">Save location</p>
                                            <p className="text-sm text-[var(--text-muted)]">Where received files are saved</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                            <FolderOpen className="w-5 h-5 text-[var(--accent)]" />
                                            <span className="text-sm text-[var(--text-primary)] truncate">{saveLocationName}</span>
                                        </div>
                                        {fsAccessSupported ? (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleChooseSaveLocation}
                                                    className="border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
                                                >
                                                    Choose
                                                </Button>
                                                {saveLocationName !== 'Downloads' && (
                                                    <Button variant="ghost" size="sm" onClick={handleResetSaveLocation}>
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-[var(--text-muted)]">Browser default</span>
                                        )}
                                    </div>
                                    {!fsAccessSupported && (
                                        <p className="text-xs text-[var(--text-muted)] mt-2">
                                            Custom save location requires a Chromium-based browser
                                        </p>
                                    )}
                                </div>

                                <div className="py-4">
                                    <p className="font-medium text-[var(--text-primary)] mb-1">Bandwidth limit</p>
                                    <p className="text-sm text-[var(--text-muted)] mb-3">
                                        Throttle transfer speed to reduce network congestion
                                    </p>
                                    <OptionGroup
                                        options={[
                                            { label: 'Unlimited', value: 0 },
                                            { label: '1 MB/s', value: 1024 * 1024 },
                                            { label: '5 MB/s', value: 5 * 1024 * 1024 },
                                            { label: '10 MB/s', value: 10 * 1024 * 1024 },
                                            { label: '50 MB/s', value: 50 * 1024 * 1024 },
                                        ]}
                                        value={settings.bandwidthLimit}
                                        onChange={(v) => handleSettingChange('bandwidthLimit', v as number)}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Friends Settings */}
                        <SectionCard title="Friends" icon={Users} description="Manage your trusted connections">
                            <div className="space-y-5">
                                {/* Friend Code */}
                                <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--accent-subtle)] to-transparent border border-[var(--accent)]/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Your Friend Code</p>
                                            <code className="text-2xl font-mono font-bold text-[var(--accent)] tracking-widest">
                                                {formatFriendCode(myFriendCode)}
                                            </code>
                                        </div>
                                        <button
                                            onClick={handleCopyFriendCode}
                                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                                        >
                                            {friendCodeCopied ? (
                                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-5 h-5 text-[var(--accent)]" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        Share this code with others so they can add you
                                    </p>
                                </div>

                                {/* Friends List */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-medium text-[var(--text-primary)]">
                                            Your Friends <span className="text-[var(--text-muted)]">({friends.length})</span>
                                        </p>
                                        {friends.length > 0 && (
                                            <button
                                                onClick={handleRemoveAllFriends}
                                                className="text-sm text-red-500 hover:text-red-600 font-medium"
                                            >
                                                Remove All
                                            </button>
                                        )}
                                    </div>

                                    {friends.length === 0 ? (
                                        <div className="text-center py-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                            <Users className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                                            <p className="text-sm text-[var(--text-muted)]">No friends added yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                                            {friends.map((friend) => (
                                                <div
                                                    key={friend.id}
                                                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                                                            <span className="text-sm font-semibold text-[var(--accent)]">
                                                                {friend.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-[var(--text-primary)]">{friend.name}</p>
                                                            <code className="text-xs text-[var(--text-muted)] font-mono">
                                                                {formatFriendCode(friend.friendCode)}
                                                            </code>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <Lock className={`w-4 h-4 ${friend.requirePasscode ? 'text-amber-500' : 'text-[var(--text-muted)]'}`} />
                                                            <Switch
                                                                checked={friend.requirePasscode}
                                                                onCheckedChange={(v) => handleToggleFriendPasscode(friend.id, v)}
                                                                className="data-[state=checked]:bg-[var(--accent)]"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        {/* Clipboard Settings */}
                        <SectionCard title="Clipboard Sync" icon={Clipboard} description="Share clipboard between devices">
                            <SettingToggle
                                title="Enable clipboard sync"
                                description="Share clipboard content between connected devices"
                                checked={settings.clipboardSync}
                                onCheckedChange={(v) => handleSettingChange('clipboardSync', v)}
                            />
                            <Button
                                variant="outline"
                                onClick={handleClearClipboard}
                                className="w-full mt-4 border-[var(--border)] hover:bg-[var(--bg-subtle)]"
                            >
                                Clear Clipboard History
                            </Button>
                        </SectionCard>

                        {/* Security Settings */}
                        <SectionCard title="Security" icon={Shield} variant="success" description="Encryption and verification options">
                            {/* PQC Status */}
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        Post-Quantum Encryption Active
                                    </p>
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Your transfers are protected with ML-KEM-768 + X25519 hybrid encryption
                                </p>
                            </div>

                            {/* Key Rotation */}
                            <div className="py-4 border-b border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-1">
                                    <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
                                    <p className="font-medium text-[var(--text-primary)]">Key Rotation Interval</p>
                                </div>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    How often to rotate session keys for forward secrecy
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: '1 min', value: 1 * 60 * 1000 },
                                        { label: '5 min', value: 5 * 60 * 1000 },
                                        { label: '10 min', value: 10 * 60 * 1000 },
                                        { label: '30 min', value: 30 * 60 * 1000 },
                                    ]}
                                    value={keyRotationInterval}
                                    onChange={(v) => {
                                        setKeyRotationInterval(v as number);
                                        localStorage.setItem('tallow_key_rotation_interval', String(v));
                                        toast.success('Key rotation interval updated');
                                    }}
                                />
                            </div>

                            {/* Auto Verify */}
                            <SettingToggle
                                title="Auto-verify friends"
                                description="Skip verification dialog for trusted friends"
                                checked={autoVerifyFriends}
                                onCheckedChange={(v) => {
                                    setAutoVerifyFriends(v);
                                    localStorage.setItem('tallow_auto_verify_friends', String(v));
                                    toast.success(v ? 'Auto-verify enabled' : 'Auto-verify disabled');
                                }}
                            />

                            {/* Verification Method */}
                            <div className="py-4 border-b border-[var(--border)]">
                                <p className="font-medium text-[var(--text-primary)] mb-1">Verification Method</p>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    How to display Short Authentication Strings (SAS)
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'Emoji Codes', value: 'emoji' },
                                        { label: 'Word Phrases', value: 'words' },
                                    ]}
                                    value={verificationMethod}
                                    onChange={(v) => {
                                        setVerificationMethod(v as 'emoji' | 'words');
                                        localStorage.setItem('tallow_verification_method', v as string);
                                        toast.success(`Verification method: ${v === 'emoji' ? 'Emoji codes' : 'Word phrases'}`);
                                    }}
                                />
                            </div>

                            {/* Encryption Algorithm */}
                            <div className="py-4 border-b border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-1">
                                    <Key className="w-4 h-4 text-[var(--text-secondary)]" />
                                    <p className="font-medium text-[var(--text-primary)]">Encryption Algorithm</p>
                                </div>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    Symmetric encryption for file data
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'AES-256-GCM', value: 'aes-256-gcm' },
                                        { label: 'ChaCha20-Poly1305', value: 'chacha20-poly1305' },
                                    ]}
                                    value={encryptionAlgorithm}
                                    onChange={(v) => {
                                        setEncryptionAlgorithm(v as 'aes-256-gcm' | 'chacha20-poly1305');
                                        localStorage.setItem('tallow_encryption_algorithm', v as string);
                                        toast.success(`Encryption: ${v}`);
                                    }}
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-2">
                                    Both provide military-grade encryption. ChaCha20 may be faster on mobile.
                                </p>
                                {encryptionAlgorithm === 'chacha20-poly1305' && (
                                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            ChaCha20-Poly1305 is in development. Using AES-256-GCM as fallback.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* PQC Status List */}
                            <div className="py-4">
                                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Protection Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        'File Transfers',
                                        'Chat Messages',
                                        'Key Rotation',
                                        'Screen Sharing',
                                        'Signaling Channel',
                                        'Room Communication',
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-2 text-xs">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[var(--text-secondary)]">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>

                        {/* Voice Commands */}
                        <SectionCard title="Voice Commands" icon={Mic} variant="info" description="Control Tallow with your voice">
                            <SettingToggle
                                title="Enable Voice Commands"
                                description="Control Tallow with voice commands using your microphone"
                                checked={voiceCommandsEnabled}
                                onCheckedChange={(v) => {
                                    setVoiceCommandsEnabled(v);
                                    localStorage.setItem('tallow_voice_commands_enabled', String(v));
                                    toast.success(v ? 'Voice commands enabled' : 'Voice commands disabled');
                                }}
                            />

                            <div className="py-4 border-b border-[var(--border)]">
                                <p className="font-medium text-[var(--text-primary)] mb-1">Recognition Language</p>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    Choose the language for voice recognition
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'English (US)', value: 'en-US' },
                                        { label: 'English (UK)', value: 'en-GB' },
                                        { label: 'Spanish', value: 'es-ES' },
                                        { label: 'French', value: 'fr-FR' },
                                        { label: 'German', value: 'de-DE' },
                                        { label: 'Chinese', value: 'zh-CN' },
                                        { label: 'Japanese', value: 'ja-JP' },
                                        { label: 'Korean', value: 'ko-KR' },
                                    ]}
                                    value={voiceLanguage}
                                    onChange={(v) => {
                                        setVoiceLanguage(v as string);
                                        localStorage.setItem('tallow_voice_language', v as string);
                                        toast.success('Voice language updated');
                                    }}
                                    disabled={!voiceCommandsEnabled}
                                />
                            </div>

                            <SettingToggle
                                title="Continuous Listening"
                                description="Keep microphone active for hands-free operation"
                                checked={voiceContinuous}
                                onCheckedChange={(v) => {
                                    setVoiceContinuous(v);
                                    localStorage.setItem('tallow_voice_continuous', String(v));
                                    toast.success(v ? 'Continuous mode enabled' : 'Continuous mode disabled');
                                }}
                                disabled={!voiceCommandsEnabled}
                            />

                            {/* Commands List */}
                            <div className="mt-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                <p className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-[var(--accent)]" />
                                    Available Commands
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        { cmd: '"send file"', desc: 'Initiate transfer' },
                                        { cmd: '"cancel"', desc: 'Cancel transfer' },
                                        { cmd: '"open chat"', desc: 'Open chat' },
                                        { cmd: '"settings"', desc: 'Open settings' },
                                        { cmd: '"help"', desc: 'Show help' },
                                    ].map((item) => (
                                        <div key={item.cmd} className="flex items-center gap-2">
                                            <code className="px-2 py-1 rounded bg-[var(--bg-inset)] text-[var(--accent)] font-mono">{item.cmd}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 p-3 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/20">
                                <p className="text-xs text-[var(--accent)] flex items-center gap-2">
                                    <MicOff className="w-3 h-3" />
                                    Voice commands require microphone permission and work in Chrome, Edge, Safari.
                                </p>
                            </div>
                        </SectionCard>

                        {/* Mobile Gestures */}
                        <SectionCard title="Mobile Gestures" icon={Hand} variant="default" description="Touch controls for mobile devices">
                            <SettingToggle
                                title="Enable Touch Gestures"
                                description="Master switch for all gesture controls"
                                checked={gesturesEnabled}
                                onCheckedChange={(v) => {
                                    setGesturesEnabled(v);
                                    localStorage.setItem('tallow_gestures_enabled', String(v));
                                    toast.success(v ? 'Gestures enabled' : 'Gestures disabled');
                                }}
                            />

                            <div className="py-4 border-b border-[var(--border)]">
                                <p className="font-medium text-[var(--text-primary)] mb-1">Swipe Sensitivity</p>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    Distance required to trigger swipe actions
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'High (50px)', value: 50 },
                                        { label: 'Medium (100px)', value: 100 },
                                        { label: 'Low (150px)', value: 150 },
                                    ]}
                                    value={swipeThreshold}
                                    onChange={(v) => {
                                        setSwipeThreshold(v as number);
                                        localStorage.setItem('tallow_swipe_threshold', String(v));
                                        toast.success('Swipe sensitivity updated');
                                    }}
                                    disabled={!gesturesEnabled}
                                />
                            </div>

                            <SettingToggle
                                title="Pinch to Zoom"
                                description="Enable pinch gesture for zooming images and files"
                                checked={pinchZoomEnabled}
                                onCheckedChange={(v) => {
                                    setPinchZoomEnabled(v);
                                    localStorage.setItem('tallow_pinch_zoom_enabled', String(v));
                                    toast.success(v ? 'Pinch zoom enabled' : 'Pinch zoom disabled');
                                }}
                                disabled={!gesturesEnabled}
                            />

                            <SettingToggle
                                title="Pull to Refresh"
                                description="Pull down to refresh device list and transfers"
                                checked={pullToRefreshEnabled}
                                onCheckedChange={(v) => {
                                    setPullToRefreshEnabled(v);
                                    localStorage.setItem('tallow_pull_to_refresh_enabled', String(v));
                                    toast.success(v ? 'Pull to refresh enabled' : 'Pull to refresh disabled');
                                }}
                                disabled={!gesturesEnabled}
                            />

                            <div className="py-4 border-b border-[var(--border)]">
                                <p className="font-medium text-[var(--text-primary)] mb-1">Long Press Duration</p>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    Time required for long press actions
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'Quick (300ms)', value: 300 },
                                        { label: 'Normal (500ms)', value: 500 },
                                        { label: 'Slow (800ms)', value: 800 },
                                    ]}
                                    value={longPressThreshold}
                                    onChange={(v) => {
                                        setLongPressThreshold(v as number);
                                        localStorage.setItem('tallow_long_press_threshold', String(v));
                                        toast.success('Long press duration updated');
                                    }}
                                    disabled={!gesturesEnabled}
                                />
                            </div>

                            {/* Gesture Guide */}
                            <div className="mt-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                <p className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-[var(--text-secondary)]" />
                                    Available Gestures
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    {[
                                        { gesture: 'Swipe Right', action: 'Go back' },
                                        { gesture: 'Swipe Left', action: 'Dismiss' },
                                        { gesture: 'Swipe Down', action: 'Refresh' },
                                        { gesture: 'Pinch', action: 'Zoom' },
                                        { gesture: 'Long Press', action: 'Context menu' },
                                    ].map((item) => (
                                        <div key={item.gesture} className="flex justify-between">
                                            <span className="font-medium text-[var(--text-primary)]">{item.gesture}</span>
                                            <span className="text-[var(--text-muted)]">{item.action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SectionCard>

                        {/* Advanced Privacy Mode */}
                        <SectionCard title="Advanced Privacy" icon={EyeOff} variant="warning" description="Enhanced anonymity features">
                            <SettingToggle
                                title="Traffic Obfuscation"
                                description="Makes transfers resistant to traffic analysis"
                                checked={advancedPrivacyMode}
                                onCheckedChange={(v) => {
                                    setAdvancedPrivacyMode(v);
                                    localStorage.setItem('tallow_advanced_privacy_mode', String(v));
                                    toast.success(v ? 'Traffic Obfuscation enabled' : 'Traffic Obfuscation disabled');
                                }}
                            />

                            {advancedPrivacyMode && (
                                <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium text-amber-600 dark:text-amber-400">Performance Impact</p>
                                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                                Transfers may be 20-40% slower due to padding, throttling, and decoy traffic.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <SettingToggle
                                title="Onion Routing"
                                description="Route transfers through multiple relays for anonymity"
                                checked={onionRoutingEnabled}
                                onCheckedChange={(v) => {
                                    setOnionRoutingEnabled(v);
                                    localStorage.setItem('tallow_onion_routing', String(v));
                                    toast.success(v ? 'Onion Routing enabled' : 'Onion Routing disabled');
                                }}
                            />

                            {onionRoutingEnabled && (
                                <div className="mt-4 pl-4 border-l-2 border-amber-500/30">
                                    <p className="font-medium text-[var(--text-primary)] mb-2">Number of Hops</p>
                                    <OptionGroup
                                        options={[
                                            { label: '1 hop', value: 1 },
                                            { label: '2 hops', value: 2 },
                                            { label: '3 hops', value: 3 },
                                        ]}
                                        value={onionHopCount}
                                        onChange={(v) => {
                                            setOnionHopCount(v as number);
                                            localStorage.setItem('tallow_onion_hop_count', String(v));
                                            toast.success(`Onion routing: ${v} hop${v !== 1 ? 's' : ''}`);
                                        }}
                                    />
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        More hops = better anonymity but slower transfers
                                    </p>
                                </div>
                            )}

                            {(advancedPrivacyMode || onionRoutingEnabled) && (
                                <div className="mt-5 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                                    <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Active Privacy Features</p>
                                    <ul className="text-xs text-[var(--text-muted)] space-y-1">
                                        {advancedPrivacyMode && <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Traffic Obfuscation (padding, decoys)</li>}
                                        {onionRoutingEnabled && <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Onion Routing ({onionHopCount} hop{onionHopCount > 1 ? 's' : ''})</li>}
                                    </ul>
                                </div>
                            )}
                        </SectionCard>

                        {/* Network Settings */}
                        <SectionCard title="Network" icon={Globe} description="Connection and relay settings">
                            <SettingToggle
                                title="Relay-only mode"
                                description="Route all traffic through relay servers (Tor-friendly)"
                                checked={proxyConfig.forceRelay}
                                onCheckedChange={(v) => {
                                    const updated = { ...proxyConfig, forceRelay: v, mode: v ? 'relay-only' as const : 'auto' as const };
                                    setProxyConfigState(updated);
                                    saveProxyConfig(updated);
                                    toast.success(v ? 'Relay-only mode enabled' : 'Direct connections enabled');
                                }}
                            />

                            <div className="py-4">
                                <p className="font-medium text-[var(--text-primary)] mb-1">Connection Mode</p>
                                <p className="text-sm text-[var(--text-muted)] mb-3">
                                    Auto uses direct when possible, falls back to relay
                                </p>
                                <OptionGroup
                                    options={[
                                        { label: 'Auto', value: 'auto' },
                                        { label: 'Relay Only', value: 'relay-only' },
                                        { label: 'Direct Only', value: 'direct-only' },
                                    ]}
                                    value={proxyConfig.mode}
                                    onChange={(v) => {
                                        const mode = v as 'auto' | 'relay-only' | 'direct-only';
                                        const updated = { ...proxyConfig, mode, forceRelay: mode === 'relay-only' };
                                        setProxyConfigState(updated);
                                        saveProxyConfig(updated);
                                        toast.success(`Connection mode: ${mode}`);
                                    }}
                                />
                            </div>
                        </SectionCard>

                        {/* Danger Zone */}
                        <SectionCard title="Danger Zone" icon={Shield} variant="danger" description="Irreversible actions">
                            <Button
                                variant="outline"
                                onClick={handleClearHistory}
                                className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear Transfer History
                            </Button>
                        </SectionCard>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
}
