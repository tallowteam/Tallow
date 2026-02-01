'use client';

/**
 * Screen Sharing Demo Page
 *
 * Demonstration of screen sharing capabilities with live examples
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Monitor,
  Users,
  Shield,
  Zap,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ScreenShare } from '@/components/app/ScreenShare';
import { ScreenSharePreview } from '@/components/app/ScreenSharePreview';
import { ScreenShareViewer } from '@/components/app/ScreenShareViewer';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import {
  isScreenShareSupported,
  isSystemAudioSupported,
} from '@/lib/webrtc/screen-sharing';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

export default function ScreenShareDemo() {
  const [peerConnection, _setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pqcManagerRef = useRef<PQCTransferManager | null>(null);
  const [isPQCReady, setIsPQCReady] = useState(false);

  // Initialize PQC manager for demo purposes
  useEffect(() => {
    // In real app, PQC would be initialized when P2P connection is established
    // This is just for demo to show the UI
    const initPQC = async () => {
      try {
        const manager = new PQCTransferManager();
        await manager.initializeSession('send');
        pqcManagerRef.current = manager;
        setIsPQCReady(true);
      } catch (error) {
        console.error('Failed to initialize PQC for demo:', error);
      }
    };

    initPQC();

    return () => {
      pqcManagerRef.current?.destroy();
    };
  }, []);

  const {
    state: senderState,
    stats: _senderStats,
    stream: senderStream,
  } = useScreenShare();

  const isSupported = isScreenShareSupported();
  const hasSystemAudio = isSystemAudioSupported();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Screen Sharing Demo</h1>
        <p className="text-muted-foreground text-lg">
          Experience secure, encrypted screen sharing with adaptive quality
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">End-to-End Encrypted</h3>
                <p className="text-sm text-muted-foreground">
                  PQC-protected screen sharing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Adaptive Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-adjusts to bandwidth
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-white mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Multi-Quality</h3>
                <p className="text-sm text-muted-foreground">
                  720p, 1080p, 4K support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  User consent & indicators
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browser Support Alert */}
      {!isSupported && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Screen sharing is not supported in your browser. Please use Chrome, Edge, or Opera.
          </AlertDescription>
        </Alert>
      )}

      {/* System Audio Info */}
      {isSupported && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            {hasSystemAudio
              ? 'System audio sharing is supported in your browser!'
              : 'System audio sharing requires Chrome or Edge browser.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Demo */}
      <Tabs defaultValue="sender" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sender">
            Sender (Your Screen)
            {senderState.isSharing && (
              <Badge variant="default" className="ml-2 bg-green-500">
                Live
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="receiver">
            Receiver (Remote View)
          </TabsTrigger>
          <TabsTrigger value="info">
            Information
          </TabsTrigger>
        </TabsList>

        {/* Sender Tab */}
        <TabsContent value="sender" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Screen</CardTitle>
              <CardDescription>
                Start sharing your screen with customizable quality settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScreenShare
                peerConnection={peerConnection!}
                pqcManager={isPQCReady ? pqcManagerRef.current : null}
                onStreamReady={(stream) => {
                  console.log('Stream ready:', stream);
                  // In a real app, send this stream to remote peer
                  setRemoteStream(stream);
                }}
                onStopped={() => {
                  console.log('Sharing stopped');
                  setRemoteStream(null);
                }}
                showStats
              />
            </CardContent>
          </Card>

          {/* Preview */}
          {senderState.isSharing && (
            <ScreenSharePreview
              stream={senderStream}
              isSharing={senderState.isSharing}
              isPaused={senderState.isPaused}
              showControls
              showStats
            />
          )}

          {/* Current Settings */}
          {senderState.isSharing && (
            <Card>
              <CardHeader>
                <CardTitle>Current Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quality</p>
                    <p className="font-mono font-semibold">{senderState.quality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frame Rate</p>
                    <p className="font-mono font-semibold">{senderState.frameRate} FPS</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Audio</p>
                    <p className="font-mono font-semibold">
                      {senderState.shareAudio ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-mono font-semibold">
                      {senderState.isPaused ? 'Paused' : 'Active'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Receiver Tab */}
        <TabsContent value="receiver" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receive Screen Share</CardTitle>
              <CardDescription>
                View the shared screen with fullscreen and PiP support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScreenShareViewer
                stream={remoteStream}
                peerName="Demo User"
                showControls
                allowPiP
                allowDownload
              />
            </CardContent>
          </Card>

          {remoteStream && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Screen sharing active. Try fullscreen or picture-in-picture mode!
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Multiple Quality Presets:</strong> Choose between 720p, 1080p, and 4K
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Adjustable Frame Rate:</strong> 15, 30, or 60 FPS
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>System Audio:</strong> Share audio along with screen (Chrome/Edge)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Pause/Resume:</strong> Temporarily pause sharing without disconnecting
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Switch Source:</strong> Change screen/window on the fly
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Live Statistics:</strong> Monitor resolution, FPS, bitrate, and latency
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Adaptive Bitrate:</strong> Automatic quality adjustment based on network
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Browser Support */}
          <Card>
            <CardHeader>
              <CardTitle>Browser Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Chrome 72+</span>
                  <Badge variant="default">Full Support</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Edge 79+</span>
                  <Badge variant="default">Full Support</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Opera 60+</span>
                  <Badge variant="default">Full Support</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Firefox 66+</span>
                  <Badge variant="secondary">Partial (No System Audio)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Safari 13+</span>
                  <Badge variant="secondary">Partial (Limited)</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>End-to-End Encryption:</strong> All streams encrypted with PQC
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>User Consent:</strong> Explicit permission required before sharing
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Visual Indicators:</strong> Clear badges showing sharing status
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>Auto-Stop:</strong> Automatically stops on disconnect
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong>No Server Recording:</strong> Streams are peer-to-peer only
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-white mt-0.5" />
                  <div>
                    Start with 1080p/30fps for best balance of quality and performance
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-white mt-0.5" />
                  <div>
                    Use wired connection for stable high-quality sharing
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-white mt-0.5" />
                  <div>
                    Monitor statistics to optimize quality based on network conditions
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-white mt-0.5" />
                  <div>
                    Disable audio sharing if not needed to save bandwidth
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-white mt-0.5" />
                  <div>
                    Use fullscreen mode for immersive viewing experience
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
