import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Upload,
    Download,
    Lock,
    Wifi,
    Globe,
    ArrowRight,
    Shield,
    Key,
    Fingerprint,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";

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
            <section className="section-hero-dark grid-pattern pt-32 pb-20">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="label mb-4 animate-fade-up text-hero-muted">
                            How It Works
                        </p>

                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">
                            Simple, Secure File Sharing
                        </h1>
                        <p className="body-xl max-w-2xl mx-auto animate-fade-up stagger-2 text-hero-muted">
                            Send and receive files in just a few steps. No complexity, no accounts required.
                        </p>
                    </div>
                </div>
            </section>

            {/* Connection Types */}
            <section className="section-content border-b border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto grid grid-cols-2 gap-6">
                        <div className="card-feature p-8 text-center animate-fade-up">
                            <Wifi className="w-10 h-10 mx-auto mb-4" />
                            <h3 className="heading-sm mb-2">Local WiFi</h3>
                            <p className="body-md">Fastest speeds</p>
                        </div>
                        <div className="card-dark p-8 text-center animate-fade-up stagger-1">
                            <Globe className="w-10 h-10 mx-auto mb-4" />
                            <h3 className="heading-sm mb-2">Internet</h3>
                            <p className="body-md text-hero-muted">Anywhere in the world</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sender Steps */}
            <section className="section-content-lg">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 mb-12 animate-fade-up">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary">
                                <Upload className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="heading-lg">Sending Files</h2>
                                <p className="label">How to Send</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {senderSteps.map((step, i) => (
                                <div
                                    key={i}
                                    className="card-feature animate-fade-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex items-start gap-5">
                                        <span className="stat-number text-4xl text-muted-foreground">{step.step}</span>
                                        <div>
                                            <h3 className="heading-sm mb-2">{step.title}</h3>
                                            <p className="body-md">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Receiver Steps - Dark */}
            <section className="section-dark">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-4 mb-12 animate-fade-up">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-hero-fg/10">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="heading-lg">Receiving Files</h2>
                                <p className="label text-hero-muted">How to Receive</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {receiverSteps.map((step, i) => (
                                <div
                                    key={i}
                                    className="rounded-xl p-8 bg-hero-fg/5 border border-hero-fg/10 animate-fade-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <div className="flex items-start gap-5">
                                        <span className="stat-number text-4xl text-hero-fg/40">{step.step}</span>
                                        <div>
                                            <h3 className="heading-sm mb-2">{step.title}</h3>
                                            <p className="body-md text-hero-muted">{step.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Callout */}
            <section className="section-content border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="card-dark max-w-4xl mx-auto p-12 text-center animate-fade-up">
                        <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center bg-hero-fg/10">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h2 className="heading-lg mb-4">Military-Grade Privacy</h2>
                        <p className="body-lg mb-8 text-hero-muted">
                            Post-quantum ML-KEM encryption with Triple Ratchet forward secrecy.
                            Optional traffic obfuscation and onion routing for maximum privacy.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            {["Post-Quantum", "Triple Ratchet", "Zero Knowledge", "E2E Encrypted"].map((tag) => (
                                <span key={tag} className="px-5 py-2.5 rounded-full bg-hero-fg/10 text-sm font-medium uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <Link href="/security" className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity">
                            Security Details <ArrowRight className="w-4 h-4 inline ml-1" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section-content border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="display-md mb-12 text-center animate-fade-up">
                            Questions?
                        </h2>
                        <div className="space-y-4">
                            {faq.map((item, i) => (
                                <div
                                    key={i}
                                    className="card-feature animate-fade-up"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                >
                                    <h3 className="heading-sm mb-2">{item.q}</h3>
                                    <p className="body-md">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section-content-lg border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="display-md mb-8 animate-fade-up">
                            Try It Now
                        </h2>
                        <Link href="/app">
                            <Button size="lg" className="animate-fade-up stagger-1">
                                Get Started
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 bg-background">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
                            tallow
                        </Link>
                        <div className="flex items-center gap-6">
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
