'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Shield,
    ShieldCheck,
    Zap,
    Users,
    Monitor,
    Lock,
    Wifi,
    WifiOff,
    FileKey,
    Eye,
    EyeOff,
    Globe,
    RefreshCw,
    Folder,
    MessageSquare,
    Languages,
    Search,
    ChevronRight,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';

// Feature category type
type Category = 'all' | 'security' | 'speed' | 'privacy' | 'collaboration';

// Feature interface
interface Feature {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    category: Exclude<Category, 'all'>;
    highlight?: boolean;
    badge?: string;
    link?: string;
}

// All features data
const features: Feature[] = [
    {
        id: 'pqc',
        icon: ShieldCheck,
        title: 'Post-Quantum Encryption',
        description: 'ML-KEM-1024 encryption protects your files against future quantum computer attacks. NIST-approved cryptographic standards.',
        category: 'security',
        highlight: true,
        badge: 'NIST Approved',
    },
    {
        id: 'e2e',
        icon: Shield,
        title: 'End-to-End Encryption',
        description: 'AES-256-GCM encryption ensures your files are encrypted before leaving your device. Only the recipient can decrypt.',
        category: 'security',
    },
    {
        id: 'p2p',
        icon: Zap,
        title: 'Peer-to-Peer Transfers',
        description: 'Direct WebRTC connections mean your files never touch our servers. Maximum speed, maximum privacy.',
        category: 'speed',
        highlight: true,
    },
    {
        id: 'group',
        icon: Users,
        title: 'Group Transfers',
        description: 'Share files with multiple people simultaneously. Perfect for team collaboration and family sharing.',
        category: 'collaboration',
    },
    {
        id: 'screen',
        icon: Monitor,
        title: 'Screen Sharing',
        description: 'Share your screen with military-grade encryption. Perfect for remote presentations and support.',
        category: 'collaboration',
        link: '/advanced/screen-sharing',
    },
    {
        id: 'offline',
        icon: WifiOff,
        title: 'Offline Support',
        description: 'Transfer files on local networks without internet. Works on WiFi, Ethernet, and even ad-hoc networks.',
        category: 'speed',
    },
    {
        id: 'resumable',
        icon: RefreshCw,
        title: 'Resumable Transfers',
        description: 'Lost connection? No problem. Transfers automatically resume where they left off.',
        category: 'speed',
        link: '/advanced/resumable-transfer',
    },
    {
        id: 'password',
        icon: Lock,
        title: 'Password Protection',
        description: 'Add an extra layer of security with password-protected transfers. Only those with the password can access.',
        category: 'security',
    },
    {
        id: 'metadata',
        icon: EyeOff,
        title: 'Metadata Stripping',
        description: 'Automatically remove sensitive metadata from images and documents before sharing.',
        category: 'privacy',
        highlight: true,
    },
    {
        id: 'onion',
        icon: Eye,
        title: 'Onion Routing',
        description: 'Route transfers through multiple nodes for enhanced anonymity. Your IP address stays hidden.',
        category: 'privacy',
        link: '/advanced/onion-routing',
    },
    {
        id: 'folders',
        icon: Folder,
        title: 'Folder Transfers',
        description: 'Send entire folders with their structure preserved. Includes compression for faster transfers.',
        category: 'speed',
    },
    {
        id: 'chat',
        icon: MessageSquare,
        title: 'Encrypted Chat',
        description: 'End-to-end encrypted messaging alongside your file transfers. Coordinate securely.',
        category: 'collaboration',
    },
    {
        id: 'nat',
        icon: Globe,
        title: 'NAT Traversal',
        description: 'Advanced NAT traversal ensures connections work even behind strict firewalls and routers.',
        category: 'speed',
    },
    {
        id: 'local',
        icon: Wifi,
        title: 'Local Discovery',
        description: 'Automatically discover devices on your local network. No codes needed for nearby transfers.',
        category: 'speed',
    },
    {
        id: 'i18n',
        icon: Languages,
        title: '22 Languages',
        description: 'Available in 22 languages including RTL support. Use Tallow in your native language.',
        category: 'collaboration',
    },
    {
        id: 'keys',
        icon: FileKey,
        title: 'Key Management',
        description: 'Secure key exchange with signed prekeys and identity verification. Trust, but verify.',
        category: 'security',
    },
];

