const fs = require('fs');
const path = require('path');

console.log('🔍 Scanning ALL route files for malformed parameters...\n');

const routeFiles = [
  'routes/users.js',
  'routes/employees.js',
  'routes/claims.js',
  'routes/payments.js',
  'routes/admin.js',
  'routes/auth.js',
  'routes/surveyors.js'
];

let foundIssues = false;

routeFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n📁 ${file}:`);
    
    lines.forEach((line, index) => {
      // Look for ALL route definitions
      if (line.includes('router.') && (line.includes("'/") || line.includes('"/'))) {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();
        
        // Check for various malformed patterns
        const malformedPatterns = [
          { pattern: /\/:\s/, description: 'Space after colon' },
          { pattern: /\/:\/[^a-zA-Z]/, description: 'Colon then slash then non-letter' },
          { pattern: /\/:$/, description: 'Just colon at end' },
          { pattern: /\/:\s*\//, description: 'Colon then space then slash' },
          { pattern: /router\.\w+\(\s*["']\s*\/:[^a-zA-Z_]/, description: 'Invalid parameter name' },
          { pattern: /router\.\w+\(\s*["']\s*\/:\s/, description: 'Space in parameter' }
        ];
        
        malformedPatterns.forEach(({ pattern, description }) => {
          if (pattern.test(line)) {
            console.log(`   🚨 Line ${lineNumber}: ${description}`);
            console.log(`       "${trimmedLine}"`);
            foundIssues = true;
          }
        });
        
        // Also check for valid routes to confirm good ones
        if (line.includes('/:') && !foundIssues) {
          const validMatch = line.match(/router\.\w+\(\s*["']([^"']+)["']/);
          if (validMatch) {
            console.log(`   ✅ Line ${lineNumber}: Valid route: ${validMatch[1]}`);
          }
        }
      }
    });
    
  } catch (error) {
    console.log(`❌ Error reading ${file}: ${error.message}`);
  }
});

if (!foundIssues) {
  console.log('\n✨ No malformed routes found in file scanning.');
  console.log('The issue might be in how routes are combined.');
}