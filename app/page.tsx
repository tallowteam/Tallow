'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Globe,
  Users,
  Zap,
  Lock,
  WifiOff,
  Monitor,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin,
  Send,
  Check,
  Cloud,
  Key,
  BadgeCheck,
  Smartphone,
} from 'lucide-react';

// ============================================================================
// TALLOW LOGO - Circle with Triangle (Play icon rotated 90deg = pointing UP)
// ============================================================================
function TallowLogo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-[#fefefc] dark:bg-[#fefefc] ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Triangle pointing UP (play icon rotated 90 degrees) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{ width: size * 0.5, height: size * 0.5 }}
        className="-rotate-90"
      >
        <path
          d="M8 5.14v14.72a1 1 0 001.5.86l11-7.36a1 1 0 000-1.72l-11-7.36a1 1 0 00-1.5.86z"
          fill="#0a0a08"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// ANIMATED COUNTER with spring physics
// ============================================================================
function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ============================================================================
// FLOATING DECORATIVE ELEMENT - Circles and Lines
// ============================================================================
function FloatingElement({
  className,
  delay = 0,
  duration = 8,
  type = 'circle',
}: {
  className?: string;
  delay?: number;
  duration?: number;
  type?: 'circle' | 'line' | 'ring';
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.15, 0.3, 0.15],
        y: [0, -20, 0],
        x: [0, 10, 0],
        rotate: type === 'line' ? [0, 5, 0] : 0,
      }}
      transition={{
        opacity: { duration: duration * 1.5, repeat: Infinity, ease: 'easeInOut', delay },
        y: { duration, repeat: Infinity, ease: 'easeInOut', delay },
        x: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: duration * 0.8, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      className={className}
    />
  );
}

// ============================================================================
// MOUSE PARALLAX CONTAINER
// ============================================================================
function ParallaxContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.02);
    mouseY.set((e.clientY - centerY) * 0.02);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// BENTO CARD - Glassmorphism with white accents
