export default function ArchitectureLoading() {
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
          maxWidth: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        {/* Title */}
        <div
          style={{
            width: 'min(460px, 70vw)',
            height: '48px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        {/* Description */}
        <div
          style={{
            width: 'min(360px, 55vw)',
            height: '16px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        {/* Architecture diagram placeholder */}
        <div
          style={{
            width: '100%',
            height: '320px',
            borderRadius: '12px',
            background: 'rgba(12, 12, 22, 0.55)',
            border: '1px solid rgba(99, 102, 241, 0.08)',
            marginTop: '2rem',
          }}
        />
        {/* Section cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            marginTop: '2rem',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '180px',
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
