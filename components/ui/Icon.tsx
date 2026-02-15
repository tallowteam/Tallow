'use client';

import { type SVGProps, type ReactElement, forwardRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Union of all registered icon names. Tree-shakeable when individual icon
 * components are imported directly; the `<Icon name="..." />` wrapper uses
 * this for autocomplete and compile-time validation.
 */
export type IconName =
  // Transfer
  | 'upload'
  | 'download'
  | 'folder'
  | 'file'
  | 'clipboard'
  | 'copy'
  | 'send'
  | 'share'
  | 'link'
  | 'external-link'
  | 'qr-code'
  // Status
  | 'check'
  | 'check-circle'
  | 'x'
  | 'alert-circle'
  | 'alert-triangle'
  | 'info'
  | 'help-circle'
  | 'loader'
  | 'activity'
  // Navigation
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'menu'
  | 'home'
  | 'search'
  | 'filter'
  | 'sort'
  // Security
  | 'lock'
  | 'shield'
  | 'shield-check'
  | 'key'
  | 'fingerprint'
  | 'eye'
  | 'eye-off'
  // Device / connectivity
  | 'wifi'
  | 'bluetooth'
  | 'globe'
  | 'server'
  | 'network'
  | 'monitor'
  | 'smartphone'
  | 'tablet'
  | 'laptop'
  // Actions
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'refresh-cw'
  | 'settings'
  | 'calendar'
  | 'clock'
  // Media
  | 'image'
  | 'video'
  | 'play'
  | 'pause'
  // Misc
  | 'sun'
  | 'moon'
  | 'contrast'
  | 'star'
  | 'star-filled'
  | 'bell'
  | 'mail'
  | 'code'
  | 'layers'
  | 'database'
  | 'user'
  | 'users'
  | 'message-circle'
  | 'more-vertical'
  | 'palette'
  | 'zap'
  | 'github'
  | 'logo'
  | 'map-pin';

/** Base props shared by every individual icon component. */
export interface IconComponentProps extends SVGProps<SVGSVGElement> {
  /** Pixel size applied to both width and height. Defaults to 24. */
  size?: number;
  /**
   * When provided, the icon is treated as meaningful/informative and receives
   * `role="img"` plus this value as `aria-label`. When omitted, the icon is
   * treated as decorative and receives `aria-hidden="true"`.
   */
  label?: string;
}

/** Props for the unified `<Icon />` component. */
export interface IconProps extends IconComponentProps {
  /** The registered icon name. */
  name: IconName;
}

// ---------------------------------------------------------------------------
// SVG wrapper (shared by every icon)
// ---------------------------------------------------------------------------

/**
 * Internal wrapper that standardizes the SVG element for every icon.
 * - 24x24 viewBox by default
 * - `currentColor` for stroke so icons inherit text color
 * - Decorative by default (`aria-hidden`), informative when `label` is set
 */
function SvgShell({
  size = 24,
  label,
  children,
  className,
  viewBox = '0 0 24 24',
  fill = 'none',
  ...rest
}: IconComponentProps & { children: React.ReactNode; viewBox?: string | undefined; fill?: string | undefined }) {
  const a11y: Record<string, string | boolean> = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': 'true' };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...a11y}
      {...rest}
    >
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Individual icon components (tree-shakeable named exports)
// ---------------------------------------------------------------------------

// -- Brand / Logo --

export function LogoIcon({ ...props }: IconComponentProps) {
  return (
    <SvgShell viewBox="0 0 32 32" {...props}>
      <path
        d="M16 2L4 8v8c0 7.732 5.268 14.936 12 17 6.732-2.064 12-9.268 12-17V8L16 2z"
        strokeWidth="2"
      />
      <path d="M12 16l2.5 2.5L20 13" strokeWidth="2" />
    </SvgShell>
  );
}

// -- Transfer --

export function UploadIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgShell>
  );
}

export function DownloadIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgShell>
  );
}

export function FolderIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </SvgShell>
  );
}

export function FileIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </SvgShell>
  );
}

export function ClipboardIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </SvgShell>
  );
}

export function CopyIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </SvgShell>
  );
}

export function SendIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </SvgShell>
  );
}

export function ShareIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </SvgShell>
  );
}

export function LinkIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </SvgShell>
  );
}

export function ExternalLinkIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </SvgShell>
  );
}

