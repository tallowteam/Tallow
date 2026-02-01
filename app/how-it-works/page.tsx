import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Upload,
    Download,
    Wifi,
    Globe,
    ArrowRight,
    Shield,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
    title: "How It Works | Tallow - P2P Encrypted File Transfer",
    description: "Learn how Tallow works: direct peer-to-peer connections, post-quantum encryption, word-phrase codes, and secure file transfers without servers.",
};

const senderSteps = [
    { step: "01", title: "Select Files", desc: "Drag and drop, or paste text. No size limits." },
    { step: "02", title: "Get Your Code", desc: "Unique 3-word phrase or 6-character code." },
    { step: "03", title: "Share the Code", desc: "Send via any channel — text, email, verbal." },
    { step: "04", title: "Transfer", desc: "Post-quantum encrypted, direct P2P connection." },
];

const receiverSteps = [
    { step: "01", title: "Get the Code", desc: "Receive the phrase or code from sender." },
    { step: "02", title: "Enter It", desc: "Paste the code in Tallow's receive section." },
    { step: "03", title: "Verify (SAS)", desc: "Optional: verify emoji/word to prevent MITM." },
    { step: "04", title: "Download", desc: "Files arrive directly, decrypted on your device." },
];

const faq = [
    { q: "What files can I send?", a: "Everything — documents, images, videos, archives. No restrictions." },
    { q: "Is there a size limit?", a: "No limits. Files go directly between devices." },
    { q: "Do I need an account?", a: "No account needed to transfer. Optional for saved contacts." },
    { q: "What is Friends list?", a: "Save trusted contacts for instant, code-free sharing." },
    { q: "Is it post-quantum secure?", a: "Yes! ML-KEM (Kyber) + X25519 hybrid encryption protects against future quantum attacks." },
    { q: "What is Traffic Obfuscation?", a: "Optional feature that adds padding and decoy traffic to resist traffic analysis." },
];

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero - Dark */}
            <section className="section-hero-dark grid-pattern pt-28 sm:pt-32 pb-16 sm:pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-label mb-3 sm:mb-4 animate-fade-up text-hero-muted">
                            How It Works
                        </p>

                        <h1 className="text-display-lg mb-4 sm:mb-6 animate-fade-up stagger-1">
                            Simple, Secure File Sharing
                        </h1>
                        <p className="text-body-xl max-w-2xl mx-auto animate-fade-up stagger-2 text-hero-muted">
                            Send and receive files in just a few steps. No complexity, no accounts required.
                        </p>
                    </div>
                </div>
            </section>

            {/* Connection Types */}
            <section className="section-content border-b border-border py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="rounded-2xl p-6 sm:p-8 text-center animate-fade-up bg-card border border-card-border">
                            <Wifi className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-heading-sm mb-1.5 sm:mb-2">Local WiFi</h3>
                            <p className="text-body-md">Fastest speeds</p>
                        </div>
                        <div className="card-dark rounded-2xl p-6 sm:p-8 text-center animate-fade-up stagger-1">
                            <Globe className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-heading-sm mb-1.5 sm:mb-2">Internet</h3>
                            <p className="text-body-md text-hero-muted">Anywhere in the world</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sender Steps */}
            <section className="section-lg py-16 sm:py-20 lg:py-28">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12 animate-fade-up">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-primary shrink-0">
                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-heading-lg">Sending Files</h2>
                                <p className="text-label text-muted-foreground">How to Send</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                            {senderSteps.map((step, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-5 sm:p-6 lg:p-8 bg-card border border-card-border animate-fade-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
                                        <span className="font-display text-3xl sm:text-4xl font-light text-muted-foreground tabular-nums shrink-0">{step.step}</span>
                                        <div className="pt-1">
                                            <h3 className="text-heading-sm mb-1.5 sm:mb-2">{step.title}</h3>
                                            <p className="text-body-md">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Receiver Steps - Dark */}
            <section className="section-dark py-16 sm:py-20 lg:py-28">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12 animate-fade-up">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-hero-fg/10 shrink-0">
                                <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h2 className="text-heading-lg">Receiving Files</h2>
                                <p className="text-label text-hero-muted">How to Receive</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                            {receiverSteps.map((step, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-5 sm:p-6 lg:p-8 bg-hero-fg/5 border border-hero-fg/10 animate-fade-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
                                        <span className="font-display text-3xl sm:text-4xl font-light text-hero-fg/40 tabular-nums shrink-0">{step.step}</span>
                                        <div className="pt-1">
                                            <h3 className="text-heading-sm mb-1.5 sm:mb-2">{step.title}</h3>
                                            <p className="text-body-md text-hero-muted">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Callout */}
            <section className="section-content border-t border-border py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card-dark max-w-4xl mx-auto p-6 sm:p-8 lg:p-12 rounded-2xl text-center animate-fade-up">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center bg-hero-fg/10">
                            <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
                        </div>
                        <h2 className="text-heading-lg mb-3 sm:mb-4">Military-Grade Privacy</h2>
                        <p className="text-body-lg mb-6 sm:mb-8 text-hero-muted max-w-2xl mx-auto">
                            Post-quantum ML-KEM encryption with Triple Ratchet forward secrecy.
                            Optional traffic obfuscation and onion routing for maximum privacy.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                            {["Post-Quantum", "Triple Ratchet", "Zero Knowledge", "E2E Encrypted"].map((tag) => (
                                <span key={tag} className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full bg-hero-fg/10 text-xs sm:text-sm font-medium uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <Link href="/security" className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity inline-flex items-center gap-1">
                            Security Details <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section-content border-t border-border py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-display-md mb-8 sm:mb-10 lg:mb-12 text-center animate-fade-up">
                            Questions?
                        </h2>
                        <div className="space-y-3 sm:space-y-4">
                            {faq.map((item, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-5 sm:p-6 lg:p-8 bg-card border border-card-border animate-fade-up"
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                >
                                    <h3 className="text-heading-sm mb-1.5 sm:mb-2">{item.q}</h3>
                                    <p className="text-body-md">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section-lg border-t border-border py-16 sm:py-20 lg:py-28">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-display-md mb-6 sm:mb-8 animate-fade-up">
                            Try It Now
                        </h2>
                        <Link href="/app">
                            <Button size="lg" className="animate-fade-up stagger-1 min-w-[160px]">
                                Get Started
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-8 sm:py-10 lg:py-12 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                        <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
                            tallow
                        </Link>
                        <div className="flex items-center gap-4 sm:gap-6">
                            <Link href="/privacy" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Privacy</Link>
                            <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Security</Link>
                            <Link href="/terms" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Terms</Link>
                        </div>
                        <p className="text-sm text-muted-foreground">Open source &bull; Privacy first</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
