export default function ApiDocsLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #030306)',
        padding: 'clamp(120px, 18vw, 200px) clamp(16px, 4vw, 24px) 4rem',
      }}
    >
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        {/* Title */}
        <div
          style={{
            width: 'min(400px, 60vw)',
            height: '42px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            marginBottom: '0.75rem',
          }}
        />
        {/* Subtitle */}
        <div
          style={{
            width: 'min(300px, 50vw)',
            height: '18px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            marginBottom: '2rem',
          }}
        />
        <div style={{ borderBottom: '1px solid rgba(99, 102, 241, 0.08)', marginBottom: '2rem' }} />
        {/* Endpoint cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '72px',
                borderRadius: '12px',
                background: 'rgba(12, 12, 22, 0.55)',
                border: '1px solid rgba(99, 102, 241, 0.08)',
              }}
            />
          ))}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
