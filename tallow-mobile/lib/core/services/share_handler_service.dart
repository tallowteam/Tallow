import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import 'package:path_provider/path_provider.dart';

import '../../shared/utils/secure_logger.dart';

final _logger = SecureLogger('ShareHandler');

/// Service for handling files shared from other apps
class ShareHandlerService {
  static final ShareHandlerService _instance = ShareHandlerService._internal();
  factory ShareHandlerService() => _instance;
  ShareHandlerService._internal();

  StreamSubscription<List<SharedMediaFile>>? _mediaSubscription;
  StreamSubscription<String?>? _textSubscription;

  final _sharedFilesController = StreamController<List<SharedFile>>.broadcast();
  final _sharedTextController = StreamController<String>.broadcast();

  Stream<List<SharedFile>> get sharedFilesStream => _sharedFilesController.stream;
  Stream<String> get sharedTextStream => _sharedTextController.stream;

  /// Initialize the share handler
  Future<void> initialize() async {
    _logger.i('Initializing share handler');

    // Handle initial shared files (app was not running)
    await _handleInitialSharedFiles();
    await _handleInitialSharedText();

    // Listen for incoming shared files
    _mediaSubscription = ReceiveSharingIntent.getMediaStream().listen(
      (files) => _handleMediaFiles(files),
      onError: (error) => _logger.e('Media stream error', error: error),
    );

    // Listen for incoming shared text
    _textSubscription = ReceiveSharingIntent.getTextStream().listen(
      (text) => _handleSharedText(text),
      onError: (error) => _logger.e('Text stream error', error: error),
    );

    // Also check for iOS App Group shared files
    if (Platform.isIOS) {
      await _checkIOSAppGroupFiles();
    }
  }

  Future<void> _handleInitialSharedFiles() async {
    try {
      final files = await ReceiveSharingIntent.getInitialMedia();
      if (files.isNotEmpty) {
        _handleMediaFiles(files);
      }
    } catch (e) {
      _logger.e('Error getting initial shared files', error: e);
    }
  }

  Future<void> _handleInitialSharedText() async {
    try {
      final text = await ReceiveSharingIntent.getInitialText();
      if (text != null && text.isNotEmpty) {
        _handleSharedText(text);
      }
    } catch (e) {
      _logger.e('Error getting initial shared text', error: e);
    }
  }

  void _handleMediaFiles(List<SharedMediaFile> files) {
    if (files.isEmpty) return;

    _logger.i('Received ${files.length} shared files');

    final sharedFiles = files.map((file) {
      final fileInfo = File(file.path);
      return SharedFile(
        path: file.path,
        name: fileInfo.uri.pathSegments.last,
        size: fileInfo.existsSync() ? fileInfo.lengthSync() : 0,
        mimeType: file.mimeType ?? _getMimeType(file.path),
        type: _mapMediaType(file.type),
        thumbnail: file.thumbnail,
      );
    }).toList();

    _sharedFilesController.add(sharedFiles);
  }

  void _handleSharedText(String? text) {
    if (text == null || text.isEmpty) return;

    _logger.i('Received shared text: ${text.substring(0, text.length.clamp(0, 50))}...');
    _sharedTextController.add(text);
  }

  /// Check for files shared via iOS App Group
  Future<void> _checkIOSAppGroupFiles() async {
    if (!Platform.isIOS) return;

    try {
      // iOS App Group container path
      // This would be set up in native code
      final directory = await getApplicationDocumentsDirectory();
      final containerPath = directory.parent.path;
      final sharedDir = Directory('$containerPath/AppGroup/group.app.tallow.mobile/shared');

      if (!sharedDir.existsSync()) return;

      final metadataFile = File('${sharedDir.parent.path}/shared_files.json');
      if (!metadataFile.existsSync()) return;

      final jsonContent = await metadataFile.readAsString();
      final List<dynamic> filesData = jsonDecode(jsonContent);

      final sharedFiles = <SharedFile>[];
      for (final fileData in filesData) {
        if (fileData['type'] == 'file') {
          sharedFiles.add(SharedFile(
            path: fileData['path'] as String,
            name: fileData['name'] as String,
            size: fileData['size'] as int,
            mimeType: fileData['mimeType'] as String? ?? 'application/octet-stream',
            type: SharedFileType.file,
          ));
        } else if (fileData['type'] == 'text') {
          _sharedTextController.add(fileData['text'] as String);
        } else if (fileData['type'] == 'url') {
          _sharedTextController.add(fileData['url'] as String);
        }
      }

      if (sharedFiles.isNotEmpty) {
        _sharedFilesController.add(sharedFiles);
      }

      // Clean up after processing
      await metadataFile.delete();
      await _cleanupSharedFiles(sharedDir);
    } catch (e) {
      _logger.e('Error checking iOS App Group files', error: e);
    }
  }

  Future<void> _cleanupSharedFiles(Directory sharedDir) async {
    try {
      if (sharedDir.existsSync()) {
        final files = sharedDir.listSync();
        for (final file in files) {
          await file.delete();
        }
      }
    } catch (e) {
      _logger.w('Error cleaning up shared files', error: e);
    }
  }

  SharedFileType _mapMediaType(SharedMediaType? type) {
    switch (type) {
      case SharedMediaType.image:
        return SharedFileType.image;
      case SharedMediaType.video:
        return SharedFileType.video;
      case SharedMediaType.file:
      default:
        return SharedFileType.file;
    }
  }

  String _getMimeType(String path) {
    final extension = path.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'mov':
        return 'video/quicktime';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      case 'zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }

  /// Reset the share intent (call after processing)
  void reset() {
    ReceiveSharingIntent.reset();
  }

  void dispose() {
    _mediaSubscription?.cancel();
    _textSubscription?.cancel();
    _sharedFilesController.close();
    _sharedTextController.close();
  }
}

/// Represents a shared file
class SharedFile {
  final String path;
  final String name;
  final int size;
  final String mimeType;
  final SharedFileType type;
  final String? thumbnail;

  SharedFile({
    required this.path,
    required this.name,
    required this.size,
    required this.mimeType,
    required this.type,
    this.thumbnail,
  });

  File get file => File(path);

  bool get exists => file.existsSync();

  String get sizeFormatted {
    if (size < 1024) return '$size B';
    if (size < 1024 * 1024) return '${(size / 1024).toStringAsFixed(1)} KB';
    if (size < 1024 * 1024 * 1024) {
      return '${(size / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(size / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }

  @override
  String toString() => 'SharedFile($name, $sizeFormatted)';
}

/// Types of shared files
enum SharedFileType {
  file,
  image,
  video,
  audio,
}
