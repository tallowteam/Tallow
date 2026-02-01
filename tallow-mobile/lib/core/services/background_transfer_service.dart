import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';

import '../../shared/utils/secure_logger.dart';

final _logger = SecureLogger('BackgroundTransfer');

/// Background transfer service for platform-specific background task handling
/// Uses WorkManager on Android and BGTaskScheduler on iOS
class BackgroundTransferService {
  static final BackgroundTransferService _instance = BackgroundTransferService._internal();
  factory BackgroundTransferService() => _instance;
  BackgroundTransferService._internal();

  static const MethodChannel _channel = MethodChannel('app.tallow.mobile/background_transfer');

  final _transferProgressController = StreamController<TransferProgress>.broadcast();
  final _transferCompleteController = StreamController<TransferComplete>.broadcast();

  Stream<TransferProgress> get progressStream => _transferProgressController.stream;
  Stream<TransferComplete> get completeStream => _transferCompleteController.stream;

  bool _initialized = false;

  /// Initialize the background transfer service
  Future<void> initialize() async {
    if (_initialized) return;

    _channel.setMethodCallHandler(_handleMethodCall);
    _initialized = true;
    _logger.i('Background transfer service initialized');
  }

  Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onTransferProgress':
        final args = call.arguments as Map<dynamic, dynamic>;
        _transferProgressController.add(TransferProgress(
          transferId: args['transferId'] as String,
          progress: (args['progress'] as num).toDouble(),
          bytesTransferred: args['bytesTransferred'] as int,
          totalBytes: args['totalBytes'] as int,
        ));
        break;

      case 'onTransferComplete':
        final args = call.arguments as Map<dynamic, dynamic>;
        _transferCompleteController.add(TransferComplete(
          transferId: args['transferId'] as String,
          success: args['success'] as bool,
          error: args['error'] as String?,
          filePath: args['filePath'] as String?,
        ));
        break;

      default:
        return null;
    }
  }

  /// Schedule a background transfer
  Future<String> scheduleTransfer({
    required String transferId,
    required String fileName,
    required int fileSize,
    required String peerId,
    required bool isSend,
    String? filePath,
  }) async {
    if (kIsWeb) {
      _logger.w('Background transfers not supported on web');
      return transferId;
    }

    try {
      final result = await _channel.invokeMethod<String>('scheduleTransfer', {
        'transferId': transferId,
        'fileName': fileName,
        'fileSize': fileSize,
        'peerId': peerId,
        'direction': isSend ? 'send' : 'receive',
        'filePath': filePath,
      });

      _logger.i('Scheduled background transfer: $transferId');
      return result ?? transferId;
    } on PlatformException catch (e) {
      _logger.e('Failed to schedule background transfer', error: e);
      rethrow;
    }
  }

  /// Cancel a background transfer
  Future<void> cancelTransfer(String transferId) async {
    if (kIsWeb) return;

    try {
      await _channel.invokeMethod('cancelTransfer', {
        'transferId': transferId,
      });
      _logger.i('Cancelled background transfer: $transferId');
    } on PlatformException catch (e) {
      _logger.e('Failed to cancel background transfer', error: e);
    }
  }

  /// Get the status of a background transfer
  Future<BackgroundTransferStatus?> getTransferStatus(String transferId) async {
    if (kIsWeb) return null;

    try {
      final result = await _channel.invokeMethod<Map<dynamic, dynamic>>('getTransferStatus', {
        'transferId': transferId,
      });

      if (result == null) return null;

      return BackgroundTransferStatus(
        transferId: result['transferId'] as String,
        state: _parseState(result['state'] as String),
        progress: (result['progress'] as num?)?.toDouble() ?? 0,
      );
    } on PlatformException catch (e) {
      _logger.e('Failed to get transfer status', error: e);
      return null;
    }
  }

  /// Start the discovery service (Android only)
  Future<void> startDiscoveryService() async {
    if (!Platform.isAndroid) return;

    try {
      await _channel.invokeMethod('startDiscoveryService');
      _logger.i('Started discovery service');
    } on PlatformException catch (e) {
      _logger.e('Failed to start discovery service', error: e);
    }
  }

  /// Stop the discovery service (Android only)
  Future<void> stopDiscoveryService() async {
    if (!Platform.isAndroid) return;

    try {
      await _channel.invokeMethod('stopDiscoveryService');
      _logger.i('Stopped discovery service');
    } on PlatformException catch (e) {
      _logger.e('Failed to stop discovery service', error: e);
    }
  }

  BackgroundTransferState _parseState(String state) {
    switch (state.toLowerCase()) {
      case 'enqueued':
        return BackgroundTransferState.enqueued;
      case 'running':
        return BackgroundTransferState.running;
      case 'succeeded':
        return BackgroundTransferState.succeeded;
      case 'failed':
        return BackgroundTransferState.failed;
      case 'cancelled':
        return BackgroundTransferState.cancelled;
      default:
        return BackgroundTransferState.unknown;
    }
  }

  void dispose() {
    _transferProgressController.close();
    _transferCompleteController.close();
  }
}

/// Transfer progress update
class TransferProgress {
  final String transferId;
  final double progress;
  final int bytesTransferred;
  final int totalBytes;

  TransferProgress({
    required this.transferId,
    required this.progress,
    required this.bytesTransferred,
    required this.totalBytes,
  });

  double get speed => bytesTransferred > 0 ? bytesTransferred / 1.0 : 0;
}

/// Transfer completion event
class TransferComplete {
  final String transferId;
  final bool success;
  final String? error;
  final String? filePath;

  TransferComplete({
    required this.transferId,
    required this.success,
    this.error,
    this.filePath,
  });
}

/// Background transfer status
class BackgroundTransferStatus {
  final String transferId;
  final BackgroundTransferState state;
  final double progress;

  BackgroundTransferStatus({
    required this.transferId,
    required this.state,
    required this.progress,
  });
}

/// Background transfer states
enum BackgroundTransferState {
  enqueued,
  running,
  succeeded,
  failed,
  cancelled,
  unknown,
}
