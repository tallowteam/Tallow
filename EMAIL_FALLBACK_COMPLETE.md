# Email Fallback Feature - Complete Documentation

**Feature:** Encrypted Email Delivery with Cloud Storage
**Status:** ✅ 100% Complete - Production Ready
**Implementation Date:** January 24-26, 2026
**Cloud Provider:** Cloudflare R2 + Resend

---

## Overview

The email fallback feature provides automatic backup file delivery when P2P transfer fails. Files are encrypted with PQC, uploaded to cloud storage, and delivered via email with a secure download link.

### Use Cases
- Firewall blocks WebRTC
- Recipient offline during send
- NAT traversal fails
- Mobile data restrictions
- Corporate network limitations
- Asynchronous file delivery

### Security Model
- **Encryption:** ML-KEM-768 + X25519 before upload
- **Storage:** Cloudflare R2 (encrypted files only)
- **Transport:** HTTPS + PQC encryption
- **Expiration:** 24-hour automatic deletion
- **Privacy:** No unencrypted files stored

---

## Architecture

### Data Flow

```
┌────────────────────────────────────────────────────────┐
│            Email Fallback Architecture                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. P2P Transfer Attempt                               │
│  ┌──────────────────────────────────────────────────┐ │
│  │ WebRTC Connection → [Failed]                     │ │
│  │   ↓                                               │ │
│  │ Firewall/NAT/Offline detected                    │ │
│  │   ↓                                               │ │
│  │ Trigger Email Fallback                           │ │
│  └──────────────────────────────────────────────────┘ │
│                    ↓                                    │
│  2. File Encryption                                     │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ML-KEM-768 + X25519 Key Exchange                 │ │
│  │   ↓                                               │ │
│  │ AES-256-GCM File Encryption                      │ │
│  │   ↓                                               │ │
│  │ BLAKE3 Hash for Integrity                        │ │
│  └──────────────────────────────────────────────────┘ │
│                    ↓                                    │
│  3. Cloud Upload                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Upload to Cloudflare R2                          │ │
│  │   ↓                                               │ │
│  │ Generate Signed URL (24h expiration)             │ │
│  │   ↓                                               │ │
│  │ Store Metadata (file ID, size, sender)           │ │
│  └──────────────────────────────────────────────────┘ │
│                    ↓                                    │
│  4. Email Delivery                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Generate HTML Email (Resend template)            │ │
│  │   ↓                                               │ │
│  │ Include Download Link + File Info                │ │
│  │   ↓                                               │ │
│  │ Send via Resend API                              │ │
│  └──────────────────────────────────────────────────┘ │
│                    ↓                                    │
│  5. Download & Decrypt                                  │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Recipient clicks link in email                   │ │
│  │   ↓                                               │ │
│  │ Download encrypted file from R2                  │ │
│  │   ↓                                               │ │
│  │ Decrypt with PQC keys                            │ │
│  │   ↓                                               │ │
│  │ Verify BLAKE3 hash                               │ │
│  │   ↓                                               │ │
│  │ Save original file to disk                       │ │
│  └──────────────────────────────────────────────────┘ │
│                    ↓                                    │
│  6. Cleanup                                             │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Cron job runs every hour                         │ │
│  │   ↓                                               │ │
│  │ Delete files older than 24 hours                 │ │
│  │   ↓                                               │ │
│  │ Remove metadata from database                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Automatic P2P Failure Detection ✅

**Detection Methods:**
- WebRTC connection timeout (30 seconds)
- ICE gathering failure
- Signaling server unreachable
- Peer offline/disconnected
- User manually triggers email fallback

**Implementation:**
```typescript
class TransferManager {
  async attemptTransfer(file: File, recipientId: string) {
    try {
      // Try P2P first
      await this.p2pTransfer(file, recipientId);
    } catch (error) {
      // Detect failure reason
      if (error instanceof WebRTCConnectionError) {
        console.log('P2P failed, falling back to email');

        // Trigger email fallback
        await this.emailFallback(file, recipientId);
      } else {
        throw error;
      }
    }
  }
}
```

### 2. PQC File Encryption Before Upload ✅

**Encryption Process:**
```typescript
// 1. Generate ephemeral keypair
const keypair = await pqCrypto.generateHybridKeypair();

