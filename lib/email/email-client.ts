/**
 * Email API Client
 * Type-safe frontend client for Tallow email API
 */

/**
 * Send email request interface
 */
export interface SendEmailRequest {
  to: string;
  shareLink: string;
  senderName: string;
  message?: string;
  subject?: string;
  fileName?: string;
  fileCount?: number;
  fileSize?: string;
  expiresAt?: string | Date;
}

/**
 * Send email response interface
 */
export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string;
}

/**
 * Email status response interface
 */
export interface EmailStatusResponse {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';
  timestamp: string;
  details?: {
    queuedAt?: string;
    sentAt?: string;
    deliveredAt?: string;
    failedAt?: string;
    error?: string;
  };
}

/**
 * API error interface
 */
export interface EmailAPIError {
  error: string;
  code?: string;
  timestamp?: string;
  suggestion?: string;
}

/**
 * Get CSRF token from meta tag or cookie
 */
function getCsrfToken(): string {
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }

  // Try to get from cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token' || name === 'XSRF-TOKEN') {
      return decodeURIComponent(value ?? '');
    }
  }

  // Return empty string if not found (will fail on server)
  return '';
}

/**
 * Email API client class
 */
export class EmailClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/email') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send share email
   * @param request - Email request data
   * @returns Promise resolving to send response
   * @throws EmailAPIError on failure
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // Convert Date to ISO string if needed
    const requestData = {
      ...request,
      expiresAt: request.expiresAt instanceof Date
        ? request.expiresAt.toISOString()
        : request.expiresAt,
    };

    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      const error: EmailAPIError = data;
      throw new Error(error.error || 'Failed to send email');
    }

    return data;
  }

  /**
   * Check email delivery status
   * @param messageId - Email message ID from send response
   * @returns Promise resolving to status response
   * @throws EmailAPIError on failure
   */
  async getStatus(messageId: string): Promise<EmailStatusResponse> {
    const response = await fetch(`${this.baseUrl}/status/${messageId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      const error: EmailAPIError = data;
      throw new Error(error.error || 'Failed to get email status');
    }

    return data;
  }

  /**
   * Send welcome email
   * @param to - Recipient email
   * @param name - Recipient name
   * @returns Promise resolving to send response
   */
  async sendWelcomeEmail(to: string, _name: string): Promise<SendEmailResponse> {
    return this.sendEmail({
      to,
      shareLink: window.location.origin,
      senderName: 'Tallow Team',
      subject: 'Welcome to Tallow',
      // Welcome emails use a different template on the server
      // This is just for the API call
    });
  }
}

/**
 * Default email client instance
 */
export const emailClient = new EmailClient();

/**
 * Convenience function: Send share email
 */
export async function sendShareEmail(
  request: SendEmailRequest
): Promise<SendEmailResponse> {
  return emailClient.sendEmail(request);
}

/**
 * Convenience function: Check email status
 */
export async function getEmailStatus(
  messageId: string
): Promise<EmailStatusResponse> {
  return emailClient.getStatus(messageId);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Validate email before sending
 */
export function validateEmailBeforeSend(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Error handler for email API calls
 */
export function handleEmailError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

export default {
  EmailClient,
  emailClient,
  sendShareEmail,
  getEmailStatus,
  formatFileSize,
  validateEmailBeforeSend,
  handleEmailError,
};
