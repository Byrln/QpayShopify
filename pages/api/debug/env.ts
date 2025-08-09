import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables (without exposing actual values)
  const envStatus = {
    QPAY_USERNAME: !!process.env.QPAY_USERNAME,
    QPAY_PASSWORD: !!process.env.QPAY_PASSWORD,
    QPAY_INVOICE_CODE: !!process.env.QPAY_INVOICE_CODE,
    QPAY_API_URL: process.env.QPAY_API_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    usernameLength: process.env.QPAY_USERNAME?.length || 0,
    passwordLength: process.env.QPAY_PASSWORD?.length || 0,
    invoiceCodeLength: process.env.QPAY_INVOICE_CODE?.length || 0
  };

  res.status(200).json({
    success: true,
    environment: envStatus,
    timestamp: new Date().toISOString()
  });
}