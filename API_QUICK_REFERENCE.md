# Tallow API Quick Reference Guide

**Quick lookup for common API operations and responses**

---

## Essential Setup

### 1. Get CSRF Token (All Clients)

```bash
curl -X GET https://api.tallow.app/api/csrf-token

# Response:
{
  "token": "a1b2c3d4e5f6...",
  "message": "CSRF token generated"
}

# Store token in: X-CSRF-Token header for all POST/DELETE requests
```

### 2. Health Check

```bash
curl -X GET https://api.tallow.app/api/health

# Response:
{
  "status": "ok",
  "service": "tallow",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## File Transfer Operations

### Download Encrypted File (Recommended POST Method)

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

**Validation Rules:**

- fileId: `^[0-9]+-[a-f0-9]{32}$`
- token: `^[a-f0-9]{64}$` (256-bit)
- key: `^[a-f0-9]{64}$` (256-bit AES)

**Error Codes:**

- 400: Invalid format
- 403: Invalid token
- 404: File not found/expired
- 410: Download limit exceeded
- 429: Rate limited (10/min)

---

## Email Services

### Send Single File Email

```bash
# Get CSRF token first
TOKEN=$(curl -s https://api.tallow.app/api/csrf-token | jq -r .token)

curl -X POST https://api.tallow.app/api/email/send \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "John Doe",
    "files": [{
      "filename": "document.pdf",
      "content": "JVBERi0xLjQK...",
      "size": 102400,
      "contentType": "application/pdf",
      "checksum": "abc123..."
    }],
    "expiresIn": 86400,
    "maxDownloads": 5
  }'
```

**Required Fields:**

- recipientEmail (RFC 5322 valid)
- senderName (1-100 chars)
- files (array, min 1)

**Rate Limit:** 3/min (strict)

### Send Batch Email (100 recipients max)

```bash
curl -X POST https://api.tallow.app/api/email/batch \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "recipients": ["user1@example.com", "user2@example.com"],
    "senderName": "John Doe",
    "files": [...],
    "compress": true
  }'

# Response:
{
  "success": true,
  "batch": {
    "batchId": "batch_uuid",
    "sent": 2,
    "failed": 0,
    "total": 2
  }
}
```

**Limits:**

- Max 100 recipients
- Max 500 MB total
- Rate limit: 3/min

### Check Email Status

```bash
curl -X GET https://api.tallow.app/api/email/status/transfer_uuid_12345

# Response:
{
  "success": true,
  "status": {
    "id": "transfer_uuid",
    "recipientEmail": "user@example.com",
    "status": "delivered",
    "downloads": 2,
    "maxDownloads": 5,
    "expiresAt": "2026-02-04T10:30:00.000Z"
  }
}
```

**Status Values:** pending, sent, delivered, failed, expired, completed

**Rate Limit:** 10/min (generous)

---

## Room Management

### Create Room

```bash
curl -X POST https://api.tallow.app/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "id": "room123",
    "code": "ABCD1234",
    "name": "Team Room",
    "ownerId": "owner123",
    "ownerName": "John Doe",
    "password": "optional_secure_password",
    "maxMembers": 10,
    "expiresAt": "2026-02-10T10:30:00.000Z"
  }'

# Response:
{
  "success": true,
  "room": {
    "id": "room123",
    "code": "ABCD1234",
    "isPasswordProtected": true,
    "createdAt": "2026-02-03T10:30:00.000Z"
  }
}
```

**Code Format:** 4-8 alphanumeric (uppercase): `[A-Z0-9]{4,8}`

**Password:** 4-128 chars (hashed with PBKDF2, 600k iterations)

**Rate Limit:** 10/min (POST), 60/min (GET), 30/min (DELETE)

### Get Room Info

```bash
curl -X GET "https://api.tallow.app/api/rooms?code=ABCD1234"

# Response:
{
  "id": "room123",
  "code": "ABCD1234",
  "name": "Team Room",
  "memberCount": 3,
  "isPasswordProtected": true,
  "createdAt": "2026-02-03T10:30:00.000Z"
}
```

### Delete Room (Owner Only)

```bash
curl -X DELETE "https://api.tallow.app/api/rooms?code=ABCD1234&ownerId=owner123" \
  -H "X-CSRF-Token: $TOKEN"

# Response:
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**Authorization:** Timing-safe comparison (owner ownerId required)

---

## Health & Monitoring

### Readiness Check

```bash
curl -X GET https://api.tallow.app/api/health/readiness

# Returns 200 if ready, 503 if not
{
  "status": "ready",
  "checks": [
    {
      "name": "environment",
      "status": "healthy"
    },
    {
      "name": "memory",
      "status": "healthy"
    }
  ]
}
```

### Detailed Health (Protected)

```bash
curl -X GET https://api.tallow.app/api/health/detailed \
  -H "Authorization: Bearer $HEALTH_TOKEN"

# Response includes:
# - Memory usage (percentage, heap info)
# - Environment config status
# - Metrics collection status
# - Monitoring integrations
# - CPU count and platform info
```

### Prometheus Metrics

```bash
curl -X GET https://api.tallow.app/api/metrics \
  -H "Authorization: Bearer $METRICS_TOKEN"

# Returns OpenMetrics format text
# - Request counts
# - Request duration histograms
# - Active request gauges
# - File transfer counters
# - Bytes transferred counters
```

