'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomOut, Download } from 'lucide-react';
import { usePinchZoom } from '@/lib/hooks/use-advanced-gestures';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    type: string;
    url: string;
    blob?: Blob;
  };
  onDownload?: () => void;
  enableGestures?: boolean;
}

export function FilePreview({
  open,
  onOpenChange,
  file,
  onDownload,
  enableGestures = true,
}: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const isPDF = file.type === 'application/pdf';

  const { bind, scale, offset: _offset, reset, isZoomed, style } = usePinchZoom({
    enabled: enableGestures && isImage,
    minScale: 0.5,
    maxScale: 5,
  });

  const handleZoomOut = () => {
    reset();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{file.name}</DialogTitle>
            <div className="flex items-center gap-2">
              {isImage && enableGestures && (
                <>
                  {isZoomed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      title="Reset zoom"
                      aria-label="Reset zoom to 100%"
                    >
                      <ZoomOut className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  )}
                  <div className="text-sm text-muted-foreground px-2">
                    {Math.round(scale * 100)}%
                  </div>
                </>
              )}
              {onDownload && (
                <Button variant="ghost" size="icon" onClick={onDownload} title="Download" aria-label={`Download ${file.name}`}>
                  <Download className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} title="Close" aria-label="Close preview">
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden bg-muted/50">
          {isImage && (
            <div
              className="w-full h-full flex items-center justify-center p-6 overflow-hidden touch-none"
              style={{ minHeight: '400px' }}
            >
              <img
                {...(enableGestures ? bind() : {})}
                src={file.url}
                alt={file.name}
                className={cn(
                  'max-w-full max-h-full object-contain',
                  enableGestures && 'cursor-move'
                )}
                style={enableGestures ? style : undefined}
                draggable={false}
              />
            </div>
          )}

          {isVideo && (
            <div className="w-full h-full flex items-center justify-center p-6">
              <video
                src={file.url}
                controls
                className="max-w-full max-h-full"
                style={{ maxHeight: '70vh' }}
                aria-label={`Video file: ${file.name}`}
              >
                <track kind="captions" src="" label="No captions available" />
                Your browser does not support the video element.
              </video>
            </div>
          )}

          {isAudio && (
            <div className="w-full h-full flex items-center justify-center p-6">
              <div className="w-full max-w-2xl">
                <audio
                  src={file.url}
                  controls
                  className="w-full"
                  aria-label={`Audio file: ${file.name}`}
                >
                  <track kind="captions" src="" label="No captions available" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          {isPDF && (
            <div className="w-full h-full flex items-center justify-center p-6">
              <iframe
                src={file.url}
                className="w-full h-full border-0"
                style={{ minHeight: '600px' }}
                title={file.name}
              />
            </div>
          )}

          {!isImage && !isVideo && !isAudio && !isPDF && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              {onDownload && (
                <Button onClick={onDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download to View
                </Button>
              )}
            </div>
          )}

          {/* Gesture hint for images */}
          {isImage && enableGestures && !isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm pointer-events-none">
              Pinch to zoom
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t text-sm text-muted-foreground text-center">
          {file.type}
          {file.blob && ` • ${(file.blob.size / 1024).toFixed(1)} KB`}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FilePreview;
