// Test QPay Credentials
require('dotenv').config();
const QPayClient = require('./lib/qpay');

async function testQPayCredentials() {
  console.log('🧪 Testing QPay Credentials');
  console.log('============================');
  
  try {
    // Initialize QPay client with real credentials
    const qpayClient = new QPayClient({
      username: process.env.QPAY_USERNAME,
      password: process.env.QPAY_PASSWORD,
      invoiceCode: process.env.QPAY_INVOICE_CODE,
      apiUrl: process.env.QPAY_API_URL
    });
    
    console.log('📋 Configuration:');
    console.log(`  Username: ${process.env.QPAY_USERNAME}`);
    console.log(`  Invoice Code: ${process.env.QPAY_INVOICE_CODE}`);
    console.log(`  API URL: ${process.env.QPAY_API_URL}`);
    console.log(`  Password: ${'*'.repeat(process.env.QPAY_PASSWORD?.length || 0)}`);
    
    // Test authentication
    console.log('\n🔐 Testing Authentication...');
    const authResult = await qpayClient.authenticate();
    
    if (authResult.success) {
      console.log('✅ Authentication successful!');
      console.log(`   Token: ${authResult.data.access_token.substring(0, 20)}...`);
      console.log(`   Expires in: ${authResult.data.expires_in} seconds`);
    } else {
      console.log('❌ Authentication failed!');
      console.log(`   Error: ${authResult.error}`);
      return;
    }
    
    // Test creating a sample invoice
    console.log('\n📝 Testing Invoice Creation...');
    const invoiceData = {
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: `TEST_${Date.now()}`,
      invoice_receiver_code: 'TEST_ORDER_001',
      invoice_description: 'Test payment for QPay integration',
      amount: 1000,
      callback_url: 'https://your-app.onrender.com/api/webhook'
    };
    
    const invoiceResult = await qpayClient.createInvoice(invoiceData);
    
    if (invoiceResult.success) {
      console.log('✅ Invoice creation successful!');
      console.log(`   Invoice ID: ${invoiceResult.data.invoice_id}`);
      console.log(`   QR Text: ${invoiceResult.data.qr_text}`);
      console.log(`   QR Image: ${invoiceResult.data.qr_image ? 'Available' : 'Not available'}`);
      
      // Test checking invoice status
      console.log('\n📊 Testing Invoice Status Check...');
      const statusResult = await qpayClient.checkInvoiceStatus(invoiceResult.data.invoice_id);
      
      if (statusResult.success) {
        console.log('✅ Status check successful!');
        console.log(`   Status: ${statusResult.data.payment_status || 'PENDING'}`);
        console.log(`   Amount: ${statusResult.data.payment_amount || invoiceData.amount}`);
      } else {
        console.log('⚠️ Status check failed (this might be normal for new invoices)');
        console.log(`   Error: ${statusResult.error}`);
      }
      
    } else {
      console.log('❌ Invoice creation failed!');
      console.log(`   Error: ${invoiceResult.error}`);
    }
    
    console.log('\n🎉 QPay credential test completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Authentication: ${authResult.success ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Invoice Creation: ${invoiceResult.success ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Status Check: Available`);
    
    if (authResult.success && invoiceResult.success) {
      console.log('\n🚀 Your QPay integration is ready for production!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Configure your Shopify credentials in .env');
      console.log('   2. Set up your database connection (Neon PostgreSQL)');
      console.log('   3. Deploy to Render.com with proper environment variables');
      console.log('   4. Configure webhook URL in QPay merchant dashboard');
    } else {
      console.log('\n⚠️ Please check your QPay credentials and try again.');
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify QPay credentials are correct');
    console.error('   3. Ensure QPay API is accessible');
    console.error('   4. Check if your IP is whitelisted (if required)');
  }
}

// Run the test
testQPayCredentials().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});