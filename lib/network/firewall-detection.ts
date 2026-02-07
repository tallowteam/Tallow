'use client';

/**
 * Firewall Detection and User Guidance
 *
 * Detects firewall restrictions and provides user-friendly guidance for
 * optimal P2P connectivity. Tests multiple connection methods to determine
 * the network environment and suggest appropriate strategies.
 *
 * Tests performed:
 * - STUN connectivity (UDP to Google/Cloudflare STUN servers)
 * - WebSocket connectivity (to signaling server)
 * - TURN connectivity (TCP/TLS fallback)
 * - Direct P2P connection capability
 *
 * Features:
 * - Parallel test execution for faster detection
 * - Timeout protection (5 seconds per test)
 * - Detailed firewall classification
 * - User-friendly recommendations
 * - Caching to avoid repeated tests
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export type FirewallType = 'none' | 'moderate' | 'strict' | 'corporate';

export interface FirewallDetectionResult {
  stun: boolean;
  websocket: boolean;
  turn: boolean;
  directP2P: boolean;
  firewallType: FirewallType;
  recommendations: string[];
  detectionTime: number;
  timestamp: number;
}

export interface FirewallTestOptions {
  timeout?: number;
  stunServers?: string[];
  signalingServer?: string;
  turnServer?: string;
  skipCache?: boolean;
}

interface TestResult {
  success: boolean;
  time: number;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

// Default test timeout (5 seconds per test)
const DEFAULT_TIMEOUT = 5000;

// Default STUN servers for testing
const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

// Default signaling server (WebSocket)
const DEFAULT_SIGNALING_SERVER = 'wss://echo.websocket.org';

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// ============================================================================
// Cached Results
// ============================================================================

let cachedResult: FirewallDetectionResult | null = null;
let detectionInProgress: Promise<FirewallDetectionResult> | null = null;

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect firewall restrictions and classify network environment
 */
export async function detectFirewall(
  options: FirewallTestOptions = {}
): Promise<FirewallDetectionResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    stunServers = DEFAULT_STUN_SERVERS,
    signalingServer = DEFAULT_SIGNALING_SERVER,
    turnServer,
    skipCache = false,
  } = options;

  // Check cache first
  if (!skipCache && cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    secureLog.log('[Firewall Detection] Returning cached result');
    return cachedResult;
  }

  // If detection is already in progress, wait for it
  if (detectionInProgress) {
    secureLog.log('[Firewall Detection] Detection already in progress, waiting...');
    return detectionInProgress;
  }

  // Start new detection
  secureLog.log('[Firewall Detection] Starting new detection');
  detectionInProgress = performDetection(timeout, stunServers, signalingServer, turnServer);

  try {
    const result = await detectionInProgress;
    cachedResult = result;
    return result;
  } finally {
    detectionInProgress = null;
  }
}

async function performDetection(
  timeout: number,
  stunServers: string[],
  signalingServer: string,
  turnServer?: string
): Promise<FirewallDetectionResult> {
  const startTime = performance.now();

  // Run all tests in parallel for faster detection
  const [stunResult, websocketResult, turnResult, p2pResult] = await Promise.all([
    testSTUNConnectivity(stunServers, timeout),
    testWebSocketConnectivity(signalingServer, timeout),
    turnServer ? testTURNConnectivity(turnServer, timeout) : Promise.resolve({ success: false, time: 0 }),
    testDirectP2PCapability(stunServers, timeout),
  ]);

  const detectionTime = performance.now() - startTime;

  // Analyze results and classify firewall type
  const firewallType = classifyFirewallType(
    stunResult.success,
    websocketResult.success,
    turnResult.success,
    p2pResult.success
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    firewallType,
    stunResult.success,
    websocketResult.success,
    turnResult.success,
    p2pResult.success
  );

  const result: FirewallDetectionResult = {
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    directP2P: p2pResult.success,
    firewallType,
    recommendations,
    detectionTime: Math.round(detectionTime),
    timestamp: Date.now(),
  };

  secureLog.log('[Firewall Detection] Completed', {
    firewallType,
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    directP2P: p2pResult.success,
    time: `${detectionTime.toFixed(0)}ms`,
  });

  return result;
}

