import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colors.dart';

/// Light theme configuration
final ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: AppColorSchemes.defaultLight,
  fontFamily: 'Inter',
  scaffoldBackgroundColor: AppColors.backgroundLight,

  // AppBar
  appBarTheme: const AppBarTheme(
    centerTitle: false,
    elevation: 0,
    scrolledUnderElevation: 1,
    backgroundColor: AppColors.backgroundLight,
    foregroundColor: AppColors.textPrimary,
    systemOverlayStyle: SystemUiOverlayStyle.dark,
  ),

  // Navigation Bar
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: AppColors.backgroundLightElevated,
    indicatorColor: AppColors.primary.withOpacity(0.15),
    labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
  ),

  // Cards
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(
        color: Colors.black.withOpacity(0.08),
      ),
    ),
    color: AppColors.backgroundLightElevated,
  ),

  // Buttons
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      elevation: 0,
    ),
  ),

  filledButtonTheme: FilledButtonThemeData(
    style: FilledButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
  ),

  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primary,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      side: const BorderSide(color: AppColors.primary),
    ),
  ),

  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.primary,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
  ),

  // FAB
  floatingActionButtonTheme: FloatingActionButtonThemeData(
    backgroundColor: AppColors.primary,
    foregroundColor: Colors.white,
    elevation: 4,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),

  // Input
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.grey.shade100,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.black.withOpacity(0.1)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.error),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    hintStyle: TextStyle(color: AppColors.textSecondary),
  ),

  // Dialog
  dialogTheme: DialogTheme(
    backgroundColor: AppColors.backgroundLightElevated,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(24),
    ),
    elevation: 8,
  ),

  // Bottom Sheet
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: AppColors.backgroundLightElevated,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    elevation: 8,
  ),

  // Snackbar
  snackBarTheme: SnackBarThemeData(
    backgroundColor: AppColors.textPrimary,
    contentTextStyle: const TextStyle(color: Colors.white),
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),

  // Chip
  chipTheme: ChipThemeData(
    backgroundColor: Colors.grey.shade100,
    selectedColor: AppColors.primary.withOpacity(0.15),
    labelStyle: const TextStyle(color: AppColors.textPrimary),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),

  // Divider
  dividerTheme: DividerThemeData(
    color: Colors.black.withOpacity(0.1),
    thickness: 1,
  ),

  // List Tile
  listTileTheme: const ListTileThemeData(
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    textColor: AppColors.textPrimary,
    iconColor: AppColors.textSecondary,
  ),

  // Switch
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return Colors.white;
      }
      return Colors.grey.shade400;
    }),
    trackColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return AppColors.primary;
      }
      return Colors.grey.shade200;
    }),
  ),

  // Progress Indicator
  progressIndicatorTheme: ProgressIndicatorThemeData(
    color: AppColors.primary,
    linearTrackColor: Colors.grey.shade200,
    circularTrackColor: Colors.grey.shade200,
  ),

  // Icon
  iconTheme: const IconThemeData(
    color: AppColors.textPrimary,
  ),
);
