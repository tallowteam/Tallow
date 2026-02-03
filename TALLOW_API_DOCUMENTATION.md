# Tallow API Documentation

Comprehensive OpenAPI-style documentation for all 24 REST endpoints in the
Tallow secure file transfer application.

**Last Updated:** February 2026 **API Version:** v1 **Base URLs:**

- Production: `https://tallow.app/api`
- Development: `http://localhost:3000/api`

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Core Endpoints](#core-endpoints)
5. [Health & Monitoring](#health--monitoring)
6. [Email Services](#email-services)
7. [Room Management](#room-management)
8. [Payment Integration](#payment-integration)
9. [Cron Jobs](#cron-jobs)

---

## Authentication & Security

### CSRF Protection

All state-changing operations (POST, PUT, DELETE) require CSRF token protection.

**Token Endpoint:**

```
GET /api/csrf-token
```

**Token Flow:**

1. Client calls `/api/csrf-token` on app initialization
2. Server generates token and sets it in an HTTP-only cookie
3. Client includes token in `X-CSRF-Token` header for all POST/PUT/DELETE
   requests
4. Server validates token before processing request

### API Key Authentication

Certain endpoints require API key authentication via the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

**Endpoints Requiring API Key:**

- POST /api/send-welcome
- POST /api/send-share-email
- POST /api/v1/send-welcome
- POST /api/v1/send-share-email
- POST /api/v1/send-file-email

**Environment Variable:** `API_KEY`

### Webhook Signature Verification

Webhook endpoints verify request signatures using HMAC-SHA256.

**Email Webhook (Resend):**

- Header: `resend-signature`
- Secret Env: `RESEND_WEBHOOK_SECRET`

**Stripe Webhook:**

- Header: `stripe-signature`
- Secret Env: `STRIPE_WEBHOOK_SECRET`

---

## Rate Limiting

Rate limits are enforced per IP address with sliding window algorithm.

### Rate Limit Configuration

| Endpoint Category        | Limit      | Window | Status Code |
| ------------------------ | ---------- | ------ | ----------- |
| Download File            | 10 req/min | 60s    | 429         |
| CSRF Token               | 30 req/min | 60s    | 429         |
| Strict (Email, Checkout) | 3 req/min  | 60s    | 429         |
| Moderate                 | 5 req/min  | 60s    | 429         |
| Generous (Status Check)  | 10 req/min | 60s    | 429         |
| Room GET                 | 60 req/min | 60s    | 429         |
| Room POST                | 10 req/min | 60s    | 429         |
| Room DELETE              | 30 req/min | 60s    | 429         |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1707000000
```

---

## Error Handling

All error responses follow a consistent format:

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2026-02-03T10:30:00.000Z"
}
```

### HTTP Status Codes

| Status | Meaning               | Use Case                                       |
| ------ | --------------------- | ---------------------------------------------- |
| 200    | OK                    | Successful request                             |
| 201    | Created               | Resource created successfully                  |
| 400    | Bad Request           | Invalid input parameters                       |
| 401    | Unauthorized          | Missing/invalid authentication                 |
| 403    | Forbidden             | CSRF token invalid or insufficient permissions |
| 404    | Not Found             | Resource doesn't exist                         |
| 410    | Gone                  | Resource has expired                           |
| 429    | Too Many Requests     | Rate limit exceeded                            |
| 500    | Internal Server Error | Server-side error                              |
| 503    | Service Unavailable   | Dependency unavailable                         |

### Common Error Responses

**Invalid CSRF Token (403):**

```json
{
  "error": "Invalid CSRF token",
  "status": 403
}
```

**Rate Limit Exceeded (429):**

```json
{
  "error": "Too many requests. Please try again later.",
  "status": 429
}
```

**Invalid Input (400):**

```json
{
  "error": "Invalid email format",
  "status": 400
}
```

---

## Core Endpoints

### 1. GET /api/csrf-token

**Purpose:** Generate and retrieve CSRF token for client-side state-changing
operations

**Authentication:** None required

**Rate Limit:** 30 requests/minute

**Request:**

```http
GET /api/csrf-token HTTP/1.1
Host: api.tallow.app
Origin: https://tallow.app
```

**Query Parameters:** None

**Request Body:** None

**Response:** 200 OK

```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "message": "CSRF token generated"
}
```

**Response Headers:**

```
Set-Cookie: CSRF-TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6; HttpOnly; Secure; SameSite=Strict; Path=/
Content-Type: application/json
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**Error Responses:**

- 429: Rate limit exceeded
- 500: Internal server error

**Security:**

- Token is 32-byte hex string (256 bits)
- Set in HttpOnly cookie to prevent JavaScript access
- Requires Origin header match for CORS

**Example:**

```bash
curl -X GET https://api.tallow.app/api/csrf-token \
  -H "Origin: https://tallow.app" \
  -H "Content-Type: application/json"
```

---

### 2. POST /api/v1/download-file

**Purpose:** Securely download encrypted file with server-side decryption
validation

**Authentication:** None required

**Rate Limit:** 10 requests/minute

**Method:** POST (recommended) or GET (deprecated)

**Security:**

- Encryption key passed in request body (not URL)
- Key never logged or stored on server
- File decrypted in memory
- Rate limiting prevents brute-force key guessing
- Sanitized filename prevents header injection

**Request Headers:**

```
Content-Type: application/json
Origin: https://tallow.app (for CORS)
```

**Request Body (JSON):**

```json
{
  "fileId": "1707000000000-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "token": "64_char_hex_token_string_256_bit_download_token_verification",
  "key": "64_char_hex_encryption_key_string_256_bit_aes_key"
}
```

**Parameter Validation:**

| Field  | Type   | Format | Required | Validation                             |
| ------ | ------ | ------ | -------- | -------------------------------------- |
| fileId | string | UUID   | Yes      | Format: `[0-9]+-[a-f0-9]{32}`          |
| token  | string | hex    | Yes      | Format: `^[a-f0-9]{64}$` (256-bit)     |
| key    | string | hex    | Yes      | Format: `^[a-f0-9]{64}$` (256-bit AES) |

**Response:** 200 OK

```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"; filename*=UTF-8''document.pdf
Content-Length: 1024000
Cache-Control: no-store, no-cache, must-revalidate, private
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'

[Binary file data streamed to client]
```

**Error Responses:**

| Status | Error                         | Cause                              |
| ------ | ----------------------------- | ---------------------------------- |
| 400    | Invalid encryption key format | Key not 64 hex characters          |
| 400    | Invalid token format          | Token not 64 hex characters        |
| 400    | Invalid file ID format        | FileID doesn't match pattern       |
| 404    | File not found or has expired | File doesn't exist or TTL exceeded |
| 403    | Invalid download token        | Token invalid/revoked              |
| 410    | Download link already used    | Max download limit reached         |
| 500    | File verification failed      | Hash mismatch/corrupted data       |
| 500    | Unable to decrypt file        | Decryption failed (wrong key)      |

**Implementation Details:**

1. **Validation Phase:**
   - Validate fileId format (prevent path traversal)
   - Validate token format (256-bit verification)
   - Validate key format (256-bit encryption key)

2. **File Retrieval:**
   - Fetch encrypted file from S3 storage using fileId
   - Verify download token against token database
   - Check download count against max downloads limit

3. **Decryption Phase:**
   - Convert hex key to Uint8Array
   - Decrypt file in memory using AES-256-GCM
   - Decrypt filename separately
   - Verify file hash for integrity

4. **Response Generation:**
   - Sanitize filename (prevent header injection)
   - Set security headers (no caching, CSP, X-Content-Type-Options)
   - Stream decrypted blob to client
   - Key is garbage collected after use

5. **Logging:**
   - Log file ID only (no key or filename)
   - Track download for analytics

**Example:**

```bash
curl -X POST https://api.tallow.app/api/v1/download-file \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "1707000000000-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "token": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "key": "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"
  }' \
  --output downloaded_file.pdf
```

---

### 3. GET /api/v1/download-file (DEPRECATED)

**Status:** DEPRECATED - Use POST method instead

**Warning:** Key exposed in URL appears in server logs, browser history,
referrer headers

**Query Parameters:**

```
fileId: string (required) - File ID
token: string (required) - Download token
key: string (required) - Encryption key (INSECURE in URL)
```

**Security Issues:**

- Key appears in server access logs
- Key appears in browser history
- Key sent in Referrer header
- Key may be cached in proxies

**Example (DO NOT USE):**

```
GET /api/v1/download-file?fileId=1707000000000-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6&token=0123...&key=fedcba...
```

---

## Email Services

### 4. POST /api/email/send

**Purpose:** Send single encrypted file transfer via email

**Authentication:** CSRF token required

**Rate Limit:** 3 requests/minute (strict)

**Request Headers:**

```
Content-Type: application/json
X-CSRF-Token: token_from_/api/csrf-token
Origin: https://tallow.app
```

**Request Body:**

```json
{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe",
  "senderEmail": "sender@example.com",
  "files": [
    {
      "filename": "document.pdf",
      "content": "base64_encoded_file_content",
      "size": 102400,
      "contentType": "application/pdf",
      "checksum": "sha256_hash_hex"
    }
  ],
  "compress": true,
  "password": "optional_password",
  "virusScan": false,
  "expiresIn": 86400,
  "maxDownloads": 5,
  "notifyOnDownload": true,
  "notifyOnExpire": false,
  "webhookUrl": "https://example.com/webhook",
  "priority": "normal",
  "retryOnFailure": true,
  "maxRetries": 3,
  "trackOpens": true,
  "trackClicks": true,
  "metadata": {
    "campaignId": "camp123",
    "customField": "customValue"
  }
}
```

**Parameter Validation:**

| Field          | Type    | Required | Validation                       |
| -------------- | ------- | -------- | -------------------------------- |
| recipientEmail | string  | Yes      | RFC 5322 compliant email         |
| senderName     | string  | Yes      | 1-100 characters                 |
| senderEmail    | string  | No       | RFC 5322 compliant               |
| files          | array   | Yes      | At least 1 file, max 50 MB total |
| compress       | boolean | No       | Default: true                    |
| password       | string  | No       | 4-128 characters                 |
| expiresIn      | number  | No       | Seconds until expiration         |
| maxDownloads   | number  | No       | Max download count (1-10)        |
| priority       | string  | No       | 'normal' or 'high'               |
| trackOpens     | boolean | No       | Default: true                    |
| trackClicks    | boolean | No       | Default: true                    |

**Response:** 200 OK

```json
{
  "success": true,
  "transfer": {
    "id": "transfer_uuid_string",
    "recipientEmail": "user@example.com",
    "status": "sent",
    "expiresAt": "2026-02-04T10:30:00.000Z",
    "createdAt": "2026-02-03T10:30:00.000Z",
    "maxDownloads": 5,
    "downloads": 0
  }
}
```

**Error Responses:**

| Status | Error                         | Cause                        |
| ------ | ----------------------------- | ---------------------------- |
| 400    | recipientEmail is required    | Missing email                |
| 400    | senderName is required        | Missing sender name          |
| 400    | Invalid email format          | Email not RFC 5322 compliant |
| 400    | At least one file is required | Empty files array            |
| 403    | Invalid CSRF token            | CSRF validation failed       |
| 429    | Too many requests             | Rate limit exceeded          |
| 500    | Failed to send email transfer | Internal error               |

**Database Interactions:**

1. Insert transfer record with UUID
2. Store encrypted files in S3
3. Generate download token
4. Send email via Resend API
5. Track in analytics database

**External Service Calls:**

- Resend API: Send email
- AWS S3: Store encrypted files
- Optional: Webhook to custom URL

**Example:**

```bash
curl -X POST https://api.tallow.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: token_from_csrf_endpoint" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "John Doe",
    "files": [
      {
        "filename": "document.pdf",
        "content": "JVBERi0xLjQK...",
        "size": 102400,
        "contentType": "application/pdf",
        "checksum": "abc123def456..."
      }
    ],
    "expiresIn": 86400,
    "maxDownloads": 5
  }'
```

---

### 5. POST /api/email/batch

**Purpose:** Send encrypted files to multiple recipients in batch

**Authentication:** CSRF token required

**Rate Limit:** 3 requests/minute (strict)

**Request Body:**

```json
{
  "batchId": "batch_uuid",
  "recipients": ["user1@example.com", "user2@example.com"],
  "senderName": "John Doe",
  "senderEmail": "sender@example.com",
  "files": [
    {
      "filename": "document.pdf",
      "content": "base64_content",
      "size": 102400,
      "contentType": "application/pdf",
      "checksum": "sha256_hash"
    }
  ],
  "compress": true,
  "password": "optional",
  "options": {
    "expiresIn": 86400,
    "maxDownloads": 5,
    "notifyOnDownload": true,
    "trackOpens": true,
    "trackClicks": true
  }
}
```

**Parameter Validation:**

| Field      | Type   | Required | Validation            |
| ---------- | ------ | -------- | --------------------- |
| recipients | array  | Yes      | Min 1, Max 100 emails |
| senderName | string | Yes      | 1-100 characters      |
| files      | array  | Yes      | At least 1 file       |

**Batch Size Limits:**

- Max recipients: 100
- Max total file size: 500 MB
- Max files per transfer: 50

**Response:** 200 OK

```json
{
  "success": true,
  "batch": {
    "batchId": "batch_uuid",
    "sent": 2,
    "failed": 0,
    "total": 2,
    "results": [
      {
        "email": "user1@example.com",
        "transferId": "transfer_uuid_1",
        "status": "sent"
      },
      {
        "email": "user2@example.com",
        "transferId": "transfer_uuid_2",
        "status": "sent"
      }
    ]
  }
}
```

**Error Responses:**

| Status | Error                                |
| ------ | ------------------------------------ |
| 400    | recipients array is required         |
| 400    | Maximum 100 recipients per batch     |
| 400    | Invalid email format: user@invalid   |
| 403    | Invalid CSRF token                   |
| 429    | Too many requests                    |
| 500    | Failed to send batch email transfers |

**Processing Logic:**

1. Validate all recipients before sending any
2. Create transfer record for each recipient
3. Send emails in parallel (with concurrency limit)
4. Return results including failures
5. Retry failed sends (optional)

**Example:**

```bash
curl -X POST https://api.tallow.app/api/email/batch \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: csrf_token" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "senderName": "John Doe",
    "files": [{"filename": "doc.pdf", "content": "...", "size": 100000}]
  }'
```

---

### 6. GET /api/email/status/[id]

**Purpose:** Check delivery and download status of email transfer

**Authentication:** None required

**Rate Limit:** 10 requests/minute (generous)

**Path Parameters:**

```
id: string (required) - Transfer ID
```

**Request:**

```http
GET /api/email/status/transfer_uuid_12345 HTTP/1.1
Host: api.tallow.app
```

**Response:** 200 OK

```json
{
  "success": true,
  "status": {
    "id": "transfer_uuid_12345",
    "recipientEmail": "user@example.com",
    "senderName": "John Doe",
    "status": "delivered",
    "sentAt": "2026-02-03T10:30:00.000Z",
    "deliveredAt": "2026-02-03T10:30:15.000Z",
    "openedAt": "2026-02-03T10:35:00.000Z",
    "clickedAt": null,
    "expiresAt": "2026-02-04T10:30:00.000Z",
    "downloads": 2,
    "maxDownloads": 5,
    "isExpired": false,
    "events": [
      {
        "event": "sent",
        "timestamp": "2026-02-03T10:30:00.000Z"
      },
      {
        "event": "delivered",
        "timestamp": "2026-02-03T10:30:15.000Z"
      },
      {
        "event": "opened",
        "timestamp": "2026-02-03T10:35:00.000Z"
      },
      {
        "event": "downloaded",
        "timestamp": "2026-02-03T10:36:00.000Z"
      }
    ]
  }
}
```

**Status Values:**

- `pending` - Email queued for sending
- `sent` - Email sent successfully
- `delivered` - Email delivered to recipient
- `failed` - Email delivery failed
- `expired` - Transfer link has expired
- `completed` - All downloads completed

**Error Responses:**

| Status | Error                         |
| ------ | ----------------------------- |
| 400    | Transfer ID is required       |
| 404    | Transfer not found            |
| 429    | Too many requests             |
| 500    | Failed to get delivery status |

**Example:**

```bash
curl -X GET https://api.tallow.app/api/email/status/transfer_uuid_12345 \
  -H "Content-Type: application/json"
```

---

### 7. GET/POST /api/email/download/[id]

**Purpose:** Download files from email transfer

**Authentication:** Password (optional, if transfer is password-protected)

**Rate Limit:** 5 requests/minute (moderate)

**GET Method:**

```http
GET /api/email/download/transfer_uuid_12345 HTTP/1.1
```

**POST Method (for password):**

```http
POST /api/email/download/transfer_uuid_12345 HTTP/1.1
Content-Type: application/json

{
  "password": "optional_password_if_protected"
}
```

**Response:** 200 OK

```json
{
  "success": true,
  "transfer": {
    "id": "transfer_uuid_12345",
    "files": [
      {
        "name": "document.pdf",
        "size": 102400,
        "mimeType": "application/pdf"
      }
    ],
    "senderName": "John Doe",
    "expiresAt": "2026-02-04T10:30:00.000Z",
    "downloadsCount": 1,
    "maxDownloads": 5
  },
  "encryptedFile": {
    "metadata": {
      "encryptedName": "hex_encoded_filename",
      "nameNonce": [12, 34, 56, 78, ...],
      "fileHash": [255, 254, 253, ...],
      "originalSize": 102400,
      "mimeCategory": "document",
      "totalChunks": 2,
      "encryptedAt": "2026-02-03T10:30:00.000Z",
      "originalName": "document.pdf"
    },
    "chunks": [
      {
        "index": 0,
        "data": [1, 2, 3, 4, ...],
        "nonce": [12, 34, 56, 78, ...],
        "hash": [255, 254, 253, ...]
      },
      {
        "index": 1,
        "data": [5, 6, 7, 8, ...],
        "nonce": [9, 10, 11, 12, ...],
        "hash": [252, 251, 250, ...]
      }
    ]
  }
}
```

**Client-Side Decryption:**

1. Receive encrypted file data with chunks
2. Client has encryption key from transfer link
3. Decrypt each chunk using key + nonce
4. Verify hash of each chunk
5. Reconstruct file from chunks
6. Verify file hash
7. Decrypt filename

**Error Responses:**

| Status | Error                   | Cause                          |
| ------ | ----------------------- | ------------------------------ |
| 400    | Transfer ID is required | Missing ID parameter           |
| 401    | Password required       | Transfer is password protected |
| 401    | Invalid password        | Wrong password provided        |
| 404    | Transfer not found      | Transfer doesn't exist         |
| 410    | Transfer has expired    | TTL exceeded                   |
| 429    | Too many requests       | Rate limit exceeded            |
| 500    | Failed to retrieve file | Storage error                  |

**Analytics Tracking:**

1. Record download event
2. Increment download counter
3. Log recipient email and IP
4. Notify sender if enabled

**Example:**

```bash
# Get files from non-password protected transfer
curl -X GET https://api.tallow.app/api/email/download/transfer_uuid_12345 \
  -H "Content-Type: application/json"

# Get files from password protected transfer
curl -X POST https://api.tallow.app/api/email/download/transfer_uuid_12345 \
  -H "Content-Type: application/json" \
  -d '{"password": "secretpassword"}'
```

---

### 8. POST /api/email/webhook

**Purpose:** Handle email delivery webhooks from Resend

**Authentication:** Webhook signature verification (HMAC-SHA256)

**Rate Limit:** None (webhook endpoint)

**Request Headers:**

```
Content-Type: application/json
resend-signature: hmac_sha256_signature
```

**Webhook Event Types:**

- `email.sent` - Email sent successfully
- `email.delivered` - Email delivered to mailbox
- `email.delivery_delayed` - Delivery delayed (maps to delivered)
- `email.bounced` - Email bounced (maps to failed)
- `email.complained` - User marked as spam (maps to failed)
- `email.opened` - Email opened by recipient
- `email.clicked` - Link clicked in email

**Webhook Payload:**

```json
{
  "type": "email.delivered",
  "created_at": "2026-02-03T10:30:15.000Z",
  "data": {
    "email_id": "resend_email_id",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "File transfer notification",
    "created_at": "2026-02-03T10:30:00.000Z",
    "tags": [
      {
        "name": "transfer_id",
        "value": "transfer_uuid_12345"
      }
    ]
  }
}
```

**Response:** 200 OK

```json
{
  "success": true
}
```

**Processing Logic:**

1. **Signature Verification:**
   - Extract `resend-signature` header
   - Compute HMAC-SHA256(body, RESEND_WEBHOOK_SECRET)
   - Compare with provided signature
   - Reject if mismatch

2. **Extract Transfer ID:**
   - Parse email tags
   - Find tag with name: "transfer_id"
   - Extract transfer UUID

3. **Map Event Type:**
   - email.sent -> sent
   - email.delivered -> delivered
   - email.delivery_delayed -> delivered
   - email.bounced -> failed
   - email.complained -> failed
   - email.opened -> opened
   - email.clicked -> clicked

4. **Update Status:**
   - Update transfer status in database
   - Record analytics event
   - Trigger notifications if enabled

5. **Error Handling:**
   - Return 200 even on error to prevent retries
   - Log errors internally
   - Don't expose internal details

**Error Responses:**

| Status | Error                               |
| ------ | ----------------------------------- |
| 401    | Invalid webhook signature           |
| 400    | No transfer_id found                |
| 503    | Webhook verification not configured |
| 200    | Unknown event type (ignored)        |

**Security:**

1. **Signature Validation:**
   - Mandatory in production
   - Prevents webhook spoofing
   - Uses HMAC-SHA256 (industry standard)

2. **Data Validation:**
   - Sanitize all input
   - Validate email addresses
   - Check transfer exists before updating

3. **Idempotency:**
   - Track processed event IDs
   - Prevent duplicate processing
   - Handle webhook retries safely

**Example:**

```bash
# This would be a webhook from Resend
curl -X POST https://api.tallow.app/api/email/webhook \
  -H "Content-Type: application/json" \
  -H "resend-signature: hmac_sha256_hex_string" \
  -d '{
    "type": "email.delivered",
    "created_at": "2026-02-03T10:30:15.000Z",
    "data": {
      "email_id": "resend_id",
      "from": "sender@example.com",
      "to": ["recipient@example.com"],
      "subject": "File transfer",
      "tags": [{"name": "transfer_id", "value": "transfer_uuid_12345"}]
    }
  }'
```

---

### 9. POST /api/send-welcome

**Purpose:** Send welcome email to new user

**Authentication:** API key required, CSRF token required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response:** 200 OK

```json
{
  "message": "Welcome email sent successfully",
  "data": {
    "id": "resend_email_id"
  }
}
```

**Error Responses:**

| Status | Error                        |
| ------ | ---------------------------- |
| 400    | Email and name are required  |
| 400    | Invalid email format         |
| 403    | Invalid CSRF token           |
| 429    | Too many email requests      |
| 503    | Email service not configured |
| 500    | Failed to send email         |

---

### 10. POST /api/send-share-email

**Purpose:** Send file share email notification

**Authentication:** API key required, CSRF token required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "email": "recipient@example.com",
  "shareId": "share_uuid_12345",
  "senderName": "John Doe",
  "fileCount": 3,
  "totalSize": 51200
}
```

**Parameter Validation:**

| Field      | Type   | Required | Validation                     |
| ---------- | ------ | -------- | ------------------------------ |
| email      | string | Yes      | RFC 5322 compliant             |
| shareId    | string | Yes      | Format: `^[a-zA-Z0-9-]{1,64}$` |
| senderName | string | No       | Max 100 characters             |
| fileCount  | number | Yes      | Minimum 1                      |
| totalSize  | number | Yes      | Non-negative                   |

**Response:** 200 OK

```json
{
  "success": true,
  "shareUrl": "https://tallow.app/share/share_uuid_12345"
}
```

**Email HTML Template:**

```html
Subject: Someone shared files with you via Tallow Body: [Responsive HTML email
with download button and file details]
```

**XSS Prevention:**

- All HTML encoded using escapeHtml()
- URL validated and sanitized
- Sender name HTML encoded
- File count and size formatted safely

**Error Responses:**

| Status | Error                         |
| ------ | ----------------------------- |
| 400    | Valid email is required       |
| 400    | Valid shareId is required     |
| 400    | Invalid email format          |
| 400    | Invalid shareId format        |
| 403    | Invalid CSRF token or API key |
| 429    | Too many email requests       |
| 500    | Failed to send email          |

---

### 11. POST /api/v1/send-file-email

**Purpose:** Send file attachment via email (v1 API)

**Authentication:** API key required

**Rate Limit:** 3 requests/minute (strict)

**Request Body:**

```json
{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe",
  "fileName": "document.pdf",
  "fileSize": 102400,
  "fileData": "base64_encoded_file_content",
  "downloadUrl": "https://tallow.app/download/file_id",
  "expiresAt": 1707003000000,
  "mode": "attachment"
}
```

**Mode Options:**

- `attachment` - Attach file to email (for small files < 25MB)
- `link` - Include download link in email (for large files)

**Response:** 200 OK

```json
{
  "success": true,
  "emailId": "resend_email_id",
  "message": "File transfer email sent successfully"
}
```

**Error Responses:**

| Status | Error                        |
| ------ | ---------------------------- |
| 400    | Missing required fields      |
| 400    | Invalid email format         |
| 400    | Invalid file mode            |
| 400    | Invalid expiration time      |
| 429    | Too many requests            |
| 503    | Email service not configured |
| 500    | Failed to send email         |

---

### 12. POST /api/v1/send-share-email

**Purpose:** Send share link email (v1 API - similar to /api/send-share-email)

**Authentication:** API key required, CSRF token required

**Rate Limit:** 5 requests/minute

Similar to `/api/send-share-email` but with additional validation and
deprecation headers.

---

### 13. POST /api/v1/send-welcome

**Purpose:** Send welcome email (v1 API - similar to /api/send-welcome)

**Authentication:** API key required, CSRF token required

**Rate Limit:** 3 requests/minute

Similar to `/api/send-welcome` but with stricter rate limiting.

---

## Health & Monitoring

### 14. GET /api/health

**Purpose:** Basic liveness probe for container orchestration

**Authentication:** None required

**Rate Limit:** None

**Response:** 200 OK

```json
{
  "status": "ok",
  "service": "tallow",
  "version": "1.0.0",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "uptime": 3600
}
```

**Use Case:** Kubernetes liveness probe - verifies application is running

**Example:**

```bash
curl -X GET http://localhost:3000/api/health
```

---

### 15. GET /api/health/liveness

**Purpose:** Minimal liveness probe (fast response)

**Authentication:** None required

**Rate Limit:** None

**Response:** 200 OK

```json
{
  "status": "alive",
  "timestamp": "2026-02-03T10:30:00.000Z"
}
```

**HEAD Method:** Returns 200 with no body

**Use Case:** Fast Kubernetes liveness probe

---

### 16. GET /api/health/readiness

**Purpose:** Check if application is ready to serve traffic

**Authentication:** None required

**Rate Limit:** None

**Checks Performed:**

1. Environment variables configured
2. Memory usage < 90%
3. Required dependencies available

**Response:** 200 OK

```json
{
  "status": "ready",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "checks": [
    {
      "name": "environment",
      "status": "healthy",
      "responseTime": 5
    },
    {
      "name": "memory",
      "status": "healthy",
      "responseTime": 2
    }
  ]
}
```

**Error Response:** 503 Service Unavailable

```json
{
  "status": "not ready",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "checks": [
    {
      "name": "environment",
      "status": "unhealthy",
      "error": "Missing required variables: NEXT_PUBLIC_SIGNALING_URL"
    }
  ]
}
```

**HEAD Method:** Returns 200 or 503 with no body

**Use Case:** Kubernetes readiness probe

---

### 17. GET /api/health/detailed

**Purpose:** Comprehensive health status with all system information

**Authentication:** Optional bearer token (HEALTH_CHECK_TOKEN)

**Rate Limit:** None

**Protected:** If `HEALTH_CHECK_TOKEN` is set, requires
`Authorization: Bearer token` header

**Response:** 200 OK

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2026-02-03T10:30:00.000Z",
  "components": [
    {
      "name": "memory",
      "status": "healthy",
      "message": "Memory usage normal",
      "metrics": {
        "heapUsed": 52428800,
        "heapTotal": 104857600,
        "percentage": 50.0,
        "external": 1024000,
        "rss": 150000000
      },
      "lastChecked": "2026-02-03T10:30:00.000Z"
    },
    {
      "name": "environment",
      "status": "healthy",
      "message": "All required environment variables configured",
      "metrics": {
        "requiredConfigured": 2,
        "requiredTotal": 2,
        "optionalConfigured": 3,
        "optionalTotal": 4
      },
      "lastChecked": "2026-02-03T10:30:00.000Z"
    },
    {
      "name": "metrics",
      "status": "healthy",
      "message": "Metrics collection active",
      "metrics": {
        "metricsCount": 125
      },
      "lastChecked": "2026-02-03T10:30:00.000Z"
    },
    {
      "name": "monitoring",
      "status": "healthy",
      "message": "All monitoring integrations active",
      "metrics": {
        "sentry": "configured",
        "plausible": "configured"
      },
      "lastChecked": "2026-02-03T10:30:00.000Z"
    }
  ],
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.17.0",
    "memory": {
      "total": 104857600,
      "used": 52428800,
      "percentage": 50.0
    },
    "cpu": {
      "count": 4
    }
  }
}
```

**Component Status Values:**

- `healthy` - Component working normally
- `degraded` - Component working but with issues
- `unhealthy` - Component not available

**Memory Thresholds:**

- 0-75% - healthy
- 75-90% - degraded
- 90%+ - unhealthy

**Error Response:** 503 Service Unavailable

```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2026-02-03T10:30:00.000Z",
  "components": [
    {
      "name": "memory",
      "status": "unhealthy",
      "message": "Critical memory usage",
      "metrics": {
        "percentage": 95.0
      },
      "lastChecked": "2026-02-03T10:30:00.000Z"
    }
  ]
}
```

---

### 18. GET /api/ready

**Purpose:** Comprehensive readiness check with PQC and signaling server
verification

**Authentication:** None required

**Rate Limit:** None

**Checks Performed:**

1. PQC library availability (pqc-kyber)
2. Signaling server reachability (3s timeout)
3. Environment configuration
4. Node.js and dependencies

**Response:** 200 OK

```json
{
  "status": "ok",
  "service": "tallow",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "checks": {
    "pqcLibrary": true,
    "signalingServer": true,
    "environment": true
  }
}
```

**Error Response:** 503 Service Unavailable

```json
{
  "status": "error",
  "service": "tallow",
  "timestamp": "2026-02-03T10:30:00.000Z",
  "checks": {
    "pqcLibrary": true,
    "signalingServer": false,
    "environment": true
  },
  "errors": ["Signaling server not reachable"]
}
```

**Signaling Server Check:**

- Sends request to `{NEXT_PUBLIC_SIGNALING_URL}/health`
- 3-second timeout
- Accepts response with status: "ok"
- Gracefully handles unavailability (doesn't fail readiness)

---

### 19. GET /api/metrics

**Purpose:** Expose Prometheus metrics for monitoring

**Authentication:** Optional bearer token (METRICS_TOKEN)

**Rate Limit:** None

**Response:** 200 OK

```
# HELP tallow_requests_total Total number of HTTP requests
# TYPE tallow_requests_total counter
tallow_requests_total{method="GET",status="200",path="/api/health"} 1234
tallow_requests_total{method="POST",status="200",path="/api/email/send"} 567

