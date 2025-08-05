const QPayClient = require('../../lib/qpay');
const ShopifyClient = require('../../lib/shopify');
const DatabaseClient = require('../../lib/database');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-QPay-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'QPay Payment Webhook Endpoint',
      status: 'active',
      accepts: 'POST requests with QPay payment notifications',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-qpay-signature'] || req.headers['x-signature'];
    const payload = req.body;

    console.log('💳 QPay Webhook Received:', {
      signature: signature ? 'Present' : 'Missing',
      payload: payload
    });

    // Initialize clients
    const qpay = new QPayClient();
    const shopify = new ShopifyClient();
    const db = new DatabaseClient();

    try {
      await db.connect();

      // Log webhook event
      await db.logWebhookEvent({
        eventType: 'qpay_payment_notification',
        payload: payload,
        processed: false
      });

      // Verify webhook signature if provided
      if (signature && process.env.QPAY_WEBHOOK_SECRET) {
        const isValid = qpay.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          console.error('❌ Invalid QPay webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Parse webhook payload
      const webhookData = qpay.parseWebhookPayload(payload);
      
      if (!webhookData) {
        console.error('❌ Invalid webhook payload format');
        return res.status(400).json({ error: 'Invalid payload format' });
      }

      const { invoiceId, paymentId, status, amount } = webhookData;

      console.log('📋 Processing QPay payment:', {
        invoiceId,
        paymentId,
        status,
        amount
      });

      // Find the corresponding Shopify order
      const orderPayment = await db.getOrderPaymentByInvoiceId(invoiceId);
      
      if (!orderPayment) {
        console.error('❌ No matching order found for invoice:', invoiceId);
        return res.status(404).json({ error: 'Order not found' });
      }

      // Update payment status in database
      await db.updateOrderPaymentStatus(invoiceId, {
        status: status,
        paymentId: paymentId,
        paidAt: status === 'PAID' ? new Date() : null,
        updatedAt: new Date()
      });

      // If payment is successful, update Shopify order
      if (status === 'PAID') {
        console.log('✅ Payment confirmed, updating Shopify order:', orderPayment.shopifyOrderId);
        
        try {
          // Mark order as paid in Shopify
          await shopify.markOrderAsPaid(orderPayment.shopifyOrderId, {
            amount: amount / 100, // Convert from cents to MNT
            currency: 'MNT',
            gateway: 'QPay',
            transaction_id: paymentId,
            source_name: 'QPay Mobile Banking'
          });

          // Add success note to order
          await shopify.addOrderNote(orderPayment.shopifyOrderId, 
            `✅ QPay Payment Confirmed\nPayment ID: ${paymentId}\nAmount: ${amount / 100} MNT\nPaid at: ${new Date().toISOString()}`
          );

          console.log('✅ Shopify order updated successfully');

        } catch (shopifyError) {
          console.error('❌ Failed to update Shopify order:', shopifyError.message);
          
          // Still mark as processed in our system, but log the error
          await db.logWebhookEvent({
            eventType: 'shopify_update_failed',
            orderId: orderPayment.shopifyOrderId,
            payload: { error: shopifyError.message, paymentId, invoiceId },
            processed: false
          });
        }
      } else if (status === 'CANCELLED' || status === 'EXPIRED') {
        console.log('❌ Payment cancelled/expired, updating Shopify order:', orderPayment.shopifyOrderId);
        
        try {
          await shopify.addOrderNote(orderPayment.shopifyOrderId, 
            `❌ QPay Payment ${status}\nInvoice ID: ${invoiceId}\nStatus updated at: ${new Date().toISOString()}`
          );
        } catch (shopifyError) {
          console.warn('⚠️  Could not add note to Shopify order:', shopifyError.message);
        }
      }

      // Mark webhook as processed
      await db.markWebhookAsProcessed(payload, true);

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        invoiceId: invoiceId,
        status: status
      });

    } finally {
      await db.disconnect();
    }

  } catch (error) {
    console.error('❌ QPay webhook processing error:', error);
    
    try {
      const db = new DatabaseClient();
      await db.connect();
      await db.markWebhookAsProcessed(req.body, false, error.message);
      await db.disconnect();
    } catch (dbError) {
      console.error('❌ Failed to log webhook error:', dbError);
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};