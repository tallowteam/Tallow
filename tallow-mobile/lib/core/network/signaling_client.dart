import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:logger/logger.dart';
import 'package:uuid/uuid.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

/// Socket.IO-based signaling client for WebRTC connection establishment
class SignalingClient {
  static final SignalingClient _instance = SignalingClient._internal();
  factory SignalingClient() => _instance;
  SignalingClient._internal();

  final _logger = Logger();
  final _uuid = const Uuid();

  // Server configuration
  static const String defaultServerUrl = 'https://signaling.tallow.app';

  io.Socket? _socket;
  String? _deviceId;
  String? _deviceName;
  String? _roomId;
  bool _isConnected = false;

  // Event streams
  final _connectionStateController = StreamController<SignalingState>.broadcast();
  final _peerJoinedController = StreamController<PeerInfo>.broadcast();
  final _peerLeftController = StreamController<String>.broadcast();
  final _offerController = StreamController<SignalingMessage>.broadcast();
  final _answerController = StreamController<SignalingMessage>.broadcast();
  final _iceCandidateController = StreamController<SignalingMessage>.broadcast();
  final _messageController = StreamController<SignalingMessage>.broadcast();

  // Public streams
  Stream<SignalingState> get connectionState => _connectionStateController.stream;
  Stream<PeerInfo> get peerJoined => _peerJoinedController.stream;
  Stream<String> get peerLeft => _peerLeftController.stream;
  Stream<SignalingMessage> get offers => _offerController.stream;
  Stream<SignalingMessage> get answers => _answerController.stream;
  Stream<SignalingMessage> get iceCandidates => _iceCandidateController.stream;
  Stream<SignalingMessage> get messages => _messageController.stream;

  bool get isConnected => _isConnected;
  String? get deviceId => _deviceId;
  String? get roomId => _roomId;

  /// Initialize the signaling client
  void initialize({
    required String deviceId,
    required String deviceName,
  }) {
    _deviceId = deviceId;
    _deviceName = deviceName;
  }

  /// Connect to signaling server
  Future<void> connect({String serverUrl = defaultServerUrl}) async {
    if (_socket != null) {
      await disconnect();
    }

    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .setQuery({
            'deviceId': _deviceId,
            'deviceName': _deviceName,
          })
          .build(),
    );

    _setupEventHandlers();
    _socket!.connect();

