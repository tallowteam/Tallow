/**
 * SEO Constants
 *
 * Centralized SEO configuration for Tallow.
 * All metadata, social handles, and default values.
 */

export const SEO = {
  site: {
    name: 'Tallow',
    domain: 'tallow.app',
    url: 'https://tallow.app',
    tagline: 'Secure File Transfers. Quantum-Safe.',
  },

  metadata: {
    title: {
      default: 'Tallow - Secure File Transfers. Quantum-Safe.',
      template: '%s | Tallow',
    },
    description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises. Peer-to-peer, zero-knowledge file sharing.',
    keywords: [
      'secure file transfer',
      'quantum-safe',
      'post-quantum encryption',
      'peer-to-peer',
      'p2p',
      'zero knowledge',
      'encrypted file sharing',
      'end-to-end encryption',
      'file transfer',
      'secure sharing',
      'privacy',
      'WebRTC',
      'Kyber',
      'ML-KEM',
      'quantum resistant',
      'military-grade encryption',
      'no cloud storage',
      'direct transfer',
      'metadata stripping',
      'onion routing',
    ],
  },

  social: {
    twitter: '@tallow',
    github: 'https://github.com/tallow',
    discord: 'https://discord.gg/tallow',
  },

  company: {
    name: 'Tallow',
    email: 'hello@tallow.app',
    support: 'support@tallow.app',
  },

  images: {
    og: {
      width: 1200,
      height: 630,
      alt: 'Tallow - Secure File Transfers. Quantum-Safe.',
    },
    twitter: {
      width: 1200,
      height: 600,
      alt: 'Tallow - Secure File Transfers. Quantum-Safe.',
    },
  },

  locale: {
    default: 'en_US',
    supported: ['en_US'],
  },
} as const;

/**
 * Page-specific SEO data
 */
export const PAGE_SEO = {
  home: {
    title: 'Tallow - Secure File Transfers. Quantum-Safe.',
    description: 'Transfer files directly between devices with post-quantum encryption. No cloud storage, no compromises. Peer-to-peer, zero-knowledge file sharing.',
    keywords: ['secure file transfer', 'quantum-safe', 'post-quantum encryption', 'peer-to-peer'],
  },
  app: {
    title: 'Transfer Files',
    description: 'Securely transfer files between devices with post-quantum encryption. Direct peer-to-peer transfers with zero-knowledge architecture.',
    keywords: ['file transfer', 'p2p transfer', 'secure sharing'],
  },
  features: {
    title: 'Features',
    description: 'Explore Tallow\'s advanced security features: post-quantum encryption, onion routing, metadata stripping, and more.',
    keywords: ['security features', 'quantum-safe encryption', 'privacy features'],
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Learn how Tallow protects your privacy with zero-knowledge architecture and end-to-end encryption.',
    keywords: ['privacy policy', 'data protection', 'zero knowledge'],
  },
  security: {
    title: 'Security',
    description: 'Military-grade security with post-quantum cryptography, triple-ratchet protocol, and onion routing.',
    keywords: ['post-quantum cryptography', 'Kyber-1024', 'ML-KEM', 'triple-ratchet'],
  },
  terms: {
    title: 'Terms of Service',
    description: 'Terms and conditions for using Tallow secure file transfer service.',
    keywords: ['terms of service', 'legal', 'user agreement'],
  },
  help: {
    title: 'Help Center',
    description: 'Get help with Tallow. Find guides, tutorials, and answers to common questions.',
    keywords: ['help', 'support', 'documentation', 'tutorials'],
  },
  docs: {
    title: 'Documentation',
    description: 'Complete documentation for Tallow secure file transfer platform. API references, guides, and examples.',
    keywords: ['documentation', 'API', 'developer guide', 'technical docs'],
  },
} as const;

/**
 * Structured data constants
 */
export const STRUCTURED_DATA = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEO.site.name,
    url: SEO.site.url,
    logo: `${SEO.site.url}/logo.png`,
    sameAs: [
      SEO.social.github,
      SEO.social.discord,
      `https://twitter.com/${SEO.social.twitter.replace('@', '')}`,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: SEO.company.email,
      contactType: 'Customer Service',
    },
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SEO.site.name,
    url: SEO.site.url,
    description: SEO.metadata.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SEO.site.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
} as const;
