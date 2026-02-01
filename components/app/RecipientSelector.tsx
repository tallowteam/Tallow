'use client';

/**
 * Enhanced Recipient Selector Component
 * Multi-select UI for choosing recipients for group file transfers
 *
 * Features:
 * - Smooth animations with framer-motion
 * - Keyboard shortcuts (Ctrl+A, Escape, Arrow keys)
 * - Enhanced search with debouncing
 * - Mobile-optimized with swipe gestures
 * - Accessible with ARIA labels and focus management
 */

import { useState, useCallback, useEffect, useRef, memo, useDeferredValue, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Search,
  CheckCircle2,
  Circle,
  Monitor,
  Smartphone,
  Laptop,
  X,
} from 'lucide-react';
import { Device } from '@/lib/types';
import {
  staggerContainerVariants,
  listItemVariants,
  scaleVariants,
  fadeUpVariants,
  getTransition,
} from '@/lib/animations/motion-config';

interface RecipientSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDevices: Device[];
  selectedDeviceIds: string[];
  onSelectionChange: (deviceIds: string[]) => void;
  onConfirm: () => void;
  minRecipients?: number;
  maxRecipients?: number;
  title?: string;
  description?: string;
}

/**
 * Get device icon based on platform
 */
function getDeviceIcon(platform: Device['platform']) {
  switch (platform) {
    case 'android':
    case 'ios':
      return Smartphone;
    case 'windows':
    case 'macos':
    case 'linux':
      return Laptop;
    default:
      return Monitor;
  }
}

/**
 * Get platform display name
 */
function getPlatformName(platform: Device['platform']): string {
  const names: Record<Device['platform'], string> = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    android: 'Android',
    ios: 'iOS',
    web: 'Web',
  };
  return names[platform] || platform;
}

/**
 * Get device avatar color based on ID
 */
