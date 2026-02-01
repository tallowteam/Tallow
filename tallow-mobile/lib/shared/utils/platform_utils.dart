import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../../core/network/mdns_discovery.dart';

/// Platform utility functions
class PlatformUtils {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  static final Connectivity _connectivity = Connectivity();

  /// Check if running on mobile
  static bool get isMobile => !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  /// Check if running on desktop
  static bool get isDesktop =>
      !kIsWeb && (Platform.isMacOS || Platform.isWindows || Platform.isLinux);

  /// Check if running on web
  static bool get isWeb => kIsWeb;

  /// Get current platform name
  static String get platformName {
    if (kIsWeb) return 'Web';
    if (Platform.isAndroid) return 'Android';
    if (Platform.isIOS) return 'iOS';
    if (Platform.isMacOS) return 'macOS';
    if (Platform.isWindows) return 'Windows';
    if (Platform.isLinux) return 'Linux';
    return 'Unknown';
  }

  /// Get device type
  static DeviceType get deviceType {
    if (kIsWeb) return DeviceType.unknown;
    if (Platform.isAndroid || Platform.isIOS) return DeviceType.phone;
    if (Platform.isMacOS) return DeviceType.laptop;
    if (Platform.isWindows || Platform.isLinux) return DeviceType.desktop;
    return DeviceType.unknown;
  }

  /// Get device info
  static Future<DeviceDetails> getDeviceDetails() async {
    String name = 'Unknown Device';
    String model = 'Unknown';
    String os = platformName;
    String osVersion = '';

    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        name = info.model;
        model = info.device;
        osVersion = 'Android ${info.version.release}';
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        name = info.name;
        model = info.model;
        osVersion = '${info.systemName} ${info.systemVersion}';
      } else if (Platform.isMacOS) {
        final info = await _deviceInfo.macOsInfo;
        name = info.computerName;
        model = info.model;
        osVersion = 'macOS ${info.osRelease}';
      } else if (Platform.isWindows) {
        final info = await _deviceInfo.windowsInfo;
        name = info.computerName;
        model = 'Windows PC';
        osVersion = 'Windows ${info.productName}';
      } else if (Platform.isLinux) {
        final info = await _deviceInfo.linuxInfo;
        name = info.prettyName;
        model = 'Linux';
        osVersion = info.versionId ?? 'Linux';
      }
    } catch (e) {
      // Use defaults
    }

    return DeviceDetails(
      name: name,
      model: model,
      os: os,
      osVersion: osVersion,
      type: deviceType,
    );
  }

  /// Get app info
  static Future<AppDetails> getAppDetails() async {
    final packageInfo = await PackageInfo.fromPlatform();
    return AppDetails(
      name: packageInfo.appName,
      version: packageInfo.version,
      buildNumber: packageInfo.buildNumber,
      packageName: packageInfo.packageName,
    );
  }

  /// Check network connectivity
  static Future<bool> isConnected() async {
    final result = await _connectivity.checkConnectivity();
    return result.isNotEmpty && !result.contains(ConnectivityResult.none);
  }

  /// Get connectivity type
  static Future<NetworkType> getNetworkType() async {
    final result = await _connectivity.checkConnectivity();

    if (result.isEmpty || result.contains(ConnectivityResult.none)) {
      return NetworkType.none;
    }
    if (result.contains(ConnectivityResult.wifi)) {
      return NetworkType.wifi;
    }
    if (result.contains(ConnectivityResult.mobile)) {
      return NetworkType.mobile;
    }
    if (result.contains(ConnectivityResult.ethernet)) {
      return NetworkType.ethernet;
    }
    return NetworkType.other;
  }

  /// Watch connectivity changes
  static Stream<NetworkType> watchConnectivity() {
    return _connectivity.onConnectivityChanged.map((results) {
      if (results.isEmpty || results.contains(ConnectivityResult.none)) {
        return NetworkType.none;
      }
      if (results.contains(ConnectivityResult.wifi)) {
        return NetworkType.wifi;
      }
      if (results.contains(ConnectivityResult.mobile)) {
        return NetworkType.mobile;
      }
      if (results.contains(ConnectivityResult.ethernet)) {
        return NetworkType.ethernet;
      }
      return NetworkType.other;
    });
  }

  /// Check if on Wi-Fi
  static Future<bool> isOnWifi() async {
    final type = await getNetworkType();
    return type == NetworkType.wifi;
  }

  /// Get local IP address
  static Future<String?> getLocalIpAddress() async {
    try {
      final interfaces = await NetworkInterface.list();
      for (final interface in interfaces) {
        for (final addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            return addr.address;
          }
        }
      }
    } catch (e) {
      // Failed to get IP
    }
    return null;
  }

  /// Check if app has required permissions
  static Future<bool> hasRequiredPermissions() async {
    // This would check for storage, camera, etc. permissions
    // Implementation depends on permission_handler package usage
    return true;
  }

  /// Check if biometrics are available
  static Future<bool> isBiometricsAvailable() async {
    // Implementation would use local_auth package
    return false;
  }

  /// Get downloads directory path
  static Future<String?> getDownloadsPath() async {
    if (Platform.isAndroid) {
      return '/storage/emulated/0/Download/Tallow';
    } else if (Platform.isIOS) {
      // iOS doesn't have a public downloads folder
      return null;
    } else if (Platform.isMacOS) {
      final home = Platform.environment['HOME'];
      return '$home/Downloads/Tallow';
    } else if (Platform.isWindows) {
      final userProfile = Platform.environment['USERPROFILE'];
      return '$userProfile\\Downloads\\Tallow';
    } else if (Platform.isLinux) {
      final home = Platform.environment['HOME'];
      return '$home/Downloads/Tallow';
    }
    return null;
  }

  /// Check if app is in foreground
  static bool get isInForeground {
    // Would need to implement using flutter lifecycle observer
    return true;
  }
}

/// Device details
class DeviceDetails {
  final String name;
  final String model;
  final String os;
  final String osVersion;
  final DeviceType type;

  DeviceDetails({
    required this.name,
    required this.model,
    required this.os,
    required this.osVersion,
    required this.type,
  });
}

/// App details
class AppDetails {
  final String name;
  final String version;
  final String buildNumber;
  final String packageName;

  AppDetails({
    required this.name,
    required this.version,
    required this.buildNumber,
    required this.packageName,
  });

  String get fullVersion => '$version ($buildNumber)';
}

/// Network type
enum NetworkType {
  none,
  wifi,
  mobile,
  ethernet,
  other,
}
