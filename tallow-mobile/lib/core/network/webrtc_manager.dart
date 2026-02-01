import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:uuid/uuid.dart';
import 'package:logger/logger.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

import '../crypto/aes_gcm.dart';
import '../../shared/utils/secure_logger.dart';

/// WebRTC manager for P2P connections
class WebRTCManager {
  static final WebRTCManager _instance = WebRTCManager._internal();
  factory WebRTCManager() => _instance;
  WebRTCManager._internal();

  final _logger = SecureLogger('WebRTCManager');
  final _uuid = const Uuid();
  final _aesGcm = AesGcmCrypto();

  // Active connections
  final Map<String, PeerConnection> _connections = {};

  // Configuration
  static const int chunkSize = 64 * 1024; // 64KB chunks
  static const int maxBufferedAmount = 16 * 1024 * 1024; // 16MB buffer

  // TURN credential cache
  TurnCredentials? _cachedCredentials;
  DateTime? _credentialsExpiry;

  // Signaling server URL for fetching TURN credentials
  static const String _signalingServerUrl = 'https://signaling.tallow.app';
  static const String _turnCredentialsEndpoint = '/api/v1/turn-credentials';

  /// Fetch TURN credentials from signaling server
  Future<TurnCredentials> _fetchTurnCredentials() async {
    // Check cache first
    if (_cachedCredentials != null &&
        _credentialsExpiry != null &&
        DateTime.now().isBefore(_credentialsExpiry!)) {
      return _cachedCredentials!;
    }

    try {
      final response = await http.get(
        Uri.parse('$_signalingServerUrl$_turnCredentialsEndpoint'),
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Version': '1.0.0',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        _cachedCredentials = TurnCredentials(
          urls: (data['urls'] as List).cast<String>(),
          username: data['username'] as String,
          credential: data['credential'] as String,
          ttl: data['ttl'] as int? ?? 3600,
        );
        _credentialsExpiry = DateTime.now().add(
          Duration(seconds: _cachedCredentials!.ttl - 60), // Refresh 1 min early
        );
        return _cachedCredentials!;
      } else {
        throw Exception('Failed to fetch TURN credentials: ${response.statusCode}');
      }
    } catch (e) {
      _logger.w('Failed to fetch TURN credentials, using fallback STUN only');
      // Fallback to STUN-only (no TURN relay)
      return TurnCredentials(
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
        ],
        username: '',
        credential: '',
        ttl: 3600,
      );
    }
  }

  /// Get ICE servers configuration with fresh TURN credentials
  Future<Map<String, dynamic>> _getIceConfig() async {
    final credentials = await _fetchTurnCredentials();

    final iceServers = <Map<String, dynamic>>[
      // Google STUN servers (free, always available)
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
      {'urls': 'stun:stun2.l.google.com:19302'},
    ];

    // Add TURN servers only if credentials are available
    if (credentials.username.isNotEmpty && credentials.credential.isNotEmpty) {
      for (final url in credentials.urls) {
        if (url.startsWith('turn:') || url.startsWith('turns:')) {
          iceServers.add({
            'urls': url,
            'username': credentials.username,
            'credential': credentials.credential,
          });
        }
      }
    }

    return {
      'iceServers': iceServers,
      'iceCandidatePoolSize': 10,
      'iceTransportPolicy': 'all',
      'bundlePolicy': 'max-bundle',
      'rtcpMuxPolicy': 'require',
    };
  }

  /// Create a new peer connection
  Future<PeerConnection> createConnection({
    required String peerId,
    required bool isInitiator,
    required void Function(RTCIceCandidate) onIceCandidate,
    required void Function(RTCSessionDescription) onLocalDescription,
    required void Function(PeerConnectionState) onStateChange,
    required void Function(Uint8List) onData,
    Uint8List? sessionKey,
  }) async {
    final connectionId = _uuid.v4();

    // Get fresh ICE configuration with TURN credentials
    final iceConfig = await _getIceConfig();
    final pc = await createPeerConnection(iceConfig);

    final connection = PeerConnection(
      id: connectionId,
      peerId: peerId,
      pc: pc,
      isInitiator: isInitiator,
      sessionKey: sessionKey,
      onData: onData,
    );

    // Set up event handlers
    pc.onIceCandidate = (candidate) {
      if (candidate.candidate != null) {
        onIceCandidate(candidate);
      }
    };

    pc.onIceConnectionState = (state) {
      _logger.d('ICE connection state: $state');
      connection.iceState = state;
      onStateChange(_mapIceState(state));
    };

    pc.onConnectionState = (state) {
      _logger.d('Connection state: $state');
      connection.connectionState = state;
    };

    pc.onSignalingState = (state) {
      _logger.d('Signaling state: $state');
    };

    pc.onIceGatheringState = (state) {
      _logger.d('ICE gathering state: $state');
    };

    // Create data channel if initiator
    if (isInitiator) {
      final dataChannel = await pc.createDataChannel(
        'tallow-transfer',
        RTCDataChannelInit()
          ..ordered = true
          ..maxRetransmits = 30,
      );
      _setupDataChannel(connection, dataChannel);
    } else {
      pc.onDataChannel = (channel) {
        _setupDataChannel(connection, channel);
      };
    }

    _connections[connectionId] = connection;
    return connection;
  }

  void _setupDataChannel(PeerConnection connection, RTCDataChannel channel) {
    connection.dataChannel = channel;

    channel.onDataChannelState = (state) {
      _logger.d('Data channel state: $state');
      connection.channelState = state;
    };

    channel.onMessage = (message) async {
      try {
        Uint8List data;
        if (message.isBinary) {
          data = message.binary;
        } else {
          data = Uint8List.fromList(message.text.codeUnits);
        }

        // Decrypt if session key is set
        if (connection.sessionKey != null) {
          data = await _aesGcm.decrypt(data, connection.sessionKey!);
        }

        connection.onData(data);
      } catch (e, stack) {
        _logger.e('Error processing message', error: e, stackTrace: stack);
      }
    };
  }

  /// Create offer (initiator)
  Future<RTCSessionDescription> createOffer(String connectionId) async {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');

    final offer = await connection.pc.createOffer({
      'offerToReceiveAudio': false,
      'offerToReceiveVideo': false,
    });
    await connection.pc.setLocalDescription(offer);
    return offer;
  }

  /// Create answer (responder)
  Future<RTCSessionDescription> createAnswer(String connectionId) async {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');

    final answer = await connection.pc.createAnswer();
    await connection.pc.setLocalDescription(answer);
    return answer;
  }

  /// Set remote description
  Future<void> setRemoteDescription(
    String connectionId,
    RTCSessionDescription description,
  ) async {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');

    await connection.pc.setRemoteDescription(description);
  }

  /// Add ICE candidate
  Future<void> addIceCandidate(String connectionId, RTCIceCandidate candidate) async {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');

    await connection.pc.addCandidate(candidate);
  }

  /// Send data through connection
  Future<void> sendData(String connectionId, Uint8List data) async {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');
    if (connection.dataChannel == null) throw Exception('Data channel not ready');

    // Encrypt if session key is set
    Uint8List sendData = data;
    if (connection.sessionKey != null) {
      sendData = await _aesGcm.encrypt(data, connection.sessionKey!);
    }

    // Wait for buffer to drain if needed
    while (connection.dataChannel!.bufferedAmount != null &&
        connection.dataChannel!.bufferedAmount! > maxBufferedAmount) {
      await Future.delayed(const Duration(milliseconds: 10));
    }

    connection.dataChannel!.send(RTCDataChannelMessage.fromBinary(sendData));
  }

  /// Send file in chunks
  Stream<TransferProgress> sendFile(
    String connectionId,
    Uint8List fileData,
    String fileName,
  ) async* {
    final connection = _connections[connectionId];
    if (connection == null) throw Exception('Connection not found');

    final totalChunks = (fileData.length / chunkSize).ceil();
    var sentChunks = 0;

    // Send file metadata first
    final metadata = FileTransferMetadata(
      fileName: fileName,
      fileSize: fileData.length,
      totalChunks: totalChunks,
      chunkSize: chunkSize,
    );
    await sendData(connectionId, metadata.toBytes());

    // Send file chunks
    for (var i = 0; i < fileData.length; i += chunkSize) {
      final end = (i + chunkSize < fileData.length) ? i + chunkSize : fileData.length;
      final chunk = fileData.sublist(i, end);

      // Create chunk packet with index
      final packet = ChunkPacket(
        chunkIndex: sentChunks,
        data: chunk,
      );

      await sendData(connectionId, packet.toBytes());
      sentChunks++;

      yield TransferProgress(
        bytesTransferred: end,
        totalBytes: fileData.length,
        chunksTransferred: sentChunks,
        totalChunks: totalChunks,
        progress: end / fileData.length,
      );
    }

    // Send completion signal
    await sendData(connectionId, Uint8List.fromList([0xFF, 0xFF, 0xFF, 0xFF]));
  }

  /// Close connection
  Future<void> closeConnection(String connectionId) async {
    final connection = _connections[connectionId];
    if (connection == null) return;

    await connection.dataChannel?.close();
    await connection.pc.close();
    _connections.remove(connectionId);
  }

  /// Close all connections
  Future<void> closeAllConnections() async {
    for (final connectionId in _connections.keys.toList()) {
      await closeConnection(connectionId);
    }
  }

  /// Invalidate cached TURN credentials (for security rotation)
  void invalidateCredentials() {
    _cachedCredentials = null;
    _credentialsExpiry = null;
  }

  PeerConnectionState _mapIceState(RTCIceConnectionState state) {
    switch (state) {
      case RTCIceConnectionState.RTCIceConnectionStateNew:
        return PeerConnectionState.connecting;
      case RTCIceConnectionState.RTCIceConnectionStateChecking:
        return PeerConnectionState.connecting;
      case RTCIceConnectionState.RTCIceConnectionStateConnected:
        return PeerConnectionState.connected;
      case RTCIceConnectionState.RTCIceConnectionStateCompleted:
        return PeerConnectionState.connected;
      case RTCIceConnectionState.RTCIceConnectionStateDisconnected:
        return PeerConnectionState.disconnected;
      case RTCIceConnectionState.RTCIceConnectionStateFailed:
        return PeerConnectionState.failed;
      case RTCIceConnectionState.RTCIceConnectionStateClosed:
        return PeerConnectionState.closed;
      default:
        return PeerConnectionState.unknown;
    }
  }
}

