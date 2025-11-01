#!/usr/bin/env node

/**
 * Auto-Deploy Script
 * Automates the deployment preparation process
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('\n🚀 AUTO-DEPLOY SCRIPT');
console.log('====================\n');

// Step 1: Check prerequisites
console.log('📋 Step 1: Checking prerequisites...');
const checks = {
  node: checkCommand('node --version', 'Node.js'),
  git: checkCommand('git --version', 'Git'),
  npm: checkCommand('npm --version', 'npm')
};

function checkCommand(cmd, name) {
  try {
    const version = execSync(cmd, { encoding: 'utf8' }).trim();
    console.log(`   ✅ ${name}: ${version}`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${name}: Not found`);
    return false;
  }
}

if (!checks.node || !checks.git || !checks.npm) {
  console.log('\n❌ Prerequisites not met. Please install missing tools.');
  process.exit(1);
}

// Step 2: Install dependencies
console.log('\n📦 Step 2: Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('   ✅ Dependencies installed');
} catch (error) {
  console.log('   ❌ Failed to install dependencies');
  process.exit(1);
}

// Step 3: Check Git repository
console.log('\n📦 Step 3: Checking Git repository...');
const isGitRepo = fs.existsSync('.git');
if (!isGitRepo) {
  console.log('   ⚠️  Not a Git repository. Initializing...');
  try {
    execSync('git init', { stdio: 'inherit' });
    console.log('   ✅ Git repository initialized');
  } catch (error) {
    console.log('   ❌ Failed to initialize Git');
  }
}

// Check remote
try {
  const remotes = execSync('git remote -v', { encoding: 'utf8' });
  if (remotes.trim()) {
    console.log('   ✅ Remote repository configured');
    console.log(`   ${remotes.split('\n')[0]}`);
  } else {
    console.log('   ⚠️  No remote repository configured');
    console.log('   💡 Run: git remote add origin <your-github-url>');
  }
} catch (error) {
  console.log('   ⚠️  Could not check remote');
}

// Step 4: Generate session secret
console.log('\n🔐 Step 4: Generating session secret...');
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('   ✅ Session Secret generated:');
console.log(`   ${sessionSecret}`);
console.log('\n   💡 IMPORTANT: Add this to your deployment platform as SESSION_SECRET');

// Step 5: Check environment setup
console.log('\n🔧 Step 5: Checking environment setup...');
const envExists = fs.existsSync('.env');
if (envExists) {
  console.log('   ⚠️  .env file exists (make sure it\'s in .gitignore)');
} else {
  console.log('   ✅ No .env file (good for deployment)');
}

// Check .gitignore
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    console.log('   ✅ .env is in .gitignore');
  } else {
    console.log('   ⚠️  Adding .env to .gitignore');
    fs.appendFileSync('.gitignore', '\n.env\n');
  }
} else {
  console.log('   ⚠️  Creating .gitignore');
  fs.writeFileSync('.gitignore', 'node_modules/\n.env\n.env.local\nuploads/*\n.gitkeep\n');
}

// Step 6: Prepare Git commit
console.log('\n📝 Step 6: Preparing for Git commit...');
try {
  execSync('git add .', { stdio: 'inherit' });
  console.log('   ✅ Files staged');
  
  // Check if there are changes
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('   💡 Ready to commit. Run:');
      console.log('      git commit -m "Ready for deployment"');
      console.log('      git push origin main');
    } else {
      console.log('   ✅ No changes to commit');
    }
  } catch (error) {
    console.log('   ⚠️  Could not check git status');
  }
} catch (error) {
  console.log('   ⚠️  Could not stage files');
}

// Step 7: Deployment checklist
console.log('\n📋 Step 7: Deployment Checklist');
console.log('   Environment Variables Needed:');
console.log('   ────────────────────────────');
const envVars = [
  { name: 'NODE_ENV', value: 'production', required: true },
  { name: 'PORT', value: '10000 (Render) or 5000 (others)', required: true },
  { name: 'BASE_URL', value: 'https://proeduvate.onrender.com', required: true },
  { name: 'MONGODB_URI', value: 'your-mongodb-connection-string', required: true },
  { name: 'LOGIN_USERNAME', value: 'Login@proEduvate', required: true },
  { name: 'LOGIN_PASSWORD', value: 'Pass@proEduvate', required: true },
  { name: 'SESSION_SECRET', value: sessionSecret, required: true },
  { name: 'ALLOWED_ORIGINS', value: 'https://proeduvate.onrender.com', required: true },
  { name: 'MAX_FILE_SIZE', value: '5242880', required: false },
  { name: 'MAX_FILES', value: '10', required: false }
];

envVars.forEach(({ name, value, required }) => {
  const marker = required ? '✓' : '○';
  console.log(`   ${marker} ${name}=${value}`);
});

// Step 8: Next steps
console.log('\n🎯 Step 8: Next Steps');
console.log('   ──────────────────');
console.log('   1. ✅ Code prepared (you are here)');
console.log('   2. 📤 Push to GitHub:');
console.log('      git commit -m "Ready for deployment"');
console.log('      git push origin main');
console.log('   3. 🌐 Sign up at render.com');
console.log('   4. 🔗 Create Web Service and connect GitHub repo');
console.log('   5. ⚙️  Add environment variables (see above)');
console.log('   6. 🚀 Deploy and wait 5-10 minutes');
console.log('   7. ✅ Test your live app!');

console.log('\n📚 For detailed instructions, see:');
console.log('   • RENDER_DEPLOYMENT.md - Step-by-step guide');
console.log('   • FREE_DEPLOYMENT_GUIDE.md - All options');
console.log('   • DEPLOYMENT_QUICK_START.md - Quick reference');

console.log('\n✅ Auto-deploy preparation complete!');
console.log('🎉 Your app is ready for deployment!\n');

