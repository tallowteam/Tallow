import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import 'package:file_picker/file_picker.dart';

import '../../core/network/webrtc_manager.dart';
import '../../core/network/signaling_client.dart';
import '../../core/network/relay_client.dart';
import '../../core/crypto/key_exchange.dart';
import '../../core/crypto/aes_gcm.dart';
import '../../core/storage/transfer_history.dart';

/// Transfer state model
class TransferState {
  final List<FileTransfer> activeTransfers;
  final List<FileTransfer> pendingTransfers;
  final List<FileTransfer> completedTransfers;
  final String? currentPeerId;
  final String? currentPeerName;
  final ConnectionStatus connectionStatus;
  final String? errorMessage;
  final Uint8List? sessionKey;

  const TransferState({
    this.activeTransfers = const [],
    this.pendingTransfers = const [],
    this.completedTransfers = const [],
    this.currentPeerId,
    this.currentPeerName,
    this.connectionStatus = ConnectionStatus.disconnected,
    this.errorMessage,
    this.sessionKey,
  });

  TransferState copyWith({
    List<FileTransfer>? activeTransfers,
    List<FileTransfer>? pendingTransfers,
    List<FileTransfer>? completedTransfers,
    String? currentPeerId,
    String? currentPeerName,
    ConnectionStatus? connectionStatus,
    String? errorMessage,
    Uint8List? sessionKey,
  }) {
    return TransferState(
      activeTransfers: activeTransfers ?? this.activeTransfers,
      pendingTransfers: pendingTransfers ?? this.pendingTransfers,
      completedTransfers: completedTransfers ?? this.completedTransfers,
      currentPeerId: currentPeerId ?? this.currentPeerId,
      currentPeerName: currentPeerName ?? this.currentPeerName,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      errorMessage: errorMessage,
      sessionKey: sessionKey ?? this.sessionKey,
    );
  }
}

/// File transfer model
class FileTransfer {
  final String id;
  final String fileName;
  final int fileSize;
  final String? filePath;
  final Uint8List? fileData;
  final TransferDirection direction;
  final String peerId;
  final String peerName;
  final TransferStatus status;
  final double progress;
  final int bytesTransferred;
  final DateTime startTime;
  final String? errorMessage;
  final bool isPaused;

  FileTransfer({
    required this.id,
    required this.fileName,
    required this.fileSize,
    this.filePath,
    this.fileData,
    required this.direction,
    required this.peerId,
    required this.peerName,
    this.status = TransferStatus.pending,
    this.progress = 0,
    this.bytesTransferred = 0,
    DateTime? startTime,
    this.errorMessage,
    this.isPaused = false,
  }) : startTime = startTime ?? DateTime.now();

  FileTransfer copyWith({
    String? id,
    String? fileName,
    int? fileSize,
    String? filePath,
    Uint8List? fileData,
    TransferDirection? direction,
    String? peerId,
    String? peerName,
    TransferStatus? status,
    double? progress,
    int? bytesTransferred,
    DateTime? startTime,
    String? errorMessage,
    bool? isPaused,
  }) {
    return FileTransfer(
      id: id ?? this.id,
      fileName: fileName ?? this.fileName,
      fileSize: fileSize ?? this.fileSize,
      filePath: filePath ?? this.filePath,
      fileData: fileData ?? this.fileData,
      direction: direction ?? this.direction,
      peerId: peerId ?? this.peerId,
      peerName: peerName ?? this.peerName,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      bytesTransferred: bytesTransferred ?? this.bytesTransferred,
      startTime: startTime ?? this.startTime,
      errorMessage: errorMessage,
      isPaused: isPaused ?? this.isPaused,
    );
  }

  double get speed {
    final elapsed = DateTime.now().difference(startTime).inSeconds;
    if (elapsed == 0) return 0;
    return bytesTransferred / elapsed;
  }

  Duration get estimatedTimeRemaining {
    if (speed == 0) return Duration.zero;
    final remaining = fileSize - bytesTransferred;
    return Duration(seconds: (remaining / speed).round());
  }
}

/// Connection status
enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
  error,
}

/// Transfer provider
class TransferNotifier extends StateNotifier<TransferState> {
  final _uuid = const Uuid();
  final _webrtc = WebRTCManager();
  final _signaling = SignalingClient();
  final _relay = RelayClient();
  final _keyExchange = KeyExchangeService();
  final _aesGcm = AesGcmCrypto();
  final _historyService = TransferHistoryService();

