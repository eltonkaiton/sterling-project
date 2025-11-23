const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ CORS configuration
const allowedOrigins = [
  'https://sterling-admin2.onrender.com',
  'http://localhost:5173',
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/surveyors', require('./routes/surveyors'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 
  'mongodb+srv://eltonkaiton_db_user:GO6IUvwUYFnG4QPs@cluster0.gexh9uo.mongodb.net/Sterling-Database?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => console.log('❌ DB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('✅ All routes loaded successfully');
  console.log('🌐 Health check: http://localhost:' + PORT + '/health');
  console.log('📋 API endpoints available at:');
  console.log('   - /api/users');
  console.log('   - /api/employees'); 
  console.log('   - /api/claims');
  console.log('   - /api/payments');
  console.log('   - /api/admin');
  console.log('   - /api/auth');
  console.log('   - /api/surveyors');
  console.log('\n🔧 Server is ready to handle requests!');
});