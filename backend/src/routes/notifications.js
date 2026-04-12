// notifications.js
const router   = require('express').Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications').update({ read: true })
      .eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
