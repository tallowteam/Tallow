/**
 * Feature Data
 * Core feature definitions for Tallow
 */

import {
    Zap,
    ShieldCheck,
    Shield,
    Eye,
    Users,
    Monitor,
    MessageSquare,
    Globe,
    Lock,
    Folder,
    LucideIcon,
} from 'lucide-react';

export interface FeatureData {
    id: string;
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
    category?: string;
    status: 'production' | 'beta' | 'planned';
}

/**
 * Top Features for Landing Page Carousel
 * These are the most impactful features to showcase
 */
export const topFeatures: FeatureData[] = [
    {
        id: 'fast',
        icon: Zap,
        titleKey: 'home.features.fast.title',
        descKey: 'home.features.fast.desc',
        category: 'Performance',
        status: 'production',
    },
    {
        id: 'pqc',
        icon: ShieldCheck,
        titleKey: 'home.features.pqc.title',
        descKey: 'home.features.pqc.desc',
        category: 'Security',
        status: 'production',
    },
    {
        id: 'encrypted',
        icon: Shield,
        titleKey: 'home.features.encrypted.title',
        descKey: 'home.features.encrypted.desc',
        category: 'Security',
        status: 'production',
    },
    {
        id: 'privacy',
        icon: Eye,
        titleKey: 'home.features.privacy.title',
        descKey: 'home.features.privacy.desc',
        category: 'Privacy',
        status: 'production',
    },
    {
        id: 'group',
        icon: Users,
        titleKey: 'home.features.group.title',
        descKey: 'home.features.group.desc',
        category: 'Collaboration',
        status: 'production',
    },
    {
        id: 'screen',
        icon: Monitor,
        titleKey: 'home.features.screen.title',
        descKey: 'home.features.screen.desc',
        category: 'Communication',
        status: 'production',
    },
    {
        id: 'chat',
        icon: MessageSquare,
        titleKey: 'home.features.chat.title',
        descKey: 'home.features.chat.desc',
        category: 'Communication',
        status: 'production',
    },
    {
        id: 'anywhere',
        icon: Globe,
        titleKey: 'home.features.anywhere.title',
        descKey: 'home.features.anywhere.desc',
        category: 'Network',
        status: 'production',
    },
    {
        id: 'tor',
        icon: Lock,
        titleKey: 'home.features.tor.title',
        descKey: 'home.features.tor.desc',
        category: 'Privacy',
        status: 'production',
    },
    {
        id: 'friends',
        icon: Users,
        titleKey: 'home.features.friends.title',
        descKey: 'home.features.friends.desc',
        category: 'Social',
        status: 'production',
    },
    {
        id: 'folders',
        icon: Folder,
        titleKey: 'home.features.folders.title',
        descKey: 'home.features.folders.desc',
        category: 'Transfer',
        status: 'production',
    },
    {
        id: 'text',
        icon: MessageSquare,
        titleKey: 'home.features.text.title',
        descKey: 'home.features.text.desc',
        category: 'Transfer',
        status: 'production',
    },
];

/**
 * Convert feature data to FeatureCard format
 */
export function toFeatureCardData(features: FeatureData[]) {
    return features.map(f => ({
        id: f.id,
        title: f.titleKey,
        description: f.descKey,
        icon: f.icon.name,
        category: f.category || 'General',
        status: f.status,
        tags: [],
        location: '',
    }));
}
