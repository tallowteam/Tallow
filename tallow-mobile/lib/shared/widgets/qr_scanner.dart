import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../l10n/app_localizations.dart';

/// QR Code scanner widget
class QRScannerWidget extends StatefulWidget {
  final void Function(String) onScanned;
  final String? title;

  const QRScannerWidget({
    super.key,
    required this.onScanned,
    this.title,
  });

  @override
  State<QRScannerWidget> createState() => _QRScannerWidgetState();
}

class _QRScannerWidgetState extends State<QRScannerWidget> {
  MobileScannerController? _controller;
  bool _isFlashOn = false;
  bool _isFrontCamera = false;
  bool _hasScanned = false;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController(
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;

    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        setState(() => _hasScanned = true);
        widget.onScanned(barcode.rawValue!);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
              Expanded(
                child: Text(
                  widget.title ?? (l10n?.scanQR ?? 'Scan QR Code'),
                  style: theme.textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(width: 48),
            ],
          ),
        ),

        // Scanner
        Expanded(
          child: Stack(
            children: [
              MobileScanner(
                controller: _controller,
                onDetect: _onDetect,
              ),

              // Overlay
              CustomPaint(
                painter: _ScannerOverlayPainter(
                  borderColor: theme.colorScheme.primary,
                ),
                child: const SizedBox.expand(),
              ),

              // Controls
              Positioned(
                bottom: 32,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Flash toggle
                    IconButton.filled(
                      onPressed: () async {
                        await _controller?.toggleTorch();
                        setState(() => _isFlashOn = !_isFlashOn);
                      },
                      icon: Icon(
                        _isFlashOn ? Icons.flash_on : Icons.flash_off,
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Camera switch
                    IconButton.filled(
                      onPressed: () async {
                        await _controller?.switchCamera();
                        setState(() => _isFrontCamera = !_isFrontCamera);
                      },
                      icon: const Icon(Icons.cameraswitch),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Instructions
        Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            l10n?.pointCameraAtQR ?? 'Point your camera at a QR code',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  final Color borderColor;
  final double borderWidth;
  final double cornerRadius;
  final double cornerLength;

  _ScannerOverlayPainter({
    required this.borderColor,
    this.borderWidth = 4,
    this.cornerRadius = 16,
    this.cornerLength = 32,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double scanAreaSize = size.width * 0.7;
    final double left = (size.width - scanAreaSize) / 2;
    final double top = (size.height - scanAreaSize) / 2;
    final double right = left + scanAreaSize;
    final double bottom = top + scanAreaSize;

    // Draw dark overlay
    final overlayPath = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromLTRB(left, top, right, bottom),
        Radius.circular(cornerRadius),
      ))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(
      overlayPath,
      Paint()..color = Colors.black.withOpacity(0.5),
    );

    // Draw corner borders
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth
      ..strokeCap = StrokeCap.round;

    // Top-left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + cornerLength)
        ..lineTo(left, top + cornerRadius)
        ..arcToPoint(
          Offset(left + cornerRadius, top),
          radius: Radius.circular(cornerRadius),
        )
        ..lineTo(left + cornerLength, top),
      borderPaint,
    );

    // Top-right corner
    canvas.drawPath(
      Path()
        ..moveTo(right - cornerLength, top)
        ..lineTo(right - cornerRadius, top)
        ..arcToPoint(
          Offset(right, top + cornerRadius),
          radius: Radius.circular(cornerRadius),
        )
        ..lineTo(right, top + cornerLength),
      borderPaint,
    );

    // Bottom-left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, bottom - cornerLength)
        ..lineTo(left, bottom - cornerRadius)
        ..arcToPoint(
          Offset(left + cornerRadius, bottom),
          radius: Radius.circular(cornerRadius),
        )
        ..lineTo(left + cornerLength, bottom),
      borderPaint,
    );

    // Bottom-right corner
    canvas.drawPath(
      Path()
        ..moveTo(right - cornerLength, bottom)
        ..lineTo(right - cornerRadius, bottom)
        ..arcToPoint(
          Offset(right, bottom - cornerRadius),
          radius: Radius.circular(cornerRadius),
        )
        ..lineTo(right, bottom - cornerLength),
      borderPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// QR Code generator widget
class QRCodeWidget extends StatelessWidget {
  final String data;
  final double size;
  final Color? foregroundColor;
  final Color? backgroundColor;
  final String? label;

  const QRCodeWidget({
    super.key,
    required this.data,
    this.size = 200,
    this.foregroundColor,
    this.backgroundColor,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: backgroundColor ?? Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: QrImageView(
            data: data,
            version: QrVersions.auto,
            size: size,
            backgroundColor: backgroundColor ?? Colors.white,
            foregroundColor: foregroundColor ?? Colors.black,
            errorCorrectionLevel: QrErrorCorrectLevel.M,
          ),
        ),
        if (label != null) ...[
          const SizedBox(height: 16),
          Text(
            label!,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

/// Dialog to show QR code
Future<void> showQRCodeDialog(
  BuildContext context, {
  required String data,
  String? title,
  String? label,
}) async {
  final l10n = AppLocalizations.of(context);

  return showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title ?? (l10n?.qrCode ?? 'QR Code')),
      content: QRCodeWidget(
        data: data,
        label: label,
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(l10n?.close ?? 'Close'),
        ),
      ],
    ),
  );
}
