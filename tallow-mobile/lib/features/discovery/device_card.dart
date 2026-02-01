import 'package:flutter/material.dart';

import '../../core/network/mdns_discovery.dart';
import '../../shared/widgets/device_avatar.dart';
import '../../l10n/app_localizations.dart';

/// Card displaying a discovered device
class DeviceCard extends StatelessWidget {
  final DiscoveredDevice device;
  final VoidCallback onTap;
  final bool isOnline;
  final bool isTrusted;
  final bool isSelected;

  const DeviceCard({
    super.key,
    required this.device,
    required this.onTap,
    this.isOnline = false,
    this.isTrusted = false,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isSelected
            ? BorderSide(color: theme.colorScheme.primary, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Device avatar
              DeviceAvatar(
                deviceType: device.type,
                size: 48,
                isOnline: isOnline,
              ),
              const SizedBox(width: 16),

              // Device info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            device.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isTrusted)
                          Tooltip(
                            message: l10n?.trustedDevice ?? 'Trusted Device',
                            child: Icon(
                              Icons.verified,
                              size: 18,
                              color: Colors.green,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        // Connection type indicator
                        _ConnectionBadge(isOnline: isOnline),
                        const SizedBox(width: 8),
                        // IP address (for local)
                        if (!isOnline && device.address.isNotEmpty)
                          Text(
                            device.address,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        // Last seen
                        if (isOnline)
                          Text(
                            _getLastSeenText(device.lastSeen, l10n),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),

              // Connect button
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.onSurface.withOpacity(0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getLastSeenText(DateTime lastSeen, AppLocalizations? l10n) {
    final diff = DateTime.now().difference(lastSeen);
    if (diff.inSeconds < 60) {
      return l10n?.justNow ?? 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ${l10n?.ago ?? 'ago'}';
    } else {
      return '${diff.inHours}h ${l10n?.ago ?? 'ago'}';
    }
  }
}

class _ConnectionBadge extends StatelessWidget {
  final bool isOnline;

  const _ConnectionBadge({required this.isOnline});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: (isOnline ? Colors.blue : Colors.green).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isOnline ? Icons.cloud : Icons.wifi,
            size: 12,
            color: isOnline ? Colors.blue : Colors.green,
          ),
          const SizedBox(width: 4),
          Text(
            isOnline
                ? (l10n?.online ?? 'Online')
                : (l10n?.local ?? 'Local'),
            style: theme.textTheme.labelSmall?.copyWith(
              color: isOnline ? Colors.blue : Colors.green,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

/// Large device card for connection confirmation
class DeviceCardLarge extends StatelessWidget {
  final DiscoveredDevice device;
  final bool isOnline;
  final bool isTrusted;

  const DeviceCardLarge({
    super.key,
    required this.device,
    this.isOnline = false,
    this.isTrusted = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DeviceAvatar(
              deviceType: device.type,
              size: 80,
              isOnline: isOnline,
            ),
            const SizedBox(height: 16),
            Text(
              device.name,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            _ConnectionBadge(isOnline: isOnline),
            if (isTrusted) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.verified, color: Colors.green, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    l10n?.trustedDevice ?? 'Trusted Device',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ],
            if (!isOnline && device.address.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '${device.address}:${device.port}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading placeholder for device cards
class DeviceCardSkeleton extends StatelessWidget {
  const DeviceCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Avatar placeholder
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            const SizedBox(width: 16),
            // Text placeholders
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 120,
                    height: 16,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: 80,
                    height: 12,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
