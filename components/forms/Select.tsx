'use client';

import {
  forwardRef,
  SelectHTMLAttributes,
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ReactNode,
} from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  customRender?: (option: SelectOption) => ReactNode;
  onChange?: (value: string | string[]) => void;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder = 'Select an option',
      searchable = false,
      multiple = false,
      customRender,
      onChange,
      fullWidth = false,
      disabled = false,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedValues, setSelectedValues] = useState<string[]>(
      multiple
        ? Array.isArray(value)
          ? value
          : value
          ? [value as string]
          : []
        : value
        ? [value as string]
        : []
    );
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const selectRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const filteredOptions = searchable
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current &&
          !selectRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    useEffect(() => {
      if (isOpen && optionsRef.current) {
        const highlightedElement = optionsRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        setSearchTerm('');
      }
    };

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;

      let newSelectedValues: string[];

      if (multiple) {
        newSelectedValues = selectedValues.includes(option.value)
          ? selectedValues.filter((v) => v !== option.value)
          : [...selectedValues, option.value];
        setSelectedValues(newSelectedValues);
      } else {
        newSelectedValues = [option.value];
        setSelectedValues(newSelectedValues);
        setIsOpen(false);
        setSearchTerm('');
      }

      onChange?.(multiple ? newSelectedValues : newSelectedValues[0]);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isOpen && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          } else {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
      }
    };

    const getDisplayValue = () => {
      if (selectedValues.length === 0) return placeholder;

      const selectedOptions = options.filter((opt) =>
        selectedValues.includes(opt.value)
      );

      if (multiple) {
        return selectedOptions.map((opt) => opt.label).join(', ');
      }

      return selectedOptions[0]?.label || placeholder;
    };

    const wrapperClasses = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ');

    const triggerClasses = [
      styles.trigger,
      isOpen ? styles.open : '',
      hasError ? styles.error : '',
      disabled ? styles.disabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses} ref={ref}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div
          ref={selectRef}
          className={styles.selectContainer}
          onKeyDown={handleKeyDown}
        >
          <button
            type="button"
            id={selectId}
            className={triggerClasses}
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby={label ? `${selectId}-label` : undefined}
            aria-invalid={hasError}
          >
            <span className={styles.value}>{getDisplayValue()}</span>
            <svg
              className={styles.chevron}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && (
            <div className={styles.dropdown} role="listbox">
              {searchable && (
                <div className={styles.searchWrapper}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Search options"
                  />
                  <svg
                    className={styles.searchIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 14L10.5 10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              <div className={styles.options} ref={optionsRef}>
                {filteredOptions.length === 0 ? (
                  <div className={styles.noOptions}>No options found</div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value);
                    const isHighlighted = index === highlightedIndex;

                    const optionClasses = [
                      styles.option,
                      isSelected ? styles.selected : '',
                      isHighlighted ? styles.highlighted : '',
                      option.disabled ? styles.optionDisabled : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <div
                        key={option.value}
                        className={optionClasses}
                        onClick={() => handleSelect(option)}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                      >
                        {customRender ? (
                          customRender(option)
                        ) : (
                          <>
                            {option.icon && (
                              <span className={styles.optionIcon}>
                                {option.icon}
                              </span>
                            )}
                            <span className={styles.optionLabel}>
                              {option.label}
                            </span>
                            {multiple && isSelected && (
                              <svg
                                className={styles.checkIcon}
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M13.3333 4L6 11.3333L2.66666 8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className={styles.helperText}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
