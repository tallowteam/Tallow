import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// App settings state
class SettingsState {
  final ThemeMode themeMode;
  final String themeName;
  final Locale locale;
  final bool notificationsEnabled;
  final bool soundEnabled;
  final bool vibrationEnabled;
  final bool autoAcceptFromTrusted;
  final bool requireVerification;
  final String downloadPath;
  final bool usePQC;
  final bool useRelay;
  final int maxConcurrentTransfers;
  final bool showTransferNotifications;
  final bool keepScreenOn;
  final bool autoStartDiscovery;

  const SettingsState({
    this.themeMode = ThemeMode.system,
    this.themeName = 'default',
    this.locale = const Locale('en'),
    this.notificationsEnabled = true,
    this.soundEnabled = true,
    this.vibrationEnabled = true,
    this.autoAcceptFromTrusted = false,
    this.requireVerification = true,
    this.downloadPath = '',
    this.usePQC = true,
    this.useRelay = true,
    this.maxConcurrentTransfers = 3,
    this.showTransferNotifications = true,
    this.keepScreenOn = false,
    this.autoStartDiscovery = true,
  });

  SettingsState copyWith({
    ThemeMode? themeMode,
    String? themeName,
    Locale? locale,
    bool? notificationsEnabled,
    bool? soundEnabled,
    bool? vibrationEnabled,
    bool? autoAcceptFromTrusted,
    bool? requireVerification,
    String? downloadPath,
    bool? usePQC,
    bool? useRelay,
    int? maxConcurrentTransfers,
    bool? showTransferNotifications,
    bool? keepScreenOn,
    bool? autoStartDiscovery,
  }) {
    return SettingsState(
      themeMode: themeMode ?? this.themeMode,
      themeName: themeName ?? this.themeName,
      locale: locale ?? this.locale,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
      autoAcceptFromTrusted: autoAcceptFromTrusted ?? this.autoAcceptFromTrusted,
      requireVerification: requireVerification ?? this.requireVerification,
      downloadPath: downloadPath ?? this.downloadPath,
      usePQC: usePQC ?? this.usePQC,
      useRelay: useRelay ?? this.useRelay,
      maxConcurrentTransfers: maxConcurrentTransfers ?? this.maxConcurrentTransfers,
      showTransferNotifications: showTransferNotifications ?? this.showTransferNotifications,
      keepScreenOn: keepScreenOn ?? this.keepScreenOn,
      autoStartDiscovery: autoStartDiscovery ?? this.autoStartDiscovery,
    );
  }
}

/// Settings notifier
class SettingsNotifier extends StateNotifier<SettingsState> {
  static const String _themeModeKey = 'theme_mode';
  static const String _themeNameKey = 'theme_name';
  static const String _localeKey = 'locale';
  static const String _notificationsKey = 'notifications';
  static const String _soundKey = 'sound';
  static const String _vibrationKey = 'vibration';
  static const String _autoAcceptKey = 'auto_accept';
  static const String _verificationKey = 'verification';
  static const String _downloadPathKey = 'download_path';
  static const String _pqcKey = 'pqc';
  static const String _relayKey = 'relay';
  static const String _maxTransfersKey = 'max_transfers';
  static const String _transferNotificationsKey = 'transfer_notifications';
  static const String _keepScreenOnKey = 'keep_screen_on';
  static const String _autoDiscoveryKey = 'auto_discovery';

  SharedPreferences? _prefs;

