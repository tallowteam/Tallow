# Error Code Reference

This document provides a comprehensive reference for all error codes returned by the Tallow API.

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": "Additional context (optional)",
  "field": "fieldName (for validation errors)"
}
```

## HTTP Status Codes

| Status | Meaning | When Used |
|--------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful, no body (OPTIONS) |
| 400 | Bad Request | Invalid input or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but not permitted |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 410 | Gone | Resource expired or deleted |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service not configured |

## Error Codes by Category

### Authentication Errors (AUTH_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `AUTH_MISSING_KEY` | 401 | Missing API key | Add `X-API-Key` header |
| `AUTH_INVALID_KEY` | 401 | Invalid API key | Check API key value |
| `AUTH_EXPIRED_TOKEN` | 401 | Token has expired | Refresh authentication |
| `AUTH_INVALID_SIGNATURE` | 401 | Invalid webhook signature | Check webhook secret |
| `AUTH_CSRF_INVALID` | 403 | Invalid CSRF token | Fetch new CSRF token |
| `AUTH_CSRF_MISSING` | 403 | Missing CSRF token | Include X-CSRF-Token header |

### Validation Errors (VAL_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `VAL_MISSING_FIELD` | 400 | Required field missing | Include all required fields |
| `VAL_INVALID_EMAIL` | 400 | Invalid email format | Use valid email address |
| `VAL_INVALID_FORMAT` | 400 | Invalid field format | Check field requirements |
| `VAL_OUT_OF_RANGE` | 400 | Value out of allowed range | Use value within bounds |
| `VAL_TOO_LONG` | 400 | Field exceeds max length | Shorten the value |
| `VAL_TOO_SHORT` | 400 | Field below min length | Lengthen the value |
| `VAL_INVALID_JSON` | 400 | Invalid JSON body | Fix JSON syntax |
| `VAL_CONTENT_TYPE` | 400 | Invalid Content-Type | Use application/json |

### Room Errors (ROOM_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `ROOM_NOT_FOUND` | 404 | Room not found | Check room code |
| `ROOM_EXPIRED` | 410 | Room has expired | Create new room |
| `ROOM_FULL` | 400 | Room is at capacity | Wait or use different room |
| `ROOM_EXISTS` | 409 | Room code already exists | Use different code |
| `ROOM_INVALID_CODE` | 400 | Invalid room code format | Use 4-8 alphanumeric chars |
| `ROOM_INVALID_PASSWORD` | 401 | Incorrect password | Check password |
| `ROOM_NOT_OWNER` | 403 | Only owner can perform action | Use owner credentials |

### Transfer Errors (TRANSFER_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `TRANSFER_NOT_FOUND` | 404 | Transfer not found | Check transfer ID |
| `TRANSFER_EXPIRED` | 410 | Transfer has expired | Request new transfer |
| `TRANSFER_DOWNLOAD_LIMIT` | 410 | Download limit reached | Request new transfer |
| `TRANSFER_PASSWORD_REQUIRED` | 401 | Password required | Include password |
| `TRANSFER_INVALID_PASSWORD` | 401 | Invalid password | Check password |
| `TRANSFER_FILE_NOT_FOUND` | 404 | File not available | File may have been deleted |

### File Errors (FILE_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `FILE_NOT_FOUND` | 404 | File not found | Check file ID |
| `FILE_EXPIRED` | 410 | File has expired | Request new file |
| `FILE_INVALID_TOKEN` | 403 | Invalid download token | Get new download link |
| `FILE_DECRYPT_FAILED` | 400 | Decryption failed | Check encryption key |
| `FILE_SIZE_EXCEEDED` | 400 | File too large | Use smaller file |
| `FILE_TYPE_NOT_ALLOWED` | 400 | File type not permitted | Use allowed file type |

### Email Errors (EMAIL_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `EMAIL_SEND_FAILED` | 500 | Failed to send email | Retry or check email service |
| `EMAIL_INVALID_RECIPIENT` | 400 | Invalid recipient email | Check email address |
| `EMAIL_SERVICE_DOWN` | 503 | Email service unavailable | Retry later |
| `EMAIL_QUOTA_EXCEEDED` | 429 | Email quota exceeded | Wait for quota reset |
| `EMAIL_ATTACHMENT_TOO_LARGE` | 400 | Attachment exceeds limit | Use link mode instead |

### Payment Errors (PAY_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `PAY_STRIPE_NOT_CONFIGURED` | 503 | Stripe not configured | Contact administrator |
| `PAY_INVALID_AMOUNT` | 400 | Invalid payment amount | Use amount in valid range |
| `PAY_SESSION_FAILED` | 500 | Failed to create session | Retry |
| `PAY_WEBHOOK_FAILED` | 400 | Webhook processing failed | Check webhook payload |

### Rate Limit Errors (RATE_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait for reset |
| `RATE_LIMIT_IP` | 429 | IP rate limit exceeded | Wait or use different IP |
| `RATE_LIMIT_USER` | 429 | User rate limit exceeded | Wait for reset |

### Server Errors (SRV_*)

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `SRV_INTERNAL_ERROR` | 500 | Internal server error | Retry or report bug |
| `SRV_NOT_READY` | 503 | Service not ready | Wait and retry |
| `SRV_MAINTENANCE` | 503 | Service under maintenance | Try later |
| `SRV_UPSTREAM_ERROR` | 502 | Upstream service error | Retry later |

## Error Handling Examples

### JavaScript/TypeScript

```typescript
interface ApiError {
  error: string;
  code?: string;
  details?: string;
  field?: string;
}

