// ─── Confetti ─────────────────────────────────────────────────────────────────
import { useMemo } from 'react';

export function Confetti({ active }) {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left:     Math.random() * 100,
    color:    ['#dc2a3a','#ffd700','#22c55e','#f43f5e','#a78bfa','#f59e0b'][Math.floor(Math.random()*6)],
    duration: 2.5 + Math.random() * 2,
    delay:    Math.random() * 1.5,
    size:     6 + Math.random() * 8,
    rotate:   Math.random() * 360,
    circle:   Math.random() > 0.5,
  })), []);

  if (!active) return null;
  return (
    <div className="confetti-wrap">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.left}%`,
          backgroundColor: p.color,
          width:  p.size,
          height: p.size,
          animationDuration:  `${p.duration}s`,
          animationDelay:     `${p.delay}s`,
          transform:          `rotate(${p.rotate}deg)`,
          borderRadius:       p.circle ? '50%' : '2px',
        }} />
      ))}
    </div>
  );
}

export default Confetti;

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, footer, onClose, maxWidth = 600 }) {
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.15rem', fontWeight: 700 }}>
            {title}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', centered = false }) {
  const s = size === 'sm' ? 20 : size === 'lg' ? 72 : 52;
  const bw = size === 'sm' ? 2 : 3;
  const el = (
    <span style={{
      display: 'inline-block',
      width: s, height: s,
      border: `${bw}px solid var(--border)`,
      borderTopColor: 'var(--gold)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
  if (!centered) return el;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      {el}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'bi-inbox', title = 'Nothing here', sub = '' }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><i className={`bi ${icon}`} /></div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

// ─── Loading page ─────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(6,11,24,0.85)', backdropFilter: 'blur(6px)', zIndex: 9999,
      gap: 16,
    }}>
      <Spinner size="lg" />
      <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading KLU Sparkz…</span>
    </div>
  );
}
