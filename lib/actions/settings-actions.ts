'use server';

/**
 * Settings Server Actions
 * React 19 Server Actions for settings operations
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';

// ============================================================================
// SCHEMAS
// ============================================================================

const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  autoAcceptTransfers: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  downloadLocation: z.string().optional(),
  maxConcurrentTransfers: z.number().min(1).max(10).optional(),
});

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Update user settings
 */
export async function updateSettingsAction(formData: FormData) {
  try {
    const data = {
      theme: formData.get('theme') as string | null,
      language: formData.get('language') as string | null,
      autoAcceptTransfers: formData.get('autoAcceptTransfers') === 'true',
      notificationsEnabled: formData.get('notificationsEnabled') === 'true',
      downloadLocation: formData.get('downloadLocation') as string | null,
      maxConcurrentTransfers: formData.get('maxConcurrentTransfers')
        ? Number(formData.get('maxConcurrentTransfers'))
        : null,
    };

    // Clean up null values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== null)
    );

    // Validate
    const validated = SettingsSchema.parse(cleanData);

    // In a real app, this would save to database
    console.info('[Server Action] Update settings:', validated);

    // Save to cookies for immediate access
    const cookieStore = await cookies();
    if (validated.theme) {
      cookieStore.set('theme', validated.theme, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
    }
    if (validated.language) {
      cookieStore.set('language', validated.language, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      });
    }

    // Revalidate
    revalidatePath('/app/settings');

    return {
      success: true,
      data: validated,
      message: 'Settings updated successfully',
    };
  } catch (error) {
    console.error('[Server Action] Update settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings',
    };
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettingsAction() {
  try {
    const defaults = {
      theme: 'system',
      language: 'en',
      autoAcceptTransfers: false,
      notificationsEnabled: true,
      maxConcurrentTransfers: 3,
    };

    // In a real app, this would update database
    console.info('[Server Action] Reset settings to defaults');

    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete('theme');
    cookieStore.delete('language');

    // Revalidate
    revalidatePath('/app/settings');

    return {
      success: true,
      data: defaults,
      message: 'Settings reset to defaults',
    };
  } catch (error) {
    console.error('[Server Action] Reset settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset settings',
    };
  }
}

/**
 * Export settings
 */
export async function exportSettingsAction() {
  try {
    // In a real app, this would fetch current settings
    const settings = {
      // Placeholder settings
      exportedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error('[Server Action] Export settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export settings',
    };
  }
}

/**
 * Import settings
 */
export async function importSettingsAction(settingsJson: string) {
  try {
    const settings = JSON.parse(settingsJson);

    // Validate
    const validated = SettingsSchema.parse(settings);

    // In a real app, this would save to database
    console.info('[Server Action] Import settings:', validated);

    // Revalidate
    revalidatePath('/app/settings');

    return {
      success: true,
      data: validated,
      message: 'Settings imported successfully',
    };
  } catch (error) {
    console.error('[Server Action] Import settings error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import settings',
    };
  }
}

/**
 * Clear cache
 */
export async function clearCacheAction() {
  try {
    // In a real app, this would clear various caches
    console.info('[Server Action] Clear cache');

    // Revalidate all paths
    revalidatePath('/');

    return {
      success: true,
      message: 'Cache cleared successfully',
    };
  } catch (error) {
    console.error('[Server Action] Clear cache error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cache',
    };
  }
}
