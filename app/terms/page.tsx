import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ExpandableSection } from "@/components/ui/expandable-section";
import {
    FileText, Shield, Users, Video, MessageSquare,
    FolderSync, Code, DollarSign, CheckCircle2, AlertTriangle,
    Scale, Gavel, Globe, Lock,
    Wifi, Monitor, Ban, Copyright, BookOpen, FileWarning,
    HelpCircle, Mail, ExternalLink, Clock
} from "lucide-react";

// Static data
const tocItems = [
    { id: "summary", label: "Plain English Summary" },
    { id: "service-description", label: "Service Description" },
    { id: "user-responsibilities", label: "User Responsibilities" },
    { id: "acceptable-use", label: "Acceptable Use Policy" },
    { id: "prohibited-activities", label: "Prohibited Activities" },
    { id: "intellectual-property", label: "Intellectual Property" },
    { id: "technical-terms", label: "Technical Terms" },
    { id: "feature-terms", label: "Feature-Specific Terms" },
    { id: "api-terms", label: "API Terms" },
    { id: "donation-terms", label: "Donation Terms" },
    { id: "limitation-liability", label: "Limitation of Liability" },
    { id: "indemnification", label: "Indemnification" },
    { id: "governing-law", label: "Governing Law" },
    { id: "dispute-resolution", label: "Dispute Resolution" },
    { id: "modifications", label: "Modifications to Terms" },
    { id: "contact", label: "Contact Information" }
];

const summaryPoints = [
    "Tallow is free and open source. Use it however you like (legally).",
    "We don't own your files. They're yours. We never see them.",
    "Don't use Tallow for illegal stuff. That's on you.",
    "We're not responsible if your transfer fails or something breaks.",
    "We can block abusive users from our signaling server.",
    "You can always run your own instance - it's open source.",
    "We may update these terms. We'll update the date when we do.",
    "No warranty provided - use at your own risk."
];

const userResponsibilities = [
    "Ensure you have the legal right to share any files you transfer",
    "Maintain the security of your devices and connection codes",
    "Use the service in compliance with all applicable laws",
    "Respect the rights and privacy of other users",
    "Report any security vulnerabilities responsibly",
    "Not attempt to circumvent security measures",
    "Keep your browser and operating system updated",
    "Understand the risks of peer-to-peer file sharing"
];

const prohibitedActivities = [
    {
        category: "Illegal Content",
        items: [
            "Transferring content that violates any applicable law",
            "Sharing child sexual abuse material (CSAM)",
            "Distributing materials promoting terrorism or violence",
            "Trafficking in stolen data or credentials"
        ]
    },
    {
        category: "Harmful Activities",
        items: [
            "Distributing malware, viruses, or ransomware",
            "Conducting phishing attacks or social engineering",
            "Attempting to breach other users' security",
            "Using the service for DDoS attacks or spam"
        ]
    },
    {
        category: "Intellectual Property Violations",
        items: [
            "Sharing copyrighted content without authorization",
            "Distributing pirated software or media",
            "Infringing on trademarks or patents",
            "Removing copyright notices or watermarks"
        ]
    },
    {
        category: "Service Abuse",
        items: [
            "Attempting to overload the signaling infrastructure",
            "Exploiting bugs for malicious purposes",
            "Creating fake or misleading connection codes",
            "Automated scraping or abuse of APIs"
        ]
    }
];

