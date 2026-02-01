import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/storage/transfer_history.dart';

/// History state
class HistoryState {
  final List<TransferRecord> transfers;
  final TransferStatistics? statistics;
  final bool isLoading;
  final String? errorMessage;
  final HistoryFilter filter;
  final HistorySort sort;

  const HistoryState({
    this.transfers = const [],
    this.statistics,
    this.isLoading = false,
    this.errorMessage,
    this.filter = HistoryFilter.all,
    this.sort = HistorySort.dateDesc,
  });

  HistoryState copyWith({
    List<TransferRecord>? transfers,
    TransferStatistics? statistics,
    bool? isLoading,
    String? errorMessage,
    HistoryFilter? filter,
    HistorySort? sort,
  }) {
    return HistoryState(
      transfers: transfers ?? this.transfers,
      statistics: statistics ?? this.statistics,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      filter: filter ?? this.filter,
      sort: sort ?? this.sort,
    );
  }

  List<TransferRecord> get filteredTransfers {
    var result = List<TransferRecord>.from(transfers);

    // Apply filter
    switch (filter) {
      case HistoryFilter.sent:
        result = result.where((t) => t.direction == TransferDirection.send).toList();
        break;
      case HistoryFilter.received:
        result = result.where((t) => t.direction == TransferDirection.receive).toList();
        break;
      case HistoryFilter.completed:
        result = result.where((t) => t.status == TransferStatus.completed).toList();
        break;
      case HistoryFilter.failed:
        result = result.where((t) => t.status == TransferStatus.failed).toList();
        break;
      case HistoryFilter.all:
      default:
        break;
    }

    // Apply sort
    switch (sort) {
      case HistorySort.dateDesc:
        result.sort((a, b) => b.startTime.compareTo(a.startTime));
        break;
      case HistorySort.dateAsc:
        result.sort((a, b) => a.startTime.compareTo(b.startTime));
        break;
      case HistorySort.sizeDesc:
        result.sort((a, b) => b.fileSize.compareTo(a.fileSize));
        break;
      case HistorySort.sizeAsc:
        result.sort((a, b) => a.fileSize.compareTo(b.fileSize));
        break;
      case HistorySort.nameAsc:
        result.sort((a, b) => a.fileName.compareTo(b.fileName));
        break;
    }

    return result;
  }
}

/// History filter options
enum HistoryFilter {
  all,
  sent,
  received,
  completed,
  failed,
}

/// History sort options
enum HistorySort {
  dateDesc,
  dateAsc,
  sizeDesc,
  sizeAsc,
  nameAsc,
}

/// History notifier
class HistoryNotifier extends StateNotifier<HistoryState> {
  final _historyService = TransferHistoryService();

  HistoryNotifier() : super(const HistoryState()) {
    _initialize();
  }

  Future<void> _initialize() async {
    await _historyService.initialize();
    await refresh();
  }

  /// Refresh history list
  Future<void> refresh() async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final transfers = await _historyService.getAllTransfers();
      final statistics = await _historyService.getStatistics();

      state = state.copyWith(
        transfers: transfers,
        statistics: statistics,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  /// Load more transfers (pagination)
  Future<void> loadMore() async {
    if (state.isLoading) return;

    try {
      final moreTransfers = await _historyService.getAllTransfers(
        offset: state.transfers.length,
        limit: 20,
      );

      state = state.copyWith(
        transfers: [...state.transfers, ...moreTransfers],
      );
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  /// Set filter
  void setFilter(HistoryFilter filter) {
    state = state.copyWith(filter: filter);
  }

  /// Set sort
  void setSort(HistorySort sort) {
    state = state.copyWith(sort: sort);
  }

  /// Delete a transfer record
  Future<void> deleteTransfer(String id) async {
    try {
      await _historyService.deleteTransfer(id);
      state = state.copyWith(
        transfers: state.transfers.where((t) => t.id != id).toList(),
      );
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  /// Delete multiple transfer records
  Future<void> deleteTransfers(List<String> ids) async {
    try {
      await _historyService.deleteTransfers(ids);
      state = state.copyWith(
        transfers: state.transfers.where((t) => !ids.contains(t.id)).toList(),
      );
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  /// Clear all history
  Future<void> clearHistory() async {
    try {
      await _historyService.clearHistory();
      state = state.copyWith(transfers: []);
      await refresh();
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
    }
  }

  /// Search transfers
  List<TransferRecord> search(String query) {
    if (query.isEmpty) return state.filteredTransfers;

    final lowerQuery = query.toLowerCase();
    return state.filteredTransfers.where((t) {
      return t.fileName.toLowerCase().contains(lowerQuery) ||
          t.peerName.toLowerCase().contains(lowerQuery);
    }).toList();
  }

  /// Get transfers by peer
  List<TransferRecord> getByPeer(String peerId) {
    return state.transfers.where((t) => t.peerId == peerId).toList();
  }

  /// Get transfers by date range
  Future<List<TransferRecord>> getByDateRange(
    DateTime start,
    DateTime end,
  ) async {
    return await _historyService.getAllTransfers(
      startDate: start,
      endDate: end,
    );
  }
}

/// Provider for history
final historyProvider = StateNotifierProvider<HistoryNotifier, HistoryState>(
  (ref) => HistoryNotifier(),
);
