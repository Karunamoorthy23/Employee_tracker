#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Checks and prepares your app for deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Preparing for deployment...\n');

// Check 1: Package.json exists
console.log('📦 Checking package.json...');
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found!');
  process.exit(1);
}
console.log('✅ package.json found');

// Check 2: server.js exists
console.log('📄 Checking server.js...');
if (!fs.existsSync('server.js')) {
  console.error('❌ server.js not found!');
  process.exit(1);
}
console.log('✅ server.js found');

// Check 3: Public directory exists
console.log('📁 Checking public directory...');
if (!fs.existsSync('public')) {
  console.error('❌ public directory not found!');
  process.exit(1);
}
console.log('✅ public directory found');

// Check 4: Generate session secret if needed
console.log('\n🔐 Generating session secret...');
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('✅ Session Secret generated:');
console.log(`   ${sessionSecret}`);
console.log('\n💡 Add this to your deployment platform as SESSION_SECRET');

// Check 5: Check for .env file (should not be committed)
console.log('\n🔒 Checking .env file...');
if (fs.existsSync('.env')) {
  console.log('⚠️  .env file exists - make sure it\'s in .gitignore');
} else {
  console.log('✅ No .env file (good for deployment)');
}

// Check 6: Verify .gitignore
console.log('\n📋 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignore.includes('.env')) {
    console.log('⚠️  .env not in .gitignore - should add it');
  } else {
    console.log('✅ .env is in .gitignore');
  }
} else {
  console.log('⚠️  .gitignore not found');
}

// Check 7: MongoDB connection string format
console.log('\n🗄️  MongoDB Connection Checklist:');
console.log('   □ MongoDB Atlas account created');
console.log('   □ Database user created');
console.log('   □ IP address whitelisted (0.0.0.0/0 for all)');
console.log('   □ Connection string ready');

// Check 8: Required environment variables
console.log('\n📝 Required Environment Variables:');
const requiredVars = [
  'NODE_ENV=production',
  'PORT=10000 (Render) or PORT=5000 (others)',
  'BASE_URL=https://proeduvate.onrender.com',
  'MONGODB_URI=your-mongodb-connection-string',
  'LOGIN_USERNAME=Login@proEduvate',
  'LOGIN_PASSWORD=Pass@proEduvate',
  'SESSION_SECRET=generated-above',
  'ALLOWED_ORIGINS=https://proeduvate.onrender.com'
];

requiredVars.forEach(v => console.log(`   • ${v}`));

console.log('\n✅ Preparation complete!');
console.log('\n📚 Next steps:');
console.log('   1. Push code to GitHub: git push origin main');
console.log('   2. Sign up at render.com');
console.log('   3. Create new Web Service');
console.log('   4. Connect your GitHub repository');
console.log('   5. Add environment variables listed above');
console.log('   6. Deploy!');
console.log('\n🎉 Your app is ready for deployment!');