const technicalTerms = [
    {
        title: "Encryption Disclaimer",
        content: "Tallow uses AES-256-GCM and ML-KEM-768 (post-quantum) encryption. While these are industry-standard and cutting-edge protocols, no encryption is 100% guaranteed against all future attacks. The post-quantum cryptography implementations are based on NIST-approved algorithms but are still relatively new. You are responsible for assessing whether the security level is appropriate for your use case."
    },
    {
        title: "Transfer Completion",
        content: "We do not guarantee successful transfer of any file. Transfers may fail due to network issues, browser limitations, peer disconnection, memory constraints, or other factors. For critical transfers, we recommend verifying file integrity after receipt and maintaining backups of important files."
    },
    {
        title: "Network Requirements",
        content: "Tallow requires WebRTC-capable browsers and network connectivity between peers. Firewalls, NAT configurations, corporate networks, VPNs, and certain ISPs may block or interfere with peer-to-peer connections. We provide TURN relay servers as fallback, but these have bandwidth limitations and may not be available in all regions."
    },
    {
        title: "Browser Compatibility",
        content: "Tallow is designed for modern browsers including Chrome 80+, Firefox 75+, Safari 14+, and Edge 80+. Older browsers may lack required WebRTC or cryptography APIs. Mobile browsers may have reduced functionality due to platform limitations. We do not support Internet Explorer."
    },
    {
        title: "File Size Limitations",
        content: "Maximum file size is limited by browser memory and available system resources, typically 2-4GB depending on device. Large files are chunked for transfer, but memory constraints may prevent completion. We recommend using dedicated file transfer tools for very large files."
    },
    {
        title: "Data Loss",
        content: "Files are transferred in memory and not stored on servers. If a transfer is interrupted, data may be lost. We are not responsible for any data loss, corruption, or failed transfers. Always maintain backups of important files."
    }
];

const featureTerms = [
    {
        icon: FolderSync,
        title: "File Transfer Service",
        description: "Peer-to-peer file sharing with end-to-end encryption",
        terms: [
            "You retain all rights to files you transfer",
            "Files never pass through or are stored on our servers",
            "You are responsible for ensuring you have rights to share files",
            "Maximum file size is limited by browser memory (typically 2-4GB)",
            "Transfer speeds depend on your network and peer's network"
        ]
    },
    {
        icon: Video,
        title: "Screen Sharing",
        description: "Real-time screen sharing with peers",
        terms: [
            "Screen sharing is peer-to-peer and end-to-end encrypted",
            "You control what portion of your screen to share",
            "Screen content is your responsibility - ensure no sensitive data is visible",
            "We do not record or store any screen sharing sessions",
            "Quality depends on your network bandwidth and CPU capabilities"
        ]
    },
    {
        icon: MessageSquare,
        title: "Chat Feature",
        description: "Encrypted text messaging during transfers",
        terms: [
            "Chat messages are end-to-end encrypted",
            "Messages are ephemeral and not stored after connection ends",
            "You are responsible for the content of your messages",
            "Chat history is only stored locally in your browser (if enabled)",
            "We cannot recover lost chat messages"
        ]
    },
    {
        icon: Users,
        title: "Transfer Rooms",
        description: "Multi-peer transfer coordination",
        terms: [
            "Room IDs are temporary and automatically deleted",
            "Room creator can manage participants",
            "All transfers within rooms are still peer-to-peer",
            "We do not store room history or participant lists",
            "Maximum 10 participants per room (default configuration)"
        ]
    },
    {
        icon: FileText,
        title: "Email Fallback",
        description: "Optional email-based transfer when P2P fails",
        terms: [
            "Email fallback is opt-in and requires recipient email address",
            "Files sent via email are encrypted with a password you choose",
            "Email service is provided by third-party (currently Resend)",
            "Email provider's terms and privacy policy apply",
            "We delete encrypted files from email storage after 7 days",
            "Email fallback should only be used when P2P fails"
        ]
    }
];