# HELP tallow_request_duration_ms HTTP request duration in milliseconds
# TYPE tallow_request_duration_ms histogram
tallow_request_duration_ms_bucket{le="100",path="/api/health"} 1200
tallow_request_duration_ms_bucket{le="1000",path="/api/health"} 1230
tallow_request_duration_ms_bucket{le="+Inf",path="/api/health"} 1234

# HELP tallow_active_requests Current number of active requests
# TYPE tallow_active_requests gauge
tallow_active_requests{method="GET"} 2
tallow_active_requests{method="POST"} 1

# HELP tallow_file_transfer_total Total files transferred
# TYPE tallow_file_transfer_total counter
tallow_file_transfer_total 12345

# HELP tallow_bytes_transferred_total Total bytes transferred
# TYPE tallow_bytes_transferred_total counter
tallow_bytes_transferred_total 1234567890
```

**Content-Type:** `text/plain; version=0.0.4; charset=utf-8` (OpenMetrics
format)

**Authentication:**

- If `METRICS_TOKEN` is set, requires: `Authorization: Bearer token`
- If not set, metrics are publicly accessible

**HEAD Method:** Returns 200 with metrics headers

**Metrics Collected:**

- Total requests (by method, status, path)
- Request duration histogram (by path)
- Active requests gauge
- File transfers counter
- Bytes transferred counter
- Error rates

**Example:**

```bash
# Without authentication
curl -X GET http://localhost:3000/api/metrics

