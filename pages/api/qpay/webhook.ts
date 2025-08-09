import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the webhook payload for debugging
    console.log('QPay Webhook received:', {
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    const { invoice_id, payment_id, status, amount, currency } = req.body;

    // Validate required fields
    if (!invoice_id) {
      console.error('Missing invoice_id in webhook payload');
      return res.status(400).json({ error: 'Missing invoice_id' });
    }

    // Handle different payment statuses
    switch (status) {
      case 'PAID':
      case 'paid':
        console.log(`Payment successful for invoice ${invoice_id}:`, {
          payment_id,
          amount,
          currency
        });
        
        // Here you would typically:
        // 1. Update your database with payment confirmation
        // 2. Send confirmation email to customer
        // 3. Update order status in your system
        // 4. Trigger any post-payment workflows
        
        break;
        
      case 'CANCELLED':
      case 'cancelled':
        console.log(`Payment cancelled for invoice ${invoice_id}`);
        // Handle cancelled payment
        break;
        
      case 'FAILED':
      case 'failed':
        console.log(`Payment failed for invoice ${invoice_id}`);
        // Handle failed payment
        break;
        
      default:
        console.log(`Unknown payment status '${status}' for invoice ${invoice_id}`);
    }

    // Always respond with success to acknowledge receipt
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      invoice_id 
    });

  } catch (error) {
    console.error('Error processing QPay webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Disable body parsing to handle raw webhook data if needed
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// }