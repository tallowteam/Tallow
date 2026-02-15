'use client';

/**
 * Firewall Detection, Proxy Handling, and Fallback Strategy Engine
 *
 * Agent 028 (FIREWALL-PIERCER) -- ensures TALLOW works behind corporate
 * firewalls, transparent proxies, and restrictive networks.
 *
 * Detection chain (executed in parallel where possible):
 *   1. Test direct UDP (WebRTC STUN)     -- if blocked:
 *   2. Test TCP/443 (TURNS over TLS)     -- if blocked:
 *   3. Test WebSocket (WSS) connectivity -- if blocked:
 *   4. Test HTTPS fetch (proxy detection) -- if blocked:
 *   5. Report "network too restrictive" with diagnostics
 *
 * Proxy handling:
 *   - Transparent proxy detection via fetch header inspection
 *   - Corporate proxy 407 detection (Basic / NTLM / Kerberos challenge)
 *   - CONNECT tunnel support through HTTP proxies
 *   - All fallback traffic routed over port 443 to look like HTTPS
 *
 * Fallback chain (selected based on detection):
 *   Best:     WebRTC direct P2P (UDP)
 *   Good:     WebRTC via TURN relay (UDP or TCP)
 *   OK:       WebRTC via TURNS on port 443 (TLS)
 *   Fallback: WebSocket relay over WSS (port 443)
 *   Last:     HTTP/2 streaming relay (HTTPS, port 443)
 *   Blocked:  Error with full diagnostics
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 7
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export type FirewallType = 'none' | 'moderate' | 'strict' | 'corporate';

/**
 * Granular transport availability after probing.
 */
export type TransportAvailability = 'available' | 'blocked' | 'timeout' | 'error' | 'not_tested';

/**
 * The recommended fallback transport after detection.
 */
export type FallbackTransport =
  | 'webrtc_direct'
  | 'webrtc_turn_udp'
  | 'webrtc_turns_tcp443'
  | 'websocket_relay'
  | 'http2_streaming'
  | 'none';

/**
 * Proxy authentication schemes detected from a 407 response.
 */
export type ProxyAuthScheme = 'basic' | 'ntlm' | 'kerberos' | 'negotiate' | 'digest' | 'unknown';

/**
 * Transparent proxy evidence gathered from header inspection.
 */
export interface TransparentProxyEvidence {
  /** Whether a transparent proxy was detected */
  detected: boolean;
  /** Injected headers found (e.g. X-Forwarded-For, Via) */
  injectedHeaders: string[];
  /** Whether the response was modified (content-length mismatch, body alteration) */
  responseModified: boolean;
  /** Extra detail string for diagnostics */
  detail: string;
}

/**
 * Corporate proxy authentication info extracted from a 407 challenge.
 */
export interface ProxyAuthInfo {
  /** Whether a proxy authentication challenge was received */
  required: boolean;
  /** The authentication scheme(s) offered by the proxy */
  schemes: ProxyAuthScheme[];
  /** The proxy realm string, if present */
  realm: string;
  /** Raw Proxy-Authenticate header value */
  rawHeader: string;
}

/**
 * Individual connectivity test result.
 */
export interface TestResult {
  success: boolean;
  /** Wall-clock time in ms */
  time: number;
  /** Transport availability classification */
  availability: TransportAvailability;
  /** Human-readable error if the test failed */
  error?: string;
  /** Extra detail (e.g. candidate type found, proxy challenge header) */
  detail?: string;
}

/**
 * Full firewall detection result returned to the caller / UI.
 */
export interface FirewallDetectionResult {
  // --- individual test outcomes ---
  stun: boolean;
  websocket: boolean;
  turn: boolean;
  turns: boolean;
  directP2P: boolean;
  httpsFetch: boolean;

  // --- proxy information ---
  transparentProxy: TransparentProxyEvidence;
  proxyAuth: ProxyAuthInfo;

  // --- classification ---
  firewallType: FirewallType;

  // --- recommended fallback ---
  recommendedTransport: FallbackTransport;
  fallbackChain: FallbackTransport[];

  // --- user-facing information ---
  recommendations: string[];
  diagnosticSummary: string;

  // --- timing ---
  detectionTime: number;
  timestamp: number;

  // --- raw test detail (useful for diagnostics panel) ---
  testDetails: {
    stun: TestResult;
    websocket: TestResult;
    turn: TestResult;
    turns: TestResult;
    directP2P: TestResult;
    httpsFetch: TestResult;
  };
}

