import 'package:flutter/material.dart';

/// File utility functions
class FileUtils {
  /// Get icon for file extension
  static IconData getIconForExtension(String? extension) {
    if (extension == null) return Icons.insert_drive_file;

    switch (extension.toLowerCase()) {
      // Images
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp':
      case 'svg':
      case 'heic':
      case 'heif':
        return Icons.image;

      // Videos
      case 'mp4':
      case 'mov':
      case 'avi':
      case 'mkv':
      case 'webm':
      case 'flv':
      case 'wmv':
      case 'm4v':
        return Icons.video_file;

      // Audio
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac':
      case 'ogg':
      case 'm4a':
      case 'wma':
        return Icons.audio_file;

      // Documents
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
      case 'docx':
        return Icons.description;
      case 'xls':
      case 'xlsx':
        return Icons.table_chart;
      case 'ppt':
      case 'pptx':
        return Icons.slideshow;
      case 'txt':
        return Icons.text_snippet;

      // Archives
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return Icons.folder_zip;

      // Code
      case 'html':
      case 'css':
      case 'js':
      case 'ts':
      case 'dart':
      case 'py':
      case 'java':
      case 'kt':
      case 'swift':
      case 'c':
      case 'cpp':
      case 'h':
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return Icons.code;

      // APK/Apps
      case 'apk':
      case 'ipa':
      case 'exe':
      case 'dmg':
      case 'deb':
      case 'rpm':
        return Icons.android;

      default:
        return Icons.insert_drive_file;
    }
  }

  /// Get icon for file name
  static IconData getIconForFileName(String fileName) {
    final parts = fileName.split('.');
    if (parts.length > 1) {
      return getIconForExtension(parts.last);
    }
    return Icons.insert_drive_file;
  }

  /// Get file extension from name
  static String? getExtension(String fileName) {
    final parts = fileName.split('.');
    if (parts.length > 1) {
      return parts.last.toLowerCase();
    }
    return null;
  }

  /// Get MIME type for extension
  static String getMimeType(String? extension) {
    if (extension == null) return 'application/octet-stream';

    switch (extension.toLowerCase()) {
      // Images
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      case 'bmp':
        return 'image/bmp';

      // Videos
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'mkv':
        return 'video/x-matroska';

      // Audio
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'ogg':
        return 'audio/ogg';
      case 'flac':
        return 'audio/flac';
      case 'aac':
        return 'audio/aac';
      case 'm4a':
        return 'audio/mp4';

      // Documents
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt':
        return 'application/vnd.ms-powerpoint';
      case 'pptx':
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt':
        return 'text/plain';

      // Archives
      case 'zip':
        return 'application/zip';
      case 'rar':
        return 'application/vnd.rar';
      case '7z':
        return 'application/x-7z-compressed';
      case 'tar':
        return 'application/x-tar';
      case 'gz':
        return 'application/gzip';

      // Code
      case 'html':
        return 'text/html';
      case 'css':
        return 'text/css';
      case 'js':
        return 'application/javascript';
      case 'json':
        return 'application/json';
      case 'xml':
        return 'application/xml';

      // Apps
      case 'apk':
        return 'application/vnd.android.package-archive';

      default:
        return 'application/octet-stream';
    }
  }

  /// Check if file is an image
  static bool isImage(String fileName) {
    final ext = getExtension(fileName);
    if (ext == null) return false;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif']
        .contains(ext.toLowerCase());
  }

  /// Check if file is a video
  static bool isVideo(String fileName) {
    final ext = getExtension(fileName);
    if (ext == null) return false;
    return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v']
        .contains(ext.toLowerCase());
  }

  /// Check if file is audio
  static bool isAudio(String fileName) {
    final ext = getExtension(fileName);
    if (ext == null) return false;
    return ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma']
        .contains(ext.toLowerCase());
  }

  /// Check if file is a document
  static bool isDocument(String fileName) {
    final ext = getExtension(fileName);
    if (ext == null) return false;
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
        .contains(ext.toLowerCase());
  }

  /// Check if file is an archive
  static bool isArchive(String fileName) {
    final ext = getExtension(fileName);
    if (ext == null) return false;
    return ['zip', 'rar', '7z', 'tar', 'gz'].contains(ext.toLowerCase());
  }

  /// Get file category
  static FileCategory getCategory(String fileName) {
    if (isImage(fileName)) return FileCategory.image;
    if (isVideo(fileName)) return FileCategory.video;
    if (isAudio(fileName)) return FileCategory.audio;
    if (isDocument(fileName)) return FileCategory.document;
    if (isArchive(fileName)) return FileCategory.archive;
    return FileCategory.other;
  }

  /// Sanitize file name for safe storage
  static String sanitizeFileName(String fileName) {
    return fileName
        .replaceAll(RegExp(r'[<>:"/\\|?*]'), '_')
        .replaceAll(RegExp(r'\s+'), '_')
        .replaceAll(RegExp(r'_+'), '_');
  }

  /// Generate unique file name
  static String generateUniqueFileName(String baseName, List<String> existingNames) {
    if (!existingNames.contains(baseName)) return baseName;

    final ext = getExtension(baseName);
    final name = ext != null
        ? baseName.substring(0, baseName.length - ext.length - 1)
        : baseName;

    var counter = 1;
    String newName;
    do {
      newName = ext != null ? '$name ($counter).$ext' : '$name ($counter)';
      counter++;
    } while (existingNames.contains(newName));

    return newName;
  }
}

/// File category enum
enum FileCategory {
  image,
  video,
  audio,
  document,
  archive,
  other,
}
