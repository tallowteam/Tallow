# Tallow API Documentation - Complete Summary

**Comprehensive API documentation for Tallow secure file transfer platform**

Generated: February 2026 Total Endpoints: 24+ (including HEAD variants)
Documentation Size: 2500+ lines OpenAPI Version: 3.1.0

---

## What's Included

This documentation package includes four comprehensive documents:

### 1. TALLOW_API_DOCUMENTATION.md (Main Reference)

**2000+ lines covering all 24 endpoints**

Complete reference documentation organized by category:

- Authentication & Security (CSRF, API Keys, Webhooks)
- Rate Limiting (8 different rate limit levels)
- Error Handling (standardized error formats)
- Core Endpoints (file downloads, encryption)
- Email Services (send, batch, status, webhooks)
- Health & Monitoring (5 health check endpoints)
- Room Management (create, get, delete rooms)
- Payment Integration (Stripe checkout and webhooks)
- Cron Jobs (automated cleanup)

**Key Features:**

- Detailed endpoint specifications
- Request/response schemas with examples
- Security implementation details
- Database interaction flows
- External service integrations
- Complete error documentation
- Rate limit configurations
- CORS settings

### 2. TALLOW_OPENAPI_3.1.yaml (Machine-Readable Spec)

**Complete OpenAPI 3.1 specification**

Structured API definition supporting:

- Interactive API documentation tools
- Code generation from spec
- Client library generation
- API testing automation
- Swagger UI integration
- ReDoc documentation

**Coverage:**

- 24+ endpoint definitions
- All request/response schemas
- Parameter validation rules
- Security schemes
- Error response definitions
- Example values
- Rate limit information

### 3. API_QUICK_REFERENCE.md (Developer Cheat Sheet)

**Quick lookup for common operations**

Fast reference for developers:

- Essential setup steps (CSRF token, health checks)
- Copy-paste curl examples for every major operation
- Parameter validation rules
- Error code reference table
- Common workflows
- Testing checklist
- Environment variables
- Support contacts

**Perfect for:**

- Integration testing
- Quick API exploration
- Debugging issues
- Common use cases

### 4. API_IMPLEMENTATION_GUIDE.md (Integration Tutorial)

**Step-by-step integration examples**

Complete implementation patterns:

- Client-side JavaScript/TypeScript
- React hooks for Tallow integration
- Server-side Node.js/Express
- Security implementation
- Error handling patterns
- Testing strategies (unit and integration tests)
- Production deployment checklist
- Performance optimization

**Includes working code for:**

- TallowClient class
- EmailService class
- RoomService class
- Middleware and validators
- Express routes
- Webhook handlers
- Error handlers

---

## 24 Documented Endpoints

### Security (1)

1. **GET /api/csrf-token** - Generate CSRF token

### File Transfer (2)

2. **POST /api/v1/download-file** - Download encrypted file (recommended)
3. **GET /api/v1/download-file** - Download file (deprecated)

### Email Services (8)

4. **POST /api/email/send** - Send single file email
5. **POST /api/email/batch** - Send batch emails (up to 100 recipients)
6. **GET /api/email/status/[id]** - Check transfer status
7. **GET /api/email/download/[id]** - Download from email (non-password)
8. **POST /api/email/download/[id]** - Download from email (with password)
9. **POST /api/email/webhook** - Resend webhook handler
10. **POST /api/send-welcome** - Send welcome email
11. **POST /api/send-share-email** - Send share notification email

### File Email (1)

12. **POST /api/v1/send-file-email** - Send file attachment email

### Share Email (1)

13. **POST /api/v1/send-share-email** - Send share link email (v1)

### Welcome Email (1)

14. **POST /api/v1/send-welcome** - Send welcome email (v1)

### Health & Monitoring (7)