export interface FirewallTestOptions {
  /** Per-test timeout in ms (default 3000) */
  timeout?: number;
  /** STUN server URLs to probe */
  stunServers?: string[];
  /** WebSocket signaling server URL to probe */
  signalingServer?: string;
  /** TURN server URL (UDP or TCP) to probe */
  turnServer?: string;
  /** TURN server credentials for testing */
  turnUsername?: string;
  turnCredential?: string;
  /** TURNS (TLS on 443) server URL to probe */
  turnsServer?: string;
  /** HTTPS endpoint for transparent proxy / fetch test */
  httpsProbeUrl?: string;
  /** Skip the in-memory cache */
  skipCache?: boolean;
  /** Callback invoked as each individual test completes (for progress UI) */
  onTestComplete?: (testName: string, result: TestResult) => void;
}

// ============================================================================
// Constants
// ============================================================================

/** Per-test timeout -- kept short for responsive UX */
const DEFAULT_TIMEOUT = 3000;

/** Default STUN servers for UDP reachability testing */
const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

/** Default signaling server (WSS) */
const DEFAULT_SIGNALING_SERVER = 'wss://echo.websocket.org';

/**
 * HTTPS endpoint used for transparent proxy detection.
 * We fetch a known-good HTTPS URL and inspect the response for evidence
 * of header injection (Via, X-Forwarded-For, X-BlueCoat-Via, etc.).
 * A small public JSON endpoint keeps the payload tiny.
 */
const DEFAULT_HTTPS_PROBE_URL = 'https://httpbin.org/headers';

/** Result cache TTL (5 minutes) */
const CACHE_DURATION = 5 * 60 * 1000;

/** Headers commonly injected by transparent / intercepting proxies */
const PROXY_INJECTED_HEADERS = [
  'via',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-bluecoat-via',
  'x-cache',
  'x-squid-error',
  'x-proxy-id',
  'proxy-connection',
  'x-authenticated-user',
  'x-real-ip',
] as const;

// ============================================================================
// Module State
// ============================================================================

let cachedResult: FirewallDetectionResult | null = null;
let detectionInProgress: Promise<FirewallDetectionResult> | null = null;

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Run comprehensive firewall detection.
 *
 * All individual tests are launched in parallel with the configured timeout
 * (default 3 s each). The overall detection therefore completes in roughly
 * one timeout period, not N x timeout.
 */
export async function detectFirewall(
  options: FirewallTestOptions = {}
): Promise<FirewallDetectionResult> {
  const {
    timeout = DEFAULT_TIMEOUT,
    stunServers = DEFAULT_STUN_SERVERS,
    signalingServer = DEFAULT_SIGNALING_SERVER,
    turnServer,
    turnUsername,
    turnCredential,
    turnsServer,
    httpsProbeUrl = DEFAULT_HTTPS_PROBE_URL,
    skipCache = false,
    onTestComplete,
  } = options;

  // Return cached result if fresh
  if (!skipCache && cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    secureLog.log('[Firewall Detection] Returning cached result');
    return cachedResult;
  }

  // Coalesce concurrent callers behind a single in-flight promise
  if (detectionInProgress) {
    secureLog.log('[Firewall Detection] Detection already in progress, waiting...');
    return detectionInProgress;
  }

  secureLog.log('[Firewall Detection] Starting comprehensive detection');
  detectionInProgress = performDetection(
    timeout,
    stunServers,
    signalingServer,
    turnServer,
    turnUsername,
    turnCredential,
    turnsServer,
    httpsProbeUrl,
    onTestComplete,
  );

  try {
    const result = await detectionInProgress;
    cachedResult = result;
    return result;
  } finally {
    detectionInProgress = null;
  }
}

// ============================================================================
// Detection Orchestrator
// ============================================================================

