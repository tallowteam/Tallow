# Email API Quick Reference

Fast lookup for Tallow email functionality.

## API Endpoints

### Send Email
```typescript
POST /api/email/send
Content-Type: application/json
X-CSRF-Token: <token>

{
  "to": "user@example.com",
  "shareLink": "https://tallow.app/transfer/abc",
  "senderName": "John Doe",
  "message": "Optional message",
  "fileName": "file.pdf",
  "fileCount": 1,
  "fileSize": "2.5 MB",
  "expiresAt": "2026-02-13T00:00:00Z"
}

Rate Limit: 10/hour per IP
```

### Check Status
```typescript
GET /api/email/status/{messageId}

Rate Limit: 30/minute per IP
```

## Email Validation

```typescript
import {
  validateEmail,
  validateEmailDetailed,
  sanitizeEmailInput,
  isDisposableEmail
} from '@/lib/email';

// Basic validation
validateEmail('user@example.com') // true/false

// Detailed validation with suggestions
validateEmailDetailed('user@gmial.com')
// { valid: false, error: '...', suggestion: 'user@gmail.com' }

// Sanitize input
sanitizeEmailInput('user@example.com<script>')
// 'user@example.com'

// Check disposable
isDisposableEmail('temp@10minutemail.com') // true
```

## Email Templates

```typescript
import { shareEmailTemplate, welcomeEmailTemplate } from '@/lib/email';

// Share email
const email = shareEmailTemplate({
  senderName: 'John Doe',
  shareLink: 'https://tallow.app/transfer/abc',
  message: 'Optional message',
  fileName: 'document.pdf',
  fileCount: 3,
  fileSize: '2.5 MB',
  expiresAt: new Date('2026-02-13'),
});
// Returns: { html, text, subject }

// Welcome email
const welcome = welcomeEmailTemplate({
  name: 'John Doe',
  appUrl: 'https://tallow.app',
});
// Returns: { html, text, subject }
```

## Usage Example

```typescript
// Frontend: Send email
async function shareByEmail(to: string, link: string) {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify({
      to,
      shareLink: link,
      senderName: 'John Doe',
      message: 'Check out these files!',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `BAD_REQUEST` | 400 | Invalid input |
| `FORBIDDEN` | 403 | Missing CSRF token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `BAD_GATEWAY` | 502 | Resend API error |
| `SERVICE_UNAVAILABLE` | 503 | API key not configured |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/email/send` | 10 requests | 1 hour |
| `/api/email/status/[id]` | 30 requests | 1 minute |

## Environment Variables

```bash
# Required
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Tallow <noreply@yourdomain.com>

# Optional
NEXT_PUBLIC_APP_URL=https://tallow.app
ALLOWED_ORIGINS=https://tallow.app
```

## Development Mode

When `RESEND_API_KEY` not set:
- Emails logged to console
- Returns success with warning
- Full debug output

## Security Checklist

- [x] CSRF protection enabled
- [x] Rate limiting configured
- [x] Input sanitization active
- [x] Email validation (RFC 5322)
- [x] XSS prevention
- [x] HTTPS required (production)
- [x] Disposable email detection

## Common Issues

### 1. Rate Limit Exceeded
```json
{ "error": "Too many email requests", "code": "RATE_LIMIT_EXCEEDED" }
```
**Solution:** Wait for rate limit window to reset (check `Retry-After` header)

### 2. Invalid Email
```json
{ "error": "Invalid email address", "suggestion": "user@gmail.com" }
```
**Solution:** Use suggested email or validate format

### 3. CSRF Token Missing
```json
{ "error": "CSRF token required", "code": "FORBIDDEN" }
```
**Solution:** Add `X-CSRF-Token` header

### 4. Service Unavailable
```json
{ "error": "Email service not configured" }
```
**Solution:** Set `RESEND_API_KEY` environment variable

## Files

| File | Purpose |
|------|---------|
| `/app/api/email/send/route.ts` | Send email endpoint |
| `/app/api/email/status/[id]/route.ts` | Status check endpoint |
| `/lib/email/email-validation.ts` | Email validation utilities |
| `/lib/email/email-templates.ts` | HTML/text email templates |
| `/lib/email/email-service.ts` | Core email service |

## TypeScript Types

```typescript
// Request
interface SendEmailRequest {
  to: string;
  shareLink: string;
  senderName: string;
  message?: string;
  fileName?: string;
  fileCount?: number;
  fileSize?: string;
  expiresAt?: string;
}

// Response
interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string;
}

// Status
interface EmailStatusResponse {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  details?: {
    sentAt?: string;
    deliveredAt?: string;
  };
}
```

## Quick Test

```bash
# Send test email
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-token" \
  -d '{"to":"test@example.com","shareLink":"https://example.com","senderName":"Test"}'
```
