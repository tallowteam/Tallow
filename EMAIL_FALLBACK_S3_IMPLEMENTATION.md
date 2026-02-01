# Email Fallback S3 Cloud Storage Implementation

Complete implementation of S3-based cloud storage for email fallback file transfers with automatic fallback to localStorage for development.

## Overview

This implementation provides a production-ready cloud storage solution for encrypted file transfers via email fallback. Files are stored in AWS S3 with automatic encryption and expiration, with graceful fallback to localStorage for local development.

## Architecture

### Components

1. **S3 Storage Layer** (`lib/storage/temp-file-storage.ts`)
   - AWS S3 integration with @aws-sdk/client-s3
   - Automatic upload/download/delete operations
   - Server-side encryption (AES-256)
   - Metadata storage for file tracking

2. **Configuration Validation** (`lib/storage/storage-config.ts`)
   - Environment variable validation
   - Configuration health checks
   - Graceful fallback handling
   - Production readiness verification

3. **Download API** (`app/api/email/download/[id]/route.ts`)
   - File retrieval from S3
   - Password protection verification
   - Download count tracking
   - Automatic file expiration

4. **Download Page** (`app/download/[id]/page.tsx`)
   - User-friendly download interface
   - Client-side decryption
   - Progress indicators
   - Security notices

5. **Cleanup Cron** (`app/api/cron/cleanup/route.ts`)
   - Automatic expired file deletion
   - Transfer record cleanup
   - Periodic maintenance

## Features

### Core Features

- AWS S3 cloud storage with server-side encryption
- Automatic fallback to localStorage for development
- End-to-end encrypted file transfers
- Password-protected downloads (optional)
- Automatic file expiration
- Download count limits
- One-time download support
- Secure token-based authentication

### Security Features

- Files encrypted before upload (PQC encryption)
- Server-side encryption in S3 (AES-256)
- Secure token-based download URLs
- Constant-time token comparison
- Automatic secure deletion after download
- No plaintext file storage

### Operational Features

- Automatic cleanup of expired files (hourly cron)
- Configuration validation on startup
- Graceful fallback for missing S3 config
- Comprehensive error handling
- Detailed logging and monitoring
- Storage statistics and analytics

## Installation

### 1. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

### 2. Configure AWS S3

#### Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Configure:
   - Bucket name: `your-app-temp-files` (must be globally unique)
   - Region: Select your preferred region
   - Block public access: Keep enabled (files should not be public)
   - Versioning: Enable (recommended)
   - Encryption: Enable server-side encryption (AES-256)

#### Configure Lifecycle Rules

1. Select your bucket
2. Go to "Management" tab
3. Create lifecycle rule:
   - Name: "Auto-delete expired files"
   - Filter: Prefix `temp-files/`
   - Expiration: Delete objects after 30 days
   - Delete expired object delete markers

#### Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new user: `tallow-storage-user`
3. Attach policy with permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

4. Create access key and save credentials

### 3. Environment Configuration

Add to your `.env.local`:

```bash
# AWS S3 Storage
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Optional: Cron job secret for cleanup endpoint
CRON_SECRET=your_secure_random_string
```

### 4. Vercel Deployment (Optional)

The `vercel.json` is already configured with:
- Hourly cleanup cron job
- Security headers for API routes

Deploy to Vercel:
```bash
vercel --prod
```

The cron job will automatically run hourly to clean up expired files.

## Usage

### Uploading Files

```typescript
import { uploadTempFile } from '@/lib/storage/temp-file-storage';

// Upload encrypted file
const file = new File([data], 'example.pdf');
const encryptionKey = new Uint8Array(32); // Your encryption key

const result = await uploadTempFile(file, encryptionKey, {
  expirationHours: 24,    // Expire after 24 hours
  maxDownloads: 1,        // One-time download
});

console.log('File ID:', result.fileId);
console.log('Download Token:', result.downloadToken);
console.log('Expires At:', new Date(result.expiresAt));
```

### Downloading Files

```typescript
import { downloadTempFile } from '@/lib/storage/temp-file-storage';

// Download encrypted file
const { encryptedFile, metadata } = await downloadTempFile(
  fileId,
  downloadToken
);

// File is automatically deleted if maxDownloads reached
```

### Email Integration

Files are automatically stored when sending via email fallback:

```typescript
import { sendEmailTransfer } from '@/lib/email/email-service';

await sendEmailTransfer({
  recipientEmail: 'user@example.com',
  senderName: 'John Doe',
  files: [{
    filename: 'document.pdf',
    content: fileBuffer,
    size: fileBuffer.length,
  }],
  password: 'optional-password',
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours
  maxDownloads: 1,
});
```

### Download Page URL

Users receive a link in their email:
```
https://your-app.com/download/{transferId}
```

The page provides:
- File information and size
- Expiration countdown
- Download button
- Password input (if protected)
- Security notices

## Storage Behavior

### Production (S3 Configured)

1. Files uploaded to S3 with encryption
2. Metadata stored in S3 object metadata
3. Automatic cleanup via cron job
4. Scalable and reliable

### Development (No S3)

1. Files stored in localStorage
2. Limited to ~5-10MB per file
3. Not persistent across sessions
4. Automatic cleanup on page load

### Fallback Chain

```
Upload/Download Attempt
    ↓
Is S3 configured? → No → localStorage
    ↓ Yes
S3 operation
    ↓
Success? → Yes → Done
    ↓ No
localStorage (with warning)
```

