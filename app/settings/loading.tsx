export default function SettingsLoading() {
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
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {/* Page title */}
        <div
          style={{
            width: '160px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s ease-in-out infinite',
          }}
        />
        {/* Settings sections */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: '16px',
              background: 'rgba(12, 12, 22, 0.55)',
              border: '1px solid rgba(99, 102, 241, 0.08)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '180px',
                height: '20px',
                borderRadius: '8px',
                background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: `${120 + j * 40}px`,
                    height: '14px',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, rgba(24,24,42,0.4) 0%, rgba(36,36,58,0.6) 40%, rgba(24,24,42,0.4) 80%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    background: 'rgba(24,24,42,0.5)',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}
