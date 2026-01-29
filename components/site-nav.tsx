"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageDropdown } from "@/components/language-dropdown";
import { KeyboardShortcutsTrigger } from "@/components/accessibility/keyboard-shortcuts-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

export function SiteNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isMenuOpen]);

    const navLinks = [
        { href: "/features", labelKey: "nav.features" },
        { href: "/how-it-works", labelKey: "nav.howItWorks" },
        { href: "/help", labelKey: "nav.help" },
    ];

    return (
        <>
            {/* Minimal Fixed Navigation - Responsive */}
            <nav className={`nav-minimal ${scrolled ? "scrolled" : ""}`}>
                <div className="nav-minimal-inner container mx-auto flex items-center justify-between px-4 sm:px-6">
                    {/* Logo */}
                    <Link href="/" className="nav-logo hover:opacity-60 transition-opacity shrink-0">
                        tallow
                    </Link>

                    {/* Desktop Links - Hidden on mobile/tablet */}
                    <div className="hidden lg:flex items-center gap-6 xl:gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link whitespace-nowrap ${pathname === link.href ? "opacity-100" : "opacity-70"}`}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Keyboard shortcuts - desktop only */}
                        <KeyboardShortcutsTrigger />

                        {/* Language dropdown - always visible but compact on mobile */}
                        <LanguageDropdown />

                        {/* Theme toggle */}
                        <ThemeToggle />

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="lg:hidden p-2 hover:opacity-60 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>

                        {/* Get Started button - hidden on very small screens */}
                        <Link href="/app" className="hidden xs:block">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-current hover:bg-background/10 hover:text-inherit text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                            >
                                {t("nav.getStarted")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Full Screen Mobile Menu */}
            <div
                className={`mobile-menu lg:hidden ${isMenuOpen ? "open" : "closed"}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                {/* Background */}
                <div className="mobile-menu-backdrop bg-foreground" />

                {/* Content */}
                <div className="mobile-menu-content safe-area-all">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            href="/"
                            className="nav-logo !text-background hover:opacity-70 transition-opacity"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            tallow
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-3 -mr-3 hover:opacity-60 transition-opacity text-background rounded-full hover:bg-background/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label="Close menu"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Links */}
                    <nav className="flex-1 flex flex-col justify-center gap-6">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={`mobile-menu-link ${pathname === "/" ? "opacity-100" : "opacity-60"}`}
                        >
                            Home
                        </Link>
                        {navLinks.map((link, index) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`mobile-menu-link ${pathname === link.href ? "opacity-100" : "opacity-60"}`}
                                style={{ animationDelay: `${(index + 2) * 0.05}s` }}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </nav>

                    {/* Footer CTA */}
                    <div className="pt-8 safe-area-bottom">
                        <Link href="/app" onClick={() => setIsMenuOpen(false)} className="block">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full border-background text-background hover:bg-background hover:text-foreground transition-all duration-300"
                            >
                                {t("nav.getStarted")}
                                <ArrowUpRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>

                        <p className="text-center text-background/50 text-xs mt-6 uppercase tracking-widest">
                            Secure File Transfer
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
