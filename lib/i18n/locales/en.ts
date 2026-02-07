/**
 * English (US) Translations for Tallow
 *
 * Complete translation system covering all app sections:
 * - common: General UI labels and buttons
 * - nav: Navigation menu items and links
 * - hero: Landing page hero section
 * - features: Feature descriptions and details
 * - security: Security-related content
 * - pricing: Pricing plans and billing
 * - transfer: File transfer UI and messages
 * - settings: User preferences and configuration
 * - chat: Messaging and communication
 * - friends: Contacts and friend management
 * - notifications: System and user notifications
 * - errors: Error messages and recovery
 * - a11y: Accessibility labels and announcements
 * - time: Relative time formatting
 * - fileSize: File size units
 * - speed: Transfer speed units
 */

export default {
  common: {
    appName: 'Tallow',
    tagline: 'Secure File Sharing',
    loading: 'Loading...',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    prev: 'Previous',
    search: 'Search...',
    noResults: 'No results found',
    retry: 'Retry',
    copy: 'Copy',
    copied: 'Copied',
    share: 'Share',
    download: 'Download',
    upload: 'Upload',
    create: 'Create',
    edit: 'Edit',
    remove: 'Remove',
    clear: 'Clear',
    view: 'View',
    hide: 'Hide',
    show: 'Show',
    more: 'More',
    less: 'Less',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    done: 'Done',
    submit: 'Submit',
    continue: 'Continue',
    learnMore: 'Learn More',
    getStarted: 'Get Started',
    viewAll: 'View All',
    optional: 'Optional',
    required: 'Required',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
  },

  nav: {
    home: 'Home',
    features: 'Features',
    security: 'Security',
    pricing: 'Pricing',
    docs: 'Docs',
    about: 'About',
    transfer: 'Open App',
    settings: 'Settings',
    profile: 'Profile',
    account: 'Account',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    help: 'Help',
    contact: 'Contact',
    faq: 'FAQ',
    blog: 'Blog',
    status: 'Status',
    github: 'GitHub',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  hero: {
    title: 'File transfers.',
    titleGradient: 'Quantum-safe.',
    subtitle: 'Transfer files directly between devices with military-grade encryption. No servers, no tracking, no limits. Your data stays yours.',
    cta: 'Start Transferring',
    secondaryCta: 'Documentation',
    badge: 'Now with quantum-safe encryption',
    stats: {
      encryption: {
        value: '256-bit',
        label: 'Encryption',
      },
      servers: {
        value: 'Zero',
        label: 'Servers',
      },
      private: {
        value: '100%',
        label: 'Private',
      },
    },
  },

  features: {
    title: 'Built for security and speed',
    description: 'Everything you need for secure file transfers, without compromise.',
    moreTitle: 'And there\'s more',
    moreDescription: 'Every detail considered for the best file transfer experience.',
    comparisonTitle: 'How Tallow compares',
    comparisonDescription: 'See how we stack up against traditional file sharing services.',

    localSharing: 'Local Network',
    internetSharing: 'Internet P2P',
    friendsSharing: 'Friends',

    endToEndEncryption: {
      title: 'End-to-End Encryption',
      description: 'Your files are encrypted with AES-256-GCM before leaving your device. Only the intended recipient can decrypt them.',
      details: [
        'Military-grade AES-256-GCM encryption',
        'Keys generated fresh for each transfer',
        'Zero-knowledge architecture',
      ],
    },

    postQuantumCrypto: {
      title: 'Post-Quantum Cryptography',
      description: 'Future-proof protection using ML-KEM (Kyber) key encapsulation. Safe against quantum computer attacks.',
      details: [
        'NIST-standardized ML-KEM-768',
        'Hybrid classical + post-quantum',
        'Forward secrecy guaranteed',
      ],
    },

    directP2P: {
      title: 'Direct P2P Transfer',
      description: 'Files travel directly between devices using WebRTC. No cloud servers store your data.',
      details: [
        'WebRTC data channels',
        'NAT traversal support',
        'No intermediate storage',
      ],
    },

    groupTransfers: {
      title: 'Group Transfers',
      description: 'Send files to up to 10 recipients simultaneously. Each recipient gets individually encrypted copies.',
      badge: 'Up to 10',
    },

    metadataStripping: {
      title: 'Metadata Stripping',
      description: 'Automatically removes EXIF data, GPS coordinates, and other metadata from images and documents.',
    },

    resumableTransfers: {
      title: 'Resumable Transfers',
      description: 'Network interruption? Transfers resume automatically from the exact byte where they stopped.',
    },

    nativeSpeed: {
      title: 'Native Speed',
      description: 'Optimized chunking and parallel channels maximize your connection speed for large files.',
    },

    localDiscovery: {
      title: 'Local Discovery',
      description: 'mDNS discovery finds devices on your local network automatically. No codes needed.',
    },

    folderSupport: {
      title: 'Folder Support',
      description: 'Transfer entire folder structures with preserved hierarchy. Drag and drop entire directories.',
    },
  },

  security: {
    e2e: 'End-to-End Encrypted',
    pqc: 'Post-Quantum Secure',
    zeroKnowledge: 'Zero Knowledge',
    openSource: 'Open Source',
    auditable: 'Independently Auditable',
    perfectForwardSecrecy: 'Perfect Forward Secrecy',
    noDataRetention: 'No Data Retention',
    noTracking: 'No Tracking',
    noAnalytics: 'No Analytics',
    noLogs: 'No Logs',

    architecture: 'Security Architecture',
    encryption: 'Encryption',
    keyExchange: 'Key Exchange',
    transport: 'Transport',
    performance: 'Performance',

    algorithm: {
      aes: 'AES-256-GCM',
      mlkem: 'ML-KEM-768',
      webrtc: 'WebRTC P2P',
      native: 'Native Speed',
    },

    comparison: {
      feature: 'Feature',
      tallow: 'Tallow',
      others: 'Others',
      endToEndEncryption: 'End-to-end encryption',
      postQuantumSafe: 'Post-quantum safe',
      noCloudStorage: 'No cloud storage',
      noAccountRequired: 'No account required',
      openSource: 'Open source',
      metadataStripping: 'Metadata stripping',
      resumableTransfers: 'Resumable transfers',
      groupTransfers: 'Group transfers',
      varies: 'Varies',
    },
  },

  pricing: {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
    perMonth: '/month',
    forever: 'forever',
    custom: 'Custom',

    startFree: 'Start Free',
    startTrial: 'Start Free Trial',
    contactSales: 'Contact Sales',

    free_description: 'For personal use and small transfers',
    pro_description: 'For power users and teams',
    enterprise_description: 'For organizations with custom needs',

    free_features: [
      'Unlimited file transfers',
      'End-to-end encryption',
      'Post-quantum cryptography',
      'Up to 5 recipients',
      'Local device discovery',
      'Resumable transfers',
    ],

    pro_features: [
      'Everything in Free',
      'Up to 10 recipients',
      'Priority TURN servers',
      'Transfer analytics',
      'Custom room codes',
      'Priority support',
    ],

    enterprise_features: [
      'Everything in Pro',
      'Unlimited recipients',
      'Self-hosted option',
      'Custom TURN servers',
      'SSO/SAML integration',
      'Dedicated support',
    ],

    popular: 'Popular',

    faqs: [
      {
        question: 'Is Tallow really free?',
        answer: 'Yes! The core functionality of Tallow is completely free and always will be. We believe secure file transfer should be accessible to everyone. Pro and Enterprise plans offer additional features for power users and organizations.',
      },
      {
        question: 'What happens to my files?',
        answer: 'Your files never touch our servers. They are encrypted on your device and transfer directly to the recipient via peer-to-peer WebRTC connections. We have zero access to your data.',
      },
      {
        question: 'Do I need an account?',
        answer: 'No account is required for the Free plan. You can start transferring files immediately. Pro and Enterprise plans require an account for additional features and billing.',
      },
      {
        question: 'Is there a file size limit?',
        answer: 'No! Tallow has no file size limits. Transfer files of any size directly between devices. Large files are chunked and can be resumed if the connection is interrupted.',
      },
      {
        question: 'What is post-quantum cryptography?',
        answer: 'Post-quantum cryptography uses algorithms that are secure against both classical and quantum computer attacks. Tallow uses ML-KEM (Kyber), a NIST-standardized algorithm, to protect your transfers against future quantum threats.',
      },
    ],
  },

  transfer: {
    title: 'Transfer Files',
    dropFiles: 'Drop files here or click to browse',
    selectFiles: 'Select Files',
    browseFiles: 'Browse Files',
    dragAndDrop: 'Drag and drop files or folders here',

    scanning: 'Scanning network...',
    noDevices: 'No devices found',
    deviceDiscovered: 'Device discovered',
    devicesFound: '{{count}} devices found',

    selectDevice: 'Select a device to transfer files',
    selectRecipient: 'Select recipient',
    sendTo: 'Send to {{name}}',
    sendFiles: 'Send Files',

    receiving: 'Receiving...',
    sending: 'Sending...',
    processing: 'Processing...',

    complete: 'Transfer complete!',
    success: 'Files transferred successfully',
    failed: 'Transfer failed',
    cancelled: 'Transfer cancelled',
    paused: 'Transfer paused',
    resumed: 'Transfer resumed',

    speed: '{{speed}}/s',
    timeRemaining: '{{time}} remaining',
    of: 'of',
    files: 'files',

    // Device Discovery
    nearbyDevices: 'Nearby Devices',
    internetMode: 'Internet Mode',
    friends: 'Friends',
    onlineContacts: 'Online Contacts',

    // Room Code
    roomCode: 'Room Code',
    enterRoomCode: 'Enter room code',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    roomCodePlaceholder: 'XXXX-XXXX-XXXX',

    // File Status
    fileSelected: '1 file selected',
    filesSelected: '{{count}} files selected',
    folderSelected: '1 folder selected',
    foldersSelected: '{{count}} folders selected',

    // Transfer Progress
    preparing: 'Preparing files...',
    encrypting: 'Encrypting...',
    uploading: 'Uploading...',
    downloading: 'Downloading...',
    verifying: 'Verifying...',

    // File Details
    fileName: 'File Name',
    fileSize: 'File Size',
    fileType: 'File Type',
    lastModified: 'Last Modified',

    // Actions
    startTransfer: 'Start Transfer',
    stopTransfer: 'Stop Transfer',
    pauseTransfer: 'Pause Transfer',
    resumeTransfer: 'Resume Transfer',
    clearFiles: 'Clear Files',
    removeFile: 'Remove File',
    cancel: 'Cancel Transfer',
    pause: 'Pause',
    resume: 'Resume',
    retry: 'Retry Transfer',

    // Containers
    queue: 'Transfer Queue',
    history: 'Transfer History',
    clearHistory: 'Clear History',

    // Privacy
    privacyMode: 'Privacy Mode',
    metadataStripping: 'Metadata Stripping',
    stripMetadata: 'Strip metadata from files',

    // Settings
    allowMultipleTransfers: 'Allow multiple simultaneous transfers',
    enableNotifications: 'Enable transfer notifications',
    autoAcceptFromTrusted: 'Auto-accept from trusted devices',
  },

  settings: {
    title: 'Settings',
    general: 'General',
    security: 'Security',
    privacy: 'Privacy',
    notifications: 'Notifications',
    appearance: 'Appearance',
    about: 'About',

    theme: 'Theme',
    language: 'Language',
    deviceName: 'Device Name',
    deviceNamePlaceholder: 'My Computer',

    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    autoMode: 'Auto',
    highContrast: 'High Contrast',
    dark: 'Dark',
    light: 'Light',
    colorblind: 'Colorblind Mode',

    // Security Settings
    passwordProtection: 'Password Protection',
    enablePasswordProtection: 'Enable password protection for transfers',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',

    // Privacy Settings
    privacyMode: 'Privacy Mode',
    enablePrivacyMode: 'Enable privacy mode',
    stripMetadata: 'Strip file metadata',
    temporaryVisibility: 'Temporary Visibility',
    enableTemporaryVisibility: 'Only visible when tab is active',
    deleteTransferHistory: 'Delete Transfer History',
    clearCache: 'Clear Cache',

    // Notification Settings
    enableNotifications: 'Enable Notifications',
    transferStarted: 'Transfer Started',
    transferCompleted: 'Transfer Completed',
    deviceDiscovered: 'Device Discovered',
    transferFailed: 'Transfer Failed',
    sound: 'Sound',
    enableSound: 'Play sound for notifications',

    // Storage Settings
    storage: 'Storage',
    downloadLocation: 'Download Location',
    autoDownload: 'Auto-download files',
    maxStorageSize: 'Maximum Storage Size',

    // Advanced
    advanced: 'Advanced',
    enableOnionRouting: 'Enable Onion Routing',
    enableNATDetection: 'Enable NAT Detection',
    maxConcurrentTransfers: 'Maximum Concurrent Transfers',
    chunkSize: 'Chunk Size',
    connection: 'Connection',

    // System Info
    version: 'Version',
    buildDate: 'Build Date',
    platform: 'Platform',
    browser: 'Browser',
  },

  chat: {
    title: 'Chat',
    messages: 'Messages',
    newMessage: 'New message',
    typingIndicator: '{{name}} is typing...',
    typingMultiple: '{{count}} people are typing...',
    messagePlaceholder: 'Type a message...',
    send: 'Send',
    attachment: 'Attachment',
    emoji: 'Emoji',

    // Chat States
    noMessages: 'No messages yet',
    startConversation: 'Start a conversation',
    encrypted: 'End-to-end encrypted',
    delivered: 'Delivered',
    read: 'Read',

    // Message Actions
    edit: 'Edit',
    delete: 'Delete',
    react: 'React',
    reply: 'Reply',
    forward: 'Forward',

    // Status
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    doNotDisturb: 'Do Not Disturb',

    // Notifications
    newChatMessage: 'New message from {{name}}',
    groupMessage: 'New message in {{group}}',
  },

  friends: {
    title: 'Friends',
    addFriend: 'Add Friend',
    addContact: 'Add Contact',
    pairingCode: 'Pairing Code',
    enterPairingCode: 'Enter pairing code',
    yourCode: 'Your Pairing Code',
    copyCode: 'Copy Code',
    scanCode: 'Scan Code',

    online: 'Online',
    offline: 'Offline',
    lastSeen: 'Last seen {{time}}',

    status: 'Status',
    statusMessage: 'Status message',
    setStatus: 'Set status message',

    // Friend Actions
    sendFile: 'Send File',
    chat: 'Chat',
    viewProfile: 'View Profile',
    removeFriend: 'Remove Friend',
    block: 'Block',
    unblock: 'Unblock',

    // Friend List
    allFriends: 'All Friends',
    onlineFriends: 'Online Friends',
    recentContacts: 'Recent Contacts',
    blocked: 'Blocked',
    pending: 'Pending',

    // Notifications
    friendRequest: '{{name}} wants to connect',
    friendOnline: '{{name}} is now online',
    friendOffline: '{{name}} is now offline',
    friendAdded: 'Successfully added {{name}}',
  },

  notifications: {
    // Transfer Notifications
    transferComplete: 'Transfer from {{name}} complete',
    transferStarted: 'Transfer started with {{name}}',
    transferFailed: 'Transfer failed: {{reason}}',
    transferCancelled: 'Transfer cancelled',

    // Device Notifications
    newDevice: 'New device discovered: {{name}}',
    newDevice_Connection: 'New device connected',
    deviceOffline: '{{name}} went offline',
    deviceOnline: '{{name}} came online',

    // Friend Notifications
    friendRequest: '{{name}} wants to connect',
    friendRequestAccepted: '{{name}} accepted your request',

    // Chat Notifications
    newMessage: 'New message from {{name}}',
    newGroupMessage: 'New message in {{group}}',

    // System Notifications
    updateAvailable: 'Update available',
    downloadComplete: 'Download complete',
    uploadComplete: 'Upload complete',

    // Error Notifications
    connectionError: 'Connection lost',
    encryptionError: 'Encryption error',
    storageError: 'Storage error',
    error: 'An error occurred',
    connectionLost: 'Connection lost',

    // Actions
    view: 'View',
    dismiss: 'Dismiss',
    openApp: 'Open App',
  },

  errors: {
    // Connection Errors
    connectionFailed: 'Connection failed',
    connectionTimeout: 'Connection timed out',
    timeout: 'Request timeout',
    connectionRefused: 'Connection refused',
    noInternet: 'No internet connection',
    natError: 'NAT traversal failed',

    // Transfer Errors
    transferFailed: 'Transfer failed',
    transferCancelled: 'Transfer was cancelled',
    fileNotFound: 'File not found',
    fileAccessDenied: 'Access denied',
    fileTooLarge: 'File is too large',
    fileTooBig: 'File is too large',
    insufficientStorage: 'Insufficient storage space',

    // Crypto Errors
    cryptoError: 'Encryption error',
    decryptionError: 'Decryption failed',
    keyGenerationError: 'Failed to generate encryption key',
    signatureVerificationError: 'Signature verification failed',

    // Device Errors
    deviceNotFound: 'Device not found',
    deviceOffline: 'Device is offline',
    deviceNotSupported: 'Device not supported',

    // Permission Errors
    cameraAccessDenied: 'Camera access denied',
    noCamera: 'Camera not available',
    micAccessDenied: 'Microphone access denied',
    storageAccessDenied: 'Storage access denied',
    noPermission: 'Permission denied',

    // Validation Errors
    invalidEmail: 'Invalid email address',
    invalidPassword: 'Invalid password',
    passwordMismatch: 'Passwords do not match',
    invalidRoomCode: 'Invalid room code',

    // Rate Limiting
    rateLimited: 'Too many requests. Please try again later.',

    // Unsupported
    unsupported: 'Feature not supported',

    // Generic Errors
    unknownError: 'An unknown error occurred',
    tryAgain: 'Please try again',
    contactSupport: 'Please contact support',

    // Error Messages with Details
    errorDetails: 'Error Details',
    errorCode: 'Error Code: {{code}}',
    errorMessage: 'Error: {{message}}',
  },

  a11y: {
    // Navigation
    skipToContent: 'Skip to main content',
    skipToNavigation: 'Skip to navigation',
    skipToFooter: 'Skip to footer',
    mainNavigation: 'Main navigation',
    mobileNavigation: 'Mobile navigation',

    // UI Elements
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    toggleTheme: 'Toggle theme',
    toggleLanguage: 'Toggle language',
    darkMode: 'Enable dark mode',
    lightMode: 'Enable light mode',
    expandMenu: 'Expand menu',
    collapseMenu: 'Collapse menu',

    // Dialogs and Modals
    closeDialog: 'Close dialog',
    dialogTitle: 'Dialog',
    confirmAction: 'Confirm action',
    confirmDelete: 'Confirm delete',

    // File Upload/Download
    dragFiles: 'Drag files here to upload',
    fileInput: 'File input',
    selectFile: 'Select file to upload',
    selectMultipleFiles: 'Select one or more files',
    selectedFiles: '{{count}} files selected',

    // Forms
    formError: 'Form error',
    requiredField: 'Required field',
    invalidInput: 'Invalid input',
    passwordStrength: 'Password strength indicator',

    // Lists and Tables
    sortable: 'Sortable',
    noResults: 'No results',
    loading: 'Loading',

    // Status Indicators
    online: 'Online',
    offline: 'Offline',
    away: 'Away',
    busy: 'Busy',

    // Notifications
    notification: 'Notification',
    alert: 'Alert',
    warning: 'Warning',
    success: 'Success',
    error: 'Error',
    info: 'Information',

    // Loading States
    loadingContent: 'Loading content',
    skeleton: 'Placeholder content',
    progress: 'Progress',

    // Animations
    reduceMotion: 'Reduce motion',
    pauseAnimation: 'Pause animation',
    resumeAnimation: 'Resume animation',

    // Real-time Features
    liveRegion: 'Live region',
    livePolite: 'Polite updates',
    liveAssertive: 'Important updates',

    // Keyboard Shortcuts
    keyboardShortcuts: 'Keyboard shortcuts',
    showShortcuts: 'Show keyboard shortcuts',
    hideShortcuts: 'Hide keyboard shortcuts',
    shortcut: 'Keyboard shortcut',

    // Focus Management
    focusTrapped: 'Focus is trapped in this element',
    focusRestored: 'Focus has been restored',

    // Screen Reader Announcements
    pageLoaded: 'Page loaded',
    navigationOpened: 'Navigation opened',
    navigationClosed: 'Navigation closed',
    modalOpened: 'Modal opened',
    modalClosed: 'Modal closed',
    menuOpened: 'Menu opened',
    menuClosed: 'Menu closed',
  },

  // Time and Date Formatting
  time: {
    now: 'now',
    minutesAgo: '{{count}}m ago',
    hoursAgo: '{{count}}h ago',
    daysAgo: '{{count}}d ago',
    weeksAgo: '{{count}}w ago',
    monthsAgo: '{{count}}mo ago',
    yearsAgo: '{{count}}y ago',
  },

  // File Size Formatting
  fileSize: {
    bytes: 'B',
    kilobytes: 'KB',
    megabytes: 'MB',
    gigabytes: 'GB',
    terabytes: 'TB',
  },

  // Speed Formatting
  speed: {
    bps: 'b/s',
    kbps: 'KB/s',
    mbps: 'MB/s',
    gbps: 'GB/s',
  },
} as const;
