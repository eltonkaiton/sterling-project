const fs = require('fs');

console.log('🔍 Checking route exports and structure...\n');

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
    
    console.log(`\n📁 ${file}:`);
    
    // Check if router is properly exported
    if (!content.includes('module.exports = router') && 
        !content.includes('module.exports =') &&
        !content.includes('export default')) {
      console.log('   ❌ Missing proper router export!');
    } else {
      console.log('   ✅ Has router export');
    }
    
    // Check if express.Router() is used
    if (!content.includes('express.Router()') && !content.includes('express.Router(')) {
      console.log('   ❌ Missing express.Router() initialization');
    } else {
      console.log('   ✅ Uses express.Router()');
    }
    
    // Count route definitions
    const routeMethods = ['router.get', 'router.post', 'router.put', 'router.patch', 'router.delete'];
    let routeCount = 0;
    
    routeMethods.forEach(method => {
      const count = (content.match(new RegExp(method, 'g')) || []).length;
      routeCount += count;
    });
    
    console.log(`   📊 Route methods found: ${routeCount}`);
    
  } catch (error) {
    console.log(`❌ Error reading ${file}: ${error.message}`);
  }
});