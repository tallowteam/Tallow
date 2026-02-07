'use server';

/**
 * Device Server Actions
 * React 19 Server Actions for device operations
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const DeviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Device name is required'),
  platform: z.enum(['windows', 'macos', 'linux', 'android', 'ios', 'web']),
});

const DeviceUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  isFavorite: z.boolean().optional(),
});

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Register a new device
 */
export async function registerDeviceAction(formData: FormData) {
  try {
    const data = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      platform: formData.get('platform') as string,
    };

    // Validate
    const validated = DeviceSchema.parse(data);

    // In a real app, this would save to database
    console.info('[Server Action] Register device:', validated);

    // Revalidate
    revalidatePath('/app');
    revalidatePath('/app/devices');

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    console.error('[Server Action] Register device error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register device',
    };
  }
}

/**
 * Update device
 */
export async function updateDeviceAction(formData: FormData) {
  try {
    const data = {
      id: formData.get('id') as string,
      name: formData.get('name') as string | null,
      isFavorite: formData.get('isFavorite') === 'true',
    };

    // Clean up undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== null)
    );

    // Validate
    const validated = DeviceUpdateSchema.parse(cleanData);

    // In a real app, this would update database
    console.info('[Server Action] Update device:', validated);

    // Revalidate
    revalidatePath('/app');
    revalidatePath('/app/devices');

    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    console.error('[Server Action] Update device error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update device',
    };
  }
}

/**
 * Delete device
 */
export async function deleteDeviceAction(deviceId: string) {
  try {
    // In a real app, this would delete from database
    console.info('[Server Action] Delete device:', deviceId);

    // Revalidate
    revalidatePath('/app');
    revalidatePath('/app/devices');

    return {
      success: true,
      message: 'Device deleted successfully',
    };
  } catch (error) {
    console.error('[Server Action] Delete device error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete device',
    };
  }
}

/**
 * Toggle device favorite
 */
export async function toggleDeviceFavoriteAction(deviceId: string, isFavorite: boolean) {
  try {
    // In a real app, this would update database
    console.info('[Server Action] Toggle device favorite:', { deviceId, isFavorite });

    // Revalidate
    revalidatePath('/app');

    return {
      success: true,
      data: { deviceId, isFavorite },
    };
  } catch (error) {
    console.error('[Server Action] Toggle device favorite error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update favorite status',
    };
  }
}

/**
 * Get device statistics
 */
export async function getDeviceStatsAction(deviceId: string) {
  try {
    // In a real app, this would query database
    console.info('[Server Action] Get device stats:', deviceId);

    // Simulate stats
    const stats = {
      totalTransfers: 0,
      totalDataTransferred: 0,
      lastActive: new Date().toISOString(),
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('[Server Action] Get device stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get device stats',
    };
  }
}

/**
 * Sync devices
 */
export async function syncDevicesAction() {
  try {
    // In a real app, this would sync with backend
    console.info('[Server Action] Sync devices');

    // Revalidate
    revalidatePath('/app');
    revalidatePath('/app/devices');

    return {
      success: true,
      message: 'Devices synced successfully',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Server Action] Sync devices error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync devices',
    };
  }
}
