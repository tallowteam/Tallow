import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../core/network/webrtc_manager.dart';
import '../../core/crypto/aes_gcm.dart';
import '../../core/crypto/blake3.dart';

/// Chat state
class ChatState {
  final Map<String, List<ChatMessage>> conversations;
  final String? activePeerId;
  final bool isConnected;

  const ChatState({
    this.conversations = const {},
    this.activePeerId,
    this.isConnected = false,
  });

  ChatState copyWith({
    Map<String, List<ChatMessage>>? conversations,
    String? activePeerId,
    bool? isConnected,
  }) {
    return ChatState(
      conversations: conversations ?? this.conversations,
      activePeerId: activePeerId ?? this.activePeerId,
      isConnected: isConnected ?? this.isConnected,
    );
  }

  List<ChatMessage> get activeMessages =>
      activePeerId != null ? (conversations[activePeerId] ?? []) : [];
}

/// Chat message model
class ChatMessage {
  final String id;
  final String senderId;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  final MessageStatus status;
  final String? replyToId;
  final Map<String, dynamic>? metadata;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    this.type = MessageType.text,
    DateTime? timestamp,
    this.status = MessageStatus.sent,
    this.replyToId,
    this.metadata,
  }) : timestamp = timestamp ?? DateTime.now();

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? content,
    MessageType? type,
    DateTime? timestamp,
    MessageStatus? status,
    String? replyToId,
    Map<String, dynamic>? metadata,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      content: content ?? this.content,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
      replyToId: replyToId ?? this.replyToId,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'senderId': senderId,
        'content': content,
        'type': type.name,
        'timestamp': timestamp.toIso8601String(),
        'replyToId': replyToId,
        'metadata': metadata,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      content: json['content'] as String,
      type: MessageType.values.firstWhere(
        (t) => t.name == json['type'],
        orElse: () => MessageType.text,
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      replyToId: json['replyToId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}

/// Message type
enum MessageType {
  text,
  image,
  file,
  system,
}

/// Message status
enum MessageStatus {
  sending,
  sent,
  delivered,
  read,
  failed,
}

/// Chat notifier
class ChatNotifier extends StateNotifier<ChatState> {
  final _uuid = const Uuid();
  final _aesGcm = AesGcmCrypto();
  final _blake3 = Blake3Hash();

  String? _ownId;
  Uint8List? _sessionKey;

  ChatNotifier() : super(const ChatState());

  /// Initialize chat with own ID
  void initialize(String ownId) {
    _ownId = ownId;
  }

  /// Set session key for encryption
  void setSessionKey(Uint8List key) {
    _sessionKey = key;
  }

  /// Set active conversation
  void setActivePeer(String peerId) {
    state = state.copyWith(activePeerId: peerId, isConnected: true);

    // Initialize conversation if needed
    if (!state.conversations.containsKey(peerId)) {
      final conversations = Map<String, List<ChatMessage>>.from(state.conversations);
      conversations[peerId] = [];
      state = state.copyWith(conversations: conversations);
    }
  }

  /// Send a text message
  Future<void> sendMessage(String content, {String? replyToId}) async {
    if (_ownId == null || state.activePeerId == null) return;

    final message = ChatMessage(
      id: _uuid.v4(),
      senderId: _ownId!,
      content: content,
      type: MessageType.text,
      status: MessageStatus.sending,
      replyToId: replyToId,
    );

    // Add to local state
    _addMessage(state.activePeerId!, message);

    try {
      // Encrypt and send
      await _sendEncryptedMessage(message);

      // Update status to sent
      _updateMessageStatus(state.activePeerId!, message.id, MessageStatus.sent);
    } catch (e) {
      _updateMessageStatus(state.activePeerId!, message.id, MessageStatus.failed);
    }
  }

  /// Send a file message
  Future<void> sendFileMessage({
    required String fileName,
    required int fileSize,
    required String transferId,
  }) async {
    if (_ownId == null || state.activePeerId == null) return;

    final message = ChatMessage(
      id: _uuid.v4(),
      senderId: _ownId!,
      content: fileName,
      type: MessageType.file,
      metadata: {
        'fileName': fileName,
        'fileSize': fileSize,
        'transferId': transferId,
      },
    );

    _addMessage(state.activePeerId!, message);
  }

  /// Receive a message
  void receiveMessage(Map<String, dynamic> data) {
    try {
      final message = ChatMessage.fromJson(data);
      final peerId = message.senderId;

      _addMessage(peerId, message);

      // Send delivery receipt
      _sendDeliveryReceipt(message.id);
    } catch (e) {
      // Invalid message format
    }
  }

  /// Handle incoming encrypted data
  Future<void> handleIncomingData(Uint8List data) async {
    try {
      // Decrypt
      Uint8List decrypted = data;
      if (_sessionKey != null) {
        decrypted = await _aesGcm.decrypt(data, _sessionKey!);
      }

      // Parse message
      final json = String.fromCharCodes(decrypted);
      final messageData = _parseJson(json);

      if (messageData['type'] == 'message') {
        receiveMessage(messageData['payload'] as Map<String, dynamic>);
      } else if (messageData['type'] == 'receipt') {
        _handleReceipt(messageData);
      }
    } catch (e) {
      // Failed to process message
    }
  }

  Future<void> _sendEncryptedMessage(ChatMessage message) async {
    final payload = {
      'type': 'message',
      'payload': message.toJson(),
    };

    final json = _toJson(payload);
    var data = Uint8List.fromList(json.codeUnits);

    if (_sessionKey != null) {
      data = await _aesGcm.encrypt(data, _sessionKey!);
    }

    // Send through WebRTC (this would be connected to the WebRTC manager)
    // For now, we just update local state
  }

  void _sendDeliveryReceipt(String messageId) {
    // Send receipt through WebRTC
  }

  void _handleReceipt(Map<String, dynamic> data) {
    final messageId = data['messageId'] as String?;
    final peerId = data['peerId'] as String?;
    final status = data['status'] as String?;

    if (messageId != null && peerId != null && status != null) {
      final messageStatus = MessageStatus.values.firstWhere(
        (s) => s.name == status,
        orElse: () => MessageStatus.sent,
      );
      _updateMessageStatus(peerId, messageId, messageStatus);
    }
  }

  void _addMessage(String peerId, ChatMessage message) {
    final conversations = Map<String, List<ChatMessage>>.from(state.conversations);
    final messages = List<ChatMessage>.from(conversations[peerId] ?? []);
    messages.add(message);
    conversations[peerId] = messages;
    state = state.copyWith(conversations: conversations);
  }

  void _updateMessageStatus(String peerId, String messageId, MessageStatus status) {
    final conversations = Map<String, List<ChatMessage>>.from(state.conversations);
    final messages = List<ChatMessage>.from(conversations[peerId] ?? []);

    final index = messages.indexWhere((m) => m.id == messageId);
    if (index != -1) {
      messages[index] = messages[index].copyWith(status: status);
      conversations[peerId] = messages;
      state = state.copyWith(conversations: conversations);
    }
  }

  /// Delete a message
  void deleteMessage(String peerId, String messageId) {
    final conversations = Map<String, List<ChatMessage>>.from(state.conversations);
    final messages = List<ChatMessage>.from(conversations[peerId] ?? []);
    messages.removeWhere((m) => m.id == messageId);
    conversations[peerId] = messages;
    state = state.copyWith(conversations: conversations);
  }

  /// Clear conversation
  void clearConversation(String peerId) {
    final conversations = Map<String, List<ChatMessage>>.from(state.conversations);
    conversations.remove(peerId);
    state = state.copyWith(conversations: conversations);
  }

  /// Clear all conversations
  void clearAllConversations() {
    state = state.copyWith(conversations: {});
  }

  /// Disconnect
  void disconnect() {
    state = state.copyWith(activePeerId: null, isConnected: false);
  }

  Map<String, dynamic> _parseJson(String json) {
    // Simple JSON parser
    final result = <String, dynamic>{};
    // For a real implementation, use dart:convert
    return result;
  }

  String _toJson(Map<String, dynamic> data) {
    // Simple JSON serializer
    // For a real implementation, use dart:convert
    return '';
  }
}

/// Provider for chat state
final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>(
  (ref) => ChatNotifier(),
);
