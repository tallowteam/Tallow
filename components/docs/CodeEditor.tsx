'use client';

import { useCallback } from 'react';
import styles from './CodeEditor.module.css';

interface CodeEditorProps {
  code: string;
  readonly?: boolean;
  label?: string;
  language?: string;
  onChange?: (value: string) => void;
}

export function CodeEditor({ code, readonly = false, label, language = 'tsx', onChange }: CodeEditorProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [code]);

  return (
    <div className={styles.editor}>
      {label && (
        <div className={styles.header}>
          <span className={styles.label}>{label}</span>
          <div className={styles.actions}>
            <span className={styles.language}>{language}</span>
            <button className={styles.copyButton} onClick={handleCopy} type="button" aria-label="Copy code">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </button>
          </div>
        </div>
      )}
      <pre className={styles.codeBlock}>
        {readonly ? (
          <code className={styles.code}>{code}</code>
        ) : (
          <textarea
            className={styles.textarea}
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
          />
        )}
      </pre>
    </div>
  );
}