  SettingsNotifier() : super(const SettingsState()) {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _prefs = await SharedPreferences.getInstance();

    final themeModeIndex = _prefs?.getInt(_themeModeKey) ?? 0;
    final themeName = _prefs?.getString(_themeNameKey) ?? 'default';
    final localeCode = _prefs?.getString(_localeKey) ?? 'en';
    final notifications = _prefs?.getBool(_notificationsKey) ?? true;
    final sound = _prefs?.getBool(_soundKey) ?? true;
    final vibration = _prefs?.getBool(_vibrationKey) ?? true;
    final autoAccept = _prefs?.getBool(_autoAcceptKey) ?? false;
    final verification = _prefs?.getBool(_verificationKey) ?? true;
    final downloadPath = _prefs?.getString(_downloadPathKey) ?? '';
    final pqc = _prefs?.getBool(_pqcKey) ?? true;
    final relay = _prefs?.getBool(_relayKey) ?? true;
    final maxTransfers = _prefs?.getInt(_maxTransfersKey) ?? 3;
    final transferNotifications = _prefs?.getBool(_transferNotificationsKey) ?? true;
    final keepScreenOn = _prefs?.getBool(_keepScreenOnKey) ?? false;
    final autoDiscovery = _prefs?.getBool(_autoDiscoveryKey) ?? true;

    state = SettingsState(
      themeMode: ThemeMode.values[themeModeIndex],
      themeName: themeName,
      locale: Locale(localeCode),
      notificationsEnabled: notifications,
      soundEnabled: sound,
      vibrationEnabled: vibration,
      autoAcceptFromTrusted: autoAccept,
      requireVerification: verification,
      downloadPath: downloadPath,
      usePQC: pqc,
      useRelay: relay,
      maxConcurrentTransfers: maxTransfers,
      showTransferNotifications: transferNotifications,
      keepScreenOn: keepScreenOn,
      autoStartDiscovery: autoDiscovery,
    );
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    await _prefs?.setInt(_themeModeKey, mode.index);
    state = state.copyWith(themeMode: mode);
  }

  Future<void> setThemeName(String name) async {
    await _prefs?.setString(_themeNameKey, name);
    state = state.copyWith(themeName: name);
  }

  Future<void> setLocale(Locale locale) async {
    await _prefs?.setString(_localeKey, locale.languageCode);
    state = state.copyWith(locale: locale);
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    await _prefs?.setBool(_notificationsKey, enabled);
    state = state.copyWith(notificationsEnabled: enabled);
  }

  Future<void> setSoundEnabled(bool enabled) async {
    await _prefs?.setBool(_soundKey, enabled);
    state = state.copyWith(soundEnabled: enabled);
  }

  Future<void> setVibrationEnabled(bool enabled) async {
    await _prefs?.setBool(_vibrationKey, enabled);
    state = state.copyWith(vibrationEnabled: enabled);
  }

  Future<void> setAutoAcceptFromTrusted(bool enabled) async {
    await _prefs?.setBool(_autoAcceptKey, enabled);
    state = state.copyWith(autoAcceptFromTrusted: enabled);
  }

  Future<void> setRequireVerification(bool enabled) async {
    await _prefs?.setBool(_verificationKey, enabled);
    state = state.copyWith(requireVerification: enabled);
  }

  Future<void> setDownloadPath(String path) async {
    await _prefs?.setString(_downloadPathKey, path);
    state = state.copyWith(downloadPath: path);
  }

  Future<void> setUsePQC(bool enabled) async {
    await _prefs?.setBool(_pqcKey, enabled);
    state = state.copyWith(usePQC: enabled);
  }

  Future<void> setUseRelay(bool enabled) async {
    await _prefs?.setBool(_relayKey, enabled);
    state = state.copyWith(useRelay: enabled);
  }

  Future<void> setMaxConcurrentTransfers(int max) async {
    await _prefs?.setInt(_maxTransfersKey, max);
    state = state.copyWith(maxConcurrentTransfers: max);
  }

  Future<void> setShowTransferNotifications(bool enabled) async {
    await _prefs?.setBool(_transferNotificationsKey, enabled);
    state = state.copyWith(showTransferNotifications: enabled);
  }

  Future<void> setKeepScreenOn(bool enabled) async {
    await _prefs?.setBool(_keepScreenOnKey, enabled);
    state = state.copyWith(keepScreenOn: enabled);
  }

  Future<void> setAutoStartDiscovery(bool enabled) async {
    await _prefs?.setBool(_autoDiscoveryKey, enabled);
    state = state.copyWith(autoStartDiscovery: enabled);
  }

  Future<void> resetToDefaults() async {
    await _prefs?.clear();
    state = const SettingsState();
  }
}

/// Provider for settings
final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>(
  (ref) => SettingsNotifier(),
);

/// Available themes
const availableThemes = [
  'default',
  'dark',
  'light',
  'forest',
  'ocean',
];

/// Available locales with names
const availableLocales = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'ru': 'Русский',
  'zh': '中文',
  'ja': '日本語',
  'ko': '한국어',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'bn': 'বাংলা',
  'id': 'Bahasa Indonesia',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'tr': 'Türkçe',
  'pl': 'Polski',
  'nl': 'Nederlands',
  'uk': 'Українська',
  'ur': 'اردو',
  'he': 'עברית',
};
