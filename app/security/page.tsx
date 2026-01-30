import Link from "next/link";
import { Shield, Lock, Key, Eye, Fingerprint, Layers, Radio, Globe } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

const securityFeatures = [
    {
        icon: Key,
        title: "Post-Quantum Encryption",
        desc: "ML-KEM-768 (Kyber) + X25519 hybrid key exchange protects against both classical and quantum computing attacks.",
    },
    {
        icon: Lock,
        title: "AES-256-GCM",
        desc: "All file data is encrypted with AES-256-GCM authenticated encryption. Each chunk has its own nonce.",
    },
    {
        icon: Layers,
        title: "Triple Ratchet Protocol",
        desc: "Forward secrecy through continuous key rotation. Compromising one message key cannot decrypt past or future messages.",
    },
    {
        icon: Fingerprint,
        title: "SAS Verification",
        desc: "Short Authentication String verification prevents man-in-the-middle attacks. Verify your peer with emoji or word codes.",
    },
    {
        icon: Eye,
        title: "Traffic Obfuscation",
        desc: "Optional padding and decoy traffic makes it impossible to determine file sizes or transfer patterns through traffic analysis.",
    },
    {
        icon: Radio,
        title: "Onion Routing",
        desc: "Multi-hop encrypted routing hides the true source and destination of transfers from network observers.",
    },
    {
        icon: Globe,
        title: "Zero Knowledge Architecture",
        desc: "Our servers never see your files, keys, or metadata. All encryption happens client-side before any data leaves your device.",
    },
    {
        icon: Shield,
        title: "Signed Prekeys",
        desc: "Identity-bound signed prekeys ensure you're always connecting to the intended recipient, preventing impersonation.",
    },
];

const protocols = [
    { name: "Key Exchange", value: "ML-KEM-768 + X25519" },
    { name: "Symmetric Encryption", value: "AES-256-GCM" },
    { name: "Key Derivation", value: "HKDF-SHA-256" },
    { name: "Hashing", value: "SHA-256" },
    { name: "Forward Secrecy", value: "Triple Ratchet + Sparse PQ Ratchet" },
    { name: "Authentication", value: "Signed Prekeys + SAS" },
    { name: "Transport", value: "WebRTC (DTLS-SRTP)" },
    { name: "Signaling", value: "Encrypted WebSocket" },
];

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero */}
            <section className="section-hero-dark pt-32 pb-20">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-hero-fg/10 mx-auto mb-6 animate-fade-up">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">Security</h1>
                        <p className="body-xl max-w-2xl mx-auto animate-fade-up stagger-2 text-hero-muted">
                            Military-grade encryption with post-quantum protection.
                            Your files are secure against both current and future threats.
                        </p>
                    </div>
                </div>
            </section>

            {/* Security Features Grid */}
            <section className="section-content-lg">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="heading-xl mb-12 text-center">How We Protect You</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {securityFeatures.map((feature, i) => (
                                <div
                                    key={i}
                                    className="card-feature animate-fade-up"
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary shrink-0">
                                            <feature.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="heading-sm mb-2">{feature.title}</h3>
                                            <p className="body-md">{feature.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Protocol Table */}
            <section className="section-dark">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="heading-xl mb-12 text-center">Cryptographic Protocols</h2>
                        <div className="space-y-4">
                            {protocols.map((protocol, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-5 rounded-xl bg-hero-fg/5 border border-hero-fg/10 animate-fade-up"
                                    style={{ animationDelay: `${i * 0.06}s` }}
                                >
                                    <span className="font-medium">{protocol.name}</span>
                                    <span className="text-hero-muted font-mono text-sm">{protocol.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section className="section-content border-t border-border">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="heading-xl mb-8">Security Architecture</h2>
                        <div className="space-y-8">
                            <div>
                                <h3 className="heading-sm mb-3">End-to-End Encryption</h3>
                                <p className="body-lg text-muted-foreground">
                                    Files are encrypted on your device before any network transmission occurs.
                                    The encryption key is derived from a hybrid post-quantum key exchange that combines
                                    ML-KEM-768 (NIST-standardized) with X25519 elliptic curve Diffie-Hellman.
                                    Even if our signaling server were compromised, attackers cannot decrypt your files.
                                </p>
                            </div>
                            <div>
                                <h3 className="heading-sm mb-3">Forward Secrecy</h3>
                                <p className="body-lg text-muted-foreground">
                                    The Triple Ratchet protocol continuously rotates encryption keys. Each message uses a unique
                                    key derived from the current chain state. The Sparse PQ Ratchet periodically performs
                                    fresh post-quantum key exchanges, ensuring long-lived sessions remain secure against
                                    quantum attacks.
                                </p>
                            </div>
                            <div>
                                <h3 className="heading-sm mb-3">Peer Authentication</h3>
                                <p className="body-lg text-muted-foreground">
                                    Signed prekeys bind each session to a verified identity. The Short Authentication String (SAS)
                                    protocol allows you to verify your peer out-of-band using emoji or word sequences,
                                    preventing man-in-the-middle attacks even against a compromised signaling server.
                                </p>
                            </div>
                            <div>
                                <h3 className="heading-sm mb-3">Open Source Audit</h3>
                                <p className="body-lg text-muted-foreground">
                                    All cryptographic code is open source and available for public audit. We use well-established
                                    libraries (noble-hashes, pqc-kyber) and follow NIST standards for post-quantum cryptography.
                                </p>
                            </div>
                        </div>
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