# With token
curl -X GET http://localhost:3000/api/metrics \
  -H "Authorization: Bearer YOUR_METRICS_TOKEN"
```

---

## Room Management

### 20. GET /api/rooms

**Purpose:** Get room information by room code

**Authentication:** None required

**Rate Limit:** 60 requests/minute

**Query Parameters:**

```
code: string (required) - Room code (4-8 alphanumeric uppercase)
```

**Request:**

```http
GET /api/rooms?code=ABCD1234 HTTP/1.1
```

**Response:** 200 OK

```json
{
  "id": "room_uuid_12345",
  "code": "ABCD1234",
  "name": "Team Meeting Room",
  "ownerId": "owner_uuid",
  "ownerName": "John Doe",
  "createdAt": "2026-02-03T10:30:00.000Z",
  "expiresAt": "2026-02-04T10:30:00.000Z",
  "isPasswordProtected": true,
  "maxMembers": 10,
  "memberCount": 3
}
```

**Validation:**

| Parameter | Format | Validation        |
| --------- | ------ | ----------------- |
| code      | string | `^[A-Z0-9]{4,8}$` |

**Error Responses:**

| Status | Error                    |
| ------ | ------------------------ |
| 400    | Room code is required    |
| 400    | Invalid room code format |
| 404    | Room not found           |
| 410    | Room has expired         |
| 429    | Too many requests        |
| 500    | Internal server error    |

**Room Code Format:**

- 4-8 alphanumeric characters (uppercase)
- Example: ABCD, 12345678, ABC123
- Case-insensitive input (automatically uppercase)

**Expiration:**

- Rooms can have optional expiration time
- Expired rooms are cleaned up every 5 minutes
- Returns 410 Gone if room has expired

---

### 21. POST /api/rooms

**Purpose:** Create a new transfer room

**Authentication:** CSRF token required

**Rate Limit:** 10 requests/minute

**Request Body:**

```json
{
  "id": "room_uuid_12345",
  "code": "ABCD1234",
  "name": "Project Alpha Team",
  "ownerId": "owner_uuid_12345",
  "ownerName": "John Doe",
  "password": "optional_room_password",
  "expiresAt": "2026-02-04T10:30:00.000Z",
  "maxMembers": 10
}
```

**Parameter Validation:**

| Field      | Type     | Required | Validation                            |
| ---------- | -------- | -------- | ------------------------------------- |
| id         | string   | Yes      | `^[a-zA-Z0-9-]{1,64}$`                |
| code       | string   | Yes      | `^[A-Z0-9]{4,8}$`                     |
| name       | string   | No       | Max 50 characters, HTML sanitized     |
| ownerId    | string   | Yes      | `^[a-zA-Z0-9-]{1,64}$`                |
| ownerName  | string   | Yes      | Max 50 characters, HTML sanitized     |
| password   | string   | No       | 4-128 characters (hashed with PBKDF2) |
| expiresAt  | ISO 8601 | No       | Max 7 days in future                  |
| maxMembers | number   | No       | 2-50 (default: 10)                    |

**Password Security:**

If password is provided:

1. Generate random 32-byte salt
2. Hash using PBKDF2 with 600,000 iterations (OWASP 2023)
3. Hash algorithm: SHA-256
4. Store both hash and salt
5. Use timing-safe comparison for verification

**Response:** 201 Created

```json
{
  "success": true,
  "room": {
    "id": "room_uuid_12345",
    "code": "ABCD1234",
    "name": "Project Alpha Team",
    "ownerId": "owner_uuid_12345",
    "createdAt": "2026-02-03T10:30:00.000Z",
    "expiresAt": "2026-02-04T10:30:00.000Z",
    "isPasswordProtected": true,
    "maxMembers": 10
  }
}
```

**Error Responses:**

| Status | Error                              | Cause                            |
| ------ | ---------------------------------- | -------------------------------- |
| 400    | Valid room ID is required          | Missing or invalid ID            |
| 400    | Valid room code is required        | Missing or invalid code          |
| 400    | Room code must be 4-8 alphanumeric | Code format invalid              |
| 400    | Valid owner ID is required         | Missing owner ID                 |
| 400    | Invalid room code format           | Code has lowercase/special chars |
| 409    | Room code already exists           | Code taken                       |
| 403    | Invalid CSRF token                 | CSRF validation failed           |
| 429    | Too many requests                  | Rate limit exceeded              |
| 500    | Internal server error              | Server error                     |

**Room Code Collision:**

- Check if code already exists before creation
- Return 409 Conflict if duplicate
- Codes are case-insensitive (always uppercase)

**Room Expiration:**

- Optional expiration timestamp
- Cannot exceed 7 days in future
- Cleanup job runs every 5 minutes
- Returns 410 Gone if trying to access expired room

**XSS Prevention:**

- Room name sanitized (remove HTML tags, trim, max 50 chars)
- Owner name sanitized similarly
- Prevents stored XSS attacks

---

### 22. DELETE /api/rooms

**Purpose:** Delete a room (owner only)

**Authentication:** CSRF token required

**Rate Limit:** 30 requests/minute

**Query Parameters:**

```
code: string (required) - Room code
ownerId: string (required) - Owner ID (for authorization)
```

**Request:**

```http
DELETE /api/rooms?code=ABCD1234&ownerId=owner_uuid_12345 HTTP/1.1
X-CSRF-Token: csrf_token
```

**Response:** 200 OK

```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**Authorization:**

