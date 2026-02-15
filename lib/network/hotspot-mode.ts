'use client';

/**
 * Hotspot Mode Detection
 *
 * Detects when the device is acting as a WiFi hotspot/access point
 * and provides information about connected clients.
 *
 * Useful for direct file sharing without a router.
 */

import { getNetworkInterfaceSelector, type NetworkInterface } from './interface-selector';
import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Hotspot detection result
 */
export interface HotspotStatus {
  /** Whether hotspot is active */
  isActive: boolean;
  /** Hotspot interface */
  interface?: NetworkInterface;
  /** Hotspot IP address */
  ip?: string;
  /** Estimated number of clients */
  clientCount?: number;
  /** Confidence level of detection (0-100) */
  confidence: number;
}

/**
 * Hotspot client information
 */
export interface HotspotClient {
  /** Client IP address */
  ip: string;
  /** MAC address (if available) */
  mac?: string;
  /** When client was first seen */
  firstSeen: Date;
  /** Last activity timestamp */
  lastSeen: Date;
  /** Whether client is currently active */
  isActive: boolean;
}

/**
 * Hotspot detection heuristics
 */
interface DetectionHeuristics {
  /** Has hotspot-like IP range */
  hasHotspotIP: boolean;
  /** Has multiple local IPs */
  hasMultipleIPs: boolean;
  /** Has NAT-like configuration */
  hasNATConfig: boolean;
  /** Network interface count */
  interfaceCount: number;
  /** Confidence score */
  score: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Known hotspot IP ranges */
const HOTSPOT_IP_RANGES = [
  { start: '192.168.43.0', end: '192.168.43.255', platform: 'android' },
  { start: '192.168.137.0', end: '192.168.137.255', platform: 'windows' },
  { start: '172.20.10.0', end: '172.20.10.255', platform: 'ios' },
  { start: '192.168.50.0', end: '192.168.50.255', platform: 'generic' },
];

/** Typical hotspot gateway IPs */
const HOTSPOT_GATEWAY_IPS = [
  '192.168.43.1',   // Android
  '192.168.137.1',  // Windows
  '172.20.10.1',    // iOS
  '192.168.50.1',   // Generic
];

/** Client tracking timeout (10 minutes) */
const CLIENT_TIMEOUT = 600000;

// ============================================================================
// Hotspot Detector Class
// ============================================================================

/**
 * Hotspot mode detector
 */
export class HotspotDetector {
  private interfaceSelector = getNetworkInterfaceSelector();
  private clients = new Map<string, HotspotClient>();
  private lastDetection: HotspotStatus | null = null;
  private lastScan = 0;
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Periodic cleanup of stale clients
    this.scanInterval = setInterval(() => {
      this.cleanupStaleClients();
    }, 60000); // Every minute
  }

  // ============================================================================
  // Detection
  // ============================================================================

  /**
   * Detect if device is acting as a hotspot
   */
  async detect(): Promise<HotspotStatus> {
    // Get network interfaces
    const interfaces = await this.interfaceSelector.getNetworkInterfaces();

    // Run heuristics
    const heuristics = this.runHeuristics(interfaces);

    // Build status
    const status: HotspotStatus = {
      isActive: heuristics.score >= 60,
      confidence: heuristics.score,
    };

    // Find hotspot interface
    if (status.isActive) {
      const hotspotInterface = this.findHotspotInterface(interfaces);
      if (hotspotInterface) {
        status.interface = hotspotInterface;
        status.ip = hotspotInterface.ip;
      }

      // Estimate client count
      status.clientCount = this.estimateClientCount();
    }

    this.lastDetection = status;
    this.lastScan = Date.now();

    if (status.isActive) {
      secureLog.log(
        `[HotspotDetector] Hotspot detected (${status.confidence}% confidence)`,
        status.ip
      );
    }

    return status;
  }

  /**
   * Check if hotspot is currently active
   */
  async isHotspotActive(): Promise<boolean> {
    // Use cached result if recent (30 seconds)
    if (this.lastDetection && Date.now() - this.lastScan < 30000) {
      return this.lastDetection.isActive;
    }

    const status = await this.detect();
    return status.isActive;
  }

  /**
   * Get current hotspot status
   */
  getStatus(): HotspotStatus | null {
    return this.lastDetection;
  }

  // ============================================================================
  // Client Tracking
  // ============================================================================

  /**
   * Register a client IP address
   */
  registerClient(ip: string, mac?: string): void {
    const existing = this.clients.get(ip);

    if (existing) {
      existing.lastSeen = new Date();
      existing.isActive = true;
      if (mac && !existing.mac) {
        existing.mac = mac;
      }
    } else {
      this.clients.set(ip, {
        ip,
        ...(mac ? { mac } : {}),
        firstSeen: new Date(),
        lastSeen: new Date(),
        isActive: true,
      });
    }
  }