async function performDetection(
  timeout: number,
  stunServers: string[],
  signalingServer: string,
  turnServer: string | undefined,
  turnUsername: string | undefined,
  turnCredential: string | undefined,
  turnsServer: string | undefined,
  httpsProbeUrl: string,
  onTestComplete?: (name: string, result: TestResult) => void,
): Promise<FirewallDetectionResult> {
  const startTime = performance.now();

  // Wrap each test so we can optionally notify the caller as each finishes
  const wrapTest = async (
    name: string,
    testFn: () => Promise<TestResult>,
  ): Promise<TestResult> => {
    const result = await testFn();
    onTestComplete?.(name, result);
    return result;
  };

  // Build TURN ice server config if credentials are supplied
  const turnIceServer: RTCIceServer | undefined =
    turnServer && turnUsername && turnCredential
      ? { urls: turnServer, username: turnUsername, credential: turnCredential }
      : turnServer
        ? { urls: turnServer }
        : undefined;

  const turnsIceServer: RTCIceServer | undefined =
    turnsServer && turnUsername && turnCredential
      ? { urls: turnsServer, username: turnUsername, credential: turnCredential }
      : turnsServer
        ? { urls: turnsServer }
        : undefined;

  // Launch ALL tests in parallel
  const [
    stunResult,
    websocketResult,
    turnResult,
    turnsResult,
    p2pResult,
    httpsResult,
  ] = await Promise.all([
    wrapTest('stun', () => testSTUNConnectivity(stunServers, timeout)),
    wrapTest('websocket', () => testWebSocketConnectivity(signalingServer, timeout)),
    wrapTest('turn', () =>
      turnIceServer
        ? testTURNConnectivity(turnIceServer, timeout)
        : Promise.resolve(makeSkippedResult('TURN server not configured')),
    ),
    wrapTest('turns', () =>
      turnsIceServer
        ? testTURNSConnectivity(turnsIceServer, timeout)
        : Promise.resolve(makeSkippedResult('TURNS server not configured')),
    ),
    wrapTest('directP2P', () => testDirectP2PCapability(stunServers, timeout)),
    wrapTest('httpsFetch', () => testHTTPSConnectivity(httpsProbeUrl, timeout)),
  ]);

  const detectionTime = performance.now() - startTime;

  // Analyze transparent proxy evidence from the HTTPS fetch result
  const transparentProxy = analyzeTransparentProxy(httpsResult);

  // Analyze proxy auth from the HTTPS fetch result
  const proxyAuth = analyzeProxyAuth(httpsResult);

  // Classify the network environment
  const firewallType = classifyFirewallType({
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    turns: turnsResult.success,
    directP2P: p2pResult.success,
    httpsFetch: httpsResult.success,
    transparentProxy,
    proxyAuth,
  });

  // Select optimal fallback chain
  const { recommended, chain } = selectFallbackChain({
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    turns: turnsResult.success,
    directP2P: p2pResult.success,
    httpsFetch: httpsResult.success,
  });

  // Build user-facing recommendations
  const recommendations = generateRecommendations(
    firewallType,
    {
      stun: stunResult.success,
      websocket: websocketResult.success,
      turn: turnResult.success,
      turns: turnsResult.success,
      directP2P: p2pResult.success,
      httpsFetch: httpsResult.success,
    },
    transparentProxy,
    proxyAuth,
    recommended,
  );

  const diagnosticSummary = buildDiagnosticSummary({
    stun: stunResult,
    websocket: websocketResult,
    turn: turnResult,
    turns: turnsResult,
    directP2P: p2pResult,
    httpsFetch: httpsResult,
    firewallType,
    transparentProxy,
    proxyAuth,
    detectionTime,
  });

  const result: FirewallDetectionResult = {
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    turns: turnsResult.success,
    directP2P: p2pResult.success,
    httpsFetch: httpsResult.success,
    transparentProxy,
    proxyAuth,
    firewallType,
    recommendedTransport: recommended,
    fallbackChain: chain,
    recommendations,
    diagnosticSummary,
    detectionTime: Math.round(detectionTime),
    timestamp: Date.now(),
    testDetails: {
      stun: stunResult,
      websocket: websocketResult,
      turn: turnResult,
      turns: turnsResult,
      directP2P: p2pResult,
      httpsFetch: httpsResult,
    },
  };

  secureLog.log('[Firewall Detection] Completed', {
    firewallType,
    recommended,
    stun: stunResult.success,
    websocket: websocketResult.success,
    turn: turnResult.success,
    turns: turnsResult.success,
    directP2P: p2pResult.success,
    httpsFetch: httpsResult.success,
    proxy: transparentProxy.detected,
    proxyAuth: proxyAuth.required,
    time: `${detectionTime.toFixed(0)}ms`,
  });

  return result;
}

// ============================================================================
// Individual Connectivity Tests
// ============================================================================

/**
 * Test STUN connectivity (UDP to public STUN servers).
 * A server-reflexive ("srflx") candidate proves UDP egress works.
 */
