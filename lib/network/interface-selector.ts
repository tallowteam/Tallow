'use client';

/**
 * Network Interface Selector
 *
 * Detects available network interfaces using WebRTC ICE candidates
 * and provides intelligent interface selection for optimal transfers.
 *
 * Uses RTCPeerConnection to discover local IP addresses since browsers
 * don't provide direct access to network interfaces.
 */

import secureLog from '@/lib/utils/secure-logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Network interface types
 */
export type NetworkInterfaceType =
  | 'wifi'
  | 'ethernet'
  | 'hotspot'
  | 'vpn'
  | 'unknown';

/**
 * Network interface information
 */
export interface NetworkInterface {
  /** Interface identifier */
  name: string;
  /** Local IP address */
  ip: string;
  /** Interface type */
  type: NetworkInterfaceType;
  /** Whether this is the preferred interface */
  isPreferred: boolean;
  /** Signal strength (for WiFi, 0-100) */
  signalStrength?: number;
  /** Whether this is the default route */
  isDefault?: boolean;
  /** IPv6 address if available */
  ipv6?: string;
}

/**
 * IP address classification
 */
interface IPClassification {
  isPrivate: boolean;
  isLinkLocal: boolean;
  isLoopback: boolean;
  class: 'A' | 'B' | 'C' | 'unknown';
}

// ============================================================================
// Constants
// ============================================================================

/** Private IP ranges */
const PRIVATE_IP_RANGES = {
  classA: { start: '10.0.0.0', end: '10.255.255.255' },
  classB: { start: '172.16.0.0', end: '172.31.255.255' },
  classC: { start: '192.168.0.0', end: '192.168.255.255' },
};

/** Link-local range (169.254.x.x) */
const LINK_LOCAL_RANGE = { start: '169.254.0.0', end: '169.254.255.255' };

/** VPN IP ranges (common VPN providers) */
const VPN_IP_RANGES = [
  { start: '10.8.0.0', end: '10.8.255.255' }, // OpenVPN default
  { start: '10.255.0.0', end: '10.255.255.255' }, // Tailscale
  { start: '100.64.0.0', end: '100.127.255.255' }, // CGNAT (often VPN)
];

/** Hotspot IP ranges */
const HOTSPOT_IP_RANGES = [
  { start: '192.168.43.0', end: '192.168.43.255' }, // Android hotspot
  { start: '192.168.137.0', end: '192.168.137.255' }, // Windows hotspot
  { start: '172.20.10.0', end: '172.20.10.255' }, // iOS hotspot
];

/** Cache duration for interface list */
const CACHE_DURATION = 30000; // 30 seconds

// ============================================================================
// Interface Selector Class
// ============================================================================

/**
 * Network interface selector using WebRTC ICE candidates
 */
export class NetworkInterfaceSelector {
  private interfaces: NetworkInterface[] = [];
  private lastScan: number = 0;
  private scanInProgress = false;
  private preferredInterface: NetworkInterface | null = null;

