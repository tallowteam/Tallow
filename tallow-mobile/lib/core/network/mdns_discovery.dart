import 'dart:async';
import 'dart:io';
import 'package:multicast_dns/multicast_dns.dart';
import 'package:logger/logger.dart';
import 'package:uuid/uuid.dart';
import 'package:device_info_plus/device_info_plus.dart';

/// mDNS-based local network device discovery
class MdnsDiscovery {
  static final MdnsDiscovery _instance = MdnsDiscovery._internal();
  factory MdnsDiscovery() => _instance;
  MdnsDiscovery._internal();

  final _logger = Logger();
  final _uuid = const Uuid();
  final _deviceInfo = DeviceInfoPlugin();

  // Service configuration
  static const String serviceType = '_tallow._tcp.local';
  static const String serviceName = 'tallow';
  static const int servicePort = 42000;

  // Discovery state
  MDnsClient? _mdnsClient;
  ServerSocket? _serverSocket;
  bool _isAdvertising = false;
  bool _isDiscovering = false;
  String? _deviceId;
  String? _deviceName;

  // Discovered devices
  final Map<String, DiscoveredDevice> _discoveredDevices = {};
  final _deviceStreamController = StreamController<List<DiscoveredDevice>>.broadcast();

  Stream<List<DiscoveredDevice>> get deviceStream => _deviceStreamController.stream;
  List<DiscoveredDevice> get discoveredDevices => _discoveredDevices.values.toList();
  bool get isAdvertising => _isAdvertising;
  bool get isDiscovering => _isDiscovering;

  /// Initialize with device info
  Future<void> initialize() async {
    _deviceId = _uuid.v4();
    _deviceName = await _getDeviceName();
    _logger.i('mDNS initialized: $_deviceName ($_deviceId)');
  }

  /// Start advertising this device on the network
  Future<void> startAdvertising() async {
    if (_isAdvertising) return;

    try {
      // Start a server socket to accept connections
      _serverSocket = await ServerSocket.bind(InternetAddress.anyIPv4, servicePort);
      _serverSocket!.listen(_handleIncomingConnection);

      _isAdvertising = true;
      _logger.i('Started advertising on port $servicePort');
    } catch (e) {
      _logger.e('Failed to start advertising', error: e);
      rethrow;
    }
  }

  /// Stop advertising
  Future<void> stopAdvertising() async {
    if (!_isAdvertising) return;

    await _serverSocket?.close();
    _serverSocket = null;
    _isAdvertising = false;
    _logger.i('Stopped advertising');
  }

  /// Start discovering devices on the network
  Future<void> startDiscovery() async {
    if (_isDiscovering) return;

    try {
      _mdnsClient = MDnsClient();
      await _mdnsClient!.start();

      _isDiscovering = true;
      _logger.i('Started mDNS discovery');

      // Start periodic discovery
      _runDiscoveryLoop();
    } catch (e) {
      _logger.e('Failed to start discovery', error: e);
      rethrow;
    }
  }

  /// Stop discovering
  Future<void> stopDiscovery() async {
    if (!_isDiscovering) return;

    _mdnsClient?.stop();
    _mdnsClient = null;
    _isDiscovering = false;
    _discoveredDevices.clear();
    _deviceStreamController.add([]);
    _logger.i('Stopped discovery');
  }

  void _runDiscoveryLoop() async {
    while (_isDiscovering && _mdnsClient != null) {
      try {
        await _discoverDevices();
      } catch (e) {
        _logger.w('Discovery error', error: e);
      }
      await Future.delayed(const Duration(seconds: 5));
    }
  }

  Future<void> _discoverDevices() async {
    if (_mdnsClient == null) return;

    final now = DateTime.now();
    final expiredIds = <String>[];

    // Mark expired devices
    for (final entry in _discoveredDevices.entries) {
      if (now.difference(entry.value.lastSeen).inSeconds > 30) {
        expiredIds.add(entry.key);
      }
    }

    // Remove expired devices
    for (final id in expiredIds) {
      _discoveredDevices.remove(id);
    }

    // Query for PTR records
    await for (final ptr in _mdnsClient!.lookup<PtrResourceRecord>(
      ResourceRecordQuery.serverPointer(serviceType),
    )) {
      // Look up SRV record
      await for (final srv in _mdnsClient!.lookup<SrvResourceRecord>(
        ResourceRecordQuery.service(ptr.domainName),
      )) {
        // Look up A record
        await for (final ip in _mdnsClient!.lookup<IPAddressResourceRecord>(
          ResourceRecordQuery.addressIPv4(srv.target),
        )) {
          final deviceId = _extractDeviceId(ptr.domainName);
          if (deviceId != _deviceId) {
            final device = DiscoveredDevice(
              id: deviceId,
              name: _extractDeviceName(ptr.domainName),
              address: ip.address.address,
              port: srv.port,
              lastSeen: now,
            );
            _discoveredDevices[deviceId] = device;
          }
        }
      }
    }

    // Also scan local network for Tallow devices
    await _scanLocalNetwork();

    _deviceStreamController.add(_discoveredDevices.values.toList());
  }

