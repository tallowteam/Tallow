'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Share2, Hand, Smartphone, Check } from 'lucide-react';
import { CameraCapture } from './CameraCapture';
import { FilePreview } from './FilePreview';
import { MobileActionSheet, ActionSheetAction } from './MobileActionSheet';
import { CapturedMedia } from '@/lib/hooks/use-media-capture';
import { useWebShare } from '@/lib/hooks/use-web-share';
import { toast } from 'sonner';

/**
 * Demo component showcasing all mobile features
 * This can be shown in settings or as a tutorial
 */
export function MobileFeaturesDemo() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);

  const { canShare, canShareFiles: _canShareFiles } = useWebShare();

  const handleCapture = (media: CapturedMedia) => {
    setCapturedMedia(media);
    toast.success(`${media.type === 'photo' ? 'Photo' : 'Video'} captured!`);
  };

  const actionSheetActions: ActionSheetAction[] = [
    {
      label: 'Open Camera',
      icon: <Camera className="w-5 h-5" />,
      onClick: () => setCameraOpen(true),
    },
    {
      label: 'View Preview',
      icon: <Share2 className="w-5 h-5" />,
      onClick: () => {
        if (capturedMedia) {
          setPreviewOpen(true);
        } else {
          toast.info('Capture a photo or video first');
        }
      },
      disabled: !capturedMedia,
    },
    {
      label: 'Clear Capture',
      icon: <Check className="w-5 h-5" />,
      onClick: () => {
        setCapturedMedia(null);
        toast.success('Capture cleared');
      },
      variant: 'destructive',
      disabled: !capturedMedia,
    },
  ];

  const features = [
    {
      icon: Camera,
      title: 'Camera Integration',
      description: 'Capture photos and videos directly in the app',
      supported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
    },
    {
      icon: Share2,
      title: 'Web Share API',
      description: 'Share files to native apps and contacts',
      supported: canShare,
    },
    {
      icon: Hand,
      title: 'Touch Gestures',
      description: 'Swipe, pinch, and pull gestures for better UX',
      supported: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Smartphone className="w-6 h-6" />
          Mobile Features
        </h2>
        <p className="text-muted-foreground">
          Tallow includes mobile-optimized features for a native-like experience
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{feature.title}</h3>
                    <Badge
                      variant={feature.supported ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {feature.supported ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Demo Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Try Mobile Features</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setCameraOpen(true)} variant="default">
            <Camera className="w-4 h-4 mr-2" />
            Open Camera
          </Button>
          <Button onClick={() => setActionSheetOpen(true)} variant="outline">
            <Hand className="w-4 h-4 mr-2" />
            Show Action Sheet
          </Button>
          {capturedMedia && (
            <Button onClick={() => setPreviewOpen(true)} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Preview Capture
            </Button>
          )}
        </div>

        {capturedMedia && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-1">Last Capture:</p>
            <p className="text-muted-foreground">
              {capturedMedia.type === 'photo' ? 'Photo' : 'Video'} captured at{' '}
              {capturedMedia.timestamp.toLocaleTimeString()}
              {capturedMedia.duration && ` (${capturedMedia.duration.toFixed(1)}s)`}
            </p>
          </div>
        )}
      </Card>

      {/* Gesture Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gesture Guide</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hand className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Swipe Left</p>
              <p className="text-muted-foreground">
                Delete completed or failed transfers
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hand className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Swipe Right</p>
              <p className="text-muted-foreground">Retry failed transfers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hand className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Pinch to Zoom</p>
              <p className="text-muted-foreground">
                Zoom in/out on image previews
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hand className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Swipe Down</p>
              <p className="text-muted-foreground">
                Close dialogs and action sheets
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Camera Capture Dialog */}
      <CameraCapture
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={handleCapture}
        mode="photo"
        title="Capture Photo or Video"
        description="Take a photo or record a video to send"
      />

      {/* File Preview Dialog */}
      {capturedMedia && (
        <FilePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          file={{
            name: `${capturedMedia.type}-${capturedMedia.timestamp.getTime()}`,
            type: capturedMedia.type === 'photo' ? 'image/jpeg' : 'video/webm',
            url: capturedMedia.dataUrl,
            blob: capturedMedia.blob,
          }}
          onDownload={() => {
            const a = document.createElement('a');
            a.href = capturedMedia.dataUrl;
            a.download = `capture-${capturedMedia.timestamp.getTime()}.${
              capturedMedia.type === 'photo' ? 'jpg' : 'webm'
            }`;
            a.click();
            toast.success('Download started');
          }}
          enableGestures
        />
      )}

      {/* Mobile Action Sheet */}
      <MobileActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        title="Mobile Actions"
        description="Try the mobile-optimized action sheet"
        actions={actionSheetActions}
        enableSwipeDown
      />
    </div>
  );
}

export default MobileFeaturesDemo;
