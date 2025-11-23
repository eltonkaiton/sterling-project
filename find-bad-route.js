const express = require('express');
const app = express();

console.log('🔍 Finding problematic route...\n');

const routes = [
  './routes/users',
  './routes/employees', 
  './routes/claims',
  './routes/payments',
  './routes/admin',
  './routes/auth',
  './routes/surveyors'
];

routes.forEach(routePath => {
  try {
    const router = require(routePath);
    // Try to use listEndpoints on just this router
    const endpoints = require('express-list-endpoints')(router);
    console.log(`✅ ${routePath}: ${endpoints.length} routes OK`);
  } catch (error) {
    console.log(`❌ ${routePath}: ${error.message}`);
    console.log(`🚨 THIS IS THE PROBLEMATIC FILE: ${routePath}`);
    
    // Show more details about the error
    if (error.message.includes('path-to-regexp')) {
      console.log('💡 Look for malformed route parameters like:');
      console.log('   - router.patch(\'/:/status\')');
      console.log('   - router.patch(\'/ :/action\')');
      console.log('   - router.patch(\'/users:/update\')');
    }
  }
});

console.log('\n✨ Route analysis complete!');