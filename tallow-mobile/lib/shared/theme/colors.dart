import 'package:flutter/material.dart';

/// App color constants
class AppColors {
  // Primary brand colors
  static const Color primary = Color(0xFF6366F1);
  static const Color primaryLight = Color(0xFF818CF8);
  static const Color primaryDark = Color(0xFF4F46E5);

  // Secondary colors
  static const Color secondary = Color(0xFF8B5CF6);
  static const Color secondaryLight = Color(0xFFA78BFA);
  static const Color secondaryDark = Color(0xFF7C3AED);

  // Background colors
  static const Color backgroundDark = Color(0xFF0F0F23);
  static const Color backgroundDarkElevated = Color(0xFF1A1A2E);
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color backgroundLightElevated = Color(0xFFFFFFFF);

  // Surface colors
  static const Color surfaceDark = Color(0xFF16213E);
  static const Color surfaceLight = Color(0xFFFFFFFF);

  // Status colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Text colors
  static const Color textPrimary = Color(0xFF1F2937);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textPrimaryDark = Color(0xFFF9FAFB);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);

  // Gradient colors
  static const List<Color> primaryGradient = [
    Color(0xFF6366F1),
    Color(0xFF8B5CF6),
  ];

  static const List<Color> darkGradient = [
    Color(0xFF0F0F23),
    Color(0xFF16213E),
  ];

  // Forest theme colors
  static const Color forestPrimary = Color(0xFF059669);
  static const Color forestSecondary = Color(0xFF10B981);
  static const Color forestBackground = Color(0xFF0F1A0F);
  static const Color forestSurface = Color(0xFF1A2E1A);

  // Ocean theme colors
  static const Color oceanPrimary = Color(0xFF0891B2);
  static const Color oceanSecondary = Color(0xFF06B6D4);
  static const Color oceanBackground = Color(0xFF0F1923);
  static const Color oceanSurface = Color(0xFF162736);

  // Transfer status colors
  static const Color transferPending = Color(0xFF6B7280);
  static const Color transferActive = Color(0xFF3B82F6);
  static const Color transferComplete = Color(0xFF10B981);
  static const Color transferFailed = Color(0xFFEF4444);
  static const Color transferPaused = Color(0xFFF59E0B);

  // Connection status colors
  static const Color online = Color(0xFF10B981);
  static const Color offline = Color(0xFF6B7280);
  static const Color connecting = Color(0xFFF59E0B);

  // Encryption indicator colors
  static const Color encrypted = Color(0xFF10B981);
  static const Color pqcEncrypted = Color(0xFF6366F1);
  static const Color unencrypted = Color(0xFFEF4444);
}

/// Color scheme generators
class AppColorSchemes {
  static ColorScheme get defaultDark => ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surfaceDark,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimaryDark,
        onError: Colors.white,
      );

  static ColorScheme get defaultLight => ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surfaceLight,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      );

  static ColorScheme get forestDark => ColorScheme.dark(
        primary: AppColors.forestPrimary,
        secondary: AppColors.forestSecondary,
        surface: AppColors.forestSurface,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimaryDark,
        onError: Colors.white,
      );

  static ColorScheme get forestLight => ColorScheme.light(
        primary: AppColors.forestPrimary,
        secondary: AppColors.forestSecondary,
        surface: AppColors.surfaceLight,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      );

  static ColorScheme get oceanDark => ColorScheme.dark(
        primary: AppColors.oceanPrimary,
        secondary: AppColors.oceanSecondary,
        surface: AppColors.oceanSurface,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimaryDark,
        onError: Colors.white,
      );

  static ColorScheme get oceanLight => ColorScheme.light(
        primary: AppColors.oceanPrimary,
        secondary: AppColors.oceanSecondary,
        surface: AppColors.surfaceLight,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      );
}

/// Extension for color utilities
extension ColorExtension on Color {
  /// Lighten a color by percentage
  Color lighten([double amount = 0.1]) {
    final hsl = HSLColor.fromColor(this);
    final lightness = (hsl.lightness + amount).clamp(0.0, 1.0);
    return hsl.withLightness(lightness).toColor();
  }

  /// Darken a color by percentage
  Color darken([double amount = 0.1]) {
    final hsl = HSLColor.fromColor(this);
    final lightness = (hsl.lightness - amount).clamp(0.0, 1.0);
    return hsl.withLightness(lightness).toColor();
  }

  /// Create a color with modified alpha
  Color withAlpha2(double opacity) {
    return withOpacity(opacity);
  }
}
