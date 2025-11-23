console.log('🔍 Checking package versions and environment...\n');

console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());

try {
  const packageJson = require('./package.json');
  console.log('\n📦 Key dependencies:');
  console.log('express:', packageJson.dependencies.express);
  console.log('path-to-regexp:', packageJson.dependencies['path-to-regexp'] || 'Not directly listed');
  
  // Check actual installed versions
  const expressPkg = require('express/package.json');
  const pathToRegexpPkg = require('path-to-regexp/package.json');
  console.log('\n🔧 Actually installed:');
  console.log('express:', expressPkg.version);
  console.log('path-to-regexp:', pathToRegexpPkg.version);
} catch (error) {
  console.log('Error checking packages:', error.message);
}