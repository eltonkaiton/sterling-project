const fs = require('fs');
const path = require('path');

console.log('🔍 Checking all route files for malformed parameters...\n');

const routeFiles = [
  'routes/users.js',
  'routes/employees.js',
  'routes/claims.js', 
  'routes/payments.js',
  'routes/admin.js',
  'routes/auth.js',
  'routes/surveyors.js'
];

routeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📁 ${file}:`);
    
    lines.forEach((line, index) => {
      // Look for route definitions with parameters
      if (line.includes('router.') && line.includes('/:')) {
        console.log(`   Line ${index + 1}: ${line.trim()}`);
        
        // Check for malformed parameters
        const malformedPatterns = [
          /\/:\s/,       // colon followed by space
          /\/:\/[^a-z]/, // colon then slash then non-letter
          /\/:$/,        // just colon at end
          /\/:\s*\//,    // colon then space then slash
        ];
        
        malformedPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            console.log(`   🚨 MALFORMED ROUTE DETECTED: "${line.trim()}"`);
          }
        });
      }
    });
    
  } catch (error) {
    console.log(`❌ Error reading ${file}: ${error.message}`);
  }
});