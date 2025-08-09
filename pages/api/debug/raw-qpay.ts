import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing QPay API with raw response capture');
    
    // Get environment variables
    const qpayUsername = process.env.QPAY_USERNAME;
    const qpayPassword = process.env.QPAY_PASSWORD;
    const qpayApiUrl = process.env.QPAY_API_URL;
    
    if (!qpayUsername || !qpayPassword || !qpayApiUrl) {
      return res.status(500).json({ 
        error: 'Missing QPay credentials',
        hasUsername: !!qpayUsername,
        hasPassword: !!qpayPassword,
        hasApiUrl: !!qpayApiUrl
      });
    }

    // Step 1: Get access token
    console.log('Requesting QPay access token...');
    const authResponse = await fetch(`${qpayApiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: qpayUsername,
        password: qpayPassword,
      }),
    });

    console.log('Auth response status:', authResponse.status);
    console.log('Auth response headers:', Object.fromEntries(authResponse.headers.entries()));
    
    const authText = await authResponse.text();
    console.log('Raw auth response text:', authText);
    console.log('Auth response text length:', authText.length);
    console.log('First 10 characters:', authText.substring(0, 10));
    
    return res.status(200).json({
      success: true,
      authStatus: authResponse.status,
      authHeaders: Object.fromEntries(authResponse.headers.entries()),
      rawResponse: authText,
      responseLength: authText.length,
      firstChars: authText.substring(0, 20)
    });
    
  } catch (error) {
    console.error('Error in raw QPay test:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}