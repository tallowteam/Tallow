# API Quick Reference Guide

Quick reference for all Tallow API endpoints.

---

## Base URLs

- **Production:** `https://tallow.manisahome.com/api`
- **Development:** `http://localhost:3000/api`

---

## Health & Monitoring

### GET /api/health
Simple health check.
```bash
curl http://localhost:3000/api/health
```
**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "tallow",
  "timestamp": "2026-01-28T14:25:20.860Z"
}
```

### GET /api/ready
Readiness check with dependency verification.
```bash
curl http://localhost:3000/api/ready
```
**Response:** `200 OK` or `503 Service Unavailable`

### GET /api/metrics
Prometheus metrics in text format.
```bash
curl http://localhost:3000/api/metrics
```
**Response:** Prometheus text format

---

## Security

### GET /api/csrf-token
Get CSRF token for protected requests.
```bash
curl http://localhost:3000/api/csrf-token
```
**Response:**
```json
{
  "token": "abc123...",
  "message": "CSRF token generated"
}
```

---

## Email API

### POST /api/email/send
Send file via email.
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "John Doe",
    "files": [{"filename": "test.txt", "content": "base64..."}]
  }'
```
**Rate Limit:** CSRF required
**Response:** `200 OK`

### POST /api/email/batch
Send files to multiple recipients.
```bash
curl -X POST http://localhost:3000/api/email/batch \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "senderName": "John Doe",
    "files": [...]
  }'
```
**Rate Limit:** CSRF required, max 50 recipients

### GET /api/email/download/[id]
Download transferred file.
```bash
curl http://localhost:3000/api/email/download/abc123
```
**Rate Limit:** 10 requests/minute per IP

### POST /api/email/download/[id]
Download password-protected file.
```bash
curl -X POST http://localhost:3000/api/email/download/abc123 \
  -H "Content-Type: application/json" \
  -d '{"password": "secret123"}'
```
**Rate Limit:** 10 requests/minute per IP

### GET /api/email/status/[id]
Check email transfer status.
```bash
curl http://localhost:3000/api/email/status/abc123
```

### POST /api/email/webhook
Resend webhook handler (internal).
**Security:** Signature verification required

---

## Legacy Email API

### POST /api/send-welcome
Send welcome email.
```bash
curl -X POST http://localhost:3000/api/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```
**Rate Limit:** 3 requests/minute per IP
**Auth:** API key required

### POST /api/send-share-email
Send share notification email.
```bash
curl -X POST http://localhost:3000/api/send-share-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "email": "user@example.com",
    "shareId": "abc123",
    "senderName": "John",
    "fileCount": 2,
    "totalSize": 1048576
  }'
```
**Rate Limit:** 5 requests/minute per IP
**Auth:** API key required

---

## V1 API - Email

### POST /api/v1/send-file-email
Send file via email (enhanced version).
```bash
curl -X POST http://localhost:3000/api/v1/send-file-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "John Doe",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "fileData": "base64...",
    "mode": "attachment",
    "expiresAt": 1738161920000
  }'
```
**Rate Limit:** 3 requests/minute per IP
**Auth:** API key + CSRF required
**Max File Size:** 25MB (attachment), 100MB (link)

### POST /api/v1/send-welcome
Send welcome email (enhanced).
```bash
curl -X POST http://localhost:3000/api/v1/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```
**Rate Limit:** 3 requests/minute per IP
**Auth:** API key + CSRF required

### POST /api/v1/send-share-email
Send share email (enhanced).
```bash
curl -X POST http://localhost:3000/api/v1/send-share-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{
    "email": "user@example.com",
    "shareId": "abc123",
    "senderName": "John",
    "fileCount": 2,
    "totalSize": 1048576
  }'
```
**Rate Limit:** 5 requests/minute per IP
**Auth:** API key + CSRF required

### GET /api/v1/download-file
Download file with encryption.
```bash
curl "http://localhost:3000/api/v1/download-file?fileId=123-abc&token=def456&key=789ghi"
```
**Rate Limit:** 10 requests/minute per IP
**Response:** Binary file data

