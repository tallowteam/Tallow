# OpenAPI Documentation - Integration Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Adding New Endpoints](#adding-new-endpoints)
4. [Testing Documentation](#testing-documentation)
5. [Deployment](#deployment)
6. [Maintenance](#maintenance)

## Getting Started

The OpenAPI documentation system provides three interfaces:

### 1. OpenAPI Specification (Machine-Readable)
```
GET /api/docs?format=json
GET /api/docs (with Accept: application/json header)
```

Returns the OpenAPI 3.1 specification as JSON, suitable for:
- Code generation
- Schema validation
- API testing tools (Postman, Insomnia)
- SDK generation

### 2. Swagger UI (Interactive Browser)
```
GET /api/docs
GET /api/docs?format=html (with Accept: text/html header)
```

Interactive documentation with:
- Try-it-out console
- Real-time API testing
- Request/response visualization
- Code examples

### 3. Custom Documentation Portal
```
GET /docs/api
```

Custom-built React component featuring:
- Interactive endpoint cards
- Sidebar navigation
- Code examples in multiple languages
- Dark mode support
- Mobile responsive design

## Development Setup

### File Structure

```
lib/docs/
├── openapi.ts          # OpenAPI spec definition

app/api/docs/
├── route.ts            # API endpoint (GET /api/docs)

app/docs/api/
├── page.tsx            # Documentation portal
└── page.module.css     # Portal styles
```

### Local Development

1. Start the development server:
```bash
npm run dev
```

2. Access documentation:
   - Swagger UI: http://localhost:3000/api/docs
   - JSON Spec: http://localhost:3000/api/docs?format=json
   - Portal: http://localhost:3000/docs/api

3. Test endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Create room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test-token" \
  -d '{"id":"test","code":"TEST","ownerId":"user","ownerName":"Test"}'
```

## Adding New Endpoints

### Step 1: Create the API Route

Create `app/api/your-endpoint/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Your endpoint description
 */
export const GET = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Your logic here
    return jsonResponse({ data: 'value' }, 200);
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
```

### Step 2: Add to OpenAPI Spec

Edit `lib/docs/openapi.ts` and add to the `paths` object:

```typescript
export const openApiSpec: OpenAPISpec = {
  // ... existing config ...
  paths: {
    // ... existing paths ...
    '/api/your-endpoint': {
      get: {
        operationId: 'getYourEndpoint',
        tags: ['YourTag'],
        summary: 'Short summary',
        description: 'Detailed description of what this endpoint does.',
        parameters: [
          {
            name: 'paramName',
            in: 'query',
            required: true,
            description: 'Parameter description',
            schema: {
              type: 'string',
              example: 'value'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/YourResponseSchema'
                },
                example: {
                  // Example response
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: 'curl -X GET http://localhost:3000/api/your-endpoint'
          },
          {
            lang: 'javascript',
            source: `fetch('http://localhost:3000/api/your-endpoint')
  .then(r => r.json())`
          },
          {
            lang: 'python',
            source: `import requests
requests.get('http://localhost:3000/api/your-endpoint').json()`
          }
        ]
      }
    }
  },
  components: {
    schemas: {
      // ... existing schemas ...
      YourResponseSchema: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'string',
            description: 'Your data field',
            example: 'value'
          }
        }
      }
    }
  }
};
```

### Step 3: Add to Tags (if new category)

Add to the `tags` array:

```typescript
tags: [
  // ... existing tags ...
  {
    name: 'YourTag',
    description: 'Description of endpoints in this category'
  }
]
```

### Step 4: Test Documentation

1. Verify the spec loads:
```bash
curl http://localhost:3000/api/docs?format=json | jq .
```

2. Check Swagger UI: http://localhost:3000/api/docs

3. Verify portal shows endpoint: http://localhost:3000/docs/api

## Testing Documentation

### Manual Testing

Use the "Try It Out" feature in:
1. Swagger UI: http://localhost:3000/api/docs
2. Custom Portal: http://localhost:3000/docs/api

### Automated Testing

#### cURL Tests

```bash
#!/bin/bash

# Test health endpoint
echo "Testing GET /api/health..."
curl -f http://localhost:3000/api/health || exit 1

# Test readiness
echo "Testing GET /api/health/readiness..."
curl -f http://localhost:3000/api/health/readiness || exit 1

# Test room creation
echo "Testing POST /api/rooms..."
curl -f -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: test" \
  -d '{"id":"test","code":"TEST","ownerId":"user","ownerName":"Test"}' || exit 1

echo "All tests passed!"
```

#### OpenAPI Spec Validation

```bash
# Download and validate with openapi-cli
npm install -g @openapitools/openapi-generator-cli

openapi-generator-cli validate -i http://localhost:3000/api/docs?format=json
```

#### Client Generation

Generate SDK clients from the spec:

```bash
# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3000/api/docs?format=json \
  -g typescript-fetch \
  -o ./generated-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:3000/api/docs?format=json \
  -g python \
  -o ./generated-client-py
```

### Postman Integration

1. Import the OpenAPI spec into Postman:
   - File > Import > Paste raw text
   - Paste the JSON from: http://localhost:3000/api/docs?format=json
   - Postman will create a collection with all endpoints

2. Set up environment variables:
```json
{
  "base_url": "http://localhost:3000",
  "csrf_token": "your-csrf-token"
}
```

3. Use in requests:
```
GET {{base_url}}/api/health
```

## Deployment

### Production Configuration

1. **Set production server URL** in `lib/docs/openapi.ts`:

```typescript
servers: [
  {
    url: 'https://api.tallow.app',
    description: 'Production server'
  }
]
```

2. **Configure CORS** environment variables:

```bash
# .env.production
ALLOWED_ORIGINS=https://tallow.app,https://api.tallow.app
```

3. **Enable caching** (already configured in `app/api/docs/route.ts`):

```typescript
'Cache-Control': 'public, max-age=3600' // 1 hour cache
```

### Docker Deployment

Include documentation in Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### Kubernetes Integration

Deploy with health probes:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tallow-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: tallow
        image: tallow:latest
        ports:
        - containerPort: 3000

        # Liveness probe (restart if dead)
        livenessProbe:
          httpGet:
            path: /api/health/liveness
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10

        # Readiness probe (remove from service if not ready)
        readinessProbe:
          httpGet:
            path: /api/health/readiness
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### CI/CD Pipeline

Add OpenAPI validation to your CI pipeline (GitHub Actions):

```yaml
name: API Documentation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Start server
        run: npm start &
        timeout-minutes: 5

      - name: Validate OpenAPI spec
        run: |
          npx @openapitools/openapi-generator-cli validate \
            -i http://localhost:3000/api/docs?format=json

      - name: Test endpoints
        run: |
          curl -f http://localhost:3000/api/health
          curl -f http://localhost:3000/api/health/liveness
          curl -f http://localhost:3000/api/health/readiness
```

## Maintenance

### Regular Tasks

#### Weekly
- Monitor API usage patterns
- Check for deprecated endpoints
- Review error rates

#### Monthly
- Update documentation for new features
- Review rate limit effectiveness
- Test code examples in all languages

#### Quarterly
- Security audit of endpoints
- Performance review
- Update dependencies

### Version Management

#### Adding API v2

1. Create new spec file:
```typescript
// lib/docs/openapi-v2.ts
export const openApiSpecV2: OpenAPISpec = {
  // ... v2 endpoints ...
};
```

2. Update route to support versioning:
```typescript
// app/api/docs/route.ts
const version = new URL(request.url).searchParams.get('version') || '1';
const spec = version === '2' ? openApiSpecV2 : openApiSpec;
```

3. Update documentation portal to show both versions

#### Deprecating Endpoints

Mark deprecated endpoints:

```typescript
'x-deprecated': true,
'x-deprecationDate': '2026-06-01',
'x-sunsetDate': '2026-09-01',
'x-successorEndpoint': '/api/v2/rooms'
```

### Monitoring

#### Key Metrics

```bash
# Monitor documentation endpoint performance
curl -w "@curl-metrics.txt" -o /dev/null -s \
  http://localhost:3000/api/docs?format=json

# Check rate limiting
curl -i http://localhost:3000/api/health | grep X-RateLimit

# Monitor health endpoints
watch 'curl -s http://localhost:3000/api/health | jq .'
```

#### Error Tracking

Add error monitoring to portal component:

```typescript
// Track documentation page errors
if (error) {
  console.error('Documentation load error:', error);
  // Send to error tracking service (Sentry, etc.)
}
```

## Troubleshooting

### Spec Not Loading

```bash
# Verify the endpoint
curl http://localhost:3000/api/docs?format=json

# Check for errors
curl -i http://localhost:3000/api/docs

# Test with specific format
curl http://localhost:3000/api/docs?format=json
curl http://localhost:3000/api/docs?format=html
```

### Swagger UI Not Rendering

1. Clear browser cache
2. Check browser console for errors
3. Verify CDN is accessible (swagger-ui-dist)
4. Test JSON format: http://localhost:3000/api/docs?format=json

### Portal Not Loading Endpoints

1. Open browser dev tools (F12)
2. Check Network tab for `/api/docs?format=json` request
3. Verify response is valid JSON
4. Check Console for JavaScript errors

### CSRF Token Issues

```bash
# Get CSRF token first
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r .token)

