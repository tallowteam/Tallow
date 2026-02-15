/**
 * OpenAPI 3.1 Specification for Tallow API
 *
 * Comprehensive documentation of all REST API endpoints
 * with request/response schemas, security schemes, and examples.
 */

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      url: string;
    };
    license?: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
    variables?: Record<string, { default: string; enum?: string[] }>;
  }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
    responses?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description: string }>;
}

/**
 * Complete OpenAPI 3.1 specification for Tallow API
 */
export const openApiSpec: OpenAPISpec = {
  openapi: '3.1.0',
  info: {
    title: 'Tallow API',
    description: `
# Tallow API Documentation

Secure peer-to-peer file transfer API with end-to-end encryption, group transfers, and device discovery.

## Features

- **Secure File Transfer**: End-to-end encrypted P2P file transfers
- **Group Transfers**: Send files to multiple devices simultaneously using room codes
- **Device Discovery**: Automatic device discovery via mDNS on local networks
- **Health Monitoring**: Comprehensive health checks for container orchestration
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **CSRF Protection**: Secure cross-site request forgery protection
- **Metadata Stripping**: Automatic metadata removal from transferred files

## Authentication

The API supports optional authentication methods:
- **Bearer Token**: JWT or session tokens for authenticated requests
- **API Key**: X-API-Key header for programmatic access (optional)

Unauthenticated requests are supported for public operations.

## Rate Limits

Rate limits are enforced per endpoint to ensure fair usage:
- **GET /api/rooms**: 60 requests/minute
- **POST /api/rooms**: 10 requests/minute (strict - prevent spam)
- **DELETE /api/rooms**: 30 requests/minute
- **GET /api/health**: 100 requests/minute
- **GET /api/metrics**: 30 requests/minute

See individual endpoint documentation for specific limits.

## Error Handling

All API errors follow a consistent format:

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-06T12:00:00Z"
}
\`\`\`

Common error codes:
- \`BAD_REQUEST\` (400): Invalid request parameters
- \`UNAUTHORIZED\` (401): Missing or invalid authentication
- \`FORBIDDEN\` (403): Insufficient permissions
- \`NOT_FOUND\` (404): Resource not found
- \`CONFLICT\` (409): Resource already exists
- \`GONE\` (410): Resource no longer available
- \`RATE_LIMIT_EXCEEDED\` (429): Too many requests
- \`INTERNAL_ERROR\` (500): Server error

## CORS

Cross-Origin requests are supported with configurable allowed origins. Set \`ALLOWED_ORIGINS\` environment variable to comma-separated list of allowed domains.

## Versioning

Current API version: 1.0.0

Breaking changes will increment the major version. Migration guides will be provided for deprecated endpoints.

## Support

For API support and questions:
- GitHub Issues: https://github.com/tallow/issues
- GitHub Discussions: https://github.com/tallow/discussions
- Email: support@tallow.app
    `,
    version: '1.0.0',
    contact: {
      name: 'Tallow Support',
      url: 'https://github.com/tallow',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
    {
      url: 'https://api.tallow.app',
      description: 'Production server',
      variables: {
        version: {
          default: 'v1',
          enum: ['v1'],
        },
      },
    },
  ],
  paths: {
    '/api/health': {
      get: {
        operationId: 'getHealth',
        tags: ['Health'],
        summary: 'Health Check',
        description:
          'Basic health check endpoint for container orchestration and monitoring. Returns 200 if service is running, 503 if unhealthy. No dependencies are checked.',
        parameters: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
                example: {
                  status: 'ok',
                  service: 'tallow',
                  version: '1.0.0',
                  timestamp: '2026-02-06T12:00:00Z',
                  uptime: 3600.5,
                },
              },
            },
          },
          '503': {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  status: 'error',
                  service: 'tallow',
                  timestamp: '2026-02-06T12:00:00Z',
                  error: 'Service initialization failed',
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: 'curl -X GET http://localhost:3000/api/health',
          },
          {
            lang: 'javascript',
            source: 'fetch("http://localhost:3000/api/health").then(r => r.json())',
          },
          {
            lang: 'python',
            source: 'import requests\nrequests.get("http://localhost:3000/api/health").json()',
          },
        ],
      },
    },
    '/api/health/liveness': {
      get: {
        operationId: 'getLiveness',
        tags: ['Health'],
        summary: 'Liveness Probe',
        description:
          'Kubernetes liveness probe endpoint. Returns 200 if the application process is running. Used for container restart policies.',
        parameters: [],
        responses: {
          '200': {
            description: 'Service is alive',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LivenessResponse',
                },
                example: {
                  status: 'alive',
                  timestamp: '2026-02-06T12:00:00Z',
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: 'curl -X GET http://localhost:3000/api/health/liveness',
          },
          {
            lang: 'curl-head',
            source: 'curl -X HEAD http://localhost:3000/api/health/liveness',
          },
        ],
      },
      head: {
        operationId: 'livenessProbeHead',
        tags: ['Health'],
        summary: 'Liveness Probe (HEAD)',
        description: 'HEAD request for liveness probe. Returns 200 with no body.',
        parameters: [],
        responses: {
          '200': {
            description: 'Service is alive',
          },
        },
      },
    },
    '/api/health/readiness': {
      get: {
        operationId: 'getReadiness',
        tags: ['Health'],
        summary: 'Readiness Probe',
        description:
          'Kubernetes readiness probe endpoint. Checks if all dependencies are available and the service is ready to handle traffic. Returns 200 if ready, 503 if not.',
        parameters: [],
        responses: {
          '200': {
            description: 'Service is ready',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ReadinessResponse',
                },
                example: {
                  status: 'ready',
                  timestamp: '2026-02-06T12:00:00Z',
                  checks: [
                    {
                      name: 'environment',
                      status: 'healthy',
                      responseTime: 5,
                    },
                    {
                      name: 'memory',
                      status: 'healthy',
                      responseTime: 3,
                    },
                  ],
                },
              },
            },
          },
          '503': {
            description: 'Service is not ready',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ReadinessResponse',
                },
                example: {
                  status: 'not ready',
                  timestamp: '2026-02-06T12:00:00Z',
                  checks: [
                    {
                      name: 'environment',
                      status: 'unhealthy',
                      responseTime: 4,
                      error: 'Missing required environment variables: NEXT_PUBLIC_SIGNALING_URL',
                    },
                  ],
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: 'curl -X GET http://localhost:3000/api/health/readiness',
          },
          {
            lang: 'curl-head',
            source: 'curl -X HEAD http://localhost:3000/api/health/readiness',
          },
        ],
      },
      head: {
        operationId: 'readinessProbeHead',
        tags: ['Health'],
        summary: 'Readiness Probe (HEAD)',
        description: 'HEAD request for readiness probe. Returns 200 if ready, 503 if not.',
        parameters: [],
        responses: {
          '200': {
            description: 'Service is ready',
          },
          '503': {
            description: 'Service is not ready',
          },
        },
      },
    },
    '/api/rooms': {
      get: {
        operationId: 'getRoom',
        tags: ['Rooms'],
        summary: 'Get Room Information',
        description:
          'Retrieve information about a specific room by its code. Returns room details including member count, expiration, and password protection status. Requires valid room code.',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            description: 'Room code (4-8 alphanumeric characters, case-insensitive)',
            schema: {
              type: 'string',
              pattern: '^[A-Z0-9]{4,8}$',
              example: 'ABCD1234',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Room found and returned',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RoomResponse',
                },
                example: {
                  id: 'room-uuid-1234',
                  code: 'ABCD1234',
                  name: 'Engineering Team Transfer',
                  ownerId: 'owner-uuid-5678',
                  ownerName: 'John Doe',
                  createdAt: '2026-02-06T12:00:00Z',
                  expiresAt: '2026-02-07T12:00:00Z',
                  isPasswordProtected: true,
                  maxMembers: 10,
                  memberCount: 3,
                },
              },
            },
          },
          '400': {
            description: 'Invalid room code format',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Room not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '410': {
            description: 'Room has expired',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded (60 requests/minute)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: 'curl -X GET "http://localhost:3000/api/rooms?code=ABCD1234"',
          },
          {
            lang: 'javascript',
            source: `const code = 'ABCD1234';
fetch(\`http://localhost:3000/api/rooms?code=\${code}\`)
  .then(r => r.json())
  .then(data => console.log(data));`,
          },
          {
            lang: 'python',
            source: `import requests
code = 'ABCD1234'
response = requests.get(f'http://localhost:3000/api/rooms?code={code}')
print(response.json())`,
          },
        ],
      },
      post: {
        operationId: 'createRoom',
        tags: ['Rooms'],
        summary: 'Create Room',
        description:
          'Create a new transfer room for group file transfers. Requires CSRF token. Rate limited to 10 requests/minute to prevent spam. Returns room details including the room code.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateRoomRequest',
              },
              example: {
                id: 'room-uuid-1234',
                code: 'ABCD1234',
                name: 'Engineering Team Transfer',
                ownerId: 'owner-uuid-5678',
                ownerName: 'John Doe',
                maxMembers: 10,
                password: 'SecurePassword123',
                expiresAt: '2026-02-07T12:00:00Z',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Room created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateRoomResponse',
                },
                example: {
                  success: true,
                  room: {
                    id: 'room-uuid-1234',
                    code: 'ABCD1234',
                    name: 'Engineering Team Transfer',
                    ownerId: 'owner-uuid-5678',
                    createdAt: '2026-02-06T12:00:00Z',
                    expiresAt: '2026-02-07T12:00:00Z',
                    isPasswordProtected: true,
                    maxMembers: 10,
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '403': {
            description: 'CSRF token missing or invalid',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '409': {
            description: 'Room code already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '422': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded (10 requests/minute)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: `curl -X POST http://localhost:3000/api/rooms \\
  -H "Content-Type: application/json" \\
  -H "X-CSRF-Token: token-value" \\
  -d '{
    "id": "room-uuid-1234",
    "code": "ABCD1234",
    "name": "Engineering Team",
    "ownerId": "owner-uuid-5678",
    "ownerName": "John Doe",
    "maxMembers": 10
  }'`,
          },
          {
            lang: 'javascript',
            source: `const roomData = {
  id: 'room-uuid-1234',
  code: 'ABCD1234',
  name: 'Engineering Team',
  ownerId: 'owner-uuid-5678',
  ownerName: 'John Doe',
  maxMembers: 10
};

fetch('http://localhost:3000/api/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(roomData)
})
.then(r => r.json())
.then(data => console.log(data));`,
          },
          {
            lang: 'python',
            source: `import requests
import json

room_data = {
    'id': 'room-uuid-1234',
    'code': 'ABCD1234',
    'name': 'Engineering Team',
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
print(response.json())`,
          },
        ],
      },
      delete: {
        operationId: 'deleteRoom',
        tags: ['Rooms'],
        summary: 'Delete Room',
        description:
          'Delete a room. Only the room owner can delete. Requires CSRF token and both room code and owner ID to verify ownership.',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            description: 'Room code (4-8 alphanumeric characters)',
            schema: {
              type: 'string',
              pattern: '^[A-Z0-9]{4,8}$',
              example: 'ABCD1234',
            },
          },
          {
            name: 'ownerId',
            in: 'query',
            required: true,
            description: 'Owner ID (must match the room owner)',
            schema: {
              type: 'string',
              pattern: '^[a-zA-Z0-9-]{1,64}$',
              example: 'owner-uuid-5678',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Room deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true,
                    },
                    message: {
                      type: 'string',
                      example: 'Room deleted successfully',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing or invalid parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '403': {
            description: 'CSRF token missing, invalid, or insufficient permissions',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '404': {
            description: 'Room not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded (30 requests/minute)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
        'x-codeSamples': [
          {
            lang: 'curl',
            source: `curl -X DELETE "http://localhost:3000/api/rooms?code=ABCD1234&ownerId=owner-uuid-5678" \\
  -H "X-CSRF-Token: token-value"`,
          },
          {
            lang: 'javascript',
            source: `const code = 'ABCD1234';
const ownerId = 'owner-uuid-5678';

fetch(\`http://localhost:3000/api/rooms?code=\${code}&ownerId=\${ownerId}\`, {
  method: 'DELETE',
  headers: {
    'X-CSRF-Token': csrfToken
  }
})
.then(r => r.json())
.then(data => console.log(data));`,
          },
          {
            lang: 'python',
            source: `import requests

code = 'ABCD1234'
owner_id = 'owner-uuid-5678'
csrf_token = 'token-value'

headers = {
    'X-CSRF-Token': csrf_token
}

response = requests.delete(
    f'http://localhost:3000/api/rooms?code={code}&ownerId={owner_id}',
    headers=headers
)
print(response.json())`,
          },
        ],
      },
      options: {
        operationId: 'roomsOptions',
        tags: ['Rooms'],
        summary: 'CORS Preflight',
        description: 'Handles CORS preflight requests for /api/rooms endpoint.',
        parameters: [],
        responses: {
          '204': {
            description: 'CORS preflight accepted',
          },
        },
      },
    },
    '/api/contacts': {
      get: {
        operationId: 'listContactsSchema',
        tags: ['Contacts'],
        summary: 'Get contacts schema',
        description: 'Returns schema metadata for client-side encrypted contacts.',
        parameters: [],
        responses: {
          '200': {
            description: 'Contacts schema response',
            content: {
              'application/json': {
                example: {
                  success: true,
                  schema: {
                    version: '1.0.0',
                    fields: ['deviceId', 'name', 'publicKey', 'lastSeen', 'trusted', 'notes'],
                    storage: 'client-side-encrypted',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'validateContactCreate',
        tags: ['Contacts'],
        summary: 'Validate contact payload',
        description: 'Validates a contact payload before client-side encrypted persistence.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                deviceId: 'peer-device-123',
                name: 'Alice Device',
                trusted: false,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Contact payload accepted',
            content: {
              'application/json': {
                example: {
                  success: true,
                  contact: {
                    deviceId: 'peer-device-123',
                    name: 'Alice Device',
                    trusted: false,
                    addedAt: 1760000000000,
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        operationId: 'validateContactDelete',
        tags: ['Contacts'],
        summary: 'Validate contact deletion',
        description: 'Validates contact deletion payload.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                deviceId: 'peer-device-123',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Contact deletion payload accepted',
            content: {
              'application/json': {
                example: {
                  success: true,
                  deleted: 'peer-device-123',
                },
              },
            },
          },
        },
      },
    },
    '/api/docs': {
      get: {
        operationId: 'getApiDocumentation',
        tags: ['Documentation'],
        summary: 'Get API documentation',
        description: 'Returns OpenAPI JSON or Swagger UI HTML depending on Accept header and format query.',
        parameters: [
          {
            name: 'format',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['json', 'html'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'API documentation returned',
            content: {
              'application/json': {
                example: {
                  openapi: '3.1.0',
                  info: {
                    title: 'Tallow API',
                  },
                },
              },
              'text/html': {
                example: '<!DOCTYPE html><html><head><title>Tallow API - Swagger UI</title></head></html>',
              },
            },
          },
        },
      },
      head: {
        operationId: 'headApiDocumentation',
        tags: ['Documentation'],
        summary: 'Check API documentation availability',
        description: 'Returns 200 when API documentation endpoint is available.',
        parameters: [],
        responses: {
          '200': {
            description: 'Documentation endpoint available',
          },
        },
      },
    },
    '/api/email/send': {
      post: {
        operationId: 'sendShareEmail',
        tags: ['Email'],
        summary: 'Send share email',
        description: 'Sends share-by-email notification with unsubscribe-safe template and privacy controls.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                to: 'recipient@example.com',
                senderName: 'Tallow User',
                shareLink: 'https://tallow.app/transfer/share/abc123',
                fileName: 'design.pdf',
                fileCount: 1,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email accepted for delivery',
            content: {
              'application/json': {
                example: {
                  success: true,
                  messageId: 're_abc123',
                },
              },
            },
          },
        },
      },
    },
    '/api/email/status/{id}': {
      get: {
        operationId: 'getEmailStatus',
        tags: ['Email'],
        summary: 'Get email delivery status',
        description: 'Returns status for a previously submitted email message ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Email status returned',
            content: {
              'application/json': {
                example: {
                  id: 're_abc123',
                  status: 'delivered',
                  timestamp: '2026-02-13T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
    '/api/flags': {
      get: {
        operationId: 'getFeatureFlags',
        tags: ['Flags'],
        summary: 'Get runtime feature flags',
        description: 'Returns merged feature-flag values from environment and defaults.',
        parameters: [],
        responses: {
          '200': {
            description: 'Feature flags returned',
            content: {
              'application/json': {
                example: {
                  flags: {
                    scheduled_transfers: true,
                    guest_mode: true,
                    plausible_analytics: false,
                  },
                  source: 'environment',
                },
              },
            },
          },
        },
      },
    },
    '/api/metrics': {
      get: {
        operationId: 'getPrometheusMetrics',
        tags: ['Metrics'],
        summary: 'Get Prometheus metrics',
        description: 'Returns Prometheus text exposition metrics output.',
        parameters: [],
        responses: {
          '200': {
            description: 'Prometheus metrics output',
            content: {
              'text/plain': {
                example: '# HELP tallow_transfers_total Total number of file transfers',
              },
            },
          },
        },
      },
      head: {
        operationId: 'headPrometheusMetrics',
        tags: ['Metrics'],
        summary: 'Check Prometheus endpoint',
        description: 'Returns 200 if metrics endpoint is available.',
        parameters: [],
        responses: {
          '200': {
            description: 'Metrics endpoint available',
          },
        },
      },
    },
    '/api/stripe/create-checkout-session': {
      post: {
        operationId: 'createStripeCheckoutSession',
        tags: ['Stripe'],
        summary: 'Create Stripe checkout session',
        description: 'Creates Stripe checkout session for subscription plan purchase.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                priceId: 'price_pro_monthly',
                successUrl: 'https://tallow.app/pricing?checkout=success',
                cancelUrl: 'https://tallow.app/pricing?checkout=cancelled',
                customerEmail: 'buyer@example.com',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Checkout session created',
            content: {
              'application/json': {
                example: {
                  success: true,
                  sessionId: 'cs_test_abc123',
                  url: 'https://checkout.stripe.com/c/pay/cs_test_abc123',
                },
              },
            },
          },
        },
      },
    },
    '/api/stripe/subscription': {
      get: {
        operationId: 'getStripeSubscription',
        tags: ['Stripe'],
        summary: 'Get subscription status',
        description: 'Returns active subscription status for a customer ID.',
        parameters: [
          {
            name: 'customerId',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Subscription status returned',
            content: {
              'application/json': {
                example: {
                  hasSubscription: true,
                  subscription: {
                    id: 'sub_abc123',
                    plan: 'pro',
                    status: 'active',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/stripe/webhook': {
      post: {
        operationId: 'handleStripeWebhook',
        tags: ['Stripe'],
        summary: 'Handle Stripe webhook',
        description: 'Verifies and processes Stripe webhook events with idempotency checks.',
        parameters: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                id: 'evt_abc123',
                type: 'checkout.session.completed',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook acknowledged',
            content: {
              'application/json': {
                example: {
                  received: true,
                },
              },
            },
          },
        },
      },
    },
    '/api/turn/credentials': {
      get: {
        operationId: 'getTurnCredentials',
        tags: ['TURN'],
        summary: 'Get temporary TURN credentials',
        description: 'Returns temporary TURN credentials for NAT traversal.',
        parameters: [
          {
            name: 'ttl',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          '200': {
            description: 'TURN credentials returned',
            content: {
              'application/json': {
                example: {
                  iceServers: [
                    {
                      urls: ['turn:turn.tallow.app:3478?transport=udp'],
                      username: '1760000000:user',
                      credential: 'base64-hmac-credential',
                    },
                  ],
                  ttl: 43200,
                  provider: 'coturn',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['status', 'service', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'error'],
            description: 'Health status of the service',
          },
          service: {
            type: 'string',
            description: 'Service name',
            example: 'tallow',
          },
          version: {
            type: 'string',
            description: 'Service version',
            example: '1.0.0',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current server timestamp (ISO 8601)',
          },
          uptime: {
            type: 'number',
            description: 'Service uptime in seconds',
            example: 3600.5,
          },
        },
      },
      LivenessResponse: {
        type: 'object',
        required: ['status', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            enum: ['alive'],
            description: 'Liveness status',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current server timestamp (ISO 8601)',
          },
        },
      },
      DependencyCheck: {
        type: 'object',
        required: ['name', 'status'],
        properties: {
          name: {
            type: 'string',
            description: 'Name of the dependency',
            enum: ['environment', 'memory'],
          },
          status: {
            type: 'string',
            enum: ['healthy', 'unhealthy'],
            description: 'Health status of the dependency',
          },
          responseTime: {
            type: 'number',
            description: 'Check response time in milliseconds',
          },
          error: {
            type: 'string',
            description: 'Error message if unhealthy',
          },
        },
      },
      ReadinessResponse: {
        type: 'object',
        required: ['status', 'timestamp', 'checks'],
        properties: {
          status: {
            type: 'string',
            enum: ['ready', 'not ready', 'error'],
            description: 'Overall readiness status',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Current server timestamp (ISO 8601)',
          },
          checks: {
            type: 'array',
            description: 'Individual dependency checks',
            items: {
              $ref: '#/components/schemas/DependencyCheck',
            },
          },
        },
      },
      RoomResponse: {
        type: 'object',
        required: [
          'id',
          'code',
          'name',
          'ownerId',
          'ownerName',
          'createdAt',
          'isPasswordProtected',
          'maxMembers',
          'memberCount',
        ],
        properties: {
          id: {
            type: 'string',
            description: 'Unique room identifier',
            example: 'room-uuid-1234',
          },
          code: {
            type: 'string',
            description: 'Room access code (4-8 alphanumeric)',
            pattern: '^[A-Z0-9]{4,8}$',
            example: 'ABCD1234',
          },
          name: {
            type: 'string',
            description: 'Human-readable room name',
            example: 'Engineering Team Transfer',
          },
          ownerId: {
            type: 'string',
            description: 'UUID of the room owner',
            example: 'owner-uuid-5678',
          },
          ownerName: {
            type: 'string',
            description: 'Name of the room owner',
            example: 'John Doe',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Room creation timestamp (ISO 8601)',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Room expiration timestamp (ISO 8601), null if no expiration',
          },
          isPasswordProtected: {
            type: 'boolean',
            description: 'Whether the room requires a password to join',
          },
          maxMembers: {
            type: 'integer',
            minimum: 2,
            maximum: 50,
            description: 'Maximum number of members allowed in the room',
          },
          memberCount: {
            type: 'integer',
            minimum: 0,
            description: 'Current number of members in the room',
          },
        },
      },
      CreateRoomRequest: {
        type: 'object',
        required: ['id', 'code', 'ownerId', 'ownerName'],
        properties: {
          id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-]{1,64}$',
            description: 'Unique room identifier',
            example: 'room-uuid-1234',
          },
          code: {
            type: 'string',
            pattern: '^[A-Z0-9]{4,8}$',
            description: 'Room access code (4-8 alphanumeric, case-insensitive)',
            example: 'ABCD1234',
          },
          name: {
            type: 'string',
            maxLength: 50,
            description: 'Human-readable room name (optional, max 50 chars)',
            example: 'Engineering Team Transfer',
          },
          ownerId: {
            type: 'string',
            pattern: '^[a-zA-Z0-9-]{1,64}$',
            description: 'UUID of the room owner',
            example: 'owner-uuid-5678',
          },
          ownerName: {
            type: 'string',
            maxLength: 50,
            description: 'Name of the room owner (max 50 chars)',
            example: 'John Doe',
          },
          password: {
            type: 'string',
            minLength: 4,
            maxLength: 128,
            description: 'Optional password to protect the room (4-128 characters)',
            example: 'SecurePassword123',
          },
          maxMembers: {
            type: 'integer',
            minimum: 2,
            maximum: 50,
            description: 'Maximum members allowed (default: 10, range: 2-50)',
            example: 10,
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Room expiration time (ISO 8601). Max 7 days in future.',
            example: '2026-02-07T12:00:00Z',
          },
        },
      },
      CreateRoomResponse: {
        type: 'object',
        required: ['success', 'room'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          room: {
            type: 'object',
            required: [
              'id',
              'code',
              'name',
              'ownerId',
              'createdAt',
              'isPasswordProtected',
              'maxMembers',
            ],
            properties: {
              id: {
                type: 'string',
                example: 'room-uuid-1234',
              },
              code: {
                type: 'string',
                example: 'ABCD1234',
              },
              name: {
                type: 'string',
                example: 'Engineering Team Transfer',
              },
              ownerId: {
                type: 'string',
                example: 'owner-uuid-5678',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              isPasswordProtected: {
                type: 'boolean',
              },
              maxMembers: {
                type: 'integer',
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error', 'timestamp'],
        properties: {
          error: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'Room not found',
          },
          code: {
            type: 'string',
            description: 'Machine-readable error code',
            enum: [
              'BAD_REQUEST',
              'UNAUTHORIZED',
              'FORBIDDEN',
              'NOT_FOUND',
              'CONFLICT',
              'GONE',
              'RATE_LIMIT_EXCEEDED',
              'VALIDATION_ERROR',
              'INTERNAL_ERROR',
              'SERVICE_UNAVAILABLE',
            ],
            example: 'NOT_FOUND',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when error occurred (ISO 8601)',
          },
          details: {
            type: 'object',
            description: 'Additional error details (development mode only)',
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'JWT or session token authentication (optional)',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for programmatic access (optional)',
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-Token',
        description: 'CSRF protection token (required for state-changing operations)',
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check and readiness probe endpoints for monitoring and orchestration',
    },
    {
      name: 'Rooms',
      description: 'Create and manage transfer rooms for group file transfers',
    },
  ],
};

/**
 * Get OpenAPI specification as a formatted string
 */
export function getOpenApiSpecString(): string {
  return JSON.stringify(openApiSpec, null, 2);
}

/**
 * Generate a Swagger UI HTML page for the OpenAPI spec
 */
export function generateSwaggerUI(specUrl: string = '/api/docs'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tallow API - Swagger UI</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
  <script>
    const ui = SwaggerUIBundle({
      url: '${specUrl}',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIStandalonePreset
      ],
      layout: 'StandaloneLayout',
      deepLinking: true,
      tryItOutEnabled: true,
    });
    window.onload = function() {
      window.ui = ui;
    };
  </script>
</body>
</html>`;
}
