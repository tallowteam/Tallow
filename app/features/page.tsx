"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Shield,
    Zap,
    Users,
    FolderOpen,
    Monitor,
    WifiOff,
    Mic,
    Languages,
    ArrowRight,
    Lock,
    Sparkles,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";

// Feature data for bento grid - grayscale design
const features = [
    {
        id: "pqc",
        icon: Shield,
        title: "Post-Quantum Encryption",
        description: "ML-KEM-768 encryption protects your files against current and future quantum computer attacks. NIST-standardized, military-grade security.",
        size: "2x2", // Featured large card
        tag: "Security",
    },
    {
        id: "p2p",
        icon: Zap,
        title: "P2P Transfer",
        description: "Direct peer-to-peer at maximum network speed. No servers, no throttling.",
        size: "1x1",
        tag: "Speed",
    },
    {
        id: "screen",
        icon: Monitor,
        title: "Screen Sharing",
        description: "Share your screen up to 4K with audio. End-to-end encrypted.",
        size: "1x1",
        tag: "Collaboration",
    },
    {
        id: "group",
        icon: Users,
        title: "Group Transfer",
        description: "Send files to multiple recipients simultaneously with individual encryption keys for each connection.",
        size: "2x1",
        tag: "Productivity",
    },
    {
        id: "folder",
        icon: FolderOpen,
        title: "Folder Support",
        description: "Send entire directories with structure intact. Auto-compression included.",
        size: "1x1",
        tag: "Files",
    },
    {
        id: "offline",
        icon: WifiOff,
        title: "Offline Mode",
        description: "Works without internet on local networks. Full PWA support.",
        size: "1x1",
        tag: "Resilience",
    },
    {
        id: "voice",
        icon: Mic,
        title: "Voice Commands",
        description: "Hands-free control. Say 'Send files' or 'Accept transfer' for accessibility and convenience.",
        size: "1x2",
        tag: "Accessibility",
    },
    {
        id: "languages",
        icon: Languages,
        title: "22 Languages",
        description: "Full internationalization with RTL support. Switch languages instantly.",
        size: "1x1",
        tag: "Global",
    },
];