export function QrCodeIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="3" y="3" width="5" height="5" />
      <rect x="16" y="3" width="5" height="5" />
      <rect x="3" y="16" width="5" height="5" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </SvgShell>
  );
}

// -- Status --

export function CheckIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="20 6 9 17 4 12" />
    </SvgShell>
  );
}

export function CheckCircleIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </SvgShell>
  );
}

export function XIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgShell>
  );
}

export function AlertCircleIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </SvgShell>
  );
}

export function AlertTriangleIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </SvgShell>
  );
}

export function InfoIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </SvgShell>
  );
}

export function HelpCircleIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </SvgShell>
  );
}

export function LoaderIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </SvgShell>
  );
}

export function ActivityIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </SvgShell>
  );
}

// -- Navigation --

export function ArrowUpIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </SvgShell>
  );
}

export function ArrowDownIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </SvgShell>
  );
}

export function ArrowLeftIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </SvgShell>
  );
}

export function ArrowRightIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </SvgShell>
  );
}

export function ChevronUpIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="18 15 12 9 6 15" />
    </SvgShell>
  );
}

export function ChevronDownIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="6 9 12 15 18 9" />
    </SvgShell>
  );
}

export function ChevronLeftIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="15 18 9 12 15 6" />
    </SvgShell>
  );
}

export function ChevronRightIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="9 18 15 12 9 6" />
    </SvgShell>
  );
}

export function MenuIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </SvgShell>
  );
}

export function HomeIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </SvgShell>
  );
}

export function SearchIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SvgShell>
  );
}

export function FilterIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </SvgShell>
  );
}

export function SortIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="18" y2="12" />
      <line x1="3" y1="18" x2="15" y2="18" />
    </SvgShell>
  );
}

// -- Security --

export function LockIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgShell>
  );
}

export function ShieldIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </SvgShell>
  );
}

export function ShieldCheckIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </SvgShell>
  );
}

export function KeyIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </SvgShell>
  );
}

export function FingerprintIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2" />
    </SvgShell>
  );
}

export function EyeIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </SvgShell>
  );
}

export function EyeOffIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </SvgShell>
  );
}

// -- Device / Connectivity --

export function WifiIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </SvgShell>
  );
}

export function BluetoothIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
    </SvgShell>
  );
}

export function GlobeIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </SvgShell>
  );
}

export function ServerIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </SvgShell>
  );
}

export function NetworkIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </SvgShell>
  );
}

export function MonitorIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </SvgShell>
  );
}

export function SmartphoneIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </SvgShell>
  );
}

export function TabletIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </SvgShell>
  );
}

export function LaptopIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0l1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </SvgShell>
  );
}

// -- Actions --

export function PlusIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </SvgShell>
  );
}

export function MinusIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </SvgShell>
  );
}

export function EditIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </SvgShell>
  );
}

export function TrashIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgShell>
  );
}

export function RefreshCwIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </SvgShell>
  );
}

export function SettingsIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </SvgShell>
  );
}

export function CalendarIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </SvgShell>
  );
}

export function ClockIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </SvgShell>
  );
}

// -- Media --

export function ImageIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </SvgShell>
  );
}

export function VideoIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </SvgShell>
  );
}

export function PlayIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </SvgShell>
  );
}

export function PauseIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </SvgShell>
  );
}

// -- Misc --

export function SunIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </SvgShell>
  );
}

export function MoonIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </SvgShell>
  );
}

export function ContrastIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" fill="currentColor" />
    </SvgShell>
  );
}

export function StarIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </SvgShell>
  );
}

export function StarFilledIcon(props: IconComponentProps) {
  return (
    <SvgShell fill="currentColor" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </SvgShell>
  );
}

export function BellIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </SvgShell>
  );
}

export function MailIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </SvgShell>
  );
}

export function CodeIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </SvgShell>
  );
}

export function LayersIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </SvgShell>
  );
}

export function DatabaseIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </SvgShell>
  );
}

export function UserIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgShell>
  );
}

export function UsersIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgShell>
  );
}

export function MessageCircleIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </SvgShell>
  );
}

export function MoreVerticalIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </SvgShell>
  );
}

export function PaletteIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <circle cx="13.5" cy="6.5" r=".5" />
      <circle cx="17.5" cy="10.5" r=".5" />
      <circle cx="8.5" cy="7.5" r=".5" />
      <circle cx="6.5" cy="12.5" r=".5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </SvgShell>
  );
}

