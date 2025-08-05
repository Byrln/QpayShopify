const QPayClient = require('../lib/qpay');
const ShopifyClient = require('../lib/shopify');
const DatabaseClient = require('../lib/database');
const QRCode = require('qrcode');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, orderNumber, amount, currency = 'MNT', customerEmail, customerPhone } = req.body;

    if (!orderId || !orderNumber || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, orderNumber, amount' 
      });
    }

    // Initialize clients
    const qpay = new QPayClient();
    const shopify = new ShopifyClient();
    const db = new DatabaseClient();

    try {
      await db.connect();

      // Check if invoice already exists for this order
      const existingPayment = await db.getOrderPaymentByShopifyId(orderId);
      if (existingPayment.success && existingPayment.data) {
        return res.status(200).json({
          success: true,
          message: 'Invoice already exists',
          data: {
            invoiceId: existingPayment.data.qpayInvoiceId,
            qrText: existingPayment.data.qrText,
            qrImage: existingPayment.data.qrImage,
            status: existingPayment.data.status
          }
        });
      }

      // Verify order exists in Shopify
      const orderResult = await shopify.getOrder(orderId);
      if (!orderResult.success) {
        return res.status(404).json({ 
          error: 'Order not found in Shopify',
          details: orderResult.error 
        });
      }

      // Create QPay invoice
      const invoiceData = {
        orderId,
        orderNumber,
        amount: parseFloat(amount),
        customerPhone: customerPhone || orderResult.order?.customer?.phone
      };

      const invoiceResult = await qpay.createInvoice(invoiceData);
      
      if (!invoiceResult.success) {
        return res.status(500).json({ 
          error: 'Failed to create QPay invoice',
          details: invoiceResult.error 
        });
      }

      // Generate QR code as base64 image
      let qrImageBase64 = null;
      try {
        qrImageBase64 = await QRCode.toDataURL(invoiceResult.qrText, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (qrError) {
        console.warn('Failed to generate QR code image:', qrError);
      }

      // Save to database
      const dbResult = await db.createOrderPayment({
        shopifyOrderId: orderId,
        orderNumber,
        qpayInvoiceId: invoiceResult.invoiceId,
        amount: parseFloat(amount),
        currency,
        customerEmail: customerEmail || orderResult.order?.customer?.email,
        customerPhone: customerPhone || orderResult.order?.customer?.phone,
        qrText: invoiceResult.qrText,
        qrImage: qrImageBase64
      });

      if (!dbResult.success) {
        console.error('Failed to save payment record:', dbResult.error);
        // Continue anyway, as the invoice was created successfully
      }

      // Add note to Shopify order
      await shopify.addOrderNote(
        orderId, 
        `QPay invoice created: ${invoiceResult.invoiceId}. Amount: ${amount} ${currency}`
      );

      return res.status(200).json({
        success: true,
        data: {
          invoiceId: invoiceResult.invoiceId,
          qrText: invoiceResult.qrText,
          qrImage: qrImageBase64,
          qrImageUrl: invoiceResult.qrImage,
          urls: invoiceResult.urls,
          amount,
          currency,
          orderNumber,
          expiresIn: '15 minutes'
        }
      });

    } finally {
      await db.disconnect();
    }

  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};