- Uses timing-safe string comparison
- Only owner (matching ownerId) can delete room
- Prevents timing attacks

**Error Responses:**

| Status | Error                                   |
| ------ | --------------------------------------- |
| 400    | Room code is required                   |
| 400    | Owner ID is required                    |
| 400    | Invalid room code format                |
| 400    | Invalid owner ID format                 |
| 403    | Invalid CSRF token                      |
| 403    | Only the room owner can delete the room |
| 404    | Room not found                          |
| 429    | Too many requests                       |
| 500    | Internal server error                   |

**Authorization Check:**

```typescript
// Timing-safe comparison prevents timing attacks
if (!timingSafeEquals(room.ownerId, providedOwnerId)) {
  return 403 Forbidden;
}
```

---

## Payment Integration

### 23. POST /api/stripe/create-checkout-session

**Purpose:** Create Stripe checkout session for donations

**Authentication:** CSRF token required

**Rate Limit:** 3 requests/minute (strict)

**Request Body:**

```json
{
  "amount": 100
}
```

**Parameter Validation:**

| Field  | Type   | Required | Validation               |
| ------ | ------ | -------- | ------------------------ |
| amount | number | Yes      | 100-99999900 cents (USD) |

**Amount Ranges:**

- Minimum: 100 cents ($1.00)
- Maximum: 99999900 cents ($999,999.00)