# Use in POST request
curl -X POST http://localhost:3000/api/rooms \
  -H "X-CSRF-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"test","code":"TEST","ownerId":"user","ownerName":"Test"}'
```

## Best Practices

### Documentation Quality

1. **Keep descriptions concise** - 1-2 sentences for summary
2. **Provide complete examples** - Show real-world usage
3. **Document error cases** - Include 400, 404, 500 responses
4. **Update regularly** - Keep pace with API changes
5. **Test code examples** - Verify they actually work

### Security

1. **Never include secrets** in examples
2. **Use example values** for tokens and credentials
3. **Document rate limits** clearly
4. **Mark CSRF endpoints** clearly
5. **Include auth headers** in examples

### Performance

1. **Cache the specification** (already configured)
2. **Lazy load code samples** (already implemented)
3. **Minimize spec size** - Use schema references
4. **Monitor endpoint latency** - Health checks
5. **Optimize Swagger UI** - Already using CDN

## Summary

The OpenAPI documentation system is production-ready with:

- Complete specification coverage of all 6 endpoints
- Interactive Swagger UI with try-it-out console
- Custom documentation portal with dark mode
- Code examples in 3 languages (cURL, JS, Python)
- Comprehensive error handling and security documentation
- Health monitoring endpoints for orchestration
- Rate limiting and CSRF protection

For updates or new endpoints, follow the integration guide above to keep documentation in sync with implementation.
