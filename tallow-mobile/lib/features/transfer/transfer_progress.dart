import 'package:flutter/material.dart';

import 'transfer_provider.dart';
import '../../shared/utils/format_utils.dart';
import '../../shared/utils/file_utils.dart';
import '../../shared/widgets/progress_indicator.dart';
import '../../core/storage/transfer_history.dart';
import '../../l10n/app_localizations.dart';

/// Card showing transfer progress
class TransferProgressCard extends StatelessWidget {
  final FileTransfer transfer;
  final VoidCallback? onPause;
  final VoidCallback? onResume;
  final VoidCallback? onCancel;
  final bool isCompact;

  const TransferProgressCard({
    super.key,
    required this.transfer,
    this.onPause,
    this.onResume,
    this.onCancel,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    if (isCompact) {
      return _CompactTransferCard(transfer: transfer);
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                // File icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    FileUtils.getIconForFileName(transfer.fileName),
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: 12),

                // File info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        transfer.fileName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            transfer.direction == TransferDirection.send
                                ? Icons.upload
                                : Icons.download,
                            size: 14,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${FormatUtils.formatFileSize(transfer.bytesTransferred)} / ${FormatUtils.formatFileSize(transfer.fileSize)}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Direction indicator
                _TransferDirectionBadge(
                  direction: transfer.direction,
                  peerName: transfer.peerName,
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Progress bar
            TallowProgressIndicator(
              progress: transfer.progress,
              status: _getProgressStatus(transfer.status),
            ),

            const SizedBox(height: 12),

            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Speed
                _StatChip(
                  icon: Icons.speed,
                  label: '${FormatUtils.formatSpeed(transfer.speed)}/s',
                ),

                // Progress percentage
                _StatChip(
                  icon: Icons.percent,
                  label: '${(transfer.progress * 100).toStringAsFixed(1)}%',
                ),

                // Time remaining
                _StatChip(
                  icon: Icons.timer_outlined,
                  label: FormatUtils.formatDuration(transfer.estimatedTimeRemaining),
                ),
              ],
            ),

            // Action buttons
            if (transfer.status == TransferStatus.transferring ||
                transfer.status == TransferStatus.paused) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (transfer.status == TransferStatus.paused)
                    TextButton.icon(
                      onPressed: onResume,
                      icon: const Icon(Icons.play_arrow),
                      label: Text(l10n?.resume ?? 'Resume'),
                    )
                  else
                    TextButton.icon(
                      onPressed: onPause,
                      icon: const Icon(Icons.pause),
                      label: Text(l10n?.pause ?? 'Pause'),
                    ),
                  const SizedBox(width: 8),
                  TextButton.icon(
                    onPressed: onCancel,
                    icon: const Icon(Icons.close),
                    label: Text(l10n?.cancel ?? 'Cancel'),
                    style: TextButton.styleFrom(
                      foregroundColor: theme.colorScheme.error,
                    ),
                  ),
                ],
              ),
            ],

            // Error message
            if (transfer.status == TransferStatus.failed &&
                transfer.errorMessage != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.errorContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: theme.colorScheme.error,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        transfer.errorMessage!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.error,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  ProgressStatus _getProgressStatus(TransferStatus status) {
    switch (status) {
      case TransferStatus.transferring:
        return ProgressStatus.inProgress;
      case TransferStatus.paused:
        return ProgressStatus.paused;
      case TransferStatus.completed:
        return ProgressStatus.completed;
      case TransferStatus.failed:
        return ProgressStatus.error;
      default:
        return ProgressStatus.pending;
    }
  }
}

class _CompactTransferCard extends StatelessWidget {
  final FileTransfer transfer;

  const _CompactTransferCard({required this.transfer});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _getStatusColor(transfer.status).withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getStatusIcon(transfer.status),
            color: _getStatusColor(transfer.status),
            size: 20,
          ),
        ),
        title: Text(
          transfer.fileName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          '${transfer.peerName} - ${FormatUtils.formatFileSize(transfer.fileSize)}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
        trailing: Icon(
          transfer.direction == TransferDirection.send
              ? Icons.arrow_upward
              : Icons.arrow_downward,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }

  Color _getStatusColor(TransferStatus status) {
    switch (status) {
      case TransferStatus.completed:
        return Colors.green;
      case TransferStatus.failed:
        return Colors.red;
      case TransferStatus.cancelled:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(TransferStatus status) {
    switch (status) {
      case TransferStatus.completed:
        return Icons.check_circle;
      case TransferStatus.failed:
        return Icons.error;
      case TransferStatus.cancelled:
        return Icons.cancel;
      default:
        return Icons.hourglass_empty;
    }
  }
}

class _TransferDirectionBadge extends StatelessWidget {
  final TransferDirection direction;
  final String peerName;

  const _TransferDirectionBadge({
    required this.direction,
    required this.peerName,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isSending = direction == TransferDirection.send;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (isSending ? Colors.blue : Colors.green).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSending ? Icons.arrow_upward : Icons.arrow_downward,
            size: 14,
            color: isSending ? Colors.blue : Colors.green,
          ),
          const SizedBox(width: 4),
          Text(
            peerName,
            style: theme.textTheme.bodySmall?.copyWith(
              color: isSending ? Colors.blue : Colors.green,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _StatChip({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: theme.colorScheme.onSurface.withOpacity(0.6),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
      ],
    );
  }
}
