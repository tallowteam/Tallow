'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: 'item' | 'divider';
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
}

/**
 * Dropdown - Dropdown menu component with keyboard navigation
 *
 * Features:
 * - Custom trigger element
 * - Menu items with icons
 * - Dividers
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click outside to close
 * - Focus management
 * - ARIA compliant
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<button>Menu</button>}
 *   items={[
 *     { id: '1', label: 'Edit', icon: <Icon />, onClick: handleEdit },
 *     { id: 'divider', type: 'divider' },
 *     { id: '2', label: 'Delete', danger: true, onClick: handleDelete }
 *   ]}
 * />
 * ```
 */
export function Dropdown({
  trigger,
  items,
  align = 'left',
  className = '',
  menuClassName = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Get all non-divider, non-disabled items
  const actionableItems = items.filter(
    item => item.type !== 'divider' && !item.disabled
  );

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < actionableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : actionableItems.length - 1
        );
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(actionableItems.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < actionableItems.length) {
          handleItemClick(actionableItems[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      case 'Tab':
        closeDropdown();
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && menuRef.current) {
      const menuItems = menuRef.current.querySelectorAll('[role="menuitem"]');
      const focusedElement = menuItems[focusedIndex] as HTMLElement;
      focusedElement?.focus();
    }
  }, [focusedIndex, isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
      >
        {trigger}
      </button>

      {/* Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`
            absolute z-50 mt-2 min-w-[200px] rounded-xl
            bg-zinc-900 border border-zinc-800 shadow-xl
            py-2 overflow-hidden
            ${align === 'right' ? 'right-0' : 'left-0'}
            ${menuClassName}
          `}
          style={{
            animation: 'fadeIn 150ms ease-out',
          }}
        >
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={item.id}
                  role="separator"
                  className="my-2 border-t border-zinc-800"
                  aria-hidden="true"
                />
              );
            }

            const actionableIndex = actionableItems.findIndex(
              ai => ai.id === item.id
            );
            const isFocused = actionableIndex === focusedIndex;

            return (
              <button
                key={item.id}
                role="menuitem"
                tabIndex={isFocused ? 0 : -1}
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => setFocusedIndex(actionableIndex)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2 text-sm text-left
                  transition-colors duration-150
                  focus:outline-none
                  ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : item.danger
                      ? 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
                      : 'text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800'
                  }
                  ${isFocused ? 'bg-zinc-800' : ''}
                `}
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-5 h-5" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
