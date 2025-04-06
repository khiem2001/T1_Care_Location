const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connect MongoDB Success!');
  } catch (error) {
    console.error('❌ Error Connect MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
