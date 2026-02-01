import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
    title: "Privacy Policy | Tallow - Zero-Knowledge File Transfer",
    description: "Tallow's privacy policy: zero-knowledge architecture, no server-side storage, end-to-end encryption, and complete data sovereignty.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero */}
            <section className="section-hero-dark pt-32 pb-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <p className="label mb-4 animate-fade-up text-hero-muted">Legal</p>
                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">Privacy Policy</h1>
                        <p className="body-xl animate-fade-up stagger-2 text-hero-muted">
                            Last updated: January 2025
                        </p>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16 sm:py-20 lg:py-24 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto space-y-16">

                        <article>
                            <h2 className="heading-lg mb-6">Overview</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                Tallow is designed with privacy as its core principle. We do not collect, store, or process your files.
                                All transfers happen directly between devices using peer-to-peer connections. This privacy policy
                                explains what minimal data we handle and how we protect your rights.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Data We Do Not Collect</h2>
                            <ul className="space-y-4">
                                {[
                                    "File contents — your files never pass through our servers",
                                    "File names or metadata",
                                    "Personal information or accounts",
                                    "IP addresses of transfer participants",
                                    "Transfer history or logs",
                                    "Cookies or tracking pixels",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" aria-hidden="true" />
                                        <span className="body-md text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Signaling Server</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed mb-6">
                                Our signaling server facilitates the initial connection between peers. It handles:
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Temporary room IDs for connection establishment (deleted after connection)",
                                    "Encrypted WebRTC signaling messages (we cannot read them)",
                                    "ICE candidates for NAT traversal",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" aria-hidden="true" />
                                        <span className="body-md text-muted-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="body-md text-muted-foreground mt-6">
                                All signaling data is ephemeral and automatically purged when the connection is established or times out.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Local Storage</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                Tallow stores preferences and cryptographic keys locally in your browser using IndexedDB and localStorage.
                                This data never leaves your device. You can clear it at any time through your browser settings
                                or the app&apos;s Settings page.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Third-Party Services</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                Tallow does not integrate with any analytics, advertising, or tracking services.
                                We do not share any data with third parties. The only external services used are
                                STUN/TURN servers for WebRTC connectivity, which only see encrypted connection metadata.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Open Source</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                Tallow is open source. You can audit the code yourself to verify our privacy claims.
                                We believe transparency is the strongest form of trust.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Your Rights</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                Since we don&apos;t collect personal data, there is nothing to request, modify, or delete.
                                Your files and transfer history exist only on your own device. You have full control.
                            </p>
                        </article>

                        <article>
                            <h2 className="heading-lg mb-6">Changes</h2>
                            <p className="body-lg text-muted-foreground leading-relaxed">
                                If we update this policy, changes will be reflected on this page with an updated date.
                                Our commitment to zero data collection will not change.
                            </p>
                        </article>

                        <div className="border-t border-border pt-12 mt-16">
                            <p className="body-md text-muted-foreground">
                                Questions? Tallow is open source — review the code or open an issue on GitHub.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 sm:py-16 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
                            tallow
                        </Link>
                        <nav className="flex items-center gap-6 sm:gap-8" aria-label="Footer navigation">
                            <Link href="/privacy" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Privacy</Link>
                            <Link href="/security" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Security</Link>
                            <Link href="/terms" className="text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity">Terms</Link>
                        </nav>
                        <p className="text-sm text-muted-foreground">Open source &bull; Privacy first</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
