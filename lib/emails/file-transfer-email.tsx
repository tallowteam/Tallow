import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';

interface FileTransferEmailProps {
  senderName: string;
  fileName: string;
  fileSize: number;
  expiresAt: number;
  downloadUrl?: string; // For files >25MB
  attachmentMode: boolean; // true for direct attachment, false for link
  securityNote?: string;
}

export function FileTransferEmail({
  senderName,
  fileName,
  fileSize,
  expiresAt,
  downloadUrl,
  attachmentMode,
  securityNote = 'This file is encrypted end-to-end. Only you and the sender have access.',
}: FileTransferEmailProps) {
  const formattedSize = formatFileSize(fileSize);
  const expirationDate = new Date(expiresAt);
  const expirationText = formatExpirationTime(expiresAt);

  return (
    <Html>
      <Head />
      <Preview>{senderName} sent you a file via Tallow - Secure File Transfer</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient background */}
          <Section style={headerSection}>
            <div style={logoContainer}>
              <Text style={logoText}>🔒</Text>
            </div>
            <Heading style={heading}>
              You&apos;ve received a file
            </Heading>
          </Section>

          {/* Main content */}
          <Section style={contentSection}>
            <Text style={greeting}>
              Hello!
            </Text>

            <Text style={paragraph}>
              <strong>{senderName}</strong> has sent you a file using Tallow secure file transfer.
            </Text>

            {/* File info box */}
            <Section style={fileInfoBox}>
              <Text style={fileInfoLabel}>File Details</Text>
              <Hr style={fileInfoDivider} />
              <div style={fileInfoRow}>
                <Text style={fileInfoKey}>📄 File:</Text>
                <Text style={fileInfoValue}>{fileName}</Text>
              </div>
              <div style={fileInfoRow}>
                <Text style={fileInfoKey}>📊 Size:</Text>
                <Text style={fileInfoValue}>{formattedSize}</Text>
              </div>
              <div style={fileInfoRow}>
                <Text style={fileInfoKey}>⏰ Expires:</Text>
                <Text style={fileInfoValue}>{expirationText}</Text>
              </div>
              <div style={fileInfoRow}>
                <Text style={fileInfoKey}>🔐 Security:</Text>
                <Text style={fileInfoValue}>End-to-end encrypted</Text>
              </div>
            </Section>

            {/* Download button or attachment notice */}
            {attachmentMode ? (
              <Section style={attachmentNotice}>
                <Text style={attachmentText}>
                  📎 Your file is attached to this email
                </Text>
                <Text style={attachmentSubtext}>
                  Download the attachment to access your file
                </Text>
              </Section>
            ) : (
              <Section style={ctaSection}>
                <Button href={downloadUrl} style={ctaButton}>
                  Download File
                </Button>
                <Text style={linkText}>
                  Or copy this link: <Link href={downloadUrl} style={link}>{downloadUrl}</Link>
                </Text>
              </Section>
            )}

            <Hr style={divider} />

            {/* Security information */}
            <Section style={securitySection}>
              <Text style={securityTitle}>🛡️ Security & Privacy</Text>
              <Text style={securityText}>
                {securityNote}
              </Text>
              <Text style={securityText}>
                • Files are encrypted with military-grade encryption (AES-256-GCM)
              </Text>
              <Text style={securityText}>
                • Your file will automatically expire on {expirationDate.toLocaleDateString()} at {expirationDate.toLocaleTimeString()}
              </Text>
              {!attachmentMode && (
                <Text style={securityText}>
                  • This is a one-time download link that expires after use
                </Text>
              )}
              <Text style={securityText}>
                • The sender cannot access your file after sending
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Footer warning */}
            <Text style={warningText}>
              ⚠️ <strong>Security Notice:</strong> Only download files from people you trust.
              If you don&apos;t recognize the sender, do not download the file.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Sent via <Link href="https://tallow.app" style={footerLink}>Tallow</Link> - Secure File Transfer
            </Text>
            <Text style={footerSubtext}>
              End-to-end encrypted file sharing
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
  if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatExpirationTime(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${Math.max(1, minutes)} minute${minutes !== 1 ? 's' : ''}`;
  }
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const headerSection = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '40px 20px',
  textAlign: 'center' as const,
};

const logoContainer = {
  width: '80px',
  height: '80px',
  margin: '0 auto 20px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
};

const logoText = {
  fontSize: '40px',
  margin: '0',
  textAlign: 'center' as const,
};

const heading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  textAlign: 'center' as const,
};

const contentSection = {
  padding: '40px 30px',
};

const greeting = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
};

const fileInfoBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const fileInfoLabel = {
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px',
};

const fileInfoDivider = {
  borderColor: '#e5e7eb',
  margin: '12px 0',
};

const fileInfoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '12px',
};

const fileInfoKey = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
};

const fileInfoValue = {
  color: '#1f2937',
  fontSize: '14px',
  margin: '0',
  fontWeight: '600',
};

const attachmentNotice = {
  backgroundColor: '#dbeafe',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const attachmentText = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 8px',
};

const attachmentSubtext = {
  color: '#1e40af',
  fontSize: '14px',
  margin: '0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#667eea',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 4px 6px rgba(102, 126, 234, 0.4)',
};

const linkText = {
  color: '#6b7280',
  fontSize: '12px',
  marginTop: '16px',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const securitySection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const securityTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
};

const securityText = {
  color: '#15803d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
};

const warningText = {
  color: '#92400e',
  fontSize: '13px',
  lineHeight: '20px',
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '6px',
  padding: '12px',
  margin: '24px 0 0',
};

const footer = {
  backgroundColor: '#f9fafb',
  padding: '24px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px',
};

const footerLink = {
  color: '#667eea',
  textDecoration: 'none',
  fontWeight: '600',
};

const footerSubtext = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

export default FileTransferEmail;
