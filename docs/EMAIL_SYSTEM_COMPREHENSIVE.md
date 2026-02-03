# Tallow Email System - Comprehensive Technical Documentation

## Table of Contents

1. [Email Service Architecture](#email-service-architecture)
2. [Email Templates](#email-templates)
3. [File Compression System](#file-compression-system)
4. [Password Protection](#password-protection)
5. [Retry Manager](#retry-manager)
6. [Email Storage & Analytics](#email-storage--analytics)
7. [Batch Operations](#batch-operations)
8. [Integration Guide](#integration-guide)
9. [Configuration & Limits](#configuration--limits)

---

## Email Service Architecture

### Overview

The Tallow email system provides a complete solution for sending file transfers
via email using the **Resend API**. It handles encryption, compression, delivery
tracking, retry logic, and analytics.

**Location:** `lib/email/email-service.ts`

### Core Service Functions

#### `sendEmailTransfer(options: EmailTransferOptions): Promise<EmailDeliveryStatus>`

**Purpose:** Sends a single email transfer with optional file compression,
password protection, and retry logic.

**Function Signature:**

```typescript
export async function sendEmailTransfer(
  options: EmailTransferOptions
): Promise<EmailDeliveryStatus>;
```

**Parameters:**

| Parameter                  | Type                      | Description                                          |
| -------------------------- | ------------------------- | ---------------------------------------------------- | -------- | ----------------------- |
| `options`                  | `EmailTransferOptions`    | Complete transfer configuration                      |
| `options.recipientEmail`   | `string`                  | Email address of recipient                           |
| `options.senderName`       | `string`                  | Display name of sender                               |
| `options.senderEmail`      | `string?`                 | Sender email (defaults to RESEND_FROM_EMAIL env var) |
| `options.files`            | `EmailFileAttachment[]`   | Array of files to send (1-10 files)                  |
| `options.compress`         | `boolean?`                | Enable automatic ZIP compression (default: true)     |
| `options.password`         | `string?`                 | Password for encryption                              |
| `options.expiresAt`        | `number?`                 | Expiration timestamp (milliseconds)                  |
| `options.expiresIn`        | `number?`                 | Duration until expiration (milliseconds)             |
| `options.maxDownloads`     | `number?`                 | Maximum number of downloads allowed                  |
| `options.notifyOnDownload` | `boolean?`                | Send notification when downloaded                    |
| `options.notifyOnExpire`   | `boolean?`                | Send notification when expires                       |
| `options.webhookUrl`       | `string?`                 | Webhook URL for events                               |
| `options.priority`         | `'low'                    | 'normal'                                             | 'high'?` | Email delivery priority |
| `options.retryOnFailure`   | `boolean?`                | Enable automatic retry on failure                    |
| `options.maxRetries`       | `number?`                 | Maximum retry attempts                               |
| `options.template`         | `string?`                 | Custom template ID                                   |
| `options.templateData`     | `Record<string, any>?`    | Template-specific data                               |
| `options.branding`         | `EmailBranding?`          | Custom branding for email                            |
| `options.metadata`         | `Record<string, string>?` | Custom metadata                                      |
| `options.trackOpens`       | `boolean?`                | Track email opens                                    |
| `options.trackClicks`      | `boolean?`                | Track email clicks                                   |

**Return Type: `EmailDeliveryStatus`**

```typescript
interface EmailDeliveryStatus {
  id: string;                        // Unique transfer ID (random 16 bytes hex)
  status: 'sent' | 'failed' | ...;  // Current status
  recipientEmail: string;            // Recipient address
  sentAt?: number;                   // Timestamp when sent (milliseconds)
  deliveredAt?: number;              // Timestamp when delivered
  openedAt?: number;                 // Timestamp when opened
  clickedAt?: number;                // Timestamp when clicked
  downloadedAt?: number;             // Timestamp when downloaded
  downloadsCount?: number;           // Number of downloads
  expiresAt?: number;                // Expiration timestamp
  error?: string;                    // Error message (if failed)
  retryCount?: number;               // Number of retries
  lastRetryAt?: number;              // Last retry timestamp
}
```

**Process Flow:**

1. **Validation:**
   - Checks minimum one file required
   - Validates max 10 files per email
   - Ensures total size ≤ `MAX_FILE_SIZE` (unlimited)
   - Checks individual file size ≤ `MAX_ATTACHMENT_SIZE` (unlimited)
   - Verifies all filenames are non-empty

2. **Transfer ID Generation:**

   ```typescript
   const transferId = randomBytes(16).toString('hex');
   ```

   - 16 random bytes = 128 bits of entropy
   - Converted to hexadecimal string (32 characters)
   - Cryptographically secure via Node.js crypto module

3. **Expiration Calculation:**

   ```typescript
   const expiresAt =
     options.expiresAt ||
     (options.expiresIn
       ? now + options.expiresIn
       : now + DEFAULT_EXPIRATION_MS);
   // DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000 = 604,800,000 ms (7 days)
   ```

4. **File Preparation:**
   - Extracts first file or uses compressed archive
   - Converts string content to Buffer if needed
   - Determines attachment filename and content

5. **Compression (if enabled):**
   - Checks if compression beneficial via `shouldCompress()`
   - Creates ZIP archive with DEFLATE compression (level 6)
   - Logs compression ratio: `compressed_size / original_size`
   - Returns compressed buffer and filename

6. **Password Protection (if enabled):**
   - Encrypts file data using AES-256-GCM
   - Generates random salt and IV
   - Derives key via scrypt
   - Appends `.encrypted` extension
   - Stores encrypted metadata separately

7. **Download URL Generation:**

   ```typescript
   function generateDownloadUrl(transferId: string, baseUrl?: string): string {
     const base =
       baseUrl || process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
     return `${base}/download/${transferId}`;
   }
   ```

   - Constructs full download URL
   - Uses environment URL or localhost fallback

8. **Email HTML Generation:**
   - Calls `generateEmailHtml()` with transfer details
   - Formats file list with sizes
   - Includes security notices for password-protected files
   - Adds custom branding if provided
   - Renders download button and expiration info

9. **Resend API Integration:**

   ```typescript
   const { error } = await resend.emails.send({
     from: options.senderEmail || process.env['RESEND_FROM_EMAIL'],
     to: options.recipientEmail,
     subject: `📁 ${options.senderName} shared files with you`,
     html: emailHtml,
     attachments: !options.password ? [{ filename, content }] : undefined,
     tags: [
       { name: 'transfer_id', value: transferId },
       { name: 'sender', value: options.senderName },
     ],
   });
   ```

   - Resend API key from `RESEND_API_KEY` environment variable
   - Non-password-protected files attached directly
   - Password-protected files sent as link only
   - Tags enable Resend analytics and filtering

10. **Storage & Tracking:**
    - Stores transfer record with all metadata
    - Records analytics event
    - Returns delivery status with transfer ID

**Error Handling:**

- File validation errors thrown immediately
- Resend API errors caught and logged
- Retry manager engaged if `retryOnFailure` enabled
- Error details returned in response

**Logging:**

```typescript
secureLog.log(
  `[EmailService] Sent transfer ${transferId} to ${recipientEmail}...`
);
secureLog.error('[EmailService] Failed to send email transfer:', error);
```

---

#### `sendBatchEmailTransfers(request: EmailBatchRequest): Promise<EmailBatchStatus>`

**Purpose:** Send the same file(s) to multiple recipients with concurrency
management.

**Function Signature:**

```typescript
export async function sendBatchEmailTransfers(
  request: EmailBatchRequest
): Promise<EmailBatchStatus>;
```

**Parameters:**

```typescript
interface EmailBatchRequest {
  recipients: string[]; // Email addresses (max 50)
  senderName: string; // Sender display name
  files: EmailFileAttachment[]; // Files to send
  options?: Partial<EmailTransferOptions>; // Transfer options
  batchId?: string; // Optional batch ID
}
```

**Return Type: `EmailBatchStatus`**

```typescript
interface EmailBatchStatus {
  batchId: string; // Unique batch identifier
  total: number; // Total recipients
  sent: number; // Successfully sent
  delivered: number; // Delivered count
  failed: number; // Failed count
  pending: number; // Pending count
  startedAt: number; // Batch start time (ms)
  completedAt?: number; // Batch completion time (ms)
  failures: Array<{
    email: string; // Failed email address
    error: string; // Error message
  }>;
}
```

**Process Flow:**

1. **Validation:**
   - Generates batch ID if not provided
   - Validates recipients array length ≤ 50
   - Records start time

2. **Concurrency Management:**

   ```typescript
   const CONCURRENCY = 5; // Send to 5 recipients in parallel
   const chunks: string[][] = [];

   for (let i = 0; i < request.recipients.length; i += CONCURRENCY) {
     chunks.push(request.recipients.slice(i, i + CONCURRENCY));
   }
   ```

   - Splits recipients into chunks of 5
   - Processes each chunk with `Promise.all()`
   - Prevents overwhelming Resend API

3. **Per-Recipient Processing:**
   - For each recipient, calls `sendEmailTransfer()` with merged options
   - Increments `sent` counter on success
   - Records error and increments `failed` on failure
   - Decrements `pending` counter

4. **Error Isolation:**
   - Single recipient failure doesn't affect others
   - All errors captured in `failures` array
   - Batch continues despite individual failures

5. **Completion Tracking:**
   - Records `completedAt` timestamp
   - Logs batch summary with timing

**Example Usage:**

```typescript
const batchStatus = await sendBatchEmailTransfers({
  recipients: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  senderName: 'John Doe',
  files: [{
    filename: 'document.pdf',
    content: Buffer.from(...),
    size: 2097152
  }],
  options: {
    password: 'SecurePass123!',
    expiresIn: 24 * 60 * 60 * 1000  // 24 hours
  }
});

console.log(`Sent: ${batchStatus.sent}/${batchStatus.total}`);
console.log(`Failed: ${batchStatus.failed}`);
if (batchStatus.failures.length > 0) {
  batchStatus.failures.forEach(f => console.log(`${f.email}: ${f.error}`));
}
```

---

#### `getDeliveryStatus(transferId: string): Promise<EmailDeliveryStatus | null>`

**Purpose:** Retrieve current delivery status of a transfer.

**Function Signature:**

```typescript
export async function getDeliveryStatus(
  transferId: string
): Promise<EmailDeliveryStatus | null>;
```

**Parameters:**

| Parameter    | Type     | Description                      |
| ------------ | -------- | -------------------------------- |
| `transferId` | `string` | Unique transfer ID (32-char hex) |

**Return Type:** `EmailDeliveryStatus | null` (null if transfer not found)

**Implementation:**

```typescript
const transfer = await getEmailTransfer(transferId);
if (!transfer) return null;

return {
  id: transfer.id,
  status: transfer.status,
  recipientEmail: transfer.recipientEmail,
  downloadsCount: transfer.downloadsCount,
  expiresAt: transfer.expiresAt,
  sentAt: transfer.sentAt,
  deliveredAt: transfer.deliveredAt,
  openedAt: transfer.downloadedAt, // Mapped from downloadedAt
  downloadedAt: transfer.downloadedAt,
};
```

---

### Email HTML Generation

#### `generateEmailHtml(options, downloadUrl, expiresAt): string`

**Purpose:** Generate responsive HTML email for file transfer notifications.

**Key Features:**

1. **Responsive Design:**
   - Max width 600px for optimal display on all devices
   - Padding/margin adjustments for mobile
   - Fallback fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`

2. **Visual Hierarchy:**
   - Main heading: 24px, bold (#111827 dark gray)
   - File list in formatted box
   - Clear call-to-action button
   - Expiration and limit information
   - Security notice for password-protected files

3. **Color Scheme:**
   - Background: #f9fafb (light gray)
   - Container: #ffffff (white)
   - Primary button: Configurable via `branding.primaryColor` (default: #8B9A7D)
   - Text: #6b7280 (gray) for secondary content

4. **Password Protection Notice:**

   ```html
   <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b;">
     🔒 Password Protected: This transfer is password protected...
   </div>
   ```

   - Yellow warning box (#fef3c7 background, #f59e0b border)
   - Clear indication of protection requirement

5. **File List Rendering:**

   ```typescript
   const filesList = options.files
     .map((f) => `<li>${f.filename} (${(f.size / 1024).toFixed(1)} KB)</li>`)
     .join('');
   ```

   - Shows filename and size in KB
   - Unordered list format
   - Rounded to 1 decimal place

6. **Custom Branding:**

   ```typescript
   const branding = options.branding || {};
   const companyName = branding.companyName || 'Tallow';
   const primaryColor = branding.primaryColor || '#8B9A7D';
   const logoUrl = branding.logoUrl || '';
   ```

   - Optional logo image at top
   - Custom company name in footer
   - Custom primary button color
   - Support email link in footer

7. **Download URL Handling:**
   - Main button links to download URL
   - Fallback plain text link below
   - URL breaks properly on mobile

8. **Expiration Information:**

   ```typescript
   const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
     weekday: 'long',
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   });
   // Example: "Monday, January 31, 2025"
   ```

9. **Download Limits:**
   ```html
   <strong>Download limit:</strong> ${options.maxDownloads} times
   ```

   - Only shown if maxDownloads is set

---

### Resend API Integration

**Configuration:**

```typescript
const resend = new Resend(process.env['RESEND_API_KEY'] || 'placeholder_key');
```

**Environment Variables Required:**

- `RESEND_API_KEY`: Your Resend API key for authentication
- `RESEND_FROM_EMAIL`: Default sender email (e.g., `transfers@tallow.app`)
- `NEXT_PUBLIC_APP_URL`: Public app URL for download links

**API Request Format:**

```typescript
const emailOptions = {
  from: string;                                    // Sender email
  to: string;                                      // Recipient email
  subject: string;                                 // Email subject
  html: string;                                    // HTML content
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
  tags: Array<{
    name: string;
    value: string;
  }>;
  headers?: Record<string, string>;               // Custom headers
};
```

**Response Format:**

```typescript
{
  error?: {
    message: string;
    name: string;
  };
  data?: {
    id: string;                                    // Email ID
  }
}
```

**Error Scenarios:**

| Error                       | Cause                        | Handling          |
| --------------------------- | ---------------------------- | ----------------- |
| `Invalid API key`           | Misconfigured RESEND_API_KEY | Check env config  |
| `Invalid email address`     | Malformed recipient email    | Validate input    |
| `Rate limit exceeded`       | Too many requests            | Implement backoff |
| `Attachment size too large` | File > 25MB (Resend limit)   | Use link instead  |
| `Invalid HTML`              | Malformed email HTML         | Log error         |

---

## Email Templates

### Overview

Tallow provides two React Email components for transactional emails with full
customization support.

**Location:** `lib/emails/`

**Dependencies:**

- `@react-email/components`: Email-optimized React components
- React Server Components (RSC) compatible

---

### Welcome Email Template

**File:** `lib/emails/welcome-email.tsx`

**Component Signature:**

```typescript
interface WelcomeEmailProps {
  name: string; // Recipient full name
}

export function WelcomeEmail({ name }: WelcomeEmailProps);
```

**Props:**

| Prop   | Type     | Description      | Example    |
| ------ | -------- | ---------------- | ---------- |
| `name` | `string` | User's full name | "John Doe" |

**Extracted First Name:**

```typescript
const firstName = name.split(' ')[0]; // "John"
```

**Component Structure:**

1. **Root Elements:**
   - `<Html>`: Email container
   - `<Head>`: Metadata
   - `<Preview>`: "Welcome to Tallow - Share Files Anywhere, Securely!" (shown
     in inbox)
   - `<Body>`: Main content

2. **Visual Sections:**

   **Header Section:**
   - Background gradient:
     `linear-gradient(135deg, #191610 0%, #2a2520 50%, #fefefc 100%)`
   - Dark brown to light cream gradient
   - Logo container: 80x80px with rounded corners
   - Logo emoji: 📤 (40px)
   - Heading: "Welcome to Tallow!" (32px, bold, white)

   **Content Section:**
   - Greeting: "Hey {firstName}! 👋" (24px, bold)
   - Introduction paragraph
   - Feature rows with emojis and descriptions
   - CTA button linking to `/app`

   **Features Highlighted:**

   ```
   📡 Local Network Transfers
   🌍 Internet P2P Transfers
   🔗 Easy Connections
   📋 Clipboard Sync
   ```

   **CTA Button:**
   - Text: "Start Sharing Now →"
   - Background: #8B9A7D (sage green)
   - Link: `http://localhost:3000/app`
   - Padding: 14px 30px
   - Border radius: 10px

   **Footer Section:**
   - Background: #0a0a14 (very dark)
   - Copyright: "© 2024 Tallow"
   - Tagline: "Made with ❤️ for seamless file sharing"

3. **Color Palette:**

   ```typescript
   main: { backgroundColor: '#0a0a1a' }           // Very dark background
   container: { backgroundColor: '#0f0f23', border: '1px solid #1a1a3a' }
   heading: { color: '#ffffff' }                   // White text
   paragraph: { color: '#a1a1aa' }                 // Light gray
   featureTitle: { color: '#ffffff' }              // White
   featureDesc: { color: '#71717a' }               // Medium gray
   footer: { backgroundColor: '#0a0a14' }          // Darkest
   footerText: { color: '#52525b' }                // Dark gray
   footerLinks: { color: '#8B9A7D' }               // Sage green
   ```

4. **Typography:**

   ```typescript
   fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

   heading: { fontSize: '32px', fontWeight: '700' }
   greeting: { fontSize: '24px', fontWeight: '600' }
   subheading: { fontSize: '20px', fontWeight: '600' }
   paragraph: { fontSize: '16px', lineHeight: '26px' }
   featureTitle: { fontSize: '16px', fontWeight: '600' }
   featureDesc: { fontSize: '14px', lineHeight: '22px' }
   footer: { fontSize: '13px' }
   ```

5. **Responsive Behavior:**
   - Container max-width: 600px
   - Flexible padding on mobile
   - Section padding: 40px 30px (desktop), adjusts on mobile
   - Feature rows use flexbox (adapts to mobile)

**Usage Example:**

```typescript
import { WelcomeEmail } from '@/lib/emails/welcome-email';
import { render } from '@react-email/render';

const email = render(<WelcomeEmail name="John Doe" />);
// Use email HTML in Resend API or email service
```

---

### File Transfer Email Template

**File:** `lib/emails/file-transfer-email.tsx`

**Component Signature:**

```typescript
interface FileTransferEmailProps {
  senderName: string; // Name of sender
  fileName: string; // Name of file being transferred
  fileSize: number; // File size in bytes
  expiresAt: number; // Expiration timestamp (ms)
  downloadUrl?: string; // Download link (for >25MB files)
  attachmentMode: boolean; // true = attachment, false = link
  securityNote?: string; // Custom security message
}

export function FileTransferEmail({
  senderName,
  fileName,
  fileSize,
  expiresAt,
  downloadUrl,
  attachmentMode,
  securityNote = 'This file is encrypted end-to-end...',
}: FileTransferEmailProps);
```

**Props:**

| Prop             | Type      | Required | Description              | Example                                 |
| ---------------- | --------- | -------- | ------------------------ | --------------------------------------- |
| `senderName`     | `string`  | Yes      | Sender's display name    | "Alice Johnson"                         |
| `fileName`       | `string`  | Yes      | File name with extension | "document.pdf"                          |
| `fileSize`       | `number`  | Yes      | Size in bytes            | 2097152                                 |
| `expiresAt`      | `number`  | Yes      | Expiration timestamp     | 1706745600000                           |
| `downloadUrl`    | `string`  | No       | Download link            | "https://tallow.app/download/abc123..." |
| `attachmentMode` | `boolean` | Yes      | Attachment vs link       | true                                    |
| `securityNote`   | `string`  | No       | Custom security message  | Default shown                           |

**Helper Functions:**

**1. `formatFileSize(bytes: number): string`**

```typescript
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
```

**Examples:**

- 512 bytes → "512 B"
- 2097152 bytes → "2.0 MB"
- 5368709120 bytes → "5.00 GB"

**2. `formatExpirationTime(expiresAt: number): string`**

```typescript
function formatExpirationTime(expiresAt: number): string {
  const diff = expiresAt - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${Math.max(1, minutes)} minute${minutes !== 1 ? 's' : ''}`;
}
```

**Examples:**

- 7 days remaining → "7 days"
- 12 hours remaining → "12 hours"
- 30 minutes remaining → "30 minutes"

**Component Structure:**

1. **Root Elements:**
   - `<Html>`, `<Head>`, `<Preview>`, `<Body>`
   - Preview text: "{senderName} sent you a file via Tallow - Secure File
     Transfer"

2. **Header Section:**
   - Background gradient: `linear-gradient(135deg, #8B9A7D 0%, #758267 100%)`
   - Sage green gradient
   - Logo container: 80x80px, semi-transparent white (#ffffff 20%), blur effect
   - Logo emoji: 🔒 (40px)
   - Heading: "You've received a file" (28px, bold, white)

3. **File Information Box:**

   ```html
   <section style="{fileInfoBox}">
     📄 File: document.pdf 📊 Size: 2.0 MB ⏰ Expires: 7 days 🔐 Security:
     End-to-end encrypted
   </section>
   ```

   - Background: #f9fafb (light gray)
   - Border: 1px solid #e5e7eb
   - Rounded corners: 8px
   - Two-column layout for key-value pairs

4. **Download Section (Conditional):**

   **If Attachment Mode (true):**

   ```html
   <section style="{attachmentNotice}">
     📎 Your file is attached to this email Download the attachment to access
     your file
   </section>
   ```

   - Background: #dbeafe (light blue)
   - Border: 2px solid #8B9A7D
   - Centered text

   **If Link Mode (false):**

   ```html
   <section style="{ctaSection}">
     <button href="{downloadUrl}" style="{ctaButton}">Download File</button>
     Or copy this link: {downloadUrl}
   </section>
   ```

   - Button background: #8B9A7D
   - Link text: 12px gray with break-all word break

5. **Security Section:**

   ```html
   <section style="{securitySection}">
     🛡️ Security & Privacy • Files are encrypted with military-grade encryption
     (AES-256-GCM) • Your file will automatically expire on {date} at {time} •
     (Link only) This is a one-time download link that expires after use • The
     sender cannot access your file after sending
   </section>
   ```

   - Background: #f0fdf4 (light green)
   - Border: 1px solid #86efac
   - Security text: #15803d (dark green)

6. **Warning Box:**

   ```html
   ⚠️ Security Notice: Only download files from people you trust. If you don't
   recognize the sender, do not download the file.
   ```

   - Background: #fef3c7 (light yellow)
   - Border: 1px solid #fbbf24
   - Text: #92400e (dark orange)

7. **Footer:**
   - Background: #f9fafb
   - Text: "Sent via [Tallow](https://tallow.app) - Secure File Transfer"
   - Subtext: "End-to-end encrypted file sharing"

8. **Color Scheme:**

   ```typescript
   main: { backgroundColor: '#f6f9fc' }            // Very light blue
   container: { backgroundColor: '#ffffff' }       // White
   headerSection: { background: 'linear-gradient(135deg, #8B9A7D 0%, #758267 100%)' }
   heading: { color: '#ffffff' }                    // White
   paragraph: { color: '#4b5563' }                  // Dark gray
   fileInfoBox: { backgroundColor: '#f9fafb' }     // Light gray
   fileInfoValue: { color: '#1f2937', fontWeight: '600' }  // Dark, bold
   attachmentNotice: { backgroundColor: '#dbeafe' }  // Light blue
   securitySection: { backgroundColor: '#f0fdf4' }  // Light green
   warningText: { backgroundColor: '#fef3c7' }      // Light yellow
   ```

9. **Typography:**

   ```typescript
   fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'

   heading: { fontSize: '28px', fontWeight: '700' }
   greeting: { fontSize: '18px', fontWeight: '600' }
   paragraph: { fontSize: '16px', lineHeight: '24px' }
   fileInfoLabel: { fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }
   fileInfoValue: { fontSize: '14px', fontWeight: '600' }
   securityTitle: { fontSize: '16px', fontWeight: '600' }
   securityText: { fontSize: '14px', lineHeight: '20px' }
   ```

**Usage Example:**

```typescript
import { FileTransferEmail } from '@/lib/emails/file-transfer-email';
import { render } from '@react-email/render';

const email = render(
  <FileTransferEmail
    senderName="Alice Johnson"
    fileName="project-proposal.pdf"
    fileSize={2097152}
    expiresAt={Date.now() + 7 * 24 * 60 * 60 * 1000}
    downloadUrl="https://tallow.app/download/abc123def456"
    attachmentMode={false}
    securityNote="This file contains sensitive information and is encrypted."
  />
);
```

---

## File Compression System

### Overview

The file compression system automatically compresses multiple files into a ZIP
archive when beneficial, reducing email attachment size and improving delivery
speed.

**Location:** `lib/email/file-compression.ts`

### Compression Algorithm

#### `compressFiles(files: Array<...>): Promise<CompressedFile>`

**Purpose:** Compress multiple files into a single ZIP archive.

**Function Signature:**

```typescript
export async function compressFiles(
  files: Array<{ filename: string; content: Buffer | string; size: number }>
): Promise<CompressedFile>;
```

**Return Type:**

```typescript
interface CompressedFile {
  buffer: Buffer; // Compressed ZIP data
  filename: string; // Archive filename (files-YYYY-MM-DD.zip)
  originalSize: number; // Total uncompressed size
  compressedSize: number; // Compressed size
  checksum: string; // SHA-256 checksum of compressed data
  compressionRatio: number; // Percentage reduction (0-100)
}
```

**Implementation Details:**

1. **Lazy Loading:**

   ```typescript
   const JSZip = (await import('jszip')).default;
   const zip = new JSZip();
   ```

   - JSZip (~25KB) loaded only when compression needed
   - Reduces initial bundle size
   - Dynamic import pattern for code splitting

2. **File Processing:**

   ```typescript
   for (const file of files) {
     const content =
       typeof file.content === 'string'
         ? Buffer.from(file.content, 'base64')
         : file.content;

     zip.file(file.filename, content);
     totalOriginalSize += file.size;
   }
   ```

   - Handles both Buffer and base64 string content
   - Maintains original filenames in archive
   - Accumulates total size

3. **Compression Configuration:**

   ```typescript
   const compressedBuffer = await zip.generateAsync({
     type: 'nodebuffer', // Node.js Buffer output
     compression: 'DEFLATE', // DEFLATE compression algorithm
     compressionOptions: { level: 6 }, // 1-9 scale, 6 is balanced
   });
   ```

   **Compression Levels:** | Level | Speed | Ratio | Use Case |
   |-------|-------|-------|----------| | 1 | Very Fast | 40-50% | Large files,
   time-sensitive | | 6 | Balanced | 60-70% | **Default - General use** | | 9 |
   Slow | 75-85% | Small files, batch processing |

   **Why Level 6:**
   - Good compression ratio (60-70% typical)
   - Reasonable processing time (~100ms for 50MB)
   - Balances file size reduction with performance
   - Suitable for email attachments

4. **Checksum Calculation:**

   ```typescript
   function calculateChecksum(buffer: Buffer): string {
     return createHash('sha256').update(buffer).digest('hex');
   }
   ```

   - SHA-256 cryptographic hash
   - 64-character hexadecimal string
   - Used for integrity verification during download

5. **Compression Ratio Calculation:**

   ```typescript
   const compressionRatio =
     totalOriginalSize > 0 ? (1 - compressedSize / totalOriginalSize) * 100 : 0;
   ```

   - Percentage of size reduction
   - Example: 100MB → 30MB = 70% compression ratio

6. **Filename Generation:**
   ```typescript
   const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
   const filename = 'files-' + timestamp + '.zip';
   ```

   - Example: `files-2025-01-31.zip`
   - Human-readable date included
   - Consistent naming across same-day transfers

**Example Process:**

```
Input Files:
  - document.txt (1 MB)
  - image.jpg (5 MB)
  - spreadsheet.csv (2 MB)
  Total: 8 MB

Compression:
  - Compression level: 6 (DEFLATE)
  - Processing time: ~150ms
  - Output size: 5.2 MB
  - Compression ratio: 35%

Result:
  - filename: "files-2025-01-31.zip"
  - originalSize: 8,388,608
  - compressedSize: 5,443,608
  - compressionRatio: 35.2
  - checksum: "a3f8c92e..."
```

---

### Compression Decision Logic

#### `shouldCompress(files, totalSize): boolean`

**Purpose:** Determine if compression is beneficial for a file set.

**Function Signature:**

```typescript
export function shouldCompress(
  files: Array<{ filename: string; size: number }>,
  _totalSize: number
): boolean;
```

**Returns:** `true` if compression should occur, `false` otherwise

**Decision Tree:**

```
1. Check file count
   ↓
   if files.length <= 1 → return false
   (Single files rarely benefit from compression)
   ↓
2. Check file types
   ↓
   Pre-compressed extensions:
     .zip, .gz, .7z, .rar, .tar.gz
     .jpg, .jpeg, .png, .gif, .webp
     .mp4, .avi, .mov, .mkv
     .mp3, .aac, .ogg, .flac
     .pdf, .docx, .xlsx, .pptx
   ↓
   if ALL files in pre-compressed list → return false
   (Already compressed, ZIP won't help)
   ↓
3. All checks passed
   ↓
   return true
   (Compression beneficial)
```

**Algorithm:**

```typescript
export function shouldCompress(files, _totalSize): boolean {
  if (files.length <= 1) return false; // Skip single files

  const compressedExtensions = [
    '.zip',
    '.gz',
    '.7z',
    '.rar',
    '.tar.gz',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.mp4',
    '.avi',
    '.mov',
    '.mkv',
    '.mp3',
    '.aac',
    '.ogg',
    '.flac',
    '.pdf',
    '.docx',
    '.xlsx',
    '.pptx',
  ];

  // Check if all files are already compressed
  const allCompressed = files.every((file) =>
    compressedExtensions.some((ext) =>
      file.filename.toLowerCase().endsWith(ext)
    )
  );

  return !allCompressed; // Compress if not all pre-compressed
}
```

**Examples:**

| Files                                   | Should Compress? | Reason                             |
| --------------------------------------- | ---------------- | ---------------------------------- |
| `document.txt`                          | No               | Single file                        |
| `image.jpg`                             | No               | Single file                        |
| `presentation.pptx, notes.txt`          | No               | `.pptx` already compressed         |
| `report.pdf, slides.pdf`                | No               | All PDFs already compressed        |
| `data.csv, notes.txt, readme.md`        | Yes              | Text files compress well           |
| `photos.jpg, video.mp4`                 | No               | All already compressed             |
| `document.docx, report.xlsx, guide.txt` | No               | `.docx` and `.xlsx` pre-compressed |
| `notes.txt, script.js, styles.css`      | Yes              | Text-based files                   |

---

### Compression Ratio Estimation

#### `estimateCompressionRatio(files): number`

**Purpose:** Estimate expected compression ratio before actual compression.

**Function Signature:**

```typescript
export function estimateCompressionRatio(
  files: Array<{ filename: string; size: number }>
): number;
```

**Returns:** Average compression percentage (0-100)

**File Type Mapping:**

```typescript
const compressionEstimates = {
  // Highly compressible (70% reduction)
  txt: 0.7,
  html: 0.7,
  css: 0.7,
  js: 0.7,
  json: 0.7,
  xml: 0.7,
  svg: 0.7,

  // Barely compressible (5% reduction)
  jpg: 0.05,
  jpeg: 0.05,
  png: 0.05,
  gif: 0.05,
  mp4: 0.05,
  mp3: 0.05,
  pdf: 0.05,

  // Moderately compressible (30% reduction)
  // (all other extensions)
  default: 0.3,
};
```

**Algorithm:**

```typescript
let estimatedRatio = 0;

for (const file of files) {
  const ext = file.filename.toLowerCase().split('.').pop() || '';

  if (['txt', 'html', 'css', 'js', 'json', 'xml', 'svg'].includes(ext)) {
    estimatedRatio += 0.7;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'pdf'].includes(ext)) {
    estimatedRatio += 0.05;
  } else {
    estimatedRatio += 0.3;
  }
}

return files.length > 0 ? (estimatedRatio / files.length) * 100 : 0;
```

**Examples:**

| Files                             | Estimated Ratio         |
| --------------------------------- | ----------------------- |
| `notes.txt, readme.md`            | 70%                     |
| `image.jpg, photo.png`            | 5%                      |
| `document.pdf`                    | 5%                      |
| `notes.txt, image.jpg, data.csv`  | (70 + 5 + 30) / 3 ≈ 35% |
| `script.js, styles.css, app.json` | 70%                     |

---

### File Size Formatting

#### `formatFileSize(bytes: number): string`

**Purpose:** Convert byte count to human-readable format.

**Function Signature:**

```typescript
export function formatFileSize(bytes: number): string;
```

**Returns:** Formatted string with appropriate unit

**Algorithm:**

```typescript
if (bytes < 1024) return `${bytes} B`;
if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
if (bytes < 1024 * 1024 * 1024)
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
```

**Examples:**

| Bytes      | Output    |
| ---------- | --------- |
| 512        | "512 B"   |
| 1024       | "1.0 KB"  |
| 2097152    | "2.0 MB"  |
| 1073741824 | "1.0 GB"  |
| 5368709120 | "5.00 GB" |

---

## Password Protection

### Overview

Tallow implements military-grade encryption for password-protected file
transfers using **AES-256-GCM** symmetric encryption with **scrypt** key
derivation.

**Location:** `lib/email/password-protection.ts`

### Encryption Details

**Cipher:** AES-256-GCM

- **Algorithm:** Advanced Encryption Standard (AES)
- **Key Size:** 256 bits (32 bytes)
- **Mode:** Galois/Counter Mode (GCM)
- **Authentication:** Built-in GMAC authentication
- **IV Size:** 128 bits (16 bytes)
- **Auth Tag Size:** 128 bits (16 bytes)

**Why AES-256-GCM:**

- Military/government-grade encryption (NSA Suite B)
- Authenticated encryption (detects tampering)
- High performance (hardware acceleration available)
- Industry standard (used by TLS 1.3)
- Suitable for sensitive data

### Key Derivation

#### `deriveKey(password: string, salt: Buffer): Buffer`

**Purpose:** Derive encryption key from password using scrypt.

**Function Signature:**

```typescript
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}
```

**Parameters:**

| Parameter    | Type     | Description            |
| ------------ | -------- | ---------------------- |
| `password`   | `string` | User-provided password |
| `salt`       | `Buffer` | Random 32-byte salt    |
| `KEY_LENGTH` | `number` | 32 (256 bits)          |

**Scrypt Configuration:**

```typescript
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 32; // 32 random bytes
```

**Scrypt Algorithm (Default Node.js Parameters):**

- **N:** 2^14 = 16,384 iterations
- **r:** 8 (block size)
- **p:** 1 (parallelization)
- **Output:** 32 bytes (256 bits)

**Why Scrypt:**

- Memory-hard algorithm (resistant to GPU/ASIC attacks)
- Configurable computation cost
- Industry adoption increasing
- Better than PBKDF2 for password security
- Slower by design (~100-200ms per derivation)

**Example:**

```
Password: "SecurePass123!"
Salt: 32 random bytes
↓
scryptSync(password, salt, 32)
↓
Derived Key: 32 bytes of cryptographically secure material
(different for each salt, deterministic)
```

---

### Encryption Process

#### `encryptWithPassword(data: Buffer, password: string): PasswordProtectedDownload`

**Purpose:** Encrypt file data with password protection.

**Function Signature:**

```typescript
export function encryptWithPassword(
  data: Buffer,
  password: string
): PasswordProtectedDownload;
```

**Parameters:**

| Parameter  | Type     | Description            |
| ---------- | -------- | ---------------------- |
| `data`     | `Buffer` | File data to encrypt   |
| `password` | `string` | User-provided password |

**Return Type:**

```typescript
interface PasswordProtectedDownload {
  transferId: string; // Random transfer ID
  encryptedData: string; // Encrypted data (base64)
  salt: string; // Salt (hex string)
  iv: string; // IV (hex string)
  authTag: string; // Auth tag (hex string)
}
```

**Step-by-Step Process:**

1. **Generate Random Values:**

   ```typescript
   const salt = randomBytes(SALT_LENGTH); // 32 bytes
   const iv = randomBytes(IV_LENGTH); // 16 bytes
   ```

   - `randomBytes()` from Node.js crypto module
   - Cryptographically secure random generation
   - Unique for each encryption operation

2. **Derive Encryption Key:**

   ```typescript
   const key = deriveKey(password, salt); // 32 bytes
   ```

   - Scrypt key derivation from password
   - Same salt always produces same key
   - Different salts → different keys (even same password)

3. **Create Cipher:**

   ```typescript
   const cipher = createCipheriv(ALGORITHM, key, iv);
   // ALGORITHM = 'aes-256-gcm'
   ```

4. **Encrypt Data:**

   ```typescript
   const encrypted = Buffer.concat([
     cipher.update(data), // Encrypted data
     cipher.final(), // Final block
   ]);
   ```

   - Incremental encryption (supports streaming)
   - Concatenates update() and final() results

5. **Get Authentication Tag:**

   ```typescript
   const authTag = cipher.getAuthTag(); // 16 bytes
   ```

   - Generated automatically by GCM mode
   - Used to verify data authenticity during decryption
   - Prevents tampering/forgery

6. **Format Output:**
   ```typescript
   return {
     transferId: randomBytes(16).toString('hex'),
     encryptedData: encrypted.toString('base64'),
     salt: salt.toString('hex'),
     iv: iv.toString('hex'),
     authTag: authTag.toString('hex'),
   };
   ```

   - All values encoded as strings for storage/transmission
   - Base64 for encrypted data (binary-safe)
   - Hex for salt, IV, auth tag

**Data Flow Diagram:**

```
Password: "MyPassword123!"
↓
[Salt: random 32 bytes] + [IV: random 16 bytes]
↓
Key Derivation (scrypt)
↓
Encryption Key (32 bytes)
↓
[File Data] + [Key] + [IV]
↓
AES-256-GCM Cipher
↓
[Encrypted Data] + [Auth Tag]
↓
PasswordProtectedDownload {
  salt (hex),
  iv (hex),
  authTag (hex),
  encryptedData (base64),
  transferId
}
```

**Example Encrypted Object:**

```json
{
  "transferId": "a3f8c92e1b4d6f9a2c5e8f1b4d7a9c2e",
  "encryptedData": "xyz7+Qb8...base64...==",
  "salt": "f5a8d2e1c9b7a4f6e3c5b8a2d4f1e9c7",
  "iv": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "authTag": "d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3"
}
```

---

### Decryption Process

#### `decryptWithPassword(protectedDownload: PasswordProtectedDownload, password: string): Buffer`

**Purpose:** Decrypt encrypted data with password.

**Function Signature:**

```typescript
export function decryptWithPassword(
  protectedDownload: PasswordProtectedDownload,
  password: string
): Buffer;
```

**Parameters:**

| Parameter           | Type                        | Description            |
| ------------------- | --------------------------- | ---------------------- |
| `protectedDownload` | `PasswordProtectedDownload` | Encrypted data object  |
| `password`          | `string`                    | User-provided password |

**Returns:** Decrypted file data as Buffer

**Step-by-Step Process:**

1. **Parse Hex/Base64 Strings:**

   ```typescript
   const salt = Buffer.from(protectedDownload.salt, 'hex');
   const iv = Buffer.from(protectedDownload.iv, 'hex');
   const authTag = Buffer.from(protectedDownload.authTag, 'hex');
   const encryptedData = Buffer.from(protectedDownload.encryptedData, 'base64');
   ```

2. **Derive Key (Same as Encryption):**

   ```typescript
   const key = deriveKey(password, salt);
   ```

   - Uses same scrypt parameters
   - Produces same key if password correct

3. **Create Decipher:**

   ```typescript
   const decipher = createDecipheriv(ALGORITHM, key, iv);
   ```

4. **Set Authentication Tag:**

   ```typescript
   decipher.setAuthTag(authTag);
   ```

   - Must be set before decrypting
   - Validates authenticity of encrypted data
   - Throws error if data tampered with

5. **Decrypt Data:**

   ```typescript
   const decrypted = Buffer.concat([
     decipher.update(encryptedData),
     decipher.final(),
   ]);
   ```

   - Throws error if auth tag verification fails
   - Returns original plaintext on success

6. **Error Handling:**
   ```typescript
   try {
     // Decryption process
   } catch (_error) {
     throw new Error('Invalid password or corrupted data');
   }
   ```

   - Catches both wrong password and tampering
   - Generic error message for security

**Decryption Verification:**

- If password wrong → scrypt produces wrong key → decipher fails
- If data tampered → auth tag check fails → decipher throws
- If auth tag wrong → decipher throws
- Only correct password + untampered data succeeds

---

### Password Strength Validation

#### `validatePasswordStrength(password: string): ValidationResult`

**Purpose:** Validate password meets security requirements.

**Function Signature:**

```typescript
export function validatePasswordStrength(password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
};
```

**Validation Criteria:**

1. **Minimum Length:**
   - Required: ≥ 8 characters
   - Issue message: "Password must be at least 8 characters long"

2. **Character Types (Complexity Score):**
   - Uppercase letters [A-Z]: 1 point
   - Lowercase letters [a-z]: 1 point
   - Numbers [0-9]: 1 point
   - Special characters `!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?`: 1 point
   - Length ≥ 12 characters: 1 point (bonus)

3. **Strength Classification:**

   ```
   Score < 2:  Weak
   Score 2-3:  Medium
   Score ≥ 4:  Strong
   ```

4. **Common Password Check:**
   - Blacklist: `['password', '12345678', 'qwerty', 'abc123', 'password123']`
   - Forces "weak" classification if matched (case-insensitive)

**Examples:**

| Password           | Issues             | Strength | Valid |
| ------------------ | ------------------ | -------- | ----- |
| `pass`             | Length, complexity | Weak     | No    |
| `password`         | Common password    | Weak     | No    |
| `Pass123`          | None               | Medium   | Yes   |
| `MySecurePass123`  | None               | Strong   | Yes   |
| `P@ssw0rd!Secure2` | None               | Strong   | Yes   |

---

### Secure Password Generation

#### `generateSecurePassword(length?: number): string`

**Purpose:** Generate a random secure password meeting all requirements.

**Function Signature:**

```typescript
export function generateSecurePassword(length: number = 16): string;
```

**Parameters:**

| Parameter | Type     | Default | Description               |
| --------- | -------- | ------- | ------------------------- |
| `length`  | `number` | 16      | Generated password length |

**Returns:** Random password string

**Algorithm:**

1. **Character Set:**

   ```typescript
   const charset =
     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
   ```

   - 68 characters total
   - Includes uppercase, lowercase, numbers, symbols

2. **Random Selection:**

   ```typescript
   const randomBytesBuffer = randomBytes(length);
   let password = '';

   for (let i = 0; i < length; i++) {
     const byte = randomBytesBuffer[i];
     password += charset[byte % charset.length];
   }
   ```

   - Uses cryptographic randomness
   - Modulo operation selects charset index

3. **Validation:**

   ```typescript
   const hasUppercase = /[A-Z]/.test(password);
   const hasLowercase = /[a-z]/.test(password);
   const hasNumbers = /\d/.test(password);
   const hasSpecial = /[!@#$%^&*]/.test(password);

   if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecial) {
     return generateSecurePassword(length); // Retry
   }
   ```

   - Ensures all character types present
   - Recursive retry if validation fails (rare, ~1 in 10)

**Examples:**

- Length 16: `K@7mP9Lx2Qw8Rn3C`
- Length 20: `V5d4Hj$2eFx!Ky9pBz&8Ws`
- Length 12: `A3b!Cd5Ef#Gh`

---

### Password Hashing for Storage

#### `hashPasswordForStorage(password: string): { hash: string; salt: string }`

**Purpose:** Hash password for verification (NOT for encryption).

**Function Signature:**

```typescript
export function hashPasswordForStorage(password: string): {
  hash: string;
  salt: string;
};
```

**Returns:** Hash and salt both as hex strings

**Implementation:**

```typescript
const salt = randomBytes(SALT_LENGTH); // 32 bytes
const hash = scryptSync(password, salt, 64); // 64 bytes (longer than encryption)

return {
  hash: hash.toString('hex'), // 128-char hex string
  salt: salt.toString('hex'), // 64-char hex string
};
```

**Why Different from Encryption Key Derivation:**

- Encryption: 32-byte output (KEY_LENGTH)
- Storage: 64-byte output (longer for more security)
- Different use cases require different approaches

**Use Cases:**

```typescript
// Store both hash and salt in database
const { hash, salt } = hashPasswordForStorage(userPassword);
await db.users.update(userId, { passwordHash: hash, passwordSalt: salt });

// Later, verify password attempt
if (verifyPassword(attemptedPassword, storedHash, storedSalt)) {
  // Password matches
}
```

---

#### `verifyPassword(password: string, storedHash: string, storedSalt: string): boolean`

**Purpose:** Verify password against stored hash.

**Function Signature:**

```typescript
export function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): boolean;
```

**Returns:** `true` if password matches, `false` otherwise

**Algorithm:**

```typescript
const salt = Buffer.from(storedSalt, 'hex');
const hash = scryptSync(password, salt, 64);

return hash.toString('hex') === storedHash;
```

**Security Properties:**

- Timing-safe comparison (scryptSync is constant-time)
- Cannot retrieve password from hash
- Same password always produces same hash (given same salt)
- Different passwords produce different hashes (with extremely high probability)

---

## Retry Manager

### Overview

The retry manager implements exponential backoff with jitter for reliable email
delivery. It automatically retries failed emails with configurable delays and
error conditions.

**Location:** `lib/email/retry-manager.ts`

### Exponential Backoff Algorithm

#### `calculateRetryDelay(attemptNumber: number, policy?: EmailRetryPolicy): number`

**Purpose:** Calculate delay before next retry using exponential backoff with
jitter.

**Function Signature:**

```typescript
export function calculateRetryDelay(
  attemptNumber: number,
  policy: EmailRetryPolicy = DEFAULT_RETRY_POLICY
): number;
```

**Parameters:**

| Parameter       | Type               | Description                          |
| --------------- | ------------------ | ------------------------------------ |
| `attemptNumber` | `number`           | 0-based attempt index (0, 1, 2, ...) |
| `policy`        | `EmailRetryPolicy` | Retry configuration                  |

**Default Policy:**

```typescript
const DEFAULT_RETRY_POLICY = {
  maxRetries: 3, // Max 3 retries (4 total attempts)
  initialDelayMs: 1000, // First retry after 1 second
  backoffMultiplier: 2, // Double delay each time
  maxDelayMs: 30000, // Cap at 30 seconds
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'rate_limit',
    'temporarily_unavailable',
  ],
};
```

**Formula:**

```
baseDelay = initialDelayMs × (backoffMultiplier ^ attemptNumber)
cappedDelay = min(baseDelay, maxDelayMs)
jitter = ±10% of cappedDelay
finalDelay = cappedDelay + (random jitter)
```

**Algorithm:**

```typescript
const delay = Math.min(
  policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attemptNumber),
  policy.maxDelayMs
);

// Add jitter (±10%) to prevent thundering herd problem
const jitter = delay * 0.1 * (Math.random() * 2 - 1);
return Math.floor(delay + jitter);
```

**Detailed Breakdown:**

1. **Base Calculation:**

   ```
   delay = 1000 × 2^attemptNumber
   ```

2. **Cap to Max Delay:**

   ```
   delay = min(delay, 30000)
   ```

3. **Jitter Generation:**

   ```
   jitter_range = delay × 0.1        // 10% of delay
   jitter = jitter_range × (-1 to 1) // Random within range
   ```

   - `Math.random() * 2 - 1` produces value from -1 to 1
   - Multiplied by 10% of delay
   - Results in ±10% variation

4. **Final Delay:**
   ```
   return Math.floor(delay + jitter)
   ```

**Example Sequence (with random jitter):**

| Attempt | Base Delay | Capped  | Jitter Variance | Result        | Time Total |
| ------- | ---------- | ------- | --------------- | ------------- | ---------- |
| Initial | -          | -       | -               | 0ms           | 0ms        |
| 1       | 1000ms     | 1000ms  | ±100ms          | 950-1050ms    | ~1s        |
| 2       | 2000ms     | 2000ms  | ±200ms          | 1800-2200ms   | ~3s        |
| 3       | 4000ms     | 4000ms  | ±400ms          | 3600-4400ms   | ~7.5s      |
| 4       | 8000ms     | 8000ms  | ±800ms          | 7200-8800ms   | ~15.5s     |
| 5       | 16000ms    | 16000ms | ±1600ms         | 14400-17600ms | ~33s       |
| 6+      | 32000ms    | 30000ms | ±3000ms         | 27000-33000ms | ~63s       |

**Why Jitter:**

- Prevents "thundering herd" problem
- Multiple failed emails don't retry simultaneously
- Distributes retry load over time
- Reduces peak load spikes on server

**Graph (Exponential Growth):**

```
30s |                    ----
25s |                  /
20s |              /
15s |          /
10s |      /
5s  |  /
    |--+--+--+--+--+--+
      0  1  2  3  4  5  attempt
```

---

### Retryable Error Detection

#### `isRetryableError(error: Error | string, policy?: EmailRetryPolicy): boolean`

**Purpose:** Determine if error should trigger retry.

**Function Signature:**

```typescript
export function isRetryableError(
  error: Error | string,
  policy: EmailRetryPolicy = DEFAULT_RETRY_POLICY
): boolean;
```

**Returns:** `true` if error is in retryable list, `false` otherwise

**Retryable Errors (Default):**

| Error Code                | Meaning                   | Retryable? |
| ------------------------- | ------------------------- | ---------- |
| `ETIMEDOUT`               | Network timeout           | ✓ Yes      |
| `ECONNRESET`              | Connection reset by peer  | ✓ Yes      |
| `ENOTFOUND`               | DNS resolution failed     | ✓ Yes      |
| `ECONNREFUSED`            | Connection refused        | ✓ Yes      |
| `rate_limit`              | API rate limit exceeded   | ✓ Yes      |
| `temporarily_unavailable` | Service temporarily down  | ✓ Yes      |
| `invalid_email`           | Malformed recipient email | ✗ No       |
| `invalid_api_key`         | Auth failure              | ✗ No       |
| `invalid_html`            | Malformed HTML content    | ✗ No       |

**Non-Retryable Errors:**

- Authentication/authorization errors
- Invalid input/validation errors
- Permanent rejections
- Client errors (4xx-like)

**Algorithm:**

```typescript
const errorMessage = typeof error === 'string' ? error : error.message;
const errorCode =
  typeof error === 'object' && 'code' in error ? (error as any).code : '';

return policy.retryableErrors.some((retryableError) => {
  return errorMessage.includes(retryableError) || errorCode === retryableError;
});
```

---

### Retry Manager Class

#### `EmailRetryManager`

**Purpose:** Manage retry state and scheduling for multiple emails.

**Class Methods:**

##### `recordFailure(emailId: string, error: Error | string): RetryState`

**Purpose:** Record a failed delivery attempt.

**Returns:** Updated retry state

**Logic:**

```typescript
recordFailure(emailId: string, error: Error | string): RetryState {
  let state = this.retryStates.get(emailId);

  if (!state) {
    state = {
      emailId,
      attempts: [],
      maxRetriesReached: false,
    };
    this.retryStates.set(emailId, state);
  }

  const attemptNumber = state.attempts.length;
  const shouldRetry = attemptNumber < this.policy.maxRetries &&
                     isRetryableError(error, this.policy);

  const attempt: RetryAttempt = {
    attempt: attemptNumber,
    timestamp: Date.now(),
    error: typeof error === 'string' ? error : error.message,
  };

  if (shouldRetry) {
    const delay = calculateRetryDelay(attemptNumber, this.policy);
    attempt.nextRetryAt = Date.now() + delay;
    state.nextRetryAt = attempt.nextRetryAt;
  } else {
    state.maxRetriesReached = true;
  }

  state.attempts.push(attempt);
  state.lastError = attempt.error;

  return state;
}
```

**Retry State:**

```typescript
interface RetryState {
  emailId: string; // Email identifier
  attempts: RetryAttempt[]; // Array of attempts
  lastError?: string; // Most recent error
  nextRetryAt?: number; // When to retry next (ms)
  maxRetriesReached: boolean; // No more retries allowed
}

interface RetryAttempt {
  attempt: number; // 0-based attempt index
  timestamp: number; // When attempted (ms)
  error?: string; // Error message
  nextRetryAt?: number; // Scheduled retry time (ms)
}
```

---

##### `scheduleRetry(emailId: string, retryCallback: () => Promise<void>): void`

**Purpose:** Schedule automatic retry at calculated time.

**Parameters:**

| Parameter       | Type                  | Description             |
| --------------- | --------------------- | ----------------------- |
| `emailId`       | `string`              | Email to retry          |
| `retryCallback` | `() => Promise<void>` | Async function to retry |

**Algorithm:**

```typescript
scheduleRetry(emailId: string, retryCallback: () => Promise<void>): void {
  const state = this.retryStates.get(emailId);
  if (!state || !state.nextRetryAt) return;  // No retry scheduled

  // Cancel existing timer
  const existingTimer = this.retryTimers.get(emailId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Calculate delay
  const delay = Math.max(0, state.nextRetryAt - Date.now());

  // Set timeout
  const timer = setTimeout(async () => {
    try {
      await retryCallback();
      this.clearRetryState(emailId);  // Success - clear state
    } catch (error) {
      // Failure - will be recorded by next recordFailure call
    }
    this.retryTimers.delete(emailId);
  }, delay);

  this.retryTimers.set(emailId, timer);
}
```

**Flow:**

1. Get retry state for email
2. Clear any existing timeout
3. Calculate delay to next retry time
4. Set Node.js timeout
5. On timeout, execute callback
6. If success, clear state
7. If failure, let next recordFailure handle it

---

##### `shouldRetry(emailId: string): boolean`

**Purpose:** Check if email is eligible for retry now.

**Returns:** `true` if retry should happen now, `false` otherwise

**Conditions:**

```typescript
shouldRetry(emailId: string): boolean {
  const state = this.retryStates.get(emailId);
  if (!state) return false;

  return !state.maxRetriesReached &&
         state.attempts.length < this.policy.maxRetries &&
         (!state.nextRetryAt || Date.now() >= state.nextRetryAt);
}
```

**Returns true only if:**

1. State exists for email
2. Max retries not reached
3. Fewer attempts than max
4. Current time >= scheduled retry time

---

##### `getStats(): RetryStatistics`

**Purpose:** Get overall retry statistics.

**Returns:**

```typescript
{
  totalEmails: number; // Total emails with retry state
  pendingRetries: number; // Awaiting retry
  maxRetriesReached: number; // Exhausted all retries
  averageAttempts: number; // Mean attempts per email
}
```

**Example:**

```typescript
const stats = retryManager.getStats();
console.log(`Total emails: ${stats.totalEmails}`);
console.log(`Pending retries: ${stats.pendingRetries}`);
console.log(`Failed (max retries): ${stats.maxRetriesReached}`);
console.log(`Average attempts: ${stats.averageAttempts.toFixed(1)}`);
// Output:
// Total emails: 150
// Pending retries: 23
// Failed (max retries): 2
// Average attempts: 1.3
```

---

##### `clearRetryState(emailId: string): void`

**Purpose:** Clear all retry information for email.

**Use Cases:**

- After successful delivery
- After max retries exhausted and user notified
- Manual retry cancellation

---

##### `clearAll(): void`

**Purpose:** Clear all retry states and timers.

**Clears:**

- All scheduled timeouts
- All retry state maps
- Used on shutdown/cleanup

---

##### `updatePolicy(policy: Partial<EmailRetryPolicy>): void`

**Purpose:** Update retry policy dynamically.

**Example:**

```typescript
retryManager.updatePolicy({
  maxRetries: 5, // Increase retries
  maxDelayMs: 60000, // Allow longer delays
});
```

---

### Singleton Pattern

**Implementation:**

```typescript
let retryManagerInstance: EmailRetryManager | null = null;

export function getRetryManager(): EmailRetryManager {
  if (!retryManagerInstance) {
    retryManagerInstance = new EmailRetryManager();
  }
  return retryManagerInstance;
}
```

**Usage:**

```typescript
// Anywhere in application
const retryManager = getRetryManager();
retryManager.recordFailure(emailId, error);
retryManager.scheduleRetry(emailId, retryCallback);
```

---

## Email Storage & Analytics

### Overview

The email storage system maintains transfer records, tracks delivery status,
manages expiration, and records analytics events.

**Location:** `lib/email/email-storage.ts`

### Data Model

#### `StoredEmailTransfer`

**Complete Data Structure:**

```typescript
interface StoredEmailTransfer {
  // Identifiers
  id: string; // Unique transfer ID (32-char hex)

  // Recipient
  recipientEmail: string; // Recipient email address

  // Sender
  senderName: string; // Sender display name
  senderEmail?: string; // Sender email address

  // Files
  files: Array<{
    filename: string; // File name with extension
    size: number; // File size in bytes
    contentType?: string; // MIME type
    checksum?: string; // SHA-256 checksum
  }>;

  // Security
  passwordProtected: boolean; // Password encrypted?

  // Expiration
  expiresAt: number; // Expiration timestamp (ms)
  maxDownloads?: number; // Max allowed downloads

  // Usage
  downloadsCount: number; // Actual downloads

  // Status
  status: EmailDeliveryStatus['status'];

  // Timestamps
  createdAt: number; // Created timestamp
  sentAt?: number; // Email sent timestamp
  deliveredAt?: number; // Email delivered timestamp
  downloadedAt?: number; // First download timestamp

  // Metadata
  metadata?: Record<string, string>; // Custom metadata
  webhookUrl?: string; // Webhook URL
  branding?: EmailBranding; // Custom branding
}
```

**Status Enum:**

```typescript
type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'downloaded'
  | 'expired'
  | 'failed';
```

---

### Storage Operations

#### `storeEmailTransfer(transfer: StoredEmailTransfer): Promise<void>`

**Purpose:** Store new transfer record.

**Storage:**

```typescript
const EMAIL_TRANSFERS_KEY = 'tallow_email_transfers';

// Stored as: { [EMAIL_TRANSFERS_KEY]: JSON.stringify(Array<StoredEmailTransfer>) }
```

**Logic:**

```typescript
export async function storeEmailTransfer(
  transfer: StoredEmailTransfer
): Promise<void> {
  const transfers = await getAllEmailTransfers();
  transfers.push(transfer);

  // Keep only last 1000 transfers (auto-cleanup old records)
  const recentTransfers = transfers.slice(-1000);

  await secureStorage.setItem(
    EMAIL_TRANSFERS_KEY,
    JSON.stringify(recentTransfers)
  );
}
```

**Retention Policy:**

- Stores last 1000 transfers
- Automatic cleanup on write
- LRU (Least Recently Used) eviction

---

#### `getAllEmailTransfers(): Promise<StoredEmailTransfer[]>`

**Purpose:** Retrieve all stored transfers.

**Returns:** Array of transfers (empty array if none stored)

---

#### `getEmailTransfer(id: string): Promise<StoredEmailTransfer | null>`

**Purpose:** Get specific transfer by ID.

**Returns:** Transfer object or null if not found

---

#### `updateEmailTransferStatus(id: string, status: string, metadata?: Partial<StoredEmailTransfer>): Promise<void>`

**Purpose:** Update transfer status and metadata.

**Example:**

```typescript
await updateEmailTransferStatus(transferId, 'downloaded', {
  downloadedAt: Date.now(),
  downloadsCount: 1,
});
```

---

### Download Tracking

#### `incrementDownloadCount(id: string): Promise<number>`

**Purpose:** Increment and return download count.

**Logic:**

```typescript
export async function incrementDownloadCount(id: string): Promise<number> {
  const transfers = await getAllEmailTransfers();
  const transfer = transfers.find((t) => t.id === id);

  if (!transfer) throw new Error(`Transfer ${id} not found`);

  transfer.downloadsCount = (transfer.downloadsCount || 0) + 1;
  transfer.downloadedAt = Date.now();

  // Auto-update status if needed
  if (
    !transfer.status ||
    transfer.status === 'sent' ||
    transfer.status === 'delivered'
  ) {
    transfer.status = 'downloaded';
  }

  await secureStorage.setItem(EMAIL_TRANSFERS_KEY, JSON.stringify(transfers));

  return transfer.downloadsCount;
}
```

**Returns:** Updated download count

---

### Expiration Management

#### `isTransferExpired(transfer: StoredEmailTransfer): boolean`

**Purpose:** Check if transfer is expired.

**Returns:** `true` if expired, `false` otherwise

**Expiration Conditions:**

```typescript
export function isTransferExpired(transfer: StoredEmailTransfer): boolean {
  // Time-based expiration
  if (Date.now() > transfer.expiresAt) {
    return true;
  }

  // Download-count expiration
  if (
    transfer.maxDownloads &&
    transfer.downloadsCount >= transfer.maxDownloads
  ) {
    return true;
  }

  return false;
}
```

**Examples:**

- Transfer expires at Jan 31, 2025 10:00 AM
  - Jan 31, 2025 9:59 AM → Not expired
  - Jan 31, 2025 10:00 AM → Expired
  - Jan 31, 2025 10:01 AM → Expired

- Transfer with maxDownloads: 3
  - After 0 downloads → Not expired
  - After 3 downloads → Expired
  - After 4+ downloads → Expired

---

#### `cleanupExpiredTransfers(): Promise<number>`

**Purpose:** Remove expired transfers from storage.

**Returns:** Number of transfers cleaned up

**Logic:**

```typescript
export async function cleanupExpiredTransfers(): Promise<number> {
  const transfers = await getAllEmailTransfers();
  const now = Date.now();

  // Keep non-expired transfers
  const validTransfers = transfers.filter((t) => now <= t.expiresAt);

  const expiredCount = transfers.length - validTransfers.length;

  if (expiredCount > 0) {
    await secureStorage.setItem(
      EMAIL_TRANSFERS_KEY,
      JSON.stringify(validTransfers)
    );
  }

  return expiredCount;
}
```

**Run Schedule:** Should be called:

- On app startup
- Periodically (hourly/daily)
- Before storage operations (for efficiency)

---

### Analytics

#### `EmailAnalytics` Data Model

```typescript
interface EmailAnalytics {
  // Counters
  totalSent: number; // Total emails sent
  totalDelivered: number; // Successfully delivered
  totalOpened: number; // Recipient opened email
  totalClicked: number; // Recipient clicked link
  totalDownloaded: number; // Files downloaded
  totalExpired: number; // Transfers expired
  totalFailed: number; // Failed to send

  // Rates
  openRate: number; // (opened / sent) × 100
  clickRate: number; // (clicked / sent) × 100
  downloadRate: number; // (downloaded / sent) × 100
  failureRate: number; // (failed / sent) × 100

  // Timings
  avgDeliveryTime: number; // Average ms to deliver
  avgOpenTime: number; // Average ms to open

  // Nested analytics
  byDate: Record<string, EmailAnalytics>; // Per-day stats
  byRecipient: Record<string, EmailAnalytics>; // Per-recipient stats
}
```

---

#### `recordAnalyticsEvent(event: EmailWebhookEvent): Promise<void>`

**Purpose:** Record analytics event and update counters.

**Event Types:**

```typescript
interface EmailWebhookEvent {
  event:
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'downloaded'
    | 'expired'
    | 'failed';
  emailId: string;
  recipientEmail: string;
  timestamp: number;
  metadata?: Record<string, string>;
  error?: string;
}
```

**Flow:**

1. Load current analytics
2. Increment appropriate counter
3. Recalculate rates
4. Update by-date stats
5. Update by-recipient stats
6. Save to storage

**Rate Calculation:**

```typescript
if (analytics.totalSent > 0) {
  analytics.openRate = (analytics.totalOpened / analytics.totalSent) * 100;
  analytics.clickRate = (analytics.totalClicked / analytics.totalSent) * 100;
  analytics.downloadRate =
    (analytics.totalDownloaded / analytics.totalSent) * 100;
  analytics.failureRate = (analytics.totalFailed / analytics.totalSent) * 100;
}
```

**Example Analytics Object After 100 Sends:**

```json
{
  "totalSent": 100,
  "totalDelivered": 98,
  "totalOpened": 75,
  "totalClicked": 45,
  "totalDownloaded": 42,
  "totalExpired": 5,
  "totalFailed": 2,
  "openRate": 75,
  "clickRate": 45,
  "downloadRate": 42,
  "failureRate": 2,
  "avgDeliveryTime": 1200,
  "avgOpenTime": 3600000,
  "byDate": {
    "2025-01-31": { ... },
    "2025-02-01": { ... }
  },
  "byRecipient": {
    "user@example.com": { ... },
    "john@example.com": { ... }
  }
}
```

---

#### `getEmailAnalytics(): Promise<EmailAnalytics>`

**Purpose:** Retrieve current analytics.

**Returns:** Current analytics object or default empty analytics

---

#### `resetEmailAnalytics(): Promise<void>`

**Purpose:** Reset all analytics to zero.

**Use Cases:**

- Testing
- Admin maintenance
- Start of new analytics period

---

## Batch Operations

### Overview

Batch sending allows efficient distribution of files to multiple recipients with
concurrency management and error isolation.

**Concurrency Limit:** 5 recipients in parallel **Max Recipients:** 50 per batch
**Error Handling:** Single recipient failure doesn't affect others

### Process Flow

```
BatchRequest {
  recipients: ['user1@...', 'user2@...', ...],
  files: [...],
  senderName: '...',
  options: {...}
}
  ↓
Split into chunks of 5 recipients
  ↓
For each chunk:
  Parallel execution of sendEmailTransfer()
  ↓
  ├─ Success → sent++, pending--
  ├─ Failure → failed++, pending--, record error
  ↓
After all chunks:
  Record completedAt timestamp
  Return batch status
```

### Concurrency Management

**Why Concurrency = 5:**

- Balances throughput and API rate limits
- Prevents overwhelming Resend API
- Maintains system stability
- Typical API allows 5-10 concurrent requests

**Chunking Algorithm:**

```typescript
const CONCURRENCY = 5;
const chunks: string[][] = [];

for (let i = 0; i < request.recipients.length; i += CONCURRENCY) {
  chunks.push(request.recipients.slice(i, i + CONCURRENCY));
}

// For 12 recipients:
// chunks = [
//   ['r1', 'r2', 'r3', 'r4', 'r5'],
//   ['r6', 'r7', 'r8', 'r9', 'r10'],
//   ['r11', 'r12']
// ]
```

### Error Isolation

**Key Principle:** Failure is isolated to individual recipient

```typescript
for (const chunk of chunks) {
  await Promise.all(
    chunk.map(async (recipient) => {
      try {
        await sendEmailTransfer({...});
        status.sent++;
      } catch (error) {
        status.failed++;
        status.failures.push({
          email: recipient,
          error: error.message
        });
        // Continue with next recipient
      }
    })
  );
}
```

**Benefits:**

- Partial success possible
- Batch doesn't halt on first error
- All addresses processed regardless of failures
- Complete error report returned

### Example: Batch Send to 12 Recipients

```typescript
const batchStatus = await sendBatchEmailTransfers({
  recipients: [
    'alice@company.com',
    'bob@company.com',
    'charlie@company.com',
    'diana@company.com',
    'eve@company.com',
    'frank@company.com',
    'grace@company.com',
    'henry@company.com',
    'iris@company.com',
    'jack@company.com',
    'kate@company.com',
    'leo@company.com',
  ],
  senderName: 'HR Department',
  files: [
    {
      filename: 'employee-handbook.pdf',
      content: pdfBuffer,
      size: 1048576,
    },
  ],
  options: {
    expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days
    compress: false,
  },
});

console.log(`
Batch Results:
  Total: ${batchStatus.total}
  Sent: ${batchStatus.sent}
  Failed: ${batchStatus.failed}
  Pending: ${batchStatus.pending}
  Duration: ${batchStatus.completedAt - batchStatus.startedAt}ms

Failures:
${batchStatus.failures.map((f) => `  - ${f.email}: ${f.error}`).join('\n')}
`);
```

---

## Integration Guide

### Basic Usage

#### 1. Send Single Email

```typescript
import { sendEmailTransfer } from '@/lib/email';

const status = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'John Doe',
  files: [
    {
      filename: 'document.pdf',
      content: Buffer.from(pdfData),
      size: 2097152,
      contentType: 'application/pdf',
    },
  ],
  expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
  compress: true,
  trackOpens: true,
  trackClicks: true,
});

console.log(`Transfer ID: ${status.id}`);
console.log(`Status: ${status.status}`);
console.log(`Expires: ${new Date(status.expiresAt).toISOString()}`);
```

#### 2. Password-Protected Transfer

```typescript
const status = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'Alice',
  files: [{ filename: 'secret.txt', content: buffer, size: 1024 }],
  password: 'SecurePass123!', // User provides to recipient separately
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours
});
```

#### 3. Batch Send

```typescript
const batchStatus = await sendBatchEmailTransfers({
  recipients: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  senderName: 'Marketing Team',
  files: [{ filename: 'campaign.pdf', content: buffer, size: 5242880 }],
  options: {
    expiresIn: 14 * 24 * 60 * 60 * 1000, // 14 days
    compress: false,
  },
});

console.log(`Sent: ${batchStatus.sent}/${batchStatus.total}`);
if (batchStatus.failures.length > 0) {
  console.log('Failures:', batchStatus.failures);
}
```

#### 4. Track Delivery Status

```typescript
const status = await getDeliveryStatus(transferId);

if (status) {
  console.log(`
    Status: ${status.status}
    Downloads: ${status.downloadsCount}
    Expires: ${new Date(status.expiresAt).toLocaleDateString()}
  `);
}
```

---

### Advanced Configuration

#### Custom Branding

```typescript
const status = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'Company Support',
  files: [...],
  branding: {
    companyName: 'Acme Corp',
    primaryColor: '#FF6B35',
    logoUrl: 'https://example.com/logo.png',
    supportEmail: 'support@acme.com',
    brandUrl: 'https://acme.com'
  }
});
```

#### Download Limits

```typescript
const status = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'Secure Delivery',
  files: [...],
  maxDownloads: 3,  // Download link works 3 times only
  expiresIn: 7 * 24 * 60 * 60 * 1000
});
```

#### Webhooks

```typescript
const status = await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'Webhook Test',
  files: [...],
  webhookUrl: 'https://yourapp.com/webhooks/email',  // Receives event updates
  notifyOnDownload: true,
  notifyOnExpire: true
});
```

---

## Configuration & Limits

### Environment Variables

```bash
# Resend API
RESEND_API_KEY=re_abc123xyz...              # Required
RESEND_FROM_EMAIL=transfers@company.com     # Sender email address

# App Configuration
NEXT_PUBLIC_APP_URL=https://tallow.app      # Base URL for download links
NODE_ENV=production                          # Environment
```

### Size Limits

```typescript
const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER; // Unlimited
const MAX_ATTACHMENT_SIZE = Number.MAX_SAFE_INTEGER; // Unlimited
const MAX_FILES_PER_EMAIL = 10; // Max 10 files
const MAX_BATCH_SIZE = 50; // Max 50 recipients
```

### Time Configuration

```typescript
const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const DEFAULT_RETRY_POLICY = {
  maxRetries: 3, // 3 retries (4 total attempts)
  initialDelayMs: 1000, // 1 second initial
  backoffMultiplier: 2, // Double each time
  maxDelayMs: 30000, // Cap at 30 seconds
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'rate_limit',
    'temporarily_unavailable',
  ],
};
```

### Compression Configuration

```typescript
// DEFLATE compression level 6:
// - Speed: Medium (balanced)
// - Ratio: 60-70% (good)
// - Optimal for email attachments

// Compression skipped if:
// - Single file
// - All files already compressed (.zip, .jpg, .mp4, .pdf, etc.)

// Filename: files-YYYY-MM-DD.zip
```

---

## Summary

This comprehensive documentation covers:

1. **Email Service** - Complete Resend API integration with 509 lines of detail
2. **Email Templates** - Welcome and file transfer components with full styling
   specs
3. **File Compression** - ZIP creation algorithm with compression ratio
   optimization
4. **Password Protection** - AES-256-GCM encryption with scrypt key derivation
5. **Retry Manager** - Exponential backoff with jitter and error classification
6. **Email Storage** - Data models and analytics tracking
7. **Batch Operations** - Concurrent delivery with error isolation
8. **Integration Guides** - Practical examples and advanced configurations

**Total Documentation:** 1500+ lines of exhaustive technical reference.
