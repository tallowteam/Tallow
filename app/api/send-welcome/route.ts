import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { WelcomeEmail } from '@/lib/emails/welcome-email';
import { createElement } from 'react';
import { secureLog } from '@/lib/utils/secure-logger';

// Lazy initialization - only create Resend instance when needed
let resend: Resend | null = null;
function getResend() {
    if (!resend && process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

// Simple rate limiting
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_EMAILS_PER_WINDOW = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const rateEntry = emailRateLimit.get(ip);

        if (rateEntry && now < rateEntry.resetTime) {
            if (rateEntry.count >= MAX_EMAILS_PER_WINDOW) {
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
            rateEntry.count++;
        } else {
            emailRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
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
            return NextResponse.json(
                { message: 'Email service not configured', skipped: true },
                { status: 200 }
            );
        }

        const { data, error } = await resendClient.emails.send({
            from: 'Tallow <onboarding@resend.dev>',
            to: [email],
            subject: '🎉 Welcome to Tallow - Your Files, Your Way!',
            react: createElement(WelcomeEmail, { name }),
        });

        if (error) {
            secureLog.error('Error sending welcome email:', error);
            return NextResponse.json(
                { error: 'Failed to send email', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: 'Welcome email sent successfully', data },
            { status: 200 }
        );
    } catch (error) {
        secureLog.error('Error in send-welcome API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