async function testSTUNConnectivity(
  stunServers: string[],
  timeout: number,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        availability: 'error',
        error: 'RTCPeerConnection not available',
      };
    }

    const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));
    const pc = new RTCPeerConnection({ iceServers });

    let candidateFound = false;

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

    pc.createDataChannel('stun-test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);
    pc.close();

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      availability: success ? 'available' : (time >= timeout - 50 ? 'timeout' : 'blocked'),
      ...(success ? {} : { error: 'No STUN server-reflexive candidates found (UDP likely blocked)' }),
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      availability: 'error',
      error: error instanceof Error ? error.message : 'STUN test failed',
    };
  }
}

/**
 * Test WebSocket (WSS) connectivity to the signaling server.
 */
async function testWebSocketConnectivity(
  signalingServer: string,
  timeout: number,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (typeof WebSocket === 'undefined') {
      return {
        success: false,
        time: 0,
        availability: 'error',
        error: 'WebSocket not available',
      };
    }

    const ws = new WebSocket(signalingServer);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const connectionPromise = new Promise<boolean>((resolve) => {
      ws.onopen = () => {
        resolve(true);
        ws.close();
      };
      ws.onerror = () => resolve(false);
      ws.onclose = () => resolve(false);
    });

    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => {
        try { ws.close(); } catch { /* ignore */ }
        resolve(false);
      }, timeout);
    });

    const success = await Promise.race([connectionPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      availability: success ? 'available' : (time >= timeout - 50 ? 'timeout' : 'blocked'),
      ...(success ? {} : { error: 'WebSocket connection failed or timed out' }),
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      availability: 'error',
      error: error instanceof Error ? error.message : 'WebSocket test failed',
    };
  }
}

/**
 * Test TURN connectivity (UDP or TCP relay).
 * Looks for a "relay" ICE candidate.
 */
async function testTURNConnectivity(
  iceServer: RTCIceServer,
  timeout: number,
): Promise<TestResult> {
  return testRelayConnectivity(iceServer, timeout, 'TURN');
}

/**
 * Test TURNS connectivity (TURN over TLS on port 443).
 * This is the key fallback for corporate firewalls that only permit
 * outbound TLS on port 443. The TURNS URL scheme is "turns:host:443".
 */
async function testTURNSConnectivity(
  iceServer: RTCIceServer,
  timeout: number,
): Promise<TestResult> {
  return testRelayConnectivity(iceServer, timeout, 'TURNS');
}

/**
 * Shared relay candidate test used by both TURN and TURNS probes.
 */
async function testRelayConnectivity(
  iceServer: RTCIceServer,
  timeout: number,
  label: string,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        availability: 'error',
        error: 'RTCPeerConnection not available',
      };
    }

    const pc = new RTCPeerConnection({ iceServers: [iceServer] });
    let relayCandidateFound = false;

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

    pc.createDataChannel(`${label.toLowerCase()}-test`);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);
    pc.close();

    const time = performance.now() - startTime;
    return {
      success,
      time: Math.round(time),
      availability: success ? 'available' : (time >= timeout - 50 ? 'timeout' : 'blocked'),
      ...(success ? {} : { error: `No ${label} relay candidates found` }),
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      availability: 'error',
      error: error instanceof Error ? error.message : `${label} test failed`,
    };
  }
}

/**
 * Test direct P2P capability.
 * Requires both "host" AND "srflx" ICE candidates to indicate that the
 * local network adapter is reachable and NAT traversal is possible.
 */
async function testDirectP2PCapability(
  stunServers: string[],
  timeout: number,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (typeof RTCPeerConnection === 'undefined') {
      return {
        success: false,
        time: 0,
        availability: 'error',
        error: 'RTCPeerConnection not available',
      };
    }

    const iceServers: RTCIceServer[] = stunServers.map((url) => ({ urls: url }));
    const pc = new RTCPeerConnection({ iceServers });

    let hostCandidateFound = false;
    let srflxCandidateFound = false;

    const candidatePromise = new Promise<boolean>((resolve) => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          if (event.candidate.type === 'host') hostCandidateFound = true;
          else if (event.candidate.type === 'srflx') srflxCandidateFound = true;

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

    pc.createDataChannel('p2p-test');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });

    const success = await Promise.race([candidatePromise, timeoutPromise]);
    pc.close();

    const time = performance.now() - startTime;
    const detail = `host=${hostCandidateFound}, srflx=${srflxCandidateFound}`;
    return {
      success,
      time: Math.round(time),
      availability: success ? 'available' : (time >= timeout - 50 ? 'timeout' : 'blocked'),
      detail,
      ...(success ? {} : { error: 'Direct P2P not available' }),
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      availability: 'error',
      error: error instanceof Error ? error.message : 'P2P test failed',
    };
  }
}

