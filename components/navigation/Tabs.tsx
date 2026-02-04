'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  variant?: 'default' | 'pills';
}

/**
 * Tabs - Tab navigation component with smooth animations
 *
 * Features:
 * - Controlled and uncontrolled modes
 * - Horizontal tab layout
 * - Icon support
 * - Active indicator animation
 * - Keyboard navigation (Arrow keys)
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { id: 'tab1', label: 'Overview', icon: <Icon /> },
 *     { id: 'tab2', label: 'Settings' }
 *   ]}
 *   defaultValue="tab1"
 * />
 * ```
 */
export function Tabs({
  items,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className = '',
  variant = 'default',
}: TabsProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.id || '');
  const activeValue = isControlled ? controlledValue : internalValue;

  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const handleTabChange = (id: string) => {
    if (!isControlled) {
      setInternalValue(id);
    }
    onValueChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    // Skip disabled tabs
    while (items[nextIndex]?.disabled) {
      if (e.key === 'ArrowLeft' || e.key === 'End') {
        nextIndex = nextIndex > 0 ? nextIndex - 1 : items.length - 1;
      } else {
        nextIndex = nextIndex < items.length - 1 ? nextIndex + 1 : 0;
      }
      if (nextIndex === currentIndex) break; // Prevent infinite loop
    }

    const nextTab = items[nextIndex];
    if (nextTab && !nextTab.disabled) {
      handleTabChange(nextTab.id);
      // Focus the next tab
      const tabElements = tabsRef.current?.querySelectorAll('[role="tab"]');
      if (tabElements) {
        (tabElements[nextIndex] as HTMLElement)?.focus();
      }
    }
  };

  // Update indicator position
  useEffect(() => {
    if (!tabsRef.current) return;

    const activeIndex = items.findIndex(item => item.id === activeValue);
    const tabElements = tabsRef.current.querySelectorAll('[role="tab"]');
    const activeTab = tabElements[activeIndex] as HTMLElement;

    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeValue, items]);

  const baseTabClasses = variant === 'pills'
    ? 'px-4 py-2 rounded-lg transition-colors duration-200'
    : 'px-4 py-3 transition-colors duration-200';

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={tabsRef}
        role="tablist"
        className={`relative flex ${variant === 'pills' ? 'gap-2 p-1 bg-zinc-900 rounded-xl' : 'border-b border-zinc-800'}`}
      >
        {variant === 'default' && (
          <div
            className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-out"
            style={indicatorStyle}
            aria-hidden="true"
          />
        )}

        {items.map((item, index) => {
          const isActive = item.id === activeValue;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${item.id}`}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              onClick={() => !isDisabled && handleTabChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                ${baseTabClasses}
                flex items-center gap-2 font-medium text-sm
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
                ${isActive
                  ? variant === 'pills'
                    ? 'bg-black text-white'
                    : 'text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                relative z-10
              `}
            >
              {item.icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          id={`tabpanel-${item.id}`}
          role="tabpanel"
          aria-labelledby={item.id}
          hidden={item.id !== activeValue}
          className="mt-6"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