  Future<void> _scanLocalNetwork() async {
    try {
      // Get local IP addresses
      final interfaces = await NetworkInterface.list();
      for (final interface in interfaces) {
        for (final addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            await _scanSubnet(addr.address);
          }
        }
      }
    } catch (e) {
      _logger.w('Network scan error', error: e);
    }
  }

  Future<void> _scanSubnet(String localAddress) async {
    final parts = localAddress.split('.');
    if (parts.length != 4) return;

    final subnet = '${parts[0]}.${parts[1]}.${parts[2]}';
    final futures = <Future>[];

    // Scan common addresses
    for (var i = 1; i < 255; i++) {
      final targetIp = '$subnet.$i';
      if (targetIp != localAddress) {
        futures.add(_probeDevice(targetIp));
      }
    }

    // Wait with timeout
    await Future.wait(futures).timeout(
      const Duration(seconds: 3),
      onTimeout: () => [],
    );
  }

  Future<void> _probeDevice(String ip) async {
    try {
      final socket = await Socket.connect(
        ip,
        servicePort,
        timeout: const Duration(milliseconds: 500),
      );

      // Send discovery probe
      socket.add('TALLOW_PROBE\n'.codeUnits);

      // Wait for response
      final response = await socket.first.timeout(
        const Duration(milliseconds: 500),
        onTimeout: () => [],
      );

      if (response.isNotEmpty) {
        final data = String.fromCharCodes(response).trim();
        if (data.startsWith('TALLOW_RESPONSE:')) {
          final parts = data.split(':');
          if (parts.length >= 3) {
            final deviceId = parts[1];
            final deviceName = parts[2];
            if (deviceId != _deviceId) {
              _discoveredDevices[deviceId] = DiscoveredDevice(
                id: deviceId,
                name: deviceName,
                address: ip,
                port: servicePort,
                lastSeen: DateTime.now(),
              );
            }
          }
        }
      }

      await socket.close();
    } catch (e) {
      // Device not responding or not a Tallow device
    }
  }

  void _handleIncomingConnection(Socket socket) {
    _logger.d('Incoming connection from ${socket.remoteAddress.address}');

    socket.listen((data) {
      final message = String.fromCharCodes(data).trim();
      if (message == 'TALLOW_PROBE') {
        socket.add('TALLOW_RESPONSE:$_deviceId:$_deviceName\n'.codeUnits);
      }
    });
  }

  String _extractDeviceId(String domainName) {
    final parts = domainName.split('.');
    if (parts.isNotEmpty) {
      final namePart = parts[0];
      if (namePart.contains('-')) {
        return namePart.split('-').last;
      }
    }
    return _uuid.v4();
  }

  String _extractDeviceName(String domainName) {
    final parts = domainName.split('.');
    if (parts.isNotEmpty) {
      final namePart = parts[0];
      if (namePart.contains('-')) {
        return namePart.split('-').first.replaceAll('_', ' ');
      }
      return namePart;
    }
    return 'Unknown Device';
  }

  Future<String> _getDeviceName() async {
    try {
      if (Platform.isAndroid) {
        final info = await _deviceInfo.androidInfo;
        return info.model;
      } else if (Platform.isIOS) {
        final info = await _deviceInfo.iosInfo;
        return info.name;
      } else if (Platform.isMacOS) {
        final info = await _deviceInfo.macOsInfo;
        return info.computerName;
      } else if (Platform.isWindows) {
        final info = await _deviceInfo.windowsInfo;
        return info.computerName;
      } else if (Platform.isLinux) {
        final info = await _deviceInfo.linuxInfo;
        return info.prettyName;
      }
    } catch (e) {
      _logger.w('Failed to get device name', error: e);
    }
    return 'Tallow Device';
  }

  /// Connect to a discovered device
  Future<Socket> connectToDevice(DiscoveredDevice device) async {
    return await Socket.connect(device.address, device.port);
  }

  /// Clean up resources
  Future<void> dispose() async {
    await stopDiscovery();
    await stopAdvertising();
    await _deviceStreamController.close();
  }
}

/// Represents a discovered device on the network
class DiscoveredDevice {
  final String id;
  final String name;
  final String address;
  final int port;
  final DateTime lastSeen;
  final DeviceType type;
  final String? publicKeyHex;

  DiscoveredDevice({
    required this.id,
    required this.name,
    required this.address,
    required this.port,
    required this.lastSeen,
    this.type = DeviceType.unknown,
    this.publicKeyHex,
  });

  DiscoveredDevice copyWith({
    String? id,
    String? name,
    String? address,
    int? port,
    DateTime? lastSeen,
    DeviceType? type,
    String? publicKeyHex,
  }) {
    return DiscoveredDevice(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      port: port ?? this.port,
      lastSeen: lastSeen ?? this.lastSeen,
      type: type ?? this.type,
      publicKeyHex: publicKeyHex ?? this.publicKeyHex,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'address': address,
        'port': port,
        'lastSeen': lastSeen.toIso8601String(),
        'type': type.name,
        'publicKeyHex': publicKeyHex,
      };

  factory DiscoveredDevice.fromJson(Map<String, dynamic> json) {
    return DiscoveredDevice(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      port: json['port'] as int,
      lastSeen: DateTime.parse(json['lastSeen'] as String),
      type: DeviceType.values.firstWhere(
        (t) => t.name == json['type'],
        orElse: () => DeviceType.unknown,
      ),
      publicKeyHex: json['publicKeyHex'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DiscoveredDevice &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Device type enumeration
enum DeviceType {
  phone,
  tablet,
  laptop,
  desktop,
  tv,
  unknown,
}
