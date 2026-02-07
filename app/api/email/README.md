# Tallow Email API

Comprehensive email API for share-by-email functionality with production-ready security, validation, and rate limiting.

## Overview

The Email API provides secure endpoints for sending share notifications via email with file transfer links. Built with Resend integration and following OWASP security guidelines.

## Features

- **Secure Email Sending**: RFC 5322 compliant validation
- **Rate Limiting**: 10 emails/hour per IP to prevent spam
- **CSRF Protection**: Token-based request validation
- **Input Sanitization**: XSS and injection prevention
- **Disposable Email Detection**: Warns about temporary email addresses
- **Branded Templates**: Dark theme Tallow branding
- **Development Mode**: Console logging when API key not configured

## API Routes

### POST /api/email/send

Send a share notification email with file transfer link.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "shareLink": "https://tallow.app/transfer/abc123",
  "senderName": "John Doe",
  "message": "Optional personal message",
  "fileName": "document.pdf",
  "fileCount": 3,
  "fileSize": "2.5 MB",
  "expiresAt": "2026-02-13T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "re_abc123xyz",
  "warning": "Recipient email appears to be a disposable address"
}
```

**Rate Limits:**
- 10 requests per hour per IP
- Returns 429 Too Many Requests when exceeded

**Security:**
- CSRF token required (X-CSRF-Token header)
- Input validation and sanitization
- HTTPS required in production
- Email format validation (RFC 5322)

**Error Responses:**
```json
{
  "error": "Invalid email address",
  "code": "BAD_REQUEST",
  "timestamp": "2026-02-06T12:00:00Z",
  "suggestion": "user@gmail.com"
}
```

### GET /api/email/status/[id]

Check email delivery status by message ID.

**Example:**
```
GET /api/email/status/re_abc123xyz
```

**Response:**
```json
{
  "id": "re_abc123xyz",
  "status": "delivered",
  "timestamp": "2026-02-06T12:00:00Z",
  "details": {
    "queuedAt": "2026-02-06T12:00:00Z",
    "sentAt": "2026-02-06T12:00:01Z",
    "deliveredAt": "2026-02-06T12:00:05Z"
  }
}
```

**Status Values:**
- `queued` - Email queued for sending
- `sent` - Email sent to recipient's server
- `delivered` - Email delivered to inbox
- `failed` - Delivery failed
- `bounced` - Email bounced (invalid address)
- `complained` - Marked as spam

**Rate Limits:**
- 30 requests per minute per IP

## Email Templates

### Share Email Template

Professional dark-themed email with Tallow branding:

**Features:**
- Responsive mobile-friendly layout
- Dark theme with purple accent (#9333EA)
- File transfer details table
- Security notice with encryption badge
- Expiration warning
- Plain text fallback

**Preview:**
```
┌─────────────────────────────────────┐
│         📁 Tallow                   │
│    Secure File Transfer             │
├─────────────────────────────────────┤
│                                     │
│  John Doe shared 3 files with you   │
│                                     │
│  "Here are the documents we         │
│   discussed in our meeting."        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ TRANSFER DETAILS              │  │
│  │ From: John Doe                │  │
│  │ Files: 3 files                │  │
│  │ Size: 2.5 MB                  │  │
│  │ Expires: Feb 13, 2026         │  │
│  └───────────────────────────────┘  │
│                                     │
│      [ Download Files ]             │
│                                     │
│  🔒 Secure Transfer                 │
│  End-to-end encrypted               │
│                                     │
└─────────────────────────────────────┘
```

### Welcome Email Template

Onboarding email for new users with feature highlights.

## Email Validation

### RFC 5322 Compliant

```typescript
import { validateEmail, validateEmailDetailed } from '@/lib/email/email-validation';

// Basic validation
const isValid = validateEmail('user@example.com'); // true

// Detailed validation
const result = validateEmailDetailed('user@gmial.com');
// {
//   valid: false,
//   error: 'Invalid email format',
//   suggestion: 'user@gmail.com'
// }
```

### Features

- **Format Validation**: RFC 5322 regex
- **Length Limits**: 254 chars total, 64 chars local part
- **Domain Validation**: TLD requirements, label limits
- **Typo Detection**: Common domain misspellings
- **Disposable Detection**: 200+ disposable email domains
- **Sanitization**: XSS and injection prevention
- **Normalization**: Gmail dot/plus addressing

### Disposable Email Domains

Detects temporary email providers:
- 10minutemail.com
- guerrillamail.com
- mailinator.com
- tempmail.com
- throwaway.email
- yopmail.com
- And 200+ more

### Security Features

```typescript
// Sanitize input
const clean = sanitizeEmailInput('user@example.com<script>');
// 'user@example.com'