---

## Payment Integration

### Create Stripe Checkout Session

```bash
curl -X POST https://api.tallow.app/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "amount": 100
  }'

# Response:
{
  "url": "https://checkout.stripe.com/pay/cs_test_a1b2c3d4e5f6..."
}
```

**Amount:** Cents (USD)

- Minimum: 100 ($1.00)
- Maximum: 99999900 ($999,999.00)

**Rate Limit:** 3/min

---

## Rate Limiting Summary

| Category    | Limit  | Window |
| ----------- | ------ | ------ |
| Strict      | 3/min  | 60s    |
| Moderate    | 5/min  | 60s    |
| Generous    | 10/min | 60s    |
| Room GET    | 60/min | 60s    |
| Room POST   | 10/min | 60s    |
| Room DELETE | 30/min | 60s    |

**Response:** 429 Too Many Requests

---

## Error Codes Reference

| Code | Meaning             | Action                                  |
| ---- | ------------------- | --------------------------------------- |
| 400  | Bad Request         | Check parameters and format             |
| 401  | Unauthorized        | Verify credentials/token                |
| 403  | Forbidden           | CSRF token invalid or permission denied |
| 404  | Not Found           | Resource doesn't exist                  |
| 410  | Gone                | Resource expired or deleted             |
| 429  | Too Many Requests   | Wait and retry with backoff             |
| 500  | Server Error        | Retry or contact support                |
| 503  | Service Unavailable | Dependency missing or offline           |

---

## Common Workflows

### Complete File Transfer Flow

```bash
# 1. Get CSRF token
TOKEN=$(curl -s https://api.tallow.app/api/csrf-token | jq -r .token)

# 2. Send file via email
RESPONSE=$(curl -s -X POST https://api.tallow.app/api/email/send \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "John",
    "files": [...]
  }')

TRANSFER_ID=$(echo $RESPONSE | jq -r .transfer.id)

# 3. Check delivery status (later)
curl -s https://api.tallow.app/api/email/status/$TRANSFER_ID | jq .
```

### Room-Based Team File Sharing

```bash
# 1. Create room
curl -X POST https://api.tallow.app/api/rooms \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{
    "id": "project_alpha",
    "code": "PROJ2026",
    "ownerId": "user1",
    "maxMembers": 20
  }'

# 2. Share room code with team
# Other members use: /api/rooms?code=PROJ2026

# 3. Clean up when done
curl -X DELETE "https://api.tallow.app/api/rooms?code=PROJ2026&ownerId=user1" \
  -H "X-CSRF-Token: $TOKEN"
```

---

## Environment Variables

### Required

```bash
NODE_ENV=production
NEXT_PUBLIC_SIGNALING_URL=wss://signaling.example.com
NEXTAUTH_SECRET=random_secret_32_bytes_min
```

### Optional (Email)

```bash
RESEND_API_KEY=re_xxxx
RESEND_WEBHOOK_SECRET=xxxx
```

### Optional (Payment)

```bash
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

### Optional (Security)

```bash
CRON_SECRET=random_secret
METRICS_TOKEN=random_secret
HEALTH_CHECK_TOKEN=random_secret
API_KEY=random_secret
```

---

## Testing Checklist

- [ ] Generate CSRF token (expires per session)
- [ ] Test file download with valid credentials
- [ ] Test file download with invalid key (403)
- [ ] Test rate limiting (429 after 10 requests/min)
- [ ] Create room with valid code format
- [ ] Delete room as owner (succeeds)
- [ ] Delete room as non-owner (403)
- [ ] Send email (requires API key)
- [ ] Check email status
- [ ] Verify webhook signatures
- [ ] Health check returns 200
- [ ] Readiness check passes

---

## Curl Examples Summary

**All in one file** - Save as `tallow-api-examples.sh`:

```bash
#!/bin/bash

API_URL="https://api.tallow.app/api"
TOKEN=""

# Get CSRF token
get_token() {
  TOKEN=$(curl -s $API_URL/csrf-token | jq -r .token)
  echo "Token: $TOKEN"
}

# Health check
health_check() {
  curl -s $API_URL/health | jq .
}

# Create room
create_room() {
  curl -s -X POST $API_URL/rooms \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $TOKEN" \
    -d '{
      "id": "room123",
      "code": "TEST1234",
      "ownerId": "owner1",
      "ownerName": "Owner"
    }' | jq .
}

# Get room
get_room() {
  curl -s "$API_URL/rooms?code=TEST1234" | jq .
}

# Main
get_token
health_check
create_room
get_room
```

---

## Documentation Links

- **Full API Documentation:** `/TALLOW_API_DOCUMENTATION.md`
- **OpenAPI 3.1 Spec:** `/TALLOW_OPENAPI_3.1.yaml`
- **GitHub Repository:** https://github.com/tallow/tallow
- **Issue Tracker:** https://github.com/tallow/tallow/issues

---

## Support

For API issues:

1. Check status endpoint: `/api/health`
2. Review rate limits in response headers
3. Verify CSRF token freshness
4. Check webhook signature (for webhooks)
5. Enable detailed health check: `/api/health/detailed`

**Contact:** support@tallow.app
