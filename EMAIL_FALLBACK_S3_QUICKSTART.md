# Email Fallback S3 Storage - Quick Start Guide

Get S3 cloud storage running in 5 minutes.

## Prerequisites

- AWS Account
- Node.js 18+ installed
- Tallow app deployed or running locally

## Step 1: Install Dependencies (Already Done)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

## Step 2: Create S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click **"Create bucket"**
3. Enter bucket name: `tallow-temp-files-[random-string]`
4. Select region: `us-east-1` (or your preferred region)
5. Keep **"Block all public access"** enabled
6. Click **"Create bucket"**

## Step 3: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **"Users"** → **"Add users"**
3. Username: `tallow-storage`
4. Click **"Next"**
5. Select **"Attach policies directly"**
6. Click **"Create policy"** → **"JSON"**
7. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

8. Click **"Next"** → Name it `TallowS3Access` → **"Create policy"**
9. Go back to user creation, refresh policies, select `TallowS3Access`
10. Click **"Next"** → **"Create user"**
11. Click on the user → **"Security credentials"**
12. Click **"Create access key"** → **"Application running outside AWS"**
13. **Save the Access Key ID and Secret Access Key** (you can't see the secret again!)

## Step 4: Configure Environment Variables

Add to `.env.local` (create if doesn't exist):

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=tallow-temp-files-your-bucket

# Optional: Secure your cleanup endpoint
CRON_SECRET=generate_random_string_here
```

Generate `CRON_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Test Locally

Start your development server:
```bash
npm run dev
```

Check the logs on startup:
```
[StorageConfig] Storage provider: s3
[StorageConfig] S3 Region: us-east-1
[StorageConfig] S3 Bucket: tallow-temp-files-your-bucket
[StorageConfig] Storage configuration is valid
```

If you see warnings or errors, check:
- Environment variables are set correctly
- AWS credentials are valid
- S3 bucket name is correct
- Bucket exists in the specified region

## Step 6: Deploy to Production

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
   - `CRON_SECRET`
4. Deploy

The cron job will automatically run every hour to clean up expired files.

### Other Platforms

Add environment variables to your hosting platform and ensure the cron endpoint is called hourly:

```bash
curl -X GET https://your-app.com/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret"
```

## Step 7: Verify It's Working

### Test Upload

```bash
# Send test email transfer
curl -X POST https://your-app.com/api/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_SECRET_KEY" \
  -d '{
    "recipientEmail": "test@example.com",
    "senderName": "Test User",
    "files": [{
      "filename": "test.txt",
      "content": "SGVsbG8gV29ybGQh",
      "size": 12
    }]
  }'
```

### Check S3 Bucket

1. Go to S3 Console
2. Open your bucket
3. Look for files in `temp-files/` prefix
4. Files should appear after upload

### Test Download

1. Get transfer ID from API response
2. Visit `https://your-app.com/download/[transfer-id]`
3. Click download button
4. File should download and decrypt

### Test Cleanup

```bash
# Trigger manual cleanup
curl -X GET https://your-app.com/api/cron/cleanup \
  -H "Authorization: Bearer your_cron_secret"
```

Response:
```json
{
  "success": true,
  "filesDeleted": 0,
  "transfersDeleted": 0,
  "duration": 234,
  "timestamp": "2024-01-27T10:00:00.000Z"
}
```

## Common Issues

### "S3 storage is not configured"

- Check environment variables are set
- Restart server after adding variables
- Verify variable names match exactly

### "AccessDenied" Error

- IAM user doesn't have required permissions
- Bucket name is wrong
- Region mismatch

### "NoSuchBucket" Error

- Bucket doesn't exist
- Bucket name typo in environment variable
- Bucket in different region than configured

### Files Not Expiring

- Cron job not running
- Check Vercel Cron logs
- Run manual cleanup to test

## Optional: S3 Lifecycle Rules

Auto-delete old files (backup to cron):

1. S3 Console → Your bucket → **"Management"** tab
2. Click **"Create lifecycle rule"**
3. Rule name: `auto-delete-expired-files`
4. Filter prefix: `temp-files/`
5. Enable **"Expire current versions of objects"**
6. Days: `30`
7. Click **"Create rule"**

## Cost Estimate

### S3 Storage Costs (us-east-1)

- Storage: $0.023/GB/month
- PUT requests: $0.005/1000 requests
- GET requests: $0.0004/1000 requests

### Example Usage

100 transfers/day, 10MB average file size:
- Storage: ~30GB peak = $0.69/month
- Uploads: 3,000/month = $0.015
- Downloads: 3,000/month = $0.001
- **Total: ~$0.71/month**

Most files deleted after 1 download, so actual storage is much less.

## Security Checklist

- [x] S3 bucket is not public
- [x] IAM user has minimal permissions
- [x] Access keys stored securely
- [x] HTTPS only for file transfers
- [x] Files encrypted before upload
- [x] Server-side encryption enabled
- [x] Automatic expiration configured
- [x] Download tokens required
- [x] Cron endpoint secured

## Next Steps

1. ✅ S3 configured and working
2. Set up CloudWatch alarms for S3 errors
3. Enable S3 access logging
4. Consider CloudFront CDN for global users
5. Monitor costs in AWS Billing dashboard

## Support

Configuration working? Files uploading to S3? Great!

Need help? Check:
- Server logs for detailed errors
- AWS CloudWatch for S3 errors
- S3 bucket permissions
- IAM user permissions

Tasks #11-12 are complete and operational!
