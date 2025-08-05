const QPayClient = require('../../../lib/qpay');
const ShopifyClient = require('../../../lib/shopify');
const DatabaseClient = require('../../../lib/database');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Shopify-Hmac-Sha256, X-Shopify-Topic, X-Shopify-Shop-Domain');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Shopify Order Creation Webhook Endpoint',
      status: 'active',
      accepts: 'POST requests with Shopify order data',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];
    const shop = req.headers['x-shopify-shop-domain'];
    const payload = req.body;

    console.log('📦 Order Creation Webhook Received:', {
      topic,
      shop,
      orderId: payload.id,
      orderNumber: payload.order_number,
      paymentGateway: payload.gateway
    });

    // Initialize clients
    const qpay = new QPayClient();
    const shopify = new ShopifyClient();
    const db = new DatabaseClient();

    try {
      await db.connect();

      // Verify Shopify webhook signature
      if (hmac && process.env.SHOPIFY_WEBHOOK_SECRET) {
        const body = JSON.stringify(payload);
        const calculatedHmac = crypto
          .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
          .update(body, 'utf8')
          .digest('base64');

        if (hmac !== calculatedHmac) {
          console.error('❌ Invalid Shopify webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Check if this is a QPay order
      const isQPayOrder = payload.gateway === 'manual' && 
                         payload.payment_gateway_names && 
                         payload.payment_gateway_names.includes('QPay');

      if (!isQPayOrder) {
        console.log('ℹ️  Not a QPay order, skipping...');
        return res.status(200).json({ message: 'Not a QPay order' });
      }

      // Log the order creation event
      await db.logWebhookEvent({
        eventType: 'shopify_order_created',
        orderId: payload.id,
        payload: payload,
        processed: false
      });

      // Create QPay invoice for the order
      const invoiceData = {
        invoice_code: `SHOPIFY-${payload.order_number}`,
        sender_invoice_no: payload.order_number.toString(),
        invoice_receiver_code: payload.customer?.phone || payload.customer?.email || 'GUEST',
        invoice_description: `Shopify Order #${payload.order_number}`,
        amount: Math.round(parseFloat(payload.total_price) * 100), // Convert to MNT cents
        callback_url: `${process.env.VERCEL_URL || 'https://satori-71aczw5hy-byrlns-projects.vercel.app'}/api/webhook/qpay`,
        sender_branch_code: 'online',
        sender_staff_code: 'shopify',
        enable_expiry: true,
        allow_partial: false,
        allow_exceed: false,
        invoice_receiver_data: {
          name: payload.customer?.first_name && payload.customer?.last_name 
                ? `${payload.customer.first_name} ${payload.customer.last_name}` 
                : 'Guest Customer',
          email: payload.customer?.email || '',
          phone: payload.customer?.phone || '',
          address: payload.shipping_address ? 
                  `${payload.shipping_address.address1}, ${payload.shipping_address.city}` : ''
        },
        lines: payload.line_items.map(item => ({
          line_description: item.title,
          line_quantity: item.quantity,
          line_unit_price: Math.round(parseFloat(item.price) * 100),
          line_tax_amount: Math.round(parseFloat(item.total_discount || 0) * 100),
          line_tax_code: 'VAT_0' // Default tax code
        }))
      };

      console.log('💳 Creating QPay invoice for order:', payload.order_number);
      const qpayResponse = await qpay.createInvoice(invoiceData);

      if (qpayResponse.success) {
        // Store the QPay invoice details
        await db.storeOrderPayment({
          shopifyOrderId: payload.id,
          orderNumber: payload.order_number,
          qpayInvoiceId: qpayResponse.invoice_id,
          qpayQrText: qpayResponse.qr_text,
          qpayQrImage: qpayResponse.qr_image,
          amount: invoiceData.amount,
          status: 'pending',
          createdAt: new Date()
        });

        console.log('✅ QPay invoice created successfully:', qpayResponse.invoice_id);

        // Update Shopify order with QPay payment link
        const paymentUrl = `${process.env.VERCEL_URL || 'https://satori-71aczw5hy-byrlns-projects.vercel.app'}/pay/${qpayResponse.invoice_id}`;
        
        try {
          await shopify.addOrderNote(payload.id, 
            `QPay Payment Link: ${paymentUrl}\nInvoice ID: ${qpayResponse.invoice_id}`
          );
        } catch (noteError) {
          console.warn('⚠️  Could not add note to Shopify order:', noteError.message);
        }

        return res.status(200).json({
          success: true,
          message: 'QPay invoice created',
          invoiceId: qpayResponse.invoice_id,
          paymentUrl: paymentUrl
        });
      } else {
        console.error('❌ Failed to create QPay invoice:', qpayResponse.error);
        return res.status(500).json({ 
          error: 'Failed to create QPay invoice',
          details: qpayResponse.error 
        });
      }

    } finally {
      await db.disconnect();
    }

  } catch (error) {
    console.error('❌ Order creation webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};