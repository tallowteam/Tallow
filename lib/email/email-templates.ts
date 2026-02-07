/**
 * Email Templates
 * HTML and plain text templates for Tallow emails
 */

export interface ShareEmailParams {
  senderName: string;
  shareLink: string;
  message?: string;
  expiresAt?: Date;
  fileName?: string;
  fileCount?: number;
  fileSize?: string;
}

export interface WelcomeEmailParams {
  name: string;
  appUrl?: string;
}

export interface EmailTemplate {
  html: string;
  text: string;
  subject: string;
}

/**
 * Tallow brand colors - dark theme with purple accent
 */
const BRAND_COLORS = {
  primary: '#9333EA', // Purple
  primaryDark: '#7C3AED',
  background: '#0F172A', // Dark slate
  surface: '#1E293B',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#334155',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

/**
 * Generate share email template
 * Template for file sharing notifications with Tallow branding
 */
export function shareEmailTemplate(params: ShareEmailParams): EmailTemplate {
  const {
    senderName,
    shareLink,
    message,
    expiresAt,
    fileName,
    fileCount = 1,
    fileSize,
  } = params;

  const expiryText = expiresAt
    ? `This link expires on ${expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })}`
    : 'This link will expire in 7 days';

  const fileText = fileCount > 1
    ? `${fileCount} files`
    : fileName || 'a file';

  const subject = `${senderName} shared ${fileText} with you via Tallow`;

  // HTML version with Tallow dark theme branding
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${subject}</title>
  <style>
    @media (prefers-color-scheme: dark) {
      body {
        background-color: ${BRAND_COLORS.background} !important;
        color: ${BRAND_COLORS.text} !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.text};">
  <!-- Main container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Content card -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.surface}; border-radius: 12px; border: 1px solid ${BRAND_COLORS.border}; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">

          <!-- Header with logo -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); width: 56px; height: 56px; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 32px; line-height: 56px;">📁</span>
                  </td>
                  <td style="padding-left: 16px;">
                    <div style="font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.text}; letter-spacing: -0.5px;">Tallow</div>
                    <div style="font-size: 12px; color: ${BRAND_COLORS.textMuted}; margin-top: 2px;">Secure File Transfer</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding: 0 40px 32px;">

              <!-- Title -->
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: ${BRAND_COLORS.text}; line-height: 1.4;">
                ${senderName} shared ${fileText} with you
              </h1>

              <!-- Description -->
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
                You have received a secure file transfer. Click the button below to download your files.
              </p>

              ${message ? `
              <!-- Custom message -->
              <div style="background-color: ${BRAND_COLORS.background}; border-left: 3px solid ${BRAND_COLORS.primary}; padding: 16px 20px; margin-bottom: 24px; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${BRAND_COLORS.text}; font-style: italic;">
                  "${message}"
                </p>
              </div>
              ` : ''}

              <!-- File info card -->
              <div style="background-color: ${BRAND_COLORS.background}; padding: 20px; border-radius: 8px; margin-bottom: 28px; border: 1px solid ${BRAND_COLORS.border};">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <div style="font-size: 12px; font-weight: 600; color: ${BRAND_COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                        Transfer Details
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">From:</td>
                          <td align="right" style="font-size: 14px; color: ${BRAND_COLORS.text}; font-weight: 500;">${senderName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${fileName ? `
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">File:</td>
                          <td align="right" style="font-size: 14px; color: ${BRAND_COLORS.text}; font-weight: 500;">${fileName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  ${fileCount > 1 ? `
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Files:</td>
                          <td align="right" style="font-size: 14px; color: ${BRAND_COLORS.text}; font-weight: 500;">${fileCount} files</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  ${fileSize ? `
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Size:</td>
                          <td align="right" style="font-size: 14px; color: ${BRAND_COLORS.text}; font-weight: 500;">${fileSize}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Expires:</td>
                          <td align="right" style="font-size: 14px; color: ${BRAND_COLORS.warning}; font-weight: 500;">${expiryText}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Download button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${shareLink}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);">
                      Download Files
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <div style="background-color: ${BRAND_COLORS.background}; border: 1px solid ${BRAND_COLORS.border}; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: top; padding-right: 12px;">
                      <span style="font-size: 20px;">🔒</span>
                    </td>
                    <td>
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${BRAND_COLORS.textMuted};">
                        <strong style="color: ${BRAND_COLORS.text};">Secure Transfer:</strong> This file is encrypted end-to-end and will be automatically deleted after download or expiration.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Alternative link -->
              <div style="padding-top: 20px; border-top: 1px solid ${BRAND_COLORS.border};">
                <p style="margin: 0 0 8px; font-size: 12px; color: ${BRAND_COLORS.textMuted};">
                  If the button doesn't work, copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.primary}; word-break: break-all;">
                  ${shareLink}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND_COLORS.background}; border-top: 1px solid ${BRAND_COLORS.border}; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${BRAND_COLORS.textMuted}; text-align: center;">
                Secure, private, peer-to-peer file transfers
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted}; text-align: center;">
                <a href="https://tallow.app" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Visit Tallow</a>
                <span style="color: ${BRAND_COLORS.border}; margin: 0 8px;">•</span>
                <a href="https://tallow.app/security" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Security</a>
                <span style="color: ${BRAND_COLORS.border}; margin: 0 8px;">•</span>
                <a href="https://tallow.app/privacy" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Privacy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version
  const text = `
${senderName} shared ${fileText} with you via Tallow

${message ? `Message: "${message}"\n\n` : ''}

TRANSFER DETAILS
----------------
From: ${senderName}
${fileName ? `File: ${fileName}\n` : ''}${fileCount > 1 ? `Files: ${fileCount} files\n` : ''}${fileSize ? `Size: ${fileSize}\n` : ''}Expires: ${expiryText}

DOWNLOAD YOUR FILES
${shareLink}

SECURITY NOTICE
This file is encrypted end-to-end and will be automatically deleted after download or expiration.

---
Powered by Tallow - Secure, private, peer-to-peer file transfers
Visit: https://tallow.app
Security: https://tallow.app/security
Privacy: https://tallow.app/privacy

If you did not expect this file, please disregard this email.
  `.trim();

  return { html, text, subject };
}

/**
 * Generate welcome email template
 * Template for new user onboarding
 */
export function welcomeEmailTemplate(params: WelcomeEmailParams): EmailTemplate {
  const { name, appUrl = 'https://tallow.app' } = params;

  const subject = `Welcome to Tallow - Secure File Transfer`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background}; color: ${BRAND_COLORS.text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.background}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${BRAND_COLORS.surface}; border-radius: 12px; border: 1px solid ${BRAND_COLORS.border}; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); width: 64px; height: 64px; border-radius: 16px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 40px; line-height: 64px;">🚀</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 0; font-size: 28px; font-weight: 700; color: ${BRAND_COLORS.text};">
                Welcome to Tallow!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px;">

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
                Hi ${name},
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
                Thanks for choosing Tallow for your secure file transfers. We're excited to have you on board!
              </p>

              <!-- Features -->
              <div style="background-color: ${BRAND_COLORS.background}; padding: 24px; border-radius: 8px; margin-bottom: 28px; border: 1px solid ${BRAND_COLORS.border};">
                <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: ${BRAND_COLORS.text};">
                  What makes Tallow special?
                </h2>

                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                  <tr>
                    <td style="padding: 12px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <span style="font-size: 24px;">🔒</span>
                          </td>
                          <td>
                            <div style="font-size: 15px; font-weight: 600; color: ${BRAND_COLORS.text}; margin-bottom: 4px;">End-to-End Encryption</div>
                            <div style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Your files are encrypted on your device before transfer</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <span style="font-size: 24px;">⚡</span>
                          </td>
                          <td>
                            <div style="font-size: 15px; font-weight: 600; color: ${BRAND_COLORS.text}; margin-bottom: 4px;">Peer-to-Peer Transfer</div>
                            <div style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Direct connection between devices for maximum speed</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <span style="font-size: 24px;">🕶️</span>
                          </td>
                          <td>
                            <div style="font-size: 15px; font-weight: 600; color: ${BRAND_COLORS.text}; margin-bottom: 4px;">Complete Privacy</div>
                            <div style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">No cloud storage, no tracking, no data collection</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-top: 1px solid ${BRAND_COLORS.border};">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="vertical-align: top; padding-right: 12px;">
                            <span style="font-size: 24px;">🌐</span>
                          </td>
                          <td>
                            <div style="font-size: 15px; font-weight: 600; color: ${BRAND_COLORS.text}; margin-bottom: 4px;">Cross-Platform</div>
                            <div style="font-size: 14px; color: ${BRAND_COLORS.textMuted};">Works on any device with a modern web browser</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.primaryDark} 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);">
                      Start Transferring
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: ${BRAND_COLORS.textMuted};">
                If you have any questions or need help getting started, check out our documentation or reach out to our support team.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND_COLORS.background}; border-top: 1px solid ${BRAND_COLORS.border}; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${BRAND_COLORS.textMuted}; text-align: center;">
                Need help? We're here for you
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textMuted}; text-align: center;">
                <a href="${appUrl}/docs" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Documentation</a>
                <span style="color: ${BRAND_COLORS.border}; margin: 0 8px;">•</span>
                <a href="${appUrl}/security" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Security</a>
                <span style="color: ${BRAND_COLORS.border}; margin: 0 8px;">•</span>
                <a href="mailto:support@tallow.app" style="color: ${BRAND_COLORS.primary}; text-decoration: none;">Support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version
  const text = `
Welcome to Tallow!

Hi ${name},

Thanks for choosing Tallow for your secure file transfers. We're excited to have you on board!

WHAT MAKES TALLOW SPECIAL?

🔒 End-to-End Encryption
Your files are encrypted on your device before transfer

⚡ Peer-to-Peer Transfer
Direct connection between devices for maximum speed

🕶️ Complete Privacy
No cloud storage, no tracking, no data collection

🌐 Cross-Platform
Works on any device with a modern web browser

GET STARTED
Visit: ${appUrl}

If you have any questions or need help getting started, check out our documentation or reach out to our support team.

RESOURCES
Documentation: ${appUrl}/docs
Security: ${appUrl}/security
Support: support@tallow.app

---
Powered by Tallow - Secure, private, peer-to-peer file transfers
  `.trim();

  return { html, text, subject };
}

export default {
  shareEmailTemplate,
  welcomeEmailTemplate,
};
