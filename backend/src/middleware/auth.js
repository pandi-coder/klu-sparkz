const jwt      = require('jsonwebtoken');
const supabase = require('../config/supabase');

/**
 * Verify JWT from Authorization header
 * Attaches req.user = { id, email, role, approved }
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch latest user from DB to ensure still valid
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, approved')
      .eq('id', decoded.id)
      .single();

    if (error || !user)
      return res.status(401).json({ success: false, message: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success: false, message: 'Token expired' });
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Require Admin or SuperAdmin role
 */
const requireAdmin = (req, res, next) => {
  if (!['Admin', 'SuperAdmin'].includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Admin access required' });
  if (!req.user.approved)
    return res.status(403).json({ success: false, message: 'Admin account not yet approved' });
  next();
};

/**
 * Require SuperAdmin role only
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'SuperAdmin')
    return res.status(403).json({ success: false, message: 'SuperAdmin access required' });
  next();
};

module.exports = { authenticate, requireAdmin, requireSuperAdmin };
