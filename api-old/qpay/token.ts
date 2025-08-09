import { Hono } from 'hono';
import { QPayService } from '../../lib/qpay';
import type { QPayConfig } from '../../types/qpay';

const app = new Hono();

// Get QPay access token
app.post('/', async (c) => {
  try {
    const config: QPayConfig = {
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2',
    };

    if (!config.username || !config.password) {
      return c.json(
        {
          success: false,
          error: 'Шаардлагатай талбарууд дутуу: username, password', // Missing required fields in Mongolian
        },
        400
      );
    }

    const qpayService = new QPayService(config);

    // Get token by creating a temporary service instance
    const response = await fetch(`${config.baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('QPay token error:', errorText);
      return c.json(
        {
          success: false,
          error: 'QPay токен авахад алдаа гарлаа', // Error getting QPay token in Mongolian
          details: errorText,
        },
        response.status as any
      );
    }

    const tokenData = await response.json() as any;

    return c.json({
      success: true,
      data: {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Token endpoint error:', error);
    return c.json(
      {
        success: false,
        error: 'Дотоод серверийн алдаа',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Health check for token endpoint
app.get('/', (c) => {
  return c.json({
    endpoint: 'QPay Token',
    method: 'POST',
    description: 'Get QPay access token',
    status: 'active',
  });
});

export default app;