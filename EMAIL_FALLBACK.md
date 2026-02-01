# Email Fallback System Documentation

## Overview

The email fallback system provides a reliable alternative when P2P (WebRTC) transfers fail. It allows users to send files via email with end-to-end encryption, supporting both direct attachments and secure download links.

## Features

### Core Functionality
- **Automatic Mode Selection**: Files under 25MB are sent as attachments, larger files use secure download links
- **End-to-End Encryption**: All files are encrypted before upload/attachment using AES-256-GCM
- **One-Time Downloads**: Download links expire after first use (configurable)
- **Time-Based Expiration**: Files automatically expire after a set period (1 hour to 30 days)
- **Secure Token System**: Cryptographically secure random tokens prevent unauthorized access

### Security Features
- **File Encryption**: Files encrypted with randomly generated 256-bit keys
- **CSRF Protection**: API key authentication prevents spam and abuse
- **Rate Limiting**: 3 file emails per minute per IP address
- **Token Validation**: Constant-time comparison prevents timing attacks
- **XSS Prevention**: All user inputs sanitized before email rendering
- **Path Traversal Protection**: File names sanitized to prevent directory traversal
- **Domain Validation**: Download URLs validated to prevent phishing

## Architecture

### Components

1. **Temporary File Storage** (`lib/storage/temp-file-storage.ts`)
   - Encrypts and stores files in localStorage (client-side demo)
   - Manages file expiration and download limits
   - Auto-cleanup of expired files

2. **Email Templates** (`lib/emails/file-transfer-email.tsx`)
   - Beautiful, responsive email design
   - Shows file details, expiration time, security info
   - Supports both attachment and link modes

3. **API Endpoints**
   - `/api/v1/send-file-email` - Sends file transfer emails
   - `/api/v1/download-file` - Handles secure file downloads

4. **UI Components**
   - `EmailFallbackDialog` - Modal for entering recipient email
   - `EmailFallbackButton` - Trigger button for email fallback

### Data Flow

#### Attachment Mode (Files ≤ 25MB)
```
User selects file → Encrypt file → Convert to base64 → Send email with attachment → Recipient downloads from email
```

#### Link Mode (Files > 25MB)
```
User selects file → Encrypt file → Upload to storage → Generate download link → Send email with link → Recipient clicks link → Download and decrypt file
```

## Usage

### Basic Integration

```tsx
import { EmailFallbackButton } from '@/components/app/EmailFallbackButton';

function MyTransferComponent() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <EmailFallbackButton
      file={file}
      senderName="John Doe"
      onSuccess={() => console.log('Email sent!')}
    />
  );
}
```

### Advanced Integration

```tsx
import { EmailFallbackDialog } from '@/components/app/EmailFallbackDialog';

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Send via Email
      </button>

      <EmailFallbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        file={selectedFile}
        senderName="Alice Smith"
      />
    </>
  );
}
```

### Direct API Usage

```typescript
// Send file via email API
const response = await fetch('/api/v1/send-file-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  body: JSON.stringify({
    recipientEmail: 'user@example.com',
    senderName: 'John Doe',
    fileName: 'document.pdf',
    fileSize: 1024000,
    fileData: base64EncodedFile, // For attachment mode
    downloadUrl: 'https://...', // For link mode
    expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    mode: 'attachment', // or 'link'
  }),
});
```

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Required for email functionality
RESEND_API_KEY=re_...

# Required for API authentication
API_SECRET_KEY=your_secure_random_key_here
```

Generate API secret key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limiting

Configure in route files:

```typescript
const MAX_FILE_EMAILS_PER_WINDOW = 3; // emails per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute
```

### File Size Limits

```typescript
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

### Expiration Options

Available in UI dropdown:
- 1 hour
- 6 hours
- 24 hours (default)
- 7 days
- 30 days

## Security Considerations

### Encryption
- **Algorithm**: AES-256-GCM with random nonces
- **Key Generation**: Cryptographically secure random bytes (32 bytes)
- **File Integrity**: SHA-256 hash verification
- **Chunk Encryption**: Each chunk encrypted separately with associated data

### Token Security
- **Length**: 32 bytes (64 hex characters)
- **Generation**: `crypto.getRandomValues()` for secure randomness
- **Validation**: Constant-time comparison to prevent timing attacks
- **Single Use**: Tokens invalidated after successful download

### Email Security
- **Input Sanitization**: All user inputs escaped to prevent XSS
- **Domain Validation**: Download URLs must match application domain
- **Path Traversal Protection**: File names sanitized to remove path separators
- **Size Validation**: Strict size limits enforced on both client and server

