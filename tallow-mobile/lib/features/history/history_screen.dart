import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'history_provider.dart';
import '../../core/storage/transfer_history.dart';
import '../../shared/utils/format_utils.dart';
import '../../shared/utils/file_utils.dart';
import '../../l10n/app_localizations.dart';

class HistoryScreen extends ConsumerStatefulWidget {
  const HistoryScreen({super.key});

  @override
  ConsumerState<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends ConsumerState<HistoryScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;
  Set<String> _selectedIds = {};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(historyProvider);
    final notifier = ref.read(historyProvider.notifier);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    final displayedTransfers = _searchController.text.isEmpty
        ? state.filteredTransfers
        : notifier.search(_searchController.text);

    return Scaffold(
      appBar: _selectedIds.isNotEmpty
          ? _buildSelectionAppBar(context, notifier, l10n)
          : _buildNormalAppBar(context, state, notifier, l10n),
      body: RefreshIndicator(
        onRefresh: () => notifier.refresh(),
        child: CustomScrollView(
          slivers: [
            // Statistics card
            if (state.statistics != null && !_isSearching)
              SliverToBoxAdapter(
                child: _StatisticsCard(statistics: state.statistics!),
              ),

            // Filter chips
            SliverToBoxAdapter(
              child: _FilterChips(
                currentFilter: state.filter,
                onFilterChanged: notifier.setFilter,
              ),
            ),

            // Transfer list
            if (state.isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (displayedTransfers.isEmpty)
              SliverFillRemaining(
                child: _EmptyHistory(isFiltered: state.filter != HistoryFilter.all),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final transfer = displayedTransfers[index];
                    final isSelected = _selectedIds.contains(transfer.id);

                    return _TransferHistoryItem(
                      transfer: transfer,
                      isSelected: isSelected,
                      selectionMode: _selectedIds.isNotEmpty,
                      onTap: () {
                        if (_selectedIds.isNotEmpty) {
                          _toggleSelection(transfer.id);
                        } else {
                          _showTransferDetails(context, transfer);
                        }
                      },
                      onLongPress: () => _toggleSelection(transfer.id),
                    );
                  },
                  childCount: displayedTransfers.length,
                ),
              ),
          ],
        ),
      ),
    );
  }

  AppBar _buildNormalAppBar(
    BuildContext context,
    HistoryState state,
    HistoryNotifier notifier,
    AppLocalizations? l10n,
  ) {
    if (_isSearching) {
      return AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            setState(() {
              _isSearching = false;
              _searchController.clear();
            });
          },
        ),
        title: TextField(
          controller: _searchController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: l10n?.searchHistory ?? 'Search history...',
            border: InputBorder.none,
          ),
          onChanged: (_) => setState(() {}),
        ),
        actions: [
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _searchController.clear();
                setState(() {});
              },
            ),
        ],
      );
    }

    return AppBar(
      title: Text(l10n?.history ?? 'History'),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: () => setState(() => _isSearching = true),
        ),
        PopupMenuButton<HistorySort>(
          icon: const Icon(Icons.sort),
          onSelected: notifier.setSort,
          itemBuilder: (context) => [
            PopupMenuItem(
              value: HistorySort.dateDesc,
              child: Text(l10n?.newestFirst ?? 'Newest first'),
            ),
            PopupMenuItem(
              value: HistorySort.dateAsc,
              child: Text(l10n?.oldestFirst ?? 'Oldest first'),
            ),
            PopupMenuItem(
              value: HistorySort.sizeDesc,
              child: Text(l10n?.largestFirst ?? 'Largest first'),
            ),
            PopupMenuItem(
              value: HistorySort.sizeAsc,
              child: Text(l10n?.smallestFirst ?? 'Smallest first'),
            ),
            PopupMenuItem(
              value: HistorySort.nameAsc,
              child: Text(l10n?.alphabetical ?? 'Alphabetical'),
            ),
          ],
        ),
        PopupMenuButton<String>(
          onSelected: (value) {
            if (value == 'clear') {
              _showClearConfirmation(context, notifier, l10n);
            }
          },
          itemBuilder: (context) => [
            PopupMenuItem(
              value: 'clear',
              child: Text(l10n?.clearHistory ?? 'Clear history'),
            ),
          ],
        ),
      ],
    );
  }

  AppBar _buildSelectionAppBar(
    BuildContext context,
    HistoryNotifier notifier,
    AppLocalizations? l10n,
  ) {
    return AppBar(
      leading: IconButton(
        icon: const Icon(Icons.close),
        onPressed: () => setState(() => _selectedIds.clear()),
      ),
      title: Text('${_selectedIds.length} ${l10n?.selected ?? 'selected'}'),
      actions: [
        IconButton(
          icon: const Icon(Icons.select_all),
          onPressed: () {
            final state = ref.read(historyProvider);
            setState(() {
              if (_selectedIds.length == state.filteredTransfers.length) {
                _selectedIds.clear();
              } else {
                _selectedIds = state.filteredTransfers.map((t) => t.id).toSet();
              }
            });
          },
        ),
        IconButton(
          icon: const Icon(Icons.delete),
          onPressed: () async {
            await notifier.deleteTransfers(_selectedIds.toList());
            setState(() => _selectedIds.clear());
          },
        ),
      ],
    );
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _showTransferDetails(BuildContext context, TransferRecord transfer) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.8,
        minChildSize: 0.3,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.onSurface.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      FileUtils.getIconForFileName(transfer.fileName),
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          transfer.fileName,
                          style: theme.textTheme.titleLarge,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        _StatusBadge(status: transfer.status),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _DetailRow(
                label: l10n?.fileSize ?? 'File Size',
                value: FormatUtils.formatFileSize(transfer.fileSize),
              ),
              _DetailRow(
                label: l10n?.direction ?? 'Direction',
                value: transfer.direction == TransferDirection.send
                    ? (l10n?.sent ?? 'Sent')
                    : (l10n?.received ?? 'Received'),
              ),
              _DetailRow(
                label: l10n?.peer ?? 'Peer',
                value: transfer.peerName,
              ),
              _DetailRow(
                label: l10n?.date ?? 'Date',
                value: FormatUtils.formatDateTime(transfer.startTime),
              ),
              if (transfer.duration != null)
                _DetailRow(
                  label: l10n?.duration ?? 'Duration',
                  value: FormatUtils.formatDuration(
                    Duration(milliseconds: transfer.duration!),
                  ),
                ),
              if (transfer.averageSpeed != null)
                _DetailRow(
                  label: l10n?.averageSpeed ?? 'Average Speed',
                  value: '${FormatUtils.formatSpeed(transfer.averageSpeed!)}/s',
                ),
              if (transfer.isEncrypted)
                _DetailRow(
                  label: l10n?.encryption ?? 'Encryption',
                  value: transfer.encryptionType ?? 'AES-256-GCM',
                ),
              if (transfer.errorMessage != null)
                _DetailRow(
                  label: l10n?.error ?? 'Error',
                  value: transfer.errorMessage!,
                  valueColor: theme.colorScheme.error,
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showClearConfirmation(
    BuildContext context,
    HistoryNotifier notifier,
    AppLocalizations? l10n,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.clearHistory ?? 'Clear History'),
        content: Text(l10n?.clearHistoryConfirmation ??
            'Are you sure you want to clear all transfer history?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n?.cancel ?? 'Cancel'),
          ),
          TextButton(
            onPressed: () {
              notifier.clearHistory();
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: Text(l10n?.clear ?? 'Clear'),
          ),
        ],
      ),
    );
  }
}