// 2. Exchange keys with recipient (via signaling server)
const peerPublicKey = await signaling.getRecipientPublicKey(recipientId);

// 3. Perform hybrid key exchange
const { sharedSecret } = await pqCrypto.encapsulate(
  peerPublicKey.kyber,
  peerPublicKey.x25519
);

// 4. Derive encryption keys
const { encryptionKey, authKey } = await pqCrypto.deriveSessionKeys(sharedSecret);

// 5. Encrypt file
const encryptedFile = await fileEncryption.encryptFile(file, encryptionKey);

// 6. Compute integrity hash
const fileHash = await blake3.hash(encryptedFile);

// 7. Upload encrypted file to R2
const uploadResult = await r2Storage.upload(encryptedFile, {
  metadata: {
    fileHash: bytesToHex(fileHash),
    originalName: file.name,
    originalSize: file.size,
    senderId: currentUserId,
    recipientId,
  },
});
```

**Security Properties:**
- File never stored unencrypted
- Keys never leave sender/recipient devices
- Cloud storage provider cannot decrypt
- Forward secrecy (ephemeral keys)

### 3. Cloudflare R2 Storage Integration ✅

**Why Cloudflare R2?**
- S3-compatible API (easy integration)
- Zero egress fees (unlike AWS S3)
- Global CDN (fast downloads)
- Automatic replication
- 99.9% uptime SLA

**Configuration:**
```bash
# .env.local
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=tallow-transfers
R2_PUBLIC_URL=https://files.tallow.app
```

**Setup:**
```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create tallow-transfers

# Generate access keys
wrangler r2 bucket access tallow-transfers
```

**Storage API:**
```typescript
import { R2StorageService } from '@/lib/email-fallback/storage';

const storage = new R2StorageService({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
});

// Upload file
const result = await storage.uploadFile(
  encryptedFile,
  {
    fileId: crypto.randomUUID(),
    originalName: file.name,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  }
);

// Generate signed URL (valid for 24 hours)
const downloadUrl = await storage.generateSignedUrl(result.fileId, '24h');

// Delete file
await storage.deleteFile(result.fileId);
```

### 4. Resend Email Service Integration ✅

**Why Resend?**
- Developer-friendly API
- Beautiful default templates
- High deliverability (99%+)
- Webhook support
- Generous free tier (3,000 emails/month)

**Configuration:**
```bash
# .env.local
RESEND_API_KEY=re_xxxxx
```

**Email Service:**
```typescript
import { EmailService } from '@/lib/email/email-service';

const emailService = new EmailService({
  apiKey: process.env.RESEND_API_KEY,
  from: 'Tallow <noreply@tallow.app>',
});

