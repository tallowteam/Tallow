# Email Fallback S3 Architecture

Visual architecture diagrams for the S3-based email fallback storage system.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────┐         ┌────────────┐      ┌─────────────┐   │
│  │  Transfer  │────────▶│   Email    │─────▶│  Download   │   │
│  │   Failed   │         │  Fallback  │      │    Page     │   │
│  └────────────┘         └────────────┘      └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │                      │
                                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Backend                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  /api/email/   │───▶│   Storage    │───▶│   /download/   │ │
│  │     send       │    │   Service    │    │      [id]      │ │
│  └────────────────┘    └──────────────┘    └────────────────┘ │
│                               │                                  │
│                               ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              S3 / localStorage Abstraction              │   │
│  │         (lib/storage/temp-file-storage.ts)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌──────────────────┐    ┌──────────────────┐
         │   AWS S3 Bucket  │    │  localStorage    │
         │   (Production)   │    │  (Development)   │
         └──────────────────┘    └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   Cron Cleanup   │
         │  (Hourly Task)   │
         └──────────────────┘
```

## Upload Flow

```
User Sends File via Email Fallback
           │
           ▼
┌──────────────────────────────┐
│   POST /api/email/send       │
│  - Validate file size        │
│  - Validate recipient        │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│    Encrypt File (PQC)        │
│  - ChaCha20-Poly1305         │
│  - Kyber KEM                 │
│  - 64KB chunks               │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   uploadTempFile()           │
│  - Generate file ID          │
│  - Generate download token   │
│  - Set expiration            │
└──────────────────────────────┘
           │
           ├──────────────────┬──────────────────┐
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │  S3 Upload  │   │  Metadata   │   │   Record    │
    │  (Primary)  │   │   Storage   │   │  Transfer   │
    └─────────────┘   └─────────────┘   └─────────────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Send Email     │
                    │  with Download   │
                    │      Link        │
                    └──────────────────┘
```

## Download Flow

```
User Clicks Download Link
           │
           ▼
┌──────────────────────────────┐
│   GET /download/[id]         │
│  - Load transfer metadata    │
│  - Display file info         │
└──────────────────────────────┘
           │
           ├─ Password Protected? ─┐
           │                        │
           ▼ No                     ▼ Yes
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ GET /api/email/download/[id] │ │ POST /api/email/download/[id]│
│  - Verify not expired        │ │  - Verify password           │
│  - Check download limit      │ │  - Verify not expired        │
└──────────────────────────────┘ └──────────────────────────────┘
           │                        │
           └────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │   downloadTempFile()         │
            │  - Verify download token     │
            │  - Check expiration          │
            │  - Increment download count  │
            └──────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │   Retrieve from S3           │
            │  - Download encrypted data   │
            │  - Return to client          │
            └──────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │   Client-Side Decrypt        │
            │  - Reconstruct chunks        │
            │  - Decrypt with key          │
            │  - Trigger browser download  │
            └──────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │   Post-Download Cleanup      │
            │  - Delete if max downloads   │
            │  - Update download count     │
            │  - Record analytics          │
            └──────────────────────────────┘
```

## Storage Layer Architecture

```
┌────────────────────────────────────────────────────────────────┐
│              temp-file-storage.ts (Abstraction)                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  uploadTempFile(file, key, options)                            │
│       │                                                         │
│       ├─ Encrypt file with PQC                                 │
│       ├─ Generate IDs and tokens                               │
│       ├─ Serialize to JSON + Base64                            │
│       │                                                         │
│       └─ Call uploadToS3() OR localStorage.setItem()           │
│                                                                 │
│  downloadTempFile(fileId, token)                               │
│       │                                                         │
│       ├─ Verify token (constant-time)                          │
│       ├─ Check expiration                                      │
│       ├─ Check download limits                                 │
│       │                                                         │
│       └─ Call downloadFromS3() OR localStorage.getItem()       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
                   ▼                       ▼
        ┌─────────────────┐    ┌─────────────────┐
        │   S3 Backend    │    │ localStorage    │
        └─────────────────┘    └─────────────────┘