// ============================================================================
// Individual Test Functions
// ============================================================================

/**
 * Test STUN connectivity (UDP to public STUN servers)
 */
async function testSTUNConnectivity(
  stunServers: string[],
  timeout: number
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Check if RTCPeerConnection is available
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        error: 'RTCPeerConnection not available',
      };
    }

    const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));
    const pc = new RTCPeerConnection({ iceServers });

    let candidateFound = false;

    // Set up candidate collection
    const candidatePromise = new Promise<boolean>((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.type === 'srflx') {
          candidateFound = true;
          resolve(true);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          resolve(candidateFound);
        }
      };
    });

    // Create data channel to trigger ICE gathering
    pc.createDataChannel('stun-test');

    // Create offer to start gathering
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for candidates or timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);

    pc.close();

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      error: success ? undefined : 'No STUN candidates found',
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      error: error instanceof Error ? error.message : 'STUN test failed',
    };
  }
}

/**
 * Test WebSocket connectivity (to signaling server)
 */
async function testWebSocketConnectivity(
  signalingServer: string,
  timeout: number
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Check if WebSocket is available
    if (typeof WebSocket === 'undefined') {
      return {
        success: false,
        time: 0,
        error: 'WebSocket not available',
      };
    }

    const ws = new WebSocket(signalingServer);

    const connectionPromise = new Promise<boolean>((resolve) => {
      ws.onopen = () => {
        resolve(true);
        ws.close();
      };

      ws.onerror = () => {
        resolve(false);
      };

      ws.onclose = () => {
        resolve(false);
      };
    });

    // Wait for connection or timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
        resolve(false);
      }, timeout);
    });

    const success = await Promise.race([connectionPromise, timeoutPromise]);

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      error: success ? undefined : 'WebSocket connection failed',
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      error: error instanceof Error ? error.message : 'WebSocket test failed',
    };
  }
}

/**
 * Test TURN connectivity (TCP/TLS fallback)
 */
async function testTURNConnectivity(
  turnServer: string,
  timeout: number
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Check if RTCPeerConnection is available
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        error: 'RTCPeerConnection not available',
      };
    }

    const iceServers: RTCIceServer[] = [{ urls: turnServer }];
    const pc = new RTCPeerConnection({ iceServers });

    let relayCandidateFound = false;

    // Set up candidate collection
    const candidatePromise = new Promise<boolean>((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.type === 'relay') {
          relayCandidateFound = true;
          resolve(true);
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          resolve(relayCandidateFound);
        }
      };
    });

    // Create data channel to trigger ICE gathering
    pc.createDataChannel('turn-test');

    // Create offer to start gathering
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for candidates or timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);

    pc.close();

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      error: success ? undefined : 'No TURN relay candidates found',
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      error: error instanceof Error ? error.message : 'TURN test failed',
    };
  }
}

/**
 * Test direct P2P connection capability
 * This is a simplified test that checks if we can gather host and srflx candidates
 */
async function testDirectP2PCapability(
  stunServers: string[],
  timeout: number
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    // Check if RTCPeerConnection is available
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        error: 'RTCPeerConnection not available',
      };
    }

    const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));
    const pc = new RTCPeerConnection({ iceServers });

    let hostCandidateFound = false;
    let srflxCandidateFound = false;

    // Set up candidate collection
    const candidatePromise = new Promise<boolean>((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (event.candidate.type === 'host') {
            hostCandidateFound = true;
          } else if (event.candidate.type === 'srflx') {
            srflxCandidateFound = true;
          }

          // Direct P2P is likely if we have both host and srflx candidates
          if (hostCandidateFound && srflxCandidateFound) {
            resolve(true);
          }
        }
      };

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          resolve(hostCandidateFound && srflxCandidateFound);
        }
      };
    });

    // Create data channel to trigger ICE gathering
    pc.createDataChannel('p2p-test');

    // Create offer to start gathering
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for candidates or timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);

    pc.close();

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      error: success ? undefined : 'Direct P2P not available',
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      error: error instanceof Error ? error.message : 'P2P test failed',
    };
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Classify firewall type based on test results
 */
