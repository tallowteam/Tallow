/**
 * Test ID Constants
 * Centralized test IDs for component testing
 */

export const TEST_IDS = {
  // Layout Components
  HEADER: 'header',
  FOOTER: 'footer',
  MOBILE_NAV: 'mobile-nav',
  MOBILE_NAV_TOGGLE: 'mobile-nav-toggle',
  CONTAINER: 'container',
  SECTION: 'section',
  GRID: 'grid',
  STACK: 'stack',

  // Navigation Components
  NAV_LINK: 'nav-link',
  BREADCRUMB: 'breadcrumb',
  BREADCRUMB_ITEM: 'breadcrumb-item',
  TABS: 'tabs',
  TAB: 'tab',
  TAB_PANEL: 'tab-panel',
  PAGINATION: 'pagination',
  PAGINATION_ITEM: 'pagination-item',
  DROPDOWN: 'dropdown',
  DROPDOWN_TRIGGER: 'dropdown-trigger',
  DROPDOWN_MENU: 'dropdown-menu',
  DROPDOWN_ITEM: 'dropdown-item',
  SIDEBAR: 'sidebar',
  SIDEBAR_TOGGLE: 'sidebar-toggle',

  // UI Components
  BUTTON: 'button',
  BUTTON_LOADING: 'button-loading',
  INPUT: 'input',
  INPUT_ERROR: 'input-error',
  CARD: 'card',
  CARD_HEADER: 'card-header',
  CARD_BODY: 'card-body',
  CARD_FOOTER: 'card-footer',
  BADGE: 'badge',
  TOOLTIP: 'tooltip',
  TOOLTIP_TRIGGER: 'tooltip-trigger',
  TOOLTIP_CONTENT: 'tooltip-content',
  SPINNER: 'spinner',
  MODAL: 'modal',
  MODAL_OVERLAY: 'modal-overlay',
  MODAL_CONTENT: 'modal-content',
  MODAL_CLOSE: 'modal-close',

  // Form Components
  SELECT: 'select',
  SELECT_TRIGGER: 'select-trigger',
  SELECT_OPTION: 'select-option',
  FORM: 'form',
  FORM_FIELD: 'form-field',
  FORM_LABEL: 'form-label',
  FORM_ERROR: 'form-error',

  // Feedback Components
  TOAST: 'toast',
  TOAST_CLOSE: 'toast-close',
  TOAST_CONTAINER: 'toast-container',
  ALERT: 'alert',
  ALERT_CLOSE: 'alert-close',

  // App Components
  TRANSFER_ZONE: 'transfer-zone',
  TRANSFER_PROGRESS: 'transfer-progress',
  TRANSFER_COMPLETE: 'transfer-complete',
  DEVICE_LIST: 'device-list',
  DEVICE_CARD: 'device-card',
  CONNECTION_PANEL: 'connection-panel',
  SECURITY_BADGE: 'security-badge',
  STATUS_INDICATOR: 'status-indicator',

  // Section Components
  HERO: 'hero',
  FEATURES: 'features',
  FEATURE_CARD: 'feature-card',
  HOW_IT_WORKS: 'how-it-works',
  SECURITY: 'security',
  STATS: 'stats',
  STAT_ITEM: 'stat-item',
  TESTIMONIALS: 'testimonials',
  TESTIMONIAL_CARD: 'testimonial-card',
  CTA: 'cta',

  // Effect Components
  FADE_IN: 'fade-in',
  COUNTER: 'counter',
  TYPEWRITER: 'typewriter',
  GRADIENT_TEXT: 'gradient-text',
  GLOW_EFFECT: 'glow-effect',
  SPOTLIGHT: 'spotlight',
  GRID_PATTERN: 'grid-pattern',

  // Illustration Components
  SECURE_TRANSFER_ILLUSTRATION: 'secure-transfer-illustration',
  P2P_CONNECTION_ILLUSTRATION: 'p2p-connection-illustration',
  QUANTUM_SAFE_ILLUSTRATION: 'quantum-safe-illustration',
} as const;

export type TestId = typeof TEST_IDS[keyof typeof TEST_IDS];