---

## Stripe Payment API

### POST /api/stripe/create-checkout-session
Create Stripe checkout for donation.
```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```
**Amount:** In cents (500 = $5.00)
**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

### POST /api/stripe/webhook
Stripe webhook handler (internal).
**Security:** Stripe signature verification required

---

## V1 Stripe API

### POST /api/v1/stripe/create-checkout-session
Create checkout (enhanced).
```bash
curl -X POST http://localhost:3000/api/v1/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"amount": 1000}'
```
**Rate Limit:** 3 requests/minute per IP
**Auth:** CSRF required

### POST /api/v1/stripe/webhook
Stripe webhook with idempotency.
**Security:** Signature verification + deduplication

---

## Room Management

### GET /api/rooms?code=ABCD
Get room information.
```bash
curl "http://localhost:3000/api/rooms?code=ABCD"
```
**Response:**
```json
{
  "id": "...",
  "code": "ABCD",
  "name": "Room ABCD",
  "ownerId": "...",
  "ownerName": "John",
  "createdAt": "...",
  "expiresAt": "...",
  "isPasswordProtected": false,
  "maxMembers": 10,
  "memberCount": 0
}
```

### POST /api/rooms
Create a new room.
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "id": "unique-id",
    "code": "ABCD",
    "name": "My Room",
    "ownerId": "user-123",
    "ownerName": "John",
    "password": "optional-password",
    "maxMembers": 10
  }'
```

### DELETE /api/rooms?code=ABCD&ownerId=user-123
Delete a room (owner only).
```bash
curl -X DELETE "http://localhost:3000/api/rooms?code=ABCD&ownerId=user-123"
```

---

## Cron Jobs

### GET /api/cron/cleanup
Run cleanup job (manual trigger).
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/cleanup
```
**Auth:** Bearer token or Vercel Cron header

---

## Authentication

### API Key Authentication
Add header to requests:
```bash
-H "X-API-Key: YOUR_API_SECRET_KEY"
```

### CSRF Protection
1. Get token: `GET /api/csrf-token`
2. Add to requests:
```bash
-H "X-CSRF-Token: YOUR_TOKEN"
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/send-welcome` | 3/min |
| `/api/send-share-email` | 5/min |
| `/api/v1/send-*` | 3/min |
| `/api/v1/send-share-email` | 5/min |
| `/api/v1/download-file` | 10/min |
| `/api/email/download/*` | 10/min |
| `/api/v1/stripe/create-*` | 3/min |

All limits are per IP address.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized - Invalid or missing API key"
}
```

### 403 Forbidden
```json
{
  "error": "CSRF token validation failed"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests. Please try again later."
}
```
Headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service not configured"
}
```

---

## Environment Variables

### Required
```bash
API_SECRET_KEY=<64-char-hex>
RESEND_API_KEY=<key>
STRIPE_SECRET_KEY=<key>
STRIPE_WEBHOOK_SECRET=<secret>
```

### Optional
```bash
CRON_SECRET=<secret>
RESEND_WEBHOOK_SECRET=<secret>
METRICS_TOKEN=<token>
```

---

## Testing Examples

### Test Health
```bash
curl http://localhost:3000/api/health
```

### Test Authentication
```bash
# Should fail (no API key)
curl -X POST http://localhost:3000/api/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test"}'

# Should succeed
curl -X POST http://localhost:3000/api/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"email":"test@example.com","name":"Test"}'
```

### Test Rate Limiting
```bash
# Run 4 times quickly - 4th should return 429
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/send-welcome \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_KEY" \
    -d '{"email":"test@example.com","name":"Test"}'
done
```

---

## Status Codes Reference

- `200` - Success
- `400` - Bad request / validation error
- `401` - Unauthorized / invalid credentials
- `403` - Forbidden / CSRF failure
- `404` - Not found
- `409` - Conflict (duplicate)
- `410` - Gone (expired)
- `429` - Too many requests
- `500` - Internal server error
- `503` - Service unavailable

---

**Last Updated:** 2026-01-28
