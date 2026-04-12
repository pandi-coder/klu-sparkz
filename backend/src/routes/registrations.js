const router   = require('express').Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── REGISTER FOR EVENT ───────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { event_id, payment_mode, transaction_id, team_name, team_members } = req.body;

  try {
    // Get event details
    const { data: event, error: evErr } = await supabase
      .from('events').select('*').eq('id', event_id).single();
    if (evErr || !event)
      return res.status(404).json({ success: false, message: 'Event not found' });

    // Check deadline
    if (event.deadline && new Date(event.deadline) < new Date())
      return res.status(400).json({ success: false, message: 'Registration deadline passed' });

    // Check capacity
    if (event.registered_count >= event.max_participants)
      return res.status(400).json({ success: false, message: 'Event is full' });

    // Check already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('student_id', req.user.id)
      .single();

    if (existing)
      return res.status(409).json({ success: false, message: 'Already registered for this event' });

    const isFree = event.fee === 0;
    const { data: reg, error: regErr } = await supabase
      .from('registrations').insert({
        event_id,
        student_id:     req.user.id,
        payment_status: isFree ? 'Free' : 'Paid',
        payment_mode:   isFree ? 'Free' : (payment_mode || 'UPI'),
        amount:         event.fee,
        transaction_id: transaction_id || null,
        team_name:      team_name || null,
        team_members:   team_members || null,
      }).select().single();

    if (regErr) throw regErr;

    // Increment registered_count
    await supabase.rpc('increment_event_count', { event_id });

    // Send notification to student
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      message: `You have successfully registered for "${event.title}"! 🎉`,
      type: 'success',
    });

    res.status(201).json({ success: true, data: reg, message: 'Registered successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MY REGISTRATIONS ─────────────────────────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events(id, title, date, venue, fee, category, banner_url,
          schools(name, short_name, color))
      `)
      .eq('student_id', req.user.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CANCEL REGISTRATION ──────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: reg, error: fetchErr } = await supabase
      .from('registrations').select('*').eq('id', req.params.id).single();

    if (fetchErr || !reg)
      return res.status(404).json({ success: false, message: 'Registration not found' });

    if (reg.student_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const { error } = await supabase
      .from('registrations').delete().eq('id', req.params.id);
    if (error) throw error;

    // Decrement count
    await supabase
      .from('events')
      .update({ registered_count: supabase.rpc('decrement', { x: 1 }) })
      .eq('id', reg.event_id);

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ALL REGISTRATIONS (Admin) ────────────────────────────────────────────────
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events(id, title, date),
        users!student_id(id, name, email, department, year)
      `)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
