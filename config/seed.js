require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserModel = require('../src/apps/models/user');
const { ROLES } = require('../src/constants/user_constants');
const connectDB = require('./database');
const { hashPassword } = require('../src/utils/password');

const seedUser = async () => {
  try {
    await connectDB();

    const email = 'admin@gmail.com';
    const existingAdmin = await UserModel.findOne({ email });

    if (existingAdmin) {
      return;
    }

    const hashedPassword = await hashPassword('Admin@123');

    const admin = new UserModel({
      full_name: 'Admin',
      email,
      password: hashedPassword,
      role: ROLES.ADMIN,
    });

    await admin.save();
    console.log('✅ Admin user seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected.');
  }
};

seedUser();
