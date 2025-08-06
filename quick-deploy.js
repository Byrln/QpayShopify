#!/usr/bin/env node

/**
 * Quick Deploy Script for QPay Shopify Integration
 * 
 * This script helps you quickly deploy to production platforms
 * Usage: node quick-deploy.js [platform]
 * Platforms: render, heroku, vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickDeploy {
  constructor() {
    this.platform = process.argv[2] || 'render';
    this.supportedPlatforms = ['render', 'heroku', 'vercel'];
  }

  log(message, type = 'info') {
    const symbols = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
    console.log(`${symbols[type]} ${message}`);
  }

  async deploy() {
    console.log('🚀 QPay Shopify Integration - Quick Deploy');
    console.log('==========================================\n');

    if (!this.supportedPlatforms.includes(this.platform)) {
      this.log(`Unsupported platform: ${this.platform}`, 'error');
      this.log(`Supported platforms: ${this.supportedPlatforms.join(', ')}`, 'info');
      process.exit(1);
    }

    this.log(`Deploying to: ${this.platform.toUpperCase()}`, 'info');

    // Run pre-deployment checks
    await this.runPreDeploymentChecks();

    // Platform-specific deployment
    switch (this.platform) {
      case 'render':
        await this.deployToRender();
        break;
      case 'heroku':
        await this.deployToHeroku();
        break;
      case 'vercel':
        await this.deployToVercel();
        break;
    }
  }

  async runPreDeploymentChecks() {
    this.log('Running pre-deployment checks...', 'info');
    
    try {
      // Run the deployment readiness check
      execSync('node deploy-to-production.js', { stdio: 'inherit' });
      this.log('Pre-deployment checks passed!', 'success');
    } catch (error) {
      this.log('Pre-deployment checks failed!', 'error');
      this.log('Please fix the issues above before deploying.', 'warn');
      process.exit(1);
    }
  }

  async deployToRender() {
    this.log('Deploying to Render.com...', 'info');
    
    console.log('\n📋 Render.com Deployment Steps:');
    console.log('1. Go to https://dashboard.render.com/');
    console.log('2. Click "New" → "Web Service"');
    console.log('3. Connect your GitHub repository');
    console.log('4. Use these settings:');
    console.log('   - Name: qpay-shopify-integration');
    console.log('   - Environment: Node');
    console.log('   - Build Command: npm install');
    console.log('   - Start Command: npm start');
    console.log('   - Plan: Free (upgrade for production)');
    
    console.log('\n🔧 Environment Variables to set in Render:');
    this.printEnvironmentVariables();
    
    console.log('\n✅ render.yaml is already configured in your project!');
    this.log('Your app will be available at: https://qpay-shopify-integration.onrender.com', 'success');
  }

  async deployToHeroku() {
    this.log('Deploying to Heroku...', 'info');
    
    try {
      // Check if Heroku CLI is installed
      execSync('heroku --version', { stdio: 'pipe' });
      this.log('Heroku CLI found', 'success');
    } catch (error) {
      this.log('Heroku CLI not found. Installing...', 'warn');
      console.log('Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli');
      return;
    }

    try {
      // Login check
      execSync('heroku auth:whoami', { stdio: 'pipe' });
      this.log('Already logged in to Heroku', 'success');
    } catch (error) {
      this.log('Please login to Heroku first: heroku login', 'warn');
      return;
    }

    console.log('\n🚀 Creating Heroku app...');
    
    try {
      const appName = 'qpay-shopify-' + Math.random().toString(36).substring(7);
      execSync(`heroku create ${appName}`, { stdio: 'inherit' });
      
      console.log('\n🔧 Setting environment variables...');
      this.setHerokuEnvVars(appName);
      
      console.log('\n📦 Deploying to Heroku...');
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Deploy to Heroku" || true', { stdio: 'inherit' });
      execSync('git push heroku main || git push heroku master', { stdio: 'inherit' });
      
      this.log(`Deployment complete! App URL: https://${appName}.herokuapp.com`, 'success');
      
    } catch (error) {
      this.log('Heroku deployment failed', 'error');
      console.log('Manual steps:');
      console.log('1. heroku create your-app-name');
      console.log('2. Set environment variables (see below)');
      console.log('3. git push heroku main');
      this.printEnvironmentVariables();
    }
  }

  async deployToVercel() {
    this.log('Deploying to Vercel...', 'info');
    
    try {
      // Check if Vercel CLI is installed
      execSync('vercel --version', { stdio: 'pipe' });
      this.log('Vercel CLI found', 'success');
    } catch (error) {
      this.log('Vercel CLI not found. Installing...', 'warn');
      try {
        execSync('npm install -g vercel', { stdio: 'inherit' });
        this.log('Vercel CLI installed', 'success');
      } catch (installError) {
        this.log('Failed to install Vercel CLI', 'error');
        console.log('Please install manually: npm install -g vercel');
        return;
      }
    }

    // Create vercel.json if it doesn't exist
    if (!fs.existsSync('vercel.json')) {
      const vercelConfig = {
        "version": 2,
        "builds": [
          {
            "src": "server.js",
            "use": "@vercel/node"
          }
        ],
        "routes": [
          {
            "src": "/(.*)",
            "dest": "/server.js"
          }
        ],
        "env": {
          "NODE_ENV": "production"
        }
      };
      
      fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
      this.log('Created vercel.json configuration', 'success');
    }

    console.log('\n🚀 Deploying to Vercel...');
    try {
      execSync('vercel --prod', { stdio: 'inherit' });
      this.log('Deployment complete!', 'success');
    } catch (error) {
      this.log('Vercel deployment failed', 'error');
      console.log('Manual steps:');
      console.log('1. vercel login');
      console.log('2. vercel --prod');
      console.log('3. Set environment variables in Vercel dashboard');
      this.printEnvironmentVariables();
    }
  }

  setHerokuEnvVars(appName) {
    const envVars = [
      'NODE_ENV=production',
      'QPAY_USERNAME=your_qpay_username',
      'QPAY_PASSWORD=your_qpay_password',
      'QPAY_INVOICE_CODE=your_invoice_code',
      'QPAY_API_URL=https://merchant.qpay.mn/v2',
      'QPAY_WEBHOOK_SECRET=your_webhook_secret'
    ];

    console.log('\n⚠️  Please set these environment variables manually:');
    envVars.forEach(envVar => {
      console.log(`heroku config:set ${envVar} --app ${appName}`);
    });
  }

  printEnvironmentVariables() {
    console.log('\n🔧 Required Environment Variables:');
    console.log('NODE_ENV=production');
    console.log('QPAY_USERNAME=your_qpay_username');
    console.log('QPAY_PASSWORD=your_qpay_password');
    console.log('QPAY_INVOICE_CODE=your_invoice_code');
    console.log('QPAY_API_URL=https://merchant.qpay.mn/v2');
    console.log('QPAY_WEBHOOK_SECRET=your_webhook_secret');
    console.log('\n📝 Replace the placeholder values with your actual credentials');
  }

  showUsage() {
    console.log('Usage: node quick-deploy.js [platform]');
    console.log('Platforms: render, heroku, vercel');
    console.log('\nExamples:');
    console.log('  node quick-deploy.js render');
    console.log('  node quick-deploy.js heroku');
    console.log('  node quick-deploy.js vercel');
  }
}

// Run deployment
if (require.main === module) {
  const deployer = new QuickDeploy();
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    deployer.showUsage();
    process.exit(0);
  }
  
  deployer.deploy().catch(error => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = QuickDeploy;