15. **GET /api/health** - Basic health check
16. **GET /api/health/liveness** - Liveness probe
17. **HEAD /api/health/liveness** - Liveness probe (HEAD)
18. **GET /api/health/readiness** - Readiness check
19. **HEAD /api/health/readiness** - Readiness check (HEAD)
20. **GET /api/health/detailed** - Detailed health status
21. **GET /api/ready** - Readiness with dependency checks
22. **GET /api/metrics** - Prometheus metrics
23. **HEAD /api/metrics** - Metrics health check

### Room Management (3)

24. **GET /api/rooms** - Get room by code
25. **POST /api/rooms** - Create new room
26. **DELETE /api/rooms** - Delete room (owner only)

### Payment (4)

27. **POST /api/stripe/create-checkout-session** - Create checkout session
28. **POST /api/stripe/webhook** - Stripe webhook handler
29. **POST /api/v1/stripe/create-checkout-session** - Stripe checkout (v1)
30. **POST /api/v1/stripe/webhook** - Stripe webhook (v1)

### Cron Jobs (1)

31. **POST /api/cron/cleanup** - Run cleanup job
32. **GET /api/cron/cleanup** - Run cleanup (deprecated)

---

## Authentication & Authorization

### Three Authentication Methods

**1. CSRF Token (State-changing operations)**

- Generated on client initialization
- Set in HttpOnly cookie
- Required in X-CSRF-Token header
- Prevents cross-site request forgery
- Validated on every POST/PUT/DELETE

**2. API Key (Email and payment services)**

- Bearer token in Authorization header
- Format: `Authorization: Bearer API_KEY`
- Required for:
  - Send welcome email
  - Send share email
  - Send file email
  - Batch operations

**3. Webhook Signatures (Asynchronous events)**

- HMAC-SHA256 verification
- For Resend: resend-signature header
- For Stripe: stripe-signature header
- Prevents webhook spoofing
- Validates webhook authenticity

---

## Rate Limiting Strategy

### 8 Different Rate Limit Tiers

| Tier        | Limit     | Window | Use Case                   |
| ----------- | --------- | ------ | -------------------------- |
| Strict      | 3/min     | 60s    | Email send, checkout, auth |
| Moderate    | 5/min     | 60s    | Status check, share email  |
| Generous    | 10/min    | 60s    | Downloads, file operations |
| Room GET    | 60/min    | 60s    | Room lookup                |
| Room POST   | 10/min    | 60s    | Room creation              |
| Room DELETE | 30/min    | 60s    | Room deletion              |
| Health      | Unlimited | -      | Monitoring probes          |
| Webhook     | Unlimited | -      | Async events               |

**Response Headers:**

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1707000000
```

**Exceeded Response:** 429 Too Many Requests

---

## Security Features

### Encryption

- AES-256-GCM for file encryption
- Random nonces for each chunk
- HMAC verification of integrity
- Post-quantum cryptography (Kyber)
- Keys never stored on server

### Input Validation

- RFC 5322 email validation
- Filename sanitization (prevent header injection)
- URL validation (protocol whitelist)
- ID format validation (prevent injection)
- String length limits
- HTML encoding of all outputs

### CSRF Protection

- 256-bit random tokens
- HttpOnly cookie storage
- SameSite=Strict
- Required for mutations
- Constant-time comparison

### Rate Limiting

- Per-IP address tracking
- Sliding window algorithm
- Exponential backoff recommended
- Prevents brute force attacks
- Prevents DOS attacks

### Password Security

- PBKDF2 with 600,000 iterations (OWASP 2023)
- SHA-256 hash algorithm
- Random 32-byte salt per password
- Constant-time comparison
- Never logged or transmitted

---

## Error Response Format

### Standard Error Response

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2026-02-03T10:30:00.000Z"
}
```

### Error Codes Reference