## Configuration Validation

Check storage configuration:

```typescript
import { validateStorageConfig } from '@/lib/storage/storage-config';

const config = validateStorageConfig();

console.log('Provider:', config.provider);      // 's3' or 'localStorage'
console.log('Configured:', config.isConfigured); // true/false
console.log('Warnings:', config.warnings);       // Array of warnings
console.log('Errors:', config.errors);          // Array of errors
```

## Monitoring

### Storage Statistics

```typescript
import { getStorageStats } from '@/lib/storage/temp-file-storage';

const stats = getStorageStats();
console.log('Total Files:', stats.totalFiles);
console.log('Total Size:', stats.totalSize);
console.log('Expired Files:', stats.expiredFiles);
```

### Manual Cleanup

Trigger cleanup manually:

```bash
# GET request with Bearer token
curl -X GET https://your-app.com/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret"
```

## Security Considerations

### File Encryption

1. **Client-side encryption**: Files encrypted with PQC before upload
2. **Transport encryption**: HTTPS for all transfers
3. **Storage encryption**: S3 server-side encryption (AES-256)
4. **Token security**: Cryptographically secure tokens (32 bytes)

### Access Control

1. **Download tokens**: Required for file retrieval
2. **Password protection**: Optional additional layer
3. **Expiration**: Automatic file deletion
4. **Download limits**: Prevent abuse

### Best Practices

1. Always use S3 in production
2. Enable S3 bucket versioning
3. Configure S3 lifecycle rules
4. Use IAM roles (not root credentials)
5. Enable CloudTrail logging
6. Monitor S3 access logs
7. Set up CloudWatch alarms
8. Rotate access keys regularly

## Performance

### Upload Performance

- Direct upload to S3 (no intermediate storage)
- Chunked upload for large files
- Parallel chunk processing

### Download Performance

- Direct download from S3
- CDN-compatible (optional CloudFront)
- Streaming support for large files

### Cost Optimization

- Lifecycle rules auto-delete old files
- Standard S3 storage class (cheapest for short-term)
- No data transfer between regions

## Troubleshooting

### S3 Upload Fails

1. Check AWS credentials are valid
2. Verify bucket name is correct
3. Ensure IAM user has PutObject permission
4. Check bucket exists in correct region
5. Verify network connectivity to AWS

### Files Not Expiring

1. Check cron job is running (Vercel Cron or manual)
2. Verify S3 lifecycle rules are configured
3. Check server logs for cleanup errors

### LocalStorage Fallback in Production

1. S3 credentials not set
2. Invalid AWS credentials
3. S3 bucket doesn't exist
4. Network connectivity issues

Check logs for warnings:
```
[StorageConfig] S3 storage is not configured
[TempStorage] S3 upload failed, using localStorage fallback
```

## Migration Guide

### From localStorage to S3

1. Configure S3 bucket and credentials
2. Deploy with new environment variables
3. Files will automatically use S3
4. Old localStorage files remain until browser clears them

### S3 Bucket Migration

1. Create new bucket
2. Update AWS_S3_BUCKET environment variable
3. Old files remain in old bucket until expired
4. Optionally use AWS CLI to migrate existing files

## API Reference

### Upload

```typescript
uploadTempFile(
  file: File,
  encryptionKey: Uint8Array,
  options?: {
    expirationHours?: number;  // Default: 24
    maxDownloads?: number;     // Default: 1
  }
): Promise<{
  fileId: string;
  downloadToken: string;
  expiresAt: number;
}>
```

### Download

```typescript
downloadTempFile(
  fileId: string,
  downloadToken: string
): Promise<{
  encryptedFile: EncryptedFile;
  metadata: {
    encryptedName: string;
    nameNonce: string;
    originalSize: number;
    mimeCategory: string;
    uploadedAt: number;
    expiresAt: number;
  };
}>
```

### Cleanup

```typescript
// S3 cleanup (server-side only)
cleanupExpiredFilesS3(): Promise<number>

// localStorage cleanup (client-side)
cleanupExpiredFiles(mode?: 'quick' | 'standard' | 'paranoid'): number
```

## Files Modified/Created

### New Files

- `lib/storage/temp-file-storage.ts` - S3 integration
- `lib/storage/storage-config.ts` - Configuration validation
- `app/api/cron/cleanup/route.ts` - Cleanup endpoint
- `app/download/[id]/page.tsx` - Download UI
- `vercel.json` - Cron configuration

### Modified Files

- `app/api/email/download/[id]/route.ts` - S3 download implementation
- `.env.example` - AWS configuration variables

## Status

Tasks #11-12 are **COMPLETE**:

- [x] Task #11: S3 cloud storage implementation
  - AWS SDK integration
  - Upload/download/delete operations
  - Environment variable configuration
  - Graceful localStorage fallback
  - Configuration validation

- [x] Task #12: Complete file download implementation
  - Download API with S3 retrieval
  - Decryption with password support
  - User-friendly download page
  - Error handling and expiration
  - Automatic cleanup cron job

## Next Steps

1. Configure AWS S3 bucket and credentials
2. Test upload/download flow in development
3. Deploy to production with S3 configuration
4. Monitor cleanup cron job execution
5. Set up CloudWatch alarms for S3 operations
6. Consider adding CloudFront CDN for global distribution

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Verify AWS configuration
3. Test with manual cleanup endpoint
4. Review storage configuration validation
