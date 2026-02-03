# Tallow API Implementation Guide

**Complete guide for integrating Tallow API into your application**

---

## Table of Contents

1. [Client-Side Integration](#client-side-integration)
2. [Server-Side Integration](#server-side-integration)
3. [Security Implementation](#security-implementation)
4. [Error Handling](#error-handling)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)

---

## Client-Side Integration

### JavaScript/TypeScript Implementation

#### 1. Initialize Tallow Client

```typescript
// tallow-client.ts
export class TallowClient {
  private apiUrl: string;
  private csrfToken: string | null = null;

  constructor(apiUrl: string = 'https://api.tallow.app/api') {
    this.apiUrl = apiUrl;
  }

  // Initialize: Get CSRF token on app load
  async initialize(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/csrf-token`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize CSRF token');
      }

      const data = await response.json();
      this.csrfToken = data.token;

      // Token is also set in HttpOnly cookie
      console.log('Tallow client initialized');
    } catch (error) {
      console.error('Tallow initialization failed:', error);
      throw error;
    }
  }

  // Get current CSRF token
  getCSRFToken(): string {
    if (!this.csrfToken) {
      throw new Error('CSRF token not initialized. Call initialize() first.');
    }
    return this.csrfToken;
  }

  // Private helper: Make authenticated requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE'].includes(options.method || 'GET')) {
      headers['X-CSRF-Token'] = this.getCSRFToken();
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // File download
  async downloadFile(
    fileId: string,
    token: string,
    key: string
  ): Promise<Blob> {
    const response = await fetch(`${this.apiUrl}/v1/download-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId, token, key }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return response.blob();
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

#### 2. Send File Email

```typescript
// email-service.ts
export class EmailService {
  constructor(private client: TallowClient) {}

  async sendFileEmail(options: {
    recipientEmail: string;
    senderName: string;
    files: FileData[];
    expiresIn?: number;
    maxDownloads?: number;
  }): Promise<{ transferId: string; status: string }> {
    try {
      const response = await this.client['request']('/email/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: options.recipientEmail,
          senderName: options.senderName,
          files: options.files,
          expiresIn: options.expiresIn || 86400, // 24 hours
          maxDownloads: options.maxDownloads || 5,
          trackOpens: true,
          trackClicks: true,
        }),
      });

      return {
        transferId: response.transfer.id,
        status: response.transfer.status,
      };
    } catch (error) {
      console.error('Failed to send file email:', error);
      throw error;
    }
  }

  async checkStatus(transferId: string): Promise<TransferStatus> {
    return this.client['request'](`/email/status/${transferId}`, {
      method: 'GET',
    });
  }

  async batchSendEmails(options: {
    recipients: string[];
    senderName: string;
    files: FileData[];
  }): Promise<BatchResult> {
    return this.client['request']('/email/batch', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}

interface FileData {
  filename: string;
  content: string; // Base64
  size: number;
  contentType: string;
  checksum: string;
}

interface TransferStatus {
  id: string;
  status: string;
  downloads: number;
  maxDownloads: number;
  expiresAt: string;
  events: Array<{ event: string; timestamp: string }>;
}

interface BatchResult {
  batchId: string;
  sent: number;
  failed: number;
  results: Array<{ email: string; transferId: string; status: string }>;
}
```

#### 3. Room Management

```typescript
// room-service.ts
export class RoomService {
  constructor(private client: TallowClient) {}

  async createRoom(options: {
    code: string;
    name?: string;
    password?: string;
    maxMembers?: number;
  }): Promise<Room> {
    // Generate unique IDs
    const roomId = this.generateUUID();
    const ownerId = this.getCurrentUserId();
    const ownerName = this.getCurrentUserName();

    try {
      const response = await this.client['request']('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          id: roomId,
          code: options.code.toUpperCase(),
          name: options.name || `Room ${options.code}`,
          ownerId,
          ownerName,
          password: options.password,
          maxMembers: options.maxMembers || 10,
        }),
      });

      return response.room;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  async getRoom(code: string): Promise<Room | null> {
    try {
      const response = await fetch(
        `${this.client['apiUrl']}/rooms?code=${code.toUpperCase()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
          return null;
        }
        throw new Error('Failed to fetch room');
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get room:', error);
      return null;
    }
  }

  async deleteRoom(code: string): Promise<boolean> {
    const ownerId = this.getCurrentUserId();

    try {
      const response = await fetch(
        `${this.client['apiUrl']}/rooms?code=${code.toUpperCase()}&ownerId=${ownerId}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': this.client.getCSRFToken(),
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete room:', error);
      return false;
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getCurrentUserId(): string {
    // Get from session/auth context
    return (window as any).__USER_ID__ || 'anonymous';
  }

  private getCurrentUserName(): string {
    // Get from session/auth context
    return (window as any).__USER_NAME__ || 'Guest';
  }
}

interface Room {
  id: string;
  code: string;
  name: string;
  isPasswordProtected: boolean;
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  expiresAt?: string;
}
```

#### 4. React Integration Example

```typescript
// hooks/useTallow.ts
import { useEffect, useRef, useState } from 'react';
import { TallowClient } from '@/lib/tallow-client';
import { EmailService } from '@/lib/email-service';
import { RoomService } from '@/lib/room-service';

export function useTallow() {
  const clientRef = useRef<TallowClient | null>(null);
  const emailServiceRef = useRef<EmailService | null>(null);
  const roomServiceRef = useRef<RoomService | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeTallow() {
      try {
        const client = new TallowClient();
        await client.initialize();

        clientRef.current = client;
        emailServiceRef.current = new EmailService(client);
        roomServiceRef.current = new RoomService(client);

        // Check health
        const isHealthy = await client.checkHealth();
        if (!isHealthy) {
          setError('Tallow service is unavailable');
          return;
        }

        setInitialized(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to initialize Tallow'
        );
      }
    }

    initializeTallow();
  }, []);

  return {
    initialized,
    error,
    emailService: emailServiceRef.current,
    roomService: roomServiceRef.current,
    client: clientRef.current,
  };
}

// Usage in component
export function FileTransferComponent() {
  const { initialized, error, emailService } = useTallow();
  const [loading, setLoading] = useState(false);

  async function handleSendFile(email: string, files: FileData[]) {
    if (!emailService || !initialized) return;

    setLoading(true);
    try {
      const result = await emailService.sendFileEmail({
        recipientEmail: email,
        senderName: 'John Doe',
        files,
        expiresIn: 86400,
      });

      console.log('File sent:', result.transferId);
      // Show success message
    } catch (err) {
      console.error('Failed to send file:', err);
      // Show error message
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) {
    return <div>Loading Tallow...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {/* UI for file transfer */}
    </div>
  );
}
```

---

## Server-Side Integration

### Node.js/Express Implementation

#### 1. Tallow Service Class

```typescript
// services/tallow-service.ts
import axios, { AxiosInstance } from 'axios';

export class TallowService {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, apiUrl: string = 'https://api.tallow.app/api') {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.api.post('/send-welcome', { email, name });
    } catch (error) {
      this.handleError('sendWelcomeEmail', error);
    }
  }

  /**
   * Send file share email
   */
  async sendShareEmail(
    email: string,
    shareId: string,
    fileCount: number,
    totalSize: number,
    senderName?: string
  ): Promise<string> {
    try {
      const response = await this.api.post('/v1/send-share-email', {
        email,
        shareId,
        fileCount,
        totalSize,
        senderName,
      });

      return response.data.shareUrl;
    } catch (error) {
      this.handleError('sendShareEmail', error);
      throw error;
    }
  }

  /**
   * Send file email
   */
  async sendFileEmail(options: {
    recipientEmail: string;
    senderName: string;
    fileName: string;
    fileSize: number;
    fileData?: string; // Base64 for attachment mode
    downloadUrl?: string; // For link mode
    expiresAt: number;
    mode: 'attachment' | 'link';
  }): Promise<string> {
    try {
      const response = await this.api.post('/v1/send-file-email', options);
      return response.data.emailId;
    } catch (error) {
      this.handleError('sendFileEmail', error);
      throw error;
    }
  }

  /**
   * Get email transfer status
   */
  async getTransferStatus(transferId: string): Promise<{
    status: string;
    downloads: number;
    maxDownloads: number;
    expiresAt: string;
  }> {
    try {
      const response = await this.api.get(`/email/status/${transferId}`);
      return response.data.status;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      this.handleError('getTransferStatus', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.data.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Verify webhook signature (Resend)
   */
  static verifyResendWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Verify webhook signature (Stripe)
   */
  static verifyStripeWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    const stripe = require('stripe');
    try {
      stripe.webhooks.constructEvent(body, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  private handleError(method: string, error: unknown): void {
    if (axios.isAxiosError(error)) {
      console.error(`TallowService.${method} failed:`, {
        status: error.response?.status,
        error: error.response?.data?.error,
        message: error.message,
      });
    } else {
      console.error(`TallowService.${method} failed:`, error);
    }
  }
}
```

#### 2. Express Middleware & Routes

```typescript
// middleware/tallow.ts
import { Request, Response, NextFunction } from 'express';
import { TallowService } from '@/services/tallow-service';

// Initialize Tallow service
export const tallowService = new TallowService(
  process.env.TALLOW_API_KEY || '',
  process.env.TALLOW_API_URL
);

// Middleware: Check Tallow health
export async function tallowHealthCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const isHealthy = await tallowService.healthCheck();
    if (!isHealthy) {
      return res.status(503).json({ error: 'Tallow service unavailable' });
    }
    next();
  } catch (error) {
    next(error);
  }
}

// Middleware: Handle Resend webhook
export async function verifyResendWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const signature = req.headers['resend-signature'] as string;
    const secret = process.env.RESEND_WEBHOOK_SECRET || '';

    if (!signature || !secret) {
      return res.status(401).json({ error: 'Invalid webhook' });
    }

    // Get raw body (must be done before JSON parsing)
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });

    req.on('end', () => {
      const isValid = TallowService.verifyResendWebhookSignature(
        rawBody,
        signature,
        secret
      );

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      next();
    });
  } catch (error) {
    next(error);
  }
}