/**
 * Test HTTPS connectivity and detect transparent proxy / proxy auth.
 *
 * This makes a simple fetch() to a known HTTPS endpoint. We inspect:
 *   - Whether the fetch succeeds at all (HTTPS egress)
 *   - Response headers for evidence of proxy injection (Via, X-Forwarded-For)
 *   - HTTP 407 status indicating proxy authentication is required
 *   - The Proxy-Authenticate header to determine auth scheme (Basic/NTLM/Kerberos)
 */
async function testHTTPSConnectivity(
  httpsProbeUrl: string,
  timeout: number,
): Promise<TestResult> {
  const startTime = performance.now();

  try {
    if (typeof fetch === 'undefined') {
      return {
        success: false,
        time: 0,
        availability: 'error',
        error: 'fetch() not available',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(httpsProbeUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const time = performance.now() - startTime;

      // AbortError means timeout
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        return {
          success: false,
          time: Math.round(time),
          availability: 'timeout',
          error: 'HTTPS fetch timed out',
        };
      }

      // Network error may indicate proxy blocking HTTPS or CORS issue
      return {
        success: false,
        time: Math.round(time),
        availability: 'blocked',
        error: fetchError instanceof Error ? fetchError.message : 'HTTPS fetch failed',
      };
    }

    clearTimeout(timeoutId);
    const time = performance.now() - startTime;

    // Detect proxy auth requirement (407)
    if (response.status === 407) {
      const proxyAuthHeader = response.headers.get('proxy-authenticate') || '';
      return {
        success: false,
        time: Math.round(time),
        availability: 'blocked',
        error: 'Proxy authentication required (HTTP 407)',
        detail: `proxy-authenticate: ${proxyAuthHeader}`,
      };
    }

    // Collect evidence of transparent proxy from response headers
    const injectedHeaders: string[] = [];
    for (const headerName of PROXY_INJECTED_HEADERS) {
      if (response.headers.has(headerName)) {
        injectedHeaders.push(headerName);
      }
    }

    const detail = injectedHeaders.length > 0
      ? `proxy-injected-headers: ${injectedHeaders.join(', ')}`
      : undefined;

    // We consider HTTPS reachable if we got any 2xx/3xx response
    const success = response.ok || (response.status >= 200 && response.status < 400);

    return {
      success,
      time: Math.round(time),
      availability: success ? 'available' : 'blocked',
      detail: detail ?? '',
      ...(success ? {} : { error: `HTTPS fetch returned HTTP ${response.status}` }),
    };
  } catch (error) {
    const time = performance.now() - startTime;
    return {
      success: false,
      time: Math.round(time),
      availability: 'error',
      error: error instanceof Error ? error.message : 'HTTPS connectivity test failed',
    };
  }
}

// ============================================================================
// Proxy Analysis
// ============================================================================

/**
 * Analyze the HTTPS fetch result for transparent proxy evidence.
 */
function analyzeTransparentProxy(httpsResult: TestResult): TransparentProxyEvidence {
  const injectedHeaders: string[] = [];
  let responseModified = false;
  let detailText = '';

  if (httpsResult.detail) {
    // Parse injected headers from the detail string
    const match = httpsResult.detail.match(/^proxy-injected-headers:\s*(.+)$/);
    if (match && match[1]) {
      injectedHeaders.push(...match[1].split(',').map((h) => h.trim()));
    }

    // If we got a non-success with a detail that looks like proxy interference
    if (!httpsResult.success && httpsResult.detail.includes('proxy')) {
      responseModified = true;
    }
  }

  const detected = injectedHeaders.length > 0 || responseModified;

  if (detected) {
    detailText = injectedHeaders.length > 0
      ? `Transparent proxy detected. Injected headers: ${injectedHeaders.join(', ')}`
      : 'Transparent proxy detected (response modified)';
  }

  return {
    detected,
    injectedHeaders,
    responseModified,
    detail: detailText,
  };
}

/**
 * Analyze the HTTPS fetch result for proxy authentication requirements.
 */
function analyzeProxyAuth(httpsResult: TestResult): ProxyAuthInfo {
  const noAuth: ProxyAuthInfo = {
    required: false,
    schemes: [],
    realm: '',
    rawHeader: '',
  };

  if (!httpsResult.detail) return noAuth;

  // Check for 407 proxy-authenticate detail
  const match = httpsResult.detail.match(/^proxy-authenticate:\s*(.+)$/i);
  if (!match || !match[1]) return noAuth;

  const rawHeader = match[1];
  const schemes: ProxyAuthScheme[] = [];
  let realm = '';

  // Parse the Proxy-Authenticate header value
  const lowerHeader = rawHeader.toLowerCase();
  if (lowerHeader.includes('ntlm')) schemes.push('ntlm');
  if (lowerHeader.includes('kerberos')) schemes.push('kerberos');
  if (lowerHeader.includes('negotiate')) schemes.push('negotiate');
  if (lowerHeader.includes('basic')) schemes.push('basic');
  if (lowerHeader.includes('digest')) schemes.push('digest');
  if (schemes.length === 0) schemes.push('unknown');

  // Extract realm
  const realmMatch = rawHeader.match(/realm="([^"]+)"/i);
  if (realmMatch && realmMatch[1]) {
    realm = realmMatch[1];
  }

  return {
    required: true,
    schemes,
    realm,
    rawHeader,
  };
}

