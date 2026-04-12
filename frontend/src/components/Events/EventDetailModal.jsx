import { Modal } from '../common/index.jsx';
import { eventsApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';

const fmtDate     = (d) => new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
const fmtCurrency = (n) => n === 0 ? 'Free' : '₹' + Number(n).toLocaleString('en-IN');

export default function EventDetailModal({ event: ev, isRegistered, onClose, onRegister, registering, isAdmin, onDeleted }) {
  const { showToast } = useApp();
  const dl   = Math.ceil((new Date(ev.deadline || ev.date) - Date.now()) / 86400000);
  const full = ev.registered_count >= ev.max_participants;
  const canReg = !isRegistered && !full && dl > 0;

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    try {
      await eventsApi.delete(ev.id);
      showToast('Event deleted', 'warning');
      onDeleted();
    } catch {
      showToast('Failed to delete', 'danger');
    }
  };

  return (
    <Modal
      title={ev.title}
      onClose={onClose}
      maxWidth={660}
      footer={
        <div style={{ display:'flex', gap:10, flex:1, justifyContent:'space-between' }}>
          <div>
            {isAdmin && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <i className="bi bi-trash" /> Delete
              </button>
            )}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
            {!isAdmin && (
              isRegistered ? (
                <span className="badge badge-green" style={{ padding:'10px 18px', fontSize:'0.88rem' }}>
                  <i className="bi bi-check-circle" /> Registered
                </span>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={onRegister}
                  disabled={!canReg || registering}
                >
                  {registering
                    ? <span className="spinner-ring sm" />
                    : <><i className="bi bi-calendar-plus" /> {full ? 'Event Full' : dl <= 0 ? 'Deadline Passed' : 'Register Now'}</>}
                </button>
              )
            )}
          </div>
        </div>
      }
    >
      {ev.schools && (
        <div className="event-school-badge" style={{
          background: `${ev.schools.color}22`,
          color:       ev.schools.color,
          border:      `1px solid ${ev.schools.color}44`,
          marginBottom: 16,
        }}>
          <i className="bi bi-building" /> {ev.schools.name}
        </div>
      )}

      <p style={{ color:'var(--muted)', lineHeight:1.7, marginBottom:20 }}>{ev.description}</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {[
          ['bi-calendar3', 'Date & Time',   fmtDate(ev.date)],
          ['bi-geo-alt',   'Venue',         ev.venue || 'TBD'],
          ['bi-people',    'Capacity',      `${ev.registered_count} / ${ev.max_participants}`],
          ['bi-cash',      'Entry Fee',     fmtCurrency(ev.fee)],
          ['bi-clock',     'Deadline',      ev.deadline ? fmtDate(ev.deadline) : 'Same as event'],
          ['bi-trophy',    'Prize',         ev.prize || 'TBD'],
        ].filter(([,,v]) => v).map(([icon, label, value]) => (
          <div key={label} style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:'0.72rem', color:'var(--muted2)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
              <i className={`bi ${icon}`} /> {label}
            </div>
            <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {ev.coordinator_name && (
        <div style={{ background:'rgba(59,110,255,0.08)', border:'1px solid rgba(59,110,255,0.2)', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
          <div style={{ fontSize:'0.8rem', color:'var(--blue2)', fontWeight:600, marginBottom:4 }}>
            <i className="bi bi-person-badge" style={{ marginRight:6 }} />Coordinator
          </div>
          <div style={{ fontSize:'0.88rem' }}>{ev.coordinator_name}</div>
          {ev.coordinator_phone && (
            <div style={{ fontSize:'0.8rem', color:'var(--muted)' }}>{ev.coordinator_phone}</div>
          )}
        </div>
      )}

      {ev.rules && (
        <div>
          <div className="form-section-title">Rules & Guidelines</div>
          <p style={{ color:'var(--muted)', fontSize:'0.88rem', lineHeight:1.7, whiteSpace:'pre-line' }}>
            {ev.rules}
          </p>
        </div>
      )}
    </Modal>
  );
}