/// TURN credentials from signaling server
class TurnCredentials {
  final List<String> urls;
  final String username;
  final String credential;
  final int ttl;

  TurnCredentials({
    required this.urls,
    required this.username,
    required this.credential,
    required this.ttl,
  });
}

/// Peer connection wrapper
class PeerConnection {
  final String id;
  final String peerId;
  final RTCPeerConnection pc;
  final bool isInitiator;
  final Uint8List? sessionKey;
  final void Function(Uint8List) onData;

  RTCDataChannel? dataChannel;
  RTCIceConnectionState? iceState;
  RTCPeerConnectionState? connectionState;
  RTCDataChannelState? channelState;

  PeerConnection({
    required this.id,
    required this.peerId,
    required this.pc,
    required this.isInitiator,
    required this.onData,
    this.sessionKey,
  });

  bool get isConnected =>
      iceState == RTCIceConnectionState.RTCIceConnectionStateConnected ||
      iceState == RTCIceConnectionState.RTCIceConnectionStateCompleted;

  bool get isDataChannelOpen =>
      channelState == RTCDataChannelState.RTCDataChannelOpen;
}

/// Connection state enum
enum PeerConnectionState {
  connecting,
  connected,
  disconnected,
  failed,
  closed,
  unknown,
}

/// Transfer progress
class TransferProgress {
  final int bytesTransferred;
  final int totalBytes;
  final int chunksTransferred;
  final int totalChunks;
  final double progress;

