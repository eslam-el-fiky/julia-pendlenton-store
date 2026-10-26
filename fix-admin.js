
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function fixAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env'
    );
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const passwordHash = await bcrypt.hash(password, 12);

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: 'Store Admin',
        email,
        passwordHash,
        role: 'admin'
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true
    }
  );

  console.log('Admin account updated successfully.');
}

fixAdmin()
  .catch(console.error)
  .finally(async () => {
    await mongoose.disconnect();
  });

