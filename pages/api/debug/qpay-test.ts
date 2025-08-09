import { NextApiRequest, NextApiResponse } from 'next';
import { QPayService } from '../../../lib/qpay';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const envVars = {
      QPAY_USERNAME: process.env.QPAY_USERNAME ? 'SET' : 'NOT SET',
      QPAY_PASSWORD: process.env.QPAY_PASSWORD ? 'SET' : 'NOT SET',
      QPAY_INVOICE_CODE: process.env.QPAY_INVOICE_CODE ? 'SET' : 'NOT SET',
      QPAY_API_URL: process.env.QPAY_API_URL || 'NOT SET'
    };

    console.log('Environment variables:', envVars);

    // Initialize QPay service
    const qpayService = new QPayService({
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2'
    });

    console.log('QPay service initialized');

    // Try to create a test invoice (this will handle token internally)
    try {
      const invoiceResult = await qpayService.createInvoice({
        amount: 100,
        invoice_description: 'Test invoice',
        sender_invoice_no: `TEST-${Date.now()}`,
        invoice_receiver_code: 'terminal'
      });

      console.log('Invoice result:', invoiceResult);

      return res.status(200).json({
        success: true,
        invoiceResult,
        envVars
      });

    } catch (invoiceError) {
      console.error('Invoice error:', invoiceError);
      return res.status(200).json({
        success: true,
        invoiceResult: {
          success: false,
          error: invoiceError instanceof Error ? invoiceError.message : 'Unknown error'
        },
        envVars
      });
    }

  } catch (error) {
    console.error('Debug test error:', error);
    return res.status(500).json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}