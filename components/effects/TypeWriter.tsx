/**
 * TypeWriter Component
 *
 * Character-by-character typing animation with cursor.
 * Configurable speed and behavior.
 */

'use client';

import { useEffect, useState, useCallback, CSSProperties } from 'react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';

export interface TypeWriterProps {
  /**
   * Text to type
   */
  text: string | string[];

  /**
   * Typing speed in milliseconds per character
   * @default 50
   */
  speed?: number;

  /**
   * Delay before starting (ms)
   * @default 0
   */
  startDelay?: number;

  /**
   * Show blinking cursor
   * @default true
   */
  cursor?: boolean;

  /**
   * Cursor character
   * @default '|'
   */
  cursorChar?: string;

  /**
   * Cursor blink speed (ms)
   * @default 530
   */
  cursorBlinkSpeed?: number;

  /**
   * Loop through text array
   * @default false
   */
  loop?: boolean;

  /**
   * Delay between loops (ms)
   * @default 1000
   */
  loopDelay?: number;

  /**
   * Delete text after typing (for loops)
   * @default true
   */
  deleteAfterTyping?: boolean;

  /**
   * Delete speed in ms per character
   * @default 30
   */
  deleteSpeed?: number;

  /**
   * Callback when typing is complete
   */
  onComplete?: () => void;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: CSSProperties;

  /**
   * Element tag to render
   * @default 'span'
   */
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * TypeWriter component with character-by-character animation
 *
 * @example
 * ```tsx
 * <TypeWriter
 *   text="Welcome to Tallow"
 *   speed={50}
 *   cursor
 * />
 * ```
 */
export function TypeWriter({
  text,
  speed = 50,
  startDelay = 0,
  cursor = true,
  cursorChar = '|',
  cursorBlinkSpeed = 530,
  loop = false,
  loopDelay = 1000,
  deleteAfterTyping = true,
  deleteSpeed = 30,
  onComplete,
  className = '',
  style = {},
  as: Component = 'span',
}: TypeWriterProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[currentTextIndex] || '';

  // If reduced motion, show full text immediately
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(currentText);
      onComplete?.();
    }
  }, [prefersReducedMotion, currentText, onComplete]);

  // Typing effect
  useEffect(() => {
    if (prefersReducedMotion) return;

    let timeout: NodeJS.Timeout;

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        if (currentIndex < currentText.length) {
          timeout = setTimeout(() => {
            setDisplayText(currentText.slice(0, currentIndex + 1));
            setCurrentIndex((prev) => prev + 1);
          }, speed);
        } else {
          // Finished typing
          onComplete?.();

          if (loop) {
            if (deleteAfterTyping) {
              // Start deleting after delay
              timeout = setTimeout(() => {
                setIsDeleting(true);
              }, loopDelay);
            } else {
              // Move to next text
              timeout = setTimeout(() => {
                setCurrentIndex(0);
                setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
              }, loopDelay);
            }
          }
        }
      } else {
        // Deleting backward
        if (currentIndex > 0) {
          timeout = setTimeout(() => {
            setDisplayText(currentText.slice(0, currentIndex - 1));
            setCurrentIndex((prev) => prev - 1);
          }, deleteSpeed);
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
        }
      }
    };

    // Start after initial delay
    if (currentIndex === 0 && !isDeleting) {
      timeout = setTimeout(handleTyping, startDelay);
    } else {
      handleTyping();
    }

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    currentText,
    speed,
    deleteSpeed,
    loop,
    loopDelay,
    deleteAfterTyping,
    isDeleting,
    startDelay,
    onComplete,
    prefersReducedMotion,
    textArray.length,
  ]);

  // Cursor blink effect
  useEffect(() => {
    if (!cursor || prefersReducedMotion) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, cursorBlinkSpeed);

    return () => clearInterval(interval);
  }, [cursor, cursorBlinkSpeed, prefersReducedMotion]);

  const cursorStyles: CSSProperties = {
    opacity: showCursor ? 1 : 0,
    transition: 'opacity 0.1s',
  };

  return (
    <Component className={className} style={style}>
      {displayText}
      {cursor && !prefersReducedMotion && (
        <span style={cursorStyles}>{cursorChar}</span>
      )}
    </Component>
  );
}

/**
 * Multi-line typewriter effect
 *
 * @example
 * ```tsx
 * <MultiLineTypeWriter
 *   lines={['Line 1', 'Line 2', 'Line 3']}
 *   speed={50}
 * />
 * ```
 */
export function MultiLineTypeWriter({
  lines,
  speed = 50,
  lineDelay = 500,
  className = '',
  style = {},
}: {
  lines: string[];
  speed?: number;
  lineDelay?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [visibleLines, setVisibleLines] = useState<number>(
    prefersReducedMotion ? lines.length : 0
  );

  const handleComplete = useCallback(() => {
    if (visibleLines < lines.length) {
      setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
      }, lineDelay);
    }
  }, [visibleLines, lines.length, lineDelay]);

  const containerStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    ...style,
  };

  return (
    <div className={className} style={containerStyles}>
      {lines.slice(0, visibleLines + 1).map((line, index) => (
        <TypeWriter
          key={index}
          text={line}
          speed={speed}
          cursor={index === visibleLines}
          {...(index === visibleLines && { onComplete: handleComplete })}
        />
      ))}
    </div>
  );
}

/**
 * Typewriter with multiple text rotation
 *
 * @example
 * ```tsx
 * <RotatingTypeWriter
 *   texts={['Fast', 'Secure', 'Private']}
 *   prefix="Tallow is "
 * />
 * ```
 */
export function RotatingTypeWriter({
  texts,
  prefix = '',
  suffix = '',
  speed = 50,
  deleteSpeed = 30,
  pauseDuration = 2000,
  className = '',
  style = {},
}: {
  texts: string[];
  prefix?: string;
  suffix?: string;
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      {prefix}
      <TypeWriter
        text={texts}
        speed={speed}
        deleteSpeed={deleteSpeed}
        loop
        loopDelay={pauseDuration}
        deleteAfterTyping
      />
      {suffix}
    </span>
  );
}

/**
 * Code-style typewriter with syntax highlighting simulation
 *
 * @example
 * ```tsx
 * <CodeTypeWriter
 *   code="const message = 'Hello World';"
 *   speed={30}
 * />
 * ```
 */
export function CodeTypeWriter({
  code,
  speed = 30,
  className = '',
  style = {},
}: {
  code: string;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const codeStyles: CSSProperties = {
    fontFamily: 'monospace',
    background: '#1e1e1e',
    color: '#d4d4d4',
    padding: '1rem',
    borderRadius: '0.5rem',
    display: 'inline-block',
    ...style,
  };

  return (
    <TypeWriter
      text={code}
      speed={speed}
      cursor
      cursorChar="_"
      className={className}
      style={codeStyles}
      as="code"
    />
  );
}