    // Wait for connection
    await _waitForConnection();
  }

  void _setupEventHandlers() {
    _socket!.onConnect((_) {
      _logger.i('Connected to signaling server');
      _isConnected = true;
      _connectionStateController.add(SignalingState.connected);
    });

    _socket!.onDisconnect((_) {
      _logger.i('Disconnected from signaling server');
      _isConnected = false;
      _connectionStateController.add(SignalingState.disconnected);
    });

    _socket!.onConnectError((error) {
      _logger.e('Connection error', error: error);
      _connectionStateController.add(SignalingState.error);
    });

    _socket!.onReconnect((_) {
      _logger.i('Reconnected to signaling server');
      _isConnected = true;
      _connectionStateController.add(SignalingState.connected);
      // Rejoin room if we were in one
      if (_roomId != null) {
        joinRoom(_roomId!);
      }
    });

    // Signaling events
    _socket!.on('peer-joined', (data) {
      final peerInfo = PeerInfo.fromJson(data as Map<String, dynamic>);
      _logger.d('Peer joined: ${peerInfo.deviceName}');
      _peerJoinedController.add(peerInfo);
    });

    _socket!.on('peer-left', (data) {
      final peerId = data['peerId'] as String;
      _logger.d('Peer left: $peerId');
      _peerLeftController.add(peerId);
    });

    _socket!.on('offer', (data) {
      final message = SignalingMessage.fromJson(data as Map<String, dynamic>);
      _logger.d('Received offer from ${message.fromId}');
      _offerController.add(message);
    });

    _socket!.on('answer', (data) {
      final message = SignalingMessage.fromJson(data as Map<String, dynamic>);
      _logger.d('Received answer from ${message.fromId}');
      _answerController.add(message);
    });

    _socket!.on('ice-candidate', (data) {
      final message = SignalingMessage.fromJson(data as Map<String, dynamic>);
      _logger.d('Received ICE candidate from ${message.fromId}');
      _iceCandidateController.add(message);
    });

    _socket!.on('message', (data) {
      final message = SignalingMessage.fromJson(data as Map<String, dynamic>);
      _logger.d('Received message from ${message.fromId}');
      _messageController.add(message);
    });

    _socket!.on('room-created', (data) {
      _roomId = data['roomId'] as String;
      _logger.i('Room created: $_roomId');
    });

    _socket!.on('room-joined', (data) {
      _roomId = data['roomId'] as String;
      _logger.i('Joined room: $_roomId');
    });

    _socket!.on('error', (data) {
      _logger.e('Server error', error: data);
    });
  }

  Future<void> _waitForConnection() async {
    if (_isConnected) return;

    final completer = Completer<void>();
    late StreamSubscription subscription;

    subscription = connectionState.listen((state) {
      if (state == SignalingState.connected) {
        subscription.cancel();
        completer.complete();
      } else if (state == SignalingState.error) {
        subscription.cancel();
        completer.completeError(Exception('Failed to connect to signaling server'));
      }
    });

    // Timeout after 10 seconds
    return completer.future.timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        subscription.cancel();
        throw TimeoutException('Connection timeout');
      },
    );
  }

  /// Create a new room
  Future<String> createRoom() async {
    if (!_isConnected) {
      throw Exception('Not connected to signaling server');
    }

    final completer = Completer<String>();
    _socket!.emitWithAck('create-room', {
      'deviceId': _deviceId,
      'deviceName': _deviceName,
    }, ack: (data) {
      if (data['success'] == true) {
        _roomId = data['roomId'] as String;
        completer.complete(_roomId);
      } else {
        completer.completeError(Exception(data['error'] ?? 'Failed to create room'));
      }
    });

    return completer.future.timeout(const Duration(seconds: 5));
  }

  /// Join an existing room
  Future<List<PeerInfo>> joinRoom(String roomId) async {
    if (!_isConnected) {
      throw Exception('Not connected to signaling server');
    }

    final completer = Completer<List<PeerInfo>>();
    _socket!.emitWithAck('join-room', {
      'roomId': roomId,
      'deviceId': _deviceId,
      'deviceName': _deviceName,
    }, ack: (data) {
      if (data['success'] == true) {
        _roomId = roomId;
        final peers = (data['peers'] as List)
            .map((p) => PeerInfo.fromJson(p as Map<String, dynamic>))
            .toList();
        completer.complete(peers);
      } else {
        completer.completeError(Exception(data['error'] ?? 'Failed to join room'));
      }
    });

    return completer.future.timeout(const Duration(seconds: 5));
  }

  /// Leave current room
  Future<void> leaveRoom() async {
    if (_roomId == null) return;

    _socket?.emit('leave-room', {
      'roomId': _roomId,
      'deviceId': _deviceId,
    });
    _roomId = null;
  }

  /// Send WebRTC offer
  void sendOffer(String targetId, RTCSessionDescription offer) {
    _socket?.emit('offer', {
      'roomId': _roomId,
      'fromId': _deviceId,
      'targetId': targetId,
      'sdp': offer.sdp,
      'type': offer.type,
    });
  }

  /// Send WebRTC answer
  void sendAnswer(String targetId, RTCSessionDescription answer) {
    _socket?.emit('answer', {
      'roomId': _roomId,
      'fromId': _deviceId,
      'targetId': targetId,
      'sdp': answer.sdp,
      'type': answer.type,
    });
  }

  /// Send ICE candidate
  void sendIceCandidate(String targetId, RTCIceCandidate candidate) {
    _socket?.emit('ice-candidate', {
      'roomId': _roomId,
      'fromId': _deviceId,
      'targetId': targetId,
      'candidate': candidate.candidate,
      'sdpMid': candidate.sdpMid,
      'sdpMLineIndex': candidate.sdpMLineIndex,
    });
  }

  /// Send custom message to a peer
  void sendMessage(String targetId, Map<String, dynamic> payload) {
    _socket?.emit('message', {
      'roomId': _roomId,
      'fromId': _deviceId,
      'targetId': targetId,
      'payload': payload,
    });
  }

  /// Broadcast message to all peers in room
  void broadcast(Map<String, dynamic> payload) {
    _socket?.emit('broadcast', {
      'roomId': _roomId,
      'fromId': _deviceId,
      'payload': payload,
    });
  }

  /// Disconnect from server
  Future<void> disconnect() async {
    await leaveRoom();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _connectionStateController.add(SignalingState.disconnected);
  }

  /// Dispose resources
  Future<void> dispose() async {
    await disconnect();
    await _connectionStateController.close();
    await _peerJoinedController.close();
    await _peerLeftController.close();
    await _offerController.close();
    await _answerController.close();
    await _iceCandidateController.close();
    await _messageController.close();
  }
}