**Response:** 200 OK

```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Error Responses:**

| Status | Error                                     |
| ------ | ----------------------------------------- |
| 400    | Invalid amount. Minimum donation is $1.00 |
| 400    | Amount exceeds maximum                    |
| 403    | Invalid CSRF token                        |
| 429    | Too many requests                         |
| 503    | Stripe is not configured                  |
| 500    | Failed to create checkout session         |

**Checkout Session Details:**

```javascript
{
  mode: 'payment',
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: 'Tallow Donation',
        description: 'Support open-source, private file sharing'
      },
      unit_amount: amount_in_cents
    },
    quantity: 1
  }],
  success_url: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/donate/cancel`
}
```

**Environment Variables Required:**

- `STRIPE_SECRET_KEY` - Stripe secret API key

---

### 24. POST /api/stripe/webhook

**Purpose:** Handle Stripe webhook events

**Authentication:** Webhook signature verification

**Rate Limit:** None

**Request Headers:**

```
Content-Type: application/json
stripe-signature: t=timestamp,v1=signature
```

**Webhook Events Handled:**

- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment succeeded
- Other events: logged but ignored

**Webhook Payload (from Stripe):**

```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "created": 1707000000,
  "data": {
    "object": {
      "id": "cs_test_...",
      "object": "checkout.session",
      "mode": "payment",
      "amount_total": 100,
      "currency": "usd"
    }
  }
}
```

