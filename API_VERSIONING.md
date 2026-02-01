# API Versioning Strategy

Tallow uses URI-based versioning for API endpoints to ensure backward compatibility and enable smooth API evolution.

## Version Format

All API endpoints follow the pattern:
```
/api/v{major}/resource/action
```

**Example:**
```
/api/v1/stripe/create-checkout-session
```

## Current Version: v1

### v1 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/stripe/create-checkout-session` | POST | Create Stripe checkout session for donations |
| `/api/v1/stripe/webhook` | POST | Handle Stripe webhook events |
| `/api/v1/send-welcome` | POST | Send welcome email to new users |
| `/api/v1/send-share-email` | POST | Send file sharing notification emails |

## Backward Compatibility

### Legacy Endpoints (Deprecated)

The following legacy endpoints are **deprecated** and redirect to v1:

- `/api/stripe/create-checkout-session` → `/api/v1/stripe/create-checkout-session`
- `/api/stripe/webhook` → `/api/v1/stripe/webhook`
- `/api/send-welcome` → `/api/v1/send-welcome`
- `/api/send-share-email` → `/api/v1/send-share-email`

**⚠️ Warning:** Legacy endpoints will be removed in version 2.0. Please migrate to versioned endpoints.

## Versioning Rules

### When to Bump Version

**Major Version (v1 → v2):**
- Breaking changes to request/response format
- Removed endpoints
- Changed authentication requirements
- Incompatible behavior changes

**Examples:**
- Changing `amount` from cents to dollars
- Renaming fields
- Removing required fields
- Changing error response format

### What Doesn't Require Version Bump

- Adding new optional fields to responses
- Adding new endpoints
- Fixing bugs
- Performance improvements
- Internal refactoring

## Migration Guide

### Updating Client Code

**Before (Legacy):**
```typescript
const response = await fetch('/api/send-welcome', {
  method: 'POST',
  body: JSON.stringify({ email, name }),
});
```

**After (v1):**
```typescript
const response = await fetch('/api/v1/send-welcome', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.API_SECRET_KEY, // Now required
  },
  body: JSON.stringify({ email, name }),
});
```

### Stripe Webhook Migration

**Update webhook URL in Stripe Dashboard:**

**Before:**
```
https://tallow.manisahome.com/api/stripe/webhook
```

**After:**
```
https://tallow.manisahome.com/api/v1/stripe/webhook
```

## Version Lifecycle

| Version | Status | Support End | Notes |
|---------|--------|-------------|-------|
| **v1** | ✅ Current | Ongoing | Stable, production-ready |
| Legacy (unversioned) | ⚠️ Deprecated | v2.0 Release | Use v1 instead |

## Best Practices

### For Clients

1. **Always use versioned endpoints** in production
2. **Specify API version** explicitly in URLs
3. **Handle version deprecation notices** in responses
4. **Test against new versions** before upgrading
5. **Monitor deprecation warnings** in logs

### For Developers

1. **Never break existing versions** after release
2. **Document all changes** in changelog
3. **Provide migration guides** for breaking changes
4. **Support old versions** for at least 6 months
5. **Use feature flags** for gradual rollouts

## Version Headers

The API includes version information in response headers:

```http
X-API-Version: v1
X-API-Deprecated: false
```

When an endpoint is deprecated:

```http
X-API-Version: v1
X-API-Deprecated: true
X-API-Sunset: 2026-12-31
X-API-Deprecation-Link: https://docs.tallow.example/migration/v1-to-v2
```

## Changelog

### v1.0.0 (2026-01-24)

**Added:**
- API key authentication for email endpoints
- Webhook idempotency for Stripe events
- XSS sanitization for email HTML
- Rate limiting with configurable windows

**Security:**
- Required `X-API-Key` header for `/send-welcome` and `/send-share-email`
- Input sanitization to prevent injection attacks

**Documentation:**
- OpenAPI 3.1 specification
- Request/response examples
- Authentication guide

## Future Plans

### v2 (Planned)

Potential changes under consideration:

- GraphQL endpoint for complex queries
- Batch operations support
- Webhook retry mechanism
- Enhanced error codes
- Request correlation IDs

**Timeline:** No confirmed release date

## Testing with Different Versions

```bash
# Test v1 endpoint
curl -X POST https://tallow.manisahome.com/api/v1/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Legacy endpoint (deprecated)
curl -X POST https://tallow.manisahome.com/api/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## Support

For API questions or migration help:

1. Check the [OpenAPI documentation](./openapi.yml)
2. Review [example requests](./examples/)
3. Open an issue on GitHub
4. Join our Discord community

---

**Last Updated:** 2026-01-24
**Current Version:** v1.0.0
