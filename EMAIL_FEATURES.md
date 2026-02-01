# Email File Transfer Features

Complete implementation of advanced email file sharing features for Tallow.

## Overview

The email file transfer system allows users to send files via email when P2P transfers aren't available. Files can be sent to one or multiple recipients with advanced features like password protection, compression, expiration, and download tracking.

## Features Implemented

### ✅ Core Features

- **Multiple File Support** - Send multiple files in a single email (auto-zipped)
- **File Compression** - Automatic ZIP compression for multiple files
- **Password Protection** - AES-256-GCM encryption with scrypt key derivation
- **Custom Expiration** - Set custom expiration times (default: 7 days)
- **Download Limits** - Limit number of downloads per transfer
- **Email Tracking** - Track opens, clicks, and downloads
- **Download Notifications** - Get notified when files are downloaded
- **Retry Mechanism** - Automatic retry with exponential backoff
- **Batch Sending** - Send to multiple recipients efficiently
- **Usage Analytics** - Comprehensive analytics and metrics

### 🔒 Security Features

- **AES-256-GCM Encryption** - Industry-standard encryption for password-protected transfers
- **Scrypt Key Derivation** - Secure password-based key derivation
- **CSRF Protection** - All API endpoints protected
- **Secure Storage** - Transfer metadata encrypted in storage
- **Memory Wiping** - Sensitive data wiped after use
- **Auth Tag Verification** - Integrity verification for encrypted files

### 📊 Analytics & Tracking

- Total sent/delivered/opened/clicked/downloaded
- Open rate, click rate, download rate, failure rate
- Per-recipient analytics
- Per-date analytics
- Average delivery/open times

## Architecture

```
lib/email/
├── types.ts                  # Type definitions
├── email-service.ts          # Main service (Resend integration)
├── email-storage.ts          # Storage and analytics
├── file-compression.ts       # ZIP compression (JSZip)
├── password-protection.ts    # AES-256-GCM encryption
├── retry-manager.ts          # Exponential backoff retry
└── index.ts                  # Central exports

app/api/email/
├── send/route.ts             # POST /api/email/send
├── batch/route.ts            # POST /api/email/batch
├── status/[id]/route.ts      # GET /api/email/status/:id
├── webhook/route.ts          # POST /api/email/webhook (Resend)
└── download/[id]/route.ts    # GET/POST /api/email/download/:id

lib/hooks/
└── use-email-transfer.ts     # React hook for email transfers
```

## Usage

### React Hook

```typescript
import { useEmailTransfer, filesToAttachments } from '@/lib/hooks/use-email-transfer';

function SendEmailButton() {
  const { sendEmail, isSending, error } = useEmailTransfer();

  const handleSend = async (files: File[]) => {
    const attachments = await filesToAttachments(files);

    const result = await sendEmail({
      recipientEmail: 'user@example.com',
      senderName: 'John Doe',
      files: attachments,
      password: 'optional-password',
      expiresIn: 24 * 60 * 60 * 1000, // 24 hours
      maxDownloads: 3,
      notifyOnDownload: true,
    });

    console.log('Transfer ID:', result.id);
  };

  return (
    <button onClick={() => handleSend(selectedFiles)} disabled={isSending}>
      {isSending ? 'Sending...' : 'Send via Email'}
    </button>
  );
}
```

### Direct API Usage

#### Send Single Email

```typescript
POST /api/email/send

{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "files": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content",
      "size": 1024000,
      "contentType": "application/pdf"
    }
  ],
  "password": "optional-password",
  "compress": true,
  "expiresIn": 604800000,
  "maxDownloads": 5,
  "notifyOnDownload": true,
  "trackOpens": true,
  "trackClicks": true,
  "priority": "high",
  "metadata": {
    "source": "web-app",
    "campaign": "launch"
  }
}
```

**Response:**

```json
{
  "success": true,
  "transfer": {
    "id": "a1b2c3d4e5f6",
    "status": "sent",
    "recipientEmail": "user@example.com",
    "sentAt": 1706025600000,
    "expiresAt": 1706630400000,
    "downloadsCount": 0
  }
}
```

#### Send Batch Emails

