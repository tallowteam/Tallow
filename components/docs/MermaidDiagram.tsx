'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import styles from './MermaidDiagram.module.css';

interface MermaidDiagramProps {
  diagram: string;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * MermaidDiagram Component
 * Renders Mermaid.js diagrams with lazy loading, dark theme support, and error handling
 */
export function MermaidDiagram({
  diagram,
  title,
  description,
  className,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import of mermaid to reduce bundle size
    const loadMermaid = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import mermaid dynamically
        // @ts-expect-error mermaid is an optional peer dependency
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        // Configure mermaid for dark theme
        // SECURITY: Use 'strict' security level to prevent XSS attacks
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            padding: '16',
          },
          sequence: {
            useMaxWidth: true,
            mirrorActors: true,
          },
        });

        // Render diagram
        if (containerRef.current) {
          try {
            // Use mermaid's render API instead of innerHTML
            const { svg } = await mermaid.render('mermaid-diagram', diagram);

            // Clear previous content safely
            containerRef.current.innerHTML = '';

            // Create a div and set innerHTML from mermaid's sanitized SVG
            const wrapper = document.createElement('div');
            wrapper.className = styles.mermaidContent ?? '';
            // mermaid.render returns sanitized SVG, safe to use
            wrapper.innerHTML = svg;
            containerRef.current.appendChild(wrapper);

            setIsLoading(false);
          } catch (renderError) {
            const message =
              renderError instanceof Error
                ? renderError.message
                : 'Failed to render diagram';
            setError(message);
            setIsLoading(false);
          }
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load Mermaid library';
        setError(message);
        setIsLoading(false);
      }
    };

    loadMermaid();
  }, [diagram]);

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.container}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} aria-label="Loading diagram" />
            <p>Loading diagram...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <p className={styles.errorTitle}>Diagram Definition</p>
            <pre style={{
              marginTop: '8px',
              padding: '16px',
              background: 'var(--bg-elevated, #1a1a2e)',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.6',
              color: 'var(--text-secondary, #9ca3af)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid var(--border-default, #2d2d3d)',
            }}>
              {diagram}
            </pre>
          </div>
        )}

        <div
          ref={containerRef}
          className={styles.diagram}
          style={{
            display: isLoading || error ? 'none' : 'block',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Lazy-loaded version with Suspense boundary
 */
export function MermaidDiagramAsync(props: MermaidDiagramProps) {
  return (
    <Suspense
      fallback={
        <div className={styles.wrapper}>
          {props.title && <h3 className={styles.title}>{props.title}</h3>}
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <MermaidDiagram {...props} />
    </Suspense>
  );
}
