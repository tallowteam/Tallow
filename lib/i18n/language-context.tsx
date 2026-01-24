'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Import English translations synchronously as default to prevent flash
import enTranslations from '@/lib/i18n/translations/en.json';

export type LanguageCode =
    | 'en' | 'es' | 'zh' | 'hi' | 'ar' | 'pt' | 'bn' | 'ru' | 'ja' | 'de'
    | 'fr' | 'ko' | 'tr' | 'it' | 'vi' | 'pl' | 'nl' | 'th' | 'id' | 'uk' | 'ur';

export interface Language {
    code: LanguageCode;
    name: string;
    nativeName: string;
    rtl?: boolean;
}

export const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
];

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string;
    currentLanguage: Language;
    isRTL: boolean;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Pre-load all translations to avoid flash
const translationCache: Record<LanguageCode, Record<string, string>> = {
    en: enTranslations as Record<string, string>,
} as Record<LanguageCode, Record<string, string>>;

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('en');
    const [translations, setTranslations] = useState<Record<string, string>>(enTranslations as Record<string, string>);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const currentLanguage = languages.find(l => l.code === language) || languages[0];
    const isRTL = currentLanguage.rtl || false;

    // Initialize from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('tallow-language') as LanguageCode;
        if (saved && languages.some(l => l.code === saved)) {
            // If saved language is not English, load it
            if (saved !== 'en') {
                setIsLoading(true);
                loadTranslations(saved).then((trans) => {
                    setTranslations(trans);
                    setLanguageState(saved);
                    setIsLoading(false);
                    setIsInitialized(true);
                });
            } else {
                setIsInitialized(true);
            }
        } else {
            setIsInitialized(true);
        }
    }, []);

    // Load translations for a language
    const loadTranslations = async (lang: LanguageCode): Promise<Record<string, string>> => {
        // Check cache first
        if (translationCache[lang]) {
            return translationCache[lang];
        }

        try {
            const mod = await import(`@/lib/i18n/translations/${lang}.json`);
            translationCache[lang] = mod.default;
            return mod.default;
        } catch {
            // Fallback to English
            return enTranslations as Record<string, string>;
        }
    };

    // Handle language change
    const setLanguage = async (lang: LanguageCode) => {
        if (lang === language) return;

        setIsLoading(true);
        const trans = await loadTranslations(lang);
        setTranslations(trans);
        setLanguageState(lang);
        localStorage.setItem('tallow-language', lang);
        document.documentElement.lang = lang;
        setIsLoading(false);
    };

    // Update document language
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: string): string => {
        return translations[key] || enTranslations[key as keyof typeof enTranslations] || key;
    };

    // Don't render children until initialized to prevent flash
    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, currentLanguage, isRTL, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
