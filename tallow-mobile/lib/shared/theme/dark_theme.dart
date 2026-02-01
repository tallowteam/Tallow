import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colors.dart';

/// Dark theme configuration
final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: AppColorSchemes.defaultDark,
  fontFamily: 'Inter',
  scaffoldBackgroundColor: AppColors.backgroundDark,

  // AppBar
  appBarTheme: const AppBarTheme(
    centerTitle: false,
    elevation: 0,
    scrolledUnderElevation: 1,
    backgroundColor: AppColors.backgroundDark,
    foregroundColor: AppColors.textPrimaryDark,
    systemOverlayStyle: SystemUiOverlayStyle.light,
  ),

  // Navigation Bar
  navigationBarTheme: NavigationBarThemeData(
    backgroundColor: AppColors.backgroundDarkElevated,
    indicatorColor: AppColors.primary.withOpacity(0.2),
    labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
  ),

  // Cards
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(
        color: Colors.white.withOpacity(0.1),
      ),
    ),
    color: AppColors.backgroundDarkElevated,
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
    fillColor: AppColors.surfaceDark,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
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
    hintStyle: TextStyle(color: AppColors.textSecondaryDark),
  ),

  // Dialog
  dialogTheme: DialogTheme(
    backgroundColor: AppColors.backgroundDarkElevated,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(24),
    ),
    elevation: 8,
  ),

  // Bottom Sheet
  bottomSheetTheme: const BottomSheetThemeData(
    backgroundColor: AppColors.backgroundDarkElevated,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    elevation: 8,
  ),

  // Snackbar
  snackBarTheme: SnackBarThemeData(
    backgroundColor: AppColors.surfaceDark,
    contentTextStyle: const TextStyle(color: AppColors.textPrimaryDark),
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),

  // Chip
  chipTheme: ChipThemeData(
    backgroundColor: AppColors.surfaceDark,
    selectedColor: AppColors.primary.withOpacity(0.2),
    labelStyle: const TextStyle(color: AppColors.textPrimaryDark),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
    ),
  ),

  // Divider
  dividerTheme: DividerThemeData(
    color: Colors.white.withOpacity(0.1),
    thickness: 1,
  ),

  // List Tile
  listTileTheme: const ListTileThemeData(
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    textColor: AppColors.textPrimaryDark,
    iconColor: AppColors.textSecondaryDark,
  ),

  // Switch
  switchTheme: SwitchThemeData(
    thumbColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return Colors.white;
      }
      return AppColors.textSecondaryDark;
    }),
    trackColor: WidgetStateProperty.resolveWith((states) {
      if (states.contains(WidgetState.selected)) {
        return AppColors.primary;
      }
      return AppColors.surfaceDark;
    }),
  ),

  // Progress Indicator
  progressIndicatorTheme: const ProgressIndicatorThemeData(
    color: AppColors.primary,
    linearTrackColor: AppColors.surfaceDark,
    circularTrackColor: AppColors.surfaceDark,
  ),

  // Icon
  iconTheme: const IconThemeData(
    color: AppColors.textPrimaryDark,
  ),
);
