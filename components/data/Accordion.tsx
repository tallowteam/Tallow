'use client';

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import styles from './Accordion.module.css';

export interface AccordionItem {
  id: string;
  trigger: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  type?: 'single' | 'multiple';
  defaultOpen?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      type = 'single',
      defaultOpen,
      onValueChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const [openItems, setOpenItems] = useState<Set<string>>(() => {
      if (defaultOpen) {
        return new Set(
          Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]
        );
      }
      return new Set();
    });

    useEffect(() => {
      if (type === 'single') {
        onValueChange?.(Array.from(openItems)[0] || '');
      } else {
        onValueChange?.(Array.from(openItems));
      }
    }, [openItems, type, onValueChange]);

    const handleToggle = (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item?.disabled) return;

      setOpenItems((prev) => {
        const next = new Set(prev);

        if (type === 'single') {
          if (next.has(id)) {
            next.clear();
          } else {
            next.clear();
            next.add(id);
          }
        } else {
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        }

        return next;
      });
    };

    return (
      <div ref={ref} className={`${styles.accordion} ${className}`} {...props}>
        {items.map((item) => {
          const isOpen = openItems.has(item.id);

          return (
            <div
              key={item.id}
              className={`${styles.item} ${item.disabled ? styles.disabled : ''}`}
            >
              <button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={() => handleToggle(item.id)}
                disabled={item.disabled}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${item.id}`}
                id={`accordion-trigger-${item.id}`}
              >
                <span className={styles.triggerContent}>{item.trigger}</span>
                <svg
                  className={styles.icon}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div
                id={`accordion-content-${item.id}`}
                className={`${styles.content} ${isOpen ? styles.contentOpen : ''}`}
                aria-labelledby={`accordion-trigger-${item.id}`}
                role="region"
              >
                <div className={styles.contentInner}>{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';
