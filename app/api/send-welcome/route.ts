import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { WelcomeEmail } from '@/lib/emails/welcome-email';
import { createElement } from 'react';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireApiKey } from '@/lib/api/auth';
import { requireCSRFToken } from '@/lib/security/csrf';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import { addDeprecationHeaders } from '@/lib/api/response';

// Lazy initialization - only create Resend instance when needed
let resend: Resend | null = null;
function getResend() {
    if (!resend && process.env['RESEND_API_KEY']) {
        resend = new Resend(process.env['RESEND_API_KEY']);
    }
    return resend;
}

// Rate limiting: 10 emails per minute per IP (using centralized rate limiter)
const welcomeEmailRateLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    message: 'Too many email requests. Please try again later.',
});

// RFC 5322 compliant email validation regex
const EMAIL_REGEX = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;

export async function POST(request: NextRequest) {
    try {
        // Validate CSRF token for non-GET requests
        const csrfError = requireCSRFToken(request);
        if (csrfError) {
            return csrfError;
        }

        // CRITICAL FIX: Require API key authentication to prevent spam abuse
        const authError = requireApiKey(request);
        if (authError) {return authError;}

        // Rate limiting (10 requests per minute per IP)
        const rateLimitResponse = welcomeEmailRateLimiter.check(request);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        const { email, name } = await request.json();

        if (!email || !name) {
            return NextResponse.json(
                { error: 'Email and name are required' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if API key is configured
        const resendClient = getResend();
        if (!resendClient) {
            secureLog.log('RESEND_API_KEY not configured, skipping welcome email');
            const response = NextResponse.json(
                { message: 'Email service not configured', skipped: true },
                { status: 200 }
            );
            return addDeprecationHeaders(response, '/api/v1/send-welcome');
        }

        const { data, error } = await resendClient.emails.send({
            from: 'Tallow <onboarding@resend.dev>',
            to: [email],
            subject: '🎉 Welcome to Tallow - Your Files, Your Way!',
            react: createElement(WelcomeEmail, { name }),
        });

        if (error) {
            secureLog.error('Error sending welcome email:', error);
            const errorResponse = NextResponse.json(
                { error: 'Failed to send email', details: error.message },
                { status: 500 }
            );
            return addDeprecationHeaders(errorResponse, '/api/v1/send-welcome');
        }

        const response = NextResponse.json(
            { message: 'Welcome email sent successfully', data },
            { status: 200 }
        );
        return addDeprecationHeaders(response, '/api/v1/send-welcome');
    } catch (error) {
        secureLog.error('Error in send-welcome API:', error);
        const errorResponse = NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
        return addDeprecationHeaders(errorResponse, '/api/v1/send-welcome');
    }
}

