import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/discovery/discovery_screen.dart';
import 'features/transfer/transfer_screen.dart';
import 'features/chat/chat_screen.dart';
import 'features/history/history_screen.dart';
import 'features/settings/settings_screen.dart';
import 'features/settings/settings_provider.dart';
import 'shared/theme/app_theme.dart';
import 'shared/theme/dark_theme.dart';
import 'shared/theme/light_theme.dart';
import 'l10n/app_localizations.dart';

class TallowApp extends ConsumerWidget {
  const TallowApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final themeMode = settings.themeMode;
    final themeName = settings.themeName;
    final locale = settings.locale;

    return MaterialApp(
      title: 'Tallow',
      debugShowCheckedModeBanner: false,
      themeMode: themeMode,
      theme: AppTheme.getTheme(themeName, Brightness.light),
      darkTheme: AppTheme.getTheme(themeName, Brightness.dark),
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends ConsumerStatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  ConsumerState<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DiscoveryScreen(),
    TransferScreen(),
    ChatScreen(),
    HistoryScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isRtl = Directionality.of(context) == TextDirection.rtl;

    return Directionality(
      textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: IndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() => _currentIndex = index);
          },
          destinations: [
            NavigationDestination(
              icon: const Icon(Icons.devices_outlined),
              selectedIcon: const Icon(Icons.devices),
              label: l10n?.discover ?? 'Discover',
            ),
            NavigationDestination(
              icon: const Icon(Icons.swap_horiz_outlined),
              selectedIcon: const Icon(Icons.swap_horiz),
              label: l10n?.transfer ?? 'Transfer',
            ),
            NavigationDestination(
              icon: const Icon(Icons.chat_outlined),
              selectedIcon: const Icon(Icons.chat),
              label: l10n?.chat ?? 'Chat',
            ),
            NavigationDestination(
              icon: const Icon(Icons.history_outlined),
              selectedIcon: const Icon(Icons.history),
              label: l10n?.history ?? 'History',
            ),
            NavigationDestination(
              icon: const Icon(Icons.settings_outlined),
              selectedIcon: const Icon(Icons.settings),
              label: l10n?.settings ?? 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}
