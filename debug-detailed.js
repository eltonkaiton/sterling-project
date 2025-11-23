const express = require('express');
const listEndpoints = require('express-list-endpoints');

console.log('🔍 Detailed route analysis...\n');

const app = express();

// Load routes one by one with detailed logging
const routeLoaders = [
  { name: 'users', loader: () => app.use('/api/users', require('./routes/users')) },
  { name: 'employees', loader: () => app.use('/api/employees', require('./routes/employees')) },
  { name: 'claims', loader: () => app.use('/api/claims', require('./routes/claims')) },
  { name: 'payments', loader: () => app.use('/api/payments', require('./routes/payments')) },
  { name: 'admin', loader: () => app.use('/api/admin', require('./routes/admin')) },
  { name: 'auth', loader: () => app.use('/api/auth', require('./routes/auth')) },
  { name: 'surveyors', loader: () => app.use('/api/surveyors', require('./routes/surveyors')) }
];

let loadedRoutes = [];

routeLoaders.forEach((route, index) => {
  try {
    console.log(`\n${index + 1}. Loading ${route.name} routes...`);
    route.loader();
    loadedRoutes.push(route.name);
    
    // Test listEndpoints after each route
    const currentEndpoints = listEndpoints(app);
    console.log(`   ✅ ${route.name} loaded successfully`);
    console.log(`   📊 Total endpoints so far: ${currentEndpoints.length}`);
    
  } catch (error) {
    console.log(`\n💥 CRASHED while loading ${route.name}:`);
    console.log(`   Error: ${error.message}`);
    console.log(`\n🚨 THE PROBLEMATIC FILE IS: routes/${route.name}.js`);
    console.log(`\n📋 Routes loaded successfully before crash: ${loadedRoutes.join(', ')}`);
    
    // Show the exact error location
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      console.log('\n🔍 Error stack:');
      stackLines.slice(0, 5).forEach(line => console.log(`   ${line}`));
    }
    
    process.exit(1);
  }
});

console.log('\n✨ All routes loaded successfully!');
console.log(`📊 Final endpoint count: ${listEndpoints(app).length}`);