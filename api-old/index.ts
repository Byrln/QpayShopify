import * as dotenv from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { QPayService } from '../lib/qpay';
import type { QPayConfig } from '../types/qpay';

// Import QPay route handlers
import tokenRoutes from './qpay/token';
import invoiceRoutes from './qpay/invoice';
import webhookRoutes from './qpay/webhook';
dotenv.config();

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.vercel.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());
app.use('*', prettyJSON());

// Mount QPay routes
app.route('/api/qpay/token', tokenRoutes);
app.route('/api/qpay/invoice', invoiceRoutes);
app.route('/api/qpay/webhook', webhookRoutes);

// Initialize QPay service
const getQPayService = (): QPayService => {
  const config: QPayConfig = {
    username: process.env.QPAY_USERNAME || '',
    password: process.env.QPAY_PASSWORD || '',
    invoice_code: process.env.QPAY_INVOICE_CODE || '',
    baseUrl: process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2',
  };

  if (!config.username || !config.password || !config.invoice_code) {
    throw new Error('QPay configuration is incomplete. Please check environment variables.');
  }

  return new QPayService(config);
};

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'QPay Shopify Integration - Hono',
    version: '2.0.0',
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'QPay Shopify Integration API - Hono Framework',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      qpay: {
        token: '/api/qpay/token',
        invoice: '/api/qpay/invoice',
        webhook: '/api/qpay/webhook',
      },
    },
    documentation: 'https://github.com/your-repo/qpay-shopify',
  });
});

// Serve static files (payment pages)
app.get('/payment', async (c) => {
  // In a real Vercel deployment, you'd serve this from the public folder
  // For now, redirect to the payment page
  return c.redirect('/qpay-payment.html');
});

app.get('/payment/success', async (c) => {
  return c.redirect('/payment-success.html');
});

// Serve payment HTML files directly
app.get('/qpay-payment.html', async (c) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'qpay-payment.html');
    const html = await fs.readFile(filePath, 'utf-8');
    return c.html(html);
  } catch (error) {
    console.error('Error serving payment page:', error);
    return c.text('Payment page not found', 404);
  }
});

app.get('/payment-success.html', async (c) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'payment-success.html');
    const html = await fs.readFile(filePath, 'utf-8');
    return c.html(html);
  } catch (error) {
    console.error('Error serving success page:', error);
    return c.text('Success page not found', 404);
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json(
    {
      success: false,
      error: 'Дотоод серверийн алдаа', // Internal server error in Mongolian
      message: err.message,
      timestamp: new Date().toISOString(),
    },
    500 as any
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Хүсэлт олдсонгүй', // Endpoint not found in Mongolian
      path: c.req.path,
      method: c.req.method,
    },
    404 as any
  );
});

export default app;