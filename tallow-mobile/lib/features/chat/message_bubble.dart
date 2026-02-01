import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'chat_provider.dart';
import '../../shared/utils/format_utils.dart';
import '../../l10n/app_localizations.dart';

/// Message bubble widget
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwn;
  final VoidCallback? onReply;
  final VoidCallback? onDelete;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isOwn,
    this.onReply,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Align(
      alignment: isOwn ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: () => _showContextMenu(context),
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          margin: const EdgeInsets.only(bottom: 8),
          child: _buildBubble(context, theme),
        ),
      ),
    );
  }

  Widget _buildBubble(BuildContext context, ThemeData theme) {
    switch (message.type) {
      case MessageType.text:
        return _TextBubble(
          message: message,
          isOwn: isOwn,
        );
      case MessageType.image:
        return _ImageBubble(
          message: message,
          isOwn: isOwn,
        );
      case MessageType.file:
        return _FileBubble(
          message: message,
          isOwn: isOwn,
        );
      case MessageType.system:
        return _SystemMessage(message: message);
    }
  }

  void _showContextMenu(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.reply),
              title: Text(l10n?.reply ?? 'Reply'),
              onTap: () {
                Navigator.pop(context);
                onReply?.call();
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy),
              title: Text(l10n?.copy ?? 'Copy'),
              onTap: () {
                Clipboard.setData(ClipboardData(text: message.content));
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n?.copiedToClipboard ?? 'Copied')),
                );
              },
            ),
            if (isOwn)
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: Text(l10n?.delete ?? 'Delete'),
                onTap: () {
                  Navigator.pop(context);
                  onDelete?.call();
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _TextBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwn;

  const _TextBubble({
    required this.message,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isOwn
            ? theme.colorScheme.primary
            : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: isOwn ? const Radius.circular(16) : const Radius.circular(4),
          bottomRight: isOwn ? const Radius.circular(4) : const Radius.circular(16),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            message.content,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isOwn
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                FormatUtils.formatTime(message.timestamp),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: (isOwn
                          ? theme.colorScheme.onPrimary
                          : theme.colorScheme.onSurface)
                      .withOpacity(0.6),
                ),
              ),
              if (isOwn) ...[
                const SizedBox(width: 4),
                _StatusIcon(status: message.status),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _ImageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwn;

  const _ImageBubble({
    required this.message,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Container(
        color: theme.colorScheme.surfaceContainerHighest,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Image placeholder
            Container(
              width: 200,
              height: 200,
              color: theme.colorScheme.surfaceContainerHighest,
              child: Center(
                child: Icon(
                  Icons.image,
                  size: 48,
                  color: theme.colorScheme.onSurface.withOpacity(0.3),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    FormatUtils.formatTime(message.timestamp),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                  if (isOwn) ...[
                    const SizedBox(width: 4),
                    _StatusIcon(status: message.status),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FileBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOwn;

  const _FileBubble({
    required this.message,
    required this.isOwn,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final metadata = message.metadata;
    final fileName = metadata?['fileName'] as String? ?? message.content;
    final fileSize = metadata?['fileSize'] as int? ?? 0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isOwn
            ? theme.colorScheme.primary
            : theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: (isOwn
                      ? theme.colorScheme.onPrimary
                      : theme.colorScheme.primary)
                  .withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.insert_drive_file,
              color: isOwn
                  ? theme.colorScheme.onPrimary
                  : theme.colorScheme.primary,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fileName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isOwn
                        ? theme.colorScheme.onPrimary
                        : theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      FormatUtils.formatFileSize(fileSize),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: (isOwn
                                ? theme.colorScheme.onPrimary
                                : theme.colorScheme.onSurface)
                            .withOpacity(0.6),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      FormatUtils.formatTime(message.timestamp),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: (isOwn
                                ? theme.colorScheme.onPrimary
                                : theme.colorScheme.onSurface)
                            .withOpacity(0.6),
                      ),
                    ),
                    if (isOwn) ...[
                      const SizedBox(width: 4),
                      _StatusIcon(status: message.status),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SystemMessage extends StatelessWidget {
  final ChatMessage message;

  const _SystemMessage({required this.message});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          message.content,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
      ),
    );
  }
}

class _StatusIcon extends StatelessWidget {
  final MessageStatus status;

  const _StatusIcon({required this.status});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;

    switch (status) {
      case MessageStatus.sending:
        icon = Icons.access_time;
        color = Colors.white.withOpacity(0.6);
        break;
      case MessageStatus.sent:
        icon = Icons.check;
        color = Colors.white.withOpacity(0.6);
        break;
      case MessageStatus.delivered:
        icon = Icons.done_all;
        color = Colors.white.withOpacity(0.6);
        break;
      case MessageStatus.read:
        icon = Icons.done_all;
        color = Colors.lightBlue;
        break;
      case MessageStatus.failed:
        icon = Icons.error_outline;
        color = Colors.red;
        break;
    }

    return Icon(icon, size: 14, color: color);
  }
}
