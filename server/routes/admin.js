const express = require('express');
const User = require('../models/User');
const { protect, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/users - Admin-only list of all users
router.get('/users', protect, requireAdmin, async (_req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    return res.json({ users: users.map((u) => u.toSafeJSON()) });
  } catch (err) {
    console.error('Admin list users error:', err);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/approve/:id - Admin-only club member approval toggle/set
router.patch('/approve/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { isApproved } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = typeof isApproved === 'boolean' ? isApproved : true;
    await user.save();

    return res.json({
      user: user.toSafeJSON(),
      message: user.isApproved ? 'Club member approved' : 'Club member approval revoked',
    });
  } catch (err) {
    console.error('Admin approve error:', err);
    return res.status(500).json({ message: 'Failed to update approval status' });
  }
});

module.exports = router;