**Response:** 200 OK

```json
{
  "received": true
}
```

**Error Responses:**

| Status | Error                           |
| ------ | ------------------------------- |
| 400    | Missing stripe-signature header |
| 400    | Webhook Error: [error details]  |
| 503    | Webhook secret not configured   |

**Signature Verification:**

1. Extract timestamp and signature from header: `t=timestamp,v1=signature`
2. Create signed content: `{timestamp}.{body}`
3. Compute HMAC-SHA256(signed_content, STRIPE_WEBHOOK_SECRET)
4. Compare with provided signature
5. Check timestamp is not too old (< 5 minutes)

**Idempotency:**

- Track processed event IDs in memory
- Prevent duplicate processing if webhook is retried
- Clear cache every hour

**Processing Logic:**

```typescript
switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object;
    secureLog.log('Donation received:', {
      amount: session.amount_total,
      currency: session.currency,
      sessionId: session.id,
    });
    // Optional: Update database, send confirmation email
    break;
  }

  case 'payment_intent.succeeded': {
    const paymentIntent = event.data.object;
    secureLog.log('Payment succeeded:', paymentIntent.id);
    break;
  }

  default:
    // Ignore unknown event types
    break;
}
```

**Environment Variables Required:**

- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

---

## Cron Jobs

### POST /api/cron/cleanup

