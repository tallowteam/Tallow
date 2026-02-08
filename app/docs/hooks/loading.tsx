export default function HooksLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #030306)',
        display: 'flex',
      }}
    >
      {/* Sidebar placeholder */}
      <div
        style={{
          width: '280px',
          borderRight: '1px solid rgba(99, 102, 241, 0.08)',
          padding: '6rem 1rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }}
          />
        ))}
      </div>
      {/* Main content */}
      <div style={{ flex: 1, padding: '3rem 2rem' }}>
        <div
          style={{
            width: 'min(400px, 60vw)',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            marginBottom: '1rem',
          }}
        />
        <div
          style={{
            width: 'min(300px, 50vw)',
            height: '16px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
            marginBottom: '2rem',
          }}
        />
        {/* Code block placeholder */}
        <div
          style={{
            height: '200px',
            borderRadius: '12px',
            background: 'rgba(12, 12, 22, 0.55)',
            border: '1px solid rgba(99, 102, 241, 0.08)',
          }}
        />
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
