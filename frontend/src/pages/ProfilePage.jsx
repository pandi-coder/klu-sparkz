import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { usersApi, registrationsApi, authApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useApp }  from '../context/AppContext';
import { Spinner } from '../components/common/index.jsx';

const DEPARTMENTS = [
  'Computer Science', 'Electronics & Communication', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering', 'Information Technology',
  'Artificial Intelligence', 'Data Science', 'Chemical Engineering', 'Biotechnology',
  'MBA', 'MCA', 'Physics', 'Chemistry', 'Mathematics',
];

const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast }        = useApp();
  const [tab, setTab]        = useState('profile');

  const [form, setForm] = useState({
    name:       user?.name       || '',
    phone:      user?.phone      || '',
    bio:        user?.bio        || '',
    dob:        user?.dob        || '',
    gender:     user?.gender     || '',
    department: user?.department || '',
    year:       user?.year       || '',
    address:    user?.address    || '',
  });

  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });

  // My registrations for summary
  const { data: regsData } = useQuery({
    queryKey: ['my-regs'],
    queryFn:  () => registrationsApi.my().then(r => r.data),
  });

  const regs       = regsData?.data || [];
  const attended   = regs.filter(r => r.attendance_marked).length;
  const totalSpent = regs.reduce((s, r) => s + (r.amount || 0), 0);

  // Save profile
  const saveMut = useMutation({
    mutationFn: () => usersApi.updateProfile(form),
    onSuccess:  ({ data }) => {
      updateUser(data.data);
      showToast('Profile updated successfully!', 'success');
    },
    onError: (e) => showToast(e.response?.data?.message || 'Update failed', 'danger'),
  });

  // Change password
  const pwMut = useMutation({
    mutationFn: () => {
      if (pwForm.newPw !== pwForm.confirm)
        return Promise.reject(new Error('Passwords do not match'));
      if (pwForm.newPw.length < 6)
        return Promise.reject(new Error('Password must be at least 6 characters'));
      return authApi.changePassword({ newPassword: pwForm.newPw });
    },
    onSuccess:  () => {
      showToast('Password updated!', 'success');
      setPwForm({ newPw: '', confirm: '' });
    },
    onError: (e) => showToast(e.message || e.response?.data?.message || 'Failed', 'danger'),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const roleBadgeColor = user?.role === 'Admin' || user?.role === 'SuperAdmin'
    ? 'badge-rose' : 'badge-blue';

  return (
    <div className="page-enter" style={{ maxWidth: 760 }}>
      {/* Profile header card */}
      <div className="card card-body" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg,#dc2a3a,var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : getInitials(user?.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h3 style={{ fontFamily: 'Playfair Display', fontSize: '1.4rem' }}>{user?.name}</h3>
              <span className={`badge ${roleBadgeColor}`}>{user?.role}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
              {user?.email}
              {user?.department && <span style={{ marginLeft: 12 }}>· {user.department}</span>}
              {user?.year && <span style={{ marginLeft: 6 }}>Year {user.year}</span>}
            </div>
            {user?.bio && (
              <div style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                {user.bio}
              </div>
            )}
          </div>

          {/* Stats summary */}
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            {[
              ['Registrations', regs.length,  'bi-calendar-check', 'var(--blue)'],
              ['Attended',      attended,      'bi-check-circle',   'var(--teal)'],
              ['Total Spent',   fmtCurrency(totalSpent), 'bi-cash', 'var(--gold)'],
            ].map(([label, value, icon, color]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <i className={`bi ${icon}`} style={{ fontSize: '0.7rem' }} />{label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        {[
          ['profile',  'bi-person',  'Profile'],
          ['password', 'bi-key',     'Password'],
        ].map(([t, ic, lb]) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            <i className={`bi ${ic}`} />{lb}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="card card-body">
          <div className="form-section-title">Personal Information</div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-control" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
            </div>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea className="form-control" value={form.bio} onChange={set('bio')} placeholder="Tell us about yourself…" rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input className="form-control" type="date" value={form.dob} onChange={set('dob')} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>

          {user?.role === 'Student' && (
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select className="form-control" value={form.department} onChange={set('department')}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year</label>
                <select className="form-control" value={form.year} onChange={set('year')}>
                  <option value="">Select</option>
                  {['1','2','3','4'].map(y => <option key={y} value={y}>{y} Year</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Address</label>
            <textarea className="form-control" value={form.address} onChange={set('address')} rows={2} />
          </div>

          <button
            className="btn btn-primary"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending
              ? <span className="spinner-ring sm" />
              : <><i className="bi bi-check2" /> Save Changes</>}
          </button>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="card card-body">
          <div className="form-section-title">Change Password</div>
          <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(59,110,255,0.08)', borderRadius: 10, border: '1px solid rgba(59,110,255,0.2)', fontSize: '0.85rem', color: 'var(--blue2)' }}>
            <i className="bi bi-info-circle" style={{ marginRight: 8 }} />
            Password is managed securely via Supabase Auth.
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              className="form-control"
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              className="form-control"
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => pwMut.mutate()}
            disabled={pwMut.isPending || !pwForm.newPw}
          >
            {pwMut.isPending
              ? <span className="spinner-ring sm" />
              : <><i className="bi bi-key" /> Update Password</>}
          </button>
        </div>
      )}
    </div>
  );
}