function classifyFirewallType(
  stun: boolean,
  websocket: boolean,
  turn: boolean,
  directP2P: boolean
): FirewallType {
  // All tests passed = no firewall restrictions
  if (stun && websocket && directP2P) {
    return 'none';
  }

  // Only HTTPS/WSS works = corporate firewall
  if (!stun && websocket && !directP2P) {
    return 'corporate';
  }

  // STUN works but P2P is problematic = strict firewall
  if (stun && !directP2P) {
    return 'strict';
  }

  // Some things work but not everything = moderate firewall
  if (stun || websocket || turn) {
    return 'moderate';
  }

  // Nothing works = strict firewall (likely corporate)
  return 'strict';
}

/**
 * Generate user-friendly recommendations based on firewall type
 */
function generateRecommendations(
  firewallType: FirewallType,
  stun: boolean,
  websocket: boolean,
  turn: boolean,
  directP2P: boolean
): string[] {
  const recommendations: string[] = [];

  switch (firewallType) {
    case 'none':
      recommendations.push('Your network is optimal for direct P2P transfers');
      recommendations.push('Files will transfer at maximum speed with end-to-end encryption');
      break;

    case 'moderate':
      recommendations.push('Some connections may require relay servers');
      if (!directP2P) {
        recommendations.push('For best performance, connect both devices to the same WiFi network');
      }
      if (websocket) {
        recommendations.push('Signaling works well - connection setup should be reliable');
      }
      break;

    case 'strict':
      recommendations.push('Your firewall blocks most direct connections');
      recommendations.push('Transfers will use encrypted relay servers for connectivity');
      if (!stun && websocket) {
        recommendations.push('UDP is blocked - only TCP/TLS connections are available');
      }
      if (!websocket) {
        recommendations.push('Consider checking firewall settings or using a different network');
      }
      break;

    case 'corporate':
      recommendations.push('Corporate firewall detected - only HTTPS connections allowed');
      recommendations.push('All transfers will use secure relay servers over HTTPS');
      recommendations.push('Contact your IT department if you need direct P2P access');
      break;
  }

  // Add specific recommendations based on individual test results
  if (!stun && directP2P) {
    recommendations.push('STUN servers are blocked but local connections may still work');
  }

  if (turn) {
    recommendations.push('TURN relay server is available for reliable fallback');
  }

  return recommendations;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get user-friendly guidance message for firewall type
 */
export function getGuidance(result: FirewallDetectionResult): string {
  switch (result.firewallType) {
    case 'none':
      return 'Your connection is optimal for P2P transfers';
    case 'moderate':
      return 'Some connections may use relay servers. Try connecting to the same WiFi network.';
    case 'strict':
      return 'Your firewall blocks direct connections. Transfers will use encrypted relay servers.';
    case 'corporate':
      return 'Corporate firewall detected. Only HTTPS relay connections are available.';
    default:
      return 'Connection status unknown. Testing...';
  }
}

/**
 * Get icon name for firewall status (for UI display)
 */
export function getFirewallStatusIcon(firewallType: FirewallType): {
  icon: string;
  color: 'green' | 'yellow' | 'red';
} {
  switch (firewallType) {
    case 'none':
      return { icon: 'check', color: 'green' };
    case 'moderate':
      return { icon: 'warning', color: 'yellow' };
    case 'strict':
    case 'corporate':
      return { icon: 'shield', color: 'red' };
  }
}

/**
 * Clear cached detection result (force re-detection)
 */
export function clearFirewallCache(): void {
  cachedResult = null;
  secureLog.log('[Firewall Detection] Cache cleared');
}

/**
 * Get cached result if available
 */
export function getCachedResult(): FirewallDetectionResult | null {
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult;
  }
  return null;
}

/**
 * Check if a re-detection is recommended
 * (e.g., if network may have changed)
 */
export function shouldRedetect(): boolean {
  if (!cachedResult) {
    return true;
  }

  // Re-detect after cache expires
  return Date.now() - cachedResult.timestamp >= CACHE_DURATION;
}

// ============================================================================
// Export
// ============================================================================

export default {
  detectFirewall,
  getGuidance,
  getFirewallStatusIcon,
  clearFirewallCache,
  getCachedResult,
  shouldRedetect,
};
