import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

import '../../shared/utils/secure_logger.dart';

final _logger = SecureLogger('SystemTray');

/// System tray service for desktop platforms (Windows, macOS, Linux)
class SystemTrayService {
  static final SystemTrayService _instance = SystemTrayService._internal();
  factory SystemTrayService() => _instance;
  SystemTrayService._internal();

  // System tray state
  bool _isInitialized = false;
  bool _isVisible = false;
  String _tooltip = 'Tallow';
  TrayStatus _status = TrayStatus.idle;
  List<TrayMenuItem> _menuItems = [];

  // Callbacks
  VoidCallback? _onShowWindow;
  VoidCallback? _onHideWindow;
  VoidCallback? _onQuit;
  Function(TrayMenuItem)? _onMenuItemClick;

  // Stream controllers
  final _statusController = StreamController<TrayStatus>.broadcast();
  final _menuActionController = StreamController<String>.broadcast();

  Stream<TrayStatus> get statusStream => _statusController.stream;
  Stream<String> get menuActionStream => _menuActionController.stream;

  /// Check if system tray is supported on current platform
  static bool get isSupported =>
      !kIsWeb && (Platform.isWindows || Platform.isMacOS || Platform.isLinux);

  /// Initialize the system tray
  Future<void> initialize({
    required String iconPath,
    String tooltip = 'Tallow',
    VoidCallback? onShowWindow,
    VoidCallback? onHideWindow,
    VoidCallback? onQuit,
    Function(TrayMenuItem)? onMenuItemClick,
  }) async {
    if (!isSupported) {
      _logger.w('System tray not supported on this platform');
      return;
    }

    if (_isInitialized) return;

    _tooltip = tooltip;
    _onShowWindow = onShowWindow;
    _onHideWindow = onHideWindow;
    _onQuit = onQuit;
    _onMenuItemClick = onMenuItemClick;

    try {
      // Initialize platform-specific tray
      await _initializeTray(iconPath);
      _isInitialized = true;
      _isVisible = true;
      _logger.i('System tray initialized');
    } catch (e) {
      _logger.e('Failed to initialize system tray', error: e);
    }
  }

  Future<void> _initializeTray(String iconPath) async {
    // Build default menu
    _menuItems = _buildDefaultMenu();

    // Note: Actual implementation would use system_tray package
    // This is a skeleton that shows the intended structure
    _logger.d('Tray initialized with icon: $iconPath');
  }

  List<TrayMenuItem> _buildDefaultMenu() {
    return [
      TrayMenuItem(
        id: 'show',
        label: 'Show Tallow',
        icon: Icons.visibility,
        onTap: () {
          _onShowWindow?.call();
          _menuActionController.add('show');
        },
      ),
      TrayMenuItem(
        id: 'hide',
        label: 'Hide to Tray',
        icon: Icons.visibility_off,
        onTap: () {
          _onHideWindow?.call();
          _menuActionController.add('hide');
        },
      ),
      TrayMenuItem.separator(),
      TrayMenuItem(
        id: 'status',
        label: 'Status: Ready',
        icon: Icons.check_circle,
        enabled: false,
      ),
      TrayMenuItem.separator(),
      TrayMenuItem(
        id: 'settings',
        label: 'Settings',
        icon: Icons.settings,
        onTap: () => _menuActionController.add('settings'),
      ),
      TrayMenuItem(
        id: 'about',
        label: 'About Tallow',
        icon: Icons.info,
        onTap: () => _menuActionController.add('about'),
      ),
      TrayMenuItem.separator(),
      TrayMenuItem(
        id: 'quit',
        label: 'Quit',
        icon: Icons.exit_to_app,
        onTap: () {
          _onQuit?.call();
          _menuActionController.add('quit');
        },
      ),
    ];
  }

