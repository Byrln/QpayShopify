import { NextApiRequest, NextApiResponse } from 'next';
import { QPayService } from '../../../lib/qpay';

interface CreateInvoiceRequest {
  amount: number;
  description: string;
  callback_url?: string;
  sender_invoice_no?: string;
  invoice_receiver_code?: string;
  orderId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('QPay create-invoice API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description, callback_url, sender_invoice_no, invoice_receiver_code, orderId }: CreateInvoiceRequest = req.body;
    console.log('Request body:', { amount, description, callback_url, orderId });

    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required parameters: amount, description' });
    }

    // Check environment variables
    console.log('Environment check:', {
      hasUsername: !!process.env.QPAY_USERNAME,
      hasPassword: !!process.env.QPAY_PASSWORD,
      hasInvoiceCode: !!process.env.QPAY_INVOICE_CODE,
      baseUrl: process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2'
    });

    // Initialize QPay service with server-side environment variables
    const qpayService = new QPayService({
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2'
    });
    
    console.log('QPay service initialized, creating invoice...');

    // Create invoice
    const invoiceData = {
      amount,
      invoice_description: description,
      sender_invoice_no: sender_invoice_no || (orderId ? `SHOPIFY-${orderId}` : `INV-${Date.now()}`),
      invoice_receiver_code: invoice_receiver_code || 'terminal',
      callback_url: callback_url || `https://satorimn.vercel.app/api/qpay/webhook`
    };
    console.log('Creating invoice with data:', invoiceData);
    
    const result = await qpayService.createInvoice(invoiceData);
    console.log('QPay service result:', result);

    if (result.success) {
      console.log('Invoice created successfully');
      res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      console.log('Invoice creation failed:', result.error);
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error creating QPay invoice:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}