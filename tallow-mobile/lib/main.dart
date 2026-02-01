import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'app.dart';
import 'core/storage/secure_storage.dart';
import 'core/crypto/key_exchange.dart';
import 'shared/utils/secure_logger.dart';

final _logger = SecureLogger('Main');

void main() async {
  // Initialize Sentry for crash reporting (only in release)
  if (kReleaseMode) {
    await SentryFlutter.init(
      (options) {
        options.dsn = const String.fromEnvironment(
          'SENTRY_DSN',
          defaultValue: '',
        );
        options.environment = kReleaseMode ? 'production' : 'development';
        options.tracesSampleRate = 0.2; // 20% of transactions for performance
        options.attachStacktrace = true;
        options.sendDefaultPii = false; // Privacy: don't send PII
        options.beforeSend = (event, hint) {
          // Scrub any sensitive data before sending
          return _scrubSensitiveData(event);
        };
      },
      appRunner: () => _initializeAndRun(),
    );
  } else {
    await _initializeAndRun();
  }
}

Future<void> _initializeAndRun() async {
  await runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // Set preferred orientations
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    // Set system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF1a1a2e),
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );

    // Initialize secure storage
    await SecureStorageService.instance.initialize();

    // Initialize cryptographic keys if needed
    await _initializeCryptoKeys();

    // Set error handlers
    FlutterError.onError = (FlutterErrorDetails details) {
      _logger.e(
        'Flutter Error',
        error: details.exception,
        stackTrace: details.stack,
      );

      if (kReleaseMode) {
        // Report to Sentry in production
        Sentry.captureException(
          details.exception,
          stackTrace: details.stack,
        );
      }
    };

    PlatformDispatcher.instance.onError = (error, stack) {
      _logger.e('Platform Error', error: error, stackTrace: stack);

      if (kReleaseMode) {
        Sentry.captureException(error, stackTrace: stack);
      }

      return true;
    };

    runApp(
      const ProviderScope(
        child: TallowApp(),
      ),
    );
  }, (error, stack) {
    _logger.e('Uncaught Error', error: error, stackTrace: stack);

    if (kReleaseMode) {
      Sentry.captureException(error, stackTrace: stack);
    }
  });
}

Future<void> _initializeCryptoKeys() async {
  try {
    final storage = SecureStorageService.instance;
    final hasKeys = await storage.hasIdentityKeyPair();

    if (!hasKeys) {
      _logger.i('Generating new identity key pair...');
      final keyExchange = KeyExchangeService();
      final keyPair = await keyExchange.generateIdentityKeyPair();
      await storage.saveIdentityKeyPair(keyPair);
      _logger.i('Identity key pair generated and saved');
    } else {
      _logger.i('Identity key pair already exists');
    }
  } catch (e, stack) {
    _logger.e('Failed to initialize crypto keys', error: e, stackTrace: stack);

    if (kReleaseMode) {
      Sentry.captureException(e, stackTrace: stack);
    }
  }
}

/// Scrub sensitive data from Sentry events before sending
SentryEvent _scrubSensitiveData(SentryEvent event) {
  // List of patterns to scrub
  final sensitivePatterns = [
    RegExp(r'(password|secret|key|token|credential|private)[\s]*[:=][\s]*[^\s,}]+', caseSensitive: false),
    RegExp(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*', caseSensitive: false),
    RegExp(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'), // Email
  ];

  String scrub(String? input) {
    if (input == null) return '';
    var result = input;
    for (final pattern in sensitivePatterns) {
      result = result.replaceAll(pattern, '[REDACTED]');
    }
    return result;
  }

  // Scrub the event message
  if (event.message != null) {
    return event.copyWith(
      message: SentryMessage(scrub(event.message!.formatted)),
    );
  }

  return event;
}
