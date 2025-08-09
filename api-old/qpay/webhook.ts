import { Hono } from 'hono';
import type { QPayWebhookPayload } from '../../types/qpay';

const app = new Hono();

// QPay callback handler (GET request with qpay_payment_id parameter)
app.get('/', async (c) => {
  try {
    const qpayPaymentId = c.req.query('qpay_payment_id');
    
    if (!qpayPaymentId) {
      return c.text('ERROR: Missing qpay_payment_id parameter', 400);
    }

    console.log('📨 QPay callback received:', {
      qpay_payment_id: qpayPaymentId,
      timestamp: new Date().toISOString(),
    });

    // Here you would typically:
    // 1. Use the payment ID to check payment status via QPay API
    // 2. Update your database
    // 3. Update Shopify order status
    // 4. Send confirmation emails
    
    // Check payment status using QPay API
    const config = {
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2',
    };
    
    if (config.username && config.password && config.invoice_code) {
      const { QPayService } = await import('../../lib/qpay');
      const qpayService = new QPayService(config);
      
      try {
        const paymentResult = await qpayService.checkPayment(qpayPaymentId);
        if (paymentResult.success && paymentResult.data) {
          console.log('💰 Payment details:', paymentResult.data);
          
          // Process payment based on status
          const payments = paymentResult.data.rows || [];
          for (const payment of payments) {
            if (payment.payment_status === 'PAID') {
              console.log('✅ Confirmed payment:', payment.payment_id);
              // TODO: Update database, Shopify order, send emails, etc.
            }
          }
        }
      } catch (error) {
        console.error('❌ Payment check failed:', error);
      }
    }
    
    console.log('✅ Payment callback processed for ID:', qpayPaymentId);
    
    // Return SUCCESS response as required by QPay documentation
    return c.text('SUCCESS', 200);
    
  } catch (error) {
    console.error('❌ Callback processing error:', error);
    // Return SUCCESS even on error to prevent QPay retries
    return c.text('SUCCESS', 200);
  }
});

