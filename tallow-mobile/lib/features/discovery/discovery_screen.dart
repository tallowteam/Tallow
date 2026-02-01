import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'discovery_provider.dart';
import 'device_card.dart';
import '../transfer/transfer_provider.dart';
import '../../shared/widgets/qr_scanner.dart';
import '../../shared/widgets/tallow_button.dart';
import '../../l10n/app_localizations.dart';

class DiscoveryScreen extends ConsumerStatefulWidget {
  const DiscoveryScreen({super.key});

  @override
  ConsumerState<DiscoveryScreen> createState() => _DiscoveryScreenState();
}

class _DiscoveryScreenState extends ConsumerState<DiscoveryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Start scanning on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(discoveryProvider.notifier).startLocalScan();
      ref.read(discoveryProvider.notifier).startAdvertising();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _connectToDevice(device) async {
    final notifier = ref.read(transferProvider.notifier);
    await notifier.connectToPeer(device.id, device.name);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connecting to ${device.name}...'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(discoveryProvider);
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.discover ?? 'Discover'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(discoveryProvider.notifier).refresh(),
            tooltip: l10n?.refresh ?? 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () => _showQRScanner(context),
            tooltip: l10n?.scanQR ?? 'Scan QR',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              icon: const Icon(Icons.wifi),
              text: l10n?.localNetwork ?? 'Local Network',
            ),
            Tab(
              icon: const Icon(Icons.cloud),
              text: l10n?.online ?? 'Online',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Local Network Tab
          _LocalNetworkTab(
            devices: state.localDevices,
            isScanning: state.isScanning,
            onDeviceTap: _connectToDevice,
            onRefresh: () => ref.read(discoveryProvider.notifier).refresh(),
          ),

          // Online Tab
          _OnlineTab(
            devices: state.onlineDevices,
            roomCode: state.roomCode,
            onDeviceTap: _connectToDevice,
            onCreateRoom: () async {
              final code = await ref.read(discoveryProvider.notifier).createRoom();
              if (code != null && mounted) {
                _showRoomCodeDialog(context, code);
              }
            },
            onJoinRoom: () => _showJoinRoomDialog(context),
          ),
        ],
      ),
    );
  }

  void _showQRScanner(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => QRScannerWidget(
          onScanned: (code) async {
            Navigator.pop(context);
            final success = await ref.read(discoveryProvider.notifier).joinRoom(code);
            if (!success && mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to join room')),
              );
            }
          },
        ),
      ),
    );
  }

  void _showRoomCodeDialog(BuildContext context, String code) {
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.roomCreated ?? 'Room Created'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(l10n?.shareCode ?? 'Share this code with others to connect:'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: SelectableText(
                code,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 4,
                    ),
              ),
            ),
            const SizedBox(height: 16),
            TallowButton(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: code));
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n?.copiedToClipboard ?? 'Copied to clipboard')),
                );
              },
              label: l10n?.copy ?? 'Copy',
              icon: Icons.copy,
            ),
          ],
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

  void _showJoinRoomDialog(BuildContext context) {
    final controller = TextEditingController();
    final l10n = AppLocalizations.of(context);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n?.joinRoom ?? 'Join Room'),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(
            labelText: l10n?.roomCode ?? 'Room Code',
            hintText: 'XXXXXXXX',
          ),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[A-Z0-9]')),
            LengthLimitingTextInputFormatter(8),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n?.cancel ?? 'Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final code = controller.text.trim();
              if (code.length == 8) {
                Navigator.pop(context);
                final success = await ref.read(discoveryProvider.notifier).joinRoom(code);
                if (!success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Failed to join room')),
                  );
                }
              }
            },
            child: Text(l10n?.join ?? 'Join'),
          ),
        ],
      ),
    );
  }
}

class _LocalNetworkTab extends StatelessWidget {
  final List devices;
  final bool isScanning;
  final void Function(dynamic) onDeviceTap;
  final VoidCallback onRefresh;

  const _LocalNetworkTab({
    required this.devices,
    required this.isScanning,
    required this.onDeviceTap,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    if (devices.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isScanning)
              const CircularProgressIndicator()
            else
              Icon(
                Icons.wifi_off,
                size: 64,
                color: theme.colorScheme.onSurface.withOpacity(0.3),
              ),
            const SizedBox(height: 16),
            Text(
              isScanning
                  ? (l10n?.scanning ?? 'Scanning...')
                  : (l10n?.noDevicesFound ?? 'No devices found'),
              style: theme.textTheme.titleMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n?.ensureSameNetwork ?? 'Ensure devices are on the same network',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.4),
              ),
            ),
            if (!isScanning) ...[
              const SizedBox(height: 24),
              TallowButton(
                onPressed: onRefresh,
                label: l10n?.scanAgain ?? 'Scan Again',
                icon: Icons.refresh,
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: devices.length,
        itemBuilder: (context, index) {
          final device = devices[index];
          return DeviceCard(
            device: device,
            onTap: () => onDeviceTap(device),
          );
        },
      ),
    );
  }
}

class _OnlineTab extends StatelessWidget {
  final List devices;
  final String? roomCode;
  final void Function(dynamic) onDeviceTap;
  final VoidCallback onCreateRoom;
  final VoidCallback onJoinRoom;

  const _OnlineTab({
    required this.devices,
    required this.roomCode,
    required this.onDeviceTap,
    required this.onCreateRoom,
    required this.onJoinRoom,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    if (roomCode == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_outlined,
                size: 64,
                color: theme.colorScheme.primary.withOpacity(0.5),
              ),
              const SizedBox(height: 24),
              Text(
                l10n?.connectOnline ?? 'Connect Online',
                style: theme.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                l10n?.onlineDescription ?? 'Create or join a room to connect with devices anywhere',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TallowButton(
                    onPressed: onCreateRoom,
                    label: l10n?.createRoom ?? 'Create Room',
                    icon: Icons.add,
                    variant: TallowButtonVariant.filled,
                  ),
                  const SizedBox(width: 16),
                  TallowButton(
                    onPressed: onJoinRoom,
                    label: l10n?.joinRoom ?? 'Join Room',
                    icon: Icons.login,
                    variant: TallowButtonVariant.outlined,
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        // Room info banner
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          color: theme.colorScheme.primaryContainer.withOpacity(0.3),
          child: Row(
            children: [
              Icon(
                Icons.meeting_room,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${l10n?.room ?? 'Room'}: $roomCode',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      '${devices.length} ${l10n?.devicesConnected ?? 'devices connected'}',
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.share),
                onPressed: () {
                  // Share room code
                },
              ),
            ],
          ),
        ),

        // Devices list
        Expanded(
          child: devices.isEmpty
              ? Center(
                  child: Text(
                    l10n?.waitingForDevices ?? 'Waiting for devices to join...',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: devices.length,
                  itemBuilder: (context, index) {
                    final device = devices[index];
                    return DeviceCard(
                      device: device,
                      onTap: () => onDeviceTap(device),
                      isOnline: true,
                    );
                  },
                ),
        ),
      ],
    );
  }
}
