import { NextApiRequest, NextApiResponse } from 'next';
import { QPayService } from '../../../lib/qpay';

interface CheckPaymentRequest {
  invoice_id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invoice_id }: CheckPaymentRequest = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: 'Missing required parameter: invoice_id' });
    }

    // Initialize QPay service with server-side environment variables
    const qpayService = new QPayService({
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2'
    });

    // Check payment status
    const result = await qpayService.checkPayment(invoice_id);

    if (result.success) {
      // Check if payment is completed
      const isPaid = result.data && 
        result.data.rows && 
        result.data.rows.length > 0 && 
        result.data.rows.some((payment: any) => payment.payment_status === 'PAID');

      res.status(200).json({
        success: true,
        paid: isPaid,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        paid: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error checking QPay payment:', error);
    res.status(500).json({ 
      success: false,
      paid: false,
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}