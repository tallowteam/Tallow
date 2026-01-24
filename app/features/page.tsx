import Link from "next/link";
import { Button } from "@/components/ui/button";
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
            <section className="section-hero-dark grid-pattern pt-32 pb-20">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="label mb-4 animate-fade-up text-hero-muted">
                            Features
                        </p>

                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">
                            Everything You Need to Share Files Securely
                        </h1>
                        <p className="body-xl max-w-2xl mx-auto animate-fade-up stagger-2 text-hero-muted">
                            Powerful features, zero complexity. Built for speed, privacy, and simplicity.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Grid - Light */}
            <section className="section-content-lg">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {features.map((feature, i) => (
                            <div
                                key={i}
                                className="card-feature animate-fade-up"
                                style={{ animationDelay: `${i * 0.05}s` }}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary mb-6">
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <h3 className="heading-sm mb-3">{feature.title}</h3>
                                <p className="body-md">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="section-content border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="animate-fade-up">
                            <p className="label mb-4">Security</p>
                            <h2 className="display-md mb-6">
                                Built With Security at the Core
                            </h2>
                            <p className="body-lg mb-8">
                                Your files never touch our servers. Everything encrypted end-to-end
                                with industry-standard algorithms.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {security.map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-primary">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                        </div>
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card-dark p-10 text-center animate-fade-up stagger-2">
                            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-hero-fg/10">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="heading-md mb-3">Zero Knowledge</h3>
                            <p className="body-md text-hero-muted mb-6">
                                We can&apos;t access your files. Only you and your recipient can.
                            </p>
                            <Link href="/security" className="text-sm font-medium uppercase tracking-wider hover:opacity-70 transition-opacity">
                                Learn More <ArrowRight className="w-4 h-4 inline ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section-content-lg border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="display-md mb-8 animate-fade-up">
                            Ready to Try?
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
