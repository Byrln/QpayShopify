const QPayClient = require('../lib/qpay');
const ShopifyClient = require('../lib/shopify');
const DatabaseClient = require('../lib/database');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-QPay-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-qpay-signature'] || req.headers['x-signature'];
    const payload = req.body;

    // Initialize clients
    const qpay = new QPayClient();
    const shopify = new ShopifyClient();
    const db = new DatabaseClient();

    try {
      await db.connect();

      // Log webhook event
      await db.logWebhookEvent({
        eventType: 'payment_notification',
        payload: payload,
        processed: false
      });

      // Verify webhook signature if provided
      if (signature && process.env.WEBHOOK_SECRET) {
        const isValid = qpay.verifyWebhookSignature(payload, signature);
        if (!isValid) {
          console.error('Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      // Parse webhook payload
      const webhookData = qpay.parseWebhookPayload(payload);
      
      console.log('Webhook received:', {
        invoiceId: webhookData.invoiceId,
        status: webhookData.status,
        amount: webhookData.amount
      });

      // Get order payment record
      const paymentResult = await db.getOrderPaymentByInvoiceId(webhookData.invoiceId);
      
      if (!paymentResult.success || !paymentResult.data) {
        console.error('Order payment not found for invoice:', webhookData.invoiceId);
        return res.status(404).json({ error: 'Order payment not found' });
      }

      const orderPayment = paymentResult.data;

      // Check if already processed
      if (orderPayment.status === 'paid') {
        console.log('Payment already processed for invoice:', webhookData.invoiceId);
        return res.status(200).json({ 
          success: true, 
          message: 'Payment already processed' 
        });
      }

      // Process payment based on status
      if (webhookData.status === 'PAID' || webhookData.status === 'paid') {
        // Update payment status in database
        const updateResult = await db.updatePaymentStatus(
          webhookData.invoiceId,
          'paid',
          {
            transactionId: webhookData.transactionId,
            amount: webhookData.amount
          }
        );

        if (!updateResult.success) {
          console.error('Failed to update payment status:', updateResult.error);
          return res.status(500).json({ error: 'Failed to update payment status' });
        }

        // Create transaction in Shopify
        const transactionResult = await shopify.createTransaction(
          orderPayment.shopifyOrderId,
          {
            amount: webhookData.amount || orderPayment.amount,
            currency: webhookData.currency || orderPayment.currency
          }
        );

        if (!transactionResult.success) {
          console.error('Failed to create Shopify transaction:', transactionResult.error);
          // Continue anyway, we'll try to update the order status
        }

        // Update order financial status
        const orderUpdateResult = await shopify.updateOrderFinancialStatus(
          orderPayment.shopifyOrderId,
          'paid'
        );

        if (!orderUpdateResult.success) {
          console.error('Failed to update Shopify order status:', orderUpdateResult.error);
          return res.status(500).json({ 
            error: 'Payment processed but failed to update Shopify order',
            details: orderUpdateResult.error
          });
        }

        // Add success note to order
        await shopify.addOrderNote(
          orderPayment.shopifyOrderId,
          `Payment confirmed via QPay. Transaction ID: ${webhookData.transactionId}. Amount: ${webhookData.amount} ${webhookData.currency}`
        );

        console.log('Payment successfully processed:', {
          orderId: orderPayment.shopifyOrderId,
          invoiceId: webhookData.invoiceId,
          transactionId: webhookData.transactionId
        });

        return res.status(200).json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            orderId: orderPayment.shopifyOrderId,
            invoiceId: webhookData.invoiceId,
            status: 'paid'
          }
        });

      } else if (webhookData.status === 'FAILED' || webhookData.status === 'failed') {
        // Update payment status to failed
        await db.updatePaymentStatus(webhookData.invoiceId, 'failed');
        
        // Add note to Shopify order
        await shopify.addOrderNote(
          orderPayment.shopifyOrderId,
          `QPay payment failed. Invoice ID: ${webhookData.invoiceId}`
        );

        return res.status(200).json({
          success: true,
          message: 'Payment failed',
          data: {
            orderId: orderPayment.shopifyOrderId,
            invoiceId: webhookData.invoiceId,
            status: 'failed'
          }
        });

      } else {
        console.log('Unhandled payment status:', webhookData.status);
        return res.status(200).json({
          success: true,
          message: 'Webhook received but no action taken',
          status: webhookData.status
        });
      }

    } finally {
      await db.disconnect();
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Webhook processing failed'
    });
  }
};