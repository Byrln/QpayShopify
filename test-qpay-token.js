const QPayClient = require('./lib/qpay');
require('dotenv').config();

async function testQPayTokenGeneration() {
  console.log('🔐 Testing QPay Token Generation with Timestamp');
  console.log('=' .repeat(50));
  
  // Initialize QPay client
  const qpay = new QPayClient();
  
  console.log('\n📋 Configuration Check:');
  console.log('- API URL:', qpay.baseURL);
  console.log('- Username:', qpay.username ? '✅ SET' : '❌ MISSING');
  console.log('- Password:', qpay.password ? '✅ SET' : '❌ MISSING');
  console.log('- Invoice Code:', qpay.invoiceCode ? '✅ SET' : '❌ MISSING');
  
  if (!qpay.username || !qpay.password) {
    console.log('\n❌ Missing QPay credentials in .env file');
    console.log('Required variables:');
    console.log('- QPAY_USERNAME');
    console.log('- QPAY_PASSWORD');
    console.log('- QPAY_INVOICE_CODE');
    return;
  }
  
  console.log('\n🔄 Testing Authentication...');
  
  try {
    // Test 1: First authentication
    console.log('\n📝 Test 1: Initial Authentication');
    const result1 = await qpay.authenticate();
    
    if (result1.success) {
      console.log('✅ Authentication successful!');
      console.log('- Token length:', result1.data.access_token.length);
      console.log('- Expires in:', result1.data.expires_in, 'seconds');
      console.log('- Timestamp:', result1.data.timestamp);
      console.log('- Token preview:', result1.data.access_token.substring(0, 20) + '...');
    } else {
      console.log('❌ Authentication failed:', result1.error);
      if (result1.details) {
        console.log('- Status:', result1.details.status);
        console.log('- Response:', result1.details.data);
      }
    }
    
    // Test 2: Wait and try again (should use cached token)
    console.log('\n📝 Test 2: Token Reuse (should use cached)');
    const token1 = await qpay.getAccessToken();
    console.log('✅ Got token from cache:', token1.substring(0, 20) + '...');
    
    // Test 3: Force new authentication after short delay
    console.log('\n📝 Test 3: Force New Authentication');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    // Clear token to force new authentication
    qpay.accessToken = null;
    qpay.tokenExpiry = null;
    
    const result2 = await qpay.authenticate();
    
    if (result2.success) {
      console.log('✅ Second authentication successful!');
      console.log('- New timestamp:', result2.data.timestamp);
      console.log('- Token changed:', result1.data.access_token !== result2.data.access_token ? 'YES' : 'NO');
    } else {
      console.log('❌ Second authentication failed:', result2.error);
    }
    
    // Test 4: Test with invalid credentials (if we want to test error handling)
    console.log('\n📝 Test 4: Error Handling Test');
    const invalidQPay = new QPayClient({
      username: 'invalid_user',
      password: 'invalid_pass'
    });
    
    const invalidResult = await invalidQPay.authenticate();
    if (!invalidResult.success) {
      console.log('✅ Error handling works correctly');
      console.log('- Error:', invalidResult.error);
    } else {
      console.log('⚠️ Unexpected: Invalid credentials succeeded');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 QPay Token Generation Test Complete');
}

// Run the test
if (require.main === module) {
  testQPayTokenGeneration().catch(console.error);
}

module.exports = testQPayTokenGeneration;