// QPay webhook handler (POST request for custom implementations)
app.post('/', async (c) => {
  try {
    const body = await c.req.json() as QPayWebhookPayload;
    const { invoice_id, payment_status, amount, currency, sender_name } = body;

    // Validate required webhook fields
    if (!invoice_id || !payment_status) {
      return c.json(
        {
          success: false,
          error: 'Webhook-ийн шаардлагатай талбарууд дутуу: invoice_id, payment_status', // Missing required webhook fields in Mongolian
        },
        400 as any
      );
    }

    console.log('📨 QPay webhook received:', {
      invoice_id,
      payment_status,
      amount,
      currency,
      sender_name,
      timestamp: new Date().toISOString(),
    });

    // Process webhook based on payment status
    switch (payment_status) {
      case 'PAID':
        console.log('✅ Payment confirmed for invoice:', invoice_id);

        // Here you would typically:
        // 1. Update your database
        // 2. Update Shopify order status
        // 3. Send confirmation emails
        // 4. Trigger fulfillment processes

        // Example database update (you'd implement this based on your needs)
        await handlePaidPayment({
          invoice_id,
          amount,
          currency,
          sender_name,
          paid_at: new Date().toISOString(),
        });

        break;

      case 'CANCELLED':
        console.log('❌ Payment cancelled for invoice:', invoice_id);

        await handleCancelledPayment({
          invoice_id,
          cancelled_at: new Date().toISOString(),
        });

        break;

      case 'PENDING':
        console.log('⏳ Payment pending for invoice:', invoice_id);
        break;

      default:
        console.warn('⚠️ Unknown payment status:', payment_status);
    }

    // Return success response to QPay
    return c.json({
      success: true,
      message: 'Webhook амжилттай боловсруулагдлаа', // Webhook processed successfully in Mongolian
      invoice_id,
      payment_status,
      processed_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    // Return error but with 200 status to prevent QPay retries
    return c.json(
      {
        success: false,
        error: 'Webhook боловсруулахад алдаа гарлаа', // Error processing webhook in Mongolian
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      200 // Return 200 to prevent QPay from retrying
    );
  }
});

// Handle successful payment
async function handlePaidPayment(paymentData: {
  invoice_id: string;
  amount?: number;
  currency?: string;
  sender_name?: string;
  paid_at: string;
}) {
  try {
    console.log('Processing paid payment:', paymentData);

    // Production payment processing
    console.log('✅ Payment confirmed for invoice:', paymentData.invoice_id);

    // Extract order ID from invoice ID (format: ORDER_orderId_timestamp)
    const orderIdMatch = paymentData.invoice_id.match(/ORDER_(.+)_\d+/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (!orderId) {
      console.error('❌ Could not extract order ID from invoice:', paymentData.invoice_id);
      return;
    }

    // TODO: Replace with your actual database operations
    // Example: Update payment status in database
    // await updatePaymentStatus(paymentData.invoice_id, 'PAID', paymentData.paid_at);
    
    // Update Shopify order status
    if (paymentData.invoice_id.startsWith('SHOPIFY-')) {
      const shopifyOrderNumber = paymentData.invoice_id.replace('SHOPIFY-', '');
      await updateShopifyOrder(shopifyOrderNumber, 'paid');
      console.log(`✅ Shopify order ${shopifyOrderNumber} marked as PAID`);
    }
    
    // TODO: Replace with your actual notification system
    // Example: Send confirmation email
    // await sendPaymentConfirmationEmail(orderId, paymentData);
    
    // TODO: Replace with your actual fulfillment system
    // Example: Trigger order fulfillment
    // await triggerOrderFulfillment(orderId);

    console.log('📝 Payment processing completed for order:', orderId);
    console.log('✅ Paid payment processed successfully');
  } catch (error) {
    console.error('Error handling paid payment:', error);
    throw error;
  }
}

// Handle cancelled payment
async function handleCancelledPayment(paymentData: {
  invoice_id: string;
  cancelled_at: string;
}) {
  try {
    console.log('Processing cancelled payment:', paymentData);

    // Extract order ID from invoice ID
    const orderIdMatch = paymentData.invoice_id.match(/ORDER_(.+)_\d+/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (!orderId) {
      console.error('❌ Could not extract order ID from invoice:', paymentData.invoice_id);
      return;
    }

    // TODO: Replace with your actual database operations
    // Example: Update payment status in database
    // await updatePaymentStatus(paymentData.invoice_id, 'CANCELLED', paymentData.cancelled_at);
    
    // Update Shopify order status
    if (paymentData.invoice_id.startsWith('SHOPIFY-')) {
      const shopifyOrderNumber = paymentData.invoice_id.replace('SHOPIFY-', '');
      await updateShopifyOrder(shopifyOrderNumber, 'failed');
      console.log(`❌ Shopify order ${shopifyOrderNumber} marked as FAILED`);
    }
    
    // TODO: Replace with your actual notification system
    // Example: Send cancellation notification
    // await sendPaymentCancellationEmail(orderId, paymentData);

    console.log('📝 Cancellation processing completed for order:', orderId);
    console.log('✅ Cancelled payment processed successfully');
  } catch (error) {
    console.error('Error handling cancelled payment:', error);
    throw error;
  }
}

// Webhook signature validation (if QPay provides it)
app.use('/', async (c, next) => {
  // TODO: Implement webhook signature validation if QPay provides it
  // const signature = c.req.header('X-QPay-Signature');
  // const body = await c.req.text();
  // const isValid = validateSignature(body, signature, process.env.QPAY_WEBHOOK_SECRET);
  // 
  // if (!isValid) {
  //   return c.json({ error: 'Invalid webhook signature' }, 401);
  // }

  await next();
});

// Health check for webhook endpoint
app.get('/', (c) => {
  return c.json({
    endpoint: 'QPay Webhook',
    method: 'POST',
    description: 'Handle QPay payment notifications',
    status: 'active',
    supported_events: ['PAID', 'CANCELLED', 'PENDING'],
  });
});

// Auto-update Shopify order function
async function updateShopifyOrder(orderNumber: string, status: 'paid' | 'failed') {
  try {
    const shopifyStore = process.env.SHOPIFY_STORE_URL;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyStore || !accessToken) {
      console.error('❌ Missing Shopify configuration');
      return;
    }
    
    // Get order details
    const orderResponse = await fetch(`https://${shopifyStore}/admin/api/2023-10/orders.json?name=${orderNumber}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    const orderData = await orderResponse.json() as { orders?: Array<{ id: string; total_price: string }> };
    const order = orderData.orders?.[0];
    
    if (!order) {
      console.error(`❌ Shopify order ${orderNumber} not found`);
      return;
    }
    
    // Create transaction to update status
    await fetch(`https://${shopifyStore}/admin/api/2023-10/orders/${order.id}/transactions.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction: {
          kind: status === 'paid' ? 'capture' : 'void',
          status: 'success',
          amount: order.total_price,
          gateway: 'QPay'
        }
      })
    });
    
    console.log(`✅ Shopify order ${orderNumber} automatically updated to ${status}`);
  } catch (error) {
    console.error('❌ Failed to update Shopify order:', error);
  }
}

export default app;