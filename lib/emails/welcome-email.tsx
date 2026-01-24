import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
    const firstName = name.split(' ')[0];

    return (
        <Html>
            <Head />
            <Preview>Welcome to Tallow - Share Files Anywhere, Securely!</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header with gradient background */}
                    <Section style={headerSection}>
                        <div style={logoContainer}>
                            <Text style={logoText}>📤</Text>
                        </div>
                        <Heading style={heading}>
                            Welcome to Tallow!
                        </Heading>
                    </Section>

                    {/* Main content */}
                    <Section style={contentSection}>
                        <Text style={greeting}>
                            Hey {firstName}! 👋
                        </Text>

                        <Text style={paragraph}>
                            You&apos;ve just unlocked the most powerful way to share files.
                            Whether you&apos;re transferring to devices across the room or across
                            the world, Tallow has you covered.
                        </Text>

                        <Hr style={divider} />

                        {/* Features */}
                        <Heading as="h2" style={subheading}>
                            Here&apos;s what you can do:
                        </Heading>

                        <Section style={featureRow}>
                            <Text style={featureIcon}>📡</Text>
                            <div>
                                <Text style={featureTitle}>Local Network Transfers</Text>
                                <Text style={featureDesc}>
                                    Lightning-fast transfers over WiFi or LAN. No internet needed!
                                </Text>
                            </div>
                        </Section>

                        <Section style={featureRow}>
                            <Text style={featureIcon}>🌍</Text>
                            <div>
                                <Text style={featureTitle}>Internet P2P Transfers</Text>
                                <Text style={featureDesc}>
                                    Send files anywhere in the world with end-to-end encryption.
                                </Text>
                            </div>
                        </Section>

                        <Section style={featureRow}>
                            <Text style={featureIcon}>🔗</Text>
                            <div>
                                <Text style={featureTitle}>Easy Connections</Text>
                                <Text style={featureDesc}>
                                    Connect with QR codes, word phrases, or numeric codes.
                                </Text>
                            </div>
                        </Section>

                        <Section style={featureRow}>
                            <Text style={featureIcon}>📋</Text>
                            <div>
                                <Text style={featureTitle}>Clipboard Sync</Text>
                                <Text style={featureDesc}>
                                    Share clipboard content between connected devices instantly.
                                </Text>
                            </div>
                        </Section>

                        <Hr style={divider} />

                        {/* CTA */}
                        <Section style={ctaSection}>
                            <Link href="http://localhost:3000/app" style={ctaButton}>
                                Start Sharing Now →
                            </Link>
                        </Section>

                        <Text style={paragraph}>
                            Your data stays on your device. We don&apos;t collect, store, or
                            access your files. Privacy is built into everything we do.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            © 2024 Tallow. Share files anywhere, securely.
                        </Text>
                        <Text style={footerLinks}>
                            Made with ❤️ for seamless file sharing
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#0a0a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#0f0f23',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #1a1a3a',
};

const headerSection = {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
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
};

const logoText = {
    fontSize: '40px',
    margin: '0',
    textAlign: 'center' as const,
};

const heading = {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    textAlign: 'center' as const,
};

const contentSection = {
    padding: '40px 30px',
};

const greeting = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 20px',
};

const paragraph = {
    color: '#a1a1aa',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 20px',
};

const divider = {
    borderColor: '#27273f',
    margin: '30px 0',
};

const subheading = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 20px',
};

const featureRow = {
    display: 'flex',
    marginBottom: '20px',
};

const featureIcon = {
    fontSize: '28px',
    marginRight: '15px',
    width: '40px',
};

const featureTitle = {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px',
};

const featureDesc = {
    color: '#71717a',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0',
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '30px 0',
};

const ctaButton = {
    backgroundColor: '#6366f1',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px 30px',
    borderRadius: '10px',
    textDecoration: 'none',
    display: 'inline-block',
};

const footer = {
    backgroundColor: '#0a0a14',
    padding: '30px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#52525b',
    fontSize: '13px',
    margin: '0 0 8px',
};

const footerLinks = {
    color: '#6366f1',
    fontSize: '13px',
    margin: '0',
};

export default WelcomeEmail;
