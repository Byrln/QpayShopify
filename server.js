// Production Server for QPay Shopify Integration
require('dotenv').config();
const express = require('express');
const path = require('path');
const QPayClient = require('./lib/qpay');
const ShopifyClient = require('./lib/shopify');
const DatabaseClient = require('./lib/database');
const { qpaySecurityMiddleware } = require('./middleware/qpay-security');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize clients
let qpayClient, shopifyClient, dbClient;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Initialize clients on startup
async function initializeClients() {
  try {
    console.log('🔧 Initializing clients...');
    
    // Initialize QPay client
    qpayClient = new QPayClient({
      username: process.env.QPAY_USERNAME,
      password: process.env.QPAY_PASSWORD,
      invoiceCode: process.env.QPAY_INVOICE_CODE,
      apiUrl: process.env.QPAY_API_URL
    });
    
    // Initialize Shopify client
    shopifyClient = new ShopifyClient({
      shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
      apiVersion: process.env.SHOPIFY_API_VERSION || '2024-01'
    });
    
    // Initialize Database client
    dbClient = new DatabaseClient();
    await dbClient.connect();
    
    console.log('✅ All clients initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize clients:', error.message);
    process.exit(1);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QPay Shopify Integration - Production Server',
    mode: 'PRODUCTION',
    version: '1.0.0',
    endpoints: {
      createInvoice: '/api/create-invoice',
      webhook: '/api/webhook',
      orderStatus: '/api/order-status',
      qrDisplay: '/qr-display.html'
    },
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Shopify Webhook endpoints
app.post('/webhooks/shopify/orders/create', async (req, res) => {
  try {
    console.log('📦 Shopify Order Created Webhook received');
    
    // Verify Shopify webhook signature
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (webhookSecret && hmac) {
      const crypto = require('crypto');
      const body = JSON.stringify(req.body);
      const calculatedHmac = crypto
        .createHmac('sha256', webhookSecret)
        .update(body, 'utf8')
        .digest('base64');
      
      if (calculatedHmac !== hmac) {
        console.log('❌ Invalid Shopify webhook signature');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    const order = req.body;
    console.log('📦 New Shopify Order:', {
      id: order.id,
      order_number: order.order_number,
      total_price: order.total_price,
      currency: order.currency,
      customer: order.customer?.email
    });
    
    // Create QPay invoice for the order
    if (qpayClient) {
      try {
        const invoiceData = {
          orderId: order.id.toString(),
          amount: parseFloat(order.total_price),
          currency: order.currency,
          customerEmail: order.customer?.email,
          customerPhone: order.customer?.phone,
          orderNumber: order.order_number
        };
        
        const invoice = await qpayClient.createInvoice(invoiceData);
        console.log('✅ QPay invoice created for Shopify order:', invoice.invoice_id);
        
        // Store the invoice mapping
        if (dbClient) {
          await dbClient.createOrderPayment({
            shopifyOrderId: order.id.toString(),
            orderNumber: order.name || order.order_number,
            qpayInvoiceId: invoice.invoice_id,
            amount: parseFloat(order.total_price).toString(),
            currency: order.currency,
            customerEmail: order.customer?.email,
            customerPhone: order.customer?.phone,
            qrText: invoice.qr_text,
            qrImage: invoice.qr_image
          });
        }
      } catch (error) {
        console.error('❌ Failed to create QPay invoice for Shopify order:', error.message);
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Shopify order webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhooks/shopify/orders/updated', async (req, res) => {
  try {
    console.log('📝 Shopify Order Updated Webhook received');
    const order = req.body;
    console.log('📝 Updated Shopify Order:', {
      id: order.id,
      order_number: order.order_number,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status
    });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Shopify order updated webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhooks/shopify/orders/paid', async (req, res) => {
  try {
    console.log('💰 Shopify Order Paid Webhook received');
    const order = req.body;
    console.log('💰 Paid Shopify Order:', {
      id: order.id,
      order_number: order.order_number,
      total_price: order.total_price
    });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Shopify order paid webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/webhooks/shopify/orders/cancelled', async (req, res) => {
  try {
    console.log('❌ Shopify Order Cancelled Webhook received');
    const order = req.body;
    console.log('❌ Cancelled Shopify Order:', {
      id: order.id,
      order_number: order.order_number,
      cancelled_at: order.cancelled_at
    });
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Shopify order cancelled webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic Shopify webhook endpoint
app.post('/webhooks/shopify', async (req, res) => {
  try {
    console.log('🔔 Generic Shopify Webhook received');
    const topic = req.get('X-Shopify-Topic');
    console.log('📋 Webhook Topic:', topic);
    res.status(200).json({ received: true, topic });
  } catch (error) {
    console.error('❌ Generic Shopify webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Invoice endpoint
app.post('/api/create-invoice', async (req, res) => {
  try {
    console.log('📝 Creating QPay invoice:', req.body);
    
    const { orderId, amount, currency = 'MNT', customerEmail, customerPhone, orderNumber } = req.body;
    
    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, amount'
      });
    }
    
    // Check if invoice already exists
    const existingPayment = await dbClient.getPaymentByOrderId(orderId);
    if (existingPayment && existingPayment.status !== 'FAILED') {
      return res.json({
        success: true,
        data: {
          invoice_id: existingPayment.qpayInvoiceId,
          qr_code: existingPayment.qrCode,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          order_id: orderId,
          status: existingPayment.status,
          created_at: existingPayment.createdAt
        },
        message: 'Invoice already exists'
      });
    }
    
    // Verify Shopify order (if Shopify is configured)
    let shopifyOrder = null;
    if (process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
      try {
        shopifyOrder = await shopifyClient.getOrder(orderId);
        console.log('✅ Shopify order verified:', shopifyOrder.name);
      } catch (error) {
        console.warn('⚠️ Could not verify Shopify order:', error.message);
      }
    }
    
    // Create QPay invoice
    const invoiceData = {
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: orderId,
      invoice_receiver_code: orderNumber || `ORDER-${orderId}`,
      invoice_description: `Payment for order ${orderNumber || orderId}`,
      amount: parseFloat(amount),
      callback_url: `${process.env.BASE_URL}/api/webhook`
    };
    
    const qpayResponse = await qpayClient.createInvoice(invoiceData);
    
    if (!qpayResponse.success) {
      throw new Error(`QPay API error: ${qpayResponse.error}`);
    }
    
    // Save payment record to database
    const paymentRecord = {
      shopifyOrderId: orderId,
      qpayInvoiceId: qpayResponse.data.invoice_id,
      amount: amount.toString(),
      currency: currency,
      status: 'PENDING',
      qrCode: qpayResponse.data.qr_image || qpayResponse.data.qr_code,
      customerEmail: customerEmail || (shopifyOrder?.customer?.email),
      customerPhone: customerPhone || (shopifyOrder?.customer?.phone)
    };
    
    await dbClient.createOrderPayment(paymentRecord);
    
    // Add note to Shopify order (if configured)
    if (shopifyOrder && shopifyClient) {
      try {
        await shopifyClient.addOrderNote(orderId, 
          `QPay invoice created: ${qpayResponse.data.invoice_id}. Payment pending.`
        );
      } catch (error) {
        console.warn('⚠️ Could not add note to Shopify order:', error.message);
      }
    }
    
    console.log('✅ QPay invoice created successfully:', qpayResponse.data.invoice_id);
    
    res.json({
      success: true,
      data: {
        invoice_id: qpayResponse.data.invoice_id,
        qr_text: qpayResponse.data.qr_text,
        qr_image: qpayResponse.data.qr_image,
        qr_code: qpayResponse.data.qr_image || qpayResponse.data.qr_code,
        amount: amount,
        currency: currency,
        order_id: orderId,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating QPay invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Webhook endpoint
// Shopify order creation webhook
app.all('/api/webhook/orders/create', async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle GET request for testing
    if (req.method === 'GET') {
      return res.json({ 
        status: 'OK', 
        message: 'Shopify order creation webhook endpoint is active',
        timestamp: new Date().toISOString()
      });
    }

    // Handle POST request for actual webhook
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('📦 Shopify order webhook received:', req.body);
    
    const order = req.body;
    
    // Validate order data
    if (!order || !order.id) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Create QPay invoice for the order
    const invoiceData = {
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: `SHOPIFY-${order.id}`,
      invoice_receiver_code: order.billing_address?.phone || order.phone || 'CUSTOMER',
      invoice_description: `Shopify Order #${order.order_number || order.id}`,
      amount: parseFloat(order.total_price || order.current_total_price || 0),
      callback_url: `${process.env.RENDER_EXTERNAL_URL || req.protocol + '://' + req.get('host')}/api/webhook/qpay`
    };

    console.log('💰 Creating QPay invoice:', invoiceData);
    
    const qpayResponse = await qpayClient.createInvoice(invoiceData);
    
    if (qpayResponse.success) {
      // Store order and invoice relationship
      await dbClient.storeOrder({
        shopify_order_id: order.id,
        qpay_invoice_id: qpayResponse.invoice_id,
        amount: invoiceData.amount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      
      console.log('✅ QPay invoice created successfully:', qpayResponse.invoice_id);
      res.json({ success: true, invoice_id: qpayResponse.invoice_id });
    } else {
      console.error('❌ Failed to create QPay invoice:', qpayResponse.error);
      res.status(500).json({ error: 'Failed to create payment invoice' });
    }
    
  } catch (error) {
    console.error('❌ Shopify webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// QPay payment confirmation webhook
app.all('/api/webhook/qpay', qpaySecurityMiddleware, async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Handle GET request for testing
    if (req.method === 'GET') {
      return res.json({ 
        status: 'OK', 
        message: 'QPay payment confirmation webhook endpoint is active',
        timestamp: new Date().toISOString()
      });
    }

    // Handle POST request for actual webhook
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('💳 QPay webhook received:', req.body);
    
    const payment = req.body;
    
    // Validate payment data
    if (!payment || !payment.invoice_id) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    // Update order status based on payment
    const orderData = await dbClient.getOrderByInvoiceId(payment.invoice_id);
    
    if (orderData) {
      // Update order status
      await dbClient.updateOrderStatus(orderData.shopify_order_id, {
        status: payment.payment_status === 'PAID' ? 'paid' : 'failed',
        qpay_payment_id: payment.payment_id,
        updated_at: new Date().toISOString()
      });
      
      // Update Shopify order if payment is successful
      if (payment.payment_status === 'PAID') {
        await shopifyClient.fulfillOrder(orderData.shopify_order_id);
        console.log('✅ Order fulfilled in Shopify:', orderData.shopify_order_id);
      }
      
      console.log('✅ Payment processed successfully:', payment.invoice_id);
      res.json({ success: true, message: 'Payment processed' });
    } else {
      console.error('❌ Order not found for invoice:', payment.invoice_id);
      res.status(404).json({ error: 'Order not found' });
    }
    
  } catch (error) {
    console.error('❌ QPay webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy webhook endpoint (keep for backward compatibility)
app.post('/api/webhook', qpaySecurityMiddleware, async (req, res) => {
  try {
    console.log('🔔 Received QPay webhook:', req.body);
    
    // Log webhook event
    await dbClient.logWebhookEvent({
      source: 'qpay',
      event_type: 'payment_notification',
      payload: req.body,
      headers: req.headers
    });
    
    // Verify webhook signature (if configured)
    if (process.env.QPAY_WEBHOOK_SECRET) {
      const isValid = qpayClient.verifyWebhookSignature(
        req.body,
        req.headers['x-qpay-signature'] || req.headers['signature'],
        process.env.QPAY_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }
    }
    
    const { invoice_id, payment_status, payment_amount, sender_invoice_no, payment_id, paid_date } = req.body;
    
    if (!invoice_id || !payment_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required webhook fields: invoice_id, payment_status'
      });
    }
    
    // Get payment record
    const paymentRecord = await dbClient.getPaymentByInvoiceId(invoice_id);
    if (!paymentRecord) {
      console.warn('⚠️ Payment record not found for invoice:', invoice_id);
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }
    
    // Update payment status
    const updateData = {
      status: payment_status,
      paidAt: payment_status === 'PAID' ? (paid_date ? new Date(paid_date) : new Date()) : null,
      qpayTransactionId: payment_id,
      webhookData: req.body
    };
    
    await dbClient.updateOrderPayment(paymentRecord.id, updateData);
    
    // Process based on payment status
    if (payment_status === 'PAID') {
      console.log('✅ Payment confirmed for order:', paymentRecord.shopifyOrderId);
      
      // Update Shopify order (if configured)
      if (process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
        try {
          // Create transaction in Shopify
          await shopifyClient.createTransaction(paymentRecord.shopifyOrderId, {
            kind: 'capture',
            status: 'success',
            amount: payment_amount || paymentRecord.amount,
            currency: paymentRecord.currency,
            gateway: 'QPay',
            source_name: 'QPay',
            transaction_id: payment_id
          });
          
          // Update order financial status
          await shopifyClient.updateOrderFinancialStatus(paymentRecord.shopifyOrderId, 'paid');
          
          // Add success note
          await shopifyClient.addOrderNote(paymentRecord.shopifyOrderId, 
            `Payment confirmed via QPay. Transaction ID: ${payment_id}`
          );
          
          console.log('✅ Shopify order updated successfully');
        } catch (error) {
          console.error('❌ Error updating Shopify order:', error.message);
        }
      }
      
    } else if (payment_status === 'FAILED') {
      console.log('❌ Payment failed for order:', paymentRecord.shopifyOrderId);
      
      // Add failure note to Shopify (if configured)
      if (process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
        try {
          await shopifyClient.addOrderNote(paymentRecord.shopifyOrderId, 
            `Payment failed via QPay. Invoice: ${invoice_id}`
          );
        } catch (error) {
          console.error('❌ Error adding failure note to Shopify:', error.message);
        }
      }
    }
    
    res.json({
      success: true,
      message: `Webhook processed successfully for invoice ${invoice_id}`,
      data: {
        invoice_id,
        payment_status,
        order_id: paymentRecord.shopifyOrderId,
        processed_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Order Status endpoint
app.get('/api/order-status', async (req, res) => {
  try {
    const { orderId, invoiceId } = req.query;
    
    if (!orderId && !invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Either orderId or invoiceId is required'
      });
    }
    
    console.log(`📊 Checking order status: ${orderId || invoiceId}`);
    
    // Get payment record
    let paymentRecord;
    if (orderId) {
      paymentRecord = await dbClient.getPaymentByOrderId(orderId);
    } else {
      paymentRecord = await dbClient.getPaymentByInvoiceId(invoiceId);
    }
    
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found'
      });
    }
    
    // Check QPay status if payment is still pending
    if (paymentRecord.status === 'PENDING') {
      try {
        const qpayStatus = await qpayClient.checkInvoiceStatus(paymentRecord.qpayInvoiceId);
        
        if (qpayStatus.success && qpayStatus.data.payment_status === 'PAID') {
          // Update local record
          await dbClient.updateOrderPayment(paymentRecord.id, {
            status: 'PAID',
            paidAt: new Date(),
            qpayTransactionId: qpayStatus.data.payment_id
          });
          
          // Update Shopify if configured
          if (process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
            try {
              await shopifyClient.createTransaction(paymentRecord.shopifyOrderId, {
                kind: 'capture',
                status: 'success',
                amount: paymentRecord.amount,
                currency: paymentRecord.currency,
                gateway: 'QPay',
                transaction_id: qpayStatus.data.payment_id
              });
              
              await shopifyClient.updateOrderFinancialStatus(paymentRecord.shopifyOrderId, 'paid');
            } catch (error) {
              console.error('❌ Error updating Shopify after status check:', error.message);
            }
          }
          
          paymentRecord.status = 'PAID';
          paymentRecord.paidAt = new Date();
        }
      } catch (error) {
        console.warn('⚠️ Could not check QPay status:', error.message);
      }
    }
    
    res.json({
      success: true,
      data: {
        order_id: paymentRecord.shopifyOrderId,
        invoice_id: paymentRecord.qpayInvoiceId,
        payment_status: paymentRecord.status,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        qr_code: paymentRecord.qrCode,
        created_at: paymentRecord.createdAt,
        paid_at: paymentRecord.paidAt,
        customer_email: paymentRecord.customerEmail,
        customer_phone: paymentRecord.customerPhone
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking order status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      mode: 'PRODUCTION',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        qpay: 'unknown',
        shopify: 'unknown'
      }
    };
    
    // Check database
    try {
      await dbClient.healthCheck();
      health.services.database = 'healthy';
    } catch (error) {
      health.services.database = 'unhealthy';
    }
    
    // Check QPay (if configured)
    if (process.env.QPAY_USERNAME && process.env.QPAY_PASSWORD) {
      try {
        await qpayClient.authenticate();
        health.services.qpay = 'healthy';
      } catch (error) {
        health.services.qpay = 'unhealthy';
      }
    }
    
    // Check Shopify (if configured)
    if (process.env.SHOPIFY_SHOP_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN) {
      health.services.shopify = 'configured';
    }
    
    const allHealthy = Object.values(health.services).every(status => 
      status === 'healthy' || status === 'configured'
    );
    
    if (!allHealthy) {
      health.status = 'degraded';
    }
    
    res.status(allHealthy ? 200 : 503).json(health);
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  
  if (dbClient) {
    await dbClient.disconnect();
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  
  if (dbClient) {
    await dbClient.disconnect();
  }
  
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeClients();
    
    app.listen(PORT, () => {
      console.log('🚀 QPay Shopify Integration - Production Server Started');
      console.log(`📍 Server running at: http://localhost:${PORT}`);
      console.log(`💡 Health Check: http://localhost:${PORT}/health`);
      console.log('\n📋 Available Endpoints:');
      console.log('  GET  / - API Information');
      console.log('  POST /api/create-invoice - Create QPay Invoice');
      console.log('  POST /api/webhook - QPay Webhook Handler');
      console.log('  GET  /api/order-status - Check Order Status');
      console.log('  GET  /health - Health Check');
      console.log('\n🎯 Production server ready!');
      
      // Log configuration status
      console.log('\n🔧 Configuration Status:');
      console.log(`  QPay: ${process.env.QPAY_USERNAME ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`  Shopify: ${process.env.SHOPIFY_SHOP_DOMAIN ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`  Database: ${process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;