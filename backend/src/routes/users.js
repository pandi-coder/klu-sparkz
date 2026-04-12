const router   = require('express').Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req, res) => {
  const allowed = ['name', 'phone', 'bio', 'dob', 'gender', 'address', 'department', 'year', 'avatar_url'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  try {
    const { data, error } = await supabase
      .from('users').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;
    res.json({ success: true, data, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id,name,email,role,approved,department,year,created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PENDING ADMIN APPROVALS ──────────────────────────────────────────────────
router.get('/pending-admins', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id,name,email,phone,created_at')
      .eq('role', 'Admin').eq('approved', false);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── APPROVE ADMIN ────────────────────────────────────────────────────────────
router.patch('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').update({ approved: true }).eq('id', req.params.id).select().single();
    if (error) throw error;

    // Notify the approved admin
    await supabase.from('notifications').insert({
      user_id: req.params.id,
      message: 'Your admin account has been approved! You can now log in. 🎉',
      type: 'success',
    });

    res.json({ success: true, data, message: 'Admin approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── REJECT ADMIN ─────────────────────────────────────────────────────────────
router.delete('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    await supabase.auth.admin.deleteUser(req.params.id);
    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Admin request rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN DASHBOARD STATS ────────────────────────────────────────────────────
router.get('/dashboard-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [events, regs, users] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('registrations').select('id,amount', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'Student'),
    ]);

    const totalRevenue = (regs.data || []).reduce((s, r) => s + (r.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalEvents:    events.count || 0,
        totalStudents:  users.count  || 0,
        totalRegs:      regs.count   || 0,
        totalRevenue,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
