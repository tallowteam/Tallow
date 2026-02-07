/**
 * Language Switcher Component
 * Dropdown for selecting application language
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { SUPPORTED_LOCALES, LocaleInfo } from '@/lib/i18n/types';
import styles from './LanguageSwitcher.module.css';

interface LanguageSwitcherProps {
  /** Compact mode shows only flag + code */
  compact?: boolean;
  /** Show search input for filtering languages */
  searchable?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Chevron Down Icon
 */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Check Icon
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function LanguageSwitcher({
  compact = false,
  searchable = true,
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLocale = SUPPORTED_LOCALES.find(l => l.code === locale);

  // Filter locales based on search query
  const filteredLocales = searchQuery
    ? SUPPORTED_LOCALES.filter(
        l =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SUPPORTED_LOCALES;

  // Handle locale selection
  const handleSelectLocale = (localeInfo: LocaleInfo) => {
    setLocale(localeInfo.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${compact ? styles.compact : ''} ${className || ''}`}
    >
      {/* Trigger Button */}
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        data-open={isOpen}
        aria-label={t('common.language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.flag} aria-hidden="true">
          {currentLocale?.flag}
        </span>
        {compact ? (
          <span className={styles.code}>{locale}</span>
        ) : (
          <span className={styles.label}>{currentLocale?.nativeName}</span>
        )}
        <ChevronIcon {...(styles.chevron ? { className: styles.chevron } : {})} />
      </button>

      {/* Dropdown Menu */}
      <div
        className={styles.dropdown}
        data-open={isOpen}
        role="listbox"
        aria-label={t('common.language')}
      >
        <div className={styles.dropdownInner}>
          {/* Search Input */}
          {searchable && (
            <div className={styles.searchContainer}>
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search languages"
              />
            </div>
          )}

          {/* Language Options */}
          {filteredLocales.length > 0 ? (
            filteredLocales.map(localeInfo => (
              <button
                key={localeInfo.code}
                className={styles.option}
                onClick={() => handleSelectLocale(localeInfo)}
                data-active={localeInfo.code === locale}
                role="option"
                aria-selected={localeInfo.code === locale}
              >
                <span className={styles.flag} aria-hidden="true">
                  {localeInfo.flag}
                </span>
                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{localeInfo.name}</span>
                  <span className={styles.optionNative}>{localeInfo.nativeName}</span>
                </div>
                <CheckIcon {...(styles.checkmark ? { className: styles.checkmark } : {})} />
              </button>
            ))
          ) : (
            <div className={styles.empty}>No languages found</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Language Switcher (for header)
 */
export function CompactLanguageSwitcher(props: Omit<LanguageSwitcherProps, 'compact'>) {
  return <LanguageSwitcher {...props} compact />;
}

/**
 * Full Language Switcher (for settings page)
 */
export function FullLanguageSwitcher(props: Omit<LanguageSwitcherProps, 'compact'>) {
  return <LanguageSwitcher {...props} compact={false} />;
}
