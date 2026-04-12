const router   = require('express').Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select(`*, users!user_id(id,name,department,year,avatar_url), events!event_id(id,title)`)
      .order('points', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard').upsert(req.body, { onConflict: 'user_id,event_id' }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