  constructor() {
    // Check browser support
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      secureLog.warn('[InterfaceSelector] WebRTC not available');
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get all available network interfaces
   */
  async getNetworkInterfaces(forceRefresh = false): Promise<NetworkInterface[]> {
    // Return cached result if recent
    if (!forceRefresh && Date.now() - this.lastScan < CACHE_DURATION) {
      return this.interfaces;
    }

    // Prevent concurrent scans
    if (this.scanInProgress) {
      return this.interfaces;
    }

    this.scanInProgress = true;

    try {
      const candidates = await this.gatherICECandidates();
      this.interfaces = this.processICECandidates(candidates);
      this.lastScan = Date.now();

      // Auto-select preferred interface
      this.preferredInterface = this.selectPreferred(this.interfaces);

      secureLog.log(
        `[InterfaceSelector] Found ${this.interfaces.length} network interfaces`,
        this.interfaces.map(i => `${i.type}:${i.ip}`)
      );

      return this.interfaces;
    } catch (error) {
      secureLog.error('[InterfaceSelector] Failed to scan interfaces:', error);
      return this.interfaces;
    } finally {
      this.scanInProgress = false;
    }
  }

  /**
   * Select best interface for file transfer
   */
  selectInterface(preferredType?: NetworkInterfaceType): NetworkInterface | null {
    if (this.interfaces.length === 0) {
      return null;
    }

    // If type is specified, find best matching interface
    if (preferredType) {
      const matching = this.interfaces.filter(i => i.type === preferredType);
      if (matching.length > 0) {
        return matching.sort((a, b) =>
          (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0)
        )[0] || null;
      }
    }

    // Return auto-selected preferred interface
    return this.preferredInterface;
  }

  /**
   * Get preferred interface (auto-detected)
   */
  getPreferredInterface(): NetworkInterface | null {
    return this.preferredInterface;
  }

  /**
   * Detect network type from IP address
   */
  detectNetworkType(ip: string): NetworkInterfaceType {
    // Check loopback
    if (ip === '127.0.0.1' || ip === '::1') {
      return 'unknown';
    }

    // Check VPN ranges
    if (this.isInRange(ip, VPN_IP_RANGES)) {
      return 'vpn';
    }

    // Check hotspot ranges
    if (this.isInRange(ip, HOTSPOT_IP_RANGES)) {
      return 'hotspot';
    }

    // Heuristic: 192.168.x.x is usually WiFi
    if (ip.startsWith('192.168.')) {
      return 'wifi';
    }

    // Heuristic: 10.x.x.x is often corporate/ethernet
    if (ip.startsWith('10.')) {
      return 'ethernet';
    }

    // 172.16-31.x.x is usually corporate/ethernet
    if (ip.startsWith('172.')) {
      const second = parseInt(ip.split('.')[1] || '0', 10);
      if (second >= 16 && second <= 31) {
        return 'ethernet';
      }
    }

    return 'unknown';
  }

  /**
   * Check if IP is on local network
   */
  isLocalNetwork(ip: string): boolean {
    const classification = this.classifyIP(ip);
    return classification.isPrivate;
  }

  /**
   * Check if IP is a private address
   */
  isPrivateIP(ip: string): boolean {
    return this.classifyIP(ip).isPrivate;
  }

  /**
   * Check if IP is link-local (169.254.x.x)
   */
  isLinkLocal(ip: string): boolean {
    return this.classifyIP(ip).isLinkLocal;
  }

  /**
   * Get network subnet from IP
   */
  getSubnet(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) {return ip;}

    // Determine subnet based on private IP class
    if (ip.startsWith('10.')) {
      return `${parts[0]}.0.0.0/8`;
    } else if (ip.startsWith('172.')) {
      return `${parts[0]}.${parts[1]}.0.0/12`;
    } else if (ip.startsWith('192.168.')) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }

    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }

  /**
   * Clear cached interfaces
   */
  clearCache(): void {
    this.interfaces = [];
    this.lastScan = 0;
    this.preferredInterface = null;
  }

  // ============================================================================
  // WebRTC ICE Candidate Gathering
  // ============================================================================

  /**
   * Gather ICE candidates using RTCPeerConnection
   */
  private async gatherICECandidates(): Promise<RTCIceCandidate[]> {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      return [];
    }

    return new Promise((resolve) => {
      const candidates: RTCIceCandidate[] = [];
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      let timeout: ReturnType<typeof setTimeout>;

      // Collect candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          candidates.push(event.candidate);
        } else {
          // Gathering complete
          clearTimeout(timeout);
          pc.close();
          resolve(candidates);
        }
      };

      // Create dummy data channel to trigger ICE gathering
      pc.createDataChannel('discovery');

      // Create offer to start ICE gathering
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((error) => {
          secureLog.error('[InterfaceSelector] Failed to create offer:', error);
          pc.close();
          resolve(candidates);
        });

      // Timeout after 5 seconds
      timeout = setTimeout(() => {
        pc.close();
        resolve(candidates);
      }, 5000);
    });
  }

  /**
   * Process ICE candidates into network interfaces
   */
  private processICECandidates(candidates: RTCIceCandidate[]): NetworkInterface[] {
    const interfaces = new Map<string, NetworkInterface>();

    candidates.forEach((candidate) => {
      const parsed = this.parseICECandidate(candidate);
      if (!parsed) {return;}

      const { ip, type, protocol } = parsed;

      // Skip non-local IPs
      if (!this.isLocalNetwork(ip)) {return;}

      // Skip link-local unless it's the only option
      if (this.isLinkLocal(ip) && candidates.length > 1) {return;}

      // Detect network type
      const networkType = this.detectNetworkType(ip);

      // Generate interface name
      const name = this.generateInterfaceName(ip, networkType, type);

      // Don't override existing interfaces
      if (!interfaces.has(ip)) {
        interfaces.set(ip, {
          name,
          ip,
          type: networkType,
          isPreferred: false,
          isDefault: type === 'host',
        });
      }
    });

    return Array.from(interfaces.values());
  }

  /**
   * Parse ICE candidate string
   */
  private parseICECandidate(candidate: RTCIceCandidate): {
    ip: string;
    port: number;
    type: string;
    protocol: string;
  } | null {
    try {
      const parts = candidate.candidate.split(' ');
      if (parts.length < 8) {return null;}

      return {
        ip: parts[4] || '',
        port: parseInt(parts[5] || '0', 10),
        type: parts[7] || 'unknown',
        protocol: parts[2] || 'udp',
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate friendly interface name
   */
  private generateInterfaceName(
    ip: string,
    type: NetworkInterfaceType,
    candidateType: string
  ): string {
    const typeNames: Record<NetworkInterfaceType, string> = {
      wifi: 'Wi-Fi',
      ethernet: 'Ethernet',
      hotspot: 'Hotspot',
      vpn: 'VPN',
      unknown: 'Network',
    };

    const suffix = ip.split('.').slice(-2).join('.');
    return `${typeNames[type]} (${suffix})`;
  }

  // ============================================================================
  // Interface Selection Logic
  // ============================================================================

  /**
   * Select preferred interface based on heuristics
   */
  private selectPreferred(interfaces: NetworkInterface[]): NetworkInterface | null {
    if (interfaces.length === 0) {return null;}
    if (interfaces.length === 1) {
      interfaces[0]!.isPreferred = true;
      return interfaces[0]!;
    }

    // Priority: WiFi > Ethernet > Hotspot > VPN > Unknown
    const typePriority: Record<NetworkInterfaceType, number> = {
      wifi: 5,
      ethernet: 4,
      hotspot: 3,
      vpn: 2,
      unknown: 1,
    };

    // Sort by priority
    const sorted = [...interfaces].sort((a, b) => {
      // Prefer default route
      if (a.isDefault && !b.isDefault) {return -1;}
      if (!a.isDefault && b.isDefault) {return 1;}

      // Then by type priority
      return typePriority[b.type] - typePriority[a.type];
    });

    const preferred = sorted[0];
    if (preferred) {
      preferred.isPreferred = true;
    }

    return preferred || null;
  }

  // ============================================================================
  // IP Classification
  // ============================================================================

  /**
   * Classify an IP address
   */
  private classifyIP(ip: string): IPClassification {
    // Check loopback
    if (ip === '127.0.0.1' || ip.startsWith('127.')) {
      return {
        isPrivate: false,
        isLinkLocal: false,
        isLoopback: true,
        class: 'unknown',
      };
    }

    // Check link-local
    if (this.isIPInRange(ip, LINK_LOCAL_RANGE.start, LINK_LOCAL_RANGE.end)) {
      return {
        isPrivate: false,
        isLinkLocal: true,
        isLoopback: false,
        class: 'unknown',
      };
    }

    // Check private ranges
    if (this.isIPInRange(ip, PRIVATE_IP_RANGES.classA.start, PRIVATE_IP_RANGES.classA.end)) {
      return {
        isPrivate: true,
        isLinkLocal: false,
        isLoopback: false,
        class: 'A',
      };
    }

    if (this.isIPInRange(ip, PRIVATE_IP_RANGES.classB.start, PRIVATE_IP_RANGES.classB.end)) {
      return {
        isPrivate: true,
        isLinkLocal: false,
        isLoopback: false,
        class: 'B',
      };
    }

    if (this.isIPInRange(ip, PRIVATE_IP_RANGES.classC.start, PRIVATE_IP_RANGES.classC.end)) {
      return {
        isPrivate: true,
        isLinkLocal: false,
        isLoopback: false,
        class: 'C',
      };
    }

    return {
      isPrivate: false,
      isLinkLocal: false,
      isLoopback: false,
      class: 'unknown',
    };
  }

  /**
   * Check if IP is in a range
   */
  private isIPInRange(ip: string, start: string, end: string): boolean {
    const ipNum = this.ipToNumber(ip);
    const startNum = this.ipToNumber(start);
    const endNum = this.ipToNumber(end);

    return ipNum >= startNum && ipNum <= endNum;
  }

  /**
   * Check if IP is in any of the given ranges
   */
  private isInRange(ip: string, ranges: Array<{ start: string; end: string }>): boolean {
    return ranges.some((range) => this.isIPInRange(ip, range.start, range.end));
  }

  /**
   * Convert IP address to number for comparison
   */
  private ipToNumber(ip: string): number {
    const parts = ip.split('.');
    if (parts.length !== 4) {return 0;}

    return (
      (parseInt(parts[0] || '0', 10) << 24) +
      (parseInt(parts[1] || '0', 10) << 16) +
      (parseInt(parts[2] || '0', 10) << 8) +
      parseInt(parts[3] || '0', 10)
    ) >>> 0; // Convert to unsigned
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let interfaceSelectorInstance: NetworkInterfaceSelector | null = null;

/**
 * Get the singleton network interface selector
 */
export function getNetworkInterfaceSelector(): NetworkInterfaceSelector {
  if (!interfaceSelectorInstance) {
    interfaceSelectorInstance = new NetworkInterfaceSelector();
  }
  return interfaceSelectorInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick check if an IP is local/private
 */
export function isLocalIP(ip: string): boolean {
  return getNetworkInterfaceSelector().isLocalNetwork(ip);
}

/**
 * Get the best network interface for transfers
 */
export async function getBestInterface(): Promise<NetworkInterface | null> {
  const selector = getNetworkInterfaceSelector();
  await selector.getNetworkInterfaces();
  return selector.getPreferredInterface();
}

export default NetworkInterfaceSelector;
