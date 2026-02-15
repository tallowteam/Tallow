/**
 * Device Detection Utilities
 * Advanced detection for input methods, device types, and capabilities
 */

export type InputMethod = 'touch' | 'stylus' | 'mouse' | 'remote' | 'hybrid';
export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'tv';
export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export interface DeviceCapabilities {
  hasTouch: boolean;
  hasMouse: boolean;
  hasStylus: boolean;
  hasKeyboard: boolean;
  hasGamepad: boolean;
  supportsHover: boolean;
  supportsPointerCoarse: boolean;
  supportsPointerFine: boolean;
  isHighDPI: boolean;
  pixelRatio: number;
}

export interface DeviceInfo {
  inputMethod: InputMethod;
  deviceType: DeviceType;
  platform: Platform;
  capabilities: DeviceCapabilities;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  isOnline: boolean;
  connectionType?: string | undefined;
}

interface ExperimentalNetworkConnection {
  effectiveType?: string;
}

interface NavigatorWithExperimentalConnections extends Navigator {
  connection?: ExperimentalNetworkConnection;
  mozConnection?: ExperimentalNetworkConnection;
  webkitConnection?: ExperimentalNetworkConnection;
  standalone?: boolean;
}

/**
 * Check if device has touch capabilities
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {return false;}
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
}

/**
 * Check if device has mouse/trackpad
 */
export function hasMouseInput(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(pointer: fine) and (hover: hover)').matches;
}

/**
 * Check if device has stylus input
 */
export function hasStylusInput(): boolean {
  if (typeof window === 'undefined') {return false;}
  // Stylus typically has fine pointer but no hover
  return window.matchMedia('(pointer: fine) and (hover: none)').matches;
}

/**
 * Check if device supports hover interactions
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Check if device has high DPI display (Retina)
 */
export function isHighDPI(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.devicePixelRatio >= 2;
}

/**
 * Get device pixel ratio
 */
export function getPixelRatio(): number {
  if (typeof window === 'undefined') {return 1;}
  return window.devicePixelRatio || 1;
}

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {return 'unknown';}

  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {return 'ios';}
  if (/android/.test(ua)) {return 'android';}
  if (/win/.test(ua)) {return 'windows';}
  if (/mac/.test(ua)) {return 'macos';}
  if (/linux/.test(ua)) {return 'linux';}

  return 'unknown';
}

/**
 * Detect primary input method
 */
export function detectInputMethod(): InputMethod {
  if (typeof window === 'undefined') {return 'mouse';}

  const width = window.innerWidth;

  // TV detection (large screen + no touch)
  if (width >= 1920 && !isTouchDevice()) {
    return 'remote';
  }

  // Stylus detection
  if (hasStylusInput()) {
    return 'stylus';
  }

  // Touch detection
  if (isTouchDevice()) {
    // Hybrid devices (touch + mouse)
    if (hasMouseInput()) {
      return 'hybrid';
    }
    return 'touch';
  }

  // Default to mouse
  return 'mouse';
}

/**
 * Detect device type
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') {return 'desktop';}

  const width = window.innerWidth;
  const isTouch = isTouchDevice();

  // TV: Very large screen, no touch
  if (width >= 1920 && !isTouch) {
    return 'tv';
  }

  // Phone: Small screen, touch
  if (width < 768 && isTouch) {
    return 'phone';
  }

  // Tablet: Medium screen, touch
  if (width >= 768 && width < 1024 && isTouch) {
    return 'tablet';
  }

  // Laptop: Medium screen, mouse
  if (width >= 1024 && width < 1920) {
    return 'laptop';
  }

  // Desktop: Large screen, mouse
  return 'desktop';
}

/**
 * Get device capabilities
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      hasTouch: false,
      hasMouse: false,
      hasStylus: false,
      hasKeyboard: false,
      hasGamepad: false,
      supportsHover: false,
      supportsPointerCoarse: false,
      supportsPointerFine: false,
      isHighDPI: false,
      pixelRatio: 1,
    };
  }

  return {
    hasTouch: isTouchDevice(),
    hasMouse: hasMouseInput(),
    hasStylus: hasStylusInput(),
    hasKeyboard: true, // Assume keyboard is available
    hasGamepad: navigator.getGamepads !== undefined,
    supportsHover: supportsHover(),
    supportsPointerCoarse: window.matchMedia('(pointer: coarse)').matches,
    supportsPointerFine: window.matchMedia('(pointer: fine)').matches,
    isHighDPI: isHighDPI(),
    pixelRatio: getPixelRatio(),
  };
}

/**
 * Get screen orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') {return 'landscape';}
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {return true;}
  return navigator.onLine;
}

/**
 * Get network connection type (if available)
 */
