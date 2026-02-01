import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

import '../../shared/utils/secure_logger.dart';
import 'system_tray_service.dart';

final _logger = SecureLogger('DesktopService');

/// Desktop service for Windows, macOS, and Linux specific features
class DesktopService {
  static final DesktopService _instance = DesktopService._internal();
  factory DesktopService() => _instance;
  DesktopService._internal();

  final _systemTray = SystemTrayService();

  bool _isInitialized = false;
  bool _isWindowVisible = true;
  bool _startMinimized = false;

  /// Check if running on desktop
  static bool get isDesktop =>
      !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);

  /// Initialize desktop services
  Future<void> initialize({
    bool startMinimized = false,
    bool autoStart = false,
  }) async {
    if (!isDesktop || _isInitialized) return;

    _startMinimized = startMinimized;
    _isInitialized = true;

    // Initialize system tray
    await _initializeSystemTray();

    // Setup auto-start if enabled
    if (autoStart) {
      await setAutoStart(true);
    }

    // Handle window close to tray
    _setupWindowManagement();

    _logger.i('Desktop service initialized');
  }

  Future<void> _initializeSystemTray() async {
    final iconPath = await _getTrayIconPath();

    await _systemTray.initialize(
      iconPath: iconPath,
      tooltip: 'Tallow - Secure File Transfer',
      onShowWindow: showWindow,
      onHideWindow: hideToTray,
      onQuit: quitApp,
      onMenuItemClick: _handleMenuAction,
    );

    // Listen for menu actions
    _systemTray.menuActionStream.listen(_handleMenuAction);

    // Start minimized if configured
    if (_startMinimized) {
      await hideToTray();
    }
  }

  Future<String> _getTrayIconPath() async {
    if (Platform.isWindows) {
      return 'assets/icons/tray_icon.ico';
    } else if (Platform.isMacOS) {
      return 'assets/icons/tray_icon.png';
    } else {
      return 'assets/icons/tray_icon.png';
    }
  }

  void _setupWindowManagement() {
    // Note: This would use window_manager package for actual implementation
    _logger.d('Window management setup');
  }

  void _handleMenuAction(dynamic action) {
    if (action is TrayMenuItem) {
      _logger.d('Menu item clicked: ${action.id}');
      action.onTap?.call();
    } else if (action is String) {
      switch (action) {
        case 'show':
          showWindow();
          break;
        case 'hide':
          hideToTray();
          break;
        case 'settings':
          // Navigate to settings
          break;
        case 'about':
          // Show about dialog
          break;
        case 'quit':
          quitApp();
          break;
      }
    }
  }

  /// Show the main window
  Future<void> showWindow() async {
    if (!isDesktop) return;

    _isWindowVisible = true;
    _logger.d('Window shown');

    // Platform-specific window show
    // await windowManager.show();
    // await windowManager.focus();
  }

  /// Hide window to system tray
  Future<void> hideToTray() async {
    if (!isDesktop) return;

    _isWindowVisible = false;
    _logger.d('Window hidden to tray');

    // Platform-specific window hide
    // await windowManager.hide();
  }

  /// Minimize window
  Future<void> minimizeWindow() async {
    if (!isDesktop) return;
    // await windowManager.minimize();
  }

  /// Maximize/restore window
  Future<void> toggleMaximize() async {
    if (!isDesktop) return;
    // if (await windowManager.isMaximized()) {
    //   await windowManager.unmaximize();
    // } else {
    //   await windowManager.maximize();
    // }
  }

  /// Quit the application
  Future<void> quitApp() async {
    if (!isDesktop) return;

    _logger.i('Quitting app');

    await _systemTray.dispose();
    exit(0);
  }

  /// Set auto-start on login
  Future<bool> setAutoStart(bool enabled) async {
    if (!isDesktop) return false;

    try {
      if (Platform.isWindows) {
        return await _setWindowsAutoStart(enabled);
      } else if (Platform.isMacOS) {
        return await _setMacOSAutoStart(enabled);
      } else if (Platform.isLinux) {
        return await _setLinuxAutoStart(enabled);
      }
    } catch (e) {
      _logger.e('Failed to set auto-start', error: e);
    }

    return false;
  }

  Future<bool> _setWindowsAutoStart(bool enabled) async {
    // Windows: Use registry HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
    final exePath = Platform.resolvedExecutable;

    if (enabled) {
      final result = await Process.run('reg', [
        'add',
        r'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
        '/v',
        'Tallow',
        '/t',
        'REG_SZ',
        '/d',
        '"$exePath"',
        '/f'
      ]);
      return result.exitCode == 0;
    } else {
      final result = await Process.run('reg', [
        'delete',
        r'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
        '/v',
        'Tallow',
        '/f'
      ]);
      return result.exitCode == 0;
    }
  }

  Future<bool> _setMacOSAutoStart(bool enabled) async {
    // macOS: Use launchd plist
    final homeDir = Platform.environment['HOME'];
    final plistPath = '$homeDir/Library/LaunchAgents/app.tallow.mobile.plist';
    final exePath = Platform.resolvedExecutable;

    if (enabled) {
      final plistContent = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>app.tallow.mobile</string>
    <key>ProgramArguments</key>
    <array>
        <string>$exePath</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
''';
      await File(plistPath).writeAsString(plistContent);
      return true;
    } else {
      final file = File(plistPath);
      if (await file.exists()) {
        await file.delete();
      }
      return true;
    }
  }

  Future<bool> _setLinuxAutoStart(bool enabled) async {
    // Linux: Use XDG autostart
    final homeDir = Platform.environment['HOME'];
    final autostartDir = '$homeDir/.config/autostart';
    final desktopPath = '$autostartDir/tallow.desktop';
    final exePath = Platform.resolvedExecutable;

    if (enabled) {
      await Directory(autostartDir).create(recursive: true);

      final desktopContent = '''[Desktop Entry]
Type=Application
Name=Tallow
Exec=$exePath
Terminal=false
X-GNOME-Autostart-enabled=true
''';
      await File(desktopPath).writeAsString(desktopContent);
      return true;
    } else {
      final file = File(desktopPath);
      if (await file.exists()) {
        await file.delete();
      }
      return true;
    }
  }

  /// Check if auto-start is enabled
  Future<bool> isAutoStartEnabled() async {
    if (!isDesktop) return false;

    try {
      if (Platform.isWindows) {
        final result = await Process.run('reg', [
          'query',
          r'HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run',
          '/v',
          'Tallow'
        ]);
        return result.exitCode == 0;
      } else if (Platform.isMacOS) {
        final homeDir = Platform.environment['HOME'];
        return await File('$homeDir/Library/LaunchAgents/app.tallow.mobile.plist').exists();
      } else if (Platform.isLinux) {
        final homeDir = Platform.environment['HOME'];
        return await File('$homeDir/.config/autostart/tallow.desktop').exists();
      }
    } catch (e) {
      _logger.e('Failed to check auto-start', error: e);
    }

    return false;
  }

  /// Update tray with transfer progress
  Future<void> updateTransferProgress({
    required String fileName,
    required double progress,
    required bool isSending,
  }) async {
    await _systemTray.updateTransferProgress(
      fileName: fileName,
      progress: progress,
      isSending: isSending,
    );
  }

  /// Clear transfer progress from tray
  Future<void> clearTransferProgress() async {
    await _systemTray.clearTransferProgress();
  }

  /// Show a desktop notification
  Future<void> showNotification({
    required String title,
    required String body,
  }) async {
    await _systemTray.showNotification(
      title: title,
      body: body,
    );
  }

  /// Dispose desktop services
  Future<void> dispose() async {
    await _systemTray.dispose();
    _isInitialized = false;
  }
}
