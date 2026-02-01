import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

/// Production-safe logger that suppresses verbose output in release builds
class SecureLogger {
  final String tag;
  late final Logger _logger;

  SecureLogger(this.tag) {
    _logger = Logger(
      printer: kReleaseMode
          ? _ProductionPrinter(tag)
          : PrettyPrinter(
              methodCount: 2,
              errorMethodCount: 8,
              lineLength: 120,
              colors: true,
              printEmojis: true,
              printTime: true,
            ),
      level: kReleaseMode ? Level.warning : Level.debug,
      filter: _ProductionFilter(),
    );
  }

  /// Debug level - only in debug builds
  void d(String message, {Object? error, StackTrace? stackTrace}) {
    if (!kReleaseMode) {
      _logger.d('[$tag] $message', error: error, stackTrace: stackTrace);
    }
  }

  /// Info level - only in debug builds
  void i(String message, {Object? error, StackTrace? stackTrace}) {
    if (!kReleaseMode) {
      _logger.i('[$tag] $message', error: error, stackTrace: stackTrace);
    }
  }

  /// Warning level - logged in all builds (but minimal in release)
  void w(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.w('[$tag] $message', error: error, stackTrace: stackTrace);
  }

  /// Error level - always logged (sent to crash reporting in release)
  void e(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.e('[$tag] $message', error: error, stackTrace: stackTrace);

    // In release mode, also send to crash reporting
    if (kReleaseMode && error != null) {
      _reportToCrashReporting(message, error, stackTrace);
    }
  }

  /// Fatal level - always logged with crash reporting
  void f(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.f('[$tag] $message', error: error, stackTrace: stackTrace);

    if (error != null) {
      _reportToCrashReporting(message, error, stackTrace);
    }
  }

  void _reportToCrashReporting(String message, Object error, StackTrace? stackTrace) {
    // Integration point for Sentry/Crashlytics
    // This will be connected when crash reporting is set up
    try {
      // Example: Sentry.captureException(error, stackTrace: stackTrace);
      // Example: FirebaseCrashlytics.instance.recordError(error, stackTrace);
    } catch (_) {
      // Silently fail if crash reporting isn't available
    }
  }
}

/// Production filter - only logs warnings and errors in release
class _ProductionFilter extends LogFilter {
  @override
  bool shouldLog(LogEvent event) {
    if (kReleaseMode) {
      return event.level.index >= Level.warning.index;
    }
    return true;
  }
}

/// Minimal printer for production - no emojis, timestamps, or colors
class _ProductionPrinter extends LogPrinter {
  final String tag;

  _ProductionPrinter(this.tag);

  @override
  List<String> log(LogEvent event) {
    final prefix = _levelPrefix(event.level);
    final message = event.message;

    final lines = <String>['$prefix [$tag] $message'];

    if (event.error != null) {
      lines.add('Error: ${event.error}');
    }

    // Don't include stack traces in production logs (they go to crash reporting)

    return lines;
  }

  String _levelPrefix(Level level) {
    switch (level) {
      case Level.trace:
        return 'T';
      case Level.debug:
        return 'D';
      case Level.info:
        return 'I';
      case Level.warning:
        return 'W';
      case Level.error:
        return 'E';
      case Level.fatal:
        return 'F';
      default:
        return '?';
    }
  }
}

/// Global app logger instance
final appLogger = SecureLogger('Tallow');
