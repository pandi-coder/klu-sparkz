import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, eventsApi, registrationsApi, schoolsApi } from '../lib/api';
import { useApp }  from '../context/AppContext';
import { Spinner, EmptyState, Modal } from '../components/common/index.jsx';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

// ─── PENDING ADMIN APPROVALS ───────────────────────────────────────────────────
function ApprovalsTab() {
  const { showToast } = useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-admins'],
    queryFn:  () => usersApi.pendingAdmins().then(r => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id) => usersApi.approve(id),
    onSuccess:  () => { qc.invalidateQueries(['pending-admins']); showToast('Admin approved!', 'success'); },
    onError:    (e) => showToast(e.response?.data?.message || 'Failed', 'danger'),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => usersApi.reject(id),
    onSuccess:  () => { qc.invalidateQueries(['pending-admins']); showToast('Request rejected', 'warning'); },
    onError:    (e) => showToast(e.response?.data?.message || 'Failed', 'danger'),
  });

  const pending = data?.data || [];

  if (isLoading) return <Spinner centered />;
  if (!pending.length) return <EmptyState icon="bi-person-check" title="All clear!" sub="No pending admin approvals" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pending.map(p => (
        <div key={p.id} className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div className="lb-avatar">{getInitials(p.name)}</div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              {p.email}{p.phone ? ` · ${p.phone}` : ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted2)', marginTop: 2 }}>
              Registered {fmtDate(p.created_at)}
            </div>
          </div>
          <span className="badge badge-rose">Pending</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={() => approveMut.mutate(p.id)} disabled={approveMut.isPending}>
              <i className="bi bi-check-lg" /> Approve
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(`Reject ${p.name}?`)) rejectMut.mutate(p.id); }} disabled={rejectMut.isPending}>
              <i className="bi bi-x-lg" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EVENTS MANAGEMENT ────────────────────────────────────────────────────────
