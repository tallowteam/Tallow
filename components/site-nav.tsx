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
            {/* Minimal Fixed Navigation - Euveka Style */}
            <nav className={`nav-minimal ${scrolled ? "scrolled" : ""}`}>
                <div className="nav-minimal-inner container mx-auto">
                    {/* Logo - Lowercase serif */}
                    <Link href="/" className="nav-logo hover:opacity-60 transition-opacity">
                        tallow
                    </Link>

                    {/* Desktop Links - Uppercase tracking */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link ${pathname === link.href ? "opacity-100" : "opacity-70"}`}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </div>

                    {/* CTA & Mobile Menu */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <KeyboardShortcutsTrigger />
                        <LanguageDropdown />
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="md:hidden p-1.5 sm:p-2 hover:opacity-60 transition-opacity"
                            aria-label="Menu"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <Link href="/app">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-current hover:bg-background/10 hover:text-inherit text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-9"
                            >
                                {t("nav.getStarted")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Full Screen Mobile Menu */}
            <div
                className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            >
                {/* Background - Uses inverted theme colors */}
                <div className="absolute inset-0 bg-foreground" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col p-8 text-background">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <Link href="/" className="nav-logo !text-background" onClick={() => setIsMenuOpen(false)}>
                            tallow
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-2 hover:opacity-60 transition-opacity text-background"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex-1 flex flex-col justify-center gap-8">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={`display-md transition-all duration-300 hover:translate-x-4 ${pathname === "/" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                        >
                            Home
                        </Link>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`display-md transition-all duration-300 hover:translate-x-4 ${pathname === link.href ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                            >
                                {t(link.labelKey)}
                            </Link>
                        ))}
                    </div>

                    {/* Footer CTA */}
                    <div className="pt-8">
                        <Link href="/app" onClick={() => setIsMenuOpen(false)} className="block">
                            <Button variant="outline" size="lg" className="w-full border-background text-background hover:bg-background hover:text-foreground">
                                {t("nav.getStarted")}
                                <ArrowUpRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
