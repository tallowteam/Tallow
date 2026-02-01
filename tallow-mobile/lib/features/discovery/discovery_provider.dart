import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/mdns_discovery.dart';
import '../../core/network/signaling_client.dart';
import '../../core/storage/secure_storage.dart';

/// Discovery state model
class DiscoveryState {
  final List<DiscoveredDevice> localDevices;
  final List<DiscoveredDevice> onlineDevices;
  final bool isScanning;
  final bool isAdvertising;
  final String? roomCode;
  final String? errorMessage;
  final DiscoveryMode mode;

  const DiscoveryState({
    this.localDevices = const [],
    this.onlineDevices = const [],
    this.isScanning = false,
    this.isAdvertising = false,
    this.roomCode,
    this.errorMessage,
    this.mode = DiscoveryMode.local,
  });

  DiscoveryState copyWith({
    List<DiscoveredDevice>? localDevices,
    List<DiscoveredDevice>? onlineDevices,
    bool? isScanning,
    bool? isAdvertising,
    String? roomCode,
    String? errorMessage,
    DiscoveryMode? mode,
  }) {
    return DiscoveryState(
      localDevices: localDevices ?? this.localDevices,
      onlineDevices: onlineDevices ?? this.onlineDevices,
      isScanning: isScanning ?? this.isScanning,
      isAdvertising: isAdvertising ?? this.isAdvertising,
      roomCode: roomCode ?? this.roomCode,
      errorMessage: errorMessage,
      mode: mode ?? this.mode,
    );
  }

  List<DiscoveredDevice> get allDevices => [...localDevices, ...onlineDevices];
}

/// Discovery mode
enum DiscoveryMode {
  local,
  online,
  both,
}

/// Discovery provider
class DiscoveryNotifier extends StateNotifier<DiscoveryState> {
  final _mdns = MdnsDiscovery();
  final _signaling = SignalingClient();
  final _storage = SecureStorageService.instance;

  StreamSubscription? _deviceSubscription;
  StreamSubscription? _peerSubscription;

  DiscoveryNotifier() : super(const DiscoveryState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _mdns.initialize();

    // Listen to mDNS discovered devices
    _deviceSubscription = _mdns.deviceStream.listen((devices) {
      state = state.copyWith(localDevices: devices);
    });

    // Get device info for signaling
    final deviceId = await _storage.getDeviceId();
    final deviceName = await _storage.getDeviceName();

    if (deviceId != null && deviceName != null) {
      _signaling.initialize(
        deviceId: deviceId,
        deviceName: deviceName,
      );
    }
  }

  /// Start local network scanning
  Future<void> startLocalScan() async {
    if (state.isScanning) return;

    state = state.copyWith(isScanning: true, errorMessage: null);

    try {
      await _mdns.startDiscovery();
    } catch (e) {
      state = state.copyWith(
        isScanning: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Stop local network scanning
  Future<void> stopLocalScan() async {
    await _mdns.stopDiscovery();
    state = state.copyWith(isScanning: false);
  }

  /// Start advertising this device
  Future<void> startAdvertising() async {
    if (state.isAdvertising) return;

    try {
      await _mdns.startAdvertising();
      state = state.copyWith(isAdvertising: true);
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  /// Stop advertising
  Future<void> stopAdvertising() async {
    await _mdns.stopAdvertising();
    state = state.copyWith(isAdvertising: false);
  }

  /// Create a room for online discovery
  Future<String?> createRoom() async {
    try {
      await _signaling.connect();

      // Listen for peers joining
      _peerSubscription?.cancel();
      _peerSubscription = _signaling.peerJoined.listen((peer) {
        final device = DiscoveredDevice(
          id: peer.deviceId,
          name: peer.deviceName,
          address: '',
          port: 0,
          lastSeen: DateTime.now(),
          publicKeyHex: peer.publicKeyHex,
        );

        state = state.copyWith(
          onlineDevices: [...state.onlineDevices, device],
        );
      });

      _signaling.peerLeft.listen((peerId) {
        state = state.copyWith(
          onlineDevices: state.onlineDevices
              .where((d) => d.id != peerId)
              .toList(),
        );
      });

      final roomCode = await _signaling.createRoom();
      state = state.copyWith(roomCode: roomCode);
      return roomCode;
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
      return null;
    }
  }

  /// Join an existing room
  Future<bool> joinRoom(String roomCode) async {
    try {
      await _signaling.connect();

      final peers = await _signaling.joinRoom(roomCode);

      final devices = peers.map((peer) => DiscoveredDevice(
            id: peer.deviceId,
            name: peer.deviceName,
            address: '',
            port: 0,
            lastSeen: DateTime.now(),
            publicKeyHex: peer.publicKeyHex,
          )).toList();

      state = state.copyWith(
        roomCode: roomCode,
        onlineDevices: devices,
      );

      // Listen for more peers
      _peerSubscription?.cancel();
      _peerSubscription = _signaling.peerJoined.listen((peer) {
        final device = DiscoveredDevice(
          id: peer.deviceId,
          name: peer.deviceName,
          address: '',
          port: 0,
          lastSeen: DateTime.now(),
          publicKeyHex: peer.publicKeyHex,
        );

        state = state.copyWith(
          onlineDevices: [...state.onlineDevices, device],
        );
      });

      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
      return false;
    }
  }

  /// Leave the current room
  Future<void> leaveRoom() async {
    await _signaling.leaveRoom();
    _peerSubscription?.cancel();
    state = state.copyWith(
      roomCode: null,
      onlineDevices: [],
    );
  }

  /// Set discovery mode
  void setMode(DiscoveryMode mode) {
    state = state.copyWith(mode: mode);
  }

  /// Refresh device list
  Future<void> refresh() async {
    if (state.mode == DiscoveryMode.local || state.mode == DiscoveryMode.both) {
      await stopLocalScan();
      await startLocalScan();
    }
  }

  /// Trust a device
  Future<void> trustDevice(DiscoveredDevice device) async {
    final trustedDevice = TrustedDevice(
      deviceId: device.id,
      deviceName: device.name,
      publicKeyHex: device.publicKeyHex ?? '',
      firstSeen: DateTime.now(),
      lastSeen: DateTime.now(),
      isVerified: false,
    );

    await _storage.saveTrustedDevice(trustedDevice);
  }

  /// Check if device is trusted
  Future<bool> isDeviceTrusted(String deviceId) async {
    final device = await _storage.getTrustedDevice(deviceId);
    return device != null;
  }

  /// Get signaling client for WebRTC setup
  SignalingClient get signalingClient => _signaling;

  @override
  void dispose() {
    _deviceSubscription?.cancel();
    _peerSubscription?.cancel();
    _mdns.dispose();
    _signaling.dispose();
    super.dispose();
  }
}

/// Provider for discovery state
final discoveryProvider = StateNotifierProvider<DiscoveryNotifier, DiscoveryState>(
  (ref) => DiscoveryNotifier(),
);
