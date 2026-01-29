'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Globe,
  Users,
  Folder,
  MessageSquare,
  ArrowRight,
  Zap,
  Wifi,
  ShieldCheck,
  Monitor,
  Lock,
  Eye,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { DonationSection } from "@/components/donate/donation-section";
import { useLanguage } from "@/lib/i18n/language-context";
import { FeatureCarousel } from "@/components/features/feature-carousel";
import { topFeatures } from "@/lib/features/sample-features";

export default function Home() {
  const { t } = useLanguage();

  const features = [
    { icon: Zap, titleKey: "home.features.fast.title", descKey: "home.features.fast.desc" },
    { icon: ShieldCheck, titleKey: "home.features.pqc.title", descKey: "home.features.pqc.desc" },
    { icon: Shield, titleKey: "home.features.encrypted.title", descKey: "home.features.encrypted.desc" },
    { icon: Eye, titleKey: "home.features.privacy.title", descKey: "home.features.privacy.desc" },
    { icon: Users, titleKey: "home.features.group.title", descKey: "home.features.group.desc" },
    { icon: Monitor, titleKey: "home.features.screen.title", descKey: "home.features.screen.desc" },
    { icon: MessageSquare, titleKey: "home.features.chat.title", descKey: "home.features.chat.desc" },
    { icon: Globe, titleKey: "home.features.anywhere.title", descKey: "home.features.anywhere.desc" },
    { icon: Lock, titleKey: "home.features.tor.title", descKey: "home.features.tor.desc" },
    { icon: Users, titleKey: "home.features.friends.title", descKey: "home.features.friends.desc" },
    { icon: Folder, titleKey: "home.features.folders.title", descKey: "home.features.folders.desc" },
    { icon: MessageSquare, titleKey: "home.features.text.title", descKey: "home.features.text.desc" },
  ];

  const stats = [
    { number: "0", labelKey: "home.stats.storage", suffix: "KB" },
    { number: "", labelKey: "home.stats.encryption", suffix: "" },
    { number: "∞", labelKey: "home.stats.limit", suffix: "" },
  ];

  const securityTags = [
    "home.security.tags.pqc",
    "home.security.tags.aes",
    "home.security.tags.nist",
    "home.security.tags.e2e",
    "home.security.tags.nocloud",
    "home.security.tags.opensource",
  ];

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* Hero Section - Dark */}
      <main id="main-content" tabIndex={-1}>
      <section className="section-hero-dark grid-pattern">
        <div className="container mx-auto px-6 py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* PQC Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6 animate-fade-up">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">{t("home.hero.badge")}</span>
            </div>

            {/* Eyebrow */}
            <p className="label mb-8 animate-fade-up stagger-1 text-hero-muted">
              {t("home.hero.eyebrow")}
            </p>

            {/* Main Headline - Serif */}
            <h1 className="display-xl mb-8 animate-fade-up stagger-2">
              {t("home.hero.title1")}
              <br />
              <span className="italic">{t("home.hero.title2")}</span> {t("home.hero.title3")}
            </h1>

            {/* Subheadline */}
            <p className="body-xl max-w-2xl mx-auto mb-12 animate-fade-up stagger-2 text-hero-muted">
              {t("home.hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
              <Link href="/app">
                <Button variant="outline" size="lg" className="border-hero-fg text-hero-fg hover:bg-hero-fg hover:text-hero-bg">
                  {t("home.hero.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="text-hero-fg hover:bg-hero-fg/10">
                  {t("home.hero.secondary")}
                </Button>
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="mt-20 animate-fade-up stagger-4">
              <p className="label text-hero-muted/60">{t("home.hero.scroll")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Light */}
      <section className="section-content border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto text-center">
            {stats.map((stat, i) => (
              <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="stat-number">{stat.number}</span>
                  {stat.suffix && <span className="text-2xl font-medium">{stat.suffix}</span>}
                </div>
                <p className="label">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Carousel */}
      <FeatureCarousel
        features={topFeatures.slice(0, 21)}
        autoPlay={true}
        interval={6000}
        showControls={true}
      />

      {/* Why Section */}
      <section className="section-content">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <p className="label mb-4 animate-fade-up">{t("home.why.eyebrow")}</p>
            <h2 className="display-md mb-8 animate-fade-up stagger-1">
              {t("home.why.title")}
            </h2>
            <p className="body-lg animate-fade-up stagger-2">
              {t("home.why.text")}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-content-lg border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="label mb-4 animate-fade-up">{t("home.features.eyebrow")}</p>
            <h2 className="display-md animate-fade-up stagger-1">
              {t("home.features.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card-feature animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary mb-6">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="heading-sm mb-3">{t(feature.titleKey)}</h3>
                <p className="body-md">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Callout - Dark */}
      <section className="section-dark">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-hero-fg/10 mx-auto mb-8 animate-fade-up">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="display-md mb-6 animate-fade-up stagger-1">
              {t("home.security.title")}
            </h2>
            <p className="body-xl max-w-2xl mx-auto mb-10 animate-fade-up stagger-2 text-hero-muted">
              {t("home.security.text")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up stagger-3">
              {securityTags.map((tagKey) => (
                <span
                  key={tagKey}
                  className="px-5 py-2.5 rounded-full bg-hero-fg/10 text-sm font-medium uppercase tracking-wider"
                >
                  {t(tagKey)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Connection Types */}
      <section className="section-content border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="label mb-4 animate-fade-up">{t("home.connection.eyebrow")}</p>
              <h2 className="display-md animate-fade-up stagger-1">
                {t("home.connection.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-feature text-center animate-fade-up">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-secondary mx-auto mb-6">
                  <Wifi className="w-7 h-7" />
                </div>
                <h3 className="heading-sm mb-3">{t("home.connection.local.title")}</h3>
                <p className="body-md">
                  {t("home.connection.local.desc")}
                </p>
              </div>
              <div className="card-dark text-center animate-fade-up stagger-1">
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-hero-fg/10 mx-auto mb-6">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="heading-sm mb-3">{t("home.connection.internet.title")}</h3>
                <p className="body-md text-hero-muted">
                  {t("home.connection.internet.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section - only visible when Stripe is configured */}
      <DonationSection />

      {/* Final CTA */}
      <section className="section-content-lg border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="display-lg mb-8 animate-fade-up">
              {t("home.cta.title")}
            </h2>
            <Link href="/app">
              <Button size="lg" className="animate-fade-up stagger-1">
                {t("home.hero.cta")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-6">
            {/* Logo - Row 1 on mobile */}
            <Link href="/" className="text-xl tracking-tight lowercase font-serif text-foreground">
              tallow
            </Link>

            {/* Links - Row 2 on mobile, wrapped flex layout */}
            <nav aria-label="Footer navigation" className="w-full md:w-auto">
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
                <li>
                  <Link
                    href="/features"
                    className="inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/screen-share-demo"
                    className="inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                  >
                    Screen Share
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="inline-flex items-center justify-center min-h-[44px] px-2 text-xs font-medium uppercase tracking-widest text-foreground hover:opacity-70 transition-opacity"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Tagline - Row 3 on mobile */}
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {t("footer.tagline")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