/// Signaling connection state
enum SignalingState {
  disconnected,
  connecting,
  connected,
  error,
}

/// Peer information
class PeerInfo {
  final String deviceId;
  final String deviceName;
  final String? publicKeyHex;
  final DateTime joinedAt;

  PeerInfo({
    required this.deviceId,
    required this.deviceName,
    this.publicKeyHex,
    DateTime? joinedAt,
  }) : joinedAt = joinedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'deviceId': deviceId,
        'deviceName': deviceName,
        'publicKeyHex': publicKeyHex,
        'joinedAt': joinedAt.toIso8601String(),
      };

  factory PeerInfo.fromJson(Map<String, dynamic> json) {
    return PeerInfo(
      deviceId: json['deviceId'] as String,
      deviceName: json['deviceName'] as String,
      publicKeyHex: json['publicKeyHex'] as String?,
      joinedAt: json['joinedAt'] != null
          ? DateTime.parse(json['joinedAt'] as String)
          : null,
    );
  }
}

/// Signaling message
class SignalingMessage {
  final String fromId;
  final String? targetId;
  final String? roomId;
  final Map<String, dynamic> payload;

  SignalingMessage({
    required this.fromId,
    this.targetId,
    this.roomId,
    required this.payload,
  });

  // Convenience getters for WebRTC data
  String? get sdp => payload['sdp'] as String?;
  String? get type => payload['type'] as String?;
  String? get candidate => payload['candidate'] as String?;
  String? get sdpMid => payload['sdpMid'] as String?;
  int? get sdpMLineIndex => payload['sdpMLineIndex'] as int?;

  RTCSessionDescription? get sessionDescription {
    if (sdp != null && type != null) {
      return RTCSessionDescription(sdp, type);
    }
    return null;
  }

  RTCIceCandidate? get iceCandidate {
    if (candidate != null) {
      return RTCIceCandidate(candidate, sdpMid, sdpMLineIndex);
    }
    return null;
  }

  Map<String, dynamic> toJson() => {
        'fromId': fromId,
        'targetId': targetId,
        'roomId': roomId,
        'payload': payload,
      };

  factory SignalingMessage.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> payload;
    if (json.containsKey('payload')) {
      payload = json['payload'] as Map<String, dynamic>;
    } else {
      // Flatten the message if payload is not nested
      payload = Map.from(json);
      payload.remove('fromId');
      payload.remove('targetId');
      payload.remove('roomId');
    }

    return SignalingMessage(
      fromId: json['fromId'] as String,
      targetId: json['targetId'] as String?,
      roomId: json['roomId'] as String?,
      payload: payload,
    );
  }
}
