import 'package:flutter/material.dart';

/// Button variant
enum TallowButtonVariant {
  filled,
  outlined,
  text,
  tonal,
}

/// Button size
enum TallowButtonSize {
  small,
  medium,
  large,
}

/// Custom button widget for Tallow app
class TallowButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool iconAfter;
  final TallowButtonVariant variant;
  final TallowButtonSize size;
  final bool isLoading;
  final bool isExpanded;
  final Color? color;

  const TallowButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.iconAfter = false,
    this.variant = TallowButtonVariant.filled,
    this.size = TallowButtonSize.medium,
    this.isLoading = false,
    this.isExpanded = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final padding = _getPadding();
    final textStyle = _getTextStyle(theme);
    final iconSize = _getIconSize();

    Widget child = Row(
      mainAxisSize: isExpanded ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(_getLoadingColor(theme)),
            ),
          ),
          const SizedBox(width: 8),
        ] else if (icon != null && !iconAfter) ...[
          Icon(icon, size: iconSize),
          const SizedBox(width: 8),
        ],
        Text(label, style: textStyle),
        if (icon != null && iconAfter && !isLoading) ...[
          const SizedBox(width: 8),
          Icon(icon, size: iconSize),
        ],
      ],
    );

    switch (variant) {
      case TallowButtonVariant.filled:
        return FilledButton(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            padding: padding,
            backgroundColor: color,
          ),
          child: child,
        );

      case TallowButtonVariant.outlined:
        return OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            padding: padding,
            foregroundColor: color,
          ),
          child: child,
        );

      case TallowButtonVariant.text:
        return TextButton(
          onPressed: isLoading ? null : onPressed,
          style: TextButton.styleFrom(
            padding: padding,
            foregroundColor: color,
          ),
          child: child,
        );

      case TallowButtonVariant.tonal:
        return FilledButton.tonal(
          onPressed: isLoading ? null : onPressed,
          style: FilledButton.styleFrom(
            padding: padding,
          ),
          child: child,
        );
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case TallowButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 8);
      case TallowButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case TallowButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 16);
    }
  }

  TextStyle? _getTextStyle(ThemeData theme) {
    switch (size) {
      case TallowButtonSize.small:
        return theme.textTheme.labelSmall;
      case TallowButtonSize.medium:
        return theme.textTheme.labelLarge;
      case TallowButtonSize.large:
        return theme.textTheme.titleMedium;
    }
  }

  double _getIconSize() {
    switch (size) {
      case TallowButtonSize.small:
        return 16;
      case TallowButtonSize.medium:
        return 20;
      case TallowButtonSize.large:
        return 24;
    }
  }

  Color _getLoadingColor(ThemeData theme) {
    switch (variant) {
      case TallowButtonVariant.filled:
        return theme.colorScheme.onPrimary;
      case TallowButtonVariant.outlined:
      case TallowButtonVariant.text:
        return color ?? theme.colorScheme.primary;
      case TallowButtonVariant.tonal:
        return theme.colorScheme.onSecondaryContainer;
    }
  }
}

/// Icon-only button
class TallowIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final TallowButtonVariant variant;
  final TallowButtonSize size;
  final String? tooltip;
  final Color? color;
  final bool isLoading;

  const TallowIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.variant = TallowButtonVariant.text,
    this.size = TallowButtonSize.medium,
    this.tooltip,
    this.color,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final iconSize = _getIconSize();
    final buttonSize = _getButtonSize();

    Widget iconWidget = isLoading
        ? SizedBox(
            width: iconSize,
            height: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(
                color ?? theme.colorScheme.primary,
              ),
            ),
          )
        : Icon(icon, size: iconSize);

    Widget button;

    switch (variant) {
      case TallowButtonVariant.filled:
        button = IconButton.filled(
          onPressed: isLoading ? null : onPressed,
          icon: iconWidget,
          iconSize: iconSize,
          style: IconButton.styleFrom(
            backgroundColor: color,
            minimumSize: Size(buttonSize, buttonSize),
          ),
        );
        break;

      case TallowButtonVariant.outlined:
        button = IconButton.outlined(
          onPressed: isLoading ? null : onPressed,
          icon: iconWidget,
          iconSize: iconSize,
          style: IconButton.styleFrom(
            foregroundColor: color,
            minimumSize: Size(buttonSize, buttonSize),
          ),
        );
        break;

      case TallowButtonVariant.tonal:
        button = IconButton.filledTonal(
          onPressed: isLoading ? null : onPressed,
          icon: iconWidget,
          iconSize: iconSize,
          style: IconButton.styleFrom(
            minimumSize: Size(buttonSize, buttonSize),
          ),
        );
        break;

      case TallowButtonVariant.text:
      default:
        button = IconButton(
          onPressed: isLoading ? null : onPressed,
          icon: iconWidget,
          iconSize: iconSize,
          color: color,
          style: IconButton.styleFrom(
            minimumSize: Size(buttonSize, buttonSize),
          ),
        );
    }

    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }

  double _getIconSize() {
    switch (size) {
      case TallowButtonSize.small:
        return 18;
      case TallowButtonSize.medium:
        return 24;
      case TallowButtonSize.large:
        return 32;
    }
  }

  double _getButtonSize() {
    switch (size) {
      case TallowButtonSize.small:
        return 32;
      case TallowButtonSize.medium:
        return 40;
      case TallowButtonSize.large:
        return 56;
    }
  }
}

/// Floating action button variant
class TallowFAB extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? label;
  final bool isExtended;
  final bool isLoading;

  const TallowFAB({
    super.key,
    required this.icon,
    this.onPressed,
    this.label,
    this.isExtended = false,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isExtended && label != null) {
      return FloatingActionButton.extended(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(
                    theme.colorScheme.onPrimaryContainer,
                  ),
                ),
              )
            : Icon(icon),
        label: Text(label!),
      );
    }

    return FloatingActionButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(
                  theme.colorScheme.onPrimaryContainer,
                ),
              ),
            )
          : Icon(icon),
    );
  }
}