class _StatisticsCard extends StatelessWidget {
  final TransferStatistics statistics;

  const _StatisticsCard({required this.statistics});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n?.statistics ?? 'Statistics',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _StatItem(
                  icon: Icons.upload,
                  label: l10n?.sent ?? 'Sent',
                  value: '${statistics.totalSent}',
                  subValue: FormatUtils.formatFileSize(statistics.bytesSent),
                ),
                _StatItem(
                  icon: Icons.download,
                  label: l10n?.received ?? 'Received',
                  value: '${statistics.totalReceived}',
                  subValue: FormatUtils.formatFileSize(statistics.bytesReceived),
                ),
                _StatItem(
                  icon: Icons.speed,
                  label: l10n?.avgSpeed ?? 'Avg Speed',
                  value: '${FormatUtils.formatSpeed(statistics.averageSpeed)}/s',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? subValue;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    this.subValue,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (subValue != null)
            Text(
              subValue!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          Text(
            label,
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  final HistoryFilter currentFilter;
  final ValueChanged<HistoryFilter> onFilterChanged;

  const _FilterChips({
    required this.currentFilter,
    required this.onFilterChanged,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: HistoryFilter.values.map((filter) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(_getFilterLabel(filter, l10n)),
              selected: currentFilter == filter,
              onSelected: (_) => onFilterChanged(filter),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _getFilterLabel(HistoryFilter filter, AppLocalizations? l10n) {
    switch (filter) {
      case HistoryFilter.all:
        return l10n?.all ?? 'All';
      case HistoryFilter.sent:
        return l10n?.sent ?? 'Sent';
      case HistoryFilter.received:
        return l10n?.received ?? 'Received';
      case HistoryFilter.completed:
        return l10n?.completed ?? 'Completed';
      case HistoryFilter.failed:
        return l10n?.failed ?? 'Failed';
    }
  }
}

class _TransferHistoryItem extends StatelessWidget {
  final TransferRecord transfer;
  final bool isSelected;
  final bool selectionMode;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _TransferHistoryItem({
    required this.transfer,
    required this.isSelected,
    required this.selectionMode,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      leading: selectionMode
          ? Checkbox(
              value: isSelected,
              onChanged: (_) => onTap(),
            )
          : Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                FileUtils.getIconForFileName(transfer.fileName),
                color: theme.colorScheme.onPrimaryContainer,
              ),
            ),
      title: Text(
        transfer.fileName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Row(
        children: [
          Icon(
            transfer.direction == TransferDirection.send
                ? Icons.arrow_upward
                : Icons.arrow_downward,
            size: 14,
          ),
          const SizedBox(width: 4),
          Text(transfer.peerName),
          const SizedBox(width: 8),
          Text(
            FormatUtils.formatFileSize(transfer.fileSize),
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _StatusBadge(status: transfer.status, small: true),
          const SizedBox(height: 4),
          Text(
            FormatUtils.formatRelativeDate(transfer.startTime),
            style: theme.textTheme.labelSmall,
          ),
        ],
      ),
      onTap: onTap,
      onLongPress: onLongPress,
      selected: isSelected,
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final TransferStatus status;
  final bool small;

  const _StatusBadge({
    required this.status,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;

    switch (status) {
      case TransferStatus.completed:
        color = Colors.green;
        icon = Icons.check_circle;
        break;
      case TransferStatus.failed:
        color = Colors.red;
        icon = Icons.error;
        break;
      case TransferStatus.cancelled:
        color = Colors.orange;
        icon = Icons.cancel;
        break;
      default:
        color = Colors.grey;
        icon = Icons.hourglass_empty;
    }

    if (small) {
      return Icon(icon, size: 16, color: color);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            status.name.capitalize(),
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  final bool isFiltered;

  const _EmptyHistory({required this.isFiltered});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 64,
            color: theme.colorScheme.onSurface.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            isFiltered
                ? (l10n?.noMatchingTransfers ?? 'No matching transfers')
                : (l10n?.noTransferHistory ?? 'No transfer history'),
            style: theme.textTheme.titleMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }
}

extension StringCapitalize on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}
