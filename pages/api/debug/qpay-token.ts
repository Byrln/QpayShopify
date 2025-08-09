import { NextApiRequest, NextApiResponse } from 'next';
import { Buffer } from 'buffer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const username = process.env.QPAY_USERNAME?.trim();
    const password = process.env.QPAY_PASSWORD?.trim();
    const baseUrl = process.env.QPAY_API_URL?.trim() || 'https://merchant.qpay.mn/v2';

    console.log('Environment check:', {
      hasUsername: !!username,
      hasPassword: !!password,
      baseUrl,
      usernameLength: username?.length || 0,
      passwordLength: password?.length || 0
    });

    if (!username || !password) {
      return res.status(500).json({
        success: false,
        error: 'Missing QPay credentials',
        details: {
          hasUsername: !!username,
          hasPassword: !!password
        }
      });
    }

    // Try to get QPay token
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    console.log('Attempting QPay auth with credentials length:', credentials.length);

    const response = await fetch(`${baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: '',
    });

    console.log('QPay auth response status:', response.status);
    console.log('QPay auth response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('QPay auth raw response:', responseText);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `QPay auth failed: ${response.status} ${response.statusText}`,
        details: responseText
      });
    }

    // Try to parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON response from QPay auth',
        details: {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseText
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'QPay authentication successful',
      tokenReceived: !!data.access_token,
      expiresIn: data.expires_in
    });

  } catch (error) {
    console.error('QPay token test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test QPay authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}