import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'transfer_provider.dart';
import 'file_picker_widget.dart';
import 'transfer_progress.dart';
import '../../shared/widgets/tallow_button.dart';
import '../../l10n/app_localizations.dart';

class TransferScreen extends ConsumerWidget {
  const TransferScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(transferProvider);
    final notifier = ref.read(transferProvider.notifier);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.transfer ?? 'Transfer'),
        actions: [
          if (state.connectionStatus == ConnectionStatus.connected)
            IconButton(
              icon: const Icon(Icons.link_off),
              onPressed: () => notifier.disconnect(),
              tooltip: l10n?.disconnect ?? 'Disconnect',
            ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Connection status banner
            _ConnectionStatusBanner(state: state),

            // Main content
            Expanded(
              child: state.connectionStatus == ConnectionStatus.connected
                  ? _ConnectedView(state: state, notifier: notifier)
                  : _DisconnectedView(),
            ),
          ],
        ),
      ),
      floatingActionButton: state.connectionStatus == ConnectionStatus.connected
          ? FloatingActionButton.extended(
              onPressed: () => notifier.pickAndSendFiles(),
              icon: const Icon(Icons.add),
              label: Text(l10n?.selectFiles ?? 'Select Files'),
            )
          : null,
    );
  }
}

class _ConnectionStatusBanner extends StatelessWidget {
  final TransferState state;

  const _ConnectionStatusBanner({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    Color backgroundColor;
    IconData icon;
    String message;

    switch (state.connectionStatus) {
      case ConnectionStatus.connected:
        backgroundColor = Colors.green;
        icon = Icons.link;
        message = '${l10n?.connectedTo ?? 'Connected to'} ${state.currentPeerName}';
        break;
      case ConnectionStatus.connecting:
        backgroundColor = Colors.orange;
        icon = Icons.sync;
        message = l10n?.connecting ?? 'Connecting...';
        break;
      case ConnectionStatus.error:
        backgroundColor = Colors.red;
        icon = Icons.error_outline;
        message = state.errorMessage ?? (l10n?.connectionError ?? 'Connection error');
        break;
      case ConnectionStatus.disconnected:
      default:
        return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: backgroundColor.withOpacity(0.1),
      child: Row(
        children: [
          Icon(icon, color: backgroundColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: backgroundColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (state.connectionStatus == ConnectionStatus.connecting)
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(backgroundColor),
              ),
            ),
        ],
      ),
    );
  }
}

class _DisconnectedView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.swap_horiz,
              size: 80,
              color: theme.colorScheme.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              l10n?.noConnection ?? 'No Connection',
              style: theme.textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              l10n?.selectDeviceToTransfer ?? 'Select a device from the Discovery tab to start transferring files',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ConnectedView extends StatelessWidget {
  final TransferState state;
  final TransferNotifier notifier;

  const _ConnectedView({
    required this.state,
    required this.notifier,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    if (state.activeTransfers.isEmpty &&
        state.pendingTransfers.isEmpty &&
        state.completedTransfers.isEmpty) {
      return _EmptyTransferView();
    }

    return CustomScrollView(
      slivers: [
        // Active transfers
        if (state.activeTransfers.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                l10n?.activeTransfers ?? 'Active Transfers',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final transfer = state.activeTransfers[index];
                return TransferProgressCard(
                  transfer: transfer,
                  onPause: () => notifier.pauseTransfer(transfer.id),
                  onResume: () => notifier.resumeTransfer(transfer.id),
                  onCancel: () => notifier.cancelTransfer(transfer.id),
                );
              },
              childCount: state.activeTransfers.length,
            ),
          ),
        ],

        // Pending transfers
        if (state.pendingTransfers.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                l10n?.pendingTransfers ?? 'Pending Transfers',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final transfer = state.pendingTransfers[index];
                return TransferProgressCard(
                  transfer: transfer,
                  onCancel: () => notifier.cancelTransfer(transfer.id),
                );
              },
              childCount: state.pendingTransfers.length,
            ),
          ),
        ],

        // Completed transfers
        if (state.completedTransfers.isNotEmpty) ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                l10n?.completedTransfers ?? 'Completed Transfers',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final transfer = state.completedTransfers[index];
                return TransferProgressCard(
                  transfer: transfer,
                  isCompact: true,
                );
              },
              childCount: state.completedTransfers.length,
            ),
          ),
        ],

        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 80),
        ),
      ],
    );
  }
}

class _EmptyTransferView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.folder_open,
              size: 80,
              color: theme.colorScheme.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              l10n?.noTransfers ?? 'No Transfers',
              style: theme.textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              l10n?.tapToSelectFiles ?? 'Tap the + button to select files to send',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