```typescript
POST /api/email/batch

{
  "recipients": [
    "user1@example.com",
    "user2@example.com",
    "user3@example.com"
  ],
  "senderName": "John Doe",
  "files": [...],
  "options": {
    "password": "shared-password",
    "expiresIn": 604800000
  }
}
```

**Response:**

```json
{
  "success": true,
  "batch": {
    "batchId": "batch-123",
    "total": 3,
    "sent": 3,
    "delivered": 0,
    "failed": 0,
    "pending": 0,
    "startedAt": 1706025600000,
    "completedAt": 1706025605000,
    "failures": []
  }
}
```

#### Check Status

```typescript
GET /api/email/status/a1b2c3d4e5f6
```

**Response:**

```json
{
  "success": true,
  "status": {
    "id": "a1b2c3d4e5f6",
    "status": "downloaded",
    "recipientEmail": "user@example.com",
    "sentAt": 1706025600000,
    "deliveredAt": 1706025605000,
    "openedAt": 1706025700000,
    "downloadedAt": 1706025750000,
    "downloadsCount": 1,
    "expiresAt": 1706630400000
  }
}
```

## Configuration

### Environment Variables

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=transfers@tallow.app
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://tallow.app
```

### Resend Setup

1. **Create Resend Account** - Sign up at https://resend.com
2. **Get API Key** - Navigate to Settings → API Keys
3. **Set Environment Variable** - Add `RESEND_API_KEY` to `.env.local`
4. **Verify Domain** - Add DNS records to verify your sending domain
5. **Configure Webhook** - Set webhook URL to `https://yourdomain.com/api/email/webhook`

## Email Template

The system includes a professional HTML email template with:

- Responsive design (mobile-friendly)
- Company branding support (logo, colors)
- File list preview
- Password protection indicator
- Download button with fallback URL
- Expiration and download limit display
- Support email footer

### Customization

```typescript
sendEmail({
  // ... other options
  branding: {
    companyName: 'My Company',
    logoUrl: 'https://example.com/logo.png',
    primaryColor: '#3b82f6',
    brandUrl: 'https://example.com',
    supportEmail: 'support@example.com',
  },
});
```

## File Compression

Files are automatically compressed when beneficial:

- **Multiple files** - Always zipped
- **Single file** - Not compressed
- **Already compressed formats** - Skipped (images, videos, PDFs, etc.)

Compression details are logged:

```
Compressed 5 files: 10485760 → 3145728 bytes (70.0% reduction)
```

## Password Protection

### How It Works

1. Files are encrypted with AES-256-GCM
2. Password is used to derive encryption key via scrypt
3. Encrypted data stored separately (not in email attachment)
4. Recipient must enter password to download

### Password Requirements

- Minimum 8 characters
- Recommend: uppercase, lowercase, numbers, special characters
- System can generate secure passwords automatically

```typescript
import { generateSecurePassword, validatePasswordStrength } from '@/lib/email/password-protection';

const password = generateSecurePassword(16);
// Returns: "aB3$xY9#mK2@nL7!"

const validation = validatePasswordStrength('mypassword');
// Returns: { valid: false, strength: 'weak', issues: [...] }
```

## Retry Mechanism

Failed deliveries are automatically retried with exponential backoff:

- **Default max retries:** 3
- **Initial delay:** 1000ms
- **Backoff multiplier:** 2x
- **Max delay:** 30000ms
- **Jitter:** ±10% to prevent thundering herd

Retryable errors:
- `ETIMEDOUT`
- `ECONNRESET`
- `ENOTFOUND`
- `ECONNREFUSED`
- `rate_limit`
- `temporarily_unavailable`

## Webhook Events

Resend sends webhook events for email lifecycle:

| Event | Description |
|-------|-------------|
| `email.sent` | Email successfully sent |
| `email.delivered` | Email delivered to inbox |
| `email.opened` | Recipient opened email |
| `email.clicked` | Recipient clicked link |
| `email.bounced` | Email bounced |
| `email.complained` | Marked as spam |

Configure webhook URL in Resend dashboard: `https://yourdomain.com/api/email/webhook`

## Analytics

Get comprehensive analytics:

