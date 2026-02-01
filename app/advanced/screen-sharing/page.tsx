'use client';

/**
 * Screen Sharing with PQC Demo Page
 * Demonstrate encrypted screen sharing
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Monitor,
  Shield,
  Zap,
  Users,
  Info,
  CheckCircle2,
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

export default function ScreenSharingDemoPage() {
  const [peerConnection, _setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pqcManagerRef = useRef<PQCTransferManager | null>(null);
  const [isPQCReady, setIsPQCReady] = useState(false);

  // Initialize PQC manager for demo purposes
  useEffect(() => {
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
    stream: senderStream,
  } = useScreenShare();

  const isSupported = isScreenShareSupported();
  const hasSystemAudio = isSystemAudioSupported();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/advanced">
                <Button variant="ghost" size="icon" aria-label="Back to Advanced Features">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Monitor className="h-6 w-6 text-primary" />
                  Screen Sharing with PQC
                </h1>
                <p className="text-sm text-muted-foreground">
                  Encrypted Screen Sharing Demo
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-600">
              E2E Encrypted
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h3 className="font-semibold">End-to-End Encrypted</h3>
                <p className="text-sm text-muted-foreground">
                  PQC-protected stream
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-semibold">Adaptive Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-adjusts to bandwidth
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Monitor className="h-5 w-5 text-white mt-1" />
              <div>
                <h3 className="font-semibold">Multi-Quality</h3>
                <p className="text-sm text-muted-foreground">
                  720p, 1080p, 4K support
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h3 className="font-semibold">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  User consent required
                </p>
              </div>
            </div>
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
                : 'System audio sharing requires Chrome or Edge browser.'}
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
                <CheckCircle2 className="h-4 w-4" />
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
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Multiple Quality Presets:</strong> Choose between 720p, 1080p, and 4K
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Adjustable Frame Rate:</strong> 15, 30, or 60 FPS
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>System Audio:</strong> Share audio along with screen (Chrome/Edge)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Pause/Resume:</strong> Temporarily pause sharing without disconnecting
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <strong>Live Statistics:</strong> Monitor resolution, FPS, bitrate, and latency
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
                <CardTitle>Security and Privacy</CardTitle>
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
                      <strong>No Server Recording:</strong> Streams are peer-to-peer only
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/advanced">
            <Button variant="outline" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Advanced Hub
            </Button>
          </Link>
          <Link href="/app">
            <Button size="lg">
              <Monitor className="w-4 h-4 mr-2" />
              Share Screen
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
