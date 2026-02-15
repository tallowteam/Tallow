/**
 * UPnP / NAT-PMP Port Mapping
 * Agent 028 — FIREWALL-PIERCER
 *
 * Manages automatic port forwarding via UPnP IGD and NAT-PMP protocols.
 * In browser environments, this works through the relay server which
 * performs the actual UPnP operations on behalf of the client.
 */

export interface UPnPMapping {
  protocol: 'TCP' | 'UDP';
  externalPort: number;
  internalPort: number;
  internalClient: string;
  description: string;
  enabled: boolean;
  leaseDuration: number; // seconds, 0 = permanent
  createdAt: number;
}

export interface UPnPCapabilities {
  upnpAvailable: boolean;
  natPmpAvailable: boolean;
  externalAddress?: string;
  gatewayAddress?: string;
  supportedProtocols: string[];
  maxMappings: number;
}

export interface PortMappingRequest {
  protocol: 'TCP' | 'UDP';
  externalPort: number;
  internalPort: number;
  description?: string;
  leaseDuration?: number; // seconds, default 3600
}

export interface PortMappingResult {
  success: boolean;
  mapping?: UPnPMapping;
  error?: string;
  errorCode?: string;
  fallbackUsed?: 'NAT-PMP' | 'PCP';
}

export interface UPnPConfig {
  relayUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: Required<UPnPConfig> = {
  relayUrl: process.env.NEXT_PUBLIC_RELAY_URL || 'http://localhost:3001',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

class UPnPClient {
  private config: Required<UPnPConfig>;
  private activeMappings: Map<string, UPnPMapping>;
  private refreshIntervals: Map<string, NodeJS.Timeout>;

  constructor(config: UPnPConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.activeMappings = new Map();
    this.refreshIntervals = new Map();
  }

  /**
   * Check if UPnP/NAT-PMP is supported and get capabilities
   */
  async checkUPnPSupport(): Promise<UPnPCapabilities> {
    try {
      const response = await this.makeRequest('/api/upnp/capabilities', 'GET');
      return response as UPnPCapabilities;
    } catch (error) {
      console.error('[UPnP] Failed to check support:', error);
      return {
        upnpAvailable: false,
        natPmpAvailable: false,
        supportedProtocols: [],
        maxMappings: 0,
      };
    }
  }

  /**
   * Request a port mapping through the relay server
   */
  async requestPortMapping(request: PortMappingRequest): Promise<PortMappingResult> {
    const mappingKey = `${request.protocol}-${request.externalPort}`;

    try {
      const payload = {
        ...request,
        description: request.description || 'Tallow P2P Transfer',
        leaseDuration: request.leaseDuration || 3600,
      };

      const response = await this.makeRequest('/api/upnp/mapping', 'POST', payload);
      const result = response as PortMappingResult;

      if (result.success && result.mapping) {
        this.activeMappings.set(mappingKey, result.mapping);
        this.scheduleRefresh(mappingKey, result.mapping);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'REQUEST_FAILED',
      };
    }
  }

  /**
   * Remove a port mapping
   */
  async removePortMapping(protocol: 'TCP' | 'UDP', externalPort: number): Promise<boolean> {
    const mappingKey = `${protocol}-${externalPort}`;

    try {
      await this.makeRequest('/api/upnp/mapping', 'DELETE', {
        protocol,
        externalPort,
      });

      // Clear refresh interval and remove from active mappings
      const interval = this.refreshIntervals.get(mappingKey);
      if (interval) {
        clearInterval(interval);
        this.refreshIntervals.delete(mappingKey);
      }

      this.activeMappings.delete(mappingKey);
      return true;
    } catch (error) {
      console.error('[UPnP] Failed to remove mapping:', error);
      return false;
    }
  }

  /**
   * List all active port mappings
   */
  async listMappings(): Promise<UPnPMapping[]> {
    try {
      const response = await this.makeRequest('/api/upnp/mappings', 'GET');
      return (response as { mappings: UPnPMapping[] }).mappings || [];
    } catch (error) {
      console.error('[UPnP] Failed to list mappings:', error);
      return [];
    }
  }

  /**
   * Get the external IP address of the gateway
   */
  async getExternalAddress(): Promise<string | null> {
    try {
      const response = await this.makeRequest('/api/upnp/external-ip', 'GET');
      return (response as { externalAddress: string }).externalAddress || null;
    } catch (error) {
      console.error('[UPnP] Failed to get external address:', error);
      return null;
    }
  }

  /**
   * Cleanup all mappings and intervals
   */
  async cleanup(): Promise<void> {
    const mappingKeys = Array.from(this.activeMappings.keys());

    for (const key of mappingKeys) {
      const [protocol, port] = key.split('-');
      if (!protocol || !port) {
        continue;
      }
      await this.removePortMapping(protocol as 'TCP' | 'UDP', parseInt(port, 10));
    }
  }

  /**
   * Schedule periodic refresh of port mapping before lease expires
   */
  private scheduleRefresh(mappingKey: string, mapping: UPnPMapping): void {
    // Clear existing interval if any
    const existingInterval = this.refreshIntervals.get(mappingKey);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Don't schedule refresh for permanent mappings
    if (mapping.leaseDuration === 0) {
      return;
    }

    // Refresh at 80% of lease duration
    const refreshMs = (mapping.leaseDuration * 1000 * 0.8);

    const interval = setInterval(async () => {
      console.log(`[UPnP] Refreshing mapping: ${mappingKey}`);
      const [protocol, port] = mappingKey.split('-');
      if (!protocol || !port) {
        clearInterval(interval);
        this.refreshIntervals.delete(mappingKey);
        return;
      }

      const result = await this.requestPortMapping({
        protocol: protocol as 'TCP' | 'UDP',
        externalPort: parseInt(port, 10),
        internalPort: mapping.internalPort,
        description: mapping.description,
        leaseDuration: mapping.leaseDuration,
      });

      if (!result.success) {
        console.error(`[UPnP] Failed to refresh mapping: ${mappingKey}`, result.error);
        clearInterval(interval);
        this.refreshIntervals.delete(mappingKey);
      }
    }, refreshMs);

    this.refreshIntervals.set(mappingKey, interval);
  }

  /**
   * Make HTTP request to relay server with retry logic
   */
  private async makeRequest(
    path: string,
    method: 'GET' | 'POST' | 'DELETE',
    body?: unknown
  ): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const requestInit: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        };

        const response = await fetch(`${this.config.relayUrl}${path}`, requestInit);

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[UPnP] Request attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.config.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }
}

// Singleton instance
let upnpClient: UPnPClient | null = null;

/**
 * Get or create the UPnP client singleton
 */
export function getUPnPClient(config?: UPnPConfig): UPnPClient {
  if (!upnpClient) {
    upnpClient = new UPnPClient(config);
  }
  return upnpClient;
}

/**
 * Convenience functions using the singleton instance
 */
export async function checkUPnPSupport(): Promise<UPnPCapabilities> {
  return getUPnPClient().checkUPnPSupport();
}

export async function requestPortMapping(request: PortMappingRequest): Promise<PortMappingResult> {
  return getUPnPClient().requestPortMapping(request);
}

export async function removePortMapping(protocol: 'TCP' | 'UDP', externalPort: number): Promise<boolean> {
  return getUPnPClient().removePortMapping(protocol, externalPort);
}

export async function listMappings(): Promise<UPnPMapping[]> {
  return getUPnPClient().listMappings();
}

export async function getExternalAddress(): Promise<string | null> {
  return getUPnPClient().getExternalAddress();
}

export async function cleanupUPnP(): Promise<void> {
  if (upnpClient) {
    await upnpClient.cleanup();
    upnpClient = null;
  }
}
