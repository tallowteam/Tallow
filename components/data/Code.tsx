'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';
import styles from './Code.module.css';

export interface CodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  copyable?: boolean;
  maxHeight?: string;
  filename?: string;
}

export const Code = forwardRef<HTMLDivElement, CodeProps>(
  (
    {
      code,
      language = 'text',
      showLineNumbers = true,
      copyable = true,
      maxHeight,
      filename,
      className = '',
      ...props
    },
    ref
  ) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    };

    const lines = code.split('\n');

    return (
      <div ref={ref} className={`${styles.codeBlock} ${className}`} {...props}>
        <div className={styles.header}>
          <div className={styles.info}>
            {filename && <span className={styles.filename}>{filename}</span>}
            <span className={styles.language}>{language}</span>
          </div>
          {copyable && (
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopy}
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
        <div className={styles.content} style={{ maxHeight }}>
          <pre className={styles.pre}>
            {showLineNumbers && (
              <div className={styles.lineNumbers} aria-hidden="true">
                {lines.map((_, index) => (
                  <div key={index} className={styles.lineNumber}>
                    {index + 1}
                  </div>
                ))}
              </div>
            )}
            <code className={styles.code}>
              {lines.map((line, index) => (
                <div key={index} className={styles.line}>
                  {line}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    );
  }
);

Code.displayName = 'Code';