  String? _connectionId;
  StreamSubscription? _signalingSubscription;

  TransferNotifier() : super(const TransferState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _historyService.initialize();
  }

  /// Connect to a peer via signaling
  Future<void> connectToPeer(String peerId, String peerName) async {
    state = state.copyWith(
      connectionStatus: ConnectionStatus.connecting,
      currentPeerId: peerId,
      currentPeerName: peerName,
    );

    try {
      // Generate session key
      final sessionKey = await _aesGcm.generateKey();
      state = state.copyWith(sessionKey: sessionKey);

      // Create WebRTC connection
      final connection = await _webrtc.createConnection(
        peerId: peerId,
        isInitiator: true,
        onIceCandidate: (candidate) {
          _signaling.sendIceCandidate(peerId, candidate);
        },
        onLocalDescription: (description) {
          _signaling.sendOffer(peerId, description);
        },
        onStateChange: _handleConnectionStateChange,
        onData: _handleIncomingData,
        sessionKey: sessionKey,
      );

      _connectionId = connection.id;

      // Create and send offer
      final offer = await _webrtc.createOffer(connection.id);
      _signaling.sendOffer(peerId, offer);

      // Listen for signaling messages
      _setupSignalingListeners(peerId);
    } catch (e) {
      state = state.copyWith(
        connectionStatus: ConnectionStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  void _setupSignalingListeners(String peerId) {
    _signalingSubscription?.cancel();

    _signaling.answers.listen((message) async {
      if (message.fromId == peerId && _connectionId != null) {
        final description = message.sessionDescription;
        if (description != null) {
          await _webrtc.setRemoteDescription(_connectionId!, description);
        }
      }
    });

    _signaling.iceCandidates.listen((message) async {
      if (message.fromId == peerId && _connectionId != null) {
        final candidate = message.iceCandidate;
        if (candidate != null) {
          await _webrtc.addIceCandidate(_connectionId!, candidate);
        }
      }
    });
  }

  void _handleConnectionStateChange(PeerConnectionState connectionState) {
    switch (connectionState) {
      case PeerConnectionState.connected:
        state = state.copyWith(connectionStatus: ConnectionStatus.connected);
        break;
      case PeerConnectionState.disconnected:
      case PeerConnectionState.closed:
        state = state.copyWith(connectionStatus: ConnectionStatus.disconnected);
        break;
      case PeerConnectionState.failed:
        state = state.copyWith(
          connectionStatus: ConnectionStatus.error,
          errorMessage: 'Connection failed',
        );
        break;
      default:
        break;
    }
  }

  void _handleIncomingData(Uint8List data) {
    // Handle incoming file data
    // Parse metadata or chunk data
    if (data.isNotEmpty) {
      if (data[0] == 0x01) {
        // File metadata
        final metadata = FileTransferMetadata.fromBytes(data);
        if (metadata != null) {
          _startReceiving(metadata);
        }
      } else if (data[0] == 0x02) {
        // File chunk
        final chunk = ChunkPacket.fromBytes(data);
        if (chunk != null) {
          _handleChunk(chunk);
        }
      }
    }
  }

  void _startReceiving(FileTransferMetadata metadata) {
    final transfer = FileTransfer(
      id: _uuid.v4(),
      fileName: metadata.fileName,
      fileSize: metadata.fileSize,
      direction: TransferDirection.receive,
      peerId: state.currentPeerId ?? '',
      peerName: state.currentPeerName ?? '',
      status: TransferStatus.transferring,
    );

    state = state.copyWith(
      activeTransfers: [...state.activeTransfers, transfer],
    );
  }

  void _handleChunk(ChunkPacket chunk) {
    // Update progress for active receiving transfer
    if (state.activeTransfers.isNotEmpty) {
      final transfers = [...state.activeTransfers];
      final index = transfers.indexWhere(
        (t) => t.direction == TransferDirection.receive &&
               t.status == TransferStatus.transferring,
      );

      if (index != -1) {
        final transfer = transfers[index];
        final newBytesTransferred = transfer.bytesTransferred + chunk.data.length;
        final newProgress = newBytesTransferred / transfer.fileSize;

        transfers[index] = transfer.copyWith(
          bytesTransferred: newBytesTransferred,
          progress: newProgress,
        );

        state = state.copyWith(activeTransfers: transfers);
      }
    }
  }

  /// Pick and send files
  Future<void> pickAndSendFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: true,
    );

    if (result == null || result.files.isEmpty) return;

    for (final file in result.files) {
      if (file.bytes != null) {
        await sendFile(
          fileName: file.name,
          fileData: file.bytes!,
        );
      }
    }
  }

  /// Send a file to the connected peer
  Future<void> sendFile({
    required String fileName,
    required Uint8List fileData,
  }) async {
    if (_connectionId == null ||
        state.connectionStatus != ConnectionStatus.connected) {
      throw Exception('Not connected to peer');
    }

    final transfer = FileTransfer(
      id: _uuid.v4(),
      fileName: fileName,
      fileSize: fileData.length,
      fileData: fileData,
      direction: TransferDirection.send,
      peerId: state.currentPeerId ?? '',
      peerName: state.currentPeerName ?? '',
      status: TransferStatus.transferring,
    );

    state = state.copyWith(
      activeTransfers: [...state.activeTransfers, transfer],
    );

    // Add to history
    await _historyService.addTransfer(TransferRecord(
      id: transfer.id,
      fileName: fileName,
      fileSize: fileData.length,
      direction: TransferDirection.send,
      peerId: transfer.peerId,
      peerName: transfer.peerName,
      status: TransferStatus.transferring,
      startTime: transfer.startTime,
    ));

    try {
      // Send file through WebRTC
      await for (final progress in _webrtc.sendFile(
        _connectionId!,
        fileData,
        fileName,
      )) {
        _updateTransferProgress(transfer.id, progress);
      }

      // Mark as completed
      _completeTransfer(transfer.id);
      await _historyService.completeTransfer(transfer.id);
    } catch (e) {
      _failTransfer(transfer.id, e.toString());
      await _historyService.failTransfer(transfer.id, e.toString());
    }
  }

  void _updateTransferProgress(String transferId, TransferProgress progress) {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      transfers[index] = transfers[index].copyWith(
        progress: progress.progress,
        bytesTransferred: progress.bytesTransferred,
      );
      state = state.copyWith(activeTransfers: transfers);
    }
  }

