import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { Container } from './Container';
import { Grid } from './Grid';
import { Stack } from './Stack';

interface FooterLink {
  href: string;
  label: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/how-it-works', label: 'How It Works' },
      { href: '/security', label: 'Security' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/help', label: 'Help Center' },
      { href: '/api', label: 'API Reference' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
      { href: '/careers', label: 'Careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/cookies', label: 'Cookie Policy' },
      { href: '/compliance', label: 'Compliance' },
    ],
  },
];

const socialLinks = [
  { href: 'https://github.com', label: 'GitHub', icon: Github },
  { href: 'https://twitter.com', label: 'Twitter', icon: Twitter },
  { href: 'https://linkedin.com', label: 'LinkedIn', icon: Linkedin },
];

/**
 * Site footer with multi-column layout, links, and newsletter signup
 *
 * @example
 * ```tsx
 * <Footer />
 * ```
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <Container>
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <Grid cols={4} gap="lg" className="lg:grid-cols-5">
            {/* Brand Column */}
            <div className="col-span-1 lg:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center space-x-2 transition-opacity hover:opacity-80"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-900 font-bold text-white">
                  T
                </div>
                <span className="text-xl font-bold text-zinc-100">Tallow</span>
              </Link>
              <p className="mt-4 text-sm text-zinc-400">
                Secure, anonymous file transfers with end-to-end encryption.
              </p>

              {/* Social Links */}
              <Stack direction="horizontal" gap="sm" className="mt-6">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </Stack>
            </div>

            {/* Link Columns */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-sm font-semibold text-zinc-100">
                  {section.title}
                </h3>
                <Stack direction="vertical" gap="xs">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </div>
            ))}
          </Grid>

          {/* Newsletter Section */}
          <div className="mt-12 border-t border-zinc-800 pt-8">
            <div className="mx-auto max-w-md">
              <h3 className="text-center text-sm font-semibold text-zinc-100">
                Stay Updated
              </h3>
              <p className="mt-2 text-center text-sm text-zinc-400">
                Get the latest updates on security features and improvements.
              </p>
              <form className="mt-4 flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-100 px-6 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-950"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-400">
              &copy; {currentYear} Tallow. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Terms
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
