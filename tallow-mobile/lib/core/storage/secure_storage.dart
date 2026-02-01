import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart' as crypto;

import '../../shared/utils/secure_logger.dart';
import '../crypto/pqc_crypto.dart';

/// Secure storage service for sensitive data
class SecureStorageService {
  static final SecureStorageService _instance = SecureStorageService._internal();
  static SecureStorageService get instance => _instance;
  SecureStorageService._internal();

  final _logger = SecureLogger('SecureStorage');

  // Storage keys
  static const String _identityKeyPairKey = 'identity_key_pair';
  static const String _mlKemPublicKeyKey = 'mlkem_public_key';
  static const String _mlKemSecretKeyKey = 'mlkem_secret_key';
  static const String _x25519PublicKeyKey = 'x25519_public_key';
  static const String _x25519PrivateKeyKey = 'x25519_private_key';
  static const String _deviceIdKey = 'device_id';
  static const String _deviceNameKey = 'device_name';
  static const String _trustedDevicesKey = 'trusted_devices';
  static const String _settingsKey = 'settings';
  static const String _sessionKeysPrefix = 'session_key_';

  late FlutterSecureStorage _storage;
  bool _initialized = false;

  // Android options for secure storage
  AndroidOptions get _androidOptions => const AndroidOptions(
        encryptedSharedPreferences: true,
        keyCipherAlgorithm: KeyCipherAlgorithm.RSA_ECB_OAEPwithSHA_256andMGF1Padding,
        storageCipherAlgorithm: StorageCipherAlgorithm.AES_GCM_NoPadding,
      );