  void _completeTransfer(String transferId) {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      final transfer = transfers.removeAt(index).copyWith(
        status: TransferStatus.completed,
        progress: 1.0,
      );
      state = state.copyWith(
        activeTransfers: transfers,
        completedTransfers: [...state.completedTransfers, transfer],
      );
    }
  }

  void _failTransfer(String transferId, String error) {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      final transfer = transfers.removeAt(index).copyWith(
        status: TransferStatus.failed,
        errorMessage: error,
      );
      state = state.copyWith(
        activeTransfers: transfers,
        completedTransfers: [...state.completedTransfers, transfer],
      );
    }
  }

  /// Pause a transfer
  void pauseTransfer(String transferId) {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      transfers[index] = transfers[index].copyWith(
        isPaused: true,
        status: TransferStatus.paused,
      );
      state = state.copyWith(activeTransfers: transfers);
    }
  }

  /// Resume a paused transfer
  void resumeTransfer(String transferId) {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      transfers[index] = transfers[index].copyWith(
        isPaused: false,
        status: TransferStatus.transferring,
      );
      state = state.copyWith(activeTransfers: transfers);
    }
  }

  /// Cancel a transfer
  Future<void> cancelTransfer(String transferId) async {
    final transfers = [...state.activeTransfers];
    final index = transfers.indexWhere((t) => t.id == transferId);

    if (index != -1) {
      transfers.removeAt(index);
      state = state.copyWith(activeTransfers: transfers);
      await _historyService.cancelTransfer(transferId);
    }
  }

  /// Disconnect from peer
  Future<void> disconnect() async {
    if (_connectionId != null) {
      await _webrtc.closeConnection(_connectionId!);
      _connectionId = null;
    }

    _signalingSubscription?.cancel();

    state = state.copyWith(
      connectionStatus: ConnectionStatus.disconnected,
      currentPeerId: null,
      currentPeerName: null,
      sessionKey: null,
    );
  }

  @override
  void dispose() {
    disconnect();
    super.dispose();
  }
}

/// Provider for transfer state
final transferProvider = StateNotifierProvider<TransferNotifier, TransferState>(
  (ref) => TransferNotifier(),
);