**Purpose:** Clean up expired files and transfer records

**Authentication:** Bearer token or Vercel Cron header

**Rate Limit:** None

**Trigger Methods:**

1. **Vercel Cron (Recommended):**

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

   Automatic header: `x-vercel-cron: true`

2. **Manual Bearer Token:**

   ```
   Authorization: Bearer {CRON_SECRET}
   ```

3. **Environment Variable:** `CRON_SECRET` - Secret for Bearer token
   authentication

**Request:**

```http
POST /api/cron/cleanup HTTP/1.1
Authorization: Bearer your_cron_secret
```

**Response:** 200 OK

```json
{
  "success": true,
  "filesDeleted": 42,
  "transfersDeleted": 15,
  "duration": 1234,
  "timestamp": "2026-02-03T10:30:00.000Z"
}
```

**Operations Performed:**

1. **S3 File Cleanup:**
   - Find all files with expiration < current time
   - Delete from S3 storage
   - Return count deleted

2. **Transfer Record Cleanup:**
   - Find all transfer records with expiration < current time
   - Delete metadata and analytics records
   - Return count deleted

3. **Room Cleanup:**
   - Find all rooms with expiration < current time
   - Delete room records
   - Runs automatically every 5 minutes (in-memory)

**Error Responses:**

| Status | Error              |
| ------ | ------------------ |
| 401    | Unauthorized       |
| 500    | Cleanup job failed |

**Error Handling:**

- S3 cleanup failures don't block transfer cleanup
- Partial failures are logged but endpoint returns 200
- Job continues despite individual failures

**Logging:**

```
[Cron] Starting cleanup job...
[Cron] Deleted 42 expired files from S3
[Cron] Deleted 15 expired transfer records
[Cron] Cleanup completed in 1234ms
```

**Scheduling Best Practices:**

1. Run hourly (every 1-3 hours)
2. Run during low-traffic periods (off-peak)
3. Monitor execution time
4. Alert on failures
5. Backup before running in production

**Example with cURL:**

```bash
curl -X POST https://api.tallow.app/api/cron/cleanup \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Implementation Patterns

### CORS Configuration

All endpoints support CORS with the following configuration:

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS, HEAD **Allowed Headers:**
Content-Type, Authorization, X-CSRF-Token, Origin **Exposed Headers:**
X-RateLimit-\*, Content-Type, Location **Allowed Origins:** Configured via
environment or request origin **Credentials:** Included (for same-site requests)

### Request/Response Validation

**Request Validation Pipeline:**

1. **Syntax Validation:**
   - Valid JSON parsing
   - Content-Type verification
   - Required field presence

2. **Type Validation:**
   - Field types match expected types
   - String lengths within limits
   - Numbers within ranges

3. **Format Validation:**
   - Email RFC 5322 compliance
   - URL format correctness
   - ID format patterns
   - Date/time ISO 8601

4. **Business Logic Validation:**
   - Resource exists (404)
   - User has permission (403)
   - Rate limits not exceeded (429)
   - Dependent resources available (503)

### Input Sanitization

**HTML Encoding:**

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

**Filename Sanitization:**

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_')
    .replace(/\r|\n/g, '')
    .substring(0, 255);
}
```

**URL Sanitization:**

```typescript
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return escapeHtml(parsed.toString());
  } catch {
    return '#';
  }
}
```

### Error Handling Best Practices

1. **Never expose internal details:**
   - Don't reveal stack traces
   - Don't expose database errors
   - Don't reveal file system paths