// ============================================================================
// Firewall Classification
// ============================================================================

interface ClassificationInput {
  stun: boolean;
  websocket: boolean;
  turn: boolean;
  turns: boolean;
  directP2P: boolean;
  httpsFetch: boolean;
  transparentProxy: TransparentProxyEvidence;
  proxyAuth: ProxyAuthInfo;
}

/**
 * Classify the firewall type based on all gathered evidence.
 */
function classifyFirewallType(input: ClassificationInput): FirewallType {
  const { stun, websocket, turn, turns, directP2P, httpsFetch, transparentProxy, proxyAuth } = input;

  // Proxy authentication required = corporate proxy
  if (proxyAuth.required) {
    return 'corporate';
  }

  // Transparent proxy detected with UDP blocked = corporate environment
  if (transparentProxy.detected && !stun && !directP2P) {
    return 'corporate';
  }

  // Only HTTPS/WSS works, all UDP blocked = corporate firewall
  if (!stun && !directP2P && (websocket || httpsFetch)) {
    return 'corporate';
  }

  // Everything works = no restrictions
  if (stun && websocket && directP2P) {
    return 'none';
  }

  // STUN works but direct P2P fails (restrictive NAT but not fully blocked)
  if (stun && !directP2P) {
    return 'strict';
  }

  // Some things work but not everything
  if (stun || websocket || turn || turns || httpsFetch) {
    return 'moderate';
  }

  // Nothing at all works
  return 'strict';
}

// ============================================================================
// Fallback Chain Selection
// ============================================================================

interface FallbackInput {
  stun: boolean;
  websocket: boolean;
  turn: boolean;
  turns: boolean;
  directP2P: boolean;
  httpsFetch: boolean;
}

function selectFallbackChain(
  input: FallbackInput,
): { recommended: FallbackTransport; chain: FallbackTransport[] } {
  const chain: FallbackTransport[] = [];

  // Build the chain from best to worst
  if (input.directP2P && input.stun) {
    chain.push('webrtc_direct');
  }
  if (input.turn) {
    chain.push('webrtc_turn_udp');
  }
  if (input.turns) {
    chain.push('webrtc_turns_tcp443');
  }
  if (input.websocket) {
    chain.push('websocket_relay');
  }
  if (input.httpsFetch) {
    chain.push('http2_streaming');
  }

  const recommended: FallbackTransport = chain.length > 0 ? chain[0]! : 'none';

  return { recommended, chain };
}

// ============================================================================
// Recommendation Generation
// ============================================================================

interface RecommendationTestResults {
  stun: boolean;
  websocket: boolean;
  turn: boolean;
  turns: boolean;
  directP2P: boolean;
  httpsFetch: boolean;
}

