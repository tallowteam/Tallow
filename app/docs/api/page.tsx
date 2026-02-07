'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Copy, ChevronDown, ExternalLink, Code } from '@/components/icons';
import styles from './page.module.css';

interface OpenAPISpec {
  info: { title: string; description: string; version: string };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown> };
}

interface Endpoint {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  parameters?: Array<unknown>;
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  'x-codeSamples'?: Array<{ lang: string; source: string }>;
}

interface CodeSample {
  lang: string;
  source: string;
}

export default function APIDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [activeCodeSample, setActiveCodeSample] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch OpenAPI spec
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    async function fetchSpec() {
      try {
        const response = await fetch('/api/docs?format=json', { signal: controller.signal });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const data = (await response.json()) as OpenAPISpec;
        setSpec(data);

        // Parse endpoints from spec
        const parsedEndpoints: Endpoint[] = [];
        if (data.paths) {
          for (const [path, pathItem] of Object.entries(data.paths)) {
            for (const [method, operation] of Object.entries(pathItem)) {
              if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)) {
                const op = operation as Record<string, unknown>;
                const endpointKey = `${method.toUpperCase()} ${path}`;

                parsedEndpoints.push({
                  path,
                  method: method.toUpperCase(),
                  operationId: (op.operationId as string) || endpointKey,
                  summary: (op.summary as string) || '',
                  description: (op.description as string) || '',
                  parameters: (op.parameters as Array<unknown>) || [],
                  requestBody: op.requestBody,
                  responses: (op.responses as Record<string, unknown>) || {},
                  'x-codeSamples': (op['x-codeSamples'] as Array<{ lang: string; source: string }>) || [],
                });

                // Set first code sample as active
                const samples = (op['x-codeSamples'] as Array<{ lang: string; source: string }>) || [];
                if (samples.length > 0) {
                  setActiveCodeSample((prev) => ({
                    ...prev,
                    [endpointKey]: samples[0]!.lang,
                  }));
                }
              }
            }
          }
        }

        setEndpoints(parsedEndpoints);
        setLoading(false);
      } catch (err) {
        clearTimeout(timeout);
        const message = err instanceof Error ? err.message : 'Failed to load API documentation';
        console.error('Failed to fetch OpenAPI spec:', message);
        setError(message);
        setLoading(false);
      }
    }

    fetchSpec();
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const toggleEndpoint = (operationId: string) => {
    setExpandedEndpoints((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(operationId)) {
        newSet.delete(operationId);
      } else {
        newSet.add(operationId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusCodeClass = (code: string): string => {
    const statusCode = parseInt(code);
    if (statusCode >= 200 && statusCode < 300) return styles['success'] ?? '';
    if (statusCode >= 300 && statusCode < 400) return styles['redirect'] ?? '';
    if (statusCode >= 400 && statusCode < 500) return styles['clientError'] ?? '';
    if (statusCode >= 500 && statusCode < 600) return styles['serverError'] ?? '';
    return '';
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>API Reference</h1>
            <p className={styles.subtitle}>Could not load API documentation</p>
            <p className={styles.description} style={{ color: 'var(--error-500, #ef4444)' }}>
              {error}
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-500, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Retry
              </button>
              <Link href="/docs">
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: 'var(--text-secondary, #9ca3af)',
                    border: '1px solid var(--border-default, #374151)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Back to Docs
                </button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>API Reference</h1>
          <p className={styles.subtitle}>Complete REST API documentation</p>
          <p className={styles.description}>
            {spec?.info.description
              ? spec.info.description.split('\n')[0]
              : 'Explore and test all available API endpoints'}
          </p>
          {spec?.servers && spec.servers.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Base URLs</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {spec.servers.map((server, idx) => (
                  <li key={idx} style={{ color: 'var(--text-secondary, #6b7280)' }}>
                    <code style={{ fontFamily: 'monospace' }}>{server.url}</code> -{' '}
                    {server.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link href="/api/docs" target="_blank" rel="noopener noreferrer">
              <button
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-500, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Code width={16} height={16} />
                View in Swagger UI
                <ExternalLink width={16} height={16} />
              </button>
            </Link>
          </div>
        </div>

        {/* Navigation + Main Content */}
        <div className={styles.navigationContainer}>
          {/* Sidebar Navigation */}
          <nav className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Endpoints</h3>
              {endpoints.map((endpoint) => (
                <a
                  key={endpoint.operationId}
                  href={`#${endpoint.operationId}`}
                  className={`${styles.navLink} ${
                    expandedEndpoints.has(endpoint.operationId) ? styles.active : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleEndpoint(endpoint.operationId);
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                    {endpoint.method}
                  </span>
                  <span>{endpoint.path}</span>
                </a>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className={styles.main}>
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.operationId}
                id={endpoint.operationId}
                className={`${styles.endpointCard} ${
                  expandedEndpoints.has(endpoint.operationId) ? styles.expanded : ''
                }`}
              >
                {/* Header */}
                <div
                  className={styles.endpointHeader}
                  onClick={() => toggleEndpoint(endpoint.operationId)}
                >
                  <h2 className={styles.endpointTitle}>
                    <span className={`${styles.methodBadge} ${styles[endpoint.method.toLowerCase()]}`}>
                      {endpoint.method}
                    </span>
                    <code className={styles.endpointPath}>{endpoint.path}</code>
                  </h2>
                  <ChevronDown className={styles.expandIcon} width={24} height={24} />
                </div>

                {/* Content */}
                <div className={styles.endpointContent}>
                  {/* Summary */}
                  {endpoint.summary && (
                    <div className={styles.section}>
                      <p className={styles.endpointDescription}>{endpoint.summary}</p>
                    </div>
                  )}

                  {/* Description */}
                  {endpoint.description && (
                    <div className={styles.section}>
                      <p className={styles.endpointDescription}>{endpoint.description}</p>
                    </div>
                  )}

                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Parameters</h3>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(endpoint.parameters || []).map((param: unknown, idx) => {
                            const p = param as Record<string, unknown>;
                            return (
                              <tr key={idx}>
                                <td>
                                  <span className={styles.paramName}>{p.name as string}</span>
                                </td>
                                <td>
                                  <span className={styles.paramType}>
                                    {(p.schema as Record<string, unknown>)?.type as string || 'string'}
                                  </span>
                                </td>
                                <td>
                                  {p.required ? (
                                    <span className={styles.paramRequired}>Yes</span>
                                  ) : (
                                    'No'
                                  )}
                                </td>
                                <td>{p.description as string}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody != null && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Request Body</h3>
                      <p className={styles.endpointDescription}>
                        Content-Type: application/json
                      </p>
                    </div>
                  )}

                  {/* Responses */}
                  {endpoint.responses && Object.keys(endpoint.responses).length > 0 && (
                    <div className={styles.section}>
                      <h3 className={styles.sectionTitle}>Responses</h3>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Description</th>
                            <th>Content Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(endpoint.responses).map(([code, response]: [string, unknown]) => {
                            const resp = response as Record<string, unknown>;
                            return (
                              <tr key={code}>
                                <td>
                                  <span className={`${styles.statusCode} ${getStatusCodeClass(code)}`}>
                                    {code}
                                  </span>
                                </td>
                                <td>{resp.description as string}</td>
                                <td>
                                  {resp.content && Object.keys(resp.content).length > 0
                                    ? Object.keys(resp.content).join(', ')
                                    : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Code Samples */}
                  {endpoint['x-codeSamples'] && endpoint['x-codeSamples'].length > 0 && (
                    <div className={styles.codeSamples}>
                      <h3 className={styles.sectionTitle}>Code Examples</h3>
                      <div className={styles.codeSampleTabs}>
                        {endpoint['x-codeSamples'].map((sample: CodeSample) => (
                          <button
                            key={sample.lang}
                            className={`${styles.codeSampleTab} ${
                              activeCodeSample[endpoint.operationId] === sample.lang
                                ? styles.active
                                : ''
                            }`}
                            onClick={() =>
                              setActiveCodeSample((prev) => ({
                                ...prev,
                                [endpoint.operationId]: sample.lang,
                              }))
                            }
                          >
                            {sample.lang}
                          </button>
                        ))}
                      </div>
                      {endpoint['x-codeSamples'].map((sample: CodeSample) => (
                        <div
                          key={sample.lang}
                          className={`${styles.codeSampleContent} ${
                            activeCodeSample[endpoint.operationId] === sample.lang
                              ? styles.active
                              : ''
                          }`}
                        >
                          <div className={styles.codeBlock}>
                            <code>{sample.source}</code>
                          </div>
                          <button
                            className={`${styles.copyButton} ${
                              copiedCode === `${endpoint.operationId}-${sample.lang}`
                                ? styles.copied
                                : ''
                            }`}
                            onClick={() =>
                              copyToClipboard(
                                sample.source,
                                `${endpoint.operationId}-${sample.lang}`
                              )
                            }
                          >
                            <Copy width={16} height={16} />
                            {copiedCode === `${endpoint.operationId}-${sample.lang}`
                              ? 'Copied!'
                              : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Try It Out Console */}
                  {['GET', 'POST', 'PUT', 'DELETE'].includes(endpoint.method) && (
                    <div className={styles.tryItOut}>
                      <h3 className={styles.tryItOutTitle}>
                        <Code width={16} height={16} />
                        Try It Out
                      </h3>
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary, #6b7280)',
                          marginBottom: '1rem',
                        }}
                      >
                        Fill in the parameters below to test this endpoint live.
                      </p>
                      <form className={styles.tryItOutForm}>
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <>
                            {endpoint.parameters.map((param: unknown, idx) => {
                              const p = param as Record<string, unknown>;
                              return (
                                <div key={idx} className={styles.formGroup}>
                                  <label htmlFor={`param-${idx}`} className={styles.formLabel}>
                                    {p.name as string}
                                    {!!p.required && <span className={styles.paramRequired}>*</span>}
                                  </label>
                                  <input
                                    id={`param-${idx}`}
                                    type="text"
                                    className={styles.formInput}
                                    placeholder={(p.example as string) || `Enter ${p.name as string}`}
                                  />
                                </div>
                              );
                            })}
                          </>
                        )}
                        <button type="button" className={styles.tryItOutButton}>
                          Send Request
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
