#!/usr/bin/env node

// Production Deployment Script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 QPay Shopify Integration - Production Deployment');
console.log('==================================================');

// Check if we're ready for production
function checkPrerequisites() {
  console.log('\n📋 Checking Prerequisites...');
  
  const requiredFiles = [
    '.env',
    'package.json',
    'vercel.json',
    'prisma/schema.prisma'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:', missingFiles.join(', '));
    process.exit(1);
  }
  
  console.log('✅ All required files present');
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n🔧 Checking Environment Variables...');
  
  require('dotenv').config();
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'QPAY_API_URL',
    'QPAY_USERNAME',
    'QPAY_PASSWORD',
    'QPAY_INVOICE_CODE'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Please update your .env file with all required variables');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables present');
}

// Test QPay connection
async function testQPayConnection() {
  console.log('\n🔐 Testing QPay Connection...');
  
  try {
    const { execSync } = require('child_process');
    const result = execSync('node test-qpay-credentials.js', { 
      encoding: 'utf8',
      timeout: 30000
    });
    
    if (result.includes('✅ QPay authentication successful')) {
      console.log('✅ QPay connection working');
      return true;
    } else {
      console.log('❌ QPay authentication failed');
      console.log('💡 Please ensure IP is whitelisted and credentials are correct');
      return false;
    }
  } catch (error) {
    console.log('❌ QPay test failed:', error.message);
    return false;
  }
}

// Generate Prisma client
function generatePrismaClient() {
  console.log('\n🗄️ Generating Prisma Client...');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
  } catch (error) {
    console.log('❌ Failed to generate Prisma client:', error.message);
    process.exit(1);
  }
}

// Deploy to Vercel
function deployToVercel() {
  console.log('\n🚀 Deploying to Vercel...');
  
  try {
    // Check if vercel is installed
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
  }
  
  try {
    console.log('🔄 Starting deployment...');
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment completed');
  } catch (error) {
    console.log('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Main deployment process
async function deploy() {
  try {
    checkPrerequisites();
    checkEnvironmentVariables();
    
    const qpayWorking = await testQPayConnection();
    if (!qpayWorking) {
      console.log('\n⚠️  QPay connection failed, but continuing with deployment...');
      console.log('💡 You can fix QPay issues after deployment');
    }
    
    generatePrismaClient();
    deployToVercel();
    
    console.log('\n🎉 Deployment Process Completed!');
    console.log('==================================');
    console.log('\n📋 Next Steps:');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Configure Shopify app URLs');
    console.log('3. Test production endpoints');
    console.log('4. Monitor deployment logs');
    
    if (!qpayWorking) {
      console.log('\n⚠️  QPay Issues to Resolve:');
      console.log('1. Contact QPay support for IP whitelisting');
      console.log('2. Verify credentials are complete and correct');
      console.log('3. Test QPay connection after whitelisting');
    }
    
  } catch (error) {
    console.log('\n💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy };