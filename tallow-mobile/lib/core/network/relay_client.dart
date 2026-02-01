import 'dart:async';
import 'dart:typed_data';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:logger/logger.dart';
import 'package:uuid/uuid.dart';

import '../crypto/aes_gcm.dart';

/// Relay client for fallback when P2P connection fails
/// Routes encrypted data through a relay server
class RelayClient {
  static final RelayClient _instance = RelayClient._internal();
  factory RelayClient() => _instance;
  RelayClient._internal();

  final _logger = Logger();
  final _uuid = const Uuid();
  final _aesGcm = AesGcmCrypto();

  // Relay server configuration
  static const String defaultRelayUrl = 'wss://relay.tallow.app/ws';
  static const int maxMessageSize = 64 * 1024; // 64KB
  static const Duration reconnectDelay = Duration(seconds: 2);
  static const int maxReconnectAttempts = 5;

  WebSocketChannel? _channel;
  String? _sessionId;
  String? _peerId;
  Uint8List? _sessionKey;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;

  // Streams
  final _connectionStateController = StreamController<RelayState>.broadcast();
  final _dataController = StreamController<RelayData>.broadcast();
  final _errorController = StreamController<RelayError>.broadcast();

  Stream<RelayState> get connectionState => _connectionStateController.stream;
  Stream<RelayData> get dataStream => _dataController.stream;
  Stream<RelayError> get errors => _errorController.stream;

  bool get isConnected => _isConnected;
  String? get sessionId => _sessionId;

  /// Connect to relay server with a session key for E2E encryption
  Future<String> connect({
    String relayUrl = defaultRelayUrl,
    Uint8List? sessionKey,
    String? existingSessionId,
  }) async {
    _sessionKey = sessionKey;

    try {
      _connectionStateController.add(RelayState.connecting);

      _channel = WebSocketChannel.connect(Uri.parse(relayUrl));

      // Wait for connection
      await _channel!.ready;

      _isConnected = true;
      _reconnectAttempts = 0;
      _connectionStateController.add(RelayState.connected);

      // Listen for messages
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnect,
        cancelOnError: false,
      );

      // Start heartbeat
      _startHeartbeat();

      // Register with relay
      if (existingSessionId != null) {
        await _joinSession(existingSessionId);
      } else {
        await _createSession();
      }

      _logger.i('Connected to relay server, session: $_sessionId');
      return _sessionId!;
    } catch (e) {
      _logger.e('Failed to connect to relay', error: e);
      _connectionStateController.add(RelayState.error);
      rethrow;
    }
  }

  Future<void> _createSession() async {
    _sessionId = _uuid.v4().substring(0, 8).toUpperCase();
    _send(RelayMessage(
      type: RelayMessageType.createSession,
      sessionId: _sessionId!,
    ));
  }

  Future<void> _joinSession(String sessionId) async {
    _sessionId = sessionId;
    _send(RelayMessage(
      type: RelayMessageType.joinSession,
      sessionId: _sessionId!,
    ));
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _sendHeartbeat(),
    );
  }

  void _sendHeartbeat() {
    if (_isConnected) {
      _send(RelayMessage(
        type: RelayMessageType.heartbeat,
        sessionId: _sessionId ?? '',
      ));
    }
  }

  void _handleMessage(dynamic message) {
    try {
      Map<String, dynamic> json;
      if (message is String) {
        json = jsonDecode(message) as Map<String, dynamic>;
      } else if (message is List<int>) {
        json = jsonDecode(utf8.decode(message)) as Map<String, dynamic>;
      } else {
        return;
      }

      final relayMessage = RelayMessage.fromJson(json);

      switch (relayMessage.type) {
        case RelayMessageType.sessionCreated:
          _logger.d('Session created: ${relayMessage.sessionId}');
          break;

        case RelayMessageType.sessionJoined:
          _peerId = relayMessage.peerId;
          _logger.d('Joined session, peer: $_peerId');
          break;

        case RelayMessageType.peerJoined:
          _peerId = relayMessage.peerId;
          _logger.d('Peer joined: $_peerId');
          _connectionStateController.add(RelayState.peerConnected);
          break;

        case RelayMessageType.peerLeft:
          _logger.d('Peer left');
          _peerId = null;
          _connectionStateController.add(RelayState.peerDisconnected);
          break;

        case RelayMessageType.data:
          _handleData(relayMessage);
          break;

        case RelayMessageType.error:
          _errorController.add(RelayError(
            code: relayMessage.errorCode ?? 'unknown',
            message: relayMessage.errorMessage ?? 'Unknown error',
          ));
          break;

        default:
          break;
      }
    } catch (e) {
      _logger.e('Error handling message', error: e);
    }
  }

  Future<void> _handleData(RelayMessage message) async {
    if (message.data == null) return;

    try {
      Uint8List data = base64Decode(message.data!);

      // Decrypt if we have a session key
      if (_sessionKey != null) {
        data = await _aesGcm.decrypt(data, _sessionKey!);
      }

      _dataController.add(RelayData(
        data: data,
        fromPeerId: message.peerId,
        timestamp: DateTime.now(),
      ));
    } catch (e) {
      _logger.e('Error handling data', error: e);
    }
  }

  void _handleError(dynamic error) {
    _logger.e('WebSocket error', error: error);
    _errorController.add(RelayError(
      code: 'websocket_error',
      message: error.toString(),
    ));
    _handleDisconnect();
  }

  void _handleDisconnect() {
    _logger.w('Disconnected from relay server');
    _isConnected = false;
    _heartbeatTimer?.cancel();
    _connectionStateController.add(RelayState.disconnected);

    // Attempt reconnection
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= maxReconnectAttempts) {
      _logger.e('Max reconnect attempts reached');
      _connectionStateController.add(RelayState.error);
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(
      Duration(seconds: reconnectDelay.inSeconds * (_reconnectAttempts + 1)),
      () => _reconnect(),
    );
    _reconnectAttempts++;
  }

  Future<void> _reconnect() async {
    if (_isConnected) return;

    try {
      await connect(
        sessionKey: _sessionKey,
        existingSessionId: _sessionId,
      );
    } catch (e) {
      _logger.e('Reconnection failed', error: e);
      _scheduleReconnect();
    }
  }

  /// Send data through relay
  Future<void> sendData(Uint8List data) async {
    if (!_isConnected || _sessionId == null) {
      throw Exception('Not connected to relay');
    }

    // Encrypt if we have a session key
    Uint8List sendData = data;
    if (_sessionKey != null) {
      sendData = await _aesGcm.encrypt(data, _sessionKey!);
    }

    // Split into chunks if needed
    if (sendData.length > maxMessageSize) {
      await _sendChunked(sendData);
    } else {
      _send(RelayMessage(
        type: RelayMessageType.data,
        sessionId: _sessionId!,
        data: base64Encode(sendData),
      ));
    }
  }

  Future<void> _sendChunked(Uint8List data) async {
    final totalChunks = (data.length / maxMessageSize).ceil();
    final transferId = _uuid.v4();

    for (var i = 0; i < data.length; i += maxMessageSize) {
      final end = (i + maxMessageSize < data.length) ? i + maxMessageSize : data.length;
      final chunk = data.sublist(i, end);
      final chunkIndex = i ~/ maxMessageSize;

      _send(RelayMessage(
        type: RelayMessageType.dataChunk,
        sessionId: _sessionId!,
        data: base64Encode(chunk),
        chunkInfo: ChunkInfo(
          transferId: transferId,
          chunkIndex: chunkIndex,
          totalChunks: totalChunks,
        ),
      ));

      // Small delay between chunks
      await Future.delayed(const Duration(milliseconds: 10));
    }
  }

  void _send(RelayMessage message) {
    if (_channel == null) return;
    _channel!.sink.add(jsonEncode(message.toJson()));
  }

  /// Disconnect from relay
  Future<void> disconnect() async {
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();

    if (_sessionId != null) {
      _send(RelayMessage(
        type: RelayMessageType.leaveSession,
        sessionId: _sessionId!,
      ));
    }

    await _channel?.sink.close();
    _channel = null;
    _isConnected = false;
    _sessionId = null;
    _peerId = null;
    _connectionStateController.add(RelayState.disconnected);
  }

  /// Dispose resources
  Future<void> dispose() async {
    await disconnect();
    await _connectionStateController.close();
    await _dataController.close();
    await _errorController.close();
  }
}

