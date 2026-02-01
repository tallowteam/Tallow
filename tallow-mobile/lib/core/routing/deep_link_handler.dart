import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/utils/secure_logger.dart';

final _logger = SecureLogger('DeepLink');

/// Deep link handler for tallow:// URLs and universal links
class DeepLinkHandler {
  static final DeepLinkHandler _instance = DeepLinkHandler._internal();
  factory DeepLinkHandler() => _instance;
  DeepLinkHandler._internal();

  static const MethodChannel _channel = MethodChannel('app.tallow.mobile/deeplink');

  StreamSubscription<String?>? _uriLinkSubscription;
  StreamSubscription<List<SharedMediaFile>>? _sharedFilesSubscription;
  StreamSubscription<String?>? _sharedTextSubscription;

  final _deepLinkController = StreamController<DeepLink>.broadcast();
  final _sharedFilesController = StreamController<List<SharedMediaFile>>.broadcast();

  Stream<DeepLink> get deepLinks => _deepLinkController.stream;
  Stream<List<SharedMediaFile>> get sharedFiles => _sharedFilesController.stream;

  /// Initialize deep link handling
  Future<void> initialize() async {
    // Handle initial deep link (app was closed)
    await _handleInitialLink();

    // Listen for deep links while app is running
    _listenForLinks();

    // Listen for shared files/text
    _listenForSharedContent();
  }

  Future<void> _handleInitialLink() async {
    try {
      // Check for initial URI (universal links / deep links)
      final initialUri = await _channel.invokeMethod<String>('getInitialLink');
      if (initialUri != null && initialUri.isNotEmpty) {
        _handleUri(initialUri);
      }

      // Check for initial shared files
      final sharedFiles = await ReceiveSharingIntent.getInitialMedia();
      if (sharedFiles.isNotEmpty) {
        _sharedFilesController.add(sharedFiles);
      }

      // Check for initial shared text
      final sharedText = await ReceiveSharingIntent.getInitialText();
      if (sharedText != null && sharedText.isNotEmpty) {
        _handleSharedText(sharedText);
      }
    } catch (e) {
      _logger.e('Error handling initial link', error: e);
    }
  }

