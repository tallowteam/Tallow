/**
 * Screen Sharing Tests
 *
 * Unit tests for screen sharing functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenSharingManager, isScreenShareSupported } from '@/lib/webrtc/screen-sharing';

// Mock MediaDevices
const mockMediaStream = {
    id: 'test-stream',
    active: true,
    getTracks: vi.fn(() => [mockVideoTrack, mockAudioTrack]),
    getVideoTracks: vi.fn(() => [mockVideoTrack]),
    getAudioTracks: vi.fn(() => [mockAudioTrack]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
};

const mockVideoTrack = {
    kind: 'video',
    id: 'video-track',
    enabled: true,
    readyState: 'live',
    stop: vi.fn(),
    applyConstraints: vi.fn(),
    getSettings: vi.fn(() => ({
        width: 1920,
        height: 1080,
        frameRate: 30,
    })),
    onended: null as ((this: MediaStreamTrack, ev: Event) => any) | null,
};

const mockAudioTrack = {
    kind: 'audio',
    id: 'audio-track',
    enabled: true,
    readyState: 'live',
    stop: vi.fn(),
    applyConstraints: vi.fn(),
    getSettings: vi.fn(() => ({})),
};

const mockSender = {
    track: mockVideoTrack,
    getParameters: vi.fn(() => ({
        encodings: [{}],
    })),
    setParameters: vi.fn(),
    getStats: vi.fn(() => Promise.resolve(new Map([
        ['outbound-rtp', {
            type: 'outbound-rtp',
            kind: 'video',
            bytesSent: 1000000,
            timestamp: 1000,
            framesPerSecond: 30,
            frameWidth: 1920,
            frameHeight: 1080,
            packetsLost: 0,
            roundTripTime: 0.01,
        }],
    ]))),
} as unknown as RTCRtpSender;

const mockPeerConnection = {
    addTrack: vi.fn(() => mockSender),
    removeTrack: vi.fn(),
    getStats: vi.fn(() => Promise.resolve(new Map())),
    addEventListener: vi.fn(),
} as unknown as RTCPeerConnection;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getDisplayMedia: vi.fn(() => Promise.resolve(mockMediaStream as any)),
  } as any,
  writable: true,
  configurable: true,
});

describe('ScreenSharingManager', () => {
    let manager: ScreenSharingManager;

    beforeEach(() => {
        manager = new ScreenSharingManager({
            quality: '1080p',
            frameRate: 30,
            shareAudio: false,
            shareCursor: true,
            autoStop: true,
        });

        vi.clearAllMocks();
    });

    afterEach(() => {
        manager.dispose();
    });

    describe('initialization', () => {
        it('should create manager with default config', () => {
            const defaultManager = new ScreenSharingManager();
            expect(defaultManager).toBeDefined();
            expect(defaultManager.isSharing()).toBe(false);
        });

        it('should create manager with custom config', () => {
            expect(manager).toBeDefined();
            const state = manager.getState();
            expect(state.quality).toBe('1080p');
            expect(state.frameRate).toBe(30);
            expect(state.shareAudio).toBe(false);
        });
    });

    describe('startSharing', () => {
        it('should start screen sharing successfully', async () => {
            const stream = await manager.startSharing();

            expect(stream).toBeDefined();
            expect(stream.id).toBe('test-stream');
            expect(manager.isSharing()).toBe(true);
            expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
        });

        it('should add tracks to peer connection', async () => {
            await manager.startSharing(mockPeerConnection);

            expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(
                mockVideoTrack,
                mockMediaStream
            );
        });

        it('should handle start failure', async () => {
            (navigator.mediaDevices.getDisplayMedia as any).mockRejectedValueOnce(
                new Error('Permission denied')
            );

            await expect(manager.startSharing()).rejects.toThrow();
            expect(manager.isSharing()).toBe(false);
        });

        it('should call state change callback', async () => {
            const stateCallback = vi.fn();
            manager.setStateCallback(stateCallback);

            await manager.startSharing();

            expect(stateCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    isSharing: true,
                })
            );
        });
    });

    describe('stopSharing', () => {
        it('should stop screen sharing', async () => {
            await manager.startSharing();
            manager.stopSharing();

            expect(mockVideoTrack.stop).toHaveBeenCalled();
            expect(mockAudioTrack.stop).toHaveBeenCalled();
            expect(manager.isSharing()).toBe(false);
        });

        it('should remove tracks from peer connection', async () => {
            await manager.startSharing(mockPeerConnection);
            manager.stopSharing();

            expect(mockPeerConnection.removeTrack).toHaveBeenCalled();
        });

        it('should handle stop when not sharing', () => {
            expect(() => manager.stopSharing()).not.toThrow();
        });
    });

    describe('pauseSharing', () => {
        it('should pause video track', async () => {
            await manager.startSharing();
            manager.pauseSharing();

            expect(mockVideoTrack.enabled).toBe(false);
            expect(manager.isPaused()).toBe(true);
        });

        it('should handle pause when not sharing', () => {
            expect(() => manager.pauseSharing()).not.toThrow();
        });
    });

    describe('resumeSharing', () => {
        it('should resume video track', async () => {
            await manager.startSharing();
            manager.pauseSharing();
            manager.resumeSharing();

            expect(mockVideoTrack.enabled).toBe(true);
            expect(manager.isPaused()).toBe(false);
        });
    });

    describe('updateQuality', () => {
        it('should update quality preset', async () => {
            await manager.startSharing(mockPeerConnection);
            await manager.updateQuality('720p');

            const state = manager.getState();
            expect(state.quality).toBe('720p');
            expect(mockVideoTrack.applyConstraints).toHaveBeenCalled();
        });

        it('should update sender parameters', async () => {
            await manager.startSharing(mockPeerConnection);
            await manager.updateQuality('4k');

            expect(mockSender.setParameters).toHaveBeenCalled();
        });
    });

    describe('updateFrameRate', () => {
        it('should update frame rate', async () => {
            await manager.startSharing();
            await manager.updateFrameRate(60);

            const state = manager.getState();
            expect(state.frameRate).toBe(60);
            expect(mockVideoTrack.applyConstraints).toHaveBeenCalled();
        });
    });

    describe('toggleAudio', () => {
        it('should enable audio', async () => {
            await manager.toggleAudio(true);

            const state = manager.getState();
            expect(state.shareAudio).toBe(true);
        });

        it('should disable audio', async () => {
            await manager.startSharing();
            await manager.toggleAudio(false);

            expect(mockAudioTrack.stop).toHaveBeenCalled();
        });
    });

    describe('statistics', () => {
        it('should collect statistics', async () => {
            await manager.startSharing(mockPeerConnection);

            // Wait for stats to be collected
            await new Promise(resolve => setTimeout(resolve, 1100));

            const stats = manager.getStats();
            expect(stats).toBeDefined();
            expect(stats?.fps).toBeGreaterThan(0);
        });

        it('should call stats callback', async () => {
            const statsCallback = vi.fn();
            manager.setStatsCallback(statsCallback);

            await manager.startSharing(mockPeerConnection);

            // Wait for stats to be collected
            await new Promise(resolve => setTimeout(resolve, 1100));

            expect(statsCallback).toHaveBeenCalled();
        });
    });

    describe('getState', () => {
        it('should return current state', () => {
            const state = manager.getState();

            expect(state).toHaveProperty('isSharing');
            expect(state).toHaveProperty('isPaused');
            expect(state).toHaveProperty('quality');
            expect(state).toHaveProperty('frameRate');
            expect(state).toHaveProperty('shareAudio');
        });
    });

    describe('getStream', () => {
        it('should return null when not sharing', () => {
            expect(manager.getStream()).toBeNull();
        });

        it('should return stream when sharing', async () => {
            await manager.startSharing();
            expect(manager.getStream()).toBeDefined();
        });
    });

    describe('dispose', () => {
        it('should clean up resources', async () => {
            await manager.startSharing();
            manager.dispose();

            expect(manager.isSharing()).toBe(false);
            expect(mockVideoTrack.stop).toHaveBeenCalled();
        });
    });
});

describe('isScreenShareSupported', () => {
    it('should return true when supported', () => {
        expect(isScreenShareSupported()).toBe(true);
    });

    it('should return false when not supported', () => {
        const originalMediaDevices = navigator.mediaDevices;
        (navigator as any).mediaDevices = undefined;

        expect(isScreenShareSupported()).toBe(false);

        (navigator as any).mediaDevices = originalMediaDevices;
    });
});

describe('Quality Presets', () => {
    it('should use correct resolution for 720p', async () => {
        const manager = new ScreenSharingManager({ quality: '720p' });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.video.width.ideal).toBe(1280);
        expect(call.video.height.ideal).toBe(720);

        manager.dispose();
    });

    it('should use correct resolution for 1080p', async () => {
        const manager = new ScreenSharingManager({ quality: '1080p' });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.video.width.ideal).toBe(1920);
        expect(call.video.height.ideal).toBe(1080);

        manager.dispose();
    });

    it('should use correct resolution for 4k', async () => {
        const manager = new ScreenSharingManager({ quality: '4k' });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.video.width.ideal).toBe(3840);
        expect(call.video.height.ideal).toBe(2160);

        manager.dispose();
    });
});

describe('Frame Rate Configuration', () => {
    it('should set correct frame rate', async () => {
        const manager = new ScreenSharingManager({ frameRate: 60 });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.video.frameRate.ideal).toBe(60);

        manager.dispose();
    });
});

describe('Audio Configuration', () => {
    it('should include audio when enabled', async () => {
        const manager = new ScreenSharingManager({ shareAudio: true });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.audio).toBeTruthy();

        manager.dispose();
    });

    it('should exclude audio when disabled', async () => {
        const manager = new ScreenSharingManager({ shareAudio: false });
        await manager.startSharing();

        const call = (navigator.mediaDevices.getDisplayMedia as any).mock.calls[0][0];
        expect(call.audio).toBe(false);

        manager.dispose();
    });
});

describe('Auto-stop Behavior', () => {
    it('should stop sharing when track ends', async () => {
        const manager = new ScreenSharingManager();
        await manager.startSharing();

        // Simulate browser UI stop
        const onendedHandler = mockVideoTrack.onended;
        if (onendedHandler && typeof onendedHandler === 'function') {
            onendedHandler.call(mockVideoTrack as any, new Event('ended'));
        }

        expect(manager.isSharing()).toBe(false);

        manager.dispose();
    });
});
