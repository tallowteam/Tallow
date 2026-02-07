/**
 * Scheduled Transfer Module
 *
 * Manages scheduling transfers to execute at specific times with optional
 * repeat functionality. Persists scheduled transfers to localStorage and
 * checks device availability before executing.
 */

import { generateUUID } from '../utils/uuid';
import { useDeviceStore } from '../stores/device-store';
import { useTransferStore } from '../stores/transfer-store';
import TransferManager from './transfer-manager';
import { Device, FileInfo } from '../types';
import secureLog from '../utils/secure-logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RepeatType = 'once' | 'daily' | 'weekly';

export interface ScheduledTransferOptions {
  files: File[];
  deviceId: string;
  scheduledTime: Date;
  repeat?: RepeatType;
  autoRetry?: boolean;
  maxRetries?: number;
}

export interface ScheduledTransfer {
  id: string;
  files: FileInfo[];
  deviceId: string;
  scheduledTime: number;
  repeat: RepeatType;
  autoRetry: boolean;
  maxRetries: number;
  retryCount: number;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  lastAttempt: number | null;
  nextRun: number | null;
  error: string | null;
}

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY = 'tallow-scheduled-transfers';

function loadScheduledTransfers(): ScheduledTransfer[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    secureLog.error('Failed to load scheduled transfers', { error });
    return [];
  }
}

function saveScheduledTransfers(transfers: ScheduledTransfer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  } catch (error) {
    secureLog.error('Failed to save scheduled transfers', { error });
  }
}

// ============================================================================
// IN-MEMORY STATE
// ============================================================================

let scheduledTransfers: ScheduledTransfer[] = loadScheduledTransfers();
let timers: Map<string, NodeJS.Timeout | number> = new Map();
let listeners: Set<() => void> = new Set();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function notifyListeners(): void {
  listeners.forEach(listener => listener());
}

function fileToFileInfo(file: File): FileInfo {
  return {
    id: generateUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    hash: '', // Will be computed during transfer
    thumbnail: null,
    path: null,
  };
}

function isDeviceAvailable(deviceId: string): boolean {
  const device = useDeviceStore.getState().getDeviceById(deviceId);
  return device?.isOnline ?? false;
}

function calculateNextRun(scheduledTime: number, repeat: RepeatType): number | null {
  if (repeat === 'once') return null;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  let nextRun = scheduledTime;

  if (repeat === 'daily') {
    while (nextRun <= now) {
      nextRun += dayMs;
    }
  } else if (repeat === 'weekly') {
    while (nextRun <= now) {
      nextRun += weekMs;
    }
  }

  return nextRun;
}

async function executeTransfer(scheduled: ScheduledTransfer): Promise<boolean> {
  secureLog.log('[ScheduledTransfer] Executing scheduled transfer', { id: scheduled.id });

  // Check if device is available
  if (!isDeviceAvailable(scheduled.deviceId)) {
    secureLog.warn('[ScheduledTransfer] Device unavailable', { deviceId: scheduled.deviceId });

    if (scheduled.autoRetry && scheduled.retryCount < scheduled.maxRetries) {
      // Retry in 5 minutes
      const retryDelay = 5 * 60 * 1000;
      scheduled.retryCount++;
      scheduled.lastAttempt = Date.now();
      scheduled.nextRun = Date.now() + retryDelay;

      saveScheduledTransfers(scheduledTransfers);
      notifyListeners();

      // Schedule retry
      const timer = setTimeout(() => {
        executeScheduledTransfer(scheduled.id);
      }, retryDelay);

      timers.set(scheduled.id, timer);

      return false;
    } else {
      scheduled.status = 'failed';
      scheduled.error = 'Device unavailable';
      scheduled.lastAttempt = Date.now();
      saveScheduledTransfers(scheduledTransfers);
      notifyListeners();
      return false;
    }
  }

  // Get device and start transfer
  const device = useDeviceStore.getState().getDeviceById(scheduled.deviceId);
  if (!device) {
    scheduled.status = 'failed';
    scheduled.error = 'Device not found';
    scheduled.lastAttempt = Date.now();
    saveScheduledTransfers(scheduledTransfers);
    notifyListeners();
    return false;
  }

  try {
    scheduled.status = 'running';
    scheduled.lastAttempt = Date.now();
    saveScheduledTransfers(scheduledTransfers);
    notifyListeners();

    const transferManager = TransferManager.getInstance();
    const currentDevice: Device = {
      id: generateUUID(),
      name: 'This Device',
      platform: 'web',
      ip: null,
      port: null,
      isOnline: true,
      isFavorite: false,
      lastSeen: Date.now(),
      avatar: null,
    };

    const transfer = transferManager.addTransfer(
      scheduled.files,
      currentDevice,
      device,
      'send'
    );

    useTransferStore.getState().addTransfer(transfer);

    // Mark as completed
    scheduled.status = 'completed';
    scheduled.retryCount = 0;
    scheduled.error = null;

    // Calculate next run if repeating
    if (scheduled.repeat !== 'once') {
      scheduled.nextRun = calculateNextRun(scheduled.scheduledTime, scheduled.repeat);
      if (scheduled.nextRun) {
        scheduled.status = 'scheduled';
        scheduleTimer(scheduled);
      }
    }

    saveScheduledTransfers(scheduledTransfers);
    notifyListeners();

    secureLog.log('[ScheduledTransfer] Transfer executed successfully', { id: scheduled.id });
    return true;
  } catch (error) {
    secureLog.error('[ScheduledTransfer] Transfer execution failed', { error });
    scheduled.status = 'failed';
    scheduled.error = error instanceof Error ? error.message : 'Unknown error';
    saveScheduledTransfers(scheduledTransfers);
    notifyListeners();
    return false;
  }
}

