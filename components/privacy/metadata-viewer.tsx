'use client';

import { useState, useEffect } from 'react';
import { MapPin, Camera, Calendar, User, FileText, AlertTriangle, Shield, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractMetadata, MetadataInfo, getMetadataSummary } from '@/lib/privacy/metadata-stripper';

interface MetadataViewerProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onStripConfirm?: () => void;
  showStripButton?: boolean;
}

interface MetadataSection {
  icon: React.ElementType;
  title: string;
  items: { label: string; value: string | number }[];
  sensitive?: boolean;
}

export function MetadataViewer({
  file,
  isOpen,
  onClose,
  onStripConfirm,
  showStripButton = true,
}: MetadataViewerProps) {
  const [metadata, setMetadata] = useState<MetadataInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      loadMetadata();
    }
  }, [file, isOpen]);

  const loadMetadata = async () => {
    if (!file) {return;}

    setLoading(true);
    try {
      const data = await extractMetadata(file);
      setMetadata(data);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSections = (): MetadataSection[] => {
    if (!metadata) {return [];}

    const sections: MetadataSection[] = [];

    // GPS Section
    if (metadata.hasGPS) {
      sections.push({
        icon: MapPin,
        title: 'Location Data',
        sensitive: true,
        items: [
          metadata.gpsLatitude && { label: 'Latitude', value: metadata.gpsLatitude },
          metadata.gpsLongitude && { label: 'Longitude', value: metadata.gpsLongitude },
          metadata.gpsAltitude && { label: 'Altitude', value: metadata.gpsAltitude },
          metadata.gpsTimestamp && { label: 'GPS Timestamp', value: metadata.gpsTimestamp },
        ].filter(Boolean) as { label: string; value: string | number }[],
      });
    }

    // Device/Camera Section
    if (metadata.hasDeviceInfo) {
      sections.push({
        icon: Camera,
        title: 'Camera & Device',
        sensitive: true,
        items: [
          metadata.make && { label: 'Make', value: metadata.make },
          metadata.model && { label: 'Model', value: metadata.model },
          metadata.software && { label: 'Software', value: metadata.software },
          metadata.lensModel && { label: 'Lens', value: metadata.lensModel },
        ].filter(Boolean) as { label: string; value: string | number }[],
      });
    }

    // Timestamp Section
    if (metadata.hasTimestamps) {
      sections.push({
        icon: Calendar,
        title: 'Date & Time',
        sensitive: true,
        items: [
          metadata.dateTimeOriginal && { label: 'Date Taken', value: metadata.dateTimeOriginal },
          metadata.dateTimeDigitized && { label: 'Date Digitized', value: metadata.dateTimeDigitized },
          metadata.createDate && { label: 'Created', value: metadata.createDate },
          metadata.modifyDate && { label: 'Modified', value: metadata.modifyDate },
        ].filter(Boolean) as { label: string; value: string | number }[],
      });
    }

    // Author/Copyright Section
    if (metadata.hasAuthorInfo) {
      sections.push({
        icon: User,
        title: 'Author & Copyright',
        sensitive: true,
        items: [
          metadata.artist && { label: 'Artist', value: metadata.artist },
          metadata.author && { label: 'Author', value: metadata.author },
          metadata.copyright && { label: 'Copyright', value: metadata.copyright },
        ].filter(Boolean) as { label: string; value: string | number }[],
      });
    }

    // Technical Info (not sensitive)
    const techItems = [
      metadata.width && { label: 'Width', value: `${metadata.width}px` },
      metadata.height && { label: 'Height', value: `${metadata.height}px` },
      metadata.orientation && { label: 'Orientation', value: metadata.orientation },
      metadata.colorSpace && { label: 'Color Space', value: metadata.colorSpace },
    ].filter(Boolean) as { label: string; value: string | number }[];

    if (techItems.length > 0) {
      sections.push({
        icon: FileText,
        title: 'Technical Details',
        sensitive: false,
        items: techItems,
      });
    }

    return sections;
  };

  const sections = getSections();
  const summary = metadata ? getMetadataSummary(metadata) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            File Metadata
          </DialogTitle>
          <DialogDescription>
            {file ? `Viewing metadata for: ${file.name}` : 'No file selected'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : metadata ? (
          <div className="space-y-4">
            {/* Privacy Warning */}
            {metadata.hasSensitiveData && (
              <Card className="p-4 border-amber-500/50 bg-amber-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-amber-500 mb-1">
                      Sensitive Metadata Detected
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      This file contains the following sensitive information:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {summary.map((item, index) => (
                        <Badge key={index} variant="outline" className="border-amber-500/50">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* No Sensitive Data */}
            {!metadata.hasSensitiveData && (
              <Card className="p-4 border-green-500/50 bg-green-500/10">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-medium text-green-500">No Sensitive Data</h4>
                    <p className="text-sm text-muted-foreground">
                      This file contains no sensitive metadata
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Metadata Sections */}
            {sections.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <section.icon className="w-5 h-5 text-muted-foreground" />
                        <h4 className="font-medium">{section.title}</h4>
                        {section.sensitive && (
                          <Badge variant="destructive" className="ml-auto">
                            Sensitive
                          </Badge>
                        )}
                      </div>
                      <Separator className="mb-3" />
                      <div className="space-y-2">
                        {section.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <span className="text-muted-foreground font-medium min-w-[120px]">
                              {item.label}:
                            </span>
                            <span className="text-foreground flex-1 text-right break-all">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No metadata found in this file</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              {showStripButton && metadata.hasSensitiveData && onStripConfirm && (
                <Button
                  onClick={() => {
                    onStripConfirm();
                    onClose();
                  }}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Strip Metadata & Continue
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load metadata</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MetadataViewer;
