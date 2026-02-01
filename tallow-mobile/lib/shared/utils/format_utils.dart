import 'package:intl/intl.dart';

/// Formatting utility functions
class FormatUtils {
  /// Format file size to human readable string
  static String formatFileSize(int bytes) {
    if (bytes < 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var unitIndex = 0;
    var size = bytes.toDouble();

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    if (unitIndex == 0) {
      return '${size.toInt()} ${units[unitIndex]}';
    }

    return '${size.toStringAsFixed(1)} ${units[unitIndex]}';
  }

  /// Format transfer speed
  static String formatSpeed(double bytesPerSecond) {
    return formatFileSize(bytesPerSecond.toInt());
  }

  /// Format duration to human readable string
  static String formatDuration(Duration duration) {
    if (duration.inSeconds < 0) return '0s';

    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes.remainder(60)}m';
    }

    if (duration.inMinutes > 0) {
      return '${duration.inMinutes}m ${duration.inSeconds.remainder(60)}s';
    }

    return '${duration.inSeconds}s';
  }

  /// Format duration with leading zeros (HH:MM:SS)
  static String formatDurationWithLeadingZeros(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:'
          '${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
    }

    return '${minutes.toString().padLeft(2, '0')}:'
        '${seconds.toString().padLeft(2, '0')}';
  }

  /// Format date to relative string
  static String formatRelativeDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inSeconds < 60) {
      return 'Just now';
    }

    if (diff.inMinutes < 60) {
      final minutes = diff.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    }

    if (diff.inHours < 24) {
      final hours = diff.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    }

    if (diff.inDays < 7) {
      final days = diff.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    }

    if (diff.inDays < 30) {
      final weeks = (diff.inDays / 7).floor();
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    }

    if (diff.inDays < 365) {
      final months = (diff.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    }

    final years = (diff.inDays / 365).floor();
    return '$years ${years == 1 ? 'year' : 'years'} ago';
  }

  /// Format date to full date string
  static String formatDateTime(DateTime date) {
    return DateFormat('MMM d, yyyy h:mm a').format(date);
  }

  /// Format date only
  static String formatDate(DateTime date) {
    return DateFormat('MMM d, yyyy').format(date);
  }

  /// Format time only
  static String formatTime(DateTime date) {
    return DateFormat('h:mm a').format(date);
  }

  /// Format date for grouping (Today, Yesterday, or date)
  static String formatDateGroup(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == yesterday) {
      return 'Yesterday';
    } else if (now.difference(date).inDays < 7) {
      return DateFormat('EEEE').format(date); // Day name
    } else {
      return DateFormat('MMM d').format(date);
    }
  }

  /// Format percentage
  static String formatPercentage(double value, {int decimals = 0}) {
    return '${(value * 100).toStringAsFixed(decimals)}%';
  }

  /// Format number with thousands separator
  static String formatNumber(int number) {
    return NumberFormat('#,###').format(number);
  }

  /// Format number to compact form (1K, 1M, etc.)
  static String formatCompactNumber(int number) {
    if (number < 1000) return number.toString();
    if (number < 1000000) return '${(number / 1000).toStringAsFixed(1)}K';
    if (number < 1000000000) return '${(number / 1000000).toStringAsFixed(1)}M';
    return '${(number / 1000000000).toStringAsFixed(1)}B';
  }

  /// Truncate string with ellipsis
  static String truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength - 3)}...';
  }

  /// Format device ID for display (show first and last 4 characters)
  static String formatDeviceId(String deviceId) {
    if (deviceId.length <= 8) return deviceId;
    return '${deviceId.substring(0, 4)}...${deviceId.substring(deviceId.length - 4)}';
  }

  /// Format verification code with spaces
  static String formatVerificationCode(String code) {
    if (code.length != 6) return code;
    return '${code.substring(0, 3)} ${code.substring(3)}';
  }

  /// Format IP address
  static String formatIpAddress(String ip, int port) {
    return '$ip:$port';
  }

  /// Pluralize word
  static String pluralize(int count, String singular, [String? plural]) {
    if (count == 1) return '$count $singular';
    return '$count ${plural ?? '${singular}s'}';
  }
}