  /**
   * Get all tracked clients
   */
  getClients(): HotspotClient[] {
    return Array.from(this.clients.values())
      .filter((client) => client.isActive)
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  /**
   * Get client IPs
   */
  getClientIPs(): string[] {
    return this.getClients().map((client) => client.ip);
  }

  /**
   * Get active client count
   */
  getClientCount(): number {
    return this.getClients().length;
  }

  /**
   * Check if an IP is a connected client
   */
  isClient(ip: string): boolean {
    const client = this.clients.get(ip);
    return client?.isActive === true;
  }

  /**
   * Mark client as disconnected
   */
  removeClient(ip: string): void {
    const client = this.clients.get(ip);
    if (client) {
      client.isActive = false;
    }
  }

  // ============================================================================
  // Heuristics
  // ============================================================================

  /**
   * Run hotspot detection heuristics
   */
  private runHeuristics(interfaces: NetworkInterface[]): DetectionHeuristics {
    const heuristics: DetectionHeuristics = {
      hasHotspotIP: false,
      hasMultipleIPs: interfaces.length > 1,
      hasNATConfig: false,
      interfaceCount: interfaces.length,
      score: 0,
    };

    // Check for hotspot IP ranges
    for (const iface of interfaces) {
      if (this.isHotspotIP(iface.ip)) {
        heuristics.hasHotspotIP = true;
        heuristics.score += 60;

        // Check if it's a gateway IP (more confident)
        if (this.isHotspotGatewayIP(iface.ip)) {
          heuristics.score += 20;
        }

        break;
      }
    }

    // Multiple network interfaces suggests hosting
    if (heuristics.hasMultipleIPs) {
      heuristics.score += 10;
    }

    // Check for NAT-like configuration
    if (this.hasNATConfiguration(interfaces)) {
      heuristics.hasNATConfig = true;
      heuristics.score += 10;
    }

    // Cap at 100
    heuristics.score = Math.min(heuristics.score, 100);

    return heuristics;
  }

  /**
   * Check if IP is in hotspot range
   */
  private isHotspotIP(ip: string): boolean {
    return HOTSPOT_IP_RANGES.some((range) => this.isIPInRange(ip, range.start, range.end));
  }

  /**
   * Check if IP is a hotspot gateway
   */
  private isHotspotGatewayIP(ip: string): boolean {
    return HOTSPOT_GATEWAY_IPS.includes(ip);
  }

  /**
   * Check for NAT-like configuration (multiple subnets)
   */
  private hasNATConfiguration(interfaces: NetworkInterface[]): boolean {
    if (interfaces.length < 2) {
      return false;
    }

    // Get unique subnets
    const subnets = new Set(
      interfaces.map((iface) => this.getSubnet(iface.ip))
    );

    // NAT typically has multiple subnets
    return subnets.size >= 2;
  }

  /**
   * Find the hotspot interface
   */
  private findHotspotInterface(interfaces: NetworkInterface[]): NetworkInterface | undefined {
    // First, look for interface marked as hotspot
    const hotspot = interfaces.find((iface) => iface.type === 'hotspot');
    if (hotspot) {
      return hotspot;
    }

    // Then look for hotspot IP range
    return interfaces.find((iface) => this.isHotspotIP(iface.ip));
  }

  /**
   * Estimate client count based on tracked IPs
   */
  private estimateClientCount(): number {
    // Return tracked client count
    const activeClients = this.getClients().length;

    // If no tracked clients but hotspot is active, assume at least 1
    return activeClients > 0 ? activeClients : 1;
  }

  /**
   * Clean up stale clients
   */
  private cleanupStaleClients(): void {
    const now = Date.now();

    this.clients.forEach((client) => {
      const age = now - client.lastSeen.getTime();

      if (age > CLIENT_TIMEOUT) {
        client.isActive = false;
      }
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get subnet from IP
   */
  private getSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return ip;
    }

    // For hotspots, use /24 subnet
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  /**
   * Check if IP is in range
   */
  private isIPInRange(ip: string, start: string, end: string): boolean {
    const ipNum = this.ipToNumber(ip);
    const startNum = this.ipToNumber(start);
    const endNum = this.ipToNumber(end);

    return ipNum >= startNum && ipNum <= endNum;
  }

  /**
   * Convert IP to number
   */
  private ipToNumber(ip: string): number {
    const parts = ip.split('.');
    if (parts.length !== 4) {
      return 0;
    }

    return (
      (parseInt(parts[0] || '0', 10) << 24) +
      (parseInt(parts[1] || '0', 10) << 16) +
      (parseInt(parts[2] || '0', 10) << 8) +
      parseInt(parts[3] || '0', 10)
    ) >>> 0;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.clients.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let hotspotDetectorInstance: HotspotDetector | null = null;

/**
 * Get the singleton hotspot detector
 */
export function getHotspotDetector(): HotspotDetector {
  if (!hotspotDetectorInstance) {
    hotspotDetectorInstance = new HotspotDetector();
  }
  return hotspotDetectorInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick check if hotspot mode is active
 */
export async function isHotspotMode(): Promise<boolean> {
  const detector = getHotspotDetector();
  return detector.isHotspotActive();
}

/**
 * Get hotspot clients
 */
export function getHotspotClients(): string[] {
  const detector = getHotspotDetector();
  return detector.getClientIPs();
}

export default HotspotDetector;
