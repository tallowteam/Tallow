'use client';

// Note: This page is a client component because it passes React components (icons)
// to child components. For SEO, consider using next/head or a separate metadata export.
// import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ResponsiveFeaturesGrid,
    ResponsiveSection,
} from "@/components/features/responsive-features-grid";
import {
    Shield,
    Wifi,
    Globe,
    Lock,
    Users,
    FolderOpen,
    Type,
    Infinity,
    Check,
    ArrowRight,
    Zap,
    EyeOff,
    Route,
    Key,
    Fingerprint,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";

// Metadata must be in a separate layout.tsx or use generateMetadata in a server component
// export const metadata: Metadata = {
//     title: "Features | Tallow - Post-Quantum Secure File Transfer",
//     description: "Explore Tallow's powerful features...",
// };

const features = [
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Direct peer-to-peer transfers at your network's maximum speed. No servers in between.",
    },
    {
        icon: Shield,
        title: "Post-Quantum Security",
        description: "ML-KEM (Kyber) + X25519 hybrid encryption. Future-proof against quantum computers.",
    },
    {
        icon: Key,
        title: "Triple Ratchet Protocol",
        description: "Perfect forward secrecy with combined classical and post-quantum key rotation.",
    },
    {
        icon: EyeOff,
        title: "Traffic Obfuscation",
        description: "Padding, decoy traffic, and constant bitrate to resist traffic analysis attacks.",
    },
    {
        icon: Route,
        title: "Onion Routing",
        description: "Optional multi-hop relay routing for enhanced anonymity. 1-3 hop circuits.",
    },
    {
        icon: Fingerprint,
        title: "SAS Verification",
        description: "Short Authentication Strings to verify connections and prevent MITM attacks.",
    },
    {
        icon: Lock,
        title: "Passphrase Protection",
        description: "Unique 3-word phrase or 6-character code for each transfer. Optional passwords.",
    },
    {
        icon: Wifi,
        title: "Local Network",
        description: "Share on WiFi without internet. Perfect for offices, home, or offline spaces.",
    },
    {
        icon: Globe,
        title: "Internet P2P",
        description: "Send to anyone, anywhere in the world. NAT traversal handles the complexity.",
    },
    {
        icon: Users,
        title: "Friends List",
        description: "Save trusted contacts. Skip passcodes for friends you trust.",
    },
    {
        icon: FolderOpen,
        title: "Folder Transfers",
        description: "Send entire folders with all contents. Structure preserved automatically.",
    },
    {
        icon: Type,
        title: "Text & Code",
        description: "Share text snippets, code, notes, or clipboard content instantly.",
    },
    {
        icon: Infinity,
        title: "No Limits",
        description: "Unlimited file sizes. No restrictions on file types. Send anything.",
    },
];

const security = [
    "Post-Quantum Safe (ML-KEM)",
    "Triple Ratchet Forward Secrecy",
    "AES-256-GCM Encryption",
    "Traffic Obfuscation",
    "Onion Routing",
    "Zero Knowledge",
    "Open Source",
    "SAS Verification",
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero - Dark */}
            <section className="relative bg-background pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-36 md:pb-24 lg:pt-40 lg:pb-28">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3 sm:mb-4 animate-fade-up">
                            Features
                        </p>

                        <h1 className="text-display-md sm:text-display-lg mb-4 sm:mb-6 animate-fade-up stagger-1">
                            Everything You Need to Share Files Securely
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-up stagger-2">
                            Powerful features, zero complexity. Built for speed, privacy, and simplicity.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid - Using Responsive Components */}
            <ResponsiveFeaturesGrid features={features} />

            {/* Security Section */}
            <ResponsiveSection className="border-t border-border">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
                    <div className="animate-fade-up">
                        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3 sm:mb-4">Security</p>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-light tracking-tight leading-tight mb-4 sm:mb-5 md:mb-6">
                            Built With Security at the Core
                        </h2>
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-7 md:mb-8">
                            Your files never touch our servers. Everything encrypted end-to-end
                            with industry-standard algorithms.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {security.map((item) => (
                                <div key={item} className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 bg-primary">
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                                    </div>
                                    <span className="text-sm sm:text-base font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-10 text-center animate-fade-up stagger-2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto mb-4 sm:mb-5 md:mb-6 flex items-center justify-center bg-secondary">
                            <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-foreground" />
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-[1.75rem] font-light tracking-tight mb-2 sm:mb-3">Zero Knowledge</h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-5 md:mb-6">
                            We can&apos;t access your files. Only you and your recipient can.
                        </p>
                        <Link href="/security" className="inline-flex items-center text-xs sm:text-sm font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity">
                            Learn More <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        </Link>
                    </div>
                </div>
            </ResponsiveSection>

            {/* CTA */}
            <ResponsiveSection className="border-t border-border">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-light tracking-tight leading-tight mb-6 sm:mb-7 md:mb-8 animate-fade-up">
                        Ready to Try?
                    </h2>
                    <Link href="/app">
                        <Button size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base animate-fade-up stagger-1">
                            Get Started
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </ResponsiveSection>

            {/* Footer */}
            <footer className="border-t border-border py-8 sm:py-10 md:py-12 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                        <Link href="/" className="text-lg sm:text-xl tracking-tight lowercase font-serif text-foreground">
                            tallow
                        </Link>
                        <div className="flex items-center gap-4 sm:gap-6">
                            <Link href="/privacy" className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Privacy</Link>
                            <Link href="/security" className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Security</Link>
                            <Link href="/terms" className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Terms</Link>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Open source &bull; Privacy first</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
