import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero */}
            <section className="section-hero-dark pt-32 pb-16">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <p className="label mb-4 animate-fade-up text-hero-muted">Legal</p>
                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">Terms of Use</h1>
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
                            <h2 className="heading-lg mb-4">Acceptance of Terms</h2>
                            <p className="body-lg text-muted-foreground">
                                By using Tallow, you agree to these terms. Tallow is a peer-to-peer file transfer tool
                                provided as-is, free of charge. If you do not agree with these terms, do not use the service.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Description of Service</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow enables direct peer-to-peer file transfers between devices. Files are encrypted
                                end-to-end and transferred directly between users without passing through our servers.
                                We provide a signaling service to establish connections and optional TURN relay servers
                                for NAT traversal.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Acceptable Use</h2>
                            <p className="body-lg text-muted-foreground mb-4">
                                You agree to use Tallow only for lawful purposes. You may not use the service to:
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Transfer illegal content or materials that violate applicable laws",
                                    "Distribute malware, viruses, or other harmful software",
                                    "Infringe on intellectual property rights of others",
                                    "Harass, threaten, or harm other users",
                                    "Attempt to disrupt or overload the signaling infrastructure",
                                    "Reverse engineer the service for malicious purposes",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                        <p className="body-md text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">No Warranty</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow is provided &quot;as is&quot; without warranty of any kind, express or implied.
                                We do not guarantee uninterrupted service, data integrity during transfers, or
                                compatibility with all devices and networks. Use at your own risk.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Limitation of Liability</h2>
                            <p className="body-lg text-muted-foreground">
                                To the maximum extent permitted by law, Tallow and its contributors shall not be liable
                                for any indirect, incidental, special, or consequential damages arising from your use
                                of the service. This includes but is not limited to data loss, failed transfers,
                                or security breaches.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">User Responsibility</h2>
                            <p className="body-lg text-muted-foreground">
                                You are solely responsible for the content you transfer using Tallow. Since transfers
                                are end-to-end encrypted, we cannot monitor or control what is shared. You must ensure
                                you have the right to share any files you transfer.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Open Source License</h2>
                            <p className="body-lg text-muted-foreground">
                                Tallow is open source software. The source code is available for review, modification,
                                and redistribution under its respective license. These terms of use apply specifically
                                to the hosted service at this domain.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Modifications</h2>
                            <p className="body-lg text-muted-foreground">
                                We may update these terms at any time. Continued use of Tallow after changes
                                constitutes acceptance of the new terms. Material changes will be noted with
                                an updated date at the top of this page.
                            </p>
                        </div>

                        <div>
                            <h2 className="heading-lg mb-4">Termination</h2>
                            <p className="body-lg text-muted-foreground">
                                We reserve the right to block access to the signaling server for users who violate
                                these terms. Since Tallow is peer-to-peer and open source, you can always run your
                                own instance of the service.
                            </p>
                        </div>

                        <div className="border-t border-border pt-8">
                            <p className="body-md text-muted-foreground">
                                For questions about these terms, open an issue on our GitHub repository.
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
