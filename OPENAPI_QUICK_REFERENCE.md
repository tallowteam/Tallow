# OpenAPI Documentation - Quick Reference

## Quick Links

- **OpenAPI Spec (JSON)**: http://localhost:3000/api/docs?format=json
- **Swagger UI**: http://localhost:3000/api/docs
- **Interactive Docs**: http://localhost:3000/docs/api

## API Endpoints at a Glance

### Health Check Endpoints

```bash
# Basic health check
GET /api/health

# Response (200 OK)
{
  "status": "ok",
  "service": "tallow",
  "version": "1.0.0",
  "timestamp": "2026-02-06T12:00:00Z",
  "uptime": 3600.5
}
```

```bash
# Liveness probe (Kubernetes)
GET /api/health/liveness
HEAD /api/health/liveness

# Response (200 OK)
{
  "status": "alive",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

```bash
# Readiness probe (checks dependencies)
GET /api/health/readiness
HEAD /api/health/readiness

# Response (200 OK if ready, 503 if not)
{
  "status": "ready",
  "timestamp": "2026-02-06T12:00:00Z",
  "checks": [
    { "name": "environment", "status": "healthy", "responseTime": 5 },
    { "name": "memory", "status": "healthy", "responseTime": 3 }
  ]
}
```

### Room Management Endpoints

```bash
# Get room information
GET /api/rooms?code=ABCD1234

# Response (200 OK)
{
  "id": "room-uuid-1234",
  "code": "ABCD1234",
  "name": "Team Transfer",
  "ownerId": "owner-uuid-5678",
  "ownerName": "John Doe",
  "createdAt": "2026-02-06T12:00:00Z",
  "expiresAt": "2026-02-07T12:00:00Z",
  "isPasswordProtected": true,
  "maxMembers": 10,
  "memberCount": 3
}
```

```bash
# Create new room (POST)
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: csrf-token-value" \
  -d '{
    "id": "room-uuid-1234",
    "code": "ABCD1234",
    "name": "Team Transfer",
    "ownerId": "owner-uuid-5678",
    "ownerName": "John Doe",
    "maxMembers": 10,
    "password": "SecurePass123",
    "expiresAt": "2026-02-07T12:00:00Z"
  }'

# Response (201 Created)
{
  "success": true,
  "room": {
    "id": "room-uuid-1234",
    "code": "ABCD1234",
    "name": "Team Transfer",
    "ownerId": "owner-uuid-5678",
    "createdAt": "2026-02-06T12:00:00Z",
    "expiresAt": "2026-02-07T12:00:00Z",
    "isPasswordProtected": true,
    "maxMembers": 10
  }
}
```

```bash
# Delete room (DELETE)
curl -X DELETE "http://localhost:3000/api/rooms?code=ABCD1234&ownerId=owner-uuid-5678" \
  -H "X-CSRF-Token: csrf-token-value"

# Response (200 OK)
{
  "success": true,
  "message": "Room deleted successfully"
}
```

## Request/Response Patterns

### All Endpoints Return JSON

```json
{
  "success": true,
  "data": { }
}
```

Or on error:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

### Required Headers

- `Content-Type: application/json` - For POST/PUT requests
- `X-CSRF-Token: value` - For state-changing operations (POST, PUT, DELETE)

### Optional Headers

- `Authorization: Bearer token` - JWT or session token
- `X-API-Key: key` - API key for programmatic access

## HTTP Status Codes

| Code | Meaning | Endpoints |
|------|---------|-----------|
| 200 | OK | Health, Get Room, Delete Room |
| 201 | Created | Create Room |
| 204 | No Content | CORS Preflight |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | CSRF token missing, not room owner |
| 404 | Not Found | Room not found |
| 409 | Conflict | Room code already exists |
| 410 | Gone | Room has expired |
| 422 | Validation Error | Invalid request data |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Dependencies offline |

## Rate Limits

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| GET /api/health | 100/min | 1 minute | Monitoring |
| GET /api/health/liveness | No limit | - | Fast checks |
| GET /api/health/readiness | No limit | - | Fast checks |
| GET /api/rooms | 60/min | 1 minute | Read access |
| POST /api/rooms | 10/min | 1 minute | Prevent spam |
| DELETE /api/rooms | 30/min | 1 minute | Moderate access |

## Code Examples

### JavaScript/Fetch

```javascript
// Get health status
const response = await fetch('http://localhost:3000/api/health');
const data = await response.json();
console.log(data);

