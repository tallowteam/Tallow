import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'settings_provider.dart';
import '../../l10n/app_localizations.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final notifier = ref.read(settingsProvider.notifier);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.settings ?? 'Settings'),
      ),
      body: ListView(
        children: [
          // Appearance Section
          _SectionHeader(title: l10n?.appearance ?? 'Appearance'),
          _SettingsTile(
            icon: Icons.palette_outlined,
            title: l10n?.theme ?? 'Theme',
            subtitle: _getThemeModeName(settings.themeMode, l10n),
            onTap: () => _showThemePicker(context, ref, settings, notifier),
          ),
          _SettingsTile(
            icon: Icons.color_lens_outlined,
            title: l10n?.colorScheme ?? 'Color Scheme',
            subtitle: settings.themeName.capitalize(),
            onTap: () => _showColorSchemePicker(context, ref, settings, notifier),
          ),
          _SettingsTile(
            icon: Icons.language,
            title: l10n?.language ?? 'Language',
            subtitle: availableLocales[settings.locale.languageCode] ?? 'English',
            onTap: () => _showLanguagePicker(context, ref, settings, notifier),
          ),

          // Notifications Section
          _SectionHeader(title: l10n?.notifications ?? 'Notifications'),
          _SwitchTile(
            icon: Icons.notifications_outlined,
            title: l10n?.enableNotifications ?? 'Enable Notifications',
            value: settings.notificationsEnabled,
            onChanged: (value) => notifier.setNotificationsEnabled(value),
          ),
          _SwitchTile(
            icon: Icons.volume_up_outlined,
            title: l10n?.sounds ?? 'Sounds',
            value: settings.soundEnabled,
            onChanged: settings.notificationsEnabled
                ? (value) => notifier.setSoundEnabled(value)
                : null,
          ),
          _SwitchTile(
            icon: Icons.vibration,
            title: l10n?.vibration ?? 'Vibration',
            value: settings.vibrationEnabled,
            onChanged: settings.notificationsEnabled
                ? (value) => notifier.setVibrationEnabled(value)
                : null,
          ),

          // Security Section
          _SectionHeader(title: l10n?.security ?? 'Security'),
          _SwitchTile(
            icon: Icons.security,
            title: l10n?.pqcEncryption ?? 'Post-Quantum Encryption',
            subtitle: l10n?.pqcDescription ?? 'Use ML-KEM-768 + X25519 hybrid encryption',
            value: settings.usePQC,
            onChanged: (value) => notifier.setUsePQC(value),
          ),
          _SwitchTile(
            icon: Icons.verified_user_outlined,
            title: l10n?.requireVerification ?? 'Require Verification',
            subtitle: l10n?.verificationDescription ?? 'Verify device fingerprints before connecting',
            value: settings.requireVerification,
            onChanged: (value) => notifier.setRequireVerification(value),
          ),
          _SwitchTile(
            icon: Icons.check_circle_outline,
            title: l10n?.autoAccept ?? 'Auto-accept from Trusted',
            subtitle: l10n?.autoAcceptDescription ?? 'Automatically accept transfers from verified devices',
            value: settings.autoAcceptFromTrusted,
            onChanged: (value) => notifier.setAutoAcceptFromTrusted(value),
          ),

          // Transfer Section
          _SectionHeader(title: l10n?.transfers ?? 'Transfers'),
          _SwitchTile(
            icon: Icons.cloud_outlined,
            title: l10n?.useRelay ?? 'Use Relay Server',
            subtitle: l10n?.relayDescription ?? 'Fall back to relay when direct connection fails',
            value: settings.useRelay,
            onChanged: (value) => notifier.setUseRelay(value),
          ),
          _SettingsTile(
            icon: Icons.speed,
            title: l10n?.maxTransfers ?? 'Max Concurrent Transfers',
            subtitle: '${settings.maxConcurrentTransfers}',
            onTap: () => _showMaxTransfersPicker(context, ref, settings, notifier),
          ),
          _SwitchTile(
            icon: Icons.screen_lock_portrait_outlined,
            title: l10n?.keepScreenOn ?? 'Keep Screen On',
            subtitle: l10n?.keepScreenOnDescription ?? 'Prevent screen from turning off during transfers',
            value: settings.keepScreenOn,
            onChanged: (value) => notifier.setKeepScreenOn(value),
          ),

          // Discovery Section
          _SectionHeader(title: l10n?.discovery ?? 'Discovery'),
          _SwitchTile(
            icon: Icons.wifi_find,
            title: l10n?.autoDiscovery ?? 'Auto-start Discovery',
            subtitle: l10n?.autoDiscoveryDescription ?? 'Start scanning when app opens',
            value: settings.autoStartDiscovery,
            onChanged: (value) => notifier.setAutoStartDiscovery(value),
          ),

          // About Section
          _SectionHeader(title: l10n?.about ?? 'About'),
          _SettingsTile(
            icon: Icons.info_outline,
            title: l10n?.version ?? 'Version',
            subtitle: '',
            trailing: FutureBuilder<PackageInfo>(
              future: PackageInfo.fromPlatform(),
              builder: (context, snapshot) {
                if (snapshot.hasData) {
                  return Text(
                    '${snapshot.data!.version} (${snapshot.data!.buildNumber})',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          _SettingsTile(
            icon: Icons.description_outlined,
            title: l10n?.licenses ?? 'Open Source Licenses',
            onTap: () => showLicensePage(context: context),
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: l10n?.privacyPolicy ?? 'Privacy Policy',
            onTap: () {
              // Open privacy policy
            },
          ),

          // Danger Zone
          _SectionHeader(title: l10n?.dangerZone ?? 'Danger Zone'),
          _SettingsTile(
            icon: Icons.restore,
            title: l10n?.resetSettings ?? 'Reset Settings',
            titleColor: theme.colorScheme.error,
            onTap: () => _showResetConfirmation(context, ref, notifier),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  String _getThemeModeName(ThemeMode mode, AppLocalizations? l10n) {
    switch (mode) {
      case ThemeMode.system:
        return l10n?.system ?? 'System';
      case ThemeMode.light:
        return l10n?.light ?? 'Light';
      case ThemeMode.dark:
        return l10n?.dark ?? 'Dark';
    }
  }

  void _showThemePicker(
    BuildContext context,
    WidgetRef ref,
    SettingsState settings,
    SettingsNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.theme ?? 'Theme'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ThemeMode.values.map((mode) {
            return RadioListTile<ThemeMode>(
              title: Text(_getThemeModeName(mode, l10n)),
              value: mode,
              groupValue: settings.themeMode,
              onChanged: (value) {
                if (value != null) {
                  notifier.setThemeMode(value);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showColorSchemePicker(
    BuildContext context,
    WidgetRef ref,
    SettingsState settings,
    SettingsNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.colorScheme ?? 'Color Scheme'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: availableThemes.map((theme) {
            return RadioListTile<String>(
              title: Text(theme.capitalize()),
              value: theme,
              groupValue: settings.themeName,
              onChanged: (value) {
                if (value != null) {
                  notifier.setThemeName(value);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showLanguagePicker(
    BuildContext context,
    WidgetRef ref,
    SettingsState settings,
    SettingsNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.language ?? 'Language'),
        content: SizedBox(
          width: double.maxFinite,
          height: 400,
          child: ListView.builder(
            itemCount: availableLocales.length,
            itemBuilder: (context, index) {
              final entry = availableLocales.entries.elementAt(index);
              return RadioListTile<String>(
                title: Text(entry.value),
                value: entry.key,
                groupValue: settings.locale.languageCode,
                onChanged: (value) {
                  if (value != null) {
                    notifier.setLocale(Locale(value));
                    Navigator.pop(context);
                  }
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showMaxTransfersPicker(
    BuildContext context,
    WidgetRef ref,
    SettingsState settings,
    SettingsNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.maxTransfers ?? 'Max Concurrent Transfers'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [1, 2, 3, 4, 5].map((value) {
            return RadioListTile<int>(
              title: Text('$value'),
              value: value,
              groupValue: settings.maxConcurrentTransfers,
              onChanged: (v) {
                if (v != null) {
                  notifier.setMaxConcurrentTransfers(v);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showResetConfirmation(
    BuildContext context,
    WidgetRef ref,
    SettingsNotifier notifier,
  ) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.resetSettings ?? 'Reset Settings'),
        content: Text(l10n?.resetConfirmation ?? 'Are you sure you want to reset all settings to default?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n?.cancel ?? 'Cancel'),
          ),
          TextButton(
            onPressed: () {
              notifier.resetToDefaults();
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n?.reset ?? 'Reset'),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: theme.textTheme.titleSmall?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? titleColor;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      leading: Icon(icon),
      title: Text(
        title,
        style: titleColor != null
            ? TextStyle(color: titleColor)
            : null,
      ),
      subtitle: subtitle != null && subtitle!.isNotEmpty
          ? Text(subtitle!)
          : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _SwitchTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.value,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      secondary: Icon(icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle!) : null,
      value: value,
      onChanged: onChanged,
    );
  }
}

extension StringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}
