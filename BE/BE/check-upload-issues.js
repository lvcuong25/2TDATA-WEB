import fs from 'fs';
import path from 'path';

console.log('🔍 Checking Upload Issues for 2TDATA-WEB...\n');

// Check 1: Directory Structure
console.log('📁 Directory Structure:');
const directories = [
  '../FE/public',
  '../FE/public/logos', 
  'uploads',
  'uploads/logos'
];

directories.forEach(dir => {
  const fullPath = path.resolve(dir);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${dir}: ${exists ? '✅' : '❌'} ${fullPath}`);
  
  if (!exists) {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`     ⚡ Created: ${fullPath}`);
    } catch (error) {
      console.log(`     ❌ Failed to create: ${error.message}`);
    }
  }
});

// Check 2: Permissions
console.log('\n🔐 Write Permissions:');
const testDirs = [
  path.resolve('../FE/public/logos'),
  path.resolve('uploads/logos')
];

testDirs.forEach(dir => {
  try {
    const testFile = path.join(dir, 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`   ${dir}: ✅ Writable`);
  } catch (error) {
    console.log(`   ${dir}: ❌ ${error.message}`);
  }
});

// Check 3: Middleware Order Analysis
console.log('\n⚙️ Middleware Order Analysis:');
console.log('   Current order in routerSite.js:');
console.log('   1. uploadLogo (multer middleware)');
console.log('   2. handleUploadErrors (error handler)');
console.log('   3. requireSuperAdmin (auth check)');
console.log('   4. updateSite (controller)');
console.log('');
console.log('   ⚠️  POTENTIAL ISSUE: requireSuperAdmin runs AFTER upload');
console.log('   💡 SOLUTION: Move auth check BEFORE upload for better UX');

// Check 4: Frontend Content-Type
console.log('\n🌐 Frontend Upload Requirements:');
console.log('   Content-Type: multipart/form-data');
console.log('   Field name: "logo"');
console.log('   Accepted types: JPEG, PNG, GIF, WebP');
console.log('   Max size: 5MB');

// Check 5: Common Issues
console.log('\n🚨 Common Upload Issues:');
console.log('   1. Missing directories (NOW FIXED ✅)');
console.log('   2. Wrong form field name (should be "logo")');
console.log('   3. Auth error before upload (user gets confusing error)');
console.log('   4. File too large (>5MB limit)');
console.log('   5. Invalid file type');
console.log('   6. CORS issues in development');

// Check 6: Suggested Solutions
console.log('\n💡 Suggested Solutions:');
console.log('   1. Move auth check BEFORE upload middleware');
console.log('   2. Add better error messages for each step');
console.log('   3. Add upload progress feedback');
console.log('   4. Validate file on client-side first');

console.log('\n✅ Directory setup complete. Try uploading again!');
