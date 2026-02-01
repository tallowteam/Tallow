/**
 * Email Transfer API - Webhook Handler
 * POST /api/email/webhook
 * Handles delivery events from Resend
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateEmailTransferStatus,
  recordAnalyticsEvent,
} from '@/lib/email/email-storage';
import { secureLog } from '@/lib/utils/secure-logger';
import type { EmailWebhookEvent } from '@/lib/email/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    tags?: Array<{ name: string; value: string }>;
  };
}

/**
 * Verify webhook signature
 * Returns: { valid: boolean; error?: string; status?: number }
 */
function verifyWebhookSignature(
  request: NextRequest,
  body: string
): { valid: boolean; error?: string; status?: number } {
  const signature = request.headers.get('resend-signature');
  const webhookSecret = process.env['RESEND_WEBHOOK_SECRET'];
  const isProduction = process.env['NODE_ENV'] === 'production';

  // In production, webhook secret is mandatory
  if (isProduction && !webhookSecret) {
    console.error('RESEND_WEBHOOK_SECRET is required in production');
    return {
      valid: false,
      error: 'Webhook verification not configured',
      status: 503,
    };
  }

  // In development without secret, skip verification
  if (!webhookSecret) {
    return { valid: true };
  }

  // Secret is configured, signature is required
  if (!signature) {
    return {
      valid: false,
      error: 'Invalid webhook signature',
      status: 401,
    };
  }

  // Verify signature using HMAC-SHA256
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');

  const isValidSignature = signature === expectedSignature;

  if (!isValidSignature) {
    return {
      valid: false,
      error: 'Invalid webhook signature',
      status: 401,
    };
  }

  return { valid: true };
}

/**
 * Extract transfer ID from email tags
 */
function extractTransferId(payload: ResendWebhookPayload): string | null {
  const tags = payload.data.tags || [];
  const transferTag = tags.find(tag => tag.name === 'transfer_id');
  return transferTag?.value || null;
}

/**
 * Map Resend event type to our event type
 */
function mapEventType(resendType: string): EmailWebhookEvent['event'] | null {
  const eventMap: Record<string, EmailWebhookEvent['event']> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'delivered', // Changed from 'pending' to valid status
    'email.complained': 'failed',
    'email.bounced': 'failed',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
  };

  return eventMap[resendType] || null;
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature (mandatory in production)
    const signatureResult = verifyWebhookSignature(request, rawBody);
    if (!signatureResult.valid) {
      secureLog.warn(`[Webhook] ${signatureResult.error}`);
      return NextResponse.json(
        { error: signatureResult.error },
        { status: signatureResult.status || 401 }
      );
    }

    // Parse payload
    const payload: ResendWebhookPayload = JSON.parse(rawBody);

    // Extract transfer ID
    const transferId = extractTransferId(payload);
    if (!transferId) {
      secureLog.warn('[Webhook] No transfer_id in payload');
      return NextResponse.json(
        { error: 'No transfer_id found' },
        { status: 400 }
      );
    }

    // Map event type
    const eventType = mapEventType(payload.type);
    if (!eventType) {
      secureLog.warn(`[Webhook] Unknown event type: ${payload.type}`);
      return NextResponse.json({ success: true }); // Ignore unknown events
    }

    const recipientEmail = payload.data.to[0] || '';
    const timestamp = new Date(payload.created_at).getTime();

    // Update transfer status
    await updateEmailTransferStatus(transferId, eventType);

    // Record analytics event
    const analyticsEvent: EmailWebhookEvent = {
      event: eventType,
      emailId: transferId,
      recipientEmail,
      timestamp,
    };

    await recordAnalyticsEvent(analyticsEvent);

    secureLog.log(
      `[Webhook] Processed ${eventType} event for transfer ${transferId}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    secureLog.error('[Webhook] Failed to process webhook:', error);

    // Return 200 even on error to prevent retries for invalid data
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
