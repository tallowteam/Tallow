/**
 * Network Web Worker
 * Offloads heavy network processing operations to a background thread
 * to keep the main UI responsive during connectivity checks, bandwidth tests,
 * and latency measurements.
 */

// Message types for communication
interface NetworkWorkerMessage {
    type: 'check-connectivity' | 'resolve-ice' | 'bandwidth-test' | 'latency-check';
    id: string;
    payload: unknown;
}

interface CheckConnectivityPayload {
    url: string;
    timeout?: number;
}

interface ResolveIcePayload {
    stunServers: string[];
}

interface BandwidthTestPayload {
    url: string;
    payloadSize: number; // in bytes
}

interface LatencyCheckPayload {
    url: string;
    samples?: number; // number of pings to average
}

// Worker context
const ctx: Worker = self as unknown as Worker;

/**
 * Check if a remote host is reachable
 * Tests connectivity by making a fetch request with timeout
 */
async function checkConnectivity(url: string, timeout: number = 5000): Promise<{ reachable: boolean; statusCode?: number; responseTime: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = performance.now();

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors', // Allow CORS-restricted endpoints
        });

        clearTimeout(timeoutId);
        const responseTime = performance.now() - startTime;

        return {
            reachable: true,
            statusCode: response.status,
            responseTime
        };
    } catch (error) {
        clearTimeout(timeoutId);
        const responseTime = performance.now() - startTime;

        return {
            reachable: false,
            responseTime,
        };
    }
}

/**
 * Resolve ICE candidates using STUN servers
 * Tests if WebRTC connections can be established
 */
async function resolveIce(stunServers: string[]): Promise<{ candidates: RTCIceCandidate[]; success: boolean }> {
    return new Promise((resolve) => {
        const candidates: RTCIceCandidate[] = [];

        const pc = new RTCPeerConnection({
            iceServers: stunServers.map(url => ({ urls: url }))
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                candidates.push(event.candidate);
            } else {
                // ICE gathering complete
                pc.close();
                resolve({
                    candidates,
                    success: candidates.length > 0
                });
            }
        };

        pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
                pc.close();
                resolve({
                    candidates,
                    success: candidates.length > 0
                });
            }
        };

        // Create a data channel to trigger ICE gathering
        pc.createDataChannel('test');

        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
        }).catch(() => {
            pc.close();
            resolve({
                candidates: [],
                success: false
            });
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (pc.signalingState !== 'closed') {
                pc.close();
                resolve({
                    candidates,
                    success: candidates.length > 0
                });
            }
        }, 10000);
    });
}

/**
 * Estimate bandwidth by timing a test payload
 * Downloads a payload and calculates transfer rate
 */
async function bandwidthTest(url: string, payloadSize: number): Promise<{ bandwidthMbps: number; transferTime: number; bytesTransferred: number }> {
    const startTime = performance.now();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        let bytesTransferred = 0;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            bytesTransferred += value.length;

            // Stop if we've read enough data
            if (bytesTransferred >= payloadSize) {
                reader.cancel();
                break;
            }
        }

        const transferTime = performance.now() - startTime;
        const bandwidthBps = (bytesTransferred * 8) / (transferTime / 1000);
        const bandwidthMbps = bandwidthBps / 1_000_000;

        return {
            bandwidthMbps,
            transferTime,
            bytesTransferred
        };
    } catch (error) {
        throw new Error(`Bandwidth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Measure round-trip time to signaling server
 * Performs multiple samples and returns average latency
 */
async function latencyCheck(url: string, samples: number = 5): Promise<{ averageLatency: number; minLatency: number; maxLatency: number; samples: number[] }> {
    const latencies: number[] = [];

    for (let i = 0; i < samples; i++) {
        const startTime = performance.now();

        try {
            await fetch(url, {
                method: 'HEAD',
                cache: 'no-store'
            });

            const latency = performance.now() - startTime;
            latencies.push(latency);
        } catch {
            // Skip failed samples
            continue;
        }

        // Small delay between samples to avoid rate limiting
        if (i < samples - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    if (latencies.length === 0) {
        throw new Error('All latency samples failed');
    }

    const averageLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
    const minLatency = Math.min(...latencies);
    const maxLatency = Math.max(...latencies);

    return {
        averageLatency,
        minLatency,
        maxLatency,
        samples: latencies
    };
}

/**
 * Handle incoming messages
 */
ctx.onmessage = async (event: MessageEvent<NetworkWorkerMessage>) => {
    const { type, id, payload } = event.data;

    try {
        let result: unknown;

        switch (type) {
            case 'check-connectivity': {
                const { url, timeout } = payload as CheckConnectivityPayload;
                result = await checkConnectivity(url, timeout);
                break;
            }
            case 'resolve-ice': {
                const { stunServers } = payload as ResolveIcePayload;
                result = await resolveIce(stunServers);
                break;
            }
            case 'bandwidth-test': {
                const { url, payloadSize } = payload as BandwidthTestPayload;
                result = await bandwidthTest(url, payloadSize);
                break;
            }
            case 'latency-check': {
                const { url, samples } = payload as LatencyCheckPayload;
                result = await latencyCheck(url, samples);
                break;
            }
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        ctx.postMessage({ id, success: true, result });
    } catch (error) {
        ctx.postMessage({
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Signal that worker is ready
ctx.postMessage({ type: 'ready' });
