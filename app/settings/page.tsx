'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSettingsStore } from '@/lib/stores';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '@/components/theme';
import { notificationSounds } from '@/lib/audio/notification-sounds';
import {
  Settings as SettingsIcon,
  Info,
  Github,
  ExternalLink,
  Copy,
  Check,
  Sun,
  Moon,
  Contrast,
  Eye,
  User,
  Palette,
  Shield,
  Bell,
  Zap,
} from '@/components/icons';
import styles from './page.module.css';

type Section = 'profile' | 'appearance' | 'privacy' | 'connection' | 'notifications' | 'about';

export default function SettingsPage() {
  const {
    deviceName,
    deviceId,
    stripMetadata,
    ipLeakProtection,
    onionRoutingEnabled,
    allowLocalDiscovery,
    allowInternetP2P,
    temporaryVisibility,
    guestMode,
    autoAcceptFromFriends,
    saveLocation,
    maxConcurrentTransfers,
    notificationSound,
    notificationVolume,
    browserNotifications,
    notifyOnTransferComplete,
    notifyOnIncomingTransfer,
    notifyOnConnectionChange,
    notifyOnDeviceDiscovered,
    silentHoursEnabled,
    silentHoursStart,
    silentHoursEnd,
    setDeviceName,
    setStripMetadata,
    setIpLeakProtection,
    setOnionRoutingEnabled,
    setAllowLocalDiscovery,
    setAllowInternetP2P,
    setTemporaryVisibility,
    setGuestMode,
    setAutoAcceptFromFriends,
    setSaveLocation,
    setMaxConcurrentTransfers,
    setNotificationSound,
    setNotificationVolume,
    setBrowserNotifications,
    setNotifyOnTransferComplete,
    setNotifyOnIncomingTransfer,
    setNotifyOnConnectionChange,
    setNotifyOnDeviceDiscovered,
    setSilentHoursEnabled,
    setSilentHoursStart,
    setSilentHoursEnd,
    resetToDefaults,
  } = useSettingsStore(
    useShallow((state) => ({
      deviceName: state.deviceName,
      deviceId: state.deviceId,
      stripMetadata: state.stripMetadata,
      ipLeakProtection: state.ipLeakProtection,
      onionRoutingEnabled: state.onionRoutingEnabled,
      allowLocalDiscovery: state.allowLocalDiscovery,
      allowInternetP2P: state.allowInternetP2P,
      temporaryVisibility: state.temporaryVisibility,
      guestMode: state.guestMode,
      autoAcceptFromFriends: state.autoAcceptFromFriends,
      saveLocation: state.saveLocation,
      maxConcurrentTransfers: state.maxConcurrentTransfers,
      notificationSound: state.notificationSound,
      notificationVolume: state.notificationVolume,
      browserNotifications: state.browserNotifications,
      notifyOnTransferComplete: state.notifyOnTransferComplete,
      notifyOnIncomingTransfer: state.notifyOnIncomingTransfer,
      notifyOnConnectionChange: state.notifyOnConnectionChange,
      notifyOnDeviceDiscovered: state.notifyOnDeviceDiscovered,
      silentHoursEnabled: state.silentHoursEnabled,
      silentHoursStart: state.silentHoursStart,
      silentHoursEnd: state.silentHoursEnd,
      setDeviceName: state.setDeviceName,
      setStripMetadata: state.setStripMetadata,
      setIpLeakProtection: state.setIpLeakProtection,
      setOnionRoutingEnabled: state.setOnionRoutingEnabled,
      setAllowLocalDiscovery: state.setAllowLocalDiscovery,
      setAllowInternetP2P: state.setAllowInternetP2P,
      setTemporaryVisibility: state.setTemporaryVisibility,
      setGuestMode: state.setGuestMode,
      setAutoAcceptFromFriends: state.setAutoAcceptFromFriends,
      setSaveLocation: state.setSaveLocation,
      setMaxConcurrentTransfers: state.setMaxConcurrentTransfers,
      setNotificationSound: state.setNotificationSound,
      setNotificationVolume: state.setNotificationVolume,
      setBrowserNotifications: state.setBrowserNotifications,
      setNotifyOnTransferComplete: state.setNotifyOnTransferComplete,
      setNotifyOnIncomingTransfer: state.setNotifyOnIncomingTransfer,
      setNotifyOnConnectionChange: state.setNotifyOnConnectionChange,
      setNotifyOnDeviceDiscovered: state.setNotifyOnDeviceDiscovered,
      setSilentHoursEnabled: state.setSilentHoursEnabled,
      setSilentHoursStart: state.setSilentHoursStart,
      setSilentHoursEnd: state.setSilentHoursEnd,
      resetToDefaults: state.resetToDefaults,
    }))
  );

  const { theme, setTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [localDeviceName, setLocalDeviceName] = useState(deviceName);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Refs for scrolling
  const profileRef = useRef<HTMLElement>(null);
  const appearanceRef = useRef<HTMLElement>(null);
  const privacyRef = useRef<HTMLElement>(null);
  const connectionRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);

  // Sync notification volume changes to the audio system
  useEffect(() => {
    notificationSounds.setVolume(notificationVolume ?? 0.3);
    notificationSounds.setMuted(!notificationSound);
  }, [notificationVolume, notificationSound]);

  // Test sound playback
  const handleTestSound = async () => {
    if (notificationSound) {
      await notificationSounds.playTransferComplete();
    }
  };

  // Update local device name when store changes
  useEffect(() => {
    setLocalDeviceName(deviceName);
  }, [deviceName]);

  const handleDeviceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDeviceName(e.target.value);
  };

  const handleDeviceNameBlur = () => {
    if (localDeviceName.trim() !== deviceName) {
      setDeviceName(localDeviceName.trim() || 'My Device');
    }
  };

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy device ID:', err);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      setLocalDeviceName(deviceName);
    }
  };

  const scrollToSection = (section: Section) => {
    setActiveSection(section);
    const refs: Record<Section, React.RefObject<HTMLElement | null>> = {
      profile: profileRef,
      appearance: appearanceRef,
      privacy: privacyRef,
      connection: connectionRef,
      notifications: notificationsRef,
      about: aboutRef,
    };
    refs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Intersection observer to update active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as Section;
            setActiveSection(id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-100px 0px -50% 0px' }
    );

    const sections = [profileRef, appearanceRef, privacyRef, connectionRef, notificationsRef, aboutRef];
    sections.forEach((ref) => {
      if (ref.current) {observer.observe(ref.current);}
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className={styles.main}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.iconWrapper}>
                <SettingsIcon className={styles.headerIcon} />
              </div>
              <div>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.description}>
                  Manage your device settings and preferences
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleResetSettings}>
              Reset to Defaults
            </Button>
          </div>

          {/* Two-column layout */}
          <div className={styles.layout}>
            {/* Sidebar Navigation */}
            <aside className={styles.sidebar} aria-label="Settings navigation">
              <nav className={styles.sidebarNav}>
                <button
                  className={`${styles.navItem} ${activeSection === 'profile' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('profile')}
                >
                  <User className={styles.navIcon} />
                  <span>Profile</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'appearance' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('appearance')}
                >
                  <Palette className={styles.navIcon} />
                  <span>Appearance</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'privacy' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('privacy')}
                >
                  <Shield className={styles.navIcon} />
                  <span>Privacy</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'connection' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('connection')}
                >
                  <Zap className={styles.navIcon} />
                  <span>Connection</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'notifications' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('notifications')}
                >
                  <Bell className={styles.navIcon} />
                  <span>Notifications</span>
                </button>
                <button
                  className={`${styles.navItem} ${activeSection === 'about' ? styles.navItemActive : ''}`}
                  onClick={() => scrollToSection('about')}
                >
                  <Info className={styles.navIcon} />
                  <span>About</span>
                </button>
              </nav>
            </aside>

            {/* Content Area */}
            <div className={styles.content}>
              {/* Profile Section */}
              <section id="profile" ref={profileRef} className={styles.section}>
                <Card>
                  <CardHeader
                    title="Profile"
                    description="Configure your device identity and information"
                  />
                  <CardContent>
                    <div className={styles.profileContent}>
                      <div className={styles.deviceIcon}>
                        <SettingsIcon />
                      </div>
                      <div className={styles.deviceInfo}>
                        <div className={styles.settingGroup}>
                          <Input
                            label="Device Name"
                            value={localDeviceName}
                            onChange={handleDeviceNameChange}
                            onBlur={handleDeviceNameBlur}
                            placeholder="My Device"
                            helperText="This name will be visible to other devices"
                          />
                        </div>

                        <div className={styles.settingGroup}>
                          <label className={styles.label}>Device ID</label>
                          <div className={styles.deviceIdWrapper}>
                            <code className={styles.deviceId}>{mounted ? deviceId : '...'}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={copied ? <Check /> : <Copy />}
                              onClick={handleCopyDeviceId}
                              title="Copy device ID"
                              aria-label="Copy device ID"
                            >
                              {copied ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                          <p className={styles.helperText}>
                            Unique identifier for this device (read-only)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Appearance Section */}
              <section id="appearance" ref={appearanceRef} className={styles.section}>
                <Card>
                  <CardHeader
                    title="Appearance"
                    description="Customize the look and feel of the app"
                  />
                  <CardContent>
                    <div className={styles.settingGroup}>
                      <label className={styles.label}>Theme</label>
                      <div className={styles.themeGrid}>
                        <button
                          className={`${styles.themeCard} ${theme === 'dark' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('dark')}
                          aria-label="Dark theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewDark}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Moon className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>Dark</span>
                            {theme === 'dark' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>

                        <button
                          className={`${styles.themeCard} ${theme === 'light' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('light')}
                          aria-label="Light theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewLight}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Sun className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>Light</span>
                            {theme === 'light' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>

                        <button
                          className={`${styles.themeCard} ${theme === 'forest' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('forest')}
                          aria-label="Forest theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewForest}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Palette className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>Forest</span>
                            {theme === 'forest' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>

                        <button
                          className={`${styles.themeCard} ${theme === 'ocean' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('ocean')}
                          aria-label="Ocean theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewOcean}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Zap className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>Ocean</span>
                            {theme === 'ocean' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>

                        <button
                          className={`${styles.themeCard} ${theme === 'high-contrast' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('high-contrast')}
                          aria-label="High contrast theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewHighContrast}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Contrast className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>High Contrast</span>
                            {theme === 'high-contrast' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>

                        <button
                          className={`${styles.themeCard} ${theme === 'colorblind' ? styles.themeCardActive : ''}`}
                          onClick={() => setTheme('colorblind')}
                          aria-label="Colorblind theme"
                        >
                          <div className={styles.themePreview}>
                            <div className={`${styles.themePreviewBg} ${styles.themePreviewColorblind}`}>
                              <div className={styles.themePreviewWindow}>
                                <div className={styles.themePreviewHeader} />
                                <div className={styles.themePreviewContent}>
                                  <div className={styles.themePreviewLine} />
                                  <div className={styles.themePreviewLine} />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.themeCardContent}>
                            <Eye className={styles.themeIcon} />
                            <span className={styles.themeCardTitle}>Colorblind</span>
                            {theme === 'colorblind' && (
                              <Check className={styles.themeCardCheck} />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Privacy & Security Section */}
              <section id="privacy" ref={privacyRef} className={styles.section}>
                <Card>
                  <CardHeader
                    title="Privacy & Security"
                    description="Control your privacy and security settings"
                  />
                  <CardContent>
                    <div className={styles.settingsList}>
                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Strip metadata from files
                          </div>
                          <div className={styles.settingDescription}>
                            Remove EXIF data and other metadata before sending files
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={stripMetadata}
                            onChange={(e) => setStripMetadata(e.target.checked)}
                            aria-label="Strip metadata from files"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>IP leak protection</div>
                          <div className={styles.settingDescription}>
                            Prevent WebRTC from exposing your real IP address
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={ipLeakProtection}
                            onChange={(e) => setIpLeakProtection(e.target.checked)}
                            aria-label="IP leak protection"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Guest mode
                            {guestMode && (
                              <Badge variant="info" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className={styles.settingDescription}>
                            One-time sharing without saving history or device cache
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={guestMode}
                            onChange={(e) => setGuestMode(e.target.checked)}
                            aria-label="Guest mode"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Connection Settings Section */}
              <section id="connection" ref={connectionRef} className={styles.section}>
                <Card>
                  <CardHeader
                    title="Connection Settings"
                    description="Configure how your device connects to others"
                  />
                  <CardContent>
                    <div className={styles.settingsList}>
                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Onion routing (3-hop)
                            {onionRoutingEnabled && (
                              <Badge variant="success" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className={styles.settingDescription}>
                            Route traffic through multiple relays for enhanced anonymity
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={onionRoutingEnabled}
                            onChange={(e) => setOnionRoutingEnabled(e.target.checked)}
                            aria-label="Onion routing"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Allow local network discovery
                          </div>
                          <div className={styles.settingDescription}>
                            Enable mDNS to discover devices on your local network
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={allowLocalDiscovery}
                            onChange={(e) => setAllowLocalDiscovery(e.target.checked)}
                            aria-label="Allow local network discovery"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Allow internet P2P connections
                          </div>
                          <div className={styles.settingDescription}>
                            Enable connections to devices outside your local network
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={allowInternetP2P}
                            onChange={(e) => setAllowInternetP2P(e.target.checked)}
                            aria-label="Allow internet P2P connections"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Temporary visibility
                            {temporaryVisibility && (
                              <Badge variant="warning" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className={styles.settingDescription}>
                            Only visible on network while app tab is active and focused
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={temporaryVisibility}
                            onChange={(e) => setTemporaryVisibility(e.target.checked)}
                            aria-label="Temporary visibility"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      <div className={styles.settingItem}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Auto-accept from trusted friends
                          </div>
                          <div className={styles.settingDescription}>
                            Automatically accept files from your trusted contacts
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={autoAcceptFromFriends}
                            onChange={(e) => setAutoAcceptFromFriends(e.target.checked)}
                            aria-label="Auto-accept from trusted friends"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>
                    </div>

                    <div className={styles.settingGroup}>
                      <Input
                        label="Save location"
                        value={saveLocation}
                        onChange={(e) => setSaveLocation(e.target.value)}
                        placeholder="Downloads"
                        helperText="Default folder for saving received files"
                      />
                    </div>

                    <div className={styles.settingGroup}>
                      <label className={styles.label}>Maximum concurrent transfers</label>
                      <select
                        className={styles.select}
                        value={maxConcurrentTransfers}
                        onChange={(e) =>
                          setMaxConcurrentTransfers(Number(e.target.value) as 1 | 2 | 3 | 5)
                        }
                        aria-label="Maximum concurrent transfers"
                      >
                        <option value={1}>1 transfer</option>
                        <option value={2}>2 transfers</option>
                        <option value={3}>3 transfers</option>
                        <option value={5}>5 transfers</option>
                      </select>
                      <p className={styles.helperText}>
                        Maximum number of simultaneous file transfers
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Notification Settings Section */}
              <section id="notifications" ref={notificationsRef} className={styles.section}>
                <Card>
                  <CardHeader
                    title="Notifications"
                    description="Control when and how you receive notifications"
                  />
                  <CardContent>
                    <div className={styles.notificationGrid}>
                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Sound notifications</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={notificationSound}
                              onChange={(e) => setNotificationSound(e.target.checked)}
                              aria-label="Sound notifications"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Play a sound when you receive notifications
                        </div>
                      </div>

                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Browser notifications</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={browserNotifications}
                              onChange={(e) => setBrowserNotifications(e.target.checked)}
                              aria-label="Browser notifications"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Show system notifications when app is in background
                        </div>
                      </div>

                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Transfer complete</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={notifyOnTransferComplete}
                              onChange={(e) => setNotifyOnTransferComplete(e.target.checked)}
                              aria-label="Notify on transfer complete"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Get notified when file transfers finish
                        </div>
                      </div>

                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Incoming transfers</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={notifyOnIncomingTransfer}
                              onChange={(e) => setNotifyOnIncomingTransfer(e.target.checked)}
                              aria-label="Notify on incoming transfer"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Get notified when someone wants to send you files
                        </div>
                      </div>

                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Connection changes</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={notifyOnConnectionChange}
                              onChange={(e) => setNotifyOnConnectionChange(e.target.checked)}
                              aria-label="Notify on connection change"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Get notified when devices connect or disconnect
                        </div>
                      </div>

                      <div className={styles.notificationCard}>
                        <div className={styles.notificationCardHeader}>
                          <span className={styles.notificationCardTitle}>Device discovered</span>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={notifyOnDeviceDiscovered}
                              onChange={(e) => setNotifyOnDeviceDiscovered(e.target.checked)}
                              aria-label="Notify on device discovered"
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                        </div>
                        <div className={styles.notificationCardDescription}>
                          Get notified when new devices are discovered
                        </div>
                      </div>
                    </div>

                    {notificationSound && (
                      <div className={styles.volumeControl}>
                        <div className={styles.volumeHeader}>
                          <label className={styles.label}>Notification volume</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleTestSound}
                            aria-label="Test notification sound"
                          >
                            Test Sound
                          </Button>
                        </div>
                        <div className={styles.volumeSliderWrapper}>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round((notificationVolume ?? 0.3) * 100)}
                            onChange={(e) => setNotificationVolume(Number(e.target.value) / 100)}
                            className={styles.volumeSlider}
                            aria-label="Notification volume"
                          />
                          <span className={styles.volumeValue}>
                            {Math.round((notificationVolume ?? 0.3) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Silent Hours */}
                    <div className={styles.silentHours}>
                      <div className={styles.silentHoursHeader}>
                        <div className={styles.settingInfo}>
                          <div className={styles.settingLabel}>
                            Silent hours
                            {silentHoursEnabled && (
                              <Badge variant="info" style={{ marginLeft: '8px', fontSize: '11px' }}>
                                {silentHoursStart} - {silentHoursEnd}
                              </Badge>
                            )}
                          </div>
                          <div className={styles.settingDescription}>
                            Mute non-urgent notifications during specific hours
                          </div>
                        </div>
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={silentHoursEnabled}
                            onChange={(e) => setSilentHoursEnabled(e.target.checked)}
                            aria-label="Silent hours"
                          />
                          <span className={styles.toggleSlider} />
                        </label>
                      </div>

                      {silentHoursEnabled && (
                        <>
                          <div className={styles.timePickerGroup}>
                            <div className={styles.timePicker}>
                              <label className={styles.label} htmlFor="silent-start">Start time</label>
                              <input
                                id="silent-start"
                                type="time"
                                value={silentHoursStart}
                                onChange={(e) => setSilentHoursStart(e.target.value)}
                                className={styles.timeInput}
                              />
                            </div>
                            <div className={styles.timePicker}>
                              <label className={styles.label} htmlFor="silent-end">End time</label>
                              <input
                                id="silent-end"
                                type="time"
                                value={silentHoursEnd}
                                onChange={(e) => setSilentHoursEnd(e.target.value)}
                                className={styles.timeInput}
                              />
                            </div>
                          </div>
                          <p className={styles.helperText}>
                            Urgent notifications (failed transfers, security alerts) will still be shown
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* About Section */}
              <section id="about" ref={aboutRef} className={styles.section}>
                <Card>
                  <CardHeader title="About" description="Information about Tallow" />
                  <CardContent>
                    <div className={styles.aboutGrid}>
                      <div className={styles.aboutItem}>
                        <span className={styles.aboutLabel}>Version</span>
                        <Badge variant="secondary">0.1.0</Badge>
                      </div>
                      <div className={styles.aboutItem}>
                        <span className={styles.aboutLabel}>Encryption</span>
                        <Badge variant="secondary">ML-KEM-768 + AES-256-GCM</Badge>
                      </div>
                    </div>

                    <div className={styles.aboutLinks}>
                      <a
                        href="https://github.com/tallow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.aboutLink}
                      >
                        <Github className={styles.aboutLinkIcon} />
                        <span>View on GitHub</span>
                        <ExternalLink className={styles.aboutLinkArrow} />
                      </a>
                      <a
                        href="https://github.com/tallow/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.aboutLink}
                      >
                        <Info className={styles.aboutLinkIcon} />
                        <span>Report an Issue</span>
                        <ExternalLink className={styles.aboutLinkArrow} />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>
          </div>
        </div>
    </main>
  );
}
