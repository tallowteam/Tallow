# Email Fallback Quick Start Guide

Get email fallback up and running in 5 minutes!

## Step 1: Get Resend API Key (2 minutes)

1. Sign up at [https://resend.com](https://resend.com)
2. Verify your email address
3. Go to API Keys section
4. Click "Create API Key"
5. Copy the API key (starts with `re_`)

## Step 2: Configure Environment (1 minute)

Create or update `.env.local`:

```bash
# Required for email fallback
RESEND_API_KEY=re_your_actual_api_key_here

# Generate a secure API key for authentication
API_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

Or generate API secret manually:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and paste as API_SECRET_KEY value
```

## Step 3: Add to Your Component (2 minutes)

### Option A: Quick Integration (Recommended)

```tsx
import { EmailFallbackButton } from '@/components/app/EmailFallbackButton';

function MyTransferComponent() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userName, setUserName] = useState('John Doe');

  return (
    <div>
      {/* Your existing file selection UI */}

      {/* Add email fallback button */}
      <EmailFallbackButton
        file={selectedFile}
        senderName={userName}
      />
    </div>
  );
}
```

### Option B: Show After P2P Failure

```tsx
import { EmailFallbackButton } from '@/components/app/EmailFallbackButton';

function TransferFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [p2pFailed, setP2pFailed] = useState(false);

  const handleP2PError = () => {
    setP2pFailed(true);
    toast.error('P2P transfer failed', {
      description: 'You can send the file via email instead',
    });
  };

  return (
    <div>
      <Button onClick={startP2PTransfer}>Send via P2P</Button>

      {p2pFailed && (
        <EmailFallbackButton
          file={file}
          senderName="Your Name"
          variant="default"
        />
      )}
    </div>
  );
}
```

### Option C: Advanced (Custom Dialog)

```tsx
import { EmailFallbackDialog } from '@/components/app/EmailFallbackDialog';

function AdvancedComponent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <>
      <button onClick={() => setDialogOpen(true)}>
        Email Fallback
      </button>

      <EmailFallbackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        file={file}
        senderName="Alice"
      />
    </>
  );
}
```

## Step 4: Test It!

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Select a file** in your component

3. **Click "Send via Email"**

4. **Enter recipient email**

5. **Choose expiration time**

6. **Click "Send Email"**

7. **Check recipient's email**

## Features

### Automatic Mode Selection
- **Files ≤ 25MB**: Sent as email attachment (instant delivery)
- **Files > 25MB**: Sent as secure download link

### Security
- End-to-end encryption (AES-256-GCM)
- One-time download links
- Automatic expiration
- Rate limiting (3 emails/minute)
- CSRF protection

### Expiration Options
- 1 hour
- 6 hours
- 24 hours (default)
- 7 days
- 30 days

## Troubleshooting

### "Email service not configured"
→ Check `RESEND_API_KEY` is set in `.env.local`

### "API key not configured"
→ Set `API_SECRET_KEY` in `.env.local`

### Email not arriving
→ Check spam folder
→ Verify email address is correct
→ Check Resend dashboard for delivery status

### "Too many requests"
→ Wait 1 minute, rate limit will reset

## Next Steps

- Read full documentation: [EMAIL_FALLBACK.md](./EMAIL_FALLBACK.md)
- Configure custom expiration times
- Set up monitoring
- Deploy to production

## Production Checklist

Before going live:

- [ ] Set `RESEND_API_KEY` in production environment
- [ ] Set `API_SECRET_KEY` in production environment
- [ ] Test email delivery in production
- [ ] Verify domain authentication in Resend
- [ ] Set up error monitoring
- [ ] Configure rate limits for your traffic
- [ ] Test with large files (>25MB)
- [ ] Verify HTTPS is enabled

## Support

- Full docs: [EMAIL_FALLBACK.md](./EMAIL_FALLBACK.md)
- Resend docs: [https://resend.com/docs](https://resend.com/docs)
- GitHub issues: [Report an issue](https://github.com/yourusername/tallow/issues)

---

**That's it!** You now have a secure email fallback system. 🎉