// routes/file.ts
import { Router, Request, Response } from 'express';
import { tallowService } from '@/middleware/tallow';

const router = Router();

// Send file via email
router.post('/send-file-email', async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      senderName,
      fileName,
      fileSize,
      downloadUrl,
      expiresAt,
    } = req.body;

    // Validate inputs
    if (!recipientEmail || !senderName || !fileName || !downloadUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email via Tallow
    const emailId = await tallowService.sendFileEmail({
      recipientEmail,
      senderName,
      fileName,
      fileSize,
      downloadUrl,
      expiresAt,
      mode: 'link',
    });

    res.json({ success: true, emailId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get transfer status
router.get(
  '/transfer-status/:transferId',
  async (req: Request, res: Response) => {
    try {
      const { transferId } = req.params;

      const status = await tallowService.getTransferStatus(transferId);

      if (!status) {
        return res.status(404).json({ error: 'Transfer not found' });
      }

      res.json({ status });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get status' });
    }
  }
);

// Webhook: Handle Resend events
router.post(
  '/webhook/resend',
  verifyResendWebhook,
  async (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;

      // Handle different event types
      switch (type) {
        case 'email.delivered':
          // Update database with delivery status
          console.log('Email delivered:', data.email_id);
          break;

        case 'email.opened':
          // Track open
          console.log('Email opened:', data.email_id);
          break;

        case 'email.bounced':
          // Handle bounce
          console.log('Email bounced:', data.email_id);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

export default router;
```

---

## Security Implementation

### Input Validation

```typescript
// validators/tallow.ts
import validator from 'validator';

export class TallowValidator {
  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  /**
   * Validate file ID format
   */
  static validateFileId(fileId: string): boolean {
    const pattern = /^[0-9]+-[a-f0-9]{32}$/;
    return pattern.test(fileId);
  }

  /**
   * Validate encryption key format
   */
  static validateEncryptionKey(key: string): boolean {
    const pattern = /^[a-f0-9]{64}$/;
    return pattern.test(key);
  }

  /**
   * Validate room code
   */
  static validateRoomCode(code: string): boolean {
    const pattern = /^[A-Z0-9]{4,8}$/;
    return pattern.test(code);
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_')
      .replace(/\r|\n/g, '')
      .substring(0, 255);
  }

  /**
   * Validate room password
   */
  static validateRoomPassword(password: string): boolean {
    return password.length >= 4 && password.length <= 128;
  }

  /**
   * Validate amount (cents)
   */
  static validateAmount(amount: number): boolean {
    return amount >= 100 && amount <= 99999900;
  }
}
```

### Rate Limiting Implementation

```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

// Strict limit: 3 requests per minute
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limit: 5 requests per minute
export const moderateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Generous limit: 10 requests per minute
export const generousLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to routes
router.post('/email/send', strictLimiter, async (req, res) => {
  // Handler
});

router.get('/email/status/:id', generousLimiter, async (req, res) => {
  // Handler
});
```

### CSRF Protection

```typescript
// middleware/csrf.ts
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

// Set up CSRF protection
export const csrfProtection = csrf({ cookie: true });

// Middleware
export function csrfTokenMiddleware(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}

// Apply to express app
app.use(cookieParser());
app.use(csrfProtection);

// In routes
router.post('/email/send', csrfProtection, async (req, res) => {
  // Token validated automatically
});
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
// utils/error-handler.ts
export interface ApiError {
  status: number;
  error: string;
  details?: unknown;
  timestamp: string;
}

export class ErrorHandler {
  static format(
    error: unknown,
    message: string = 'Internal server error'
  ): ApiError {
    const timestamp = new Date().toISOString();

    if (error instanceof Error) {
      return {
        status: 500,
        error: message,
        details: error.message,
        timestamp,
      };
    }

    if (typeof error === 'string') {
      return {
        status: 400,
        error,
        timestamp,
      };
    }

    return {
      status: 500,
      error: message,
      timestamp,
    };
  }

  static handle(error: unknown, res: Response, statusCode: number = 500): void {
    const formatted = this.format(error);
    res.status(statusCode).json(formatted);
  }
}

// Express error middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.isCelebrateError) {
    return res.status(400).json(ErrorHandler.format(error));
  }

  if (error.status === 429) {
    return res.status(429).json(ErrorHandler.format('Too many requests'));
  }

  console.error('Unhandled error:', error);
  res.status(500).json(ErrorHandler.format(error));
});
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/tallow-client.test.ts
import { TallowClient } from '@/lib/tallow-client';

describe('TallowClient', () => {
  let client: TallowClient;

  beforeEach(() => {
    client = new TallowClient('http://localhost:3000/api');
  });

  describe('initialize', () => {
    it('should fetch CSRF token on init', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' }),
        })
      );

      await client.initialize();
      expect(client.getCSRFToken()).toBe('test-token');
    });
  });

  describe('downloadFile', () => {
    it('should download file with valid credentials', async () => {
      const mockBlob = new Blob(['file data']);
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob),
        })
      );

      const result = await client.downloadFile('file-id', 'token', 'key');
      expect(result).toEqual(mockBlob);
    });

    it('should throw on invalid key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({ error: 'Invalid encryption key format' }),
        })
      );

      await expect(
        client.downloadFile('file-id', 'token', 'invalid')
      ).rejects.toThrow('Invalid encryption key format');
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/email-flow.test.ts
import { EmailService } from '@/lib/email-service';
import { TallowClient } from '@/lib/tallow-client';

