import 'package:flutter/material.dart';

/// Progress status
enum ProgressStatus {
  pending,
  inProgress,
  paused,
  completed,
  error,
}

/// Custom progress indicator for transfers
class TallowProgressIndicator extends StatelessWidget {
  final double progress;
  final ProgressStatus status;
  final double height;
  final bool showPercentage;
  final bool animated;

  const TallowProgressIndicator({
    super.key,
    required this.progress,
    this.status = ProgressStatus.inProgress,
    this.height = 8,
    this.showPercentage = false,
    this.animated = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final color = _getColorForStatus(theme);
    final backgroundColor = theme.colorScheme.surfaceContainerHighest;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(height / 2),
          child: SizedBox(
            height: height,
            child: Stack(
              children: [
                // Background
                Container(
                  decoration: BoxDecoration(
                    color: backgroundColor,
                    borderRadius: BorderRadius.circular(height / 2),
                  ),
                ),

                // Progress
                AnimatedFractionallySizedBox(
                  duration: animated
                      ? const Duration(milliseconds: 300)
                      : Duration.zero,
                  widthFactor: progress.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(height / 2),
                      gradient: status == ProgressStatus.inProgress
                          ? LinearGradient(
                              colors: [
                                color,
                                color.withOpacity(0.8),
                              ],
                            )
                          : null,
                    ),
                  ),
                ),

                // Shimmer effect for in-progress
                if (status == ProgressStatus.inProgress && progress > 0)
                  _ShimmerEffect(
                    progress: progress,
                    height: height,
                    color: color,
                  ),
              ],
            ),
          ),
        ),
        if (showPercentage) ...[
          const SizedBox(height: 4),
          Text(
            '${(progress * 100).toStringAsFixed(0)}%',
            style: theme.textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  Color _getColorForStatus(ThemeData theme) {
    switch (status) {
      case ProgressStatus.inProgress:
        return theme.colorScheme.primary;
      case ProgressStatus.paused:
        return Colors.orange;
      case ProgressStatus.completed:
        return Colors.green;
      case ProgressStatus.error:
        return theme.colorScheme.error;
      case ProgressStatus.pending:
      default:
        return theme.colorScheme.outline;
    }
  }
}

class _ShimmerEffect extends StatefulWidget {
  final double progress;
  final double height;
  final Color color;

  const _ShimmerEffect({
    required this.progress,
    required this.height,
    required this.color,
  });

  @override
  State<_ShimmerEffect> createState() => _ShimmerEffectState();
}

class _ShimmerEffectState extends State<_ShimmerEffect>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return FractionallySizedBox(
          widthFactor: widget.progress,
          child: ShaderMask(
            shaderCallback: (bounds) {
              return LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Colors.transparent,
                  Colors.white.withOpacity(0.3),
                  Colors.transparent,
                ],
                stops: [
                  _controller.value - 0.3,
                  _controller.value,
                  _controller.value + 0.3,
                ].map((v) => v.clamp(0.0, 1.0)).toList(),
              ).createShader(bounds);
            },
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(widget.height / 2),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Circular progress indicator with label
class TallowCircularProgress extends StatelessWidget {
  final double progress;
  final ProgressStatus status;
  final double size;
  final double strokeWidth;
  final Widget? child;

  const TallowCircularProgress({
    super.key,
    required this.progress,
    this.status = ProgressStatus.inProgress,
    this.size = 64,
    this.strokeWidth = 6,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _getColorForStatus(theme);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background circle
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: 1,
              strokeWidth: strokeWidth,
              valueColor: AlwaysStoppedAnimation(
                theme.colorScheme.surfaceContainerHighest,
              ),
            ),
          ),

          // Progress circle
          SizedBox(
            width: size,
            height: size,
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: progress),
              duration: const Duration(milliseconds: 300),
              builder: (context, value, child) {
                return CircularProgressIndicator(
                  value: value,
                  strokeWidth: strokeWidth,
                  valueColor: AlwaysStoppedAnimation(color),
                  strokeCap: StrokeCap.round,
                );
              },
            ),
          ),

          // Center content
          if (child != null)
            child!
          else
            Text(
              '${(progress * 100).toStringAsFixed(0)}%',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }

  Color _getColorForStatus(ThemeData theme) {
    switch (status) {
      case ProgressStatus.inProgress:
        return theme.colorScheme.primary;
      case ProgressStatus.paused:
        return Colors.orange;
      case ProgressStatus.completed:
        return Colors.green;
      case ProgressStatus.error:
        return theme.colorScheme.error;
      case ProgressStatus.pending:
      default:
        return theme.colorScheme.outline;
    }
  }
}

/// Indeterminate progress with message
class TallowLoadingIndicator extends StatelessWidget {
  final String? message;
  final bool compact;

  const TallowLoadingIndicator({
    super.key,
    this.message,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (compact) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation(theme.colorScheme.primary),
            ),
          ),
          if (message != null) ...[
            const SizedBox(width: 8),
            Text(
              message!,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ],
      );
    }

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
