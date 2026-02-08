export default function AboutLoading() {
  const shimmer =
    'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #030306)',
        padding: 'clamp(120px, 18vw, 200px) clamp(16px, 4vw, 24px) 4rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Label */}
        <div
          style={{
            width: '100px',
            height: '14px',
            borderRadius: '60px',
            background: shimmer,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        {/* Hero Title */}
        <div
          style={{
            width: 'min(600px, 80vw)',
            height: '56px',
            borderRadius: '8px',
            background: shimmer,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />

        {/* Manifesto paragraphs */}
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            marginTop: '4rem',
            borderTop: '1px solid rgba(99, 102, 241, 0.08)',
            paddingTop: '4rem',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: `${90 - i * 5}%`,
                height: '16px',
                borderRadius: '8px',
                background: shimmer,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
          ))}
        </div>

        {/* Value cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            marginTop: '3rem',
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '160px',
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
