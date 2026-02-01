/**
 * Search Index
 * Creates searchable index from feature catalog and documentation
 */

export type SearchResultType = 'feature' | 'help' | 'api' | 'page' | 'setting';

export interface SearchItem {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  url: string;
  icon?: string;
  keywords?: string[];
}

/**
 * Feature catalog search items
 * Core features, security, privacy, communication, etc.
 */
export const FEATURE_SEARCH_ITEMS: SearchItem[] = [
  // Core Features
  {
    id: 'p2p-transfer',
    type: 'feature',
    title: 'P2P Direct Transfer',
    description: 'Transfer files directly between devices using WebRTC DataChannel',
    content: 'Peer-to-peer file transfer WebRTC direct connection no servers',
    category: 'Core Features',
    tags: ['p2p', 'webrtc', 'transfer', 'direct', 'peer-to-peer'],
    url: '/app',
    icon: 'Zap',
    keywords: ['send', 'share', 'transfer', 'file'],
  },
  {
    id: 'pqc-encryption',
    type: 'feature',
    title: 'Quantum-Resistant Encryption',
    description: 'ML-KEM-768 (Kyber) post-quantum cryptography',
    content: 'ML-KEM-768 Kyber post-quantum encryption quantum-resistant NIST',
    category: 'Security',
    tags: ['encryption', 'pqc', 'kyber', 'quantum-resistant', 'ml-kem'],
    url: '/security',
    icon: 'Shield',
    keywords: ['secure', 'encrypt', 'quantum', 'crypto'],
  },
  {
    id: 'chacha20-poly1305',
    type: 'feature',
    title: 'ChaCha20-Poly1305 Cipher',
    description: 'Constant-time AEAD cipher for maximum security',
    content: 'ChaCha20-Poly1305 AEAD constant-time timing-attack resistant',
    category: 'Security',
    tags: ['encryption', 'chacha20', 'poly1305', 'aead', 'constant-time'],
    url: '/security',
    icon: 'Lock',
    keywords: ['encrypt', 'cipher', 'secure'],
  },
  {
    id: 'metadata-stripping',
    type: 'feature',
    title: 'Metadata Stripping',
    description: 'Automatically remove EXIF and metadata from files',
    content: 'metadata stripping EXIF removal GPS location privacy',
    category: 'Privacy',
    tags: ['privacy', 'metadata', 'exif', 'strip', 'remove'],
    url: '/privacy',
    icon: 'Eye',
    keywords: ['privacy', 'metadata', 'exif', 'gps'],
  },
  {
    id: 'onion-routing',
    type: 'feature',
    title: 'Onion Routing',
    description: 'Multi-layer encryption through relay nodes',
    content: 'onion routing Tor-like multi-layer encryption relay anonymity',
    category: 'Privacy',
    tags: ['privacy', 'onion', 'routing', 'tor', 'relay', 'anonymity'],
    url: '/privacy',
    icon: 'Network',
    keywords: ['anonymous', 'tor', 'privacy', 'relay'],
  },
  {
    id: 'e2ee-chat',
    type: 'feature',
    title: 'End-to-End Encrypted Chat',
    description: 'Real-time encrypted messaging during transfers',
    content: 'E2EE chat encrypted messaging Signal protocol real-time',
    category: 'Communication',
    tags: ['chat', 'messaging', 'e2ee', 'encrypted', 'signal'],
    url: '/app',
    icon: 'MessageSquare',
    keywords: ['chat', 'message', 'talk', 'text'],
  },
  {
    id: 'screen-sharing',
    type: 'feature',
    title: 'Screen Sharing',
    description: 'Share your screen with end-to-end encryption',
    content: 'screen sharing encrypted WebRTC display capture',
    category: 'Communication',
    tags: ['screen', 'sharing', 'display', 'webrtc', 'encrypted'],
    url: '/screen-share-demo',
    icon: 'Monitor',
    keywords: ['screen', 'share', 'display', 'show'],
  },
  {
    id: 'voice-commands',
    type: 'feature',
    title: 'Voice Commands',
    description: 'Control Tallow with voice commands',
    content: 'voice commands speech recognition hands-free accessibility',
    category: 'Accessibility',
    tags: ['voice', 'speech', 'commands', 'accessibility', 'hands-free'],
    url: '/app',
    icon: 'Mic',
    keywords: ['voice', 'speak', 'say', 'command'],
  },
  {
    id: 'group-transfer',
    type: 'feature',
    title: 'Group Transfer',
    description: 'Send files to multiple recipients simultaneously',
    content: 'group transfer multicast multiple recipients broadcast',
    category: 'Advanced Transfer',
    tags: ['group', 'multicast', 'multiple', 'broadcast'],
    url: '/app',
    icon: 'Users',
    keywords: ['group', 'multiple', 'many', 'broadcast'],
  },
  {
    id: 'folder-transfer',
    type: 'feature',
    title: 'Folder Transfer',
    description: 'Transfer entire folders with structure preserved',
    content: 'folder transfer directory recursive structure preserved',
    category: 'Advanced Transfer',
    tags: ['folder', 'directory', 'recursive', 'structure'],
    url: '/app',
    icon: 'Folder',
    keywords: ['folder', 'directory', 'multiple files'],
  },
  {
    id: 'resumable-transfer',
    type: 'feature',
    title: 'Resumable Transfers',
    description: 'Pause and resume large file transfers',
    content: 'resumable transfers pause resume checkpoint recovery',
    category: 'Advanced Transfer',
    tags: ['resumable', 'pause', 'resume', 'checkpoint'],
    url: '/app',
    icon: 'Play',
    keywords: ['pause', 'resume', 'continue', 'stop'],
  },
  {
    id: 'email-fallback',
    type: 'feature',
    title: 'Email Fallback',
    description: 'Send files via encrypted email when P2P fails',
    content: 'email fallback offline transfer encrypted storage temporary',
    category: 'Advanced Transfer',
    tags: ['email', 'fallback', 'offline', 'backup'],
    url: '/app',
    icon: 'Mail',
    keywords: ['email', 'offline', 'backup', 'fallback'],
  },
  {
    id: 'transfer-rooms',
    type: 'feature',
    title: 'Transfer Rooms',
    description: 'Create persistent rooms for easy file sharing',
    content: 'transfer rooms persistent sharing collaboration workspace',
    category: 'Advanced Transfer',
    tags: ['rooms', 'persistent', 'collaboration', 'workspace'],
    url: '/room',
    icon: 'Home',
    keywords: ['room', 'space', 'workspace', 'persistent'],
  },
];