```

## S3 Backend Operations

```
┌────────────────────────────────────────────────────────────────┐
│                      S3Client (AWS SDK)                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  uploadToS3(key, data, metadata)                               │
│    ├─ PutObjectCommand                                         │
│    ├─ ServerSideEncryption: AES256                            │
│    ├─ ContentType: application/octet-stream                    │
│    └─ Metadata: {fileId, token, expires, ...}                 │
│                                                                 │
│  downloadFromS3(key)                                           │
│    ├─ GetObjectCommand                                         │
│    ├─ Stream to Buffer                                         │
│    └─ Return {data, metadata}                                  │
│                                                                 │
│  deleteFromS3(key)                                             │
│    ├─ DeleteObjectCommand                                      │
│    └─ Confirm deletion                                         │
│                                                                 │
│  listS3Files(prefix)                                           │
│    ├─ ListObjectsV2Command                                     │
│    └─ Return [{key, lastModified}, ...]                        │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Configuration & Fallback Logic

```
┌────────────────────────────────────────────────────────────────┐
│              storage-config.ts (Validation)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  validateStorageConfig()                                       │
│       │                                                         │
│       ├─ Check environment variables                           │
│       │   ├─ AWS_ACCESS_KEY_ID?                               │
│       │   ├─ AWS_SECRET_ACCESS_KEY?                           │
│       │   ├─ AWS_S3_BUCKET?                                   │
│       │   └─ AWS_REGION?                                      │
│       │                                                         │
│       ├─ All present?                                          │
│       │   ├─ Yes → provider: 's3'                             │
│       │   └─ No  → provider: 'localStorage' + warnings        │
│       │                                                         │
│       └─ Production checks                                     │
│           ├─ NODE_ENV === 'production'?                       │
│           │   ├─ S3 required → error if not configured        │
│           │   └─ HTTPS required → warning if HTTP             │
│           └─ Return {provider, warnings, errors}              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Fallback Decision Tree

```
                    Upload/Download Request
                            │
                            ▼
                    Is Server-Side?
                    ┌───────┴───────┐
                    │               │
                  YES             NO
                    │               │
                    ▼               ▼
            S3 Configured?    localStorage
            ┌───────┴───────┐      (Client)
            │               │
          YES              NO
            │               │
            ▼               ▼
      Try S3 Upload   localStorage
            │            + Warning
            │
        Success?
        ┌───┴───┐
        │       │
      YES      NO
        │       │
        ▼       ▼
      Done  localStorage
             Fallback
              + Warning
```

## Cleanup & Expiration

```
┌────────────────────────────────────────────────────────────────┐
│                    Cron Job (Hourly)                           │
│                GET /api/cron/cleanup                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Authenticate (Bearer token / Vercel Cron header)           │
│                                                                 │
│  2. cleanupExpiredFilesS3()                                    │
│      ├─ List all files in temp-files/                         │
│      ├─ Check expiration timestamp                            │
│      ├─ Delete if expired                                     │
│      └─ Count deleted files                                   │
│                                                                 │
│  3. cleanupExpiredTransfers()                                  │
│      ├─ Get all transfer records                              │
│      ├─ Filter expired transfers                              │
│      ├─ Delete expired records                                │
│      └─ Count deleted records                                 │
│                                                                 │
│  4. Return statistics                                          │
│      └─ {filesDeleted, transfersDeleted, duration}            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │   Vercel Cron        │
                │  Schedule: 0 * * * * │
                │  (Every hour)        │
                └──────────────────────┘
```

## Data Flow - Complete Cycle

```
1. File Upload
   User → Email API → Encryption → S3 Upload → Email Sent
   [10MB file] → [Encrypted] → [S3: temp-files/123-abc] → [Email with link]

2. Storage
   S3: temp-files/123-abc
   Metadata:
   - file-id: 123-abc
   - download-token: xyz789...
   - expires-at: 1706360400000
   - max-downloads: 1
   - download-count: 0

3. Email Delivery
   Recipient receives:
   Subject: "John Doe shared files with you"
   Body: Download link → https://app.com/download/123-abc

4. Download Access
   User clicks link → /download/123-abc
   Page loads → GET /api/email/download/123-abc
   API verifies token → Downloads from S3
   Returns encrypted data → Client decrypts
   Browser downloads file

5. Post-Download
   download-count: 0 → 1
   max-downloads: 1 → Delete file
   S3: temp-files/123-abc [DELETED]
   Transfer status: completed

6. Backup Cleanup
   Cron job (hourly):
   - Finds any files with expires-at < now
   - Deletes from S3
   - Removes transfer records