// Calculate risk score
const risk = calculateEmailRiskScore('temp123@throwaway.email');
// 85 (high risk - disposable + suspicious pattern)

// Normalize for comparison
const normalized = normalizeEmail('User.Name+tag@Gmail.com');
// 'username@gmail.com'
```

## Configuration

### Environment Variables

```bash
# Required for production
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Tallow <noreply@yourdomain.com>

# Optional
NEXT_PUBLIC_APP_URL=https://tallow.app
ALLOWED_ORIGINS=https://tallow.app,https://www.tallow.app
```

### Development Mode

When `RESEND_API_KEY` is not configured in development:
- Emails are logged to console instead of being sent
- Returns success with warning message
- Full email details printed for debugging

**Console Output:**
```javascript
[Email API] Development mode - Email not sent:
{
  to: 'recipient@example.com',
  from: 'noreply@tallow.app',
  subject: 'John Doe shared files with you via Tallow',
  senderName: 'John Doe',
  shareLink: 'https://tallow.app/transfer/abc123',
  // ... more details
}
```

## Security Implementation

### Rate Limiting

**Email Send:** 10 requests/hour per IP
```typescript
const emailRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many email requests. Please try again later.',
});
```

**Status Check:** 30 requests/minute per IP
```typescript
const statusRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
});
```

### CSRF Protection

All POST requests require CSRF token:
```typescript
// Request header
X-CSRF-Token: <token>

// Validation
const csrfError = requireCSRFToken(request);
if (csrfError) {
  return csrfError; // 403 Forbidden
}
```

### Input Sanitization

```typescript
function sanitizeText(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length (500 chars)
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized.trim();
}
```

### URL Validation

```typescript
// Validate share link
const url = new URL(shareLink);

// Require HTTPS in production
if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
  return ApiErrors.badRequest('Share link must use HTTPS');
}
```

## Error Handling

### Standard Error Responses

All errors follow consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `BAD_REQUEST` | 400 | Invalid input or format |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `FORBIDDEN` | 403 | CSRF token missing |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `BAD_GATEWAY` | 502 | Resend API error |
| `SERVICE_UNAVAILABLE` | 503 | Email service not configured |

### Development vs Production

**Development:**
- Detailed error messages
- Stack traces in console
- Suggestions for common issues

**Production:**
- Sanitized error messages
- No sensitive information leaked
- Generic "Internal server error" for unexpected errors

## Usage Examples

### Frontend Integration

```typescript
// Send share email
async function sendShareEmail(data: {
  to: string;
  shareLink: string;
  senderName: string;
  message?: string;
}) {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Check email status
async function checkEmailStatus(messageId: string) {
  const response = await fetch(`/api/email/status/${messageId}`);
  return response.json();
}
```

### React Hook Example

```typescript
import { useState } from 'react';

export function useSendEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = async (data: SendEmailRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading, error };
}
```

## Testing

### Manual Testing

```bash
# Send test email
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-token" \
  -d '{
    "to": "test@example.com",
    "shareLink": "https://tallow.app/transfer/test123",
    "senderName": "Test User",
    "message": "Test message",
    "fileName": "test.pdf"
  }'

# Check status
curl http://localhost:3000/api/email/status/re_abc123xyz
```

### Rate Limit Testing

```bash
# Test rate limiting (should fail after 10 requests)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/email/send \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: token" \
    -d '{"to":"test@example.com","shareLink":"https://example.com","senderName":"Test"}'
  echo "Request $i"
done
```

## Monitoring

### Metrics

Track email API usage:
- Total emails sent
- Delivery success rate
- Rate limit hits
- Disposable email detections
- Average response time

### Logging

All operations are logged with secure logging:
```typescript
secureLog.log('[Email API] Sent email to user@example.com (ID: re_123)');
secureLog.warn('[Email API] Disposable email detected: temp@mail.com');
secureLog.error('[Email API] Failed to send email:', error);
```

## Production Checklist

- [ ] Configure `RESEND_API_KEY` environment variable
- [ ] Set `RESEND_FROM_EMAIL` with verified domain
- [ ] Configure `ALLOWED_ORIGINS` for CORS
- [ ] Enable HTTPS (required for production)
- [ ] Set up monitoring for email delivery
- [ ] Configure webhook handlers for Resend events
- [ ] Test rate limiting behavior
- [ ] Verify CSRF protection is enabled
- [ ] Review error handling and logging
- [ ] Set up alerts for high failure rates

## Support

For issues or questions:
- Documentation: `/app/api/email/README.md`
- Email validation: `/lib/email/email-validation.ts`
- Templates: `/lib/email/email-templates.ts`
- API routes: `/app/api/email/`

## License

Part of Tallow - Secure File Transfer Platform