/**
 * Help documentation search items
 */
export const HELP_SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'getting-started',
    type: 'help',
    title: 'Getting Started',
    description: 'Learn how to use Tallow for the first time',
    content: 'getting started tutorial first time user guide introduction',
    category: 'Help',
    tags: ['help', 'tutorial', 'getting-started', 'beginner'],
    url: '/how-it-works',
    icon: 'HelpCircle',
    keywords: ['start', 'begin', 'new', 'help'],
  },
  {
    id: 'how-to-send',
    type: 'help',
    title: 'How to Send Files',
    description: 'Step-by-step guide to sending files',
    content: 'send files transfer how to guide instructions step by step',
    category: 'Help',
    tags: ['help', 'send', 'transfer', 'guide'],
    url: '/how-it-works',
    icon: 'Send',
    keywords: ['send', 'transfer', 'how', 'guide'],
  },
  {
    id: 'how-to-receive',
    type: 'help',
    title: 'How to Receive Files',
    description: 'Step-by-step guide to receiving files',
    content: 'receive files download how to guide instructions accept',
    category: 'Help',
    tags: ['help', 'receive', 'download', 'guide'],
    url: '/how-it-works',
    icon: 'Download',
    keywords: ['receive', 'download', 'accept', 'get'],
  },
  {
    id: 'security-guide',
    type: 'help',
    title: 'Security Guide',
    description: 'Understanding Tallow\'s security features',
    content: 'security guide encryption privacy protection how it works',
    category: 'Help',
    tags: ['help', 'security', 'encryption', 'guide'],
    url: '/security',
    icon: 'Shield',
    keywords: ['security', 'safe', 'secure', 'protect'],
  },
  {
    id: 'privacy-guide',
    type: 'help',
    title: 'Privacy Guide',
    description: 'Understanding Tallow\'s privacy features',
    content: 'privacy guide metadata stripping anonymity protection',
    category: 'Help',
    tags: ['help', 'privacy', 'anonymity', 'guide'],
    url: '/privacy',
    icon: 'Eye',
    keywords: ['privacy', 'anonymous', 'private', 'protect'],
  },
  {
    id: 'troubleshooting',
    type: 'help',
    title: 'Troubleshooting',
    description: 'Common issues and solutions',
    content: 'troubleshooting problems issues solutions fixes help',
    category: 'Help',
    tags: ['help', 'troubleshooting', 'problems', 'issues'],
    url: '/how-it-works',
    icon: 'AlertCircle',
    keywords: ['problem', 'issue', 'error', 'fix', 'help'],
  },
];

/**
 * Settings search items
 */