// Bento card component with intersection observer for scroll animations
function BentoCard({
    feature,
    index,
}: {
    feature: typeof features[0];
    index: number;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const Icon = feature.icon;

    useEffect(() => {
        const card = cardRef.current;
        if (!card) {return;}

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        card.classList.add("animate-in");
                        observer.unobserve(card);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        observer.observe(card);
        return () => observer.disconnect();
    }, []);

    // Determine grid span based on size
    const sizeClasses: Record<string, string> = {
        "1x1": "col-span-1 row-span-1",
        "2x1": "col-span-1 md:col-span-2 row-span-1",
        "1x2": "col-span-1 row-span-1 md:row-span-2",
        "2x2": "col-span-1 md:col-span-2 row-span-1 md:row-span-2",
    };

    return (
        <div
            ref={cardRef}
            className={`
                ${sizeClasses[feature.size]}
                group relative overflow-hidden
                bg-[#111110] border border-[#262626] rounded-2xl
                opacity-0 translate-y-8
                transition-all duration-700 ease-out
                hover:border-white/20 hover:-translate-y-1
                hover:shadow-2xl hover:shadow-black/50
                [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0
            `}
            style={{
                transitionDelay: `${index * 100}ms`,
            }}
        >
            {/* Gradient background on hover - grayscale only */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />

            {/* Content */}
            <div className={`relative z-10 h-full flex flex-col ${feature.size === "2x2" ? "p-8 md:p-10" : "p-6"}`}>
                {/* Tag */}
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#888880] mb-4">
                    {feature.tag}
                </span>

                {/* Icon with glow effect - white/gray only */}
                <div className="relative mb-4">
                    <div
                        className={`
                            w-12 h-12 ${feature.size === "2x2" ? "md:w-16 md:h-16" : ""}
                            rounded-xl bg-white/5 border border-white/10
                            flex items-center justify-center
                            transition-all duration-500
                            group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/20
                        `}
                    >
                        <Icon
                            className={`
                                ${feature.size === "2x2" ? "w-6 h-6 md:w-8 md:h-8" : "w-5 h-5"}
                                text-[#fefefc]
                                transition-all duration-500
                                group-hover:scale-110
                            `}
                        />
                    </div>
                    {/* Glow effect on hover - white only */}
                    <div
                        className="absolute inset-0 rounded-xl bg-white/10 blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"
                    />
                </div>

                {/* Title */}
                <h3
                    className={`
                        font-semibold text-[#fefefc] mb-2
                        ${feature.size === "2x2" ? "text-xl md:text-2xl" : "text-base"}
                        transition-colors duration-300
                    `}
                >
                    {feature.title}
                </h3>

                {/* Description */}
                <p
                    className={`
                        text-[#888880] leading-relaxed flex-1
                        ${feature.size === "2x2" ? "text-base md:text-lg" : "text-sm"}
                        transition-colors duration-300
                        group-hover:text-[#a8a29e]
                    `}
                >
                    {feature.description}
                </p>

                {/* Decorative element for large cards */}
                {feature.size === "2x2" && (
                    <div className="mt-6 flex items-center gap-2 text-sm text-[#888880] group-hover:text-[#a8a29e] transition-colors">
                        <Lock className="w-4 h-4" />
                        <span>NIST Standardized</span>
                        <span className="mx-2">|</span>
                        <span>ML-KEM-768</span>
                        <span className="mx-2">|</span>
                        <span>AES-256-GCM</span>
                    </div>
                )}
            </div>

            {/* Corner decoration - white glow only */}
            <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-white/5 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700"
            />
        </div>
    );
}

export default function FeaturesPage() {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) {return;}

        // Animate hero on mount
        requestAnimationFrame(() => {
            hero.classList.add("animate-in");
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a08]">
            <SiteNav />

            {/* Hero Section */}
            <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
                {/* Background effects - grayscale only */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.02] rounded-full blur-[150px]" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(#262626 1px, transparent 1px), linear-gradient(90deg, #262626 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                <div
                    ref={heroRef}
                    className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10 opacity-0 translate-y-8 transition-all duration-1000 ease-out [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0"
                >
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                            <Sparkles className="w-4 h-4 text-[#fefefc]" />
                            <span className="text-sm text-[#888880]">28 Features. Zero Compromise.</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#fefefc] tracking-[-0.02em] leading-[1.1] mb-6">
                            Built for{" "}
                            <span className="relative">
                                <span className="text-[#fefefc]/80 italic">
                                    security
                                </span>
                                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-white/40 via-white/60 to-white/40 rounded-full" />
                            </span>
                            <br />
                            designed for{" "}
                            <span className="text-[#888880]">speed</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-[#888880] max-w-2xl mx-auto mb-10 leading-relaxed">
                            Every feature engineered with privacy-first principles. Post-quantum encryption meets intuitive design.
                        </p>

                        {/* Stats row */}
                        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                            {[
                                { value: "28", label: "Features" },
                                { value: "22", label: "Languages" },
                                { value: "0", label: "Cloud Storage" },
                                { value: "100%", label: "Open Source" },
                            ].map((stat, i) => (
                                <div
                                    key={stat.label}
                                    className="opacity-0 animate-fade-in"
                                    style={{ animationDelay: `${600 + i * 100}ms`, animationFillMode: "forwards" }}
                                >
                                    <div className="text-2xl md:text-3xl font-bold text-[#fefefc]">{stat.value}</div>
                                    <div className="text-xs text-[#888880] uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Section */}
            <section className="py-16 md:py-24">
                <div className="max-w-[1200px] mx-auto px-6 md:px-12">
                    {/* Section header */}
                    <div className="mb-12 md:mb-16">
                        <span className="text-[#fefefc] text-sm font-medium uppercase tracking-wider mb-4 block">
                            Core Capabilities
                        </span>
                        <h2 className="text-2xl md:text-4xl font-bold text-[#fefefc] tracking-tight">
                            Everything you need, nothing you don&apos;t
                        </h2>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)] md:auto-rows-[minmax(200px,auto)]">
                        {features.map((feature, index) => (
                            <BentoCard key={feature.id} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Highlights Strip */}
            <section className="py-12 border-y border-[#262626] overflow-hidden">
                <div className="flex animate-scroll-x">
                    {[...Array(2)].map((_, groupIndex) => (
                        <div key={groupIndex} className="flex shrink-0">
                            {[
                                "ML-KEM-768",
                                "AES-256-GCM",
                                "Triple Ratchet",
                                "Zero Knowledge",
                                "Forward Secrecy",
                                "E2E Encrypted",
                                "Open Source",
                                "No Cloud",
                            ].map((tag, i) => (
                                <div key={`${groupIndex}-${i}`} className="flex items-center px-8">
                                    <span className="w-2 h-2 rounded-full bg-[#fefefc] mr-4" />
                                    <span className="text-[#888880] text-sm whitespace-nowrap">{tag}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            {/* Additional Features Grid */}
            <section className="py-24 md:py-32">
                <div className="max-w-[1200px] mx-auto px-6 md:px-12">
                    <div className="mb-12 md:mb-16">
                        <span className="text-[#fefefc] text-sm font-medium uppercase tracking-wider mb-4 block">
                            And More
                        </span>
                        <h2 className="text-2xl md:text-4xl font-bold text-[#fefefc] tracking-tight">
                            Security features under the hood
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { title: "Password Protection", desc: "Argon2 hashing" },
                            { title: "Metadata Stripping", desc: "Remove EXIF data" },
                            { title: "Resumable Transfers", desc: "Never lose progress" },
                            { title: "Traffic Obfuscation", desc: "Resist analysis" },
                            { title: "VPN/Tor Support", desc: "Auto-detection" },
                            { title: "Onion Routing", desc: "Multi-hop relay" },
                            { title: "Encrypted Chat", desc: "Real-time messaging" },
                            { title: "Clipboard Sync", desc: "Cross-device" },
                        ].map((item, i) => (
                            <div
                                key={item.title}
                                className="group p-5 bg-[#111110] border border-[#262626] rounded-xl hover:border-white/20 hover:bg-[#161614] transition-all duration-300"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <h4 className="text-[#fefefc] text-sm font-medium mb-1 group-hover:text-white transition-colors">
                                    {item.title}
                                </h4>
                                <p className="text-[#888880] text-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 md:py-32 border-t border-[#262626]">
                <div className="max-w-[1200px] mx-auto px-6 md:px-12">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#111110] via-[#161614] to-[#111110] border border-[#262626] p-8 md:p-16">
                        {/* Background glow - white only */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />

                        <div className="relative z-10 max-w-2xl mx-auto text-center">
                            <h2 className="text-3xl md:text-5xl font-bold text-[#fefefc] tracking-tight mb-6">
                                Ready to experience
                                <br />
                                <span className="text-[#888880] italic">
                                    secure file sharing?
                                </span>
                            </h2>
                            <p className="text-[#888880] text-lg mb-10">
                                Free and open source. No account required. Start transferring in seconds.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/app">
                                    <Button
                                        size="lg"
                                        className="bg-[#fefefc] hover:bg-white text-[#0a0a08] font-semibold px-8 h-12 rounded-[60px] transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/10"
                                    >
                                        Get Started
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link href="/how-it-works">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="border-[#262626] bg-transparent text-[#fefefc] hover:bg-white/5 hover:border-white/20 px-8 h-12 rounded-[60px] transition-all"
                                    >
                                        See How It Works
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#262626] py-12 bg-[#0a0a08]">
                <div className="max-w-[1200px] mx-auto px-6 md:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <Link href="/" className="text-[#fefefc] text-xl font-medium tracking-tight hover:text-white/80 transition-colors">
                            tallow
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link href="/privacy" className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors">Privacy</Link>
                            <Link href="/security" className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors">Security</Link>
                            <Link href="/terms" className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors">Terms</Link>
                        </div>
                        <p className="text-[#888880] text-sm">
                            Open source. Privacy first.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Custom animation styles */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
                @keyframes scroll-x {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-scroll-x {
                    animation: scroll-x 30s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-fade-in,
                    .animate-scroll-x {
                        animation: none;
                        opacity: 1;
                        transform: none;
                    }
                }
            `}</style>
        </div>
    );
}
