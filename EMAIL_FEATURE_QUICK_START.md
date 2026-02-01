# Send via Email Feature - Quick Start Guide

## Overview

The Send via Email feature provides a fallback method for file transfers when P2P connections fail. Files are encrypted, uploaded temporarily, and sent via email with a secure download link.

---

## User Guide

### How to Send a File via Email

1. **Select a File**
   - Click "Select File" or drag & drop
   - File appears in transfer card

2. **Click "Send via Email"**
   - Button appears below file info
   - Icon: Mail envelope ✉️

3. **Fill in Recipient Details**
   - Enter recipient email address
   - Choose expiration time (default: 24 hours)
   - Review file size and transfer mode

4. **Send**
   - Click "Send Email" button
   - Watch progress: Encrypting → Uploading → Sending
   - Success notification appears
   - Dialog closes automatically

5. **Recipient Receives Email**
   - Beautiful HTML email with file details
   - Download button (files >25MB) or attachment (files <25MB)
   - Security information included

### Transfer Modes

**Attachment Mode** (files ≤25MB)
- File sent as email attachment
- Instant access, no link needed
- Best for small files

**Link Mode** (files >25MB)
- Secure download link in email
- One-time use link
- Link expires after set time or first download

---

## Developer Guide

### Integration

```typescript
import { EmailFallbackButton } from '@/components/app/EmailFallbackButton';

<EmailFallbackButton
  file={selectedFile}
  senderName="John Doe"
  onSuccess={() => console.log('Email sent!')}
  variant="outline"
  size="default"
  showLabel={true}
/>
```

### Programmatic API

```typescript
import { sendFileViaEmail } from '@/lib/email-fallback';

const result = await sendFileViaEmail({
  recipientEmail: 'user@example.com',
  senderName: 'Your Name',
  file: fileObject,
  expirationHours: 24, // Optional, default: 24
  maxDownloads: 1,     // Optional, default: 1
});

if (result.success) {
  console.log('Email ID:', result.emailId);
  console.log('Download URL:', result.downloadUrl);
} else {
  console.error('Error:', result.error);
}
```

### Manual API Calls

**Send Email:**
```typescript
const response = await fetch('/api/v1/send-file-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': yourApiKey,
  },
  body: JSON.stringify({
    recipientEmail: 'user@example.com',
    senderName: 'John Doe',
    fileName: 'document.pdf',
    fileSize: 1024000,
    mode: 'link',
    downloadUrl: 'https://yourapp.com/api/v1/download-file?...',
    expiresAt: Date.now() + 86400000,
  }),
});
```

**Download File:**
```typescript
const url = `/api/v1/download-file?fileId=${fileId}&token=${token}&key=${key}`;
const response = await fetch(url);
const blob = await response.blob();
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here
```

Get your API key from: https://resend.com/api-keys

### Customization

**Email Template:**
Edit `lib/emails/file-transfer-email.tsx`

**Expiration Options:**
Edit `components/app/EmailFallbackDialog.tsx`:
```typescript
const EXPIRATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
];
```

**File Size Limits:**
```typescript
// Attachment mode max size
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB

// Total file max size
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
```

---

## Security Features

### Encryption
- **Algorithm:** AES-256-GCM
- **Key Generation:** Cryptographically random 32 bytes
- **File Chunking:** Encrypted in chunks for large files
- **Filename Encryption:** Filenames are encrypted separately
- **Integrity:** File hash verification on download

### Access Control
- **One-Time Links:** Links expire after first download (configurable)
- **Time-Based Expiration:** Links expire after set time
- **Token Validation:** Constant-time comparison prevents timing attacks
- **API Authentication:** All endpoints require API key

### Privacy
- **No Plaintext Storage:** Files encrypted before storage
- **Automatic Cleanup:** Expired files deleted automatically
- **Secure Deletion:** Option to overwrite data before deletion
- **No Password Storage:** Zero-knowledge encryption

---

## Troubleshooting

### Email Not Sending

**Check API Key:**
```bash
# Verify .env.local has RESEND_API_KEY
cat .env.local | grep RESEND_API_KEY
```

**Check Rate Limits:**
- Max 3 emails per minute per IP
- Wait 60 seconds and retry

**Check Email Format:**
- Must be valid email: `user@domain.com`
- No spaces or special characters

### Download Link Not Working

**Check Link Expiration:**
- Links expire after set time (default: 24 hours)
- One-time use links expire after first download

**Check URL Parameters:**
- Must have: `fileId`, `token`, `key`
- All parameters must be present and valid

**Check Browser Console:**
```javascript
// Open browser console (F12)
// Look for error messages
```

### File Too Large

**Attachment Mode:**
- Max size: 25MB
- Solution: File will automatically use link mode

