import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero */}
            <section className="section-hero-dark pt-32 pb-16">
                <div className="container mx-auto px-6 relative z-10">
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
            <section className="section-content">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto space-y-12">

                        <div>
                            <h2 className="heading-lg mb-4">Overview</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow is designed with privacy as its core principle. We do not collect, store, or process your files.
                                All transfers happen directly between devices using peer-to-peer connections. This privacy policy
                                explains what minimal data we handle and how we protect your rights.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Data We Do Not Collect</h2>
                            <div className="space-y-3">
                                {[
                                    "File contents — your files never pass through our servers",
                                    "File names or metadata",
                                    "Personal information or accounts",
                                    "IP addresses of transfer participants",
                                    "Transfer history or logs",
                                    "Cookies or tracking pixels",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                        <p className="body-md text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Signaling Server</h2>
                            <p className="body-lg text-muted-foreground mb-4">
                                Our signaling server facilitates the initial connection between peers. It handles:
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Temporary room IDs for connection establishment (deleted after connection)",
                                    "Encrypted WebRTC signaling messages (we cannot read them)",
                                    "ICE candidates for NAT traversal",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                        <p className="body-md text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="body-md text-muted-foreground mt-4">
                                All signaling data is ephemeral and automatically purged when the connection is established or times out.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Local Storage</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow stores preferences and cryptographic keys locally in your browser using IndexedDB and localStorage.
                                This data never leaves your device. You can clear it at any time through your browser settings
                                or the app&apos;s Settings page.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Third-Party Services</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow does not integrate with any analytics, advertising, or tracking services.
                                We do not share any data with third parties. The only external services used are
                                STUN/TURN servers for WebRTC connectivity, which only see encrypted connection metadata.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Open Source</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow is open source. You can audit the code yourself to verify our privacy claims.
                                We believe transparency is the strongest form of trust.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Your Rights</h2>
                            <p className="body-lg text-muted-foreground">
                                Since we don&apos;t collect personal data, there is nothing to request, modify, or delete.
                                Your files and transfer history exist only on your own device. You have full control.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Changes</h2>
                            <p className="body-lg text-muted-foreground">
                                If we update this policy, changes will be reflected on this page with an updated date.
                                Our commitment to zero data collection will not change.
                            </p>
                        </div>

                        <div className="border-t border-border pt-8">
                            <p className="body-md text-muted-foreground">
                                Questions? Tallow is open source — review the code or open an issue on GitHub.
                            </p>
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