  /// Update the tray icon status
  Future<void> updateStatus(TrayStatus status) async {
    if (!_isInitialized) return;

    _status = status;
    _statusController.add(status);

    // Update menu item
    final statusIndex = _menuItems.indexWhere((item) => item.id == 'status');
    if (statusIndex != -1) {
      _menuItems[statusIndex] = TrayMenuItem(
        id: 'status',
        label: 'Status: ${status.label}',
        icon: status.icon,
        enabled: false,
      );
    }

    // Update tooltip
    final newTooltip = '$_tooltip - ${status.label}';
    await _updateTooltip(newTooltip);

    _logger.d('Tray status updated: ${status.label}');
  }

  /// Update transfer progress in tray
  Future<void> updateTransferProgress({
    required String fileName,
    required double progress,
    required bool isSending,
  }) async {
    if (!_isInitialized) return;

    final direction = isSending ? 'Sending' : 'Receiving';
    final percent = (progress * 100).toStringAsFixed(0);
    final newTooltip = '$_tooltip\n$direction: $fileName ($percent%)';

    await _updateTooltip(newTooltip);
    await updateStatus(isSending ? TrayStatus.sending : TrayStatus.receiving);
  }

  /// Clear transfer progress
  Future<void> clearTransferProgress() async {
    if (!_isInitialized) return;

    await _updateTooltip(_tooltip);
    await updateStatus(TrayStatus.idle);
  }

  Future<void> _updateTooltip(String tooltip) async {
    // Platform-specific tooltip update
    _logger.d('Tooltip: $tooltip');
  }

  /// Show a notification from the tray
  Future<void> showNotification({
    required String title,
    required String body,
    String? actionId,
  }) async {
    if (!_isInitialized) return;

    // Platform-specific notification
    _logger.i('Tray notification: $title - $body');
  }

  /// Show the tray menu programmatically
  Future<void> showMenu() async {
    if (!_isInitialized) return;
    _logger.d('Showing tray menu');
  }

  /// Hide the tray icon
  Future<void> hide() async {
    if (!_isInitialized || !_isVisible) return;

    _isVisible = false;
    _logger.d('Tray hidden');
  }

  /// Show the tray icon
  Future<void> show() async {
    if (!_isInitialized || _isVisible) return;

    _isVisible = true;
    _logger.d('Tray shown');
  }

  /// Add a custom menu item
  void addMenuItem(TrayMenuItem item, {int? index}) {
    if (index != null && index < _menuItems.length) {
      _menuItems.insert(index, item);
    } else {
      // Insert before quit
      final quitIndex = _menuItems.indexWhere((i) => i.id == 'quit');
      if (quitIndex > 0) {
        _menuItems.insert(quitIndex - 1, item);
      } else {
        _menuItems.add(item);
      }
    }
  }

  /// Remove a menu item
  void removeMenuItem(String id) {
    _menuItems.removeWhere((item) => item.id == id);
  }

  /// Dispose of the system tray
  Future<void> dispose() async {
    if (!_isInitialized) return;

    await hide();
    _statusController.close();
    _menuActionController.close();
    _isInitialized = false;
    _logger.i('System tray disposed');
  }
}

/// Tray menu item
class TrayMenuItem {
  final String id;
  final String label;
  final IconData? icon;
  final bool enabled;
  final bool checked;
  final bool isSeparator;
  final VoidCallback? onTap;
  final List<TrayMenuItem>? submenu;

  TrayMenuItem({
    required this.id,
    required this.label,
    this.icon,
    this.enabled = true,
    this.checked = false,
    this.isSeparator = false,
    this.onTap,
    this.submenu,
  });

  factory TrayMenuItem.separator() => TrayMenuItem(
        id: 'separator_${DateTime.now().millisecondsSinceEpoch}',
        label: '',
        isSeparator: true,
      );
}

/// Tray status
enum TrayStatus {
  idle(label: 'Ready', icon: Icons.check_circle),
  discovering(label: 'Discovering...', icon: Icons.search),
  connecting(label: 'Connecting...', icon: Icons.link),
  connected(label: 'Connected', icon: Icons.link),
  sending(label: 'Sending...', icon: Icons.upload),
  receiving(label: 'Receiving...', icon: Icons.download),
  error(label: 'Error', icon: Icons.error);

  const TrayStatus({required this.label, required this.icon});

  final String label;
  final IconData icon;
}
