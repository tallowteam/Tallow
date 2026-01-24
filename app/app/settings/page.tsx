'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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

interface Settings {
    autoAcceptFiles: boolean;
    clipboardSync: boolean;
    notifications: boolean;
    saveLocation: string;
    bandwidthLimit: number; // bytes per second, 0 = unlimited
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

function AppearanceSettings() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-12 bg-secondary/50 rounded-lg animate-pulse" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-muted-foreground">
                        Choose your preferred color scheme
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                        }`}
                >
                    <Sun className="w-6 h-6" />
                    <span className="text-sm font-medium">Light</span>
                </button>

                <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                        }`}
                >
                    <Moon className="w-6 h-6" />
                    <span className="text-sm font-medium">Dark</span>
                </button>

                <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'system'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                        }`}
                >
                    <Palette className="w-6 h-6" />
                    <span className="text-sm font-medium">System</span>
                </button>
            </div>

            <p className="text-xs text-muted-foreground">
                Current: {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
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

    useEffect(() => {
        setSettings(getSettings());
        setDeviceIdLocal(getDeviceId());
        setProxyConfigState(getProxyConfig());
        cleanupExpiredRequests();
        setFriendsState(getFriends());
        setMyFriendCode(getMyFriendCode());

        const savedPrivacyMode = localStorage.getItem('tallow_advanced_privacy_mode');
        if (savedPrivacyMode === 'true') {
            setAdvancedPrivacyMode(true);
        }

        // Load onion routing settings
        const savedOnionRouting = localStorage.getItem('tallow_onion_routing');
        if (savedOnionRouting === 'true') {
            setOnionRoutingEnabled(true);
        }
        const savedHopCount = localStorage.getItem('tallow_onion_hop_count');
        if (savedHopCount) {
            setOnionHopCount(parseInt(savedHopCount, 10));
        }

        // Check File System Access API support and load saved directory
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
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/app">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <h1 className="heading-sm">Settings</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Device ID */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4">Device ID</h2>
                        <code className="block px-3 py-2 rounded-md bg-secondary text-sm font-mono">
                            {deviceId}
                        </code>
                        <p className="text-xs text-muted-foreground mt-2">
                            Your unique device identifier for this session
                        </p>
                    </Card>

                    {/* Appearance Settings */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Appearance
                        </h2>

                        <AppearanceSettings />
                    </Card>

                    {/* Transfer Settings */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Transfer Settings
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Auto-accept files</p>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically accept incoming transfers from known devices
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.autoAcceptFiles}
                                    onCheckedChange={(v) => handleSettingChange('autoAcceptFiles', v)}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Notifications</p>
                                    <p className="text-sm text-muted-foreground">
                                        Show notifications for transfers
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.notifications}
                                    onCheckedChange={(v) => handleSettingChange('notifications', v)}
                                />
                            </div>

                            <Separator />

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-medium">Save location</p>
                                        <p className="text-sm text-muted-foreground">
                                            Where received files are saved
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-sm">
                                        <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="truncate">{saveLocationName}</span>
                                    </div>
                                    {fsAccessSupported ? (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleChooseSaveLocation}
                                            >
                                                Choose
                                            </Button>
                                            {saveLocationName !== 'Downloads' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleResetSaveLocation}
                                                >
                                                    Reset
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            Browser default
                                        </p>
                                    )}
                                </div>
                                {!fsAccessSupported && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Custom save location requires a Chromium-based browser (Chrome, Edge, etc.)
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-medium">Bandwidth limit</p>
                                        <p className="text-sm text-muted-foreground">
                                            Throttle transfer speed to reduce network congestion
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {[
                                        { label: 'Unlimited', value: 0 },
                                        { label: '1 MB/s', value: 1024 * 1024 },
                                        { label: '5 MB/s', value: 5 * 1024 * 1024 },
                                        { label: '10 MB/s', value: 10 * 1024 * 1024 },
                                        { label: '50 MB/s', value: 50 * 1024 * 1024 },
                                    ].map((opt) => (
                                        <Button
                                            key={opt.value}
                                            variant={settings.bandwidthLimit === opt.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleSettingChange('bandwidthLimit', opt.value)}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Friends Settings */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Friends Settings
                        </h2>

                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium mb-1">Your Friend Code</p>
                                        <p className="text-xs text-muted-foreground">
                                            Share this code with others so they can add you
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-xl font-mono font-bold text-primary tracking-widest">
                                            {formatFriendCode(myFriendCode)}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={handleCopyFriendCode}
                                            className="h-8 w-8"
                                        >
                                            {friendCodeCopied ? (
                                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-medium">Your Friends ({friends.length})</p>
                                    {friends.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive h-7"
                                            onClick={handleRemoveAllFriends}
                                        >
                                            Remove All
                                        </Button>
                                    )}
                                </div>

                                {friends.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No friends added yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {friends.map((friend) => (
                                            <div
                                                key={friend.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                        <span className="text-sm font-medium">
                                                            {friend.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{friend.name}</p>
                                                        <code className="text-xs text-muted-foreground font-mono">
                                                            {formatFriendCode(friend.friendCode)}
                                                        </code>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 mr-2">
                                                        <Lock className={`w-4 h-4 ${friend.requirePasscode ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                                        <Switch
                                                            checked={friend.requirePasscode}
                                                            onCheckedChange={(v) => handleToggleFriendPasscode(friend.id, v)}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                                                    >
                                                        <UserMinus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Clipboard */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clipboard className="w-5 h-5" />
                            Clipboard Sync
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Enable clipboard sync</p>
                                    <p className="text-sm text-muted-foreground">
                                        Share clipboard content between connected devices
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.clipboardSync}
                                    onCheckedChange={(v) => handleSettingChange('clipboardSync', v)}
                                />
                            </div>

                            <Button variant="outline" onClick={handleClearClipboard} className="w-full">
                                Clear Clipboard History
                            </Button>
                        </div>
                    </Card>

                    {/* Advanced Privacy Mode */}
                    <Card className="p-6 rounded-xl border border-amber-500/50 bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <EyeOff className="w-5 h-5 text-amber-500" />
                            Advanced Privacy Mode
                            <span className="text-xs font-normal px-2 py-0.5 bg-amber-500/20 text-amber-600 rounded-full">
                                Experimental
                            </span>
                        </h2>

                        <div className="space-y-4">
                            {/* Traffic Obfuscation */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Traffic Obfuscation</p>
                                    <p className="text-sm text-muted-foreground">
                                        Makes transfers resistant to traffic analysis
                                    </p>
                                </div>
                                <Switch
                                    checked={advancedPrivacyMode}
                                    onCheckedChange={(v) => {
                                        setAdvancedPrivacyMode(v);
                                        localStorage.setItem('tallow_advanced_privacy_mode', String(v));
                                        toast.success(v ? 'Traffic Obfuscation enabled' : 'Traffic Obfuscation disabled');
                                    }}
                                />
                            </div>

                            {advancedPrivacyMode && (
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                        <div className="space-y-2">
                                            <p className="font-medium text-amber-700 dark:text-amber-400">Performance Impact</p>
                                            <p className="text-sm text-muted-foreground">
                                                Transfers may be 20-40% slower due to padding, throttling, and decoy traffic.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Onion Routing - Always visible */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Onion Routing</p>
                                    <p className="text-sm text-muted-foreground">
                                        Route transfers through multiple relays for anonymity
                                    </p>
                                </div>
                                <Switch
                                    checked={onionRoutingEnabled}
                                    onCheckedChange={(v) => {
                                        setOnionRoutingEnabled(v);
                                        localStorage.setItem('tallow_onion_routing', String(v));
                                        toast.success(v ? 'Onion Routing enabled' : 'Onion Routing disabled');
                                    }}
                                />
                            </div>

                            {onionRoutingEnabled && (
                                <div className="pl-4 border-l-2 border-amber-500/30">
                                    <p className="font-medium mb-2">Number of Hops</p>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map((hops) => (
                                            <Button
                                                key={hops}
                                                variant={onionHopCount === hops ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    setOnionHopCount(hops);
                                                    localStorage.setItem('tallow_onion_hop_count', String(hops));
                                                }}
                                            >
                                                {hops} hop{hops > 1 ? 's' : ''}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        More hops = better anonymity but slower transfers
                                    </p>
                                </div>
                            )}

                            {/* Summary */}
                            {(advancedPrivacyMode || onionRoutingEnabled) && (
                                <>
                                    <Separator />
                                    <div className="p-3 rounded-lg bg-secondary/50">
                                        <p className="text-sm font-medium mb-1">Active Privacy Features:</p>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            {advancedPrivacyMode && <li>• Traffic Obfuscation (padding, decoys)</li>}
                                            {onionRoutingEnabled && <li>• Onion Routing ({onionHopCount} hop{onionHopCount > 1 ? 's' : ''})</li>}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Network Settings */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Network Settings
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Relay-only mode</p>
                                    <p className="text-sm text-muted-foreground">
                                        Route all traffic through relay servers (Tor-friendly)
                                    </p>
                                </div>
                                <Switch
                                    checked={proxyConfig.forceRelay}
                                    onCheckedChange={(v) => {
                                        const updated = { ...proxyConfig, forceRelay: v, mode: v ? 'relay-only' as const : 'auto' as const };
                                        setProxyConfigState(updated);
                                        saveProxyConfig(updated);
                                        toast.success(v ? 'Relay-only mode enabled' : 'Direct connections enabled');
                                    }}
                                />
                            </div>

                            <Separator />

                            <div>
                                <p className="font-medium mb-2">Connection mode</p>
                                <div className="flex gap-2">
                                    {(['auto', 'relay-only', 'direct-only'] as const).map((mode) => (
                                        <Button
                                            key={mode}
                                            variant={proxyConfig.mode === mode ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const updated = { ...proxyConfig, mode, forceRelay: mode === 'relay-only' };
                                                setProxyConfigState(updated);
                                                saveProxyConfig(updated);
                                            }}
                                        >
                                            {mode === 'auto' ? 'Auto' : mode === 'relay-only' ? 'Relay Only' : 'Direct Only'}
                                        </Button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Auto: Uses direct when possible, falls back to relay
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="p-6 rounded-xl border border-destructive/50 bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                            <Shield className="w-5 h-5" />
                            Danger Zone
                        </h2>

                        <Button variant="outline" onClick={handleClearHistory} className="w-full">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Transfer History
                        </Button>
                    </Card>
                </div>
            </main>
        </div>
    );
}