  void _listenForLinks() {
    // Listen for universal links / deep links via platform channel
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onDeepLink') {
        final uri = call.arguments as String?;
        if (uri != null) {
          _handleUri(uri);
        }
      }
      return null;
    });
  }

  void _listenForSharedContent() {
    // Listen for shared media files
    _sharedFilesSubscription = ReceiveSharingIntent.getMediaStream().listen(
      (files) {
        if (files.isNotEmpty) {
          _sharedFilesController.add(files);
        }
      },
      onError: (error) {
        _logger.e('Error receiving shared files', error: error);
      },
    );

    // Listen for shared text
    _sharedTextSubscription = ReceiveSharingIntent.getTextStream().listen(
      (text) {
        if (text != null && text.isNotEmpty) {
          _handleSharedText(text);
        }
      },
      onError: (error) {
        _logger.e('Error receiving shared text', error: error);
      },
    );
  }

  void _handleUri(String uriString) {
    try {
      final uri = Uri.parse(uriString);
      final deepLink = _parseDeepLink(uri);
      if (deepLink != null) {
        _logger.i('Handling deep link: ${deepLink.type}');
        _deepLinkController.add(deepLink);
      }
    } catch (e) {
      _logger.e('Error parsing URI', error: e);
    }
  }

  void _handleSharedText(String text) {
    // Check if shared text is a tallow link
    if (text.startsWith('tallow://') || text.contains('tallow.app/')) {
      _handleUri(text);
    } else {
      // Treat as message to send
      _deepLinkController.add(DeepLink(
        type: DeepLinkType.shareText,
        data: {'text': text},
      ));
    }
  }

  DeepLink? _parseDeepLink(Uri uri) {
    // Handle tallow:// scheme
    if (uri.scheme == 'tallow') {
      return _parseTallowUri(uri);
    }

    // Handle https://tallow.app universal links
    if (uri.host == 'tallow.app' || uri.host == 'www.tallow.app') {
      return _parseUniversalLink(uri);
    }

    return null;
  }

  DeepLink? _parseTallowUri(Uri uri) {
    final path = uri.path;
    final params = uri.queryParameters;

    switch (uri.host) {
      case 'connect':
        // tallow://connect?device=<id>&code=<code>
        return DeepLink(
          type: DeepLinkType.connect,
          data: {
            'deviceId': params['device'],
            'code': params['code'],
          },
        );

      case 'room':
        // tallow://room/<roomCode>
        final roomCode = path.isNotEmpty ? path.substring(1) : params['code'];
        return DeepLink(
          type: DeepLinkType.joinRoom,
          data: {'roomCode': roomCode},
        );

      case 'transfer':
        // tallow://transfer?to=<deviceId>
        return DeepLink(
          type: DeepLinkType.transfer,
          data: {'deviceId': params['to']},
        );

      case 'settings':
        // tallow://settings/<section>
        return DeepLink(
          type: DeepLinkType.settings,
          data: {'section': path.isNotEmpty ? path.substring(1) : null},
        );

      default:
        return null;
    }
  }

  DeepLink? _parseUniversalLink(Uri uri) {
    final pathSegments = uri.pathSegments;
    if (pathSegments.isEmpty) return null;

    switch (pathSegments[0]) {
      case 'join':
        // https://tallow.app/join/<roomCode>
        if (pathSegments.length > 1) {
          return DeepLink(
            type: DeepLinkType.joinRoom,
            data: {'roomCode': pathSegments[1]},
          );
        }
        break;

      case 'connect':
        // https://tallow.app/connect?device=<id>&code=<code>
        return DeepLink(
          type: DeepLinkType.connect,
          data: {
            'deviceId': uri.queryParameters['device'],
            'code': uri.queryParameters['code'],
          },
        );

      case 'share':
        // https://tallow.app/share/<shareId>
        if (pathSegments.length > 1) {
          return DeepLink(
            type: DeepLinkType.receiveShare,
            data: {'shareId': pathSegments[1]},
          );
        }
        break;

      case 'download':
        // https://tallow.app/download
        return DeepLink(
          type: DeepLinkType.download,
          data: {},
        );
    }

    return null;
  }

  /// Navigate based on deep link
  void handleDeepLinkNavigation(
    BuildContext context,
    DeepLink deepLink,
    WidgetRef ref,
  ) {
    switch (deepLink.type) {
      case DeepLinkType.connect:
        _navigateToConnect(context, deepLink.data);
        break;

      case DeepLinkType.joinRoom:
        _navigateToRoom(context, deepLink.data);
        break;

      case DeepLinkType.transfer:
        _navigateToTransfer(context, deepLink.data);
        break;

      case DeepLinkType.settings:
        _navigateToSettings(context, deepLink.data);
        break;

      case DeepLinkType.receiveShare:
        _navigateToReceiveShare(context, deepLink.data);
        break;

      case DeepLinkType.shareText:
        _handleShareText(context, deepLink.data);
        break;

      case DeepLinkType.download:
        // Already on app, no action needed
        break;
    }
  }

  void _navigateToConnect(BuildContext context, Map<String, dynamic> data) {
    // Navigate to discovery screen and initiate connection
    Navigator.of(context).pushNamedAndRemoveUntil(
      '/discover',
      (route) => false,
      arguments: data,
    );
  }

  void _navigateToRoom(BuildContext context, Map<String, dynamic> data) {
    // Navigate to room join screen
    Navigator.of(context).pushNamed(
      '/room/join',
      arguments: data,
    );
  }

  void _navigateToTransfer(BuildContext context, Map<String, dynamic> data) {
    // Navigate to transfer screen
    Navigator.of(context).pushNamed(
      '/transfer',
      arguments: data,
    );
  }

  void _navigateToSettings(BuildContext context, Map<String, dynamic> data) {
    // Navigate to settings screen
    Navigator.of(context).pushNamed(
      '/settings',
      arguments: data,
    );
  }

  void _navigateToReceiveShare(BuildContext context, Map<String, dynamic> data) {
    // Navigate to receive share screen
    Navigator.of(context).pushNamed(
      '/receive',
      arguments: data,
    );
  }

  void _handleShareText(BuildContext context, Map<String, dynamic> data) {
    // Handle shared text - could open chat or clipboard sync
    final text = data['text'] as String?;
    if (text != null) {
      // Show snackbar or navigate to chat
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Text received: ${text.substring(0, text.length.clamp(0, 50))}...')),
      );
    }
  }

  /// Generate a shareable room link
  static String generateRoomLink(String roomCode) {
    return 'https://tallow.app/join/$roomCode';
  }

  /// Generate a connect link for QR code
  static String generateConnectLink({
    required String deviceId,
    required String code,
  }) {
    return 'tallow://connect?device=$deviceId&code=$code';
  }

  /// Dispose of subscriptions
  void dispose() {
    _uriLinkSubscription?.cancel();
    _sharedFilesSubscription?.cancel();
    _sharedTextSubscription?.cancel();
    _deepLinkController.close();
    _sharedFilesController.close();
  }
}

/// Types of deep links
enum DeepLinkType {
  connect,
  joinRoom,
  transfer,
  settings,
  receiveShare,
  shareText,
  download,
}

/// Parsed deep link
class DeepLink {
  final DeepLinkType type;
  final Map<String, dynamic> data;

  DeepLink({
    required this.type,
    required this.data,
  });

  @override
  String toString() => 'DeepLink($type, $data)';
}

/// Provider for deep link handler
final deepLinkHandlerProvider = Provider<DeepLinkHandler>((ref) {
  final handler = DeepLinkHandler();
  ref.onDispose(() => handler.dispose());
  return handler;
});

/// Provider for deep link stream
final deepLinkStreamProvider = StreamProvider<DeepLink>((ref) {
  final handler = ref.watch(deepLinkHandlerProvider);
  return handler.deepLinks;
});

/// Provider for shared files stream
final sharedFilesStreamProvider = StreamProvider<List<SharedMediaFile>>((ref) {
  final handler = ref.watch(deepLinkHandlerProvider);
  return handler.sharedFiles;
});