```

## Security Layers

```
┌────────────────────────────────────────────────────────────────┐
│                     Security Architecture                       │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Transport                                            │
│    └─ HTTPS (TLS 1.3)                                         │
│                                                                 │
│  Layer 2: Application                                          │
│    ├─ Download token (32-byte secure random)                  │
│    ├─ Constant-time comparison                                │
│    └─ Expiration checks                                       │
│                                                                 │
│  Layer 3: File Encryption (PQC)                                │
│    ├─ ChaCha20-Poly1305 (symmetric)                           │
│    ├─ Kyber-768 (key exchange)                                │
│    └─ Per-chunk nonces                                        │
│                                                                 │
│  Layer 4: Password Protection (Optional)                       │
│    ├─ Argon2id (password hashing)                             │
│    └─ Additional encryption layer                              │
│                                                                 │
│  Layer 5: Storage Encryption                                   │
│    └─ S3 Server-Side Encryption (AES-256)                     │
│                                                                 │
│  Layer 6: Automatic Deletion                                   │
│    ├─ After max downloads                                     │
│    ├─ After expiration time                                   │
│    └─ Hourly cleanup cron                                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌────────────────────────────────────────────────────────────────┐
│                      Monitoring Points                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Application Logs (secureLog)                                  │
│    ├─ Upload events                                            │
│    ├─ Download events                                          │
│    ├─ Expiration events                                        │
│    ├─ Error events                                             │
│    └─ Configuration warnings                                   │
│                                                                 │
│  S3 Metrics (CloudWatch)                                       │
│    ├─ PutObject count                                          │
│    ├─ GetObject count                                          │
│    ├─ DeleteObject count                                       │
│    ├─ Storage bytes                                            │
│    └─ Request errors                                           │
│                                                                 │
│  Application Metrics                                           │
│    ├─ Upload success/failure rate                             │
│    ├─ Download success/failure rate                           │
│    ├─ Average file size                                        │
│    ├─ Storage utilization                                      │
│    └─ Cleanup job statistics                                   │
│                                                                 │
│  Analytics (email-storage)                                     │
│    ├─ Total sent                                               │
│    ├─ Total downloaded                                         │
│    ├─ Total expired                                            │
│    ├─ Open rate                                                │
│    └─ Download rate                                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Cost Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    AWS S3 Cost Breakdown                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Storage (S3 Standard)                                         │
│    $0.023 per GB/month                                         │
│    Example: 10GB avg = $0.23/month                            │
│                                                                 │
│  PUT Requests                                                   │
│    $0.005 per 1,000 requests                                   │
│    Example: 1,000 uploads = $0.005                            │
│                                                                 │
│  GET Requests                                                   │
│    $0.0004 per 1,000 requests                                  │
│    Example: 1,000 downloads = $0.0004                         │
│                                                                 │
│  DELETE Requests                                                │
│    FREE                                                         │
│                                                                 │
│  Data Transfer OUT                                              │
│    $0.09 per GB (to internet)                                  │
│    Example: 100GB = $9.00                                      │
│    Note: Most downloads are small, ~10GB = $0.90              │
│                                                                 │
│  Total Monthly (1000 transfers, 10MB avg)                      │
│    Storage: $0.23                                              │
│    PUT:     $0.005                                             │
│    GET:     $0.0004                                            │
│    Transfer: $0.90                                             │
│    ────────────────                                            │
│    TOTAL:   ~$1.14/month                                       │
│                                                                 │
│  With lifecycle rules & one-time downloads:                    │
│    Actual cost: $0.20-0.40/month                              │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Production Deployment                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Vercel (Frontend + API)                                       │
│    ├─ Next.js application                                      │
│    ├─ API routes (/api/*)                                     │
│    ├─ Download pages (/download/*)                            │
│    └─ Vercel Cron (hourly cleanup)                            │
│              │                                                  │
│              ▼                                                  │
│  AWS S3 (File Storage)                                         │
│    ├─ Bucket: tallow-temp-files                               │
│    ├─ Region: us-east-1                                        │
│    ├─ Encryption: AES-256                                      │
│    └─ Lifecycle: 30-day auto-delete                           │
│              │                                                  │
│              ▼                                                  │
│  AWS CloudWatch (Monitoring)                                   │
│    ├─ S3 metrics                                               │
│    ├─ API errors                                               │
│    └─ Alarms                                                   │
│                                                                 │
│  Resend (Email Delivery)                                       │
│    └─ Transactional emails with download links                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

This architecture provides a robust, secure, and cost-effective solution for email fallback file transfers with automatic expiration and cleanup.