// ============================================================================
function BentoCard({
  icon: Icon,
  title,
  description,
  className = '',
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-[24px] bg-[#161614]/80 backdrop-blur-xl border border-[#262626] p-8 md:p-10 3xl:p-12 4xl:p-14 transition-all duration-500 hover:-translate-y-3 hover:border-white/20 hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.1)] ${className}`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon container */}
      <div className="relative mb-6">
        <div className="w-14 h-14 3xl:w-16 3xl:h-16 4xl:w-20 4xl:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-500">
          <Icon className="w-7 h-7 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 text-[#fefefc] group-hover:scale-110 transition-transform duration-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="relative text-xl md:text-2xl 3xl:text-3xl 4xl:text-4xl font-serif font-light text-[#fefefc] mb-4 3xl:mb-6 tracking-tight">
        {title}
      </h3>
      <p className="relative text-[#888880] text-base 3xl:text-lg 4xl:text-xl leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

// ============================================================================
// HOW IT WORKS STEP
// ============================================================================
function HowItWorksStep({
  number,
  icon: Icon,
  title,
  description,
  delay = 0,
  isLast = false,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay?: number;
  isLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col items-center text-center group"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-16 left-[calc(50%+4rem)] w-[calc(100%-8rem)] h-[1px]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1, delay: delay + 0.3 }}
            className="h-full bg-gradient-to-r from-white/30 via-[#262626] to-transparent origin-left"
          />
        </div>
      )}

      {/* Step number badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 0.6, delay: delay + 0.2, type: 'spring', stiffness: 200 }}
        className="absolute -top-2 -right-2 md:top-0 md:right-4 w-10 h-10 rounded-full bg-[#fefefc] text-[#0a0a08] text-sm font-bold flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] z-10"
      >
        {number}
      </motion.div>

      {/* Icon container */}
      <div className="w-32 h-32 rounded-3xl bg-[#161614] border border-[#262626] flex items-center justify-center mb-8 group-hover:border-white/20 group-hover:shadow-[0_0_50px_rgba(255,255,255,0.08)] transition-all duration-500">
        <Icon className="w-14 h-14 text-[#fefefc] group-hover:scale-110 transition-transform duration-500" />
      </div>

      <h3 className="font-serif text-2xl font-light text-[#fefefc] mb-3 tracking-tight">{title}</h3>
      <p className="text-[#888880] text-base leading-relaxed max-w-xs">{description}</p>
    </motion.div>
  );
}

// ============================================================================
// SECURITY BADGE - Pill-shaped
// ============================================================================
function SecurityBadge({
  label,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#161614]/80 backdrop-blur-sm border border-[#262626] text-sm font-medium text-[#888880] hover:text-[#fefefc] hover:border-white/20 hover:bg-white/5 transition-all duration-300 cursor-default"
    >
      {Icon && <Icon className="w-4 h-4 text-[#fefefc]" />}
      {label}
    </motion.div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================
function StatCard({
  number,
  suffix = '',
  prefix = '',
  label,
  delay = 0,
}: {
  number: number;
  suffix?: string;
  prefix?: string;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative p-8 md:p-10 rounded-[24px] bg-[#161614]/60 backdrop-blur-xl border border-[#262626] hover:border-white/20 hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500 text-center group"
    >
      <div className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-[#fefefc] mb-4 tracking-tighter group-hover:text-white transition-colors duration-500">
        {prefix ? (
          <span>{prefix}</span>
        ) : (
          <AnimatedCounter target={number} suffix={suffix} duration={2.5} />
        )}
      </div>
      <div className="text-sm text-[#888880] uppercase tracking-[0.15em] font-medium">
        {label}
      </div>
    </motion.div>
  );
}

// ============================================================================
// PRIMARY BUTTON - Black & White
// ============================================================================
function PrimaryButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'default',
  className = '',
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'outline';
  size?: 'default' | 'large';
  className?: string;
}) {
  const baseClasses = `inline-flex items-center justify-center gap-2.5 font-semibold transition-all duration-300 rounded-[60px] ${
    size === 'large' ? 'h-16 px-12 text-lg' : 'h-14 px-10 text-base'
  }`;

  const variantClasses = {
    primary: 'bg-[#fefefc] text-[#0a0a08] hover:bg-white hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:-translate-y-1',
    outline: 'bg-transparent border-2 border-[#fefefc] text-[#fefefc] hover:bg-white/10 hover:-translate-y-1',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, 50]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Features data for bento grid
  const features = [
    {
      icon: ShieldCheck,
      title: 'Post-Quantum Encryption',
      desc: 'ML-KEM-1024 encryption protects your files against future quantum computer attacks.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      desc: 'Direct peer-to-peer transfers with zero server bottlenecks.',
    },
    {
      icon: Lock,
      title: 'End-to-End Encrypted',
      desc: 'Your files are encrypted before leaving your device.',
    },
    {
      icon: Users,
      title: 'Group Transfers',
      desc: 'Share files with multiple people simultaneously.',
    },
    {
      icon: Monitor,
      title: 'Screen Sharing',
      desc: 'Share your screen with military-grade encryption.',
    },
    {
      icon: WifiOff,
      title: 'Works Offline',
      desc: 'Transfer files on local networks without internet.',
    },
  ];

  // Stats data
  const stats: Array<{ number: number; suffix: string; prefix: string; label: string }> = [
    { number: 0, prefix: 'Zero', suffix: '', label: 'Data Collection' },
    { number: 256, suffix: '-bit', prefix: '', label: 'AES Encryption' },
    { number: 100, suffix: '%', prefix: '', label: 'Open Source' },
    { number: 22, suffix: '+', prefix: '', label: 'Languages' },
  ];

  // Security badges
  const securityBadges = [
    { label: 'ML-KEM-1024', icon: Key },
    { label: 'AES-256-GCM', icon: Lock },
    { label: 'End-to-End', icon: Shield },
    { label: 'No Cloud Storage', icon: Cloud },
    { label: 'Open Source', icon: Github },
    { label: 'NIST Approved', icon: BadgeCheck },
  ];

  // Navigation links
  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Security', href: '/security' },
    { label: 'Docs', href: '/docs' },
  ];

  // Footer links
  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Download', href: '/download' },
      { label: 'Pricing', href: '/features#pricing' },
    ],
    resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api' },
      { label: 'Help Center', href: '/help' },
      { label: 'Security', href: '/security' },
    ],
    company: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a08] text-[#fefefc] overflow-x-hidden">
      {/* ================================================================
          NAVIGATION
          ================================================================ */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0a08]/90 backdrop-blur-2xl border-b border-[#262626]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2200px] mx-auto px-6 md:px-12 3xl:px-16 4xl:px-20">
          <div className="flex items-center justify-between h-20 md:h-24 3xl:h-28 4xl:h-32">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <TallowLogo size={44} />
              </motion.div>
              <span className="text-[#fefefc] text-2xl font-serif font-light tracking-tight group-hover:text-white transition-colors duration-300">
                Tallow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-10 3xl:gap-14 4xl:gap-16">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative text-[#888880] hover:text-[#fefefc] text-sm font-medium tracking-wide transition-colors duration-300 group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#fefefc] group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-[#888880] hover:text-[#fefefc] transition-colors rounded-xl hover:bg-white/5"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <PrimaryButton href="/app" className="hidden sm:flex">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </PrimaryButton>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ================================================================
          MOBILE MENU
          ================================================================ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0a0a08]/98 backdrop-blur-2xl"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative h-full flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-16">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                  <TallowLogo size={40} />
                  <span className="text-[#fefefc] text-xl font-serif font-light">Tallow</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 text-[#888880] hover:text-[#fefefc] transition-colors rounded-xl hover:bg-white/5"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 flex flex-col gap-6">
                {navLinks.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.1 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-4xl font-serif font-light text-[#fefefc] hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="pt-8 border-t border-[#262626]">
                <PrimaryButton href="/app" size="large" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </PrimaryButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          HERO SECTION - HUGE Typography
          ================================================================ */}
      <main id="main-content" tabIndex={-1}>
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative min-h-screen flex items-center justify-center pt-24 pb-20 3xl:py-48 3xl:px-16 4xl:py-56 4xl:px-20 overflow-hidden"
        >
          {/* Subtle floating elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Floating circles */}
            <FloatingElement
              type="circle"
              className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full border border-white/10"
              delay={0}
              duration={10}
            />
            <FloatingElement
              type="circle"
              className="absolute top-[60%] left-[10%] w-24 h-24 rounded-full border border-white/5"
              delay={1}
              duration={12}
            />
            <FloatingElement
              type="ring"
              className="absolute bottom-[30%] right-[8%] w-40 h-40 rounded-full border-2 border-white/5"
              delay={0.5}
              duration={14}
            />

            {/* Floating lines */}
            <FloatingElement
              type="line"
              className="absolute top-[35%] left-[20%] w-20 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              delay={0.3}
              duration={8}
            />
            <FloatingElement
              type="line"
              className="absolute bottom-[40%] right-[25%] w-32 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"
              delay={0.8}
              duration={9}
            />

            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] 3xl:w-[1200px] 3xl:h-[800px] 4xl:w-[1600px] 4xl:h-[1000px] bg-white/[0.02] rounded-full blur-[120px] 3xl:blur-[150px] 4xl:blur-[180px]" />
          </div>

          {/* Hero Content */}
          <ParallaxContainer className="relative z-10 max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-10"
              >
                <motion.div
                  className="w-2.5 h-2.5 rounded-full bg-[#fefefc]"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-sm font-medium text-[#888880]">
                  Post-Quantum Secure File Transfer
                </span>
              </motion.div>

              {/* HUGE Typography Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif tracking-[-0.04em] leading-[0.9] mb-12"
              >
                <span
                  className="block text-[#fefefc] font-light"
                  style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}
                >
                  Transfer files
                </span>
                <motion.span
                  className="block text-[#fefefc]/80 italic font-light"
                  style={{ fontSize: 'clamp(3.5rem, 10vw, 7rem)' }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  without limits
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-[#888880] max-w-2xl mx-auto mb-14 leading-relaxed font-light"
              >
                The most secure way to share files. End-to-end encrypted, peer-to-peer,
                and protected against quantum computers.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row justify-center gap-5"
              >
                <PrimaryButton href="/app" size="large">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </PrimaryButton>
                <PrimaryButton href="/how-it-works" variant="outline" size="large">
                  Learn more
                </PrimaryButton>
              </motion.div>
            </div>
          </ParallaxContainer>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-3 text-[#888880]"
            >
              <span className="text-xs uppercase tracking-[0.25em] font-medium">Scroll</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ================================================================
            STATS SECTION
            ================================================================ */}
        <section className="relative py-28 3xl:py-36 4xl:py-44 border-y border-[#262626] bg-[#111110]/50">
          <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 3xl:gap-8 4xl:gap-10">
              {stats.map((stat, i) => (
                <StatCard
                  key={i}
                  number={stat.number}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  label={stat.label}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            FEATURES SECTION - Bento Grid
            ================================================================ */}
        <section className="py-32 md:py-40 3xl:py-48 4xl:py-56">
          <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mb-20"
            >
              <span className="text-[#fefefc] text-sm font-semibold uppercase tracking-[0.2em] mb-6 block">
                Features
              </span>
              <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-[#fefefc] tracking-tight mb-8 leading-[1.1]">
                Built for privacy.{' '}
                <span className="text-[#888880] italic">Designed for speed.</span>
              </h2>
              <p className="text-xl text-[#888880] leading-relaxed">
                Every feature is crafted with security-first principles. No compromises,
                no shortcuts, just the most advanced file transfer technology available.
              </p>
            </motion.div>

            {/* Bento Grid - 6 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-3 4xl:grid-cols-4 gap-6 3xl:gap-8 4xl:gap-10">
              {features.map((feature, i) => (
                <BentoCard
                  key={i}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.desc}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            HOW IT WORKS SECTION
            ================================================================ */}
        <section className="py-32 md:py-40 3xl:py-48 4xl:py-56 border-t border-[#262626] bg-[#111110]/30">
          <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="text-center mb-24"
            >
              <span className="text-[#fefefc] text-sm font-semibold uppercase tracking-[0.2em] mb-6 block">
                How It Works
              </span>
              <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-[#fefefc] tracking-tight mb-8">
                Three steps to{' '}
                <span className="text-[#888880] italic">secure transfers</span>
              </h2>
              <p className="text-xl text-[#888880] max-w-2xl mx-auto">
                No accounts, no installations, no complications.
                Just open, connect, and share.
              </p>
            </motion.div>

            {/* Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
              <HowItWorksStep
                number={1}
                icon={Globe}
                title="Open Tallow"
                description="Visit tallow.app on any device. No downloads or accounts required."
                delay={0}
              />
              <HowItWorksStep
                number={2}
                icon={Smartphone}
                title="Connect Securely"
                description="Scan a QR code or enter a connection code to establish an encrypted tunnel."
                delay={0.2}
              />
              <HowItWorksStep
                number={3}
                icon={Send}
                title="Transfer Files"
                description="Drag and drop your files. They transfer directly with military-grade encryption."
                delay={0.4}
                isLast
              />
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-center mt-20"
            >
              <PrimaryButton href="/app" size="large">
                Try It Now
                <ArrowRight className="w-5 h-5" />
              </PrimaryButton>
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            SECURITY SECTION
            ================================================================ */}
        <section className="py-32 md:py-40 3xl:py-48 4xl:py-56 border-t border-[#262626]">
          <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              {/* Large Shield Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, type: 'spring', stiffness: 120 }}
                className="w-28 h-28 rounded-3xl bg-[#161614] border border-[#262626] flex items-center justify-center mx-auto mb-12 shadow-[0_0_60px_rgba(255,255,255,0.05)]"
              >
                <Shield className="w-14 h-14 text-[#fefefc]" />
              </motion.div>

              <h2 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light text-[#fefefc] tracking-tight mb-8">
                Security you can trust.{' '}
                <span className="text-[#888880] italic">Always.</span>
              </h2>
              <p className="text-xl text-[#888880] leading-relaxed mb-16">
                Built on cutting-edge cryptographic standards. Audited, open-source,
                and designed to protect your data against current and future threats.
              </p>

              {/* Security Badges as Pills */}
              <div className="flex flex-wrap justify-center gap-4">
                {securityBadges.map((badge, i) => (
                  <SecurityBadge
                    key={badge.label}
                    label={badge.label}
                    icon={badge.icon}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================================================================
            FINAL CTA SECTION
            ================================================================ */}
        <section className="relative py-40 md:py-52 3xl:py-60 4xl:py-72 border-t border-[#262626] overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-white/[0.02] rounded-full blur-[150px]" />
          </div>

          {/* Floating elements */}
          <div className="absolute inset-0 pointer-events-none">
            <FloatingElement
              type="circle"
              className="absolute top-[20%] right-[10%] w-36 h-36 rounded-full border border-white/5"
              delay={0}
              duration={12}
            />
            <FloatingElement
              type="ring"
              className="absolute bottom-[25%] left-[8%] w-28 h-28 rounded-full border-2 border-white/5"
              delay={1}
              duration={14}
            />
          </div>

          <div className="relative z-10 max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1 }}
              className="max-w-3xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-12"
              >
                <Send className="w-5 h-5 text-[#fefefc]" />
                <span className="text-sm font-semibold text-[#fefefc]">Free Forever</span>
              </motion.div>

              <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] font-light text-[#fefefc] tracking-tight mb-10 leading-[1.1]">
                Ready to share files
                <br />
                <span className="text-[#888880] italic">securely</span>?
              </h2>
              <p className="text-xl text-[#888880] mb-14 leading-relaxed">
                Join thousands of users who trust Tallow for their most sensitive files.
                No sign-up required.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-5 mb-16">
                <PrimaryButton href="/app" size="large">
                  Start Transferring Now
                  <ArrowRight className="w-5 h-5" />
                </PrimaryButton>
                <PrimaryButton href="/features" variant="outline" size="large">
                  Explore Features
                </PrimaryButton>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-[#888880]">
                {[
                  { icon: Check, text: 'No sign-up required' },
                  { icon: Check, text: 'No file size limits' },
                  { icon: Check, text: 'Free forever' },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + 0.5 }}
                    className="flex items-center gap-2.5"
                  >
                    <item.icon className="w-5 h-5 text-[#fefefc]" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ================================================================
          FOOTER - 4 Column Links
          ================================================================ */}
      <footer className="border-t border-[#262626] py-20 3xl:py-24 4xl:py-28 bg-[#111110]/50">
        <div className="max-w-[1400px] 3xl:max-w-[1800px] 4xl:max-w-[2400px] mx-auto px-6 md:px-12 3xl:px-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-10 3xl:gap-14 4xl:gap-16 mb-20 3xl:mb-24">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <TallowLogo size={40} />
                <span className="text-[#fefefc] text-2xl font-serif font-light">Tallow</span>
              </Link>
              <p className="text-[#888880] text-sm leading-relaxed max-w-xs mb-6">
                Secure file transfer without limits. End-to-end encrypted,
                peer-to-peer, and protected against quantum computers.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/tallow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[#161614] border border-[#262626] flex items-center justify-center text-[#888880] hover:text-[#fefefc] hover:border-white/20 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://twitter.com/tallow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[#161614] border border-[#262626] flex items-center justify-center text-[#888880] hover:text-[#fefefc] hover:border-white/20 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="https://linkedin.com/company/tallow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-[#161614] border border-[#262626] flex items-center justify-center text-[#888880] hover:text-[#fefefc] hover:border-white/20 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-[#fefefc] text-sm font-semibold uppercase tracking-wider mb-5">Product</h4>
              <div className="flex flex-col gap-3">
                {footerLinks.product.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-[#fefefc] text-sm font-semibold uppercase tracking-wider mb-5">Resources</h4>
              <div className="flex flex-col gap-3">
                {footerLinks.resources.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[#fefefc] text-sm font-semibold uppercase tracking-wider mb-5">Company</h4>
              <div className="flex flex-col gap-3">
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[#fefefc] text-sm font-semibold uppercase tracking-wider mb-5">Legal</h4>
              <div className="flex flex-col gap-3">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[#888880] text-sm hover:text-[#fefefc] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar with status indicator */}
          <div className="pt-10 border-t border-[#262626] flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[#888880] text-sm">
              {new Date().getFullYear()} Tallow. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              {/* Status indicator */}
              <div className="flex items-center gap-2.5">
                <motion.span
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[#888880] text-sm">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export for potential reuse
export { TallowLogo, AnimatedCounter, PrimaryButton };
