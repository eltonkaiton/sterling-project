const express = require('express');
const listEndpoints = require('express-list-endpoints');

console.log('🔍 Testing exact crash point...\n');

const app = express();

// Test loading routes WITHOUT listEndpoints first
try {
  console.log('Loading routes without listEndpoints...');
  app.use('/api/users', require('./routes/users'));
  app.use('/api/employees', require('./routes/employees'));
  app.use('/api/claims', require('./routes/claims'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/surveyors', require('./routes/surveyors'));
  console.log('✅ All routes loaded successfully without listEndpoints');
} catch (error) {
  console.log('❌ Error loading routes:', error.message);
  process.exit(1);
}

// Now test listEndpoints
try {
  console.log('\nTesting listEndpoints...');
  const endpoints = listEndpoints(app);
  console.log(`✅ listEndpoints successful! Found ${endpoints.length} endpoints`);
} catch (error) {
  console.log('❌ listEndpoints failed:', error.message);
  console.log('Stack:', error.stack);
}