export function getConnectionType(): string | undefined {
  if (typeof navigator === 'undefined') {return undefined;}

  const experimentalNavigator = navigator as NavigatorWithExperimentalConnections;
  const connection =
    experimentalNavigator.connection ||
    experimentalNavigator.mozConnection ||
    experimentalNavigator.webkitConnection;

  if (connection && connection.effectiveType) {
    return connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
  }

  return undefined;
}

/**
 * Get comprehensive device info
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      inputMethod: 'mouse',
      deviceType: 'desktop',
      platform: 'unknown',
      capabilities: getDeviceCapabilities(),
      screenWidth: 1920,
      screenHeight: 1080,
      orientation: 'landscape',
      isOnline: true,
    };
  }

  return {
    inputMethod: detectInputMethod(),
    deviceType: detectDeviceType(),
    platform: detectPlatform(),
    capabilities: getDeviceCapabilities(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: getOrientation(),
    isOnline: isOnline(),
    connectionType: getConnectionType(),
  };
}

/**
 * Check if device is likely a TV
 */
export function isTV(): boolean {
  if (typeof window === 'undefined') {return false;}

  const width = window.innerWidth;
  const isTouch = isTouchDevice();

  // TV: Very large screen (1920px+), no touch, landscape orientation
  return width >= 1920 && !isTouch && getOrientation() === 'landscape';
}

/**
 * Check if device is in standalone PWA mode
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') {return false;}

  const experimentalNavigator = window.navigator as NavigatorWithExperimentalConnections;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    experimentalNavigator.standalone === true
  );
}

/**
 * Check if device supports vibration
 */
export function supportsVibration(): boolean {
  if (typeof navigator === 'undefined') {return false;}
  return 'vibrate' in navigator;
}

/**
 * Check if device is in dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get safe area insets (for devices with notches)
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  };
}

/**
 * Get viewport dimensions accounting for browser chrome
 */
export function getViewportDimensions(): {
  width: number;
  height: number;
  availableHeight: number;
} {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080, availableHeight: 1080 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
    availableHeight: window.visualViewport?.height || window.innerHeight,
  };
}

/**
 * Detect if device has notch/dynamic island
 */
export function hasNotch(): boolean {
  if (typeof window === 'undefined') {return false;}

  const safeAreaInsets = getSafeAreaInsets();
  return safeAreaInsets.top > 20 || safeAreaInsets.bottom > 20;
}

/**
 * Get optimal touch target size based on device
 */
export function getOptimalTouchTargetSize(): number {
  const deviceType = detectDeviceType();

  const sizeMap: Record<DeviceType, number> = {
    phone: 44,    // iOS minimum
    tablet: 48,   // Slightly larger for tablets
    laptop: 40,   // Smaller for mouse precision
    desktop: 36,  // Smallest for desktop
    tv: 80,       // Extra large for TV remotes
  };

  return sizeMap[deviceType];
}

/**
 * Export all utilities as a single object
 */
export const deviceDetection = {
  isTouchDevice,
  hasMouseInput,
  hasStylusInput,
  supportsHover,
  isHighDPI,
  getPixelRatio,
  detectPlatform,
  detectInputMethod,
  detectDeviceType,
  getDeviceCapabilities,
  getOrientation,
  isOnline,
  getConnectionType,
  getDeviceInfo,
  isTV,
  isPWA,
  supportsVibration,
  prefersDarkMode,
  prefersReducedMotion,
  getSafeAreaInsets,
  getViewportDimensions,
  hasNotch,
  getOptimalTouchTargetSize,
};
