import { useToastStore } from '../store/toastStore.js'

const STYLES = {
  info:    { bg: 'rgba(20, 18, 30, 0.95)', border: 'rgba(212, 173, 88, 0.35)', text: '#f6f2e6', accent: '#a47a2a' },
  success: { bg: 'rgba(12, 28, 18, 0.95)', border: 'rgba(86, 211, 130, 0.45)', text: '#e6fff0', accent: '#56d382' },
  error:   { bg: 'rgba(30, 10, 14, 0.96)', border: 'rgba(255, 64, 80, 0.5)',   text: '#ffe6e8', accent: '#ff4050' },
  warn:    { bg: 'rgba(30, 22, 10, 0.95)', border: 'rgba(244, 196, 96, 0.55)', text: '#fff5dc', accent: '#f4c460' },
}

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 14px)',
        left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => {
        const s = STYLES[t.kind] || STYLES.info
        return (
          <div
            key={t.id}
            role="alert"
            onClick={() => dismiss(t.id)}
            style={{
              pointerEvents: 'auto',
              minWidth: 240,
              maxWidth: 'min(92vw, 420px)',
              padding: '11px 16px',
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderLeft: `3px solid ${s.accent}`,
              color: s.text,
              borderRadius: 10,
              boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              lineHeight: 1.35,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              cursor: 'pointer',
              animation: 'toastIn 200ms ease-out',
            }}
          >
            {t.title && (
              <div style={{ fontWeight: 600, marginBottom: 2, color: s.accent, letterSpacing: 0.4 }}>
                {t.title}
              </div>
            )}
            <div>{t.message}</div>
          </div>
        )
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