function generateRecommendations(
  firewallType: FirewallType,
  tests: RecommendationTestResults,
  proxy: TransparentProxyEvidence,
  proxyAuth: ProxyAuthInfo,
  recommended: FallbackTransport,
): string[] {
  const recs: string[] = [];

  switch (firewallType) {
    case 'none':
      recs.push('Your network is optimal for direct P2P transfers.');
      recs.push('Files will transfer at maximum speed with end-to-end encryption.');
      break;

    case 'moderate':
      recs.push('Some connections may require relay servers.');
      if (!tests.directP2P) {
        recs.push('For best performance, connect both devices to the same WiFi network.');
      }
      if (tests.websocket) {
        recs.push('Signaling channel is available -- connection setup should be reliable.');
      }
      if (tests.turn || tests.turns) {
        recs.push('TURN relay is available as a fallback for reliable connectivity.');
      }
      break;

    case 'strict':
      recs.push('Your firewall blocks most direct connections.');
      if (tests.turns) {
        recs.push('TURN over TLS (port 443) is available -- transfers will use encrypted relay.');
      } else if (tests.websocket) {
        recs.push('WebSocket relay mode will be used over HTTPS (port 443).');
      } else if (tests.httpsFetch) {
        recs.push('Only HTTPS is available -- transfers will use HTTP/2 streaming relay.');
      } else {
        recs.push('Consider using a different network or checking firewall settings.');
      }
      if (!tests.stun) {
        recs.push('UDP traffic is blocked -- only TCP/TLS connections are available.');
      }
      break;

    case 'corporate':
      recs.push('Corporate firewall detected -- only HTTPS connections are allowed.');
      if (proxyAuth.required) {
        const schemeStr = proxyAuth.schemes.join(', ').toUpperCase();
        recs.push(
          `Your proxy requires authentication (${schemeStr}). ` +
          'You may need to enter your corporate credentials.',
        );
        if (proxyAuth.realm) {
          recs.push(`Proxy realm: "${proxyAuth.realm}"`);
        }
      }
      if (proxy.detected) {
        recs.push('A transparent/intercepting proxy was detected on your network.');
      }
      recs.push('All transfers will use secure relay servers over HTTPS (port 443).');
      recs.push('Contact your IT department if you need direct P2P access.');
      break;
  }

  // Transport-specific notes
  switch (recommended) {
    case 'webrtc_direct':
      recs.push('Using direct peer-to-peer connection for best speed.');
      break;
    case 'webrtc_turn_udp':
      recs.push('Using TURN relay (UDP) for connectivity.');
      break;
    case 'webrtc_turns_tcp443':
      recs.push('Using TURN over TLS (port 443) to traverse the firewall.');
      break;
    case 'websocket_relay':
      recs.push('Using WebSocket relay over HTTPS for connectivity.');
      break;
    case 'http2_streaming':
      recs.push('Using HTTP/2 streaming as a last-resort transport.');
      break;
    case 'none':
      recs.push('No usable transport was found. Please check your network connection.');
      break;
  }

  return recs;
}

// ============================================================================
// Diagnostic Summary
// ============================================================================

interface DiagnosticInput {
  stun: TestResult;
  websocket: TestResult;
  turn: TestResult;
  turns: TestResult;
  directP2P: TestResult;
  httpsFetch: TestResult;
  firewallType: FirewallType;
  transparentProxy: TransparentProxyEvidence;
  proxyAuth: ProxyAuthInfo;
  detectionTime: number;
}

