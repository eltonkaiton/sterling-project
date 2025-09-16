// server.js (or index.js)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const listEndpoints = require('express-list-endpoints'); // ✅ added

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/claims', require('./routes/claims')); // ✅ Claims route
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));

// MongoDB Atlas connection string
const mongoURI =
  'mongodb+srv://eltonkaiton_db_user:GO6IUvwUYFnG4QPs@cluster0.gexh9uo.mongodb.net/Sterling-Database?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => console.log('❌ DB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 🔎 Debug: list all registered routes
  console.table(listEndpoints(app));
});
