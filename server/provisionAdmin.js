const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function provisionAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;

  if (!email || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD together. Use a password of at least 12 characters and at most 72 UTF-8 bytes.');
  }

  await User.init();
  const now = new Date();
  const user = await User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        name: 'Campus Admin',
        passwordHash: await bcrypt.hash(password, 12),
        role: 'admin',
        isApproved: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, new: true, timestamps: false }
  );
  if (user.role !== 'admin') {
    throw new Error('ADMIN_EMAIL belongs to an existing non-admin account. Choose a different email.');
  }
  console.log('Administrator account is ready.');
}

module.exports = { provisionAdmin };
