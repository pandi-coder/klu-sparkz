// schools.js
const router   = require('express').Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('schools').select(`*, departments(id, name)`).order('name');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('schools').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/departments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('departments')
      .insert({ school_id: req.params.id, name: req.body.name }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/departments/:deptId', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.from('departments').delete().eq('id', req.params.deptId);
    res.json({ success: true, message: 'Department removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