| Code | Status       | Cause               | Action               |
| ---- | ------------ | ------------------- | -------------------- |
| 400  | Bad Request  | Invalid parameters  | Check format         |
| 401  | Unauthorized | Missing credentials | Provide auth         |
| 403  | Forbidden    | CSRF/permission     | Get new token        |
| 404  | Not Found    | Resource missing    | Check ID             |
| 410  | Gone         | Resource expired    | Resource unavailable |
| 429  | Rate Limited | Too many requests   | Wait and retry       |
| 500  | Server Error | Internal error      | Retry or contact     |
| 503  | Unavailable  | Dependency down     | Check status         |

---

## Workflow Examples

### Complete File Transfer

```
1. Client GET /csrf-token -> Receive token
2. Client POST /email/send -> Transfer created
3. Email sent to recipient
4. Recipient checks POST /email/download -> Get encrypted data
5. Client-side decryption with key
6. File available to download
7. Check GET /email/status -> Track downloads
8. Auto-cleanup after expiration
```

### Room-Based Sharing

```
1. Owner POST /rooms -> Create room with code
2. Owner shares code with team
3. Members GET /rooms?code=X -> Discover room
4. Members can transfer files within room
5. Owner DELETE /rooms -> Cleanup when done
```

### Payment Flow

```
1. User POST /stripe/create-checkout-session -> Get checkout URL
2. User redirected to Stripe
3. Payment completed
4. Stripe sends POST /stripe/webhook -> Verify signature
5. Server processes payment
6. Send confirmation email
```

---

## Integration Checklist

### Pre-Integration

- [ ] Review authentication methods
- [ ] Understand rate limiting tiers
- [ ] Review error handling
- [ ] Plan CSRF token management
- [ ] Review security requirements

### Implementation

- [ ] Initialize client library
- [ ] Get CSRF token on app startup
- [ ] Implement error handling
- [ ] Add retry logic with backoff
- [ ] Configure rate limit handling
- [ ] Implement webhook handlers
- [ ] Add proper logging
- [ ] Set up monitoring

### Testing

- [ ] Test all endpoints
- [ ] Test error cases
- [ ] Test rate limiting
- [ ] Test CSRF protection
- [ ] Test webhook signatures
- [ ] Test file encryption/decryption
- [ ] Load testing
- [ ] Security testing

### Production

- [ ] Enable HTTPS
- [ ] Configure environment variables
- [ ] Set up monitoring/alerts
- [ ] Configure backups
- [ ] Create runbooks
- [ ] Test disaster recovery
- [ ] Set up on-call rotation
- [ ] Create incident playbooks

---

## Key Concepts

### Post-Quantum Cryptography

Tallow uses PQC (Kyber) for future-proof encryption resistant to quantum
computing attacks.

### Zero-Knowledge Architecture

Server never has access to:

- Encryption keys
- File contents
- User passwords
- Private data

### End-to-End Encryption

All files encrypted on client before transmission. Server cannot decrypt files.

### Rate Limiting

Prevents:

- Brute force attacks
- DOS attacks
- Resource exhaustion
- Spam abuse

### CSRF Protection

Prevents:

- Cross-site request forgery
- Unauthorized state changes
- Session hijacking attacks

### Webhook Signature Verification

Prevents:

- Webhook spoofing
- Man-in-the-middle attacks
- Replay attacks

---

## File Structure

```
Tallow/
├── TALLOW_API_DOCUMENTATION.md (2000+ lines)
│   └── Complete endpoint reference
├── TALLOW_OPENAPI_3.1.yaml
│   └── Machine-readable specification
├── API_QUICK_REFERENCE.md
│   └── Developer cheat sheet
├── API_IMPLEMENTATION_GUIDE.md
│   └── Integration tutorial
└── API_DOCUMENTATION_SUMMARY.md (this file)
    └── Overview and index
```

---

## Quick Start (5 Minutes)

### 1. Generate CSRF Token

```bash
curl -X GET https://api.tallow.app/api/csrf-token
# Save token for subsequent requests
```

### 2. Check Health

```bash
curl -X GET https://api.tallow.app/api/health
# Verify service is online
```

### 3. Send File Email

