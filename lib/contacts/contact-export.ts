/**
 * Contact Export/Import Module
 *
 * Plain TypeScript module for exporting and importing contacts/friends.
 * CRITICAL: Uses .getState() for non-reactive access to store data.
 */

import { useFriendsStore, type Friend } from '../stores/friends-store';
import type { Platform } from '@/lib/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Exportable contact data structure
 */
export interface ExportedContact {
  name: string;
  deviceId: string;
  publicKey: string;
  trustLevel: 'trusted' | 'normal';
  platform: Platform;
  addedAt: number;
  transferCount: number;
  notes: string | null;
}

/**
 * Contact export format
 */
export interface ContactExport {
  version: string;
  exportedAt: number;
  contacts: ExportedContact[];
  metadata: {
    totalContacts: number;
    trustedContacts: number;
    exportedBy: string;
  };
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  duplicates: string[];
}

function getSafeBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    if (origin && /^https?:\/\//.test(origin)) {
      return origin;
    }
  }

  return 'https://tallow.app';
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export all friends as JSON blob
 * Uses .getState() for non-reactive access
 */
export function exportContacts(): ContactExport {
  const state = useFriendsStore.getState();
  const friends = state.friends;

  const contacts: ExportedContact[] = friends.map((friend) => ({
    name: friend.name,
    deviceId: friend.id,
    publicKey: friend.publicKey,
    trustLevel: friend.isTrusted ? 'trusted' : 'normal',
    platform: friend.platform,
    addedAt: friend.addedAt,
    transferCount: friend.transferCount,
    notes: friend.notes,
  }));

  const trustedCount = friends.filter((f) => f.isTrusted).length;

  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    contacts,
    metadata: {
      totalContacts: contacts.length,
      trustedContacts: trustedCount,
      exportedBy: 'Tallow',
    },
  };
}

/**
 * Export contacts and trigger download as JSON file
 */
export function downloadContactsJSON(): void {
  const exportData = exportContacts();
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `tallow-contacts-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single contact by ID
 */
export function exportSingleContact(contactId: string): ExportedContact | null {
  const state = useFriendsStore.getState();
  const friend = state.getFriendById(contactId);

  if (!friend) {
    return null;
  }

  return {
    name: friend.name,
    deviceId: friend.id,
    publicKey: friend.publicKey,
    trustLevel: friend.isTrusted ? 'trusted' : 'normal',
    platform: friend.platform,
    addedAt: friend.addedAt,
    transferCount: friend.transferCount,
    notes: friend.notes,
  };
}

// ============================================================================
// IMPORT FUNCTIONS
// ============================================================================

/**
 * Import contacts from JSON data
 * Merges with existing contacts, skipping duplicates by deviceId
 */
export function importContacts(data: string | ContactExport): ImportResult {
  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    duplicates: [],
  };

  try {
    // Parse if string
    let exportData: ContactExport;
    if (typeof data === 'string') {
      exportData = JSON.parse(data);
    } else {
      exportData = data;
    }

    // Validate format
    if (!exportData.contacts || !Array.isArray(exportData.contacts)) {
      result.errors.push('Invalid format: contacts array missing');
      return result;
    }

    // Get current state
    const state = useFriendsStore.getState();
    const existingIds = new Set(state.friends.map((f) => f.id));
    const existingPublicKeys = new Set(state.friends.map((f) => f.publicKey));

    // Import each contact
    for (const contact of exportData.contacts) {
      try {
        // Validate required fields
        if (!contact.name || !contact.deviceId || !contact.publicKey) {
          result.errors.push(`Missing required fields for contact: ${contact.name || 'Unknown'}`);
          result.skipped++;
          continue;
        }

        // Check for duplicates by deviceId or publicKey
        if (existingIds.has(contact.deviceId) || existingPublicKeys.has(contact.publicKey)) {
          result.duplicates.push(contact.name);
          result.skipped++;
          continue;
        }

        // Create friend object
        const newFriend: Friend = {
          id: contact.deviceId,
          name: contact.name,
          platform: contact.platform || 'web',
          publicKey: contact.publicKey,
          pairingCode: '', // Will need to be re-paired
          isOnline: false,
          lastSeen: contact.addedAt || Date.now(),
          isTrusted: contact.trustLevel === 'trusted',
          avatar: null,
          addedAt: contact.addedAt || Date.now(),
          notes: contact.notes || null,
          transferCount: contact.transferCount || 0,
          lastTransferAt: null,
        };

        // Add to store
        state.addFriend(newFriend);
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to import ${contact.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.skipped++;
      }
    }

    result.success = result.imported > 0;
    return result;
  } catch (error) {
    result.errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Import contacts from a file input
 */
export async function importContactsFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    return importContacts(text);
  } catch (error) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [`File read error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      duplicates: [],
    };
  }
}

