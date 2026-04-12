const router   = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── GET ALL EVENTS ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { school_id, department, category, search, page = 1, limit = 20 } = req.query;
    const from = (page - 1) * limit;
    const to   = from + parseInt(limit) - 1;

    let q = supabase
      .from('events')
      .select(`
        *,
        schools(id, name, short_name, color),
        users!created_by(id, name)
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('date', { ascending: true })
      .range(from, to);

    if (school_id)  q = q.eq('school_id', school_id);
    if (department) q = q.eq('department', department);
    if (category)   q = q.eq('category', category);
    if (search)     q = q.ilike('title', `%${search}%`);

    const { data, error, count } = await q;
    if (error) throw error;

    res.json({ success: true, data, count, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET SINGLE EVENT ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`*, schools(id, name, short_name, color), users!created_by(id, name)`)
      .eq('id', req.params.id)
      .single();

    if (error || !data)
      return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CREATE EVENT (Admin) ─────────────────────────────────────────────────────
router.post('/', authenticate, requireAdmin, [
  body('title').trim().notEmpty(),
  body('date').isISO8601(),
  body('school_id').isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const payload = {
      ...req.body,
      created_by: req.user.id,
      registered_count: 0,
    };

    const { data, error } = await supabase
      .from('events').insert(payload).select().single();
    if (error) throw error;

    res.status(201).json({ success: true, data, message: 'Event created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE EVENT (Admin) ─────────────────────────────────────────────────────
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data, message: 'Event updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE EVENT (Admin) ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('events').update({ is_active: false }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET REGISTRATIONS FOR EVENT (Admin) ─────────────────────────────────────
router.get('/:id/registrations', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`*, users!student_id(id, name, email, phone, department, year)`)
      .eq('event_id', req.params.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── MARK ATTENDANCE (Admin) ──────────────────────────────────────────────────
router.patch('/:id/attendance/:regId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .update({ attendance_marked: req.body.attended })
      .eq('id', req.params.regId)
      .eq('event_id', req.params.id)
      .select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
