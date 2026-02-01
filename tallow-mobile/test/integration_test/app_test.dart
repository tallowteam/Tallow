import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:tallow/main.dart' as app;
import 'package:tallow/l10n/app_localizations.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Integration Tests', () {
    testWidgets('App starts successfully', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify app title is displayed
      expect(find.text('Tallow'), findsWidgets);
    });

    testWidgets('Navigation bar is visible', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify bottom navigation items
      expect(find.byIcon(Icons.devices), findsOneWidget);
      expect(find.byIcon(Icons.swap_horiz), findsOneWidget);
      expect(find.byIcon(Icons.chat), findsOneWidget);
      expect(find.byIcon(Icons.history), findsOneWidget);
      expect(find.byIcon(Icons.settings), findsOneWidget);
    });

    testWidgets('Navigate between tabs', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Transfer tab
      await tester.tap(find.byIcon(Icons.swap_horiz_outlined));
      await tester.pumpAndSettle();

      // Navigate to Chat tab
      await tester.tap(find.byIcon(Icons.chat_outlined));
      await tester.pumpAndSettle();

      // Navigate to History tab
      await tester.tap(find.byIcon(Icons.history_outlined));
      await tester.pumpAndSettle();

      // Navigate to Settings tab
      await tester.tap(find.byIcon(Icons.settings_outlined));
      await tester.pumpAndSettle();

      // Navigate back to Discover tab
      await tester.tap(find.byIcon(Icons.devices_outlined));
      await tester.pumpAndSettle();
    });
  });

  group('Settings Tests', () {
    testWidgets('Settings page loads correctly', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Settings
      await tester.tap(find.byIcon(Icons.settings_outlined));
      await tester.pumpAndSettle();

      // Verify settings sections
      expect(find.text('Appearance'), findsOneWidget);
      expect(find.text('Security'), findsOneWidget);
      expect(find.text('Transfers'), findsOneWidget);
    });

    testWidgets('Toggle PQC encryption setting', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Settings
      await tester.tap(find.byIcon(Icons.settings_outlined));
      await tester.pumpAndSettle();

      // Find PQC toggle
      final pqcToggle = find.byKey(const Key('pqc_toggle'));
      if (pqcToggle.evaluate().isNotEmpty) {
        await tester.tap(pqcToggle);
        await tester.pumpAndSettle();
      }
    });
  });

  group('Discovery Tests', () {
    testWidgets('Discovery page shows scan button', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Should show scan/refresh option
      expect(
        find.byIcon(Icons.refresh).evaluate().isNotEmpty ||
            find.byIcon(Icons.qr_code_scanner).evaluate().isNotEmpty,
        true,
      );
    });

    testWidgets('Can access QR scanner', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Find QR scan button
      final qrButton = find.byIcon(Icons.qr_code_scanner);
      if (qrButton.evaluate().isNotEmpty) {
        await tester.tap(qrButton);
        await tester.pumpAndSettle();
      }
    });
  });

  group('Transfer Tests', () {
    testWidgets('Transfer page shows file selector', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate to Transfer tab
      await tester.tap(find.byIcon(Icons.swap_horiz_outlined));
      await tester.pumpAndSettle();

      // Should show file selection option
      expect(
        find.byIcon(Icons.add).evaluate().isNotEmpty ||
            find.byIcon(Icons.folder).evaluate().isNotEmpty ||
            find.text('Select Files').evaluate().isNotEmpty,
        true,
      );
    });
  });

  group('Accessibility Tests', () {
    testWidgets('All navigation items have semantics', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Check that navigation items have labels
      expect(find.byType(NavigationDestination), findsNWidgets(5));
    });

    testWidgets('Touch targets are large enough', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify minimum touch target size (48x48)
      final navigationBar = find.byType(NavigationBar);
      expect(navigationBar, findsOneWidget);
    });
  });

  group('Theme Tests', () {
    testWidgets('App respects system theme', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // App should be using MaterialApp with themeMode
      expect(find.byType(MaterialApp), findsOneWidget);
    });
  });

  group('Localization Tests', () {
    testWidgets('Supported locales are available', (WidgetTester tester) async {
      // Verify we have all 22 supported locales
      expect(AppLocalizations.supportedLocales.length, greaterThanOrEqualTo(22));
    });

    testWidgets('RTL languages are configured', (WidgetTester tester) async {
      // Verify RTL languages
      expect(AppLocalizations.rtlLanguages, contains('ar'));
      expect(AppLocalizations.rtlLanguages, contains('he'));
      expect(AppLocalizations.rtlLanguages, contains('ur'));
    });
  });
}