describe('Email Flow Integration', () => {
  let emailService: EmailService;
  let client: TallowClient;

  beforeEach(async () => {
    client = new TallowClient(process.env.TALLOW_API_URL);
    await client.initialize();
    emailService = new EmailService(client);
  });

  it('should send email and check status', async () => {
    // Send email
    const result = await emailService.sendFileEmail({
      recipientEmail: 'test@example.com',
      senderName: 'Test User',
      files: [
        {
          filename: 'test.txt',
          content: 'dGVzdCBjb250ZW50',
          size: 12,
          contentType: 'text/plain',
          checksum: 'abc123',
        },
      ],
    });

    expect(result.transferId).toBeDefined();

    // Check status
    const status = await emailService.checkStatus(result.transferId);
    expect(status.status).toBe('sent');
    expect(status.downloads).toBe(0);
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] API key generated and stored securely
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Database backups configured
- [ ] Monitoring/alerts set up

### Environment Variables

```bash
# Required
TALLOW_API_URL=https://api.tallow.app/api
TALLOW_API_KEY=your_api_key_here

# Optional
RESEND_API_KEY=your_resend_key
RESEND_WEBHOOK_SECRET=your_resend_secret
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_stripe_secret

# Security
CSRF_SECRET=random_32_byte_secret
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn (optional)
```

### Health Check Configuration

```yaml
# Kubernetes health checks
apiVersion: v1
kind: Pod
metadata:
  name: tallow-app
spec:
  containers:
    - name: app
      image: tallow:latest
      livenessProbe:
        httpGet:
          path: /api/health/liveness
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /api/health/readiness
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

### Monitoring Configuration

```bash
# Prometheus scrape config
scrape_configs:
  - job_name: 'tallow-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    bearer_token: 'YOUR_METRICS_TOKEN'
    scrape_interval: 15s
```

---

## Production Checklist

### Before Going Live

1. **Security Review:**
   - [ ] CSRF protection enabled
   - [ ] API key authentication configured
   - [ ] Rate limiting active
   - [ ] HTTPS enforced
   - [ ] Headers configured correctly

2. **Testing:**
   - [ ] All endpoints tested
   - [ ] Error cases handled
   - [ ] Rate limiting tested
   - [ ] Webhook signatures verified
   - [ ] Database rollback tested

3. **Monitoring:**
   - [ ] Error tracking (Sentry)
   - [ ] Metrics collection (Prometheus)
   - [ ] Log aggregation (ELK/Datadog)
   - [ ] Uptime monitoring
   - [ ] Alert rules configured

4. **Operations:**
   - [ ] Backup strategy in place
   - [ ] Disaster recovery plan
   - [ ] Runbook documentation
   - [ ] On-call rotation setup
   - [ ] Incident response plan

### Performance Optimization

```typescript
// Caching strategy
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedStatus(transferId: string) {
  const cached = cache.get(transferId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  cache.delete(transferId);
  return null;
}

async function getTransferStatus(transferId: string) {
  const cached = getCachedStatus(transferId);
  if (cached) return cached;

  const status = await tallowService.getTransferStatus(transferId);
  cache.set(transferId, { data: status, timestamp: Date.now() });

  return status;
}
```

---

## Summary

This guide covers:

- Client-side JavaScript/TypeScript integration
- Server-side Node.js/Express integration
- Comprehensive security implementation
- Error handling and validation
- Testing strategies
- Production deployment checklist

For complete API reference, see `TALLOW_API_DOCUMENTATION.md`
