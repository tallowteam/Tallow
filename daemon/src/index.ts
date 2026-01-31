#!/usr/bin/env node

/**
 * TALLOW mDNS Daemon
 *
 * Entry point for the mDNS/Bonjour/Zeroconf discovery daemon.
 * Runs as a background service to enable browser-based applications
 * to discover devices on the local network.
 *
 * Features:
 * - mDNS service discovery and advertisement
 * - WebSocket API for browser clients
 * - Cross-platform support (macOS, Windows, Linux)
 *
 * Usage:
 *   npx @tallow/mdns-daemon                 # Start daemon
 *   npx @tallow/mdns-daemon --port 53318    # Custom WebSocket port
 *   npx @tallow/mdns-daemon --help          # Show help
 */

import { getMDNSServer, detectPlatform, getDefaultDeviceName, generateDeviceId } from './mdns-server.js';
import { getWebSocketServer, DEFAULT_WS_PORT } from './websocket-server.js';
import { getServiceRegistry } from './service-registry.js';

// ============================================================================
// Configuration
// ============================================================================

interface DaemonConfig {
  wsPort: number;
  autoAdvertise: boolean;
  deviceId: string;
  deviceName: string;
  verbose: boolean;
}

function parseArgs(): DaemonConfig {
  const args = process.argv.slice(2);
  const config: DaemonConfig = {
    wsPort: DEFAULT_WS_PORT,
    autoAdvertise: false,
    deviceId: generateDeviceId(),
    deviceName: getDefaultDeviceName(),
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      console.log('1.0.0');
      process.exit(0);
    }

    if (arg === '--port' || arg === '-p') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        const port = parseInt(nextArg, 10);
        if (!isNaN(port) && port > 0 && port < 65536) {
          config.wsPort = port;
        }
      }
    }

    if (arg === '--advertise' || arg === '-a') {
      config.autoAdvertise = true;
    }

    if (arg === '--device-id') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        config.deviceId = nextArg;
      }
    }

    if (arg === '--device-name') {
      const nextArg = args[++i];
      if (nextArg !== undefined) {
        config.deviceName = nextArg;
      }
    }

    if (arg === '--verbose') {
      config.verbose = true;
    }
  }

  return config;
}

function printHelp(): void {
  console.log(`
TALLOW mDNS Daemon v1.0.0

Usage: tallow-daemon [options]

Options:
  -h, --help          Show this help message
  -v, --version       Show version
  -p, --port <port>   WebSocket server port (default: ${DEFAULT_WS_PORT})
  -a, --advertise     Auto-advertise this device on startup
  --device-id <id>    Custom device ID
  --device-name <n>   Custom device name
  --verbose           Enable verbose logging

Examples:
  tallow-daemon                           # Start daemon with defaults
  tallow-daemon --port 8080               # Custom WebSocket port
  tallow-daemon --advertise               # Auto-advertise on startup
  tallow-daemon --device-name "My PC"     # Custom device name

Environment Variables:
  TALLOW_WS_PORT      WebSocket port (overrides --port)
  TALLOW_DEVICE_ID    Device ID
  TALLOW_DEVICE_NAME  Device name
  DEBUG               Enable debug logging (DEBUG=mdns*)
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  // Apply environment variables
  if (process.env['TALLOW_WS_PORT']) {
    const port = parseInt(process.env['TALLOW_WS_PORT'], 10);
    if (!isNaN(port)) config.wsPort = port;
  }
  if (process.env['TALLOW_DEVICE_ID']) {
    config.deviceId = process.env['TALLOW_DEVICE_ID'];
  }
  if (process.env['TALLOW_DEVICE_NAME']) {
    config.deviceName = process.env['TALLOW_DEVICE_NAME'];
  }

  console.log('╔══════════════════════════════════════════╗');
  console.log('║       TALLOW mDNS Daemon v1.0.0          ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log();
  console.log(`Platform:     ${detectPlatform()}`);
  console.log(`Device ID:    ${config.deviceId}`);
  console.log(`Device Name:  ${config.deviceName}`);
  console.log(`WS Port:      ${config.wsPort}`);
  console.log();

  // Get service instances
  const mdnsServer = getMDNSServer();
  const wsServer = getWebSocketServer(config.wsPort);
  const registry = getServiceRegistry();

  // Set up event handlers
  mdnsServer.on('device-found', (device) => {
    console.log(`[+] Device found: ${device.name} (${device.id})`);
    if (config.verbose) {
      console.log(`    Platform: ${device.platform}`);
      console.log(`    IP: ${device.ip}:${device.port}`);
      console.log(`    Capabilities: ${device.capabilities}`);
    }
  });

  mdnsServer.on('device-lost', (deviceId) => {
    console.log(`[-] Device lost: ${deviceId}`);
  });

  mdnsServer.on('error', (error) => {
    console.error('[!] Error:', error.message);
  });

  // Start mDNS server
  console.log('[*] Starting mDNS server...');
  mdnsServer.start();

  // Start WebSocket server
  console.log('[*] Starting WebSocket server...');
  try {
    await wsServer.start();
    console.log(`[*] WebSocket server listening on ws://localhost:${config.wsPort}`);
  } catch (error) {
    console.error('[!] Failed to start WebSocket server:', error);
    process.exit(1);
  }

  // Auto-advertise if enabled
  if (config.autoAdvertise) {
    console.log('[*] Auto-advertising device...');
    mdnsServer.startAdvertising({
      deviceId: config.deviceId,
      deviceName: config.deviceName,
      platform: detectPlatform(),
      capabilities: ['pqc', 'chat', 'folder', 'group'],
      fingerprint: config.deviceId.slice(0, 8),
    });
  }

  // Start discovery
  console.log('[*] Starting mDNS discovery...');
  mdnsServer.startDiscovery();

  console.log();
  console.log('[*] Daemon is running. Press Ctrl+C to stop.');
  console.log();

  // Print status periodically
  const statusInterval = setInterval(() => {
    const deviceCount = registry.getDeviceCount();
    const clientCount = wsServer.getClientCount();
    if (config.verbose) {
      console.log(`[i] Status: ${deviceCount} devices, ${clientCount} clients`);
    }
  }, 30000);

  // Handle shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log();
    console.log(`[*] Received ${signal}, shutting down...`);

    clearInterval(statusInterval);

    // Stop services
    mdnsServer.stop();
    await wsServer.stop();
    registry.stop();

    console.log('[*] Daemon stopped.');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('[!] Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[!] Unhandled rejection:', reason);
  });
}

// Run main
main().catch((error) => {
  console.error('[!] Fatal error:', error);
  process.exit(1);
});