  // iOS options for secure storage
  IOSOptions get _iosOptions => const IOSOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device,
        synchronizable: false,
      );

  // Linux options
  LinuxOptions get _linuxOptions => const LinuxOptions();

  // Windows options
  WindowsOptions get _windowsOptions => const WindowsOptions();

  // macOS options
  MacOsOptions get _macOsOptions => const MacOsOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device,
        synchronizable: false,
      );

  /// Initialize secure storage
  Future<void> initialize() async {
    if (_initialized) return;

    _storage = FlutterSecureStorage(
      aOptions: _androidOptions,
      iOptions: _iosOptions,
      lOptions: _linuxOptions,
      wOptions: _windowsOptions,
      mOptions: _macOsOptions,
    );

    _initialized = true;
    _logger.i('Secure storage initialized');
  }

  void _ensureInitialized() {
    if (!_initialized) {
      throw StateError('SecureStorageService not initialized. Call initialize() first.');
    }
  }

  // ============================================
  // Hybrid Key Pair Management (ML-KEM + X25519)
  // ============================================

  /// Save hybrid identity key pair (ML-KEM-768 + X25519)
  Future<void> saveIdentityKeyPair(HybridKeyPair keyPair) async {
    _ensureInitialized();

    // Save ML-KEM keys
    await _storage.write(
      key: _mlKemPublicKeyKey,
      value: keyPair.mlKemPublicKey.toHex(),
    );
    await _storage.write(
      key: _mlKemSecretKeyKey,
      value: keyPair.mlKemSecretKey.toHex(),
    );

    // Save X25519 keys
    final x25519Keys = await keyPair.exportX25519Keys();
    await _storage.write(
      key: _x25519PublicKeyKey,
      value: hex.encode(x25519Keys.publicKey),
    );
    await _storage.write(
      key: _x25519PrivateKeyKey,
      value: hex.encode(x25519Keys.privateKey),
    );

    // Save metadata that keypair exists
    await _storage.write(
      key: _identityKeyPairKey,
      value: jsonEncode({
        'version': 2,
        'createdAt': DateTime.now().toIso8601String(),
        'algorithm': 'ML-KEM-768+X25519',
      }),
    );

    _logger.i('Identity key pair saved');
  }

  /// Get hybrid identity key pair
  Future<HybridKeyPair?> getIdentityKeyPair() async {
    _ensureInitialized();

    // Check if keypair exists
    final metadata = await _storage.read(key: _identityKeyPairKey);
    if (metadata == null) return null;

    try {
      // Read ML-KEM keys
      final mlKemPublicHex = await _storage.read(key: _mlKemPublicKeyKey);
      final mlKemSecretHex = await _storage.read(key: _mlKemSecretKeyKey);

      if (mlKemPublicHex == null || mlKemSecretHex == null) {
        _logger.w('ML-KEM keys missing');
        return null;
      }

      // Read X25519 keys
      final x25519PublicHex = await _storage.read(key: _x25519PublicKeyKey);
      final x25519PrivateHex = await _storage.read(key: _x25519PrivateKeyKey);

      if (x25519PublicHex == null || x25519PrivateHex == null) {
        _logger.w('X25519 keys missing');
        return null;
      }

      // Reconstruct the hybrid key pair
      final mlKemPublicKey = MlKemPublicKey.fromHex(mlKemPublicHex);
      final mlKemSecretKey = MlKemSecretKey.fromHex(mlKemSecretHex);
      final x25519Public = Uint8List.fromList(hex.decode(x25519PublicHex));
      final x25519Private = Uint8List.fromList(hex.decode(x25519PrivateHex));

      return HybridKeyPair.fromKeys(
        mlKemPublicKey: mlKemPublicKey,
        mlKemSecretKey: mlKemSecretKey,
        x25519PublicKey: x25519Public,
        x25519PrivateKey: x25519Private,
      );
    } catch (e, stack) {
      _logger.e('Failed to reconstruct identity key pair', error: e, stackTrace: stack);
      return null;
    }
  }

  /// Get public keys for sharing (without secret keys)
  Future<HybridPublicKeys?> getPublicKeys() async {
    _ensureInitialized();

    try {
      final mlKemPublicHex = await _storage.read(key: _mlKemPublicKeyKey);
      final x25519PublicHex = await _storage.read(key: _x25519PublicKeyKey);

      if (mlKemPublicHex == null || x25519PublicHex == null) {
        return null;
      }

      return HybridPublicKeys(
        mlKemPublicKey: mlKemPublicHex,
        x25519PublicKey: x25519PublicHex,
      );
    } catch (e) {
      _logger.e('Failed to get public keys', error: e);
      return null;
    }
  }

  /// Delete identity key pair securely
  Future<void> deleteIdentityKeyPair() async {
    _ensureInitialized();

    // Delete all key components
    await _storage.delete(key: _identityKeyPairKey);
    await _storage.delete(key: _mlKemPublicKeyKey);
    await _storage.delete(key: _mlKemSecretKeyKey);
    await _storage.delete(key: _x25519PublicKeyKey);
    await _storage.delete(key: _x25519PrivateKeyKey);

    _logger.i('Identity key pair deleted');
  }

  /// Check if identity key pair exists
  Future<bool> hasIdentityKeyPair() async {
    _ensureInitialized();
    return await _storage.containsKey(key: _identityKeyPairKey);
  }

  // ============================================
  // Device Identity Management
  // ============================================

  /// Save device ID
  Future<void> saveDeviceId(String deviceId) async {
    _ensureInitialized();
    await _storage.write(key: _deviceIdKey, value: deviceId);
  }

  /// Get device ID
  Future<String?> getDeviceId() async {
    _ensureInitialized();
    return await _storage.read(key: _deviceIdKey);
  }

  /// Save device name
  Future<void> saveDeviceName(String deviceName) async {
    _ensureInitialized();
    await _storage.write(key: _deviceNameKey, value: deviceName);
  }

  /// Get device name
  Future<String?> getDeviceName() async {
    _ensureInitialized();
    return await _storage.read(key: _deviceNameKey);
  }

  // ============================================
  // Trusted Devices Management
  // ============================================

  /// Save trusted device
  Future<void> saveTrustedDevice(TrustedDevice device) async {
    _ensureInitialized();

    final devices = await getTrustedDevices();
    devices.removeWhere((d) => d.deviceId == device.deviceId);
    devices.add(device);

    await _storage.write(
      key: _trustedDevicesKey,
      value: jsonEncode(devices.map((d) => d.toJson()).toList()),
    );
    _logger.i('Trusted device saved: ${device.deviceName}');
  }

  /// Get all trusted devices
  Future<List<TrustedDevice>> getTrustedDevices() async {
    _ensureInitialized();

    final data = await _storage.read(key: _trustedDevicesKey);
    if (data == null) return [];

    final list = jsonDecode(data) as List;
    return list
        .map((item) => TrustedDevice.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Get trusted device by ID
  Future<TrustedDevice?> getTrustedDevice(String deviceId) async {
    final devices = await getTrustedDevices();
    try {
      return devices.firstWhere((d) => d.deviceId == deviceId);
    } catch (e) {
      return null;
    }
  }

  /// Remove trusted device
  Future<void> removeTrustedDevice(String deviceId) async {
    _ensureInitialized();

    final devices = await getTrustedDevices();
    devices.removeWhere((d) => d.deviceId == deviceId);

    await _storage.write(
      key: _trustedDevicesKey,
      value: jsonEncode(devices.map((d) => d.toJson()).toList()),
    );
    _logger.i('Trusted device removed: $deviceId');
  }

  // ============================================
  // Session Keys Management
  // ============================================

  /// Save session key for a peer
  Future<void> saveSessionKey(String peerId, Uint8List sessionKey) async {
    _ensureInitialized();

    await _storage.write(
      key: '$_sessionKeysPrefix$peerId',
      value: hex.encode(sessionKey),
    );
  }

  /// Get session key for a peer
  Future<Uint8List?> getSessionKey(String peerId) async {
    _ensureInitialized();

    final data = await _storage.read(key: '$_sessionKeysPrefix$peerId');
    if (data == null) return null;

    return Uint8List.fromList(hex.decode(data));
  }

  /// Delete session key for a peer
  Future<void> deleteSessionKey(String peerId) async {
    _ensureInitialized();
    await _storage.delete(key: '$_sessionKeysPrefix$peerId');
  }

  /// Delete all session keys
  Future<void> deleteAllSessionKeys() async {
    _ensureInitialized();

    final allKeys = await _storage.readAll();
    for (final key in allKeys.keys) {
      if (key.startsWith(_sessionKeysPrefix)) {
        await _storage.delete(key: key);
      }
    }
    _logger.i('All session keys deleted');
  }

  // ============================================
  // Settings Management
  // ============================================

  /// Save secure settings
  Future<void> saveSecureSettings(Map<String, dynamic> settings) async {
    _ensureInitialized();
    await _storage.write(key: _settingsKey, value: jsonEncode(settings));
  }

  /// Get secure settings
  Future<Map<String, dynamic>> getSecureSettings() async {
    _ensureInitialized();

    final data = await _storage.read(key: _settingsKey);
    if (data == null) return {};

    return jsonDecode(data) as Map<String, dynamic>;
  }

  // ============================================
  // Utility Methods
  // ============================================

  /// Check if storage contains a key
  Future<bool> containsKey(String key) async {
    _ensureInitialized();
    return await _storage.containsKey(key: key);
  }

  /// Delete all data (use with caution!)
  Future<void> deleteAll() async {
    _ensureInitialized();
    await _storage.deleteAll();
    _logger.w('All secure storage data deleted');
  }

  /// Export all data (for backup - excludes secret keys)
  Future<Map<String, String>> exportPublicData() async {
    _ensureInitialized();

    final allData = await _storage.readAll();
    final publicData = <String, String>{};

    // Only export non-sensitive data
    for (final entry in allData.entries) {
      if (!entry.key.contains('secret') &&
          !entry.key.contains('private') &&
          !entry.key.contains('session_key')) {
        publicData[entry.key] = entry.value;
      }
    }

    return publicData;
  }
}

/// Hybrid key pair (ML-KEM-768 + X25519)
class HybridKeyPair {
  final MlKemPublicKey mlKemPublicKey;
  final MlKemSecretKey mlKemSecretKey;
  final Uint8List _x25519PublicKey;
  final Uint8List _x25519PrivateKey;

  HybridKeyPair._({
    required this.mlKemPublicKey,
    required this.mlKemSecretKey,
    required Uint8List x25519PublicKey,
    required Uint8List x25519PrivateKey,
  })  : _x25519PublicKey = x25519PublicKey,
        _x25519PrivateKey = x25519PrivateKey;

  /// Create from existing keys
  static HybridKeyPair fromKeys({
    required MlKemPublicKey mlKemPublicKey,
    required MlKemSecretKey mlKemSecretKey,
    required Uint8List x25519PublicKey,
    required Uint8List x25519PrivateKey,
  }) {
    return HybridKeyPair._(
      mlKemPublicKey: mlKemPublicKey,
      mlKemSecretKey: mlKemSecretKey,
      x25519PublicKey: x25519PublicKey,
      x25519PrivateKey: x25519PrivateKey,
    );
  }

  /// Generate new hybrid key pair
  static Future<HybridKeyPair> generate() async {
    // Generate ML-KEM-768 key pair
    final pqc = PqcCrypto();
    final mlKemKeyPair = await pqc.generateKeyPair();

    // Generate X25519 key pair
    final x25519 = crypto.X25519();
    final x25519KeyPair = await x25519.newKeyPair();
    final x25519Public = await x25519KeyPair.extractPublicKey();

    return HybridKeyPair._(
      mlKemPublicKey: mlKemKeyPair.publicKey,
      mlKemSecretKey: mlKemKeyPair.secretKey,
      x25519PublicKey: Uint8List.fromList(x25519Public.bytes),
      x25519PrivateKey: Uint8List.fromList(
        await x25519KeyPair.extractPrivateKeyBytes(),
      ),
    );
  }

  /// Export X25519 keys for storage
  Future<X25519Keys> exportX25519Keys() async {
    return X25519Keys(
      publicKey: _x25519PublicKey,
      privateKey: _x25519PrivateKey,
    );
  }

  /// Get public key JSON for sharing
  Future<Map<String, String>> toPublicKeyJson() async {
    return {
      'mlKem': mlKemPublicKey.toHex(),
      'x25519': hex.encode(_x25519PublicKey),
    };
  }

  /// Perform hybrid key exchange
  Future<Uint8List> keyExchange(HybridPublicKeys peerPublicKeys) async {
    // 1. ML-KEM encapsulation
    final pqc = PqcCrypto();
    final peerMlKemPublic = MlKemPublicKey.fromHex(peerPublicKeys.mlKemPublicKey);
    final encapsulation = await pqc.encapsulate(peerMlKemPublic);

    // 2. X25519 key exchange
    final x25519 = crypto.X25519();
    final x25519KeyPair = await x25519.newKeyPairFromSeed(_x25519PrivateKey);
    final peerX25519Public = crypto.SimplePublicKey(
      hex.decode(peerPublicKeys.x25519PublicKey),
      type: crypto.KeyPairType.x25519,
    );
    final x25519Secret = await x25519.sharedSecretKey(
      keyPair: x25519KeyPair,
      remotePublicKey: peerX25519Public,
    );
    final x25519SecretBytes = await x25519Secret.extractBytes();

    // 3. Combine secrets using HKDF
    final combinedSecret = Uint8List.fromList([
      ...encapsulation.sharedSecret,
      ...x25519SecretBytes,
    ]);

    final hkdf = crypto.Hkdf(
      hmac: crypto.Hmac.sha256(),
      outputLength: 32,
    );
    final derivedKey = await hkdf.deriveKey(
      secretKey: crypto.SecretKey(combinedSecret),
      info: 'tallow-hybrid-key-v1'.codeUnits,
      nonce: Uint8List(0),
    );

    // Clean up
    encapsulation.clearSharedSecret();

    return Uint8List.fromList(await derivedKey.extractBytes());
  }

  /// Securely clear secret keys from memory
  void clear() {
    mlKemSecretKey.clear();
    for (var i = 0; i < _x25519PrivateKey.length; i++) {
      _x25519PrivateKey[i] = 0;
    }
  }
}

/// X25519 key pair for storage
class X25519Keys {
  final Uint8List publicKey;
  final Uint8List privateKey;

  X25519Keys({
    required this.publicKey,
    required this.privateKey,
  });
}

/// Public keys for sharing (no secret material)
class HybridPublicKeys {
  final String mlKemPublicKey;
  final String x25519PublicKey;

  HybridPublicKeys({
    required this.mlKemPublicKey,
    required this.x25519PublicKey,
  });

  Map<String, String> toJson() => {
        'mlKem': mlKemPublicKey,
        'x25519': x25519PublicKey,
      };

  factory HybridPublicKeys.fromJson(Map<String, dynamic> json) {
    return HybridPublicKeys(
      mlKemPublicKey: json['mlKem'] as String,
      x25519PublicKey: json['x25519'] as String,
    );
  }
}

/// Represents a trusted device
class TrustedDevice {
  final String deviceId;
  final String deviceName;
  final String publicKeyHex;
  final DateTime firstSeen;
  final DateTime lastSeen;
  final bool isVerified;
  final String? verificationCode;

  TrustedDevice({
    required this.deviceId,
    required this.deviceName,
    required this.publicKeyHex,
    required this.firstSeen,
    required this.lastSeen,
    this.isVerified = false,
    this.verificationCode,
  });

  TrustedDevice copyWith({
    String? deviceId,
    String? deviceName,
    String? publicKeyHex,
    DateTime? firstSeen,
    DateTime? lastSeen,
    bool? isVerified,
    String? verificationCode,
  }) {
    return TrustedDevice(
      deviceId: deviceId ?? this.deviceId,
      deviceName: deviceName ?? this.deviceName,
      publicKeyHex: publicKeyHex ?? this.publicKeyHex,
      firstSeen: firstSeen ?? this.firstSeen,
      lastSeen: lastSeen ?? this.lastSeen,
      isVerified: isVerified ?? this.isVerified,
      verificationCode: verificationCode ?? this.verificationCode,
    );
  }

  Map<String, dynamic> toJson() => {
        'deviceId': deviceId,
        'deviceName': deviceName,
        'publicKeyHex': publicKeyHex,
        'firstSeen': firstSeen.toIso8601String(),
        'lastSeen': lastSeen.toIso8601String(),
        'isVerified': isVerified,
        'verificationCode': verificationCode,
      };

  factory TrustedDevice.fromJson(Map<String, dynamic> json) {
    return TrustedDevice(
      deviceId: json['deviceId'] as String,
      deviceName: json['deviceName'] as String,
      publicKeyHex: json['publicKeyHex'] as String,
      firstSeen: DateTime.parse(json['firstSeen'] as String),
      lastSeen: DateTime.parse(json['lastSeen'] as String),
      isVerified: json['isVerified'] as bool? ?? false,
      verificationCode: json['verificationCode'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrustedDevice &&
          runtimeType == other.runtimeType &&
          deviceId == other.deviceId;

  @override
  int get hashCode => deviceId.hashCode;
}