function getDeviceAvatarColor(deviceId: string): string {
  const colors = [
    'bg-[#fefefc]',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  const hash = deviceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || 'bg-[#fefefc]';
}

export const RecipientSelector = memo(function RecipientSelector({
  open,
  onOpenChange,
  availableDevices,
  selectedDeviceIds,
  onSelectionChange,
  onConfirm,
  minRecipients = 1,
  maxRecipients = 10,
  title = 'Select Recipients',
  description = 'Choose devices to send files to',
}: RecipientSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Defer search query for non-blocking filtering
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Filter devices based on deferred search query
  const filteredDevices = useMemo(() =>
    availableDevices.filter((device) => {
      if (!deferredSearchQuery) {return true;}
      const query = deferredSearchQuery.toLowerCase();
      return (
        device.name.toLowerCase().includes(query) ||
        device.platform.toLowerCase().includes(query) ||
        device.id.toLowerCase().includes(query)
      );
    }),
    [availableDevices, deferredSearchQuery]
  );

  // Track if search is stale for visual feedback
  const isSearchStale = searchQuery !== deferredSearchQuery;

  // Toggle device selection
  const toggleDevice = useCallback(
    (deviceId: string) => {
      const isSelected = selectedDeviceIds.includes(deviceId);

      if (isSelected) {
        // Deselect
        onSelectionChange(selectedDeviceIds.filter((id) => id !== deviceId));
      } else {
        // Select (if under max limit)
        if (selectedDeviceIds.length < maxRecipients) {
          onSelectionChange([...selectedDeviceIds, deviceId]);
        }
      }
    },
    [selectedDeviceIds, onSelectionChange, maxRecipients]
  );

  // Select all visible devices
  const selectAll = useCallback(() => {
    const deviceIdsToAdd = filteredDevices
      .slice(0, maxRecipients)
      .map((d) => d.id);
    onSelectionChange(deviceIdsToAdd);
  }, [filteredDevices, maxRecipients, onSelectionChange]);

  // Clear selection
  const clearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Remove specific device (with animation)
  const removeDevice = useCallback(
    (deviceId: string) => {
      onSelectionChange(selectedDeviceIds.filter((id) => id !== deviceId));
    },
    [selectedDeviceIds, onSelectionChange]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) {return;}

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A or Cmd+A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        selectAll();
        return;
      }

      // Escape: Clear selection or close
      if (e.key === 'Escape') {
        if (selectedDeviceIds.length > 0) {
          e.preventDefault();
          clearAll();
        }
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredDevices.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }

      // Enter or Space: Toggle focused device
      if ((e.key === 'Enter' || e.key === ' ') && focusedIndex >= 0 && focusedIndex < filteredDevices.length) {
        e.preventDefault();
        const device = filteredDevices[focusedIndex];
        if (device) {
          toggleDevice(device.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectAll, clearAll, selectedDeviceIds, focusedIndex, filteredDevices, toggleDevice]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [searchQuery]);

  // Programmatically focus item when focusedIndex changes (WCAG 2.1.1, 2.4.7)
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  const canConfirm =
    selectedDeviceIds.length >= minRecipients &&
    selectedDeviceIds.length <= maxRecipients;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        aria-describedby="recipient-selector-description"
        data-testid="recipient-selector-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" aria-hidden="true" />
            {title}
          </DialogTitle>
          <DialogDescription id="recipient-selector-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="flex-1 flex flex-col gap-4 overflow-hidden"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Search bar */}
          <motion.div className="relative" variants={listItemVariants}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search devices... (Ctrl+A to select all)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search devices"
            />
          </motion.div>

          {/* Selection summary */}
          <motion.div
            className="flex items-center justify-between gap-2 flex-wrap"
            variants={listItemVariants}
          >
            <div className="text-sm text-muted-foreground" data-testid="selection-count">
              {selectedDeviceIds.length} of {maxRecipients} selected
              {minRecipients > 1 && ` (minimum ${minRecipients})`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                disabled={filteredDevices.length === 0}
                className="h-9"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={selectedDeviceIds.length === 0}
                className="h-9"
              >
                Clear All
              </Button>
            </div>
          </motion.div>

          {/* Selected devices badges */}
          <AnimatePresence mode="popLayout">
            {selectedDeviceIds.length > 0 && (
              <motion.div
                className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-xl min-h-[44px]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={getTransition()}
              >
                <AnimatePresence mode="popLayout">
                  {selectedDeviceIds.map((deviceId) => {
                    const device = availableDevices.find((d) => d.id === deviceId);
                    if (!device) {return null;}

                    return (
                      <motion.div
                        key={deviceId}
                        variants={scaleVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-2 pr-1 pl-3 h-9 text-sm"
                        >
                          <span className="truncate max-w-[120px]">{device.name}</span>
                          <button
                            onClick={() => removeDevice(deviceId)}
                            className="ml-1 rounded-full hover:bg-background/40 p-1.5 transition-colors min-w-[24px] min-h-[24px]"
                            aria-label={`Remove ${device.name}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </Badge>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device list */}
          <ScrollArea className="flex-1 -mx-6 px-6" ref={listRef} style={{ opacity: isSearchStale ? 0.7 : 1, transition: 'opacity 150ms' }}>
            <AnimatePresence mode="popLayout">
              {filteredDevices.length === 0 ? (
                <motion.div
                  className="text-center py-12 text-muted-foreground"
                  role="status"
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />
                  <p>
                    {searchQuery
                      ? 'No devices match your search'
                      : 'No devices available'}
                  </p>
                </motion.div>
              ) : (
                <motion.ul
                  className="space-y-2"
                  role="list"
                  aria-label="Available devices"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  data-testid="device-list"
                >
                  {filteredDevices.map((device, index) => {
                    const isSelected = selectedDeviceIds.includes(device.id);
                    const isDisabled =
                      !isSelected && selectedDeviceIds.length >= maxRecipients;
                    const isFocused = index === focusedIndex;
                    const DeviceIcon = getDeviceIcon(device.platform);
                    const avatarColor = getDeviceAvatarColor(device.id);

                    return (
                      <motion.li
                        key={device.id}
                        variants={listItemVariants}
                        layout
                        data-testid="recipient-item"
                      >
                        <Card
                          ref={(el) => {
                            itemRefs.current[index] = el;
                          }}
                          className={`p-4 cursor-pointer transition-all hover:border-primary/30 min-h-[72px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring ${
                            isSelected ? 'border-primary bg-accent' : ''
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${
                            isFocused ? 'ring-[3px] ring-ring' : ''
                          }`}
                          onClick={() => !isDisabled && toggleDevice(device.id)}
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={isSelected}
                          aria-disabled={isDisabled}
                          data-testid="device-item"
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
                              e.preventDefault();
                              toggleDevice(device.id);
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Checkbox */}
                            <motion.div
                              className="flex-shrink-0"
                              whileTap={{ scale: 0.9 }}
                            >
                              {isSelected ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                  <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                                </motion.div>
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                              )}
                            </motion.div>

                            {/* Device avatar/icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center`}>
                              <DeviceIcon className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>

                            {/* Device info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{device.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                                <span>{getPlatformName(device.platform)}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  {device.isOnline ? (
                                    <>
                                      <motion.div
                                        className="w-2 h-2 rounded-full bg-green-500"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                      />
                                      <span className="text-green-600 dark:text-green-400">Online</span>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                                      <span>Offline</span>
                                    </>
                                  )}
                                </div>
                                {device.isFavorite && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs h-5">
                                      Favorite
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Loading indicator for offline devices */}
                            {!device.isOnline && (
                              <Badge variant="outline" className="text-xs h-6 flex-shrink-0">
                                Offline
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </ScrollArea>
        </motion.div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
            data-testid="close-dialog"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={!canConfirm}
            className="flex-1 sm:flex-none"
            data-testid="confirm-recipients"
          >
            Continue with {selectedDeviceIds.length} recipient
            {selectedDeviceIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

RecipientSelector.displayName = 'RecipientSelector';
