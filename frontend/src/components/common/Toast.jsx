export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`toast-item ${t.type}`}
          style={{
            background: 'var(--card2)',
            border: `1px solid ${borderColor(t.type)}`,
            borderRadius: 12,
            padding: '14px 20px',
            minWidth: 260,
            maxWidth: 380,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'slideUp 0.35s ease',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer',
          }}
        >
          <i
            className={`bi ${t.icon}`}
            style={{ fontSize: '1.2rem', color: iconColor(t.type), flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.88rem', flex: 1 }}>{t.message}</span>
          <i className="bi bi-x" style={{ color: 'var(--muted2)', fontSize: '0.9rem' }} />
        </div>
      ))}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

const borderColor = (type) => ({
  success: 'rgba(34,197,94,0.4)',
  danger:  'rgba(244,63,94,0.4)',
  warning: 'rgba(251,191,36,0.4)',
  info:    'rgba(79,142,247,0.4)',
}[type] || 'rgba(79,142,247,0.4)');

const iconColor = (type) => ({
  success: 'var(--green)',
  danger:  'var(--rose)',
  warning: '#fbbf24',
  info:    'var(--blue2)',
}[type] || 'var(--blue2)');
