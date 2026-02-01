'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, languages } from '@/lib/i18n/language-context';

export function LanguageDropdown() {
    const { language, setLanguage, currentLanguage: _currentLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);

    // Find current language index for initial focus
    const currentIndex = languages.findIndex((lang) => lang.code === language);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset focused index when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [isOpen, currentIndex]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!isOpen) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % languages.length);
                break;
            case 'ArrowUp':
                event.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + languages.length) % languages.length);
                break;
            case 'Home':
                event.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                event.preventDefault();
                setFocusedIndex(languages.length - 1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < languages.length) {
                    const lang = languages[focusedIndex];
                    if (lang) {
                        setLanguage(lang.code);
                        setIsOpen(false);
                        buttonRef.current?.focus();
                    }
                }
                break;
            case 'Escape':
                event.preventDefault();
                setIsOpen(false);
                buttonRef.current?.focus();
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    }, [isOpen, focusedIndex, setLanguage]);

    // Scroll focused option into view
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && listRef.current) {
            const focusedElement = listRef.current.querySelector('[data-index="' + focusedIndex + '"]');
            if (focusedElement) {
                focusedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [isOpen, focusedIndex]);

    const selectedLanguage = languages.find((lang) => lang.code === language);
    const dropdownId = 'language-dropdown-listbox';
    const selectedLangName = selectedLanguage ? selectedLanguage.name : language;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-foreground/10 transition-colors text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label={'Select language. Current language: ' + selectedLangName}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={isOpen ? dropdownId : undefined}
                type="button"
            >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span className="text-xs font-medium uppercase">{language}</span>
                <ChevronDown 
                    className={'w-3 h-3 transition-transform ' + (isOpen ? 'rotate-180' : '')} 
                    aria-hidden="true" 
                />
            </button>

            {isOpen && (
                <div
                    ref={listRef}
                    id={dropdownId}
                    role="listbox"
                    aria-label="Available languages"
                    aria-activedescendant={focusedIndex >= 0 ? 'language-option-' + focusedIndex : undefined}
                    tabIndex={-1}
                    onKeyDown={handleKeyDown}
                    className="absolute right-0 top-full mt-2 w-56 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50"
                >
                    <div className="p-1">
                        {languages.map((lang, index) => {
                            const isSelected = language === lang.code;
                            const isFocused = focusedIndex === index;
                            
                            return (
                                <div
                                    key={lang.code}
                                    id={'language-option-' + index}
                                    role="option"
                                    aria-selected={isSelected}
                                    data-index={index}
                                    tabIndex={isFocused ? 0 : -1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setLanguage(lang.code);
                                            setIsOpen(false);
                                            buttonRef.current?.focus();
                                        }
                                    }}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setIsOpen(false);
                                        buttonRef.current?.focus();
                                    }}
                                    className={'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ' + (
                                        isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : isFocused
                                            ? 'bg-secondary'
                                            : 'hover:bg-secondary'
                                    )}
                                >
                                    <span className="font-medium">{lang.nativeName}</span>
                                    <span className="text-xs opacity-70">{lang.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
