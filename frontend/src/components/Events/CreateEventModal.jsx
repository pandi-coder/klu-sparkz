import { useState } from 'react';
import { Modal } from '../common/index.jsx';
import { eventsApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export default function CreateEventModal({ schools, onClose, onCreated }) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', school_id: '', department: '', category: 'Cultural',
    date: '', deadline: '', venue: '', max_participants: 100, fee: 0,
    prize: '', coordinator_name: '', coordinator_phone: '', rules: '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await eventsApi.create({
        ...form,
        fee:              Number(form.fee),
        max_participants: Number(form.max_participants),
      });
      onCreated();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create event', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const selectedSchool = schools.find(s => s.id === form.school_id);
  const depts = selectedSchool?.departments || [];

  return (
    <Modal
      title="Create New Event"
      onClose={onClose}
      maxWidth={700}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="spinner-ring sm" />
              : <><i className="bi bi-plus-lg" /> Create Event</>}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-section-title">Event Details</div>

        <div className="form-group">
          <label>Event Title *</label>
          <input className="form-control" value={form.title} onChange={set('title')} placeholder="e.g. Battle of Bands" required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" value={form.description} onChange={set('description')} placeholder="Describe the event..." rows={3} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>School *</label>
            <select className="form-control" value={form.school_id} onChange={set('school_id')} required>
              <option value="">Select school</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <select className="form-control" value={form.department} onChange={set('department')}>
              <option value="">Select department</option>
              {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={form.category} onChange={set('category')}>
              {['Cultural','Technical','Sports','Academic','Workshop'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Venue</label>
            <input className="form-control" value={form.venue} onChange={set('venue')} placeholder="e.g. Main Auditorium" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date & Time *</label>
            <input className="form-control" type="datetime-local" value={form.date} onChange={set('date')} required />
          </div>
          <div className="form-group">
            <label>Registration Deadline</label>
            <input className="form-control" type="datetime-local" value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Max Participants</label>
            <input className="form-control" type="number" value={form.max_participants} onChange={set('max_participants')} min={1} />
          </div>
          <div className="form-group">
            <label>Entry Fee (₹)</label>
            <input className="form-control" type="number" value={form.fee} onChange={set('fee')} min={0} />
          </div>
        </div>

        <div className="form-section-title" style={{ marginTop:8 }}>Coordinator & Prize</div>

        <div className="form-row">
          <div className="form-group">
            <label>Coordinator Name</label>
            <input className="form-control" value={form.coordinator_name} onChange={set('coordinator_name')} />
          </div>
          <div className="form-group">
            <label>Coordinator Phone</label>
            <input className="form-control" value={form.coordinator_phone} onChange={set('coordinator_phone')} />
          </div>
        </div>

        <div className="form-group">
          <label>Prize Details</label>
          <input className="form-control" value={form.prize} onChange={set('prize')} placeholder="e.g. 1st: ₹10,000 · 2nd: ₹5,000" />
        </div>

        <div className="form-group">
          <label>Rules & Guidelines</label>
          <textarea className="form-control" value={form.rules} onChange={set('rules')} rows={4} placeholder="List the event rules..." />
        </div>
      </form>
    </Modal>
  );
}