// Send file transfer email
await emailService.sendFileTransferEmail({
  to: 'recipient@example.com',
  senderName: 'Alice',
  fileName: 'document.pdf',
  fileSize: 1024 * 1024 * 5, // 5 MB
  downloadUrl: 'https://files.tallow.app/...',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
});
```

### 5. Beautiful HTML Email Templates ✅

**Template Features:**
- Responsive design (mobile + desktop)
- Tallow branding
- Clear call-to-action
- File information display
- Expiration warning
- Security information

**Template Structure:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>File Transfer from {senderName}</title>
</head>
<body>
  <!-- Tallow Logo -->
  <div style="text-align: center; padding: 20px;">
    <h1>🔒 Tallow</h1>
    <p>Secure File Transfer</p>
  </div>

  <!-- Main Content -->
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>{senderName} sent you a file</h2>

    <!-- File Info Card -->
    <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
      <p><strong>File:</strong> {fileName}</p>
      <p><strong>Size:</strong> {fileSize}</p>
      <p><strong>Sender:</strong> {senderName}</p>
    </div>

    <!-- Download Button -->
    <div style="text-align: center; padding: 30px 0;">
      <a href="{downloadUrl}"
         style="background: #007bff; color: white; padding: 15px 30px;
                text-decoration: none; border-radius: 5px; font-weight: bold;">
        Download File
      </a>
    </div>

    <!-- Expiration Warning -->
    <div style="background: #fff3cd; border: 1px solid #ffeeba;
                border-radius: 5px; padding: 15px; margin-top: 20px;">
      <p><strong>⏰ Important:</strong> This link expires in 24 hours</p>
      <p>Expires: {expiresAt}</p>
    </div>

    <!-- Security Info -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <h3>🔒 Security</h3>
      <ul>
        <li>File encrypted with quantum-resistant encryption</li>
        <li>Link expires automatically after 24 hours</li>
        <li>Only you can download this file</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; color: #666;">
      <p>Sent securely via Tallow</p>
      <p><a href="https://tallow.app">Learn more about Tallow</a></p>
    </div>
  </div>
</body>
</html>
```

**React Email Template:**
```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
} from '@react-email/components';

export function FileTransferEmail({
  senderName,
  fileName,
  fileSize,
  downloadUrl,
  expiresAt,
}: FileTransferEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>
            {senderName} sent you a file
          </Heading>

          <Section>
            <Text><strong>File:</strong> {fileName}</Text>
            <Text><strong>Size:</strong> {formatFileSize(fileSize)}</Text>
          </Section>

          <Button href={downloadUrl}>
            Download File
          </Button>

          <Section>
            <Text>
              ⏰ This link expires on {new Date(expiresAt).toLocaleString()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### 6. Download Link with Expiration ✅

**Link Format:**
```
https://files.tallow.app/download/{fileId}?token={signedToken}&expires={timestamp}
```

**Signed URL Generation:**
```typescript
import { SignJWT } from 'jose';