/// Relay connection state
enum RelayState {
  disconnected,
  connecting,
  connected,
  peerConnected,
  peerDisconnected,
  error,
}

/// Relay message types
enum RelayMessageType {
  createSession,
  joinSession,
  leaveSession,
  sessionCreated,
  sessionJoined,
  peerJoined,
  peerLeft,
  data,
  dataChunk,
  heartbeat,
  error,
}

/// Relay message
class RelayMessage {
  final RelayMessageType type;
  final String sessionId;
  final String? peerId;
  final String? data;
  final ChunkInfo? chunkInfo;
  final String? errorCode;
  final String? errorMessage;

  RelayMessage({
    required this.type,
    required this.sessionId,
    this.peerId,
    this.data,
    this.chunkInfo,
    this.errorCode,
    this.errorMessage,
  });

  Map<String, dynamic> toJson() => {
        'type': type.name,
        'sessionId': sessionId,
        if (peerId != null) 'peerId': peerId,
        if (data != null) 'data': data,
        if (chunkInfo != null) 'chunkInfo': chunkInfo!.toJson(),
        if (errorCode != null) 'errorCode': errorCode,
        if (errorMessage != null) 'errorMessage': errorMessage,
      };

  factory RelayMessage.fromJson(Map<String, dynamic> json) {
    return RelayMessage(
      type: RelayMessageType.values.firstWhere(
        (t) => t.name == json['type'],
        orElse: () => RelayMessageType.error,
      ),
      sessionId: json['sessionId'] as String? ?? '',
      peerId: json['peerId'] as String?,
      data: json['data'] as String?,
      chunkInfo: json['chunkInfo'] != null
          ? ChunkInfo.fromJson(json['chunkInfo'] as Map<String, dynamic>)
          : null,
      errorCode: json['errorCode'] as String?,
      errorMessage: json['errorMessage'] as String?,
    );
  }
}

/// Chunk information for large transfers
class ChunkInfo {
  final String transferId;
  final int chunkIndex;
  final int totalChunks;

  ChunkInfo({
    required this.transferId,
    required this.chunkIndex,
    required this.totalChunks,
  });

  Map<String, dynamic> toJson() => {
        'transferId': transferId,
        'chunkIndex': chunkIndex,
        'totalChunks': totalChunks,
      };

  factory ChunkInfo.fromJson(Map<String, dynamic> json) {
    return ChunkInfo(
      transferId: json['transferId'] as String,
      chunkIndex: json['chunkIndex'] as int,
      totalChunks: json['totalChunks'] as int,
    );
  }
}

/// Received relay data
class RelayData {
  final Uint8List data;
  final String? fromPeerId;
  final DateTime timestamp;

  RelayData({
    required this.data,
    this.fromPeerId,
    required this.timestamp,
  });
}

/// Relay error
class RelayError {
  final String code;
  final String message;

  RelayError({
    required this.code,
    required this.message,
  });

  @override
  String toString() => 'RelayError($code): $message';
}
