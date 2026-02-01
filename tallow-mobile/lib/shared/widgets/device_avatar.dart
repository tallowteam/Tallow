import 'package:flutter/material.dart';

import '../../core/network/mdns_discovery.dart';

/// Avatar widget for displaying device icons
class DeviceAvatar extends StatelessWidget {
  final DeviceType deviceType;
  final double size;
  final bool isOnline;
  final bool showBadge;
  final Color? backgroundColor;
  final Color? iconColor;

  const DeviceAvatar({
    super.key,
    required this.deviceType,
    this.size = 48,
    this.isOnline = false,
    this.showBadge = true,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bgColor = backgroundColor ?? theme.colorScheme.primaryContainer;
    final fgColor = iconColor ?? theme.colorScheme.onPrimaryContainer;

    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(size * 0.25),
          ),
          child: Icon(
            _getIconForDeviceType(deviceType),
            size: size * 0.5,
            color: fgColor,
          ),
        ),
        if (showBadge)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: size * 0.3,
              height: size * 0.3,
              decoration: BoxDecoration(
                color: isOnline ? Colors.green : Colors.grey,
                shape: BoxShape.circle,
                border: Border.all(
                  color: theme.colorScheme.surface,
                  width: 2,
                ),
              ),
            ),
          ),
      ],
    );
  }

  IconData _getIconForDeviceType(DeviceType type) {
    switch (type) {
      case DeviceType.phone:
        return Icons.smartphone;
      case DeviceType.tablet:
        return Icons.tablet_android;
      case DeviceType.laptop:
        return Icons.laptop;
      case DeviceType.desktop:
        return Icons.desktop_windows;
      case DeviceType.tv:
        return Icons.tv;
      case DeviceType.unknown:
      default:
        return Icons.devices;
    }
  }
}

/// Large avatar with device name
class DeviceAvatarLarge extends StatelessWidget {
  final DeviceType deviceType;
  final String deviceName;
  final bool isOnline;
  final bool isVerified;
  final VoidCallback? onTap;

  const DeviceAvatarLarge({
    super.key,
    required this.deviceType,
    required this.deviceName,
    this.isOnline = false,
    this.isVerified = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DeviceAvatar(
              deviceType: deviceType,
              size: 64,
              isOnline: isOnline,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  deviceName,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (isVerified) ...[
                  const SizedBox(width: 4),
                  Icon(
                    Icons.verified,
                    size: 16,
                    color: Colors.green,
                  ),
                ],
              ],
            ),
            Text(
              isOnline ? 'Online' : 'Offline',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isOnline ? Colors.green : theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal list of device avatars
class DeviceAvatarList extends StatelessWidget {
  final List<DeviceListItem> devices;
  final void Function(DeviceListItem)? onDeviceTap;

  const DeviceAvatarList({
    super.key,
    required this.devices,
    this.onDeviceTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        itemCount: devices.length,
        itemBuilder: (context, index) {
          final device = devices[index];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: DeviceAvatarLarge(
              deviceType: device.type,
              deviceName: device.name,
              isOnline: device.isOnline,
              isVerified: device.isVerified,
              onTap: onDeviceTap != null ? () => onDeviceTap!(device) : null,
            ),
          );
        },
      ),
    );
  }
}

/// Device list item data
class DeviceListItem {
  final String id;
  final String name;
  final DeviceType type;
  final bool isOnline;
  final bool isVerified;

  DeviceListItem({
    required this.id,
    required this.name,
    this.type = DeviceType.unknown,
    this.isOnline = false,
    this.isVerified = false,
  });
}

/// Animated device avatar for connection
class AnimatedDeviceAvatar extends StatefulWidget {
  final DeviceType deviceType;
  final double size;
  final bool isConnecting;

  const AnimatedDeviceAvatar({
    super.key,
    required this.deviceType,
    this.size = 64,
    this.isConnecting = false,
  });

  @override
  State<AnimatedDeviceAvatar> createState() => _AnimatedDeviceAvatarState();
}

class _AnimatedDeviceAvatarState extends State<AnimatedDeviceAvatar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    _opacityAnimation = Tween<double>(begin: 0.5, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    if (widget.isConnecting) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(AnimatedDeviceAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isConnecting && !oldWidget.isConnecting) {
      _controller.repeat();
    } else if (!widget.isConnecting && oldWidget.isConnecting) {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: widget.size * 1.5,
      height: widget.size * 1.5,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (widget.isConnecting)
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Container(
                  width: widget.size * _scaleAnimation.value,
                  height: widget.size * _scaleAnimation.value,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: theme.colorScheme.primary.withOpacity(_opacityAnimation.value),
                  ),
                );
              },
            ),
          DeviceAvatar(
            deviceType: widget.deviceType,
            size: widget.size,
            showBadge: false,
          ),
        ],
      ),
    );
  }
}