function scheduleTimer(scheduled: ScheduledTransfer): void {
  const now = Date.now();
  const targetTime = scheduled.nextRun || scheduled.scheduledTime;
  const delay = Math.max(0, targetTime - now);

  // Clear existing timer
  const existingTimer = timers.get(scheduled.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  secureLog.log('[ScheduledTransfer] Scheduling timer', {
    id: scheduled.id,
    delay: delay / 1000 / 60, // minutes
  });

  const timer = setTimeout(() => {
    executeScheduledTransfer(scheduled.id);
  }, delay);

  timers.set(scheduled.id, timer);
}

function executeScheduledTransfer(id: string): void {
  const scheduled = scheduledTransfers.find(s => s.id === id);
  if (!scheduled || scheduled.status === 'cancelled') {
    return;
  }

  executeTransfer(scheduled);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Schedule a transfer to execute at a specific time
 */
export function scheduleTransfer(options: ScheduledTransferOptions): string {
  const {
    files,
    deviceId,
    scheduledTime,
    repeat = 'once',
    autoRetry = true,
    maxRetries = 3,
  } = options;

  const scheduled: ScheduledTransfer = {
    id: generateUUID(),
    files: files.map(fileToFileInfo),
    deviceId,
    scheduledTime: scheduledTime.getTime(),
    repeat,
    autoRetry,
    maxRetries,
    retryCount: 0,
    status: 'scheduled',
    createdAt: Date.now(),
    lastAttempt: null,
    nextRun: scheduledTime.getTime(),
    error: null,
  };

  scheduledTransfers.push(scheduled);
  saveScheduledTransfers(scheduledTransfers);

  // Schedule the timer
  scheduleTimer(scheduled);

  notifyListeners();

  secureLog.log('[ScheduledTransfer] Transfer scheduled', {
    id: scheduled.id,
    scheduledTime: new Date(scheduled.scheduledTime).toISOString(),
    repeat,
  });

  return scheduled.id;
}

/**
 * Cancel a scheduled transfer
 */
export function cancelScheduled(scheduleId: string): boolean {
  const index = scheduledTransfers.findIndex(s => s.id === scheduleId);
  if (index === -1) return false;

  const scheduled = scheduledTransfers[index];
  scheduled.status = 'cancelled';

  // Clear timer
  const timer = timers.get(scheduleId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(scheduleId);
  }

  saveScheduledTransfers(scheduledTransfers);
  notifyListeners();

  secureLog.log('[ScheduledTransfer] Transfer cancelled', { id: scheduleId });

  return true;
}

/**
 * Get all scheduled transfers
 */
export function getScheduledTransfers(): ScheduledTransfer[] {
  return [...scheduledTransfers];
}

/**
 * Get a specific scheduled transfer by ID
 */
export function getScheduledTransfer(id: string): ScheduledTransfer | null {
  return scheduledTransfers.find(s => s.id === id) || null;
}

/**
 * Delete a scheduled transfer (removes from history)
 */
export function deleteScheduled(scheduleId: string): boolean {
  const index = scheduledTransfers.findIndex(s => s.id === scheduleId);
  if (index === -1) return false;

  // Cancel first if still scheduled
  const scheduled = scheduledTransfers[index];
  if (scheduled.status === 'scheduled' || scheduled.status === 'running') {
    cancelScheduled(scheduleId);
  }

  // Remove from list
  scheduledTransfers.splice(index, 1);
  saveScheduledTransfers(scheduledTransfers);
  notifyListeners();

  return true;
}

/**
 * Subscribe to changes in scheduled transfers
 */
export function onScheduledTransfersChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Initialize scheduled transfer system (reschedule pending transfers)
 */
export function initializeScheduledTransfers(): void {
  secureLog.log('[ScheduledTransfer] Initializing scheduled transfers');

  const now = Date.now();

  // Clean up old completed/failed transfers (keep last 30 days)
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  scheduledTransfers = scheduledTransfers.filter(s => {
    if (['completed', 'failed', 'cancelled'].includes(s.status)) {
      return s.createdAt > thirtyDaysAgo;
    }
    return true;
  });

  // Reschedule pending transfers
  scheduledTransfers.forEach(scheduled => {
    if (scheduled.status === 'scheduled') {
      const targetTime = scheduled.nextRun || scheduled.scheduledTime;

      if (targetTime > now) {
        // Future transfer, reschedule
        scheduleTimer(scheduled);
      } else {
        // Missed transfer
        if (scheduled.repeat !== 'once') {
          // Calculate next run for repeating transfers
          const nextRun = calculateNextRun(scheduled.scheduledTime, scheduled.repeat);
          if (nextRun) {
            scheduled.nextRun = nextRun;
            scheduleTimer(scheduled);
          }
        } else {
          // One-time transfer that was missed
          scheduled.status = 'failed';
          scheduled.error = 'Missed scheduled time';
        }
      }
    }
  });

  saveScheduledTransfers(scheduledTransfers);
  notifyListeners();
}

/**
 * Clean up all timers (call on app shutdown)
 */
export function cleanupScheduledTransfers(): void {
  timers.forEach(timer => clearTimeout(timer));
  timers.clear();
  listeners.clear();
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initializeScheduledTransfers();
}