// ============================================================================
// VCARD EXPORT (OPTIONAL)
// ============================================================================

/**
 * Export contacts as vCard format (v3.0)
 */
export function exportAsVCard(): string {
  const state = useFriendsStore.getState();
  const friends = state.friends;

  let vcardString = '';

  for (const friend of friends) {
    vcardString += 'BEGIN:VCARD\r\n';
    vcardString += 'VERSION:3.0\r\n';
    vcardString += `FN:${friend.name}\r\n`;
    vcardString += `N:${friend.name};;;;\r\n`;
    vcardString += `ORG:Tallow\r\n`;
    vcardString += `TITLE:${friend.platform} Device\r\n`;
    vcardString += `NOTE:Device ID: ${friend.id}\\nPublic Key: ${friend.publicKey}\\nTransfers: ${friend.transferCount}\r\n`;
    if (friend.notes) {
      vcardString += `NOTE:${friend.notes}\r\n`;
    }
    vcardString += `REV:${new Date(friend.addedAt).toISOString()}\r\n`;
    vcardString += 'END:VCARD\r\n';
  }

  return vcardString;
}

/**
 * Download contacts as vCard file
 */
export function downloadContactsVCard(): void {
  const vcardString = exportAsVCard();
  const blob = new Blob([vcardString], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `tallow-contacts-${Date.now()}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// SHAREABLE LINK GENERATION
// ============================================================================

/**
 * Generate a shareable link for a contact
 * Creates a base64-encoded URL with contact info
 */
export function generateShareableLink(contactId: string): string | null {
  const contact = exportSingleContact(contactId);

  if (!contact) {
    return null;
  }

  // Create minimal share data
  const shareData = {
    n: contact.name,
    d: contact.deviceId,
    k: contact.publicKey,
    p: contact.platform,
    t: contact.trustLevel,
  };

  // Encode to base64
  const jsonString = JSON.stringify(shareData);
  const base64 = btoa(jsonString);

  // Create shareable URL (assuming app is hosted at a domain)
  const baseUrl = getSafeBaseUrl();
  return `${baseUrl}/add-contact?data=${encodeURIComponent(base64)}`;
}

/**
 * Parse a shareable link and extract contact data
 */
export function parseShareableLink(url: string): ExportedContact | null {
  try {
    const urlObj = new URL(url, getSafeBaseUrl());
    const data = urlObj.searchParams.get('data');

    if (!data) {
      return null;
    }

    const base64 = decodeURIComponent(data);
    const jsonString = atob(base64);
    const shareData = JSON.parse(jsonString);

    return {
      name: shareData.n,
      deviceId: shareData.d,
      publicKey: shareData.k,
      platform: shareData.p || 'web',
      trustLevel: shareData.t || 'normal',
      addedAt: Date.now(),
      transferCount: 0,
      notes: null,
    };
  } catch (error) {
    console.error('Failed to parse shareable link:', error);
    return null;
  }
}

/**
 * Generate QR code data for a contact
 * Returns the shareable link that can be encoded as QR
 */
export function generateQRCodeData(contactId: string): string | null {
  return generateShareableLink(contactId);
}

/**
 * Copy shareable link to clipboard
 */
export async function copyShareableLink(contactId: string): Promise<boolean> {
  const link = generateShareableLink(contactId);

  if (!link) {
    return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(link);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Share contact using Web Share API if available
 */
export async function shareContactNative(contactId: string): Promise<boolean> {
  const contact = exportSingleContact(contactId);
  const link = generateShareableLink(contactId);

  if (!contact || !link) {
    return false;
  }

  // Check if Web Share API is available
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title: `Add ${contact.name} on Tallow`,
      text: `Connect with ${contact.name} on Tallow for secure file transfers`,
      url: link,
    });
    return true;
  } catch (error) {
    // User cancelled or error occurred
    console.error('Share failed:', error);
    return false;
  }
}