2. **Log securely:**
   - Never log sensitive data (keys, passwords)
   - Log IDs and timestamps for debugging
   - Use structured logging

3. **Return consistent errors:**
   - Always include error message
   - Always include HTTP status code
   - Include timestamp for debugging

4. **Handle async errors:**
   - Wrap async operations in try/catch
   - Handle promise rejections
   - Timeout long operations

### Security Best Practices

**CSRF Protection:**

- Generate 32-byte random tokens (256 bits)
- Store in HttpOnly cookie
- Require in X-CSRF-Token header for mutations
- Validate on every state-changing request

**Authentication:**

- Use secure random tokens for API keys
- Implement rate limiting to prevent brute force
- Use strong hashing for passwords (PBKDF2 600,000 iterations)
- Never store plaintext passwords

**Encryption:**

- Use AES-256-GCM for file encryption
- Generate random nonces for each chunk
- Verify integrity with HMAC
- Never log encryption keys

**Input Validation:**

- Whitelist allowed characters
- Validate format strictly
- Sanitize HTML output
- Limit string lengths

**Secrets Management:**

- Store in environment variables
- Never commit to version control
- Rotate regularly
- Use different values per environment

---

## Complete API Summary Table

| #   | Method | Endpoint                               | Auth      | Rate Limit | Status     |
| --- | ------ | -------------------------------------- | --------- | ---------- | ---------- |
| 1   | GET    | /api/csrf-token                        | None      | 30/min     | Active     |
| 2   | POST   | /api/v1/download-file                  | None      | 10/min     | Active     |
| 3   | GET    | /api/v1/download-file                  | None      | 10/min     | Deprecated |
| 4   | POST   | /api/email/send                        | CSRF      | 3/min      | Active     |
| 5   | POST   | /api/email/batch                       | CSRF      | 3/min      | Active     |
| 6   | GET    | /api/email/status/[id]                 | None      | 10/min     | Active     |
| 7   | GET    | /api/email/download/[id]               | None      | 5/min      | Active     |
| 8   | POST   | /api/email/download/[id]               | None      | 5/min      | Active     |
| 9   | POST   | /api/email/webhook                     | Signature | None       | Active     |
| 10  | POST   | /api/send-welcome                      | Key+CSRF  | 10/min     | Active     |
| 11  | POST   | /api/send-share-email                  | Key+CSRF  | 10/min     | Active     |
| 12  | POST   | /api/v1/send-file-email                | Key       | 3/min      | Active     |
| 13  | POST   | /api/v1/send-share-email               | Key+CSRF  | 5/min      | Active     |
| 14  | POST   | /api/v1/send-welcome                   | Key+CSRF  | 3/min      | Active     |
| 15  | POST   | /api/stripe/create-checkout-session    | CSRF      | 3/min      | Active     |
| 16  | POST   | /api/stripe/webhook                    | Signature | None       | Active     |
| 17  | POST   | /api/v1/stripe/create-checkout-session | CSRF      | 3/min      | Active     |
| 18  | POST   | /api/v1/stripe/webhook                 | Signature | None       | Active     |
| 19  | GET    | /api/health                            | None      | None       | Active     |
| 20  | GET    | /api/health/liveness                   | None      | None       | Active     |
| 21  | HEAD   | /api/health/liveness                   | None      | None       | Active     |
| 22  | GET    | /api/health/readiness                  | None      | None       | Active     |
| 23  | HEAD   | /api/health/readiness                  | None      | None       | Active     |
| 24  | GET    | /api/health/detailed                   | Token     | None       | Active     |
| 25  | GET    | /api/ready                             | None      | None       | Active     |
| 26  | GET    | /api/metrics                           | Token     | None       | Active     |
| 27  | HEAD   | /api/metrics                           | Token     | None       | Active     |
| 28  | GET    | /api/rooms?code=X                      | None      | 60/min     | Active     |
| 29  | POST   | /api/rooms                             | CSRF      | 10/min     | Active     |
| 30  | DELETE | /api/rooms                             | CSRF      | 30/min     | Active     |
| 31  | POST   | /api/cron/cleanup                      | Secret    | None       | Active     |

---

## Versioning Strategy

**Current Version:** v1

**API Versions:**

- `/api/` - Latest (currently v1, recommended for new integrations)
- `/api/v1/` - Explicit v1 (legacy for backward compatibility)

**Deprecation Policy:**

1. New version released
2. Old version marked deprecated (in headers)
3. Deprecation period: 3 months
4. Old version removed after period

**Migration Path:**

- Old endpoint returns deprecation header: `Sunset: date`
- Header indicates: `/api/v1/endpoint-name` is deprecated
- Documentation provides migration guide
- Support provided during transition period

---

## OpenAPI 3.1 Specification

Full OpenAPI 3.1 spec file available at: `/docs/api/openapi.yaml`

### Spec Highlights:

**Servers:**

```yaml
servers:
  - url: https://api.tallow.app/api
    description: Production
  - url: http://localhost:3000/api
    description: Development
```

**Security Schemes:**

```yaml
securitySchemes:
  csrfToken:
    type: apiKey
    in: header
    name: X-CSRF-Token
  apiKey:
    type: apiKey
    in: header
    name: Authorization
  webhookSignature:
    type: apiKey
    in: header
    name: resend-signature
```

**Components:**

- Request/response schemas
- Parameter definitions
- Error response formats
- Authentication flows

---

## Testing Endpoints

### Quick Test Suite

**1. CSRF Token Generation:**

```bash
curl -X GET http://localhost:3000/api/csrf-token
```

**2. Health Check:**

```bash
curl -X GET http://localhost:3000/api/health
```

**3. Readiness Check:**

```bash
curl -X GET http://localhost:3000/api/health/readiness
```

**4. Room Creation (requires CSRF):**

```bash
# First get token
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r .token)

# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "id": "room123",
    "code": "TEST",
    "ownerId": "owner123",
    "ownerName": "Test Owner"
  }'
```

**5. Metrics Export:**

```bash
curl -X GET http://localhost:3000/api/metrics
```

---

## Conclusion

The Tallow API provides comprehensive, secure endpoints for:

- Encrypted file transfer via email
- Room management for group transfers
- Payment processing (Stripe integration)
- Health monitoring and metrics
- Automated cleanup of expired resources

All endpoints follow security best practices:

- Input validation and sanitization
- Rate limiting per IP
- CSRF protection for mutations
- Webhook signature verification
- Comprehensive error handling
- Detailed logging and monitoring

For production deployments, ensure:

1. All environment variables are configured
2. Webhook secrets are generated
3. Rate limits are appropriate
4. Monitoring is active
5. Backups are configured
6. HTTPS is enforced
