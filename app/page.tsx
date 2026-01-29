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
  RotateCw,
  Mail,
  Languages,
  Mic,
  Smartphone,
  Clipboard,
  Play,
  CheckCircle2,
  Sparkles,
  Code2,
  FileCode2,
  TestTube2,
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

  // New advanced features section
  const advancedFeatures = [
    {
      icon: RotateCw,
      title: "Resumable Transfers",
      desc: "Never lose progress. Interrupted transfers resume automatically from where they left off."
    },
    {
      icon: Mail,
      title: "Email Fallback",
      desc: "When P2P isn't available, send encrypted files via email with password protection."
    },
    {
      icon: Languages,
      title: "22 Languages",
      desc: "Full internationalization with RTL support. Share files in your preferred language."
    },
    {
      icon: Mic,
      title: "Voice Commands",
      desc: "Hands-free control with voice commands. Say 'Send file' or 'Accept transfer'."
    },
    {
      icon: Smartphone,
      title: "Mobile Gestures",
      desc: "Swipe, pinch, and tap. Native-feeling touch interactions on any device."
    },
    {
      icon: Clipboard,
      title: "Clipboard Sync",
      desc: "Copy on one device, paste on another. Seamless clipboard sharing across devices."
    },
  ];

  const stats = [
    { number: "141", labelKey: "home.stats.components", suffix: "+" },
    { number: "22", labelKey: "home.stats.languages", suffix: "" },
    { number: "400", labelKey: "home.stats.tests", suffix: "+" },
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

      {/* Hero Section - Dark with Animated Gradient Background */}
      <main id="main-content" tabIndex={-1}>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-24 md:py-28 lg:py-32 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* PQC Badge with glow */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6 animate-fade-up shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">{t("home.hero.badge")}</span>
            </div>

            {/* Eyebrow */}
            <p className="text-sm uppercase tracking-widest text-slate-400 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {t("home.hero.eyebrow")}
            </p>

            {/* Main Headline - Serif with gradient - responsive scaling */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light mb-6 md:mb-8 animate-fade-up leading-tight" style={{ animationDelay: '0.2s' }}>
              {t("home.hero.title1")}
              <br />
              <span className="italic bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">{t("home.hero.title2")}</span> {t("home.hero.title3")}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 md:mb-12 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              {t("home.hero.subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <Link href="/app">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105">
                  {t("home.hero.cta")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/transfer-demo">
                <Button variant="outline" size="lg" className="border-slate-600 text-white hover:bg-white/10 hover:border-slate-500 transition-all">
                  <Play className="w-4 h-4 mr-2" />
                  Try Demo
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="ghost" size="lg" className="text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                  {t("home.hero.secondary")}
                </Button>
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="mt-20 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-widest text-slate-500">{t("home.hero.scroll")}</p>
                <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Light with subtle gradient */}
      <section className="relative py-16 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto text-center">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="animate-fade-up group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  {i === 0 && <Code2 className="w-6 h-6 text-emerald-500" />}
                  {i === 1 && <Languages className="w-6 h-6 text-blue-500" />}
                  {i === 2 && <TestTube2 className="w-6 h-6 text-violet-500" />}
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl md:text-6xl font-light tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{stat.number}</span>
                  {stat.suffix && <span className="text-2xl font-medium text-slate-500">{stat.suffix}</span>}
                </div>
                <p className="text-sm uppercase tracking-widest text-slate-500">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Carousel */}
      <FeatureCarousel
        features={topFeatures.slice(0, 21)}
        autoPlay
        interval={6000}
        showControls
      />

      {/* Why Section with gradient accent */}
      <section className="relative py-24 bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 animate-fade-up">{t("home.why.eyebrow")}</p>
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-8 animate-fade-up text-slate-900 dark:text-white" style={{ animationDelay: '0.1s' }}>
              {t("home.why.title")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 animate-fade-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              {t("home.why.text")}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid with hover animations */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 animate-fade-up">{t("home.features.eyebrow")}</p>
            <h2 className="text-4xl md:text-5xl font-serif font-light text-slate-900 dark:text-white animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {t("home.features.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mb-6 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-all">
                  <feature.icon className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">{t(feature.titleKey)}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features - NEW SECTION */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-400">Advanced Capabilities</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-4">
              Beyond Basic File Transfer
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Tallow goes beyond simple file sharing with powerful features that make it the most capable secure transfer platform available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {advancedFeatures.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 animate-fade-up backdrop-blur-sm"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-cyan-500/20 mb-6 group-hover:from-violet-500/30 group-hover:to-cyan-500/30 transition-all">
                  <feature.icon className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Callout - Dark with enhanced styling */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 mx-auto mb-8 animate-fade-up">
              <Shield className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {t("home.security.title")}
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {t("home.security.text")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              {securityTags.map((tagKey) => (
                <span
                  key={tagKey}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-sm font-medium uppercase tracking-wider text-emerald-400 hover:border-emerald-500/40 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t(tagKey)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Connection Types with enhanced cards */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4 animate-fade-up">{t("home.connection.eyebrow")}</p>
              <h2 className="text-4xl md:text-5xl font-serif font-light text-slate-900 dark:text-white animate-fade-up" style={{ animationDelay: '0.1s' }}>
                {t("home.connection.title")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group p-8 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 text-center animate-fade-up">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mx-auto mb-6 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all">
                  <Wifi className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">{t("home.connection.local.title")}</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {t("home.connection.local.desc")}
                </p>
              </div>
              <div className="group p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 mx-auto mb-6 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-all">
                  <Globe className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{t("home.connection.internet.title")}</h3>
                <p className="text-slate-400">
                  {t("home.connection.internet.desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Section - only visible when Stripe is configured */}
      <DonationSection />

      {/* Final CTA with enhanced styling */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-fade-up">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Free & Open Source</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-light mb-8 text-slate-900 dark:text-white animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {t("home.cta.title")}
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <Link href="/app">
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105">
                  {t("home.hero.cta")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all">
                  <FileCode2 className="w-4 h-4 mr-2" />
                  View All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer - Premium Design */}
      <footer className="footer">
        <div className="footer-container">
          {/* Main footer content */}
          <div className="footer-grid">
            {/* Logo */}
            <div className="text-center md:text-left">
              <Link href="/" className="footer-logo inline-block">
                tallow
              </Link>
            </div>

            {/* Navigation Links */}
            <nav aria-label="Footer navigation" className="footer-nav">
              <Link href="/features" className="footer-link">
                Features
              </Link>
              <Link href="/screen-share-demo" className="footer-link">
                Screen Share
              </Link>
              <Link href="/docs" className="footer-link">
                Docs
              </Link>
              <Link href="/privacy" className="footer-link">
                Privacy
              </Link>
              <Link href="/security" className="footer-link">
                Security
              </Link>
              <Link href="/terms" className="footer-link">
                Terms
              </Link>
            </nav>

            {/* Tagline */}
            <p className="footer-tagline">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Bottom section - Copyright */}
          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <p className="text-center md:text-left">
                {new Date().getFullYear()} Tallow. Open source and free forever.
              </p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  All systems operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
