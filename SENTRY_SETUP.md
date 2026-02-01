# Sentry Integration Setup Guide

This guide explains how to complete the Sentry error tracking integration.

## 1. Install Sentry SDK

```bash
npm install @sentry/nextjs --save
```

## 2. Create Sentry Account

1. Go to [sentry.io](https://sentry.io/) and sign up
2. Create a new project:
   - Platform: **Next.js**
   - Alert frequency: **On every new issue**
3. Copy your **DSN** (Data Source Name)

## 3. Configure Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 4. Update Root Layout

Edit `app/layout.tsx` to initialize Sentry:

```typescript
import { ErrorBoundary } from '@/components/error-boundary';
import '@/lib/monitoring/sentry'; // Import to initialize

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 5. Update API Routes

Replace console.error with Sentry:

```typescript
// Before
console.error('Error in API:', error);

// After
import { captureException } from '@/lib/monitoring/sentry';
captureException(error, { api: 'send-welcome' });
```

## 6. Add to Secure Logger

Edit `lib/utils/secure-logger.ts`:

```typescript
import { captureException, captureMessage } from '@/lib/monitoring/sentry';

export const secureLog = {
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      const error = args[0] instanceof Error ? args[0] : new Error(String(args[0]));
      captureException(error, { context: args.slice(1) });
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    } else {
      captureMessage(String(args[0]), 'warning');
    }
  },
  // ... rest
};
```

## 7. Test Error Tracking

Create a test page `app/sentry-test/page.tsx`:

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { captureException } from '@/lib/monitoring/sentry';

export default function SentryTestPage() {
  const throwError = () => {
    throw new Error('Test error from Sentry');
  };

  const captureError = () => {
    captureException(new Error('Manual error capture'), {
      test: true,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Sentry Error Tracking Test</h1>
      <Button onClick={throwError}>Throw Error (Error Boundary)</Button>
      <Button onClick={captureError} variant="outline">
        Capture Error (Manual)
      </Button>
    </div>
  );
}
```

Visit `/sentry-test` and click the buttons to test.

## 8. Verify in Sentry Dashboard

1. Trigger test errors
2. Go to Sentry.io → Your Project → Issues
3. You should see the errors appear within seconds

## 9. Configure Alerts

In Sentry dashboard:
1. **Project Settings → Alerts → Create Alert Rule**
2. Recommended rules:
   - Email on first occurrence of new issues
   - Slack notification for critical errors
   - Weekly summary reports

## 10. Performance Monitoring (Optional)

Enable performance tracking:

```typescript
// In a key user flow (e.g., file transfer)
import { startTransaction, startSpan } from '@/lib/monitoring/sentry';

const transaction = startTransaction('file-transfer', 'file');
const span = startSpan(transaction, 'encryption', 'Encrypt file chunks');

try {
  // Your code
} finally {
  span.finish();
  transaction.finish();
}
```

## Security Best Practices

### Filter Sensitive Data

The Sentry config already filters:
- API keys and tokens from URLs
- Authorization headers
- x-api-key headers

### PII Scrubbing

```typescript
// In sentry.ts, add to beforeSend:
if (event.request?.data) {
  delete event.request.data.password;
  delete event.request.data.email;
}
```

### Release Tracking

Update package.json scripts:

```json
{
  "scripts": {
    "build": "NEXT_PUBLIC_APP_VERSION=$(git rev-parse --short HEAD) next build"
  }
}
```

## Docker Integration

Update `Dockerfile`:

```dockerfile
# Add build arg for version
ARG APP_VERSION=unknown
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION

# Build with version
RUN npm run build
```

Update `docker-compose.yml`:

```yaml
services:
  tallow:
    build:
      args:
        APP_VERSION: ${GIT_COMMIT:-latest}
    environment:
      - NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN}
```

## Troubleshooting

### No Errors Appearing in Sentry

1. Check DSN is correct: `echo $NEXT_PUBLIC_SENTRY_DSN`
2. Verify production build: `NODE_ENV=production npm run build`
3. Check browser console for Sentry init errors
4. Ensure environment is 'production'

### Too Many Errors

Configure sampling:

```typescript
// In sentry.ts
sampleRate: 0.5, // Only send 50% of errors
```

### Errors in Development

Sentry is disabled in development by default. To test:

```typescript
enabled: true, // Force enable for testing
```

## Cost Management

Sentry free tier:
- **5,000 errors/month**
- **10,000 performance events/month**
- 1 user

Tips to stay under limit:
- Use `ignoreErrors` config
- Filter bot/crawler errors
- Sample performance events: `tracesSampleRate: 0.1`

## Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Tracking Best Practices](https://docs.sentry.io/product/sentry-basics/guides/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

## Rollback

If you need to remove Sentry:

```bash
npm uninstall @sentry/nextjs
# Remove imports from code
# Remove NEXT_PUBLIC_SENTRY_DSN from .env
```
