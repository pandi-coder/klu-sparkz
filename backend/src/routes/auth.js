const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['Student', 'Admin']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password, name, phone, role, department, year, gender, dob } = req.body;

  try {
    // Check existing user
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    // Register with Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) throw authErr;

    // Insert into users table
    const isStudent = role === 'Student';
    const { data: user, error: userErr } = await supabase.from('users').insert({
      id:         authData.user.id,
      email,
      name,
      phone:      phone || null,
      role,
      approved:   isStudent,   // Students auto-approved, Admins need approval
      department: department || null,
      year:       year || null,
      gender:     gender || null,
      dob:        dob || null,
    }).select().single();

    if (userErr) throw userErr;

    // If admin, notify super admins
    if (role === 'Admin') {
      const { data: superAdmins } = await supabase
        .from('users').select('id').eq('role', 'SuperAdmin');
      if (superAdmins?.length) {
        const notifRows = superAdmins.map(a => ({
          user_id: a.id,
          message: `New admin registration pending approval: ${name} (${email})`,
          type: 'admin_approval',
        }));
        await supabase.from('notifications').insert(notifRows);
      }
      return res.status(201).json({
        success: true,
        message: 'Admin registration submitted. Awaiting approval.'
      });
    }

    const token = signToken(user);
    res.status(201).json({ success: true, token, user: sanitize(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    // Authenticate via Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // Fetch user profile
    const { data: user, error: userErr } = await supabase
      .from('users').select('*').eq('id', authData.user.id).single();
    if (userErr || !user)
      return res.status(401).json({ success: false, message: 'User not found' });

    if (user.role === 'Admin' && !user.approved)
      return res.status(403).json({ success: false, message: 'Admin account pending approval' });

    const token = signToken(user);
    res.json({ success: true, token, user: sanitize(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users').select('*').eq('id', req.user.id).single();
    res.json({ success: true, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
router.patch('/change-password', authenticate, [
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { newPassword } = req.body;
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });
    if (error) throw error;
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: strip sensitive fields
const sanitize = (u) => {
  const { ...safe } = u;
  return safe;
};

module.exports = router;