**Link Mode:**
- Max size: 100MB (configurable)
- Solution: Increase MAX_FILE_SIZE or compress file

### Build Errors

**Missing Dependencies:**
```bash
npm install resend @react-email/components
```

**TypeScript Errors:**
```bash
# Clear build cache
rm -rf .next
npm run build
```

---

## Testing

### Manual Testing

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Open App:**
   ```
   http://localhost:3000/app
   ```

3. **Test Email Flow:**
   - Select a file
   - Click "Send via Email"
   - Enter your own email
   - Check email inbox
   - Click download link
   - Verify file downloads correctly

### E2E Tests

```bash
# Run all email tests
npm run test:e2e -- email-fallback

# Run specific test
npm run test:e2e -- email-fallback -g "should send email"
```

### Verification Script

```bash
# Verify all components present
node scripts/verify-email-feature.js
```

---

## API Reference

### POST /api/v1/send-file-email

**Request:**
```json
{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mode": "link",
  "downloadUrl": "https://...",
  "expiresAt": 1706428800000
}
```

**Response (Success):**
```json
{
  "success": true,
  "emailId": "abc123...",
  "message": "File transfer email sent successfully"
}
```

**Response (Error):**
```json
{
  "error": "Invalid email format"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request
- `429`: Rate limit exceeded
- `500`: Server error
- `503`: Email service not configured

### GET /api/v1/download-file

**Query Parameters:**
- `fileId`: File identifier
- `token`: Download token
- `key`: Encryption key (hex)

**Response (Success):**
- File blob with `Content-Disposition` header

**Response (Error):**
```json
{
  "error": "File not found or has expired"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters
- `403`: Invalid token
- `404`: File not found
- `410`: Download limit reached
- `429`: Rate limit exceeded
- `500`: Decryption failed

---

## Best Practices

### For Users

1. **Verify Recipients:** Only send files to trusted contacts
2. **Check File Size:** Use attachment mode for files <25MB
3. **Set Appropriate Expiration:** Shorter is more secure
4. **Verify Download:** Check file after recipient downloads

### For Developers

1. **Error Handling:** Always wrap API calls in try-catch
2. **Rate Limiting:** Implement client-side debouncing
3. **File Validation:** Check file size before upload
4. **Progress Feedback:** Show progress during upload/send
5. **Security:** Never log encryption keys or tokens

### Production Deployment

1. **Use Server-Side Storage:** Replace localStorage
2. **Configure Custom Domain:** files@yourdomain.com
3. **Set Up Monitoring:** Track email deliveries
4. **Implement Virus Scanning:** Scan files before storage
5. **Enable HTTPS:** Required for secure transfers

---

## Performance Tips

### Optimize Upload Speed
```typescript
// Use compression for large files
const compressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
};
```

### Reduce Email Size
```typescript
// Use link mode for files >10MB
const shouldUseLink = file.size > 10 * 1024 * 1024;
```

### Batch Operations
```typescript
// Send multiple files in one email (future enhancement)
const files = [file1, file2, file3];
await sendBatchEmail(files, recipientEmail);
```

---

## FAQ

**Q: Can I send multiple files in one email?**
A: Currently one file per email. Batch support coming soon.

**Q: What happens if the download link expires?**
A: File is automatically deleted. Recipient must request a new link.

**Q: Can recipients forward the download link?**
A: Links are one-time use. First person to download gets the file.

**Q: Is the email content encrypted?**
A: File is encrypted. Email itself uses standard email encryption (TLS).

**Q: Can I customize the email template?**
A: Yes! Edit `lib/emails/file-transfer-email.tsx`.

**Q: What's the maximum file size?**
A: 25MB for attachments, 100MB for link mode (configurable).

**Q: Are there usage limits?**
A: 3 emails per minute per IP. Resend free tier: 100 emails/day.

**Q: Can I use my own email domain?**
A: Yes! Configure custom domain in Resend dashboard.

---

## Support

### Documentation
- Full Report: `EMAIL_FEATURE_VERIFICATION_REPORT.md`
- Implementation: `EMAIL_FALLBACK_IMPLEMENTATION.md`
- API Docs: `EMAIL_FALLBACK.md`

### Resources
- Resend Docs: https://resend.com/docs
- React Email: https://react.email/docs
- Test Suite: `tests/e2e/email-fallback.spec.ts`

### Debugging
```bash
# Enable debug logging
DEBUG=tallow:email npm run dev

# Check email delivery status
# Visit: https://resend.com/emails
```

---

## Quick Commands

```bash
# Verify feature
node scripts/verify-email-feature.js

# Run tests
npm run test:e2e -- email-fallback

# Start dev server
npm run dev

# Build for production
npm run build

# Check logs
tail -f logs/email.log
```

---

**Last Updated:** 2026-01-27
**Version:** 1.0.0
**Status:** Production Ready