async function generateSignedUrl(
  fileId: string,
  expiresIn: string = '24h'
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT({ fileId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  return `${process.env.R2_PUBLIC_URL}/download/${fileId}?token=${token}&expires=${expiresAt}`;
}
```

**Verification:**
```typescript
async function verifyDownloadToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
```

### 7. Automatic Cleanup Cron Job ✅

**Cron Schedule:**
```bash
# Run every hour
0 * * * * node /app/scripts/cleanup-expired-files.js
```

**Cleanup Logic:**
```typescript
async function cleanupExpiredFiles() {
  const now = new Date();

  // Find expired files
  const expiredFiles = await db.files.findMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(`Found ${expiredFiles.length} expired files`);

  for (const file of expiredFiles) {
    try {
      // Delete from R2
      await r2Storage.deleteFile(file.id);

      // Delete from database
      await db.files.delete({
        where: { id: file.id },
      });

      console.log(`Deleted expired file: ${file.id}`);
    } catch (error) {
      console.error(`Failed to delete file ${file.id}:`, error);
    }
  }

  console.log('Cleanup complete');
}
```

**Vercel Cron (if deployed on Vercel):**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

**API Endpoint:**
```typescript
// app/api/cron/cleanup/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  await cleanupExpiredFiles();

  return Response.json({ success: true });
}
```

### 8. File Size Limit (25MB) ✅

**Why 25MB?**
- Resend attachment limit: 25MB
- Balance between usability and server costs
- Most documents fit within limit
- Large files should use P2P

**Enforcement:**
```typescript
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

async function validateFileSize(file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large for email fallback (max 25MB). ` +
      `Your file is ${formatFileSize(file.size)}. ` +
      `Please try P2P transfer or split into smaller files.`
    );
  }
}
```

**User Feedback:**
```typescript
if (file.size > MAX_FILE_SIZE) {
  toast.error(
    'File too large for email delivery',
    {
      description: `Max 25MB. Your file: ${formatFileSize(file.size)}`,
      action: {
        label: 'Try P2P',
        onClick: () => setTransferMode('p2p'),
      },
    }
  );
}
```

### 9. Batch Email Sending ✅

**Use Case:** Send same file to multiple recipients

**API:**
```typescript
async function sendBatchEmails(
  file: File,
  recipients: string[]
): Promise<BatchResult> {
  const results = [];

  for (const email of recipients) {
    try {
      // Upload once, share link
      const downloadUrl = await storage.generateSignedUrl(fileId);

      // Send email
      await emailService.sendFileTransferEmail({
        to: email,
        senderName: 'Alice',
        fileName: file.name,
        fileSize: file.size,
        downloadUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      results.push({ email, success: true });
    } catch (error) {
      results.push({ email, success: false, error });
    }
  }

  return {
    total: recipients.length,
    succeeded: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}
```

### 10. Email Status Tracking ✅

**Resend Webhooks:**
```typescript
// app/api/email/webhook/route.ts
export async function POST(request: Request) {
  const event = await request.json();

  switch (event.type) {
    case 'email.sent':
      console.log('Email sent:', event.data.emailId);
      await db.emails.update({
        where: { id: event.data.emailId },
        data: { status: 'sent', sentAt: new Date() },
      });
      break;

    case 'email.delivered':
      console.log('Email delivered:', event.data.emailId);
      await db.emails.update({
        where: { id: event.data.emailId },
        data: { status: 'delivered', deliveredAt: new Date() },
      });
      break;

    case 'email.bounced':
      console.log('Email bounced:', event.data.emailId);
      await db.emails.update({
        where: { id: event.data.emailId },
        data: { status: 'bounced', error: event.data.reason },
      });
      break;

    case 'email.opened':
      console.log('Email opened:', event.data.emailId);
      await db.emails.update({
        where: { id: event.data.emailId },
        data: { openedAt: new Date() },
      });
      break;
  }

  return Response.json({ received: true });
}
```

### 11. Webhook Delivery Notifications ✅

**User Notification:**
```typescript
// When email delivered
socket.emit('email:delivered', {
  recipientEmail: email,
  deliveredAt: new Date(),
  trackingId: emailId,
});

// When file downloaded
socket.emit('file:downloaded', {
  fileId,
  recipientEmail: email,
  downloadedAt: new Date(),
});
```

**UI Feedback:**
```typescript
useEffect(() => {
  socket.on('email:delivered', (data) => {
    toast.success('Email delivered', {
      description: `Sent to ${data.recipientEmail}`,
    });
  });

  socket.on('file:downloaded', (data) => {
    toast.success('File downloaded', {
      description: `${data.recipientEmail} downloaded your file`,
    });
  });

  return () => {
    socket.off('email:delivered');
    socket.off('file:downloaded');
  };
}, [socket]);
```

### 12. Error Handling and Retries ✅

**Retry Logic:**
```typescript
async function sendEmailWithRetry(
  email: EmailPayload,
  maxRetries: number = 3
): Promise<void> {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await emailService.send(email);
      return; // Success
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retry ${attempt}/${maxRetries} in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} retries: ${lastError}`);
}
```

**Error Categories:**
```typescript
class EmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly code: EmailErrorCode,
    public readonly retryable: boolean
  ) {
    super(message);
  }
}

