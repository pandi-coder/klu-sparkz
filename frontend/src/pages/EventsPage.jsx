import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, registrationsApi, schoolsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useApp }  from '../context/AppContext';
import { Modal, Spinner, EmptyState } from '../components/common/index.jsx';
import CreateEventModal from '../components/Events/CreateEventModal';
import EventDetailModal from '../components/Events/EventDetailModal';
import PaymentModal     from '../components/Events/PaymentModal';

const CAT = ['All', 'Cultural', 'Technical', 'Sports', 'Academic', 'Workshop'];

const fmtDate     = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtCurrency = (n) => n === 0 ? 'Free' : '₹' + Number(n).toLocaleString('en-IN');
const daysLeft    = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000);
const pct         = (n, max) => Math.min(100, Math.round((n / max) * 100));

function EventCard({ event, myRegIds, onSelect }) {
  const registered = myRegIds.includes(event.id);
  const full       = event.registered_count >= event.max_participants;
  const dl         = daysLeft(event.deadline || event.date);
  const isPast     = dl < 0;

  const barColor = pct(event.registered_count, event.max_participants) > 80
    ? 'var(--rose)' : 'var(--green)';

  return (
    <div className="event-card" onClick={() => onSelect(event)}>
      <div className="event-card-header">
        {event.schools && (
          <div
            className="event-school-badge"
            style={{
              background: `${event.schools.color || '#3b6eff'}22`,
              color:       event.schools.color || 'var(--blue)',
              border:      `1px solid ${event.schools.color || '#3b6eff'}33`,
            }}
          >
            <i className="bi bi-building" />
            {event.schools.short_name}
          </div>
        )}
        <div className="event-title">{event.title}</div>
        <div className="event-desc">{event.description}</div>
        <div className="event-meta">
          <span className="event-meta-item">
            <i className="bi bi-calendar3" />
            {fmtDate(event.date)}
          </span>
          {event.venue && (
            <span className="event-meta-item">
              <i className="bi bi-geo-alt" />{event.venue}
            </span>
          )}
          {event.department && (
            <span className="event-meta-item">
              <i className="bi bi-diagram-3" />{event.department}
            </span>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 5 }}>
            <span>{event.registered_count} / {event.max_participants} registered</span>
            <span>{pct(event.registered_count, event.max_participants)}%</span>
          </div>
          <div className="capacity-bar">
            <div className="capacity-fill" style={{ width: `${pct(event.registered_count, event.max_participants)}%`, background: barColor }} />
          </div>
        </div>
      </div>

      <div className="event-card-footer">
        <div className="event-fee">{fmtCurrency(event.fee)}</div>
        {registered ? (
          <span className="badge badge-green"><i className="bi bi-check-circle" /> Registered</span>
        ) : full ? (
          <span className="badge badge-rose">Full</span>
        ) : isPast ? (
          <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>Closed</span>
        ) : (
          <span className="badge badge-blue">
            <i className="bi bi-clock" /> {dl}d left
          </span>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { user, isAdmin }              = useAuth();
  const { showToast, triggerConfetti } = useApp();
  const qc = useQueryClient();

  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('All');
  const [schoolFilter,  setSchoolFilter]  = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [paymentEvent,  setPaymentEvent]  = useState(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events', { search, category, schoolFilter }],
    queryFn:  () => eventsApi.list({
      search:    search   || undefined,
      category:  category !== 'All' ? category : undefined,
      school_id: schoolFilter || undefined,
      limit: 50,
    }).then(r => r.data),
  });

  const { data: schoolsData } = useQuery({
    queryKey: ['schools'],
    queryFn:  () => schoolsApi.list().then(r => r.data),
  });

  const { data: myRegsData } = useQuery({
    queryKey: ['my-regs'],
    queryFn:  () => registrationsApi.my().then(r => r.data),
    enabled:  !!user,
  });

  // ── Free event register mutation ──────────────────────────────────────────
  const registerMut = useMutation({
    mutationFn: (eventId) => registrationsApi.create({ event_id: eventId }),
    onSuccess: () => {
      qc.invalidateQueries(['my-regs']);
      qc.invalidateQueries(['events']);
      showToast('Successfully registered! 🎉', 'success');
      triggerConfetti();
      setSelectedEvent(null);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Registration failed', 'danger');
    },
  });

  const events   = eventsData?.data   || [];
  const schools  = schoolsData?.data  || [];
  const myRegIds = (myRegsData?.data  || []).map(r => r.event_id);

  // ── Handle register button click ─────────────────────────────────────────
  const handleRegister = (event) => {
    if (event.fee > 0) {
      // Paid event — show Razorpay payment modal
      setPaymentEvent(event);
      setSelectedEvent(null);
    } else {
      // Free event — register directly
      registerMut.mutate(event.id);
    }
  };

  return (
    <div className="page-enter">
      <div className="section-header">
        <div className="section-title">Browse Events</div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-lg" /> Create Event
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)', fontSize: '0.9rem' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 36 }}
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {CAT.map(c => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        {schools.length > 0 && (
          <select
            className="form-control"
            style={{ width: 180 }}
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
          >
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <Spinner centered />
      ) : events.length === 0 ? (
        <EmptyState icon="bi-calendar-x" title="No events found" sub="Try adjusting your filters" />
      ) : (
        <div className="event-grid">
          {events.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              myRegIds={myRegIds}
              onSelect={setSelectedEvent}
            />
          ))}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isRegistered={myRegIds.includes(selectedEvent.id)}
          onClose={() => setSelectedEvent(null)}
          onRegister={() => handleRegister(selectedEvent)}
          registering={registerMut.isPending}
          isAdmin={isAdmin}
          onDeleted={() => {
            qc.invalidateQueries(['events']);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Create event modal (admin only) */}
      {showCreate && (
        <CreateEventModal
          schools={schools}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries(['events']);
            setShowCreate(false);
            showToast('Event created successfully!', 'success');
          }}
        />
      )}

      {/* Razorpay Payment modal */}
      {paymentEvent && (
        <PaymentModal
          event={paymentEvent}
          onClose={() => setPaymentEvent(null)}
          onSuccess={() => {
            setPaymentEvent(null);
            qc.invalidateQueries(['my-regs']);
            qc.invalidateQueries(['events']);
            triggerConfetti();
            showToast('Payment successful! You are registered 🎉', 'success');
          }}
        />
      )}
    </div>
  );
}