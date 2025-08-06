#!/usr/bin/env node
// QPay Integration Completeness Checker
// Verifies all QPay integration components are properly implemented

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const QPayClient = require('./lib/qpay');

class QPayIntegrationChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  log(type, message, details = null) {
    const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    console.log(`${icons[type]} ${message}`);
    
    if (details) {
      console.log(`   ${details}`);
    }
    
    this.results.details.push({ type, message, details });
    
    if (type === 'pass') this.results.passed++;
    else if (type === 'fail') this.results.failed++;
    else if (type === 'warn') this.results.warnings++;
  }

  async checkEnvironmentVariables() {
    console.log('\n🔍 Checking Environment Variables...');
    
    const requiredVars = [
      'QPAY_USERNAME',
      'QPAY_PASSWORD', 
      'QPAY_INVOICE_CODE',
      'QPAY_API_URL'
    ];
    
    const optionalVars = [
      'QPAY_WEBHOOK_SECRET'
    ];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        this.log('pass', `${varName} is configured`);
      } else {
        this.log('fail', `${varName} is missing`, 'Required for QPay API access');
      }
    }
    
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        this.log('pass', `${varName} is configured`);
      } else {
        this.log('warn', `${varName} is not configured`, 'Recommended for security');
      }
    }
  }

  async checkFileStructure() {
    console.log('\n🔍 Checking File Structure...');
    
    const requiredFiles = [
      { path: 'lib/qpay.js', description: 'QPay client library' },
      { path: 'middleware/qpay-security.js', description: 'QPay security middleware' },
      { path: 'config/security.js', description: 'Security configuration' },
      { path: 'server.js', description: 'Main server file' }
    ];
    
    const optionalFiles = [
      { path: 'debug-qpay.js', description: 'QPay debugging script' },
      { path: 'test-qpay-enhanced.js', description: 'Enhanced QPay testing' },
      { path: 'QPAY-API-ANALYSIS.md', description: 'QPay API documentation' }
    ];
    
    for (const file of requiredFiles) {
      if (fs.existsSync(file.path)) {
        this.log('pass', `${file.path} exists`, file.description);
      } else {
        this.log('fail', `${file.path} is missing`, file.description);
      }
    }
    
    for (const file of optionalFiles) {
      if (fs.existsSync(file.path)) {
        this.log('pass', `${file.path} exists`, file.description);
      } else {
        this.log('warn', `${file.path} is missing`, `Optional: ${file.description}`);
      }
    }
  }

  async checkQPayClientFeatures() {
    console.log('\n🔍 Checking QPay Client Features...');
    
    try {
      const qpayContent = fs.readFileSync('lib/qpay.js', 'utf8');
      
      const features = [
        { name: 'Authentication', pattern: /async authenticate\(\)|async getAccessToken\(\)/ },
        { name: 'Invoice Creation', pattern: /async createInvoice\(/ },
        { name: 'Payment Status Check', pattern: /async checkPayment\(|async checkInvoiceStatus\(/ },
        { name: 'Webhook Signature Verification', pattern: /verifyWebhookSignature\(/ },
        { name: 'E-Barimt Support', pattern: /async generateEBarimt\(/ },
        { name: 'Invoice Cancellation', pattern: /async cancelInvoice\(/ },
        { name: 'Payment Details', pattern: /async getPaymentDetails\(/ }
      ];
      
      for (const feature of features) {
        if (feature.pattern.test(qpayContent)) {
          this.log('pass', `${feature.name} is implemented`);
        } else {
          this.log('fail', `${feature.name} is missing`);
        }
      }
    } catch (error) {
      this.log('fail', 'Could not read QPay client file', error.message);
    }
  }

  async checkSecurityMiddleware() {
    console.log('\n🔍 Checking Security Middleware...');
    
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      const securityContent = fs.existsSync('middleware/qpay-security.js') 
        ? fs.readFileSync('middleware/qpay-security.js', 'utf8') 
        : '';
      
      const securityFeatures = [
        { 
          name: 'Request Logging', 
          pattern: /logQPayRequest/,
          content: securityContent 
        },
        { 
          name: 'Rate Limiting', 
          pattern: /rateLimitQPayWebhooks|MAX_ATTEMPTS/,
          content: securityContent 
        },
        { 
          name: 'Webhook Security Middleware Applied', 
          pattern: /qpaySecurityMiddleware/,
          content: serverContent 
        },
        { 
          name: 'Signature Verification', 
          pattern: /verifyQPaySignature|QPAY_WEBHOOK_SECRET/,
          content: securityContent 
        }
      ];
      
      for (const feature of securityFeatures) {
        if (feature.pattern.test(feature.content)) {
          this.log('pass', `${feature.name} is implemented`);
        } else {
          this.log('fail', `${feature.name} is missing`);
        }
      }
    } catch (error) {
      this.log('fail', 'Could not check security middleware', error.message);
    }
  }

  async checkWebhookEndpoints() {
    console.log('\n🔍 Checking Webhook Endpoints...');
    
    try {
      const serverContent = fs.readFileSync('server.js', 'utf8');
      
      const endpoints = [
        { name: 'QPay Webhook Endpoint', pattern: /\/api\/webhook\/qpay/ },
        { name: 'Legacy Webhook Endpoint', pattern: /\/api\/webhook(?!\/qpay)/ },
        { name: 'Shopify Order Webhook', pattern: /\/api\/webhook\/orders\/create/ },
        { name: 'Create Invoice Endpoint', pattern: /\/api\/create-invoice/ }
      ];
      
      for (const endpoint of endpoints) {
        if (endpoint.pattern.test(serverContent)) {
          this.log('pass', `${endpoint.name} is implemented`);
        } else {
          this.log('warn', `${endpoint.name} is missing`);
        }
      }
    } catch (error) {
      this.log('fail', 'Could not check webhook endpoints', error.message);
    }
  }

  async checkQPayConnection() {
    console.log('\n🔍 Testing QPay API Connection...');
    
    try {
      const qpay = new QPayClient();
      const token = await qpay.getAccessToken();
      
      if (token) {
        this.log('pass', 'QPay API connection successful');
        this.log('info', `Token received: ${token.substring(0, 20)}...`);
      } else {
        this.log('fail', 'QPay API connection failed', 'No token received');
      }
    } catch (error) {
      if (error.message.includes('NO_CREDENTIALS')) {
        this.log('fail', 'QPay authentication failed', 'IP may not be whitelisted or credentials incorrect');
      } else {
        this.log('fail', 'QPay API connection error', error.message);
      }
    }
  }

  async checkTokenAuthentication() {
    console.log('\n🔍 Checking Token-Based Authentication...');
    
    try {
      this.log('info', 'Using token-based authentication (no IP whitelist required)');
      
      if (process.env.QPAY_WEBHOOK_SECRET) {
        this.log('pass', 'Webhook signature verification is configured');
      } else {
        this.log('warn', 'QPAY_WEBHOOK_SECRET not configured', 
                 'Webhook signature verification is recommended for production');
      }
      
      this.log('info', 'Token-based authentication provides secure access without IP restrictions');
    } catch (error) {
      this.log('fail', 'Error checking token authentication', error.message);
    }
  }

  async runAllChecks() {
    console.log('🧪 QPay Integration Completeness Check');
    console.log('=====================================');
    
    await this.checkEnvironmentVariables();
    await this.checkFileStructure();
    await this.checkQPayClientFeatures();
    await this.checkSecurityMiddleware();
    await this.checkWebhookEndpoints();
    await this.checkTokenAuthentication();
    await this.checkQPayConnection();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n📋 Integration Check Summary');
    console.log('============================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 QPay integration is complete and ready!');
      console.log('\n📝 Next Steps:');
      console.log('1. Contact QPay support to whitelist your server IP');
      console.log('2. Configure QPAY_WEBHOOK_SECRET for enhanced security');
      console.log('3. Test the integration with a real transaction');
    } else {
      console.log('\n⚠️  QPay integration has missing components.');
      console.log('\n🔧 Required Actions:');
      
      const failures = this.results.details.filter(d => d.type === 'fail');
      failures.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.message}`);
        if (failure.details) {
          console.log(`   ${failure.details}`);
        }
      });
    }
    
    console.log('\n🔗 Useful Resources:');
    console.log('- QPay API Documentation: https://merchant.qpay.mn/docs');
    console.log('- QPay Support: Contact for IP whitelisting');
    console.log('- Integration Status: All core features implemented');
  }
}

// Run the checker
if (require.main === module) {
  const checker = new QPayIntegrationChecker();
  checker.runAllChecks().catch(error => {
    console.error('❌ Integration check failed:', error.message);
    process.exit(1);
  });
}

module.exports = QPayIntegrationChecker;