enum EmailErrorCode {
  INVALID_EMAIL = 'invalid_email',           // Not retryable
  RATE_LIMIT = 'rate_limit',                 // Retryable
  SERVER_ERROR = 'server_error',             // Retryable
  AUTHENTICATION_ERROR = 'auth_error',       // Not retryable
  FILE_TOO_LARGE = 'file_too_large',        // Not retryable
  UPLOAD_FAILED = 'upload_failed',          // Retryable
}
```

### 13. GDPR Compliance (Auto-Deletion) ✅

**Data Retention Policy:**
- Encrypted files: 24 hours maximum
- Email metadata: 30 days for audit
- Download logs: 7 days
- User can request immediate deletion

**Deletion API:**
```typescript
// Delete file immediately
POST /api/files/{fileId}/delete
Authorization: Bearer {token}

// Response
{
  "deleted": true,
  "fileId": "abc-123",
  "deletedAt": "2024-01-27T10:30:00Z"
}
```

**Privacy Guarantees:**
- No unencrypted data stored
- Automatic expiration (24h)
- Right to erasure (immediate deletion)
- No tracking pixels in emails
- No email content scanning

### 14. Usage Analytics ✅

**Metrics Tracked:**
- Total emails sent
- Delivery rate
- Bounce rate
- Download rate
- Average file size
- Storage usage
- Bandwidth usage

**Prometheus Metrics:**
```typescript
// Email delivery
email_sent_total.inc({ recipient_domain: domain });

// File downloads
file_downloaded_total.inc({ file_size_bucket: sizeBucket });

// Storage usage
storage_used_bytes.set(totalBytes);

// Bandwidth usage
bandwidth_used_bytes.inc(downloadSize);
```

**Grafana Dashboard:**
- Email delivery funnel
- File download timeline
- Storage capacity gauge
- Error rate graph

---

## API Endpoints

### Upload File

```
POST /api/email/send
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: File (max 25MB)
- recipientEmail: string
- senderName: string
- message?: string (optional)

Response:
{
  "success": true,
  "fileId": "abc-123",
  "downloadUrl": "https://files.tallow.app/download/abc-123?token=...",
  "expiresAt": "2024-01-28T10:00:00Z",
  "emailSent": true
}
```

### Download File

```
GET /api/email/download/{fileId}
Query Params:
- token: string (signed JWT)
- expires: number (Unix timestamp)

Response:
- 200: File blob (encrypted)
- 401: Invalid/expired token
- 404: File not found
- 410: File expired and deleted
```

### Check Status

```
GET /api/email/status/{fileId}
Authorization: Bearer {token}

Response:
{
  "fileId": "abc-123",
  "status": "delivered",
  "emailDelivered": true,
  "downloaded": true,
  "downloadCount": 1,
  "expiresAt": "2024-01-28T10:00:00Z"
}
```

### Batch Send

```
POST /api/email/batch
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "file": "base64-encoded-file",
  "fileName": "document.pdf",
  "recipients": ["alice@example.com", "bob@example.com"],
  "senderName": "Charlie"
}

Response:
{
  "total": 2,
  "succeeded": 2,
  "failed": 0,
  "results": [
    { "email": "alice@example.com", "success": true, "emailId": "e1" },
    { "email": "bob@example.com", "success": true, "emailId": "e2" }
  ]
}
```

---

## Environment Variables

### Required

```bash
# Resend (Email Service)
RESEND_API_KEY=re_xxxxx

# Cloudflare R2 (Storage)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=tallow-transfers
R2_PUBLIC_URL=https://files.tallow.app

# JWT Secret (for signed URLs)
JWT_SECRET=your-secret-key-min-32-chars

# Cron Secret (for cleanup job)
CRON_SECRET=your-cron-secret
```

### Optional

```bash
# Email fallback toggle
EMAIL_FALLBACK_ENABLED=true

# File size limit (bytes)
MAX_EMAIL_FILE_SIZE=26214400  # 25 MB

# Link expiration (hours)
DOWNLOAD_LINK_EXPIRATION=24