### Rate Limiting
- **Email Sending**: 3 emails per minute per IP
- **File Downloads**: 10 downloads per minute per IP
- **Cleanup**: Automatic cleanup of expired rate limit entries

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Email service not configured` | Missing `RESEND_API_KEY` | Add API key to environment |
| `File too large for attachment` | File > 25MB in attachment mode | System auto-switches to link mode |
| `File not found or expired` | Download link expired | Request new link from sender |
| `Invalid download token` | Incorrect or tampered token | Use original link from email |
| `Download limit reached` | Link already used | One-time links can't be reused |
| `Too many requests` | Rate limit exceeded | Wait before trying again |

### Client-Side Error Handling

```typescript
try {
  const response = await fetch('/api/v1/send-file-email', { /* ... */ });
  if (!response.ok) {
    const error = await response.json();
    console.error('Email send failed:', error.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## Performance

### Optimization Strategies

1. **Chunked Encryption**: Files encrypted in 64KB chunks for memory efficiency
2. **Lazy Loading**: Crypto modules loaded on demand
3. **Progressive Upload**: Show progress during file upload
4. **Automatic Cleanup**: Expired files removed hourly
5. **Base64 Streaming**: Large files processed in chunks

### Memory Management

```typescript
// File size limits prevent memory exhaustion
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Chunk size optimized for browser memory
const CHUNK_SIZE = 64 * 1024; // 64KB
```

## Testing

### Unit Tests

```typescript
// Test email sending
describe('Email Fallback', () => {
  it('should send email with attachment', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    // Test implementation
  });

  it('should generate secure download link', async () => {
    const file = new File([new ArrayBuffer(30 * 1024 * 1024)], 'large.bin');
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// Test complete flow
describe('Email Transfer Flow', () => {
  it('should complete full transfer cycle', async () => {
    // 1. Upload file
    // 2. Send email
    // 3. Download from link
    // 4. Verify file integrity
  });
});
```

## Monitoring

### Metrics to Track

- Email send success rate
- Average file size sent
- Mode distribution (attachment vs link)
- Download success rate
- Expiration cleanup effectiveness
- Rate limit hits
- Error rates by type

### Logging

```typescript
// Production logging (sanitized)
secureLog.log('[FileEmail] Email sent successfully:', emailId);
secureLog.error('[FileEmail] Send failed:', sanitizedError);

// Development logging (detailed)
console.log('File upload:', {
  size: file.size,
  mode,
  expiration,
});
```

## Migration Guide

### From P2P Only to Email Fallback

1. **Add Email Trigger**: Show email button when P2P fails
2. **Configure API**: Set up Resend API key
3. **Update UI**: Integrate `EmailFallbackButton` component
4. **Test Flow**: Verify complete transfer cycle

```tsx
// Before
<TransferButton onClick={startP2PTransfer} />

// After
<>
  <TransferButton onClick={startP2PTransfer} />
  {p2pFailed && (
    <EmailFallbackButton
      file={file}
      senderName={userName}
    />
  )}
</>
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set `RESEND_API_KEY` in production environment
- [ ] Set `API_SECRET_KEY` for API authentication
- [ ] Configure rate limiting based on expected load
- [ ] Set up monitoring for email delivery
- [ ] Test with production email service
- [ ] Verify HTTPS for secure downloads
- [ ] Set up error alerting
- [ ] Document runbook for common issues

### Server-Side Storage (Production)

For production, replace localStorage with server-side storage:

```typescript
// Example: S3 storage implementation
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadToS3(encryptedFile: Buffer, fileId: string) {
  const s3 = new S3Client({ region: 'us-east-1' });
  await s3.send(new PutObjectCommand({
    Bucket: 'tallow-temp-files',
    Key: fileId,
    Body: encryptedFile,
    Expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  }));
}
```

## Troubleshooting

### Email Not Sending

1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for API status
3. Verify sender domain configuration
4. Check rate limits not exceeded

### Download Link Not Working

1. Verify link hasn't expired
2. Check token is correct (64 hex characters)
3. Ensure file hasn't been downloaded already
4. Check browser console for errors

### File Corruption

1. Verify encryption key matches
2. Check file size matches expected
3. Verify hash integrity
4. Check for network interruptions during upload

## Future Enhancements

### Planned Features

- [ ] Virus scanning integration (ClamAV)
- [ ] S3/cloud storage backend
- [ ] Multiple file support
- [ ] Password protection option
- [ ] Custom expiration times
- [ ] Download notifications
- [ ] Email delivery tracking
- [ ] Retry mechanism for failed uploads
- [ ] Compression before encryption
- [ ] Batch email sending

### API Improvements

- [ ] GraphQL API endpoint
- [ ] Webhook notifications
- [ ] API rate limiting tiers
- [ ] Analytics dashboard
- [ ] Usage statistics API

## Support

For issues or questions:
- GitHub Issues: [tallow/issues](https://github.com/yourusername/tallow/issues)
- Documentation: [tallow.app/docs](https://tallow.app/docs)
- Email: support@tallow.app

## License

Same as parent project (see LICENSE file)