function EventsTab() {
  const { showToast } = useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'all'],
    queryFn:  () => eventsApi.list({ limit: 100 }).then(r => r.data),
  });

  const [selectedEventId, setSelectedEventId] = useState(null);

  const { data: eventRegsData, isLoading: regsLoading } = useQuery({
    queryKey: ['event-regs', selectedEventId],
    queryFn:  () => eventsApi.getRegs(selectedEventId).then(r => r.data),
    enabled:  !!selectedEventId,
  });

  const attendMut = useMutation({
    mutationFn: ({ eId, rId, attended }) => eventsApi.markAttendance(eId, rId, attended),
    onSuccess:  () => { qc.invalidateQueries(['event-regs']); showToast('Attendance updated', 'success'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => eventsApi.delete(id),
    onSuccess:  () => { qc.invalidateQueries(['events']); showToast('Event deleted', 'warning'); },
    onError:    (e) => showToast(e.response?.data?.message || 'Failed', 'danger'),
  });

  const events = data?.data || [];
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const eventRegs = eventRegsData?.data || [];

  if (isLoading) return <Spinner centered />;

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>School</th>
              <th>Date</th>
              <th>Registered</th>
              <th>Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No events yet</td></tr>
            ) : events.map(ev => (
              <tr key={ev.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{ev.category}</div>
                </td>
                <td>
                  {ev.schools && (
                    <span className="badge badge-blue">{ev.schools.short_name}</span>
                  )}
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{fmtDate(ev.date)}</td>
                <td>
                  <span style={{ fontWeight: 600 }}>{ev.registered_count}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>/{ev.max_participants}</span>
                </td>
                <td style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {ev.fee === 0 ? 'Free' : `₹${ev.fee}`}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedEventId(ev.id)}
                    >
                      <i className="bi bi-people" /> Registrations
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { if (confirm('Delete this event?')) deleteMut.mutate(ev.id); }}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registrations modal */}
      {selectedEventId && (
        <Modal
          title={`Registrations — ${selectedEvent?.title}`}
          onClose={() => setSelectedEventId(null)}
          maxWidth={800}
        >
          {regsLoading ? <Spinner centered /> : eventRegs.length === 0 ? (
            <EmptyState icon="bi-people" title="No registrations" sub="Nobody has registered for this event yet" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Dept / Year</th>
                  <th>Registered</th>
                  <th>Payment</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {eventRegs.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="lb-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {getInitials(r.users?.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.users?.name}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>{r.users?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {r.users?.department} · Yr {r.users?.year}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {new Date(r.registered_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <span className={`badge ${r.payment_status === 'Free' || r.payment_status === 'Paid' ? 'badge-green' : 'badge-rose'}`}>
                        {r.payment_status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${r.attendance_marked ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => attendMut.mutate({ eId: selectedEventId, rId: r.id, attended: !r.attendance_marked })}
                        disabled={attendMut.isPending}
                        style={{ minWidth: 90 }}
                      >
                        {r.attendance_marked
                          ? <><i className="bi bi-check-circle" /> Present</>
                          : <><i className="bi bi-circle" /> Absent</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── SCHOOLS & DEPTS MANAGEMENT ───────────────────────────────────────────────
function SchoolsTab() {
  const { showToast } = useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn:  () => schoolsApi.list().then(r => r.data),
  });

  const [newDept, setNewDept]       = useState({ schoolId: '', name: '' });
  const [newSchool, setNewSchool]   = useState({ name: '', short_name: '', color: '#3b6eff' });

  const createSchoolMut = useMutation({
    mutationFn: () => schoolsApi.create(newSchool),
    onSuccess:  () => {
      qc.invalidateQueries(['schools']);
      showToast('School added!', 'success');
      setNewSchool({ name: '', short_name: '', color: '#3b6eff' });
    },
    onError: (e) => showToast(e.response?.data?.message || 'Failed', 'danger'),
  });

  const addDeptMut = useMutation({
    mutationFn: () => schoolsApi.addDept(newDept.schoolId, { name: newDept.name }),
    onSuccess:  () => {
      qc.invalidateQueries(['schools']);
      showToast('Department added!', 'success');
      setNewDept(p => ({ ...p, name: '' }));
    },
    onError: (e) => showToast(e.response?.data?.message || 'Failed', 'danger'),
  });

  const removeDeptMut = useMutation({
    mutationFn: (id) => schoolsApi.removeDept(id),
    onSuccess:  () => { qc.invalidateQueries(['schools']); showToast('Department removed', 'warning'); },
  });

  const schools = data?.data || [];

  if (isLoading) return <Spinner centered />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Schools list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Schools</div>
        </div>

        {/* Add school form */}
        <div className="card card-body" style={{ marginBottom: 16 }}>
          <div className="form-section-title" style={{ marginBottom: 12 }}>Add School</div>
          <div className="form-group">
            <label>Name</label>
            <input className="form-control" value={newSchool.name} onChange={e => setNewSchool(p => ({ ...p, name: e.target.value }))} placeholder="School of Engineering" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Short Name</label>
              <input className="form-control" value={newSchool.short_name} onChange={e => setNewSchool(p => ({ ...p, short_name: e.target.value }))} placeholder="SOE" />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input className="form-control" type="color" value={newSchool.color} onChange={e => setNewSchool(p => ({ ...p, color: e.target.value }))} style={{ height: 44, padding: 4, cursor: 'pointer' }} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => createSchoolMut.mutate()} disabled={!newSchool.name || createSchoolMut.isPending}>
            <i className="bi bi-plus-lg" /> Add School
          </button>
        </div>

        {schools.map(s => (
          <div key={s.id} className="card card-body" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <span className="badge badge-blue">{s.short_name}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {s.departments?.length || 0} departments
            </div>
          </div>
        ))}
      </div>

      {/* Departments */}
      <div>
        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>Departments</div>

        <div className="card card-body" style={{ marginBottom: 16 }}>
          <div className="form-section-title" style={{ marginBottom: 12 }}>Add Department</div>
          <div className="form-group">
            <label>School</label>
            <select className="form-control" value={newDept.schoolId} onChange={e => setNewDept(p => ({ ...p, schoolId: e.target.value }))}>
              <option value="">Select school</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Department Name</label>
            <input className="form-control" value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Computer Science" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => addDeptMut.mutate()} disabled={!newDept.schoolId || !newDept.name || addDeptMut.isPending}>
            <i className="bi bi-plus-lg" /> Add Department
          </button>
        </div>

        {schools.map(s => (
          s.departments?.length > 0 && (
            <div key={s.id} className="card card-body" style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.9rem', color: s.color }}>{s.short_name} Departments</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.departments.map(d => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg3)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '5px 10px', fontSize: '0.8rem',
                  }}>
                    {d.name}
                    <button
                      onClick={() => removeDeptMut.mutate(d.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', padding: 0, fontSize: '0.75rem' }}
                    >
                      <i className="bi bi-x" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── ALL REGISTRATIONS ────────────────────────────────────────────────────────
function AllRegsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['all-regs'],
    queryFn:  () => registrationsApi.all().then(r => r.data),
  });

  const regs = data?.data || [];
  const totalRevenue = regs.reduce((s, r) => s + (r.amount || 0), 0);

  if (isLoading) return <Spinner centered />;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          ['Total Registrations', regs.length,         'bi-people',        'var(--blue)' ],
          ['Attended',            regs.filter(r => r.attendance_marked).length, 'bi-check-circle', 'var(--green)'],
          ['Revenue',             '₹' + Number(totalRevenue).toLocaleString('en-IN'), 'bi-cash-stack', 'var(--gold)'],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <i className={`bi ${icon}`} />{label}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Event</th>
              <th>Date</th>
              <th>Payment</th>
              <th>Amount</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {regs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No registrations</td></tr>
            ) : regs.slice(0, 50).map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.users?.name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--muted)' }}>{r.users?.email}</div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{r.events?.title || '—'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {new Date(r.registered_at).toLocaleDateString('en-IN')}
                </td>
                <td>
                  <span className={`badge ${r.payment_status === 'Paid' || r.payment_status === 'Free' ? 'badge-green' : 'badge-rose'}`}>
                    {r.payment_status}
                  </span>
                </td>
                <td style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {r.amount === 0 ? '—' : `₹${r.amount}`}
                </td>
                <td>
                  {r.attendance_marked
                    ? <span className="badge badge-teal"><i className="bi bi-check-circle" /> Present</span>
                    : <span style={{ color: 'var(--muted2)', fontSize: '0.8rem' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'approvals',   label: 'Pending Approvals', icon: 'bi-person-check' },
  { id: 'events',      label: 'Events',             icon: 'bi-calendar-event' },
  { id: 'registrations', label: 'All Registrations', icon: 'bi-list-check' },
  { id: 'schools',     label: 'Schools & Depts',   icon: 'bi-building' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('approvals');

  return (
    <div className="page-enter">
      <div className="section-header">
        <div className="section-title">
          <i className="bi bi-shield-check" style={{ color: 'var(--rose)', marginRight: 10 }} />
          Admin Panel
        </div>
      </div>

      <div className="tabs-row" style={{ width: '100%', marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <i className={`bi ${t.icon}`} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'approvals'     && <ApprovalsTab />}
      {tab === 'events'        && <EventsTab />}
      {tab === 'registrations' && <AllRegsTab />}
      {tab === 'schools'       && <SchoolsTab />}
    </div>
  );
}