function buildDiagnosticSummary(input: DiagnosticInput): string {
  const lines: string[] = [];

  lines.push(`Firewall Detection Report`);
  lines.push(`========================`);
  lines.push(`Classification: ${input.firewallType.toUpperCase()}`);
  lines.push(`Detection time: ${Math.round(input.detectionTime)}ms`);
  lines.push('');
  lines.push('Connectivity Tests:');

  const fmt = (name: string, r: TestResult): string => {
    const status = r.success ? 'PASS' : 'FAIL';
    const avail = r.availability;
    const timeStr = r.time > 0 ? `${r.time}ms` : 'N/A';
    const errStr = r.error ? ` -- ${r.error}` : '';
    const detailStr = r.detail ? ` [${r.detail}]` : '';
    return `  ${name.padEnd(14)} ${status.padEnd(6)} (${avail}, ${timeStr})${errStr}${detailStr}`;
  };

  lines.push(fmt('STUN (UDP)', input.stun));
  lines.push(fmt('WebSocket', input.websocket));
  lines.push(fmt('TURN (relay)', input.turn));
  lines.push(fmt('TURNS (TLS)', input.turns));
  lines.push(fmt('Direct P2P', input.directP2P));
  lines.push(fmt('HTTPS fetch', input.httpsFetch));

  lines.push('');
  lines.push('Proxy Detection:');
  lines.push(`  Transparent proxy: ${input.transparentProxy.detected ? 'YES' : 'No'}`);
  if (input.transparentProxy.injectedHeaders.length > 0) {
    lines.push(`  Injected headers: ${input.transparentProxy.injectedHeaders.join(', ')}`);
  }
  lines.push(`  Proxy auth required: ${input.proxyAuth.required ? 'YES' : 'No'}`);
  if (input.proxyAuth.required) {
    lines.push(`  Auth schemes: ${input.proxyAuth.schemes.join(', ')}`);
    if (input.proxyAuth.realm) {
      lines.push(`  Realm: ${input.proxyAuth.realm}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Utility / Helper Functions
// ============================================================================

function makeSkippedResult(reason: string): TestResult {
  return {
    success: false,
    time: 0,
    availability: 'not_tested',
    error: reason,
  };
}

// ============================================================================
// Public Utility API
// ============================================================================

/**
 * Get a one-line guidance message for the UI.
 */
export function getGuidance(result: FirewallDetectionResult): string {
  switch (result.firewallType) {
    case 'none':
      return 'Your connection is optimal for P2P transfers.';
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
 * Get icon and color for the firewall status badge in the UI.
 */
export function getFirewallStatusIcon(firewallType: FirewallType): {
  icon: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
} {
  switch (firewallType) {
    case 'none':
      return { icon: 'check', color: 'green' };
    case 'moderate':
      return { icon: 'warning', color: 'yellow' };
    case 'strict':
      return { icon: 'shield', color: 'orange' };
    case 'corporate':
      return { icon: 'shield', color: 'red' };
  }
}

/**
 * Clear the cached detection result so the next call to detectFirewall()
 * performs a fresh scan.
 */
export function clearFirewallCache(): void {
  cachedResult = null;
  secureLog.log('[Firewall Detection] Cache cleared');
}

/**
 * Retrieve the cached result if it is still within the TTL.
 */
export function getCachedResult(): FirewallDetectionResult | null {
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    return cachedResult;
  }
  return null;
}

/**
 * Check whether a fresh detection scan is recommended.
 */
export function shouldRedetect(): boolean {
  if (!cachedResult) return true;
  return Date.now() - cachedResult.timestamp >= CACHE_DURATION;
}

/**
 * Return the full diagnostic text suitable for copy-to-clipboard or
 * inclusion in a support ticket.
 */
export function getDiagnosticReport(result: FirewallDetectionResult): string {
  return result.diagnosticSummary;
}

/**
 * Convenience: check whether the detected environment can support
 * any transport at all.
 */
export function isNetworkUsable(result: FirewallDetectionResult): boolean {
  return result.recommendedTransport !== 'none';
}

/**
 * Convenience: check whether proxy credentials are needed before
 * the transfer can proceed.
 */
export function needsProxyCredentials(result: FirewallDetectionResult): boolean {
  return result.proxyAuth.required;
}

// ============================================================================
// Network Change Monitoring
// ============================================================================

type NetworkChangeCallback = () => void;
let networkChangeCallbacks: NetworkChangeCallback[] = [];
let networkChangeListenerAttached = false;

/**
 * Register a callback that fires when the network changes, automatically
 * invalidating the cached detection result.
 */
export function onNetworkChange(callback: NetworkChangeCallback): () => void {
  networkChangeCallbacks.push(callback);
  attachNetworkChangeListener();

  // Return unsubscribe function
  return () => {
    networkChangeCallbacks = networkChangeCallbacks.filter((cb) => cb !== callback);
  };
}

function attachNetworkChangeListener(): void {
  if (networkChangeListenerAttached) return;
  if (typeof window === 'undefined') return;

  const handler = () => {
    secureLog.log('[Firewall Detection] Network change detected, clearing cache');
    clearFirewallCache();
    networkChangeCallbacks.forEach((cb) => {
      try { cb(); } catch { /* swallow callback errors */ }
    });
  };

  // Listen for online/offline events
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);

  // Listen for connection type changes (e.g. WiFi <-> cellular)
  if ('connection' in navigator) {
    const conn = (navigator as NavigatorWithConnection).connection;
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', handler);
    }
  }

  networkChangeListenerAttached = true;
}

// Minimal type for navigator.connection
interface NetworkInformationLike {
  addEventListener(type: string, listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
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
  getDiagnosticReport,
  isNetworkUsable,
  needsProxyCredentials,
  onNetworkChange,
};