async function makeApiCall(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error: ApiError = await response.json();

    switch (response.status) {
      case 400:
        handleValidationError(error);
        break;
      case 401:
        handleAuthError(error);
        break;
      case 403:
        handleForbiddenError(error);
        break;
      case 404:
        handleNotFoundError(error);
        break;
      case 429:
        handleRateLimitError(error, response.headers);
        break;
      case 500:
      case 502:
      case 503:
        handleServerError(error);
        break;
    }

    throw new Error(error.error);
  }

  return response.json();
}

function handleRateLimitError(error: ApiError, headers: Headers) {
  const retryAfter = headers.get('Retry-After');
  const resetTime = headers.get('X-RateLimit-Reset');

  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  console.log(`Limit resets at: ${new Date(Number(resetTime) * 1000)}`);
}
```

### Python

```python
import requests

def make_api_call(url, **kwargs):
    response = requests.request(**kwargs, url=url)

    if not response.ok:
        error = response.json()

        if response.status_code == 429:
            retry_after = response.headers.get('Retry-After')
            raise RateLimitError(
                error['error'],
                retry_after=int(retry_after) if retry_after else 60
            )

        raise ApiError(
            error.get('error', 'Unknown error'),
            code=error.get('code'),
            status=response.status_code
        )

    return response.json()
```

### cURL

```bash
# Making a request and handling errors
response=$(curl -s -w "\n%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  https://tallow.manisahome.com/api/v1/send-welcome \
  -d '{"email": "user@example.com", "name": "Test"}')

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

case $http_code in
  200) echo "Success: $body" ;;
  400) echo "Bad Request: $(echo $body | jq -r '.error')" ;;
  401) echo "Unauthorized: Check your API key" ;;
  429) echo "Rate Limited: Wait and retry" ;;
  *)   echo "Error ($http_code): $body" ;;
esac
```

## Rate Limit Headers

When rate limited, these headers are included:

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Max requests allowed | `10` |
| `X-RateLimit-Remaining` | Requests remaining | `0` |
| `X-RateLimit-Reset` | Unix timestamp of reset | `1706540000` |
| `Retry-After` | Seconds until retry | `45` |

## Best Practices

### 1. Always Check Status Codes

```typescript
if (!response.ok) {
  // Handle error based on status code
}
```

### 2. Implement Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        await sleep(parseInt(retryAfter) * 1000);
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

### 3. Handle Specific Error Codes

```typescript
switch (error.code) {
  case 'VAL_INVALID_EMAIL':
    showFieldError('email', 'Please enter a valid email');
    break;
  case 'ROOM_NOT_FOUND':
    showNotification('Room not found. Check the code and try again.');
    break;
  case 'RATE_LIMIT_EXCEEDED':
    showNotification('Too many requests. Please wait a moment.');
    break;
}
```

### 4. Log Errors for Debugging

```typescript
console.error('API Error:', {
  code: error.code,
  message: error.error,
  details: error.details,
  endpoint: url,
  timestamp: new Date().toISOString(),
});
```