// Create room
const roomData = {
  id: 'room-uuid-1234',
  code: 'ABCD1234',
  name: 'Team Transfer',
  ownerId: 'owner-uuid-5678',
  ownerName: 'John Doe',
  maxMembers: 10
};

const response = await fetch('http://localhost:3000/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(roomData)
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests

# Get health status
response = requests.get('http://localhost:3000/api/health')
print(response.json())

# Create room
room_data = {
    'id': 'room-uuid-1234',
    'code': 'ABCD1234',
    'name': 'Team Transfer',
    'ownerId': 'owner-uuid-5678',
    'ownerName': 'John Doe',
    'maxMembers': 10
}

headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf_token
}

response = requests.post(
    'http://localhost:3000/api/rooms',
    headers=headers,
    json=room_data
)
print(response.json())
```

### cURL

```bash
# Get health
curl http://localhost:3000/api/health

# Get room
curl "http://localhost:3000/api/rooms?code=ABCD1234"

# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: token" \
  -d '{"id":"room-1","code":"ABCD","ownerId":"owner-1","ownerName":"John"}'

# Delete room
curl -X DELETE "http://localhost:3000/api/rooms?code=ABCD&ownerId=owner-1" \
  -H "X-CSRF-Token: token"
```

## Error Handling

### Common Errors

```json
{
  "error": "Bad request",
  "code": "BAD_REQUEST",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

```json
{
  "error": "Room not found",
  "code": "NOT_FOUND",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

```json
{
  "error": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2026-02-06T12:00:00Z"
}
```

### Retry Strategy

For rate limiting (429) and service unavailable (503), use exponential backoff:

```javascript
async function retryRequest(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (response.status === 429 || response.status === 503) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Schema Reference

### Room Object

```json
{
  "id": "string (uuid)",
  "code": "string (4-8 alphanumeric)",
  "name": "string (max 50 chars)",
  "ownerId": "string (uuid)",
  "ownerName": "string (max 50 chars)",
  "createdAt": "ISO 8601 timestamp",
  "expiresAt": "ISO 8601 timestamp or null",
  "isPasswordProtected": "boolean",
  "maxMembers": "integer (2-50)",
  "memberCount": "integer (0+)"
}
```

### Health Response

```json
{
  "status": "ok or error",
  "service": "tallow",
  "version": "semantic version",
  "timestamp": "ISO 8601 timestamp",
  "uptime": "number (seconds)"
}
```

### Readiness Check

```json
{
  "name": "string (dependency name)",
  "status": "healthy or unhealthy",
  "responseTime": "number (milliseconds)",
  "error": "string (optional, if unhealthy)"
}
```

## Security

### CSRF Protection

All state-changing operations (POST, PUT, DELETE) require a CSRF token:

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "X-CSRF-Token: your-csrf-token" \
  ...
```

### Authentication (Optional)

Bearer token or API key:

```bash
curl -H "Authorization: Bearer your-jwt-token" http://localhost:3000/api/rooms

# or

curl -H "X-API-Key: your-api-key" http://localhost:3000/api/rooms
```

## Monitoring

### Health Check Patterns

```bash
# Kubernetes liveness probe
curl --fail http://localhost:3000/api/health/liveness || exit 1

# Docker health check
curl --fail http://localhost:3000/api/health || exit 1

# Load balancer readiness
curl -f http://localhost:3000/api/health/readiness || exit 1
```

### Metrics

Future: `/api/metrics` endpoint will provide Prometheus metrics.

## Documentation Files

- **OpenAPI Spec**: `lib/docs/openapi.ts`
- **API Route**: `app/api/docs/route.ts`
- **Portal Component**: `app/docs/api/page.tsx`
- **Portal Styles**: `app/docs/api/page.module.css`
- **Full Summary**: `OPENAPI_DOCUMENTATION_SUMMARY.md`
- **This File**: `OPENAPI_QUICK_REFERENCE.md`

## Version History

- **v1.0.0** (Current): Initial API with health checks and room management

## Support

- GitHub Issues: https://github.com/tallow/issues
- GitHub Discussions: https://github.com/tallow/discussions
- Email: support@tallow.app