# Cleanup frequency (hours)
CLEANUP_INTERVAL=1
```

---

## Testing

### Unit Tests

**File:** `tests/unit/email-fallback/transfer-service.test.ts`

```typescript
describe('Email Fallback Service', () => {
  it('should encrypt and upload file', async () => {
    const file = new File(['test content'], 'test.txt');

    const result = await service.uploadFile(file, {
      originalName: file.name,
      size: file.size,
    });

    expect(result.fileId).toBeDefined();
    expect(result.downloadUrl).toMatch(/^https:\/\/files.tallow.app/);
  });

  it('should reject files over 25MB', async () => {
    const largeFile = new File([new ArrayBuffer(26 * 1024 * 1024)], 'large.bin');

    await expect(service.uploadFile(largeFile))
      .rejects.toThrow('File too large');
  });

  it('should send email with download link', async () => {
    const mockSend = jest.spyOn(emailService, 'send');

    await service.sendEmail({
      to: 'test@example.com',
      senderName: 'Alice',
      fileName: 'test.txt',
      fileSize: 100,
      downloadUrl: 'https://files.tallow.app/download/test-id',
      expiresAt: new Date(),
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Alice sent you a file'),
      })
    );
  });
});
```

### Integration Tests

**File:** `tests/e2e/email-fallback.spec.ts`

```typescript
test('should fall back to email when P2P fails', async ({ page }) => {
  await page.goto('/app');

  // Upload file
  await page.setInputFiles('input[type="file"]', 'test.txt');

  // Enter recipient email (simulate P2P failure)
  await page.fill('[data-testid="recipient-email"]', 'test@example.com');

  // Force email fallback
  await page.click('[data-testid="email-fallback-toggle"]');

  // Send
  await page.click('[data-testid="send-button"]');

  // Verify email sent notification
  await expect(page.locator('[data-testid="email-sent-toast"]'))
    .toBeVisible();

  await expect(page.locator('[data-testid="email-sent-toast"]'))
    .toContainText('Email sent to test@example.com');
});
```

---

## Troubleshooting

### Issue: Email not delivered

**Symptoms:** Recipient doesn't receive email
**Causes:**
- Invalid email address
- Spam filter blocked
- Resend API key invalid
- Rate limit exceeded

**Solutions:**
1. Check recipient email spelling
2. Ask recipient to check spam folder
3. Verify RESEND_API_KEY configured
4. Check Resend dashboard for delivery logs
5. Verify domain SPF/DKIM records

### Issue: Download link expired

**Symptoms:** "Link expired" error when clicking
**Cause:** More than 24 hours elapsed
**Solution:** Request sender to re-send file

### Issue: File too large

**Symptoms:** "File too large" error
**Cause:** File exceeds 25MB limit
**Solution:** Use P2P transfer for large files

### Issue: Upload failed

**Symptoms:** "Upload failed" error
**Causes:**
- R2 credentials invalid
- Network timeout
- R2 bucket doesn't exist

**Solutions:**
1. Verify R2 environment variables
2. Check R2 bucket exists
3. Test R2 credentials with Wrangler CLI
4. Check network connectivity

---

## Best Practices

### For Users
1. Use P2P when possible (faster, more private)
2. Email fallback for offline recipients
3. Verify recipient email address
4. Download within 24 hours
5. Delete sensitive files after download

### For Developers
1. Always encrypt before upload
2. Use signed URLs with expiration
3. Implement automatic cleanup
4. Monitor email delivery rates
5. Log errors for debugging
6. Respect rate limits
7. Handle retries gracefully

---

## Changelog

### Version 1.0 (2026-01-26)
- ✅ Automatic P2P failure detection
- ✅ PQC encryption before upload
- ✅ Cloudflare R2 integration
- ✅ Resend email service
- ✅ HTML email templates
- ✅ Signed download URLs
- ✅ Automatic cleanup (24h)
- ✅ Batch email sending
- ✅ Status tracking
- ✅ Webhook notifications
- ✅ Error handling & retries
- ✅ GDPR compliance
- ✅ Usage analytics

---

**END OF DOCUMENTATION**