export function ZapIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </SvgShell>
  );
}

export function GithubIcon(props: IconComponentProps) {
  return (
    <SvgShell fill="currentColor" stroke="none" {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </SvgShell>
  );
}

export function MapPinIcon(props: IconComponentProps) {
  return (
    <SvgShell {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </SvgShell>
  );
}

// ---------------------------------------------------------------------------
// Icon registry (maps name -> component for the unified <Icon /> component)
// ---------------------------------------------------------------------------

const ICON_REGISTRY: Record<IconName, (props: IconComponentProps) => ReactElement> = {
  // Transfer
  'upload': UploadIcon,
  'download': DownloadIcon,
  'folder': FolderIcon,
  'file': FileIcon,
  'clipboard': ClipboardIcon,
  'copy': CopyIcon,
  'send': SendIcon,
  'share': ShareIcon,
  'link': LinkIcon,
  'external-link': ExternalLinkIcon,
  'qr-code': QrCodeIcon,
  // Status
  'check': CheckIcon,
  'check-circle': CheckCircleIcon,
  'x': XIcon,
  'alert-circle': AlertCircleIcon,
  'alert-triangle': AlertTriangleIcon,
  'info': InfoIcon,
  'help-circle': HelpCircleIcon,
  'loader': LoaderIcon,
  'activity': ActivityIcon,
  // Navigation
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'menu': MenuIcon,
  'home': HomeIcon,
  'search': SearchIcon,
  'filter': FilterIcon,
  'sort': SortIcon,
  // Security
  'lock': LockIcon,
  'shield': ShieldIcon,
  'shield-check': ShieldCheckIcon,
  'key': KeyIcon,
  'fingerprint': FingerprintIcon,
  'eye': EyeIcon,
  'eye-off': EyeOffIcon,
  // Device / connectivity
  'wifi': WifiIcon,
  'bluetooth': BluetoothIcon,
  'globe': GlobeIcon,
  'server': ServerIcon,
  'network': NetworkIcon,
  'monitor': MonitorIcon,
  'smartphone': SmartphoneIcon,
  'tablet': TabletIcon,
  'laptop': LaptopIcon,
  // Actions
  'plus': PlusIcon,
  'minus': MinusIcon,
  'edit': EditIcon,
  'trash': TrashIcon,
  'refresh-cw': RefreshCwIcon,
  'settings': SettingsIcon,
  'calendar': CalendarIcon,
  'clock': ClockIcon,
  // Media
  'image': ImageIcon,
  'video': VideoIcon,
  'play': PlayIcon,
  'pause': PauseIcon,
  // Misc
  'sun': SunIcon,
  'moon': MoonIcon,
  'contrast': ContrastIcon,
  'star': StarIcon,
  'star-filled': StarFilledIcon,
  'bell': BellIcon,
  'mail': MailIcon,
  'code': CodeIcon,
  'layers': LayersIcon,
  'database': DatabaseIcon,
  'user': UserIcon,
  'users': UsersIcon,
  'message-circle': MessageCircleIcon,
  'more-vertical': MoreVerticalIcon,
  'palette': PaletteIcon,
  'zap': ZapIcon,
  'github': GithubIcon,
  'logo': LogoIcon,
  'map-pin': MapPinIcon,
};

// ---------------------------------------------------------------------------
// Unified <Icon /> component
// ---------------------------------------------------------------------------

/**
 * Unified icon component. Renders any registered icon by name.
 *
 * @example
 * ```tsx
 * // Decorative (hidden from screen readers)
 * <Icon name="upload" size={24} />
 *
 * // Informative (announced by screen readers)
 * <Icon name="lock" size={16} label="Secure connection" />
 *
 * // Custom className and color
 * <Icon name="shield" className={styles.hero} />
 * ```
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(
  function Icon({ name, ...rest }, ref) {
    const IconComponent = ICON_REGISTRY[name];
    if (!IconComponent) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Icon] Unknown icon name: "${name}"`);
      }
      return null;
    }
    return <IconComponent ref={ref} {...rest} />;
  }
);

/**
 * Type guard to check if a string is a valid IconName.
 */
export function isValidIconName(name: string): name is IconName {
  return name in ICON_REGISTRY;
}

/**
 * Returns all registered icon names. Useful for storybook / icon gallery.
 */
export function getIconNames(): readonly IconName[] {
  return Object.keys(ICON_REGISTRY) as IconName[];
}