export const SETTINGS_SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'privacy-settings',
    type: 'setting',
    title: 'Privacy Settings',
    description: 'Configure privacy and anonymity settings',
    content: 'privacy settings metadata stripping onion routing anonymity',
    category: 'Settings',
    tags: ['settings', 'privacy', 'configuration'],
    url: '/app/settings',
    icon: 'Settings',
    keywords: ['settings', 'privacy', 'configure', 'options'],
  },
  {
    id: 'security-settings',
    type: 'setting',
    title: 'Security Settings',
    description: 'Configure encryption and security options',
    content: 'security settings encryption algorithms key rotation verification',
    category: 'Settings',
    tags: ['settings', 'security', 'encryption'],
    url: '/app/settings',
    icon: 'Shield',
    keywords: ['settings', 'security', 'encryption', 'configure'],
  },
  {
    id: 'theme-settings',
    type: 'setting',
    title: 'Theme Settings',
    description: 'Change theme and appearance',
    content: 'theme settings appearance dark mode light mode customization',
    category: 'Settings',
    tags: ['settings', 'theme', 'appearance', 'dark-mode'],
    url: '/app/settings',
    icon: 'Palette',
    keywords: ['theme', 'dark', 'light', 'appearance', 'color'],
  },
  {
    id: 'language-settings',
    type: 'setting',
    title: 'Language Settings',
    description: 'Change language (22 languages supported)',
    content: 'language settings i18n internationalization translation locale',
    category: 'Settings',
    tags: ['settings', 'language', 'i18n', 'translation'],
    url: '/app/settings',
    icon: 'Globe',
    keywords: ['language', 'translate', 'locale', 'i18n'],
  },
];

/**
 * Page search items
 */
export const PAGE_SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'landing-page',
    type: 'page',
    title: 'Home',
    description: 'Tallow - Private, Quantum-Safe File Transfer',
    content: 'home landing page introduction features overview',
    category: 'Pages',
    tags: ['page', 'home', 'landing'],
    url: '/',
    icon: 'Home',
    keywords: ['home', 'start', 'main', 'index'],
  },
  {
    id: 'app-page',
    type: 'page',
    title: 'Transfer App',
    description: 'Main file transfer application',
    content: 'app transfer send receive files application',
    category: 'Pages',
    tags: ['page', 'app', 'transfer'],
    url: '/app',
    icon: 'Zap',
    keywords: ['app', 'transfer', 'send', 'main'],
  },
  {
    id: 'security-page',
    type: 'page',
    title: 'Security',
    description: 'Learn about Tallow\'s security features',
    content: 'security encryption ML-KEM Kyber quantum-resistant features',
    category: 'Pages',
    tags: ['page', 'security', 'encryption'],
    url: '/security',
    icon: 'Shield',
    keywords: ['security', 'encryption', 'safe'],
  },
  {
    id: 'privacy-page',
    type: 'page',
    title: 'Privacy',
    description: 'Learn about Tallow\'s privacy features',
    content: 'privacy metadata stripping anonymity onion routing features',
    category: 'Pages',
    tags: ['page', 'privacy', 'anonymity'],
    url: '/privacy',
    icon: 'Eye',
    keywords: ['privacy', 'anonymous', 'private'],
  },
  {
    id: 'how-it-works',
    type: 'page',
    title: 'How It Works',
    description: 'Understand how Tallow works',
    content: 'how it works guide tutorial documentation help',
    category: 'Pages',
    tags: ['page', 'help', 'documentation'],
    url: '/how-it-works',
    icon: 'HelpCircle',
    keywords: ['how', 'works', 'guide', 'help'],
  },
  {
    id: 'donate-page',
    type: 'page',
    title: 'Support Tallow',
    description: 'Support the development of Tallow',
    content: 'donate support contribute funding development',
    category: 'Pages',
    tags: ['page', 'donate', 'support'],
    url: '/donate',
    icon: 'Heart',
    keywords: ['donate', 'support', 'contribute', 'help'],
  },
];

/**
 * Combined search index
 * All searchable items across the application
 */
export const SEARCH_INDEX: SearchItem[] = [
  ...FEATURE_SEARCH_ITEMS,
  ...HELP_SEARCH_ITEMS,
  ...SETTINGS_SEARCH_ITEMS,
  ...PAGE_SEARCH_ITEMS,
];

/**
 * Get search items by type
 */
export function getSearchItemsByType(type: SearchResultType): SearchItem[] {
  return SEARCH_INDEX.filter((item) => item.type === type);
}

/**
 * Get search items by category
 */
export function getSearchItemsByCategory(category: string): SearchItem[] {
  return SEARCH_INDEX.filter((item) => item.category === category);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(SEARCH_INDEX.map((item) => item.category));
  return Array.from(categories).sort();
}

/**
 * Get all tags
 */
export function getAllTags(): string[] {
  const tags = new Set(SEARCH_INDEX.flatMap((item) => item.tags));
  return Array.from(tags).sort();
}
