const express = require('express');
const listEndpoints = require('express-list-endpoints');

console.log('🔍 Finding exact listEndpoints error...\n');

const app = express();

try {
  // Load routes one by one and test listEndpoints after each
  console.log('1. Loading users routes...');
  app.use('/api/users', require('./routes/users'));
  let endpoints = listEndpoints(app);
  console.log(`   ✅ Users: ${endpoints.length} endpoints`);

  console.log('2. Loading employees routes...');
  app.use('/api/employees', require('./routes/employees'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Employees: ${endpoints.length} endpoints`);

  console.log('3. Loading claims routes...');
  app.use('/api/claims', require('./routes/claims'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Claims: ${endpoints.length} endpoints`);

  console.log('4. Loading payments routes...');
  app.use('/api/payments', require('./routes/payments'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Payments: ${endpoints.length} endpoints`);

  console.log('5. Loading admin routes...');
  app.use('/api/admin', require('./routes/admin'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Admin: ${endpoints.length} endpoints`);

  console.log('6. Loading auth routes...');
  app.use('/api/auth', require('./routes/auth'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Auth: ${endpoints.length} endpoints`);

  console.log('7. Loading surveyors routes...');
  app.use('/api/surveyors', require('./routes/surveyors'));
  endpoints = listEndpoints(app);
  console.log(`   ✅ Surveyors: ${endpoints.length} endpoints`);

  console.log('\n✨ All routes work with listEndpoints!');
  
} catch (error) {
  console.log('\n💥 CRASHED during listEndpoints:');
  console.log(`   Error: ${error.message}`);
  console.log(`\n🚨 The error occurred after loading the last route shown above`);
  process.exit(1);
}