// Helper function to get the right icon for technical terms
function getTechnicalTermIcon(index: number) {
    const icons = [Lock, FileWarning, Wifi, Monitor, FileText, AlertTriangle];
    return icons[index] || AlertTriangle;
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <SiteNav />

            {/* Hero */}
            <section className="section-hero-dark pt-32 pb-16">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <p className="label mb-4 animate-fade-up text-hero-muted">Legal</p>
                        <h1 className="display-lg mb-6 animate-fade-up stagger-1">Terms of Service</h1>
                        <p className="body-xl animate-fade-up stagger-2 text-hero-muted">
                            Comprehensive terms governing your use of Tallow.
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-6 animate-fade-up stagger-3">
                            <Clock className="w-4 h-4 text-hero-muted" />
                            <p className="body-md text-hero-muted">
                                Last updated: January 28, 2026
                            </p>
                        </div>
                        <p className="body-sm text-hero-muted mt-2 animate-fade-up stagger-3">
                            Effective Date: January 28, 2026
                        </p>
                    </div>
                </div>
            </section>

            {/* Table of Contents */}
            <section className="section-content border-b" id="toc">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="display-sm mb-4">Table of Contents</h2>
                            <p className="body-lg text-muted-foreground">
                                Jump to any section of these terms.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                            {tocItems.map((item, i) => (
                                <a
                                    key={i}
                                    href={`#${item.id}`}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-hero-fg/5 transition-colors group"
                                >
                                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-hero-fg/10 text-sm font-medium group-hover:bg-hero-fg/20 transition-colors">
                                        {i + 1}
                                    </span>
                                    <span className="body-md group-hover:text-foreground transition-colors">
                                        {item.label}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Plain English Summary */}
            <section className="section-content border-b" id="summary">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="display-sm mb-6">TL;DR - Plain English</h2>
                            <p className="body-lg text-muted-foreground">
                                Here&apos;s what our terms mean in simple language. (The legal version is below.)
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {summaryPoints.map((point, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-4 p-5 rounded-lg bg-hero-fg/5 border border-border"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                    <p className="body-md">{point}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="heading-sm mb-2 text-orange-500">Important</h3>
                                    <p className="body-sm text-muted-foreground">
                                        This summary is for your convenience. The full legal terms below are what actually apply.
                                        If there&apos;s any conflict between the summary and the full terms, the full terms win.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Description */}
            <section className="section-dark" id="service-description">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Globe className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">1. Service Description</h2>
                                <p className="body-lg text-muted-foreground">
                                    What Tallow is and how it works.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="prose prose-invert max-w-none">
                                <p className="body-lg text-muted-foreground">
                                    Tallow (&quot;the Service&quot;) is a peer-to-peer file transfer application that enables users to share
                                    files directly between devices using WebRTC technology and end-to-end encryption.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="heading-md mb-4">Core Functionality</h3>
                                <div className="space-y-3">
                                    {[
                                        "Direct peer-to-peer file transfers without server storage",
                                        "End-to-end encryption using AES-256-GCM and ML-KEM-768 (post-quantum)",
                                        "Signaling server to facilitate initial peer connections",
                                        "TURN relay servers for NAT traversal when direct connections fail",
                                        "Optional features including screen sharing, chat, and transfer rooms"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="heading-md mb-4">Service Availability</h3>
                                <p className="body-md text-muted-foreground">
                                    The Service is provided free of charge on an &quot;as-is&quot; and &quot;as-available&quot; basis.
                                    We do not guarantee uninterrupted availability, and the Service may be modified,
                                    suspended, or discontinued at any time without notice. As an open-source project,
                                    you may host your own instance of the Service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* User Responsibilities */}
            <section className="section-content border-b" id="user-responsibilities">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Users className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">2. User Responsibilities</h2>
                                <p className="body-lg text-muted-foreground">
                                    Your obligations when using Tallow.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="body-lg text-muted-foreground">
                                By using the Service, you agree to the following responsibilities:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {userResponsibilities.map((responsibility, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-4 p-5 rounded-lg bg-hero-fg/5 border border-border"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <p className="body-md">{responsibility}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Acceptable Use Policy */}
            <section className="section-dark" id="acceptable-use">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <BookOpen className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">3. Acceptable Use Policy</h2>
                                <p className="body-lg text-muted-foreground">
                                    Guidelines for appropriate use of the Service.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="body-lg text-muted-foreground">
                                You agree to use Tallow only for lawful purposes and in accordance with these Terms.
                                The Service is designed for legitimate file sharing between consenting parties.
                            </p>

                            <div className="space-y-4">
                                <h3 className="heading-md mb-4">Permitted Uses</h3>
                                <div className="space-y-3">
                                    {[
                                        "Personal file sharing with friends, family, and colleagues",
                                        "Business file transfers with proper authorization",
                                        "Sharing creative works you own or have permission to distribute",
                                        "Educational and research purposes",
                                        "Testing and development of compatible applications"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">Content Responsibility</h3>
                                <p className="body-md text-muted-foreground">
                                    Since Tallow uses end-to-end encryption, we cannot monitor or control the content
                                    of transfers. You are solely responsible for ensuring that any content you share
                                    complies with applicable laws and does not infringe on the rights of others.
                                    The encrypted nature of transfers does not exempt you from legal responsibility.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Prohibited Activities */}
            <section className="section-content border-b" id="prohibited-activities">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/20 shrink-0">
                                <Ban className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">4. Prohibited Activities</h2>
                                <p className="body-lg text-muted-foreground">
                                    Actions that are strictly forbidden when using Tallow.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {prohibitedActivities.map((category, i) => (
                                <div key={i} className="p-6 rounded-lg bg-red-500/5 border border-red-500/20">
                                    <h3 className="heading-md mb-4 text-red-500">{category.category}</h3>
                                    <div className="space-y-3">
                                        {category.items.map((item, j) => (
                                            <div key={j} className="flex items-start gap-3">
                                                <Ban className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                                <p className="body-md text-muted-foreground">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="p-6 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="heading-sm mb-2 text-orange-500">Enforcement</h3>
                                        <p className="body-sm text-muted-foreground">
                                            Violation of these prohibitions may result in immediate termination of access
                                            to the signaling server, IP blocking, and reporting to appropriate authorities.
                                            We may cooperate with law enforcement investigations where legally required.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Intellectual Property */}
            <section className="section-dark" id="intellectual-property">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Copyright className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">5. Intellectual Property</h2>
                                <p className="body-lg text-muted-foreground">
                                    Rights and ownership relating to the Service and transferred content.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="heading-md mb-4">Your Content</h3>
                                <p className="body-md text-muted-foreground">
                                    You retain all ownership rights to files you transfer using Tallow. We claim no
                                    intellectual property rights over your content. By using the Service, you represent
                                    that you have the necessary rights, licenses, or permissions to share any content
                                    you transfer.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Tallow Software</h3>
                                <p className="body-md text-muted-foreground">
                                    Tallow is open-source software. The source code is available under its respective
                                    license (see our GitHub repository for details). You may use, modify, and
                                    redistribute the software in accordance with the open-source license terms.
                                    The &quot;Tallow&quot; name and branding remain the property of the project maintainers.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Third-Party Rights</h3>
                                <p className="body-md text-muted-foreground">
                                    You agree not to use the Service to infringe on the intellectual property rights
                                    of others. If you believe your intellectual property has been infringed through
                                    the use of Tallow, please note that we cannot access encrypted transfers.
                                    However, you may contact us with concerns, and we will cooperate with valid
                                    legal processes.
                                </p>
                            </div>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">DMCA Notice</h3>
                                <p className="body-md text-muted-foreground">
                                    Due to the peer-to-peer and end-to-end encrypted nature of Tallow, we do not
                                    host or have access to transferred content. Traditional DMCA takedown procedures
                                    are not applicable. If you have concerns about copyright infringement, please
                                    contact the parties directly involved in the transfer or work with appropriate
                                    legal authorities.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Terms */}
            <section className="section-content border-b" id="technical-terms">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Lock className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">6. Technical Terms and Disclaimers</h2>
                                <p className="body-lg text-muted-foreground">
                                    Important technical information and limitations.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {technicalTerms.map((term, i) => {
                                const IconComponent = getTechnicalTermIcon(i);
                                return (
                                    <ExpandableSection
                                        key={i}
                                        title={term.title}
                                        icon={<IconComponent className="w-5 h-5 text-foreground" />}
                                        defaultOpen={i === 0}
                                    >
                                        <p className="body-md text-muted-foreground">{term.content}</p>
                                    </ExpandableSection>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature-Specific Terms */}
            <section className="section-dark" id="feature-terms">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="display-sm mb-6">7. Feature-Specific Terms</h2>
                            <p className="body-lg text-muted-foreground">
                                Additional terms for specific Tallow features.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {featureTerms.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={i}
                                        className="card-feature animate-fade-up"
                                        style={{ animationDelay: `${i * 0.08}s` }}
                                    >
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                                <Icon className="w-6 h-6 text-foreground" />
                                            </div>
                                            <div>
                                                <h3 className="heading-md mb-2">{feature.title}</h3>
                                                <p className="body-md text-muted-foreground">{feature.description}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 ml-16">
                                            {feature.terms.map((term, j) => (
                                                <div key={j} className="flex items-start gap-3">
                                                    <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                                    <p className="body-md text-muted-foreground">{term}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* API Terms */}
            <section className="section-content border-b" id="api-terms">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Code className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">8. API Terms</h2>
                                <p className="body-lg text-muted-foreground">
                                    Terms for developers using Tallow&apos;s API endpoints.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="heading-md mb-4">API Access</h3>
                                <div className="space-y-3">
                                    {[
                                        "API access is currently free and unauthenticated for basic endpoints",
                                        "We reserve the right to implement rate limiting or API keys in the future",
                                        "Production API endpoints should be treated as read-only",
                                        "Self-host your own instance for full API control"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Rate Limiting</h3>
                                <div className="space-y-3">
                                    {[
                                        "We may implement rate limits to prevent abuse",
                                        "Current limits: 1000 requests per hour per IP (subject to change)",
                                        "Signaling connections are limited to 100 concurrent per IP",
                                        "Excessive usage may result in temporary IP blocking"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">API Liability</h3>
                                <div className="space-y-3">
                                    {[
                                        "API endpoints are provided as-is with no uptime guarantees",
                                        "We may modify or deprecate API endpoints with notice",
                                        "Breaking changes will be communicated via GitHub releases",
                                        "You are responsible for handling API errors gracefully"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Donation Terms */}
            <section className="section-dark" id="donation-terms">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <DollarSign className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">9. Donation Terms</h2>
                                <p className="body-lg text-muted-foreground">
                                    Terms for supporting Tallow through donations.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="heading-md mb-4">Voluntary Support</h3>
                                <div className="space-y-3">
                                    {[
                                        "All donations are voluntary and non-refundable",
                                        "Donations do not grant special access, features, or support",
                                        "Tallow will remain free and open source regardless of donations",
                                        "Donations support server costs and development time"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Payment Processing</h3>
                                <div className="space-y-3">
                                    {[
                                        "Donations are processed through Stripe",
                                        "We do not store your payment information",
                                        "Stripe's terms and privacy policy apply to all donations",
                                        "Payment disputes should be directed to Stripe support"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Recognition</h3>
                                <div className="space-y-3">
                                    {[
                                        "Donors may be listed in project credits (opt-in)",
                                        "We reserve the right to decline donations from any source",
                                        "Donation amounts and donor information are kept confidential",
                                        "No guaranteed benefits or perks for donations of any amount"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Limitation of Liability */}
            <section className="section-content border-b" id="limitation-liability">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Shield className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">10. Limitation of Liability</h2>
                                <p className="body-lg text-muted-foreground">
                                    Limits on our legal responsibility.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">No Warranty</h3>
                                <p className="body-md text-muted-foreground uppercase">
                                    THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTY OF ANY KIND,
                                    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                    FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. WE DO NOT WARRANT THAT THE
                                    SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                                </p>
                            </div>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">Limitation of Damages</h3>
                                <p className="body-md text-muted-foreground uppercase">
                                    TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL TALLOW,
                                    ITS CONTRIBUTORS, MAINTAINERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
                                    INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                                    LIMITED TO: LOSS OF DATA, FAILED TRANSFERS, SECURITY BREACHES, BUSINESS
                                    INTERRUPTION, LOST PROFITS, OR PERSONAL INJURY, ARISING OUT OF OR IN
                                    CONNECTION WITH YOUR USE OF THE SERVICE.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Specific Exclusions</h3>
                                <div className="space-y-3">
                                    {[
                                        "Data loss or corruption during transfers",
                                        "Failed or incomplete file transfers",
                                        "Security vulnerabilities or breaches",
                                        "Third-party interception of transfers",
                                        "Incompatibility with your devices or network",
                                        "Actions of other users",
                                        "Service outages or unavailability"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Indemnification */}
            <section className="section-dark" id="indemnification">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Scale className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">11. Indemnification</h2>
                                <p className="body-lg text-muted-foreground">
                                    Your agreement to protect us from claims.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="body-lg text-muted-foreground">
                                You agree to indemnify, defend, and hold harmless Tallow, its contributors,
                                maintainers, and affiliates from and against any and all claims, damages,
                                losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees)
                                arising out of or related to:
                            </p>

                            <div className="space-y-3">
                                {[
                                    "Your use or misuse of the Service",
                                    "Your violation of these Terms",
                                    "Your violation of any applicable laws or regulations",
                                    "Your infringement of any third-party rights, including intellectual property rights",
                                    "Any content you transfer using the Service",
                                    "Any harm caused to other users through your actions"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                        <p className="body-md text-muted-foreground">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <p className="body-md text-muted-foreground">
                                This indemnification obligation will survive the termination of these Terms
                                and your use of the Service.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Governing Law */}
            <section className="section-content border-b" id="governing-law">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Gavel className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">12. Governing Law</h2>
                                <p className="body-lg text-muted-foreground">
                                    Legal jurisdiction and applicable law.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="body-lg text-muted-foreground">
                                These Terms shall be governed by and construed in accordance with the laws
                                of the jurisdiction in which the Service is operated, without regard to
                                its conflict of law provisions.
                            </p>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">International Users</h3>
                                <p className="body-md text-muted-foreground">
                                    If you access the Service from outside the primary jurisdiction, you do so
                                    at your own risk and are responsible for compliance with local laws. Some
                                    features may not be available or legal in all jurisdictions. The use of
                                    encryption technology may be restricted in certain countries.
                                </p>
                            </div>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">Severability</h3>
                                <p className="body-md text-muted-foreground">
                                    If any provision of these Terms is found to be unenforceable or invalid,
                                    that provision will be limited or eliminated to the minimum extent necessary
                                    so that these Terms will otherwise remain in full force and effect.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dispute Resolution */}
            <section className="section-dark" id="dispute-resolution">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <HelpCircle className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">13. Dispute Resolution</h2>
                                <p className="body-lg text-muted-foreground">
                                    How disputes will be handled.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="heading-md mb-4">Informal Resolution</h3>
                                <p className="body-md text-muted-foreground">
                                    Before initiating any formal dispute resolution process, you agree to first
                                    contact us to attempt to resolve the dispute informally. Most concerns can
                                    be addressed through our GitHub issue tracker or direct communication.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Binding Arbitration</h3>
                                <p className="body-md text-muted-foreground">
                                    If informal resolution is unsuccessful, any dispute arising from these Terms
                                    shall be resolved through binding arbitration in accordance with applicable
                                    arbitration rules. The arbitration shall be conducted in English, and the
                                    arbitrator&apos;s decision shall be final and binding.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Class Action Waiver</h3>
                                <p className="body-md text-muted-foreground">
                                    You agree that any dispute resolution proceedings will be conducted only on
                                    an individual basis and not in a class, consolidated, or representative action.
                                    You waive any right to participate in class action lawsuits against Tallow.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Exceptions</h3>
                                <p className="body-md text-muted-foreground">
                                    Nothing in this section shall prevent either party from seeking injunctive
                                    or other equitable relief in court for matters relating to intellectual
                                    property rights or unauthorized access to the Service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modifications to Terms */}
            <section className="section-content border-b" id="modifications">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <FileText className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">14. Modifications to Terms</h2>
                                <p className="body-lg text-muted-foreground">
                                    How and when we may update these Terms.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="body-lg text-muted-foreground">
                                We reserve the right to modify these Terms at any time. When we make changes,
                                we will update the &quot;Last Updated&quot; date at the top of this page.
                            </p>

                            <div>
                                <h3 className="heading-md mb-4">Notification of Changes</h3>
                                <div className="space-y-3">
                                    {[
                                        "Material changes will be announced via our GitHub repository",
                                        "The updated date will always reflect the most recent changes",
                                        "Significant changes may be highlighted in release notes",
                                        "You should review these Terms periodically"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <span className="w-2 h-2 rounded-full bg-foreground mt-2.5 shrink-0" />
                                            <p className="body-md text-muted-foreground">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Continued Use</h3>
                                <p className="body-md text-muted-foreground">
                                    Your continued use of the Service after any changes to these Terms constitutes
                                    your acceptance of the new Terms. If you do not agree to the modified Terms,
                                    you should discontinue your use of the Service.
                                </p>
                            </div>

                            <div>
                                <h3 className="heading-md mb-4">Termination</h3>
                                <p className="body-md text-muted-foreground">
                                    We may terminate or suspend your access to the signaling server at any time,
                                    without prior notice, for conduct that we believe violates these Terms or is
                                    harmful to other users or the Service. Since Tallow is open source, you may
                                    always run your own instance of the Service.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information */}
            <section className="section-dark" id="contact">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 mb-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-hero-fg/10 shrink-0">
                                <Mail className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <h2 className="display-sm mb-2">15. Contact Information</h2>
                                <p className="body-lg text-muted-foreground">
                                    How to reach us with questions or concerns.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <p className="body-lg text-muted-foreground">
                                If you have any questions about these Terms of Service, please contact us:
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                    <h3 className="heading-md mb-4">GitHub Issues</h3>
                                    <p className="body-md text-muted-foreground mb-4">
                                        For technical questions, feature requests, and bug reports.
                                    </p>
                                    <a
                                        href="https://github.com/tallow/tallow"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
                                    >
                                        Open an Issue
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                    <h3 className="heading-md mb-4">Legal Inquiries</h3>
                                    <p className="body-md text-muted-foreground mb-4">
                                        For legal notices, DMCA-related matters, or formal correspondence.
                                    </p>
                                    <p className="body-md text-muted-foreground">
                                        Contact via GitHub repository.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 rounded-lg bg-hero-fg/5 border border-border">
                                <h3 className="heading-md mb-4">Response Time</h3>
                                <p className="body-md text-muted-foreground">
                                    As an open-source project maintained by volunteers, response times may vary.
                                    We aim to respond to all inquiries within a reasonable timeframe, but cannot
                                    guarantee specific response times. Critical security issues should be reported
                                    through our responsible disclosure process.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final Acknowledgment */}
            <section className="section-content">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center border border-border rounded-lg p-10 bg-hero-fg/5">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-6 text-green-500" />
                            <h2 className="display-sm mb-6">Acknowledgment</h2>
                            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
                                By using Tallow, you acknowledge that you have read, understood, and agree to
                                be bound by these Terms of Service. If you do not agree to these Terms,
                                please do not use the Service.
                            </p>
                            <div className="mt-8 pt-8 border-t border-border">
                                <p className="body-md text-muted-foreground">
                                    These Terms of Service were last updated on January 28, 2026.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Links */}
            <section className="section-dark">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="heading-lg mb-4">Related Policies</h2>
                            <p className="body-md text-muted-foreground">
                                Review our other policies for complete information.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <Link
                                href="/privacy"
                                className="p-6 rounded-lg bg-hero-fg/5 border border-border hover:bg-hero-fg/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="w-5 h-5 text-foreground" />
                                    <h3 className="heading-md group-hover:opacity-80 transition-opacity">Privacy Policy</h3>
                                </div>
                                <p className="body-sm text-muted-foreground">
                                    Learn about how we protect your privacy and what data we do not collect.
                                </p>
                            </Link>

                            <Link
                                href="/security"
                                className="p-6 rounded-lg bg-hero-fg/5 border border-border hover:bg-hero-fg/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Lock className="w-5 h-5 text-foreground" />
                                    <h3 className="heading-md group-hover:opacity-80 transition-opacity">Security</h3>
                                </div>
                                <p className="body-sm text-muted-foreground">
                                    Technical details about our encryption and security measures.
                                </p>
                            </Link>
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