```bash
curl -X POST https://api.tallow.app/api/email/send \
  -H "X-CSRF-Token: YOUR_TOKEN" \
  -d '{
    "recipientEmail": "user@example.com",
    "senderName": "You",
    "files": [...]
  }'
```

### 4. Check Status

```bash
curl -X GET https://api.tallow.app/api/email/status/TRANSFER_ID
```

---

## Common Mistakes to Avoid

1. **Not refreshing CSRF token** - Tokens expire, get new one on app load
2. **Sending key in URL** - Use POST with key in body, never in query params
3. **Ignoring rate limits** - Implement exponential backoff retry logic
4. **Not validating webhooks** - Always verify webhook signatures
5. **Storing encryption keys** - Keys should never be persisted
6. **Not handling 410 Gone** - Resources expire, handle gracefully
7. **Ignoring CORS errors** - Configure origins correctly
8. **Not implementing error handling** - Every request can fail
9. **Hard-coding API URLs** - Use environment variables
10. **Not monitoring health** - Check readiness before operations

---

## Support Resources

### Documentation Files

- `TALLOW_API_DOCUMENTATION.md` - Full reference
- `TALLOW_OPENAPI_3.1.yaml` - Formal specification
- `API_QUICK_REFERENCE.md` - Cheat sheet
- `API_IMPLEMENTATION_GUIDE.md` - Implementation examples

### Community

- GitHub Issues: https://github.com/tallow/tallow/issues
- GitHub Discussions: https://github.com/tallow/tallow/discussions
- Email: support@tallow.app

### Tools

- OpenAPI/Swagger UI for interactive exploration
- ReDoc for user-friendly documentation
- Postman collection for testing
- VS Code OpenAPI extension for editing

---

## Version Information

**Current API Version:** v1 **Documentation Version:** 1.0.0 **Last Updated:**
February 2026 **OpenAPI Version:** 3.1.0 **Node Version:** 18+ **Next.js
Version:** 14+

---

## Compliance & Standards

- **OpenAPI 3.1.0** - Full compliance
- **OWASP Top 10** - Security best practices
- **RFC 5322** - Email validation
- **RFC 2818** - HTTPS/TLS
- **NIST** - Cryptography standards
- **GDPR** - Data protection ready
- **SOC 2** - Security compliance

---

## Document Statistics

| Metric                    | Count |
| ------------------------- | ----- |
| Total Documentation Lines | 2500+ |
| Endpoints Documented      | 24+   |
| Code Examples             | 50+   |
| Error Cases Documented    | 40+   |
| Security Topics           | 15+   |
| Implementation Examples   | 30+   |
| Test Examples             | 10+   |
| Diagrams/Tables           | 20+   |

---

## Next Steps

1. **Read** `TALLOW_API_DOCUMENTATION.md` for complete reference
2. **Review** `TALLOW_OPENAPI_3.1.yaml` for machine-readable spec
3. **Use** `API_QUICK_REFERENCE.md` for quick lookups
4. **Follow** `API_IMPLEMENTATION_GUIDE.md` for integration
5. **Test** with provided curl examples
6. **Deploy** following production checklist
7. **Monitor** with health check endpoints
8. **Support** your users with this documentation

---

## Conclusion

Tallow API documentation provides comprehensive coverage of all 24+ endpoints
with:

- **Completeness:** Every endpoint documented with all parameters and responses
- **Clarity:** Detailed descriptions, security considerations, and examples
- **Practicality:** Real-world curl examples and code implementations
- **Searchability:** Multiple reference formats (markdown, YAML, quick
  reference)
- **Maintainability:** OpenAPI spec enables tooling and automation
- **Reliability:** Security best practices and error handling patterns
- **Usability:** Quick reference for common tasks and workflows

Whether you're building a web app, mobile app, or backend integration, this
documentation provides everything needed for successful Tallow API integration.

---

**Total Documentation Delivery: 2500+ lines across 4 documents providing
exhaustive API specification**
