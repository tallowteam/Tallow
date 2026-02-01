'use client';

/**
 * Metadata Stripping Demo Component
 * Interactive demonstration of privacy-preserving metadata removal from images
 */

import { useState } from 'react';
import { Image, Shield, MapPin, Camera, Calendar, X, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MockMetadata {
  gps: {
    latitude: string;
    longitude: string;
    altitude: string;
  };
  camera: {
    make: string;
    model: string;
    software: string;
  };
  timestamp: {
    dateTimeOriginal: string;
    dateTimeDigitized: string;
  };
  author: {
    artist?: string;
    copyright?: string;
  };
}

const MOCK_METADATA: MockMetadata = {
  gps: {
    latitude: '37.7749° N',
    longitude: '122.4194° W',
    altitude: '52m above sea level',
  },
  camera: {
    make: 'Apple',
    model: 'iPhone 14 Pro',
    software: 'iOS 17.2.1',
  },
  timestamp: {
    dateTimeOriginal: '2024-03-15 14:23:45',
    dateTimeDigitized: '2024-03-15 14:23:45',
  },
  author: {
    artist: 'John Doe',
    copyright: 'Copyright 2024',
  },
};

export function MetadataStrippingDemo() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [isStripped, setIsStripped] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const handleFileSelect = () => {
    // Simulate file selection
    const mockFileName = 'vacation_photo.jpg';
    setFileName(mockFileName);
    setShowMetadata(true);
    setIsStripped(false);
  };

  const handleStripMetadata = async () => {
    setIsStripping(true);

    // Simulate metadata stripping process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsStripping(false);
    setIsStripped(true);
  };

  const handleReset = () => {
    setFileName(null);
    setShowMetadata(false);
    setIsStripped(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Metadata Stripping Demo</h2>
        </div>
        <p className="text-muted-foreground">
          Protect your privacy by removing hidden metadata from images
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 dark:text-amber-100">
          <strong>Privacy Risk:</strong> Photos often contain hidden metadata (EXIF data) including GPS
          coordinates, camera details, timestamps, and personal information. This data can reveal your
          location, device, and identity to anyone who receives the file.
        </div>
      </div>

      {/* File Upload Section */}
      {!fileName && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <CardTitle>Upload an Image</CardTitle>
            </div>
            <CardDescription>
              Select an image file to analyze and strip metadata (demo mode - no actual upload)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFileSelect} className="w-full" size="lg">
              Select Demo Image
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Supported formats: JPEG, PNG, WebP, HEIC
            </p>
          </CardContent>
        </Card>
      )}

      {/* Side-by-Side Comparison */}
      {fileName && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Before - Original with Metadata */}
          <Card className={`transition-all duration-300 ${!isStripped ? 'ring-2 ring-amber-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-lg">Before - Original File</CardTitle>
                </div>
                {!isStripped && (
                  <span className="px-2 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full">
                    CONTAINS METADATA
                  </span>
                )}
              </div>
              <CardDescription>{fileName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock Image Preview */}
              <div className="w-full aspect-video bg-gradient-to-br from-white/10 to-purple-100 dark:from-white/10 dark:to-purple-950 rounded-lg flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
              </div>

              {/* Metadata Details */}
              {showMetadata && !isStripped && (
                <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Sensitive Metadata Found
                  </h4>

                  {/* GPS Data */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-medium">GPS Location</span>
                    </div>
                    <div className="ml-6 text-xs space-y-0.5 text-muted-foreground">
                      <p>Latitude: {MOCK_METADATA.gps.latitude}</p>
                      <p>Longitude: {MOCK_METADATA.gps.longitude}</p>
                      <p>Altitude: {MOCK_METADATA.gps.altitude}</p>
                    </div>
                    <p className="ml-6 text-xs text-red-600 dark:text-red-400">
                      ⚠ Reveals exact location where photo was taken
                    </p>
                  </div>

                  {/* Camera Info */}
                  <div className="space-y-1 pt-2 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-white" />
                      <span className="font-medium">Camera Information</span>
                    </div>
                    <div className="ml-6 text-xs space-y-0.5 text-muted-foreground">
                      <p>Make: {MOCK_METADATA.camera.make}</p>
                      <p>Model: {MOCK_METADATA.camera.model}</p>
                      <p>Software: {MOCK_METADATA.camera.software}</p>
                    </div>
                    <p className="ml-6 text-xs text-white">
                      ℹ Can be used for device fingerprinting
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-1 pt-2 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Date & Time</span>
                    </div>
                    <div className="ml-6 text-xs space-y-0.5 text-muted-foreground">
                      <p>Original: {MOCK_METADATA.timestamp.dateTimeOriginal}</p>
                      <p>Digitized: {MOCK_METADATA.timestamp.dateTimeDigitized}</p>
                    </div>
                    <p className="ml-6 text-xs text-purple-600 dark:text-purple-400">
                      ℹ Reveals when and where you were
                    </p>
                  </div>

                  {/* Author Info */}
                  {MOCK_METADATA.author.artist && (
                    <div className="space-y-1 pt-2 border-t border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 text-sm">
                        <X className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Author Information</span>
                      </div>
                      <div className="ml-6 text-xs space-y-0.5 text-muted-foreground">
                        <p>Artist: {MOCK_METADATA.author.artist}</p>
                        <p>Copyright: {MOCK_METADATA.author.copyright}</p>
                      </div>
                      <p className="ml-6 text-xs text-orange-600 dark:text-orange-400">
                        ℹ Contains personal identification
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {!isStripped && (
                <Button
                  onClick={handleStripMetadata}
                  disabled={isStripping}
                  variant="default"
                  className="w-full"
                  size="lg"
                >
                  {isStripping ? (
                    <>
                      <Shield className="h-4 w-4 animate-pulse" />
                      Stripping Metadata...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Strip Metadata
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* After - Clean File */}
          <Card className={`transition-all duration-300 ${isStripped ? 'ring-2 ring-green-500' : 'opacity-60'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${isStripped ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-lg">After - Clean File</CardTitle>
                </div>
                {isStripped && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                    METADATA REMOVED
                  </span>
                )}
              </div>
              <CardDescription>
                {isStripped ? `${fileName} (cleaned)` : 'Awaiting processing...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mock Image Preview */}
              <div className="w-full aspect-video bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 rounded-lg flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
              </div>

              {isStripped ? (
                <>
                  {/* Success Message */}
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      All Metadata Removed
                    </h4>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <X className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5" />
                        <span>GPS location data removed</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <X className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5" />
                        <span>Camera and device information removed</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <X className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5" />
                        <span>Date and time information removed</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <X className="h-3 w-3 text-green-600 dark:text-green-400 mt-0.5" />
                        <span>Author and copyright data removed</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Your image is now safe to share
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only the visual content remains. All identifying metadata has been permanently
                        removed.
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Original Size</p>
                      <p className="text-lg font-bold">2.4 MB</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Cleaned Size</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">2.3 MB</p>
                    </div>
                  </div>

                  <Button onClick={handleReset} variant="outline" className="w-full" size="lg">
                    Try Another Image
                  </Button>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {isStripping
                      ? 'Processing and removing metadata...'
                      : 'Click "Strip Metadata" to clean the file'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Educational Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why Remove Metadata?</CardTitle>
          <CardDescription>Understanding the privacy risks of image metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Location Tracking</h4>
                  <p className="text-xs text-muted-foreground">
                    GPS coordinates can reveal your home address, workplace, or travel patterns
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Camera className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Device Fingerprinting</h4>
                  <p className="text-xs text-muted-foreground">
                    Camera model and settings can be used to identify you across platforms
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Timeline Reconstruction</h4>
                  <p className="text-xs text-muted-foreground">
                    Timestamps can expose your schedule and daily routines
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Identity Protection</h4>
                  <p className="text-xs text-muted-foreground">
                    Author and copyright fields may contain your real name or username
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How Tallow Protects You</CardTitle>
          <CardDescription>Automatic metadata stripping in action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Automatic Detection</p>
              <p className="text-xs text-muted-foreground">
                Tallow automatically scans all images before transfer
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Smart Stripping</p>
              <p className="text-xs text-muted-foreground">
                Removes sensitive metadata while preserving image quality and orientation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Secure Transfer</p>
              <p className="text-xs text-muted-foreground">
                Only the cleaned file is sent, with end-to-end encryption
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Supported formats:</strong> JPEG, PNG, WebP, HEIC, MP4, MOV
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
