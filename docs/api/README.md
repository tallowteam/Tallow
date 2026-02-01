# TALLOW API Documentation

Complete API reference for TALLOW - Quantum-Resistant P2P File Transfer Platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [API Reference](./openapi.yaml)
- [Examples](#examples)

## Getting Started

The TALLOW API provides programmatic access to file transfer, room management, and email notifications.

### Base URLs

- **Production**: `https://tallow.manisahome.com/api`
- **Development**: `http://localhost:3000/api`

### Quick Example

```bash
# Get CSRF token
curl https://tallow.manisahome.com/api/csrf-token

# Create a transfer room
curl -X POST https://tallow.manisahome.com/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "id": "room-123",
    "code": "ABCD1234",
    "name": "My Room",
    "ownerId": "user-456",
    "ownerName": "John Doe"
  }'
```

## Authentication

TALLOW uses multiple authentication methods depending on the endpoint:

### 1. API Key Authentication

For email and administrative endpoints:

```bash
curl -H "X-API-Key: your-api-key" \
  https://tallow.manisahome.com/api/send-welcome
```

**Generate an API key:**
```bash
openssl rand -hex 32
```

Set in environment:
```env
API_SECRET_KEY=your_generated_key
```

### 2. CSRF Token

For state-changing operations (POST, PUT, DELETE):

```javascript
// 1. Get CSRF token
const tokenRes = await fetch('/api/csrf-token');
const { token } = await tokenRes.json();

// 2. Use in subsequent requests
await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token
  },
  body: JSON.stringify({ /* request body */ })
});
```

### 3. Bearer Token

For metrics and monitoring:

```bash
curl -H "Authorization: Bearer your-metrics-token" \
  https://tallow.manisahome.com/api/metrics
```

### 4. Webhook Signatures

Stripe and Resend webhooks are verified via signature headers:
- Stripe: `stripe-signature`
- Resend: `resend-signature`

## Rate Limiting

All endpoints are rate-limited per IP address:

| Endpoint Category | Limit |
|------------------|-------|
| Email endpoints | 3-5 requests/minute |
| Stripe checkout | 3 requests/minute |
| Room operations | 10-60 requests/minute |
| CSRF token | 30 requests/minute |
| File downloads | 10 requests/minute |

### Rate Limit Headers

Responses include:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706500000
```

When rate limited (429):
```
Retry-After: 30
```

## API Categories

### 🔐 Payments
- `POST /stripe/create-checkout-session` - Create donation checkout
- `POST /stripe/webhook` - Process Stripe events

### 📧 Email
- `POST /send-welcome` - Send welcome email
- `POST /send-share-email` - Send share notification
- `POST /email/send` - Send file transfer email
- `POST /email/batch` - Batch file transfers
- `GET /email/download/:id` - Download transferred file
- `GET /email/status/:id` - Check delivery status

### 🏠 Rooms
- `GET /rooms?code=XXXX` - Get room info
- `POST /rooms` - Create new room
- `DELETE /rooms?code=XXXX&ownerId=YYY` - Delete room

### 🔒 Security
- `GET /csrf-token` - Generate CSRF token

### 📊 Health & Monitoring
- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

### 🧹 Maintenance
- `GET /cron/cleanup` - Cleanup expired data

## Examples

### Create a Password-Protected Room

```javascript
const response = await fetch('/api/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'room-uuid-123',
    code: 'SECURE42',
    name: 'Confidential Files',
    ownerId: 'user-uuid-456',
    ownerName: 'Jane Smith',
    password: 'my-secret-password',
    maxMembers: 5,
    expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
  })
});

const { success, room } = await response.json();
```

### Send File via Email

```javascript
// Get CSRF token first
const tokenRes = await fetch('/api/csrf-token');
const { token } = await tokenRes.json();

// Send encrypted file
const response = await fetch('/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token
  },
  body: JSON.stringify({
    recipientEmail: 'recipient@example.com',
    senderName: 'John Doe',
    files: [{
      filename: 'document.pdf',
      content: btoa('file content'), // base64 encode
      size: 102400,
      contentType: 'application/pdf'
    }],
    password: 'optional-password',
    expiresIn: 86400000, // 24 hours
    maxDownloads: 3,
    notifyOnDownload: true
  })
});

const { success, transfer } = await response.json();
console.log('Transfer ID:', transfer.id);
```

### Check Room Status

```javascript
const response = await fetch('/api/rooms?code=ABCD1234');

if (response.status === 404) {
  console.log('Room not found');
} else if (response.status === 410) {
  console.log('Room expired');
} else {
  const room = await response.json();
  console.log('Room members:', room.memberCount);
  console.log('Password protected:', room.isPasswordProtected);
}
```

### Monitor File Transfer Status

```javascript
const transferId = 'transfer-uuid-123';

// Poll every 5 seconds
const interval = setInterval(async () => {
  const response = await fetch(`/api/email/status/${transferId}`);
  const { status } = await response.json();

  console.log('Status:', status.status);
  console.log('Downloads:', status.downloadsCount);

  if (['downloaded', 'expired', 'failed'].includes(status.status)) {
    clearInterval(interval);
  }
}, 5000);
```

## Error Handling

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "details": "Optional additional details",
  "field": "Optional field name for validation errors"
}
```

### Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Provide valid API key/token |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 410 | Gone | Resource expired |
| 429 | Too Many Requests | Wait and retry |
| 500 | Internal Error | Contact support |
| 503 | Service Unavailable | Service not configured |

## Best Practices

### 1. Always Check Response Status

```javascript
const response = await fetch('/api/rooms', { method: 'POST', ... });

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error);
}

const data = await response.json();
```

### 2. Handle Rate Limits

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    const retryAfter = response.headers.get('Retry-After');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Validate Input Before Sending

```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateRoomCode(code) {
  const regex = /^[A-Z0-9]{4,8}$/;
  return regex.test(code);
}
```

### 4. Use Exponential Backoff for Retries

```javascript
async function exponentialBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Webhooks

### Stripe Webhooks

Configure in Stripe Dashboard:
```
Endpoint: https://tallow.manisahome.com/api/stripe/webhook
Events: checkout.session.completed, payment_intent.succeeded
```

### Resend Email Webhooks

Configure in Resend Dashboard:
```
Endpoint: https://tallow.manisahome.com/api/email/webhook
Events: email.sent, email.delivered, email.opened, email.clicked
```

### Webhook Verification

All webhooks are verified using signature headers. Never skip verification in production:

```javascript
// Stripe webhook signature verification
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);

// Resend webhook signature verification
const signature = req.headers['resend-signature'];
// Verify HMAC-SHA256 signature
```

## SDKs and Libraries

### Official SDKs

Currently, TALLOW provides a REST API. You can use any HTTP client:

**JavaScript/TypeScript:**
```javascript
import fetch from 'node-fetch';
```

**Python:**
```python
import requests
```

**Go:**
```go
import "net/http"
```

### Community SDKs

Coming soon! Contributions welcome.

## Support

- **Documentation**: https://tallow.manisahome.com/docs
- **GitHub Issues**: https://github.com/your-org/tallow/issues
- **Email**: support@tallow.example

## Changelog

See [CHANGELOG.md](../../CHANGELOG.md) for API version history.
