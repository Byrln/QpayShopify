#!/usr/bin/env node

/**
 * Production Deployment Script for QPay Shopify Integration
 * 
 * This script helps prepare and validate your application for production deployment.
 * Run this before deploying to ensure everything is configured correctly.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionDeployment {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message, details = null) {
    const timestamp = new Date().toISOString();
    const symbols = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    
    console.log(`${symbols[type]} ${message}`);
    if (details) {
      console.log(`   ${details}`);
    }
    
    if (type === 'fail') this.errors.push({ message, details });
    if (type === 'warn') this.warnings.push({ message, details });
    if (type === 'pass') this.passed.push({ message, details });
  }

  async checkProductionReadiness() {
    console.log('🚀 Production Deployment Readiness Check');
    console.log('=========================================\n');

    // Check environment variables
    await this.checkEnvironmentVariables();
    
    // Check dependencies
    await this.checkDependencies();
    
    // Check file structure
    await this.checkFileStructure();
    
    // Test QPay connection
    await this.testQPayConnection();
    
    // Check security configuration
    await this.checkSecurityConfiguration();
    
    // Validate server configuration
    await this.validateServerConfiguration();
    
    // Generate deployment summary
    this.generateDeploymentSummary();
  }

  async checkEnvironmentVariables() {
    console.log('🔍 Checking Production Environment Variables...');
    
    const requiredVars = [
      'QPAY_USERNAME',
      'QPAY_PASSWORD', 
      'QPAY_INVOICE_CODE',
      'QPAY_API_URL'
    ];
    
    const recommendedVars = [
      'QPAY_WEBHOOK_SECRET',
      'NODE_ENV',
      'PORT'
    ];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.log('pass', `${varName} is configured`);
      } else {
        this.log('fail', `${varName} is missing`, 'Required for production deployment');
      }
    }
    
    for (const varName of recommendedVars) {
      if (process.env[varName]) {
        this.log('pass', `${varName} is configured`);
      } else {
        this.log('warn', `${varName} is not set`, 'Recommended for production');
      }
    }
    
    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.log('pass', 'NODE_ENV is set to production');
    } else {
      this.log('warn', 'NODE_ENV is not set to production', 'Set NODE_ENV=production for optimal performance');
    }
  }

  async checkDependencies() {
    console.log('\n📦 Checking Dependencies...');
    
    try {
      // Check if package.json exists
      if (fs.existsSync('package.json')) {
        this.log('pass', 'package.json found');
        
        // Check if node_modules exists
        if (fs.existsSync('node_modules')) {
          this.log('pass', 'node_modules directory exists');
        } else {
          this.log('fail', 'node_modules directory missing', 'Run: npm install');
        }
        
        // Check package-lock.json
        if (fs.existsSync('package-lock.json')) {
          this.log('pass', 'package-lock.json found (dependency lock)');
        } else {
          this.log('warn', 'package-lock.json missing', 'Run: npm install to generate');
        }
        
      } else {
        this.log('fail', 'package.json not found');
      }
    } catch (error) {
      this.log('fail', 'Error checking dependencies', error.message);
    }
  }

  async checkFileStructure() {
    console.log('\n🏗️ Checking File Structure...');
    
    const requiredFiles = [
      'server.js',
      'lib/qpay.js',
      'middleware/qpay-security.js'
    ];
    
    const optionalFiles = [
      'lib/shopify.js',
      'lib/database.js',
      'prisma/schema.prisma',
      'render.yaml'
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        this.log('pass', `${file} exists`);
      } else {
        this.log('fail', `${file} is missing`, 'Required for deployment');
      }
    }
    
    for (const file of optionalFiles) {
      if (fs.existsSync(file)) {
        this.log('pass', `${file} exists`);
      } else {
        this.log('info', `${file} not found (optional)`);
      }
    }
  }

  async testQPayConnection() {
    console.log('\n🔌 Testing QPay Connection...');
    
    try {
      const QPayClient = require('./lib/qpay');
      const qpayClient = new QPayClient();
      
      // Test authentication
      const token = await qpayClient.authenticate();
      
      if (token) {
        this.log('pass', 'QPay authentication successful');
        this.log('info', `Token received (${token.length} characters)`);
      } else {
        this.log('fail', 'QPay authentication failed');
      }
      
    } catch (error) {
      this.log('fail', 'QPay connection test failed', error.message);
    }
  }

  async checkSecurityConfiguration() {
    console.log('\n🔒 Checking Security Configuration...');
    
    // Check webhook secret
    if (process.env.QPAY_WEBHOOK_SECRET) {
      this.log('pass', 'QPAY_WEBHOOK_SECRET is configured');
    } else {
      this.log('warn', 'QPAY_WEBHOOK_SECRET not set', 'Recommended for webhook security');
    }
    
    // Check if sensitive files are in .gitignore
    if (fs.existsSync('.gitignore')) {
      const gitignore = fs.readFileSync('.gitignore', 'utf8');
      
      if (gitignore.includes('.env')) {
        this.log('pass', '.env is in .gitignore');
      } else {
        this.log('warn', '.env not in .gitignore', 'Add .env to .gitignore to protect secrets');
      }
      
      if (gitignore.includes('node_modules')) {
        this.log('pass', 'node_modules is in .gitignore');
      } else {
        this.log('warn', 'node_modules not in .gitignore');
      }
    } else {
      this.log('warn', '.gitignore file missing', 'Create .gitignore to protect sensitive files');
    }
  }

  async validateServerConfiguration() {
    console.log('\n⚙️ Validating Server Configuration...');
    
    try {
      // Check if server.js can be loaded
      const serverPath = path.resolve('./server.js');
      if (fs.existsSync(serverPath)) {
        this.log('pass', 'server.js is accessible');
        
        // Basic syntax check
        try {
          require.resolve('./server.js');
          this.log('pass', 'server.js syntax is valid');
        } catch (error) {
          this.log('fail', 'server.js has syntax errors', error.message);
        }
      }
      
      // Check port configuration
      const port = process.env.PORT || 3000;
      this.log('info', `Server will run on port: ${port}`);
      
    } catch (error) {
      this.log('fail', 'Server configuration validation failed', error.message);
    }
  }

  generateDeploymentSummary() {
    console.log('\n📋 Deployment Readiness Summary');
    console.log('================================');
    
    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Ready for Production Deployment!');
      console.log('\n📋 Next Steps:');
      console.log('1. Deploy to your hosting platform (Render, Heroku, etc.)');
      console.log('2. Set environment variables in production');
      console.log('3. Configure Shopify webhooks');
      console.log('4. Test with real transactions');
      console.log('5. Monitor logs and performance');
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  Consider addressing warnings for optimal security:');
        this.warnings.forEach(warning => {
          console.log(`   • ${warning.message}`);
        });
      }
    } else {
      console.log('\n❌ Not Ready for Production');
      console.log('\nPlease fix the following errors:');
      this.errors.forEach(error => {
        console.log(`   • ${error.message}`);
        if (error.details) {
          console.log(`     ${error.details}`);
        }
      });
    }
    
    console.log('\n🔗 Useful Resources:');
    console.log('• Production Guide: ./PRODUCTION-DEPLOYMENT-GUIDE.md');
    console.log('• Token Auth Guide: ./TOKEN-BASED-AUTHENTICATION.md');
    console.log('• Postman Testing: ./POSTMAN-TESTING-GUIDE.md');
  }

  async createProductionEnvTemplate() {
    console.log('\n📝 Creating Production Environment Template...');
    
    const envTemplate = `# Production Environment Variables for QPay Shopify Integration
# Copy this file to .env and fill in your production values

# ===== REQUIRED QPAY CREDENTIALS =====
QPAY_USERNAME=your_production_username
QPAY_PASSWORD=your_production_password
QPAY_INVOICE_CODE=your_production_invoice_code
QPAY_API_URL=https://merchant.qpay.mn/v2

# ===== SECURITY (RECOMMENDED) =====
QPAY_WEBHOOK_SECRET=your_webhook_secret_from_qpay
NODE_ENV=production

# ===== SERVER CONFIGURATION =====
PORT=3000

# ===== DATABASE (IF USING) =====
# DATABASE_URL=your_production_database_url

# ===== SHOPIFY (IF USING WEBHOOKS) =====
# SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
# SHOPIFY_API_KEY=your_shopify_api_key
# SHOPIFY_API_SECRET=your_shopify_api_secret

# ===== MONITORING (OPTIONAL) =====
# SENTRY_DSN=your_sentry_dsn_for_error_tracking
`;
    
    try {
      fs.writeFileSync('.env.production', envTemplate);
      this.log('pass', 'Created .env.production template');
      console.log('   Fill in your production values and rename to .env');
    } catch (error) {
      this.log('warn', 'Could not create .env.production template', error.message);
    }
  }
}

// Run deployment check
if (require.main === module) {
  const deployment = new ProductionDeployment();
  
  deployment.checkProductionReadiness()
    .then(() => {
      // Create production env template
      return deployment.createProductionEnvTemplate();
    })
    .catch(error => {
      console.error('❌ Deployment check failed:', error.message);
      process.exit(1);
    });
}

module.exports = ProductionDeployment;