// API Test Script for QPay Shopify Integration
const axios = require('axios');
const testConfig = require('./test-config');

const BASE_URL = 'http://localhost:3000';

class APITester {
  constructor() {
    this.results = [];
  }

  async runTest(name, testFunction) {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      const result = await testFunction();
      console.log(`✅ ${name}: PASSED`);
      this.results.push({ name, status: 'PASSED', result });
      return result;
    } catch (error) {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Error: ${error.message}`);
      this.results.push({ name, status: 'FAILED', error: error.message });
      return null;
    }
  }

  async testHealthCheck() {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    return response.data;
  }

  async testCreateInvoice() {
    const orderData = testConfig.testOrders.order1;
    const response = await axios.post(`${BASE_URL}/api/create-invoice`, orderData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const data = response.data;
    if (!data.success || !data.data.invoice_id) {
      throw new Error('Invalid response format or missing invoice_id');
    }
    
    return data;
  }

  async testWebhookSuccess() {
    const webhookData = {
      ...testConfig.testWebhooks.paymentSuccess,
      invoice_id: 'test_invoice_123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/webhook`, webhookData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const data = response.data;
    if (!data.success) {
      throw new Error('Webhook processing failed');
    }
    
    return data;
  }

  async testWebhookFailed() {
    const webhookData = {
      ...testConfig.testWebhooks.paymentFailed,
      invoice_id: 'test_invoice_456'
    };
    
    const response = await axios.post(`${BASE_URL}/api/webhook`, webhookData);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const data = response.data;
    if (!data.success) {
      throw new Error('Webhook processing failed');
    }
    
    return data;
  }

  async testOrderStatus() {
    const response = await axios.get(`${BASE_URL}/api/order-status?orderId=test_order_123`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const data = response.data;
    if (!data.success || !data.data.order_id) {
      throw new Error('Invalid response format or missing order_id');
    }
    
    return data;
  }

  async testInvalidRequests() {
    // Test missing required fields
    try {
      await axios.post(`${BASE_URL}/api/create-invoice`, {});
      throw new Error('Should have failed with missing fields');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return { message: 'Correctly rejected invalid request' };
      }
      throw error;
    }
  }

  async testCORS() {
    const response = await axios.options(`${BASE_URL}/api/create-invoice`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (!corsHeaders) {
      throw new Error('CORS headers not found');
    }
    
    return { cors: 'enabled', headers: corsHeaders };
  }

  async runAllTests() {
    console.log('🚀 Starting QPay Shopify Integration API Tests\n');
    console.log(`📍 Testing server at: ${BASE_URL}`);
    
    // Wait for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run all tests
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Create Invoice', () => this.testCreateInvoice());
    await this.runTest('Webhook Success', () => this.testWebhookSuccess());
    await this.runTest('Webhook Failed', () => this.testWebhookFailed());
    await this.runTest('Order Status', () => this.testOrderStatus());
    await this.runTest('Invalid Requests', () => this.testInvalidRequests());
    await this.runTest('CORS Support', () => this.testCORS());
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎯 Test completed!');
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Your test environment is ready.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = APITester;