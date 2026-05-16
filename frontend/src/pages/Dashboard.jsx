import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery }    from '@tanstack/react-query';
import { Chart, registerables } from 'chart.js';
import { useAuth }     from '../context/AuthContext';
import { useApp }      from '../context/AppContext';
import { eventsApi, registrationsApi, usersApi } from '../lib/api';
import { Spinner, EmptyState } from '../components/common/index.jsx';

Chart.register(...registerables);

const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate     = (d) => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const daysLeft    = (d) => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000));

function StatCard({ value, label, icon, cls, prefix = '', delay = 0 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : 0;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(start);
      if (start >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`stat-card ${cls}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-icon-wrap"><i className={`bi ${icon}`} /></div>
      <div className="stat-num">
        {prefix}{typeof value === 'number' ? display.toLocaleString('en-IN') : value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function RegistrationChart({ regs }) {
  const ref = useRef();
  useEffect(() => {
    if (!regs?.length || !ref.current) return;
    const ctx = ref.current.getContext('2d');

    // Group by month
    const counts = {};
    regs.forEach(r => {
      const m = new Date(r.registered_at).toLocaleString('en-IN', { month: 'short' });
      counts[m] = (counts[m] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data   = Object.values(counts);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Registrations',
          data,
          backgroundColor: 'rgba(220,40,60,0.6)',
          borderColor:     '#dc2a3a',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9aa3b5' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9aa3b5', precision: 0 } },
        },
      },
    });
    return () => chart.destroy();
  }, [regs]);

  return <canvas ref={ref} height={180} />;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { showToast }     = useApp();
  const navigate          = useNavigate();

  const { data: eventsData } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn:  () => eventsApi.list({ limit: 6 }).then(r => r.data),
  });

  const { data: myRegsData } = useQuery({
    queryKey: ['my-regs'],
    queryFn:  () => registrationsApi.my().then(r => r.data),
    enabled:  !isAdmin,
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => usersApi.dashboardStats().then(r => r.data),
    enabled:  isAdmin,
  });

  const events = eventsData?.data || [];
  const myRegs = myRegsData?.data || [];
  const stats  = statsData?.data || {};

  const attended    = myRegs.filter(r => r.attendance_marked).length;
  const totalSpent  = myRegs.reduce((s, r) => s + (r.amount || 0), 0);
  const firstName   = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-inner">
          <h2>Welcome back, {firstName}! 👋</h2>
          <p>
            {isAdmin
              ? 'Manage events, approve admins, and track registrations.'
              : `You have ${myRegs.length} registration${myRegs.length !== 1 ? 's' : ''}. Keep exploring!`}
          </p>
          <div className="dash-hero-actions">
            <button className="btn btn-gold" onClick={() => navigate('/events')}>
              <i className="bi bi-calendar-event" /> Browse Events
            </button>
            {isAdmin && (
              <button className="btn btn-outline" onClick={() => navigate('/admin')}>
                <i className="bi bi-shield-check" /> Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {isAdmin ? (
        <div className="stat-grid">
          <StatCard value={stats.totalEvents}   label="Active Events"   icon="bi-calendar-event" cls="sc-blue" delay={0}   />
          <StatCard value={stats.totalStudents} label="Students"        icon="bi-people"         cls="sc-teal" delay={80}  />
          <StatCard value={stats.totalRegs}     label="Registrations"   icon="bi-check-circle"   cls="sc-gold" delay={160} />
          <StatCard value={stats.totalRevenue}  label="Revenue (₹)"     icon="bi-cash-stack"     cls="sc-rose" delay={240} prefix="₹" />
        </div>
      ) : (
        <div className="stat-grid">
          <StatCard value={myRegs.length} label="Registered Events" icon="bi-calendar-check" cls="sc-blue" delay={0}   />
          <StatCard value={attended}      label="Events Attended"   icon="bi-check-circle"   cls="sc-teal" delay={80}  />
          <StatCard value={events.length} label="Available Events"  icon="bi-calendar-event" cls="sc-gold" delay={160} />
          <StatCard value={totalSpent}    label="Total Spent (₹)"   icon="bi-cash"           cls="sc-rose" delay={240} prefix="₹" />
        </div>
      )}

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Upcoming events */}
        <div>
          <div className="section-header">
            <div className="section-title">Upcoming Events</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/events')}>
              View all <i className="bi bi-arrow-right" />
            </button>
          </div>

          {events.length === 0 ? (
            <EmptyState icon="bi-calendar-x" title="No upcoming events" sub="Check back soon!" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.slice(0, 5).map(ev => (
                <div
                  key={ev.id}
                  className="card card-body"
                  style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => navigate('/events')}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${ev.schools?.color || '#3b6eff'}22`,
                    border:     `1px solid ${ev.schools?.color || '#3b6eff'}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', flexShrink: 0,
                  }}>
                    <i className="bi bi-calendar2-event" style={{ color: ev.schools?.color || 'var(--blue)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.95rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      <i className="bi bi-geo-alt" style={{ marginRight: 4 }} />{ev.venue || 'TBD'}
                      <span style={{ margin: '0 8px' }}>·</span>
                      <i className="bi bi-calendar3" style={{ marginRight: 4 }} />{fmtDate(ev.date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gold)' }}>
                      {ev.fee === 0 ? 'Free' : fmtCurrency(ev.fee)}
                    </div>
                    {daysLeft(ev.date) > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>
                        {daysLeft(ev.date)}d left
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chart */}
          {!isAdmin && myRegs.length > 0 && (
            <div className="card card-body">
              <div className="form-section-title">Registration Activity</div>
              <RegistrationChart regs={myRegs} />
            </div>
          )}

          {/* Quick links */}
          <div className="card card-body">
            <div className="form-section-title">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Browse All Events', icon: 'bi-grid', path: '/events',    color: 'var(--blue)'  },
                { label: 'My Registrations',  icon: 'bi-bookmark-check', path: '/my-events', color: 'var(--teal)'  },
                { label: 'My Profile',        icon: 'bi-person-circle', path: '/profile', color: 'var(--rose)'  },
              ].map(({ label, icon, path, color }) => (
                <button
                  key={label}
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start', gap: 12, textAlign: 'left' }}
                  onClick={() => navigate(path)}
                >
                  <i className={`bi ${icon}`} style={{ color, fontSize: '1rem', width: 20 }} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent registrations (student) */}
          {!isAdmin && myRegs.slice(0, 3).map(r => (
            <div key={r.id} className="card card-body" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 4 }}>
                    {r.events?.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {fmtDate(r.registered_at)}
                  </div>
                </div>
                <span className={`badge ${r.attendance_marked ? 'badge-green' : 'badge-blue'}`}>
                  {r.attendance_marked ? 'Attended' : 'Registered'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
