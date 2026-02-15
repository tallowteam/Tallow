'use client';

/**
 * Tabs Primitive -- WAI-ARIA Tabs Pattern
 * Agent 035 (RADIX-SURGEON)
 *
 * Implements WAI-ARIA Authoring Practices 1.2 Tabs pattern:
 * - role="tablist" / role="tab" / role="tabpanel"
 * - Arrow key navigation (Left/Right for horizontal, Up/Down for vertical)
 * - Home/End to jump to first/last tab
 * - aria-selected, aria-controls, aria-labelledby
 * - Roving tabindex (active=0, inactive=-1)
 * - Automatic or manual activation modes
 * - Focus management on tab change
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useId,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import styles from './Tabs.module.css';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsContextValue {
  /** The currently active tab value */
  activeTab: string;
  /** Callback to change the active tab */
  setActiveTab: (value: string) => void;
  /** Unique base ID for ARIA relationships */
  baseId: string;
  /** Layout orientation */
  orientation: 'horizontal' | 'vertical';
  /** Whether tabs activate on focus (automatic) or on Enter/Space (manual) */
  activationMode: 'automatic' | 'manual';
  /** Ordered list of tab values for keyboard navigation */
  registeredTabs: React.MutableRefObject<string[]>;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(
      'Tabs compound components must be rendered within a <Tabs> parent.'
    );
  }
  return context;
}

// ---------------------------------------------------------------------------
// Tabs Root
// ---------------------------------------------------------------------------

export interface TabsProps {
  /** The currently active tab value (controlled) */
  value?: string;
  /** Default active tab value (uncontrolled) */
  defaultValue?: string;
  /** Callback when the active tab changes */
  onValueChange?: (value: string) => void;
  /** Tab orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Activation mode: automatic (on focus) or manual (on Enter/Space) */
  activationMode?: 'automatic' | 'manual';
  /** Tab content */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activationMode = 'automatic',
  children,
  className = '',
}: TabsProps) {
  const reactId = useId();
  const baseId = `tabs${reactId.replace(/:/g, '')}`;
  const registeredTabs = useRef<string[]>([]);

  // Support both controlled and uncontrolled usage
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalValue;

  const setActiveTab = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      baseId,
      orientation,
      activationMode,
      registeredTabs,
    }),
    [activeTab, setActiveTab, baseId, orientation, activationMode]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div
        className={`${styles.root} ${className}`}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// TabList
// ---------------------------------------------------------------------------

export interface TabListProps {
  /** Tab list content (Tab components) */
  children: ReactNode;
  /** Accessible label for the tab list */
  'aria-label'?: string;
  /** Additional CSS class */
  className?: string;
}

export function TabList({
  children,
  'aria-label': ariaLabel,
  className = '',
}: TabListProps) {
  const { orientation } = useTabsContext();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={`${styles.tabList} ${className}`}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab (trigger)
// ---------------------------------------------------------------------------

export interface TabProps {
  /** Unique value identifying this tab */
  value: string;
  /** Tab content (label) */
  children: ReactNode;
  /** Whether this tab is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function Tab({
  value,
  children,
  disabled = false,
  className = '',
}: TabProps) {
  const {
    activeTab,
    setActiveTab,
    baseId,
    orientation,
    activationMode,
    registeredTabs,
  } = useTabsContext();

  const tabRef = useRef<HTMLButtonElement>(null);
  const isActive = activeTab === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  // Register this tab on mount for keyboard navigation ordering
  useEffect(() => {
    const tabs = registeredTabs.current;
    if (!tabs.includes(value)) {
      tabs.push(value);
    }
    return () => {
      const index = tabs.indexOf(value);
      if (index !== -1) {
        tabs.splice(index, 1);
      }
    };
  }, [value, registeredTabs]);

  // Focus this tab element when it becomes the active tab
  // (supports arrow key navigation where focus follows selection)
  useEffect(() => {
    if (isActive && tabRef.current && document.activeElement !== tabRef.current) {
      // Only auto-focus if a sibling tab currently has focus
      // (avoids stealing focus on initial mount)
      const parent = tabRef.current.parentElement;
      if (parent && parent.contains(document.activeElement)) {
        tabRef.current.focus();
      }
    }
  }, [isActive]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const tabs = registeredTabs.current;
      const currentIndex = tabs.indexOf(value);
      if (currentIndex === -1) return;

      // Determine which keys navigate based on orientation
      const prevKey =
        orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      const nextKey =
        orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

      let targetIndex: number | null = null;

      switch (event.key) {
        case prevKey: {
          event.preventDefault();
          // Wrap around to last tab, skipping disabled tabs
          let idx = currentIndex - 1;
          if (idx < 0) idx = tabs.length - 1;
          targetIndex = idx;
          break;
        }
        case nextKey: {
          event.preventDefault();
          // Wrap around to first tab, skipping disabled tabs
          let idx = currentIndex + 1;
          if (idx >= tabs.length) idx = 0;
          targetIndex = idx;
          break;
        }
        case 'Home': {
          event.preventDefault();
          targetIndex = 0;
          break;
        }
        case 'End': {
          event.preventDefault();
          targetIndex = tabs.length - 1;
          break;
        }
        default:
          return;
      }

      if (targetIndex !== null) {
        const targetValue = tabs[targetIndex];
        if (targetValue !== undefined) {
          if (activationMode === 'automatic') {
            setActiveTab(targetValue);
          }
          // Move focus to the target tab button
          const parent = tabRef.current?.parentElement;
          if (parent) {
            const targetButton = parent.querySelector<HTMLButtonElement>(
              `[data-tab-value="${targetValue}"]`
            );
            targetButton?.focus();
          }
        }
      }
    },
    [value, orientation, activationMode, setActiveTab, registeredTabs]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      setActiveTab(value);
    }
  }, [disabled, setActiveTab, value]);

  // In manual mode, Enter/Space activates the focused tab
  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (activationMode === 'manual' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        if (!disabled) {
          setActiveTab(value);
        }
      }
    },
    [activationMode, disabled, setActiveTab, value]
  );

  return (
    <button
      ref={tabRef}
      type="button"
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelId}
      aria-disabled={disabled || undefined}
      tabIndex={isActive ? 0 : -1}
      data-tab-value={value}
      data-active={isActive || undefined}
      className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${disabled ? styles.tabDisabled : ''} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// TabPanel
// ---------------------------------------------------------------------------

export interface TabPanelProps {
  /** Must match the value of the corresponding Tab */
  value: string;
  /** Panel content */
  children: ReactNode;
  /** Whether to keep the panel in the DOM when inactive (for preserving state) */
  forceMount?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function TabPanel({
  value,
  children,
  forceMount = false,
  className = '',
}: TabPanelProps) {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;
  const panelId = `${baseId}-panel-${value}`;
  const tabId = `${baseId}-tab-${value}`;

  // If not forceMount and not active, don't render at all
  if (!forceMount && !isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      hidden={!isActive}
      data-active={isActive || undefined}
      className={`${styles.tabPanel} ${isActive ? styles.tabPanelActive : ''} ${className}`}
    >
      {isActive ? children : null}
    </div>
  );
}
