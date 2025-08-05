const QPayClient = require('../lib/qpay');
const ShopifyClient = require('../lib/shopify');
const DatabaseClient = require('../lib/database');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, invoiceId } = req.query;

    if (!orderId && !invoiceId) {
      return res.status(400).json({ 
        error: 'Either orderId or invoiceId is required' 
      });
    }

    // Initialize clients
    const qpay = new QPayClient();
    const shopify = new ShopifyClient();
    const db = new DatabaseClient();

    try {
      await db.connect();

      let orderPayment;

      // Get order payment record
      if (invoiceId) {
        const result = await db.getOrderPaymentByInvoiceId(invoiceId);
        if (!result.success || !result.data) {
          return res.status(404).json({ error: 'Payment record not found' });
        }
        orderPayment = result.data;
      } else {
        const result = await db.getOrderPaymentByShopifyId(orderId);
        if (!result.success || !result.data) {
          return res.status(404).json({ error: 'Payment record not found' });
        }
        orderPayment = result.data;
      }

      // If payment is already completed, return cached status
      if (orderPayment.status === 'paid' || orderPayment.status === 'failed') {
        return res.status(200).json({
          success: true,
          data: {
            orderId: orderPayment.shopifyOrderId,
            orderNumber: orderPayment.orderNumber,
            invoiceId: orderPayment.qpayInvoiceId,
            status: orderPayment.status,
            amount: orderPayment.amount,
            currency: orderPayment.currency,
            paidAt: orderPayment.paidAt,
            transactionId: orderPayment.transactionId,
            qrText: orderPayment.qrText,
            qrImage: orderPayment.qrImage
          }
        });
      }

      // For pending payments, check with QPay API
      const statusResult = await qpay.checkInvoiceStatus(orderPayment.qpayInvoiceId);
      
      if (!statusResult.success) {
        console.error('Failed to check QPay status:', statusResult.error);
        // Return database status as fallback
        return res.status(200).json({
          success: true,
          data: {
            orderId: orderPayment.shopifyOrderId,
            orderNumber: orderPayment.orderNumber,
            invoiceId: orderPayment.qpayInvoiceId,
            status: orderPayment.status,
            amount: orderPayment.amount,
            currency: orderPayment.currency,
            qrText: orderPayment.qrText,
            qrImage: orderPayment.qrImage,
            warning: 'Could not verify with QPay API'
          }
        });
      }

      const qpayStatus = statusResult.status;
      let updatedStatus = orderPayment.status;

      // Update status if changed
      if (qpayStatus === 'PAID' && orderPayment.status !== 'paid') {
        // Payment was completed, update our records
        const updateResult = await db.updatePaymentStatus(
          orderPayment.qpayInvoiceId,
          'paid',
          {
            transactionId: statusResult.data.payment_id,
            amount: statusResult.data.payment_amount
          }
        );

        if (updateResult.success) {
          updatedStatus = 'paid';
          
          // Update Shopify order
          await shopify.createTransaction(
            orderPayment.shopifyOrderId,
            {
              amount: statusResult.data.payment_amount || orderPayment.amount,
              currency: statusResult.data.payment_currency || orderPayment.currency
            }
          );

          await shopify.updateOrderFinancialStatus(
            orderPayment.shopifyOrderId,
            'paid'
          );

          await shopify.addOrderNote(
            orderPayment.shopifyOrderId,
            `Payment confirmed via status check. Transaction ID: ${statusResult.data.payment_id}`
          );
        }
      } else if (qpayStatus === 'FAILED' && orderPayment.status !== 'failed') {
        await db.updatePaymentStatus(orderPayment.qpayInvoiceId, 'failed');
        updatedStatus = 'failed';
      }

      // Get updated order payment if status changed
      if (updatedStatus !== orderPayment.status) {
        const updatedResult = await db.getOrderPaymentByInvoiceId(orderPayment.qpayInvoiceId);
        if (updatedResult.success) {
          orderPayment = updatedResult.data;
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          orderId: orderPayment.shopifyOrderId,
          orderNumber: orderPayment.orderNumber,
          invoiceId: orderPayment.qpayInvoiceId,
          status: updatedStatus,
          amount: orderPayment.amount,
          currency: orderPayment.currency,
          paidAt: orderPayment.paidAt,
          transactionId: orderPayment.transactionId,
          qrText: orderPayment.qrText,
          qrImage: orderPayment.qrImage,
          qpayStatus: qpayStatus,
          lastChecked: new Date().toISOString()
        }
      });

    } finally {
      await db.disconnect();
    }

  } catch (error) {
    console.error('Order status check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to check order status'
    });
  }
};