// Category metadata
const categories: { id: Category; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All Features', icon: Sparkles },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'speed', label: 'Speed', icon: Zap },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Feature Card Component - EUVEKA responsive with 44px touch targets
function FeatureCard({ feature }: { feature: Feature }) {
    const Icon = feature.icon;

    const cardClassName = cn(
        "group relative h-full flex flex-col",
        // EUVEKA responsive padding and card radius
        "p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl",
        "bg-card border border-border",
        "hover:border-primary/50 hover:shadow-lg",
        "dark:hover:shadow-primary/5",
        "transition-all duration-300",
        feature.link && "cursor-pointer",
        feature.highlight && "ring-1 ring-primary/20"
    );

    const cardContent = (
        <>
            {/* Badge - responsive positioning */}
            {feature.badge && (
                <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {feature.badge}
                </span>
            )}

            {/* Icon - responsive sizing */}
            <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4",
                "bg-primary/10 group-hover:bg-primary/20 transition-colors"
            )}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>

            {/* Content - responsive text */}
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
                {feature.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                {feature.description}
            </p>

            {/* Link indicator - EUVEKA Touch Target with min height */}
            {feature.link && (
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity min-h-[44px] sm:min-h-0">
                    Learn more <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
            )}
        </>
    );

    return (
        <motion.div
            variants={itemVariants}
            layout
            className="h-full"
        >
            {feature.link ? (
                <Link href={feature.link} className={cardClassName}>
                    {cardContent}
                </Link>
            ) : (
                <div className={cardClassName}>
                    {cardContent}
                </div>
            )}
        </motion.div>
    );
}

// Main Features Content Component
export function FeaturesContent() {
    const [selectedCategory, setSelectedCategory] = useState<Category>('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Translation function available for future i18n
    useLanguage();

    // Filter features
    const filteredFeatures = useMemo(() => {
        return features.filter(feature => {
            const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
            const matchesSearch = searchQuery === '' ||
                feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feature.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const handleCategoryChange = useCallback((category: Category) => {
        setSelectedCategory(category);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section - EUVEKA responsive */}
            <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />

                {/* EUVEKA Container: max-width 1320px/1376px with responsive padding 20-40px */}
                <div className="relative max-w-[1320px] lg:max-w-[1376px] xl:max-w-7xl mx-auto px-5 sm:px-6 md:px-8 lg:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-2xl lg:max-w-3xl mx-auto text-center"
                    >
                        <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 mb-4 sm:mb-6 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary">
                            16+ Security Features
                        </span>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
                            Built for Privacy.
                            <br />
                            <span className="text-primary">Designed for Speed.</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto px-2 sm:px-0">
                            Every feature is crafted with security-first principles. No compromises,
                            no shortcuts, just the most advanced file transfer technology available.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Filters Section - Sticky with EUVEKA responsive */}
            <section className="sticky top-16 md:top-[72px] lg:top-20 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-[1320px] lg:max-w-[1376px] xl:max-w-7xl mx-auto px-5 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                        {/* Category filters - scrollable on mobile */}
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide -mx-1 px-1">
                            {categories.map(category => {
                                const Icon = category.icon;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryChange(category.id)}
                                        className={cn(
                                            // EUVEKA Touch Target: 44px minimum
                                            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px]",
                                            selectedCategory === category.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        {category.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search - responsive width */}
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search features..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={cn(
                                    // EUVEKA Touch Target: 44px minimum height
                                    "w-full sm:w-56 md:w-64 pl-10 pr-4 py-2.5 sm:py-2 rounded-full min-h-[44px]",
                                    "bg-muted border border-transparent",
                                    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                                    "text-sm placeholder:text-muted-foreground"
                                )}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid - EUVEKA responsive container and gaps */}
            <section className="py-10 sm:py-12 md:py-16 lg:py-20">
                <div className="max-w-[1320px] lg:max-w-[1376px] xl:max-w-7xl 3xl:max-w-[1800px] 4xl:max-w-[2200px] mx-auto px-5 sm:px-6 md:px-8 lg:px-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCategory + searchQuery}
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6"
                        >
                            {filteredFeatures.map((feature) => (
                                <FeatureCard
                                    key={feature.id}
                                    feature={feature}
                                />
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Empty state */}
                    {filteredFeatures.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No features found</h3>
                            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* CTA Section - EUVEKA responsive */}
            <section className="py-16 sm:py-20 md:py-28 lg:py-32 bg-gradient-to-t from-primary/5 to-transparent">
                <div className="max-w-[1320px] lg:max-w-[1376px] xl:max-w-7xl mx-auto px-5 sm:px-6 md:px-8 lg:px-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xl sm:max-w-2xl mx-auto text-center"
                    >
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                            Ready to transfer files securely?
                        </h2>
                        <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2 sm:px-0">
                            Join thousands of users who trust Tallow for their most sensitive files.
                            No sign-up required.
                        </p>
                        <Link
                            href="/app"
                            className={cn(
                                // EUVEKA Touch Target: buttons 56-64px
                                "inline-flex items-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full min-h-[56px] sm:min-h-[60px]",
                                "bg-primary text-primary-foreground font-semibold",
                                "hover:opacity-90 transition-opacity"
                            )}
                        >
                            Start Transferring Now
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
