// Debug QPay API Connection
require('dotenv').config();
const axios = require('axios');

async function debugQPayAPI() {
  console.log('🔍 Debugging QPay API Connection');
  console.log('==================================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  QPAY_USERNAME: "${process.env.QPAY_USERNAME}"`);
  console.log(`  QPAY_PASSWORD: "${process.env.QPAY_PASSWORD}"`);
  console.log(`  QPAY_INVOICE_CODE: "${process.env.QPAY_INVOICE_CODE}"`);
  console.log(`  QPAY_API_URL: "${process.env.QPAY_API_URL}"`);
  
  // Check if credentials are properly loaded
  if (!process.env.QPAY_USERNAME || !process.env.QPAY_PASSWORD) {
    console.log('❌ Missing credentials in environment variables!');
    return;
  }
  
  // Test API endpoint accessibility
  console.log('\n🌐 Testing API Endpoint Accessibility...');
  try {
    const response = await axios.get(`${process.env.QPAY_API_URL}/auth/token`, {
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log(`✅ API endpoint accessible (Status: ${response.status})`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log('❌ API endpoint not accessible');
    console.log(`   Error: ${error.message}`);
    if (error.code === 'ENOTFOUND') {
      console.log('   This might be a DNS or network connectivity issue');
    }
    return;
  }
  
  // Test authentication with detailed logging
  console.log('\n🔐 Testing Authentication with Debug Info...');
  
  const authPayload = {
    username: process.env.QPAY_USERNAME,
    password: process.env.QPAY_PASSWORD
  };
  
  console.log('📤 Sending authentication request:');
  console.log(`   URL: ${process.env.QPAY_API_URL}/auth/token`);
  console.log(`   Method: POST`);
  console.log(`   Payload: ${JSON.stringify(authPayload, null, 2)}`);
  
  try {
    const response = await axios.post(
      `${process.env.QPAY_API_URL}/auth/token`,
      authPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QPay-Shopify-Integration/1.0'
        },
        timeout: 15000,
        validateStatus: () => true // Accept any status code
      }
    );
    
    console.log('📥 Response received:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`   Data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200 && response.data.access_token) {
      console.log('\n✅ Authentication successful!');
      console.log(`   Token: ${response.data.access_token.substring(0, 20)}...`);
      console.log(`   Expires in: ${response.data.expires_in} seconds`);
    } else {
      console.log('\n❌ Authentication failed!');
      
      // Analyze common error scenarios
      if (response.data?.error === 'NO_CREDENTIALS') {
        console.log('\n🔍 Analysis: NO_CREDENTIALS Error');
        console.log('   Possible causes:');
        console.log('   1. Username or password is incorrect');
        console.log('   2. Credentials format is wrong');
        console.log('   3. Account is not activated');
        console.log('   4. IP address is not whitelisted');
        console.log('\n💡 Recommendations:');
        console.log('   1. Verify credentials with QPay support');
        console.log('   2. Check if your IP needs to be whitelisted');
        console.log('   3. Ensure account is properly activated');
      }
    }
    
  } catch (error) {
    console.log('💥 Request failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.response) {
      console.log(`   Response Status: ${error.response.status}`);
      console.log(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   This indicates the server refused the connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   This indicates a timeout - server might be slow or unreachable');
    }
  }
  
  // Check current IP address
  console.log('\n🌍 Checking Current IP Address...');
  try {
    const ipResponse = await axios.get('https://api.ipify.org?format=json', {
      timeout: 5000
    });
    console.log(`   Your current IP: ${ipResponse.data.ip}`);
    console.log('   Note: QPay mentioned IP whitelisting might be required');
    console.log('   Contact QPay support to whitelist this IP if needed');
  } catch (error) {
    console.log('   Could not determine current IP address');
  }
  
  console.log('\n📋 Debug Summary:');
  console.log('==================');
  console.log('1. Check if credentials are exactly as provided by QPay');
  console.log('2. Verify your IP address is whitelisted (if required)');
  console.log('3. Contact QPay support if issues persist');
  console.log('4. Ensure your network allows outbound HTTPS connections');
}

// Run debug
debugQPayAPI().catch(error => {
  console.error('💥 Debug script failed:', error.message);
  process.exit(1);
});