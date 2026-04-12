// ─── MyEventsPage.jsx ─────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationsApi } from '../lib/api';
import { useApp }  from '../context/AppContext';
import { Spinner, EmptyState } from '../components/common/index.jsx';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const fmtCur  = (n) => n === 0 ? 'Free' : '₹' + Number(n).toLocaleString('en-IN');

export default function MyEventsPage() {
  const { showToast } = useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-regs'],
    queryFn:  () => registrationsApi.my().then(r => r.data),
  });

  const cancelMut = useMutation({
    mutationFn: (id) => registrationsApi.cancel(id),
    onSuccess:  () => { qc.invalidateQueries(['my-regs']); showToast('Registration cancelled', 'warning'); },
    onError:    (e) => showToast(e.response?.data?.message || 'Failed to cancel', 'danger'),
  });

  const regs = data?.data || [];

  return (
    <div className="page-enter">
      <div className="section-header">
        <div className="section-title">My Registrations</div>
        <span className="badge badge-blue">{regs.length} events</span>
      </div>

      {isLoading ? <Spinner centered /> : regs.length === 0 ? (
        <EmptyState icon="bi-bookmark-x" title="No registrations yet" sub="Browse events and register to see them here" />
      ) : (
        <div className="card" style={{ overflow: 'visible' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Attendance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {regs.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{r.events?.title}</div>
                    {r.events?.schools && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.events.schools.name}</div>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{fmtDate(r.events?.date)}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{r.events?.venue || '—'}</td>
                  <td><span className="badge badge-gold">{fmtCur(r.amount)}</span></td>
                  <td>
                    <span className={`badge badge-${r.payment_status === 'Paid' || r.payment_status === 'Free' ? 'green' : 'rose'}`}>
                      {r.payment_status}
                    </span>
                  </td>
                  <td>
                    {r.attendance_marked
                      ? <span className="badge badge-teal"><i className="bi bi-check-circle" /> Present</span>
                      : <span style={{ color: 'var(--muted2)', fontSize: '0.8rem' }}>—</span>}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { if (confirm('Cancel registration?')) cancelMut.mutate(r.id); }}
                      disabled={cancelMut.isPending}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