```typescript
import { getEmailAnalytics } from '@/lib/email/email-storage';

const analytics = await getEmailAnalytics();

console.log('Total Sent:', analytics.totalSent);
console.log('Open Rate:', analytics.openRate.toFixed(2) + '%');
console.log('Download Rate:', analytics.downloadRate.toFixed(2) + '%');
console.log('Failure Rate:', analytics.failureRate.toFixed(2) + '%');

// Per-recipient stats
console.log('User Stats:', analytics.byRecipient['user@example.com']);

// Per-date stats
console.log('Today Stats:', analytics.byDate['2025-01-26']);
```

## Limits & Quotas

| Limit | Value |
|-------|-------|
| Max files per email | 10 |
| Max file size | 100 MB total |
| Max attachment size | 25 MB per file |
| Max batch size | 50 recipients |
| Default expiration | 7 days |
| Stored transfers | 1000 (rolling) |

## Storage

Transfer metadata is stored securely:

- Encrypted in `secureStorage`
- Max 1000 recent transfers
- Automatic cleanup of expired transfers
- Analytics persisted indefinitely

```typescript
import { cleanupExpiredTransfers } from '@/lib/email/email-storage';

// Run periodically (e.g., daily cron job)
const cleanedCount = await cleanupExpiredTransfers();
console.log(`Cleaned up ${cleanedCount} expired transfers`);
```

## Error Handling

The system provides detailed error messages:

```typescript
try {
  await sendEmail({ ... });
} catch (error) {
  if (error.message.includes('Total file size exceeds')) {
    // Handle size limit error
  } else if (error.message.includes('Invalid email format')) {
    // Handle validation error
  } else if (error.message.includes('Resend API error')) {
    // Handle API error
  }
}
```

## Testing

### Manual Testing

1. **Send Test Email**
   ```bash
   curl -X POST http://localhost:3000/api/email/send \
     -H "Content-Type: application/json" \
     -d '{
       "recipientEmail": "test@example.com",
       "senderName": "Test User",
       "files": [{
         "filename": "test.txt",
         "content": "SGVsbG8gV29ybGQh",
         "size": 12
       }]
     }'
   ```

2. **Check Status**
   ```bash
   curl http://localhost:3000/api/email/status/a1b2c3d4e5f6
   ```

3. **Test Download**
   ```bash
   curl http://localhost:3000/api/email/download/a1b2c3d4e5f6
   ```

### Unit Tests

Create tests for:
- File compression
- Password encryption/decryption
- Retry logic
- Storage operations
- Analytics calculations

## Security Considerations

1. **Never log sensitive data** - Passwords, file contents, credentials
2. **Validate all inputs** - Email formats, file sizes, transfer IDs
3. **Use CSRF protection** - All mutation endpoints protected
4. **Verify webhook signatures** - Prevent fake webhook attacks
5. **Rate limit endpoints** - Prevent abuse (implement rate limiting)
6. **Sanitize file names** - Prevent path traversal attacks
7. **Scan for viruses** - Integrate ClamAV (planned feature)

## Future Enhancements

- [ ] Virus scanning (ClamAV integration)
- [ ] S3/cloud storage backend
- [ ] GraphQL endpoint
- [ ] Custom email templates
- [ ] White-label support
- [ ] Link previews in emails
- [ ] QR code for mobile downloads
- [ ] Transfer scheduling
- [ ] Recipient confirmation
- [ ] Access logs per transfer

## Troubleshooting

### Email not received

1. Check Resend dashboard for delivery status
2. Verify `RESEND_FROM_EMAIL` domain is verified
3. Check recipient's spam folder
4. Review Resend API logs for errors

### Download link not working

1. Verify transfer hasn't expired
2. Check if max downloads reached
3. Ensure transfer ID is valid
4. Review browser console for errors

### Password not working

1. Ensure password entered exactly as set
2. Check for leading/trailing spaces
3. Verify transfer is password-protected
4. Check error logs for decryption failures

### Analytics not updating

1. Verify webhook is configured in Resend
2. Check webhook endpoint is accessible
3. Review webhook signature validation
4. Monitor webhook error logs

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@tallow.app
- Documentation: https://docs.tallow.app

## License

MIT License - See LICENSE file for details
