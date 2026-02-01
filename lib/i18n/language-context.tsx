'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
// Import English translations synchronously as default to prevent flash
import enTranslations from '@/lib/i18n/translations/en.json';

export type LanguageCode =
    | 'en' | 'es' | 'zh' | 'hi' | 'ar' | 'pt' | 'bn' | 'ru' | 'ja' | 'de'
    | 'fr' | 'ko' | 'tr' | 'it' | 'vi' | 'pl' | 'nl' | 'th' | 'id' | 'uk' | 'ur' | 'he';

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
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
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

/**
 * Detect browser language with fallback chain
 * Example: zh-TW -> zh -> en
 */
function detectBrowserLanguage(): LanguageCode | null {
    // Get browser languages in order of preference
    const browserLangs = navigator.languages || [navigator.language];

    for (const browserLang of browserLangs) {
        // Exact match (e.g., en-US -> en)
        const code = browserLang.toLowerCase().split('-')[0] as LanguageCode;
        if (languages.some(l => l.code === code)) {
            return code;
        }

        // Regional variants
        const regionMap: Record<string, LanguageCode> = {
            'zh-cn': 'zh',
            'zh-tw': 'zh',
            'zh-hk': 'zh',
            'pt-br': 'pt',
            'pt-pt': 'pt',
            'es-mx': 'es',
            'es-es': 'es',
            'ar-sa': 'ar',
            'ar-eg': 'ar',
        };

        const variant = browserLang.toLowerCase() as keyof typeof regionMap;
        if (regionMap[variant]) {
            return regionMap[variant];
        }
    }

    return null; // Default to English
}

/**
 * Get Accept-Language header value for API requests
 */
export function getAcceptLanguageHeader(language: LanguageCode): string {
    const localeMap: Record<LanguageCode, string> = {
        en: 'en-US,en;q=0.9',
        es: 'es-ES,es;q=0.9',
        zh: 'zh-CN,zh;q=0.9',
        hi: 'hi-IN,hi;q=0.9',
        ar: 'ar-SA,ar;q=0.9',
        he: 'he-IL,he;q=0.9',
        pt: 'pt-BR,pt;q=0.9',
        bn: 'bn-BD,bn;q=0.9',
        ru: 'ru-RU,ru;q=0.9',
        ja: 'ja-JP,ja;q=0.9',
        de: 'de-DE,de;q=0.9',
        fr: 'fr-FR,fr;q=0.9',
        ko: 'ko-KR,ko;q=0.9',
        tr: 'tr-TR,tr;q=0.9',
        it: 'it-IT,it;q=0.9',
        vi: 'vi-VN,vi;q=0.9',
        pl: 'pl-PL,pl;q=0.9',
        nl: 'nl-NL,nl;q=0.9',
        th: 'th-TH,th;q=0.9',
        id: 'id-ID,id;q=0.9',
        uk: 'uk-UA,uk;q=0.9',
        ur: 'ur-PK,ur;q=0.9',
    };
    return localeMap[language] || 'en-US,en;q=0.9';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('en');
    const [translations, setTranslations] = useState<Record<string, string>>(enTranslations as Record<string, string>);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const defaultLanguage: Language = { code: 'en', name: 'English', nativeName: 'English' };
    const currentLanguage = languages.find(l => l.code === language) || languages[0] || defaultLanguage;
    const isRTL = currentLanguage.rtl || false;

    // Initialize from localStorage or browser language on mount
    useEffect(() => {
        const saved = localStorage.getItem('tallow-language') as LanguageCode;

        // Try saved language first
        if (saved && languages.some(l => l.code === saved)) {
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
            // Auto-detect browser language
            const detectedLang = detectBrowserLanguage();
            if (detectedLang && detectedLang !== 'en') {
                setIsLoading(true);
                loadTranslations(detectedLang).then((trans) => {
                    setTranslations(trans);
                    setLanguageState(detectedLang);
                    localStorage.setItem('tallow-language', detectedLang);
                    setIsLoading(false);
                    setIsInitialized(true);
                });
            } else {
                setIsInitialized(true);
            }
        }
    }, []);

    // Load translations for a language - memoized with useCallback
    const loadTranslations = useCallback(async (lang: LanguageCode): Promise<Record<string, string>> => {
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
    }, []);

    // Handle language change - memoized with useCallback
    const setLanguage = useCallback(async (lang: LanguageCode) => {
        if (lang === language) {return;}

        setIsLoading(true);
        const trans = await loadTranslations(lang);
        setTranslations(trans);
        setLanguageState(lang);
        localStorage.setItem('tallow-language', lang);
        document.documentElement.lang = lang;
        setIsLoading(false);
    }, [language, loadTranslations]);

    // Update document language and direction
    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    }, [language, isRTL]);

    // Memoize translation function (React 18 optimization)
    const t = useCallback((key: string): string => {
        return translations[key] || enTranslations[key as keyof typeof enTranslations] || key;
    }, [translations]);

    // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
    const contextValue = useMemo(() => ({
        language,
        setLanguage,
        t,
        currentLanguage,
        isRTL,
        isLoading,
    }), [language, setLanguage, t, currentLanguage, isRTL, isLoading]);

    // Don't render children until initialized to prevent flash
    if (!isInitialized) {
        return null;
    }

    return (
        <LanguageContext.Provider value={contextValue}>
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