  TransferProgress({
    required this.bytesTransferred,
    required this.totalBytes,
    required this.chunksTransferred,
    required this.totalChunks,
    required this.progress,
  });
}

/// File transfer metadata
class FileTransferMetadata {
  final String fileName;
  final int fileSize;
  final int totalChunks;
  final int chunkSize;

  FileTransferMetadata({
    required this.fileName,
    required this.fileSize,
    required this.totalChunks,
    required this.chunkSize,
  });

  Uint8List toBytes() {
    final json = '{"type":"metadata","fileName":"$fileName","fileSize":$fileSize,"totalChunks":$totalChunks,"chunkSize":$chunkSize}';
    return Uint8List.fromList([0x01, ...json.codeUnits]);
  }

  static FileTransferMetadata? fromBytes(Uint8List data) {
    if (data.isEmpty || data[0] != 0x01) return null;
    try {
      final json = String.fromCharCodes(data.sublist(1));
      final map = _parseJson(json);
      return FileTransferMetadata(
        fileName: map['fileName'] as String,
        fileSize: map['fileSize'] as int,
        totalChunks: map['totalChunks'] as int,
        chunkSize: map['chunkSize'] as int,
      );
    } catch (e) {
      return null;
    }
  }

  static Map<String, dynamic> _parseJson(String json) {
    final result = <String, dynamic>{};
    final content = json.substring(1, json.length - 1);
    final pairs = content.split(',');
    for (final pair in pairs) {
      final parts = pair.split(':');
      if (parts.length == 2) {
        var key = parts[0].trim().replaceAll('"', '');
        var value = parts[1].trim();
        if (value.startsWith('"')) {
          result[key] = value.replaceAll('"', '');
        } else {
          result[key] = int.tryParse(value) ?? value;
        }
      }
    }
    return result;
  }
}

/// Chunk packet
class ChunkPacket {
  final int chunkIndex;
  final Uint8List data;

  ChunkPacket({
    required this.chunkIndex,
    required this.data,
  });

  Uint8List toBytes() {
    final result = Uint8List(5 + data.length);
    result[0] = 0x02; // Chunk type marker
    result[1] = (chunkIndex >> 24) & 0xFF;
    result[2] = (chunkIndex >> 16) & 0xFF;
    result[3] = (chunkIndex >> 8) & 0xFF;
    result[4] = chunkIndex & 0xFF;
    result.setRange(5, result.length, data);
    return result;
  }

  static ChunkPacket? fromBytes(Uint8List data) {
    if (data.length < 5 || data[0] != 0x02) return null;
    final chunkIndex = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4];
    return ChunkPacket(
      chunkIndex: chunkIndex,
      data: data.sublist(5),
    );
  }
}
