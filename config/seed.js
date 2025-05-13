require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./database');
const UserModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/password');
const { ROLES } = require('../utils/constants');

const seedUser = async () => {
  try {
    await connectDB();

    const email = 'admin2@gmail.com';
    const phone = '0968933815';

    const existingAdmin = await UserModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingAdmin) {
      console.log('⚠️ Admin with same email or phone already exists.');
      return;
    }

    const hashedPassword = await hashPassword('Admin@123');

    const admin = new UserModel({
      full_name: 'Admin2',
      email,
      phone,
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
