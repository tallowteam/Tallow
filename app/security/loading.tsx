export default function SecurityLoading() {
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
        <div
          style={{
            width: '160px',
            height: '14px',
            borderRadius: '60px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 'min(550px, 75vw)',
            height: '48px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: 'min(420px, 60vw)',
            height: '16px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            marginTop: '3rem',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '240px',
                borderRadius: '16px',
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
