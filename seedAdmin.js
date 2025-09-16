const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb://localhost:27017/sma_db'; // or your actual DB name

async function seedAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const existingAdmin = await User.findOne({ email: 'admin@example.com' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const admin = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active'
      });

      await admin.save();
      console.log('✅ Admin user created successfully');
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('💥 Error seeding admin user:', err.message);
    process.exit(1);
  }
}

seedAdmin();
