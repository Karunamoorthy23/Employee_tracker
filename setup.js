#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Proeduvate Employee Progress Portal Setup');
console.log('==========================================\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
    console.error('❌ Error: Node.js version 14 or higher is required.');
    console.error(`   Current version: ${nodeVersion}`);
    console.error('   Please update Node.js and try again.');
    process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if MongoDB is available
const { exec } = require('child_process');

exec('mongod --version', (error, stdout, stderr) => {
    if (error) {
        console.log('⚠️  Warning: MongoDB not found in PATH.');
        console.log('   Please ensure MongoDB is installed and running on localhost:27017');
    } else {
        console.log('✅ MongoDB found:', stdout.split('\n')[0]);
    }
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Created uploads directory');
    } else {
        console.log('✅ Uploads directory already exists');
    }
    
    // Check if package.json exists
    const packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
        console.error('❌ Error: package.json not found.');
        console.error('   Please ensure you are in the correct directory.');
        process.exit(1);
    }
    
    console.log('✅ Project files found');
    
    console.log('\n📋 Setup Instructions:');
    console.log('=====================');
    console.log('1. Install dependencies:');
    console.log('   npm install\n');
    
    console.log('2. Configure MongoDB:');
    if (process.env.CLUSTERNAME && process.env.USERNAME && process.env.PASSWORD) {
        console.log('   ✅ Cloud MongoDB configuration detected');
        console.log(`   Cluster: ${process.env.CLUSTERNAME}`);
        console.log(`   Provider: ${process.env.PROVIDER || 'mongodb.net'}`);
    } else if (process.env.MONGODB_URI) {
        console.log('   ✅ MongoDB URI configuration detected');
    } else {
        console.log('   ⚠️  No MongoDB configuration found');
        console.log('   Please set up MongoDB configuration in your .env file');
        console.log('   For local MongoDB: Start MongoDB service');
        console.log('   Windows: mongod');
        console.log('   macOS/Linux: sudo systemctl start mongod');
    }
    console.log('');
    
    console.log('3. Start the application:');
    console.log('   npm start\n');
    
    console.log('4. Access the application:');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001/';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    console.log(`   Employee Form: ${cleanBaseUrl}`);
    console.log(`   Admin Dashboard: ${cleanBaseUrl}/admin\n`);
    
    console.log('🎉 Setup complete! Follow the instructions above to start the application.');
});
