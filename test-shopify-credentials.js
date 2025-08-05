// Test Shopify API Connection
require('dotenv').config();
const axios = require('axios');

async function testShopifyConnection() {
  console.log('🛍️ Testing Shopify API Connection');
  console.log('==================================');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`  SHOPIFY_SHOP_DOMAIN: "${process.env.SHOPIFY_SHOP_DOMAIN}"`);
  console.log(`  SHOPIFY_ACCESS_TOKEN: "${process.env.SHOPIFY_ACCESS_TOKEN?.substring(0, 10)}..."`);
  console.log(`  SHOPIFY_API_KEY: "${process.env.SHOPIFY_API_KEY}"`);
  console.log(`  SHOPIFY_API_SECRET: "${process.env.SHOPIFY_API_SECRET?.substring(0, 10)}..."`);
  
  if (!process.env.SHOPIFY_SHOP_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.log('❌ Missing Shopify credentials!');
    return;
  }
  
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
  
  // Test shop info endpoint
  console.log('\n🏪 Testing Shop Info...');
  try {
    const shopResponse = await axios.get(
      `https://${shopDomain}/admin/api/${apiVersion}/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const shop = shopResponse.data.shop;
    console.log('✅ Shop info retrieved successfully!');
    console.log(`   Shop Name: ${shop.name}`);
    console.log(`   Shop Domain: ${shop.domain}`);
    console.log(`   Shop Email: ${shop.email}`);
    console.log(`   Currency: ${shop.currency}`);
    console.log(`   Country: ${shop.country_name}`);
    console.log(`   Plan: ${shop.plan_name}`);
    
  } catch (error) {
    console.log('❌ Failed to get shop info');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return;
  }
  
  // Test orders endpoint
  console.log('\n📦 Testing Orders Access...');
  try {
    const ordersResponse = await axios.get(
      `https://${shopDomain}/admin/api/${apiVersion}/orders.json?limit=5`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const orders = ordersResponse.data.orders;
    console.log(`✅ Orders access successful! Found ${orders.length} recent orders`);
    
    if (orders.length > 0) {
      const latestOrder = orders[0];
      console.log(`   Latest Order ID: ${latestOrder.id}`);
      console.log(`   Order Number: ${latestOrder.order_number}`);
      console.log(`   Total Price: ${latestOrder.total_price} ${latestOrder.currency}`);
      console.log(`   Financial Status: ${latestOrder.financial_status}`);
    }
    
  } catch (error) {
    console.log('❌ Failed to access orders');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test webhooks endpoint
  console.log('\n🔗 Testing Webhooks Access...');
  try {
    const webhooksResponse = await axios.get(
      `https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const webhooks = webhooksResponse.data.webhooks;
    console.log(`✅ Webhooks access successful! Found ${webhooks.length} webhooks`);
    
    webhooks.forEach((webhook, index) => {
      console.log(`   Webhook ${index + 1}: ${webhook.topic} -> ${webhook.address}`);
    });
    
  } catch (error) {
    console.log('❌ Failed to access webhooks');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
  }
  
  // Test products endpoint
  console.log('\n🛒 Testing Products Access...');
  try {
    const productsResponse = await axios.get(
      `https://${shopDomain}/admin/api/${apiVersion}/products.json?limit=3`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const products = productsResponse.data.products;
    console.log(`✅ Products access successful! Found ${products.length} products`);
    
    products.forEach((product, index) => {
      console.log(`   Product ${index + 1}: ${product.title} (ID: ${product.id})`);
    });
    
  } catch (error) {
    console.log('❌ Failed to access products');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n📋 Connection Test Summary:');
  console.log('============================');
  console.log('✅ Shopify API credentials are working!');
  console.log('✅ Shop access confirmed');
  console.log('✅ Ready for QPay integration');
  console.log('\n💡 Next Steps:');
  console.log('1. Resolve QPay IP whitelisting');
  console.log('2. Test full integration with both APIs');
  console.log('3. Deploy to production');
}

// Run test
testShopifyConnection().catch(error => {
  console.error('💥 Shopify test failed:', error.message);
  process.exit(1);
});