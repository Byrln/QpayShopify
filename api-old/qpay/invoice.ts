import { Hono } from 'hono';
import { QPayService } from '../../lib/qpay';
import type { QPayConfig, QPayInvoiceRequest } from '../../types/qpay';

// Production invoice endpoint - no in-memory storage needed

const app = new Hono();

// Create QPay invoice
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, amount, currency = 'MNT', description, callbackUrl } = body;

    // Validate required fields
    if (!orderId || !amount) {
      return c.json(
        {
          success: false,
          error: 'Шаардлагатай талбарууд дутуу: orderId, amount', // Missing required fields in Mongolian
        },
        400 as any
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return c.json(
        {
          success: false,
          error: 'Дүн буруу байна', // Invalid amount in Mongolian
        },
        400 as any
      );
    }

    const config: QPayConfig = {
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2',
    };

    if (!config.username || !config.password || !config.invoice_code) {
      return c.json(
        {
          success: false,
          error: 'QPay тохиргоо дутуу байна', // QPay configuration incomplete in Mongolian
        },
        500 as any
      );
    }

    // Detect test mode
    const isTestMode = config.username === 'SATORI_MN' || config.username.includes('TEST') || config.username.includes('DEMO');

    if (isTestMode) {
      console.log('🧪 Running in test mode - generating mock QPay invoice');

      // Generate mock invoice for testing
      const mockInvoiceId = `SHOPIFY-${orderId}`;
      const mockQRText = `qpay:${mockInvoiceId}:${amount}:MNT`;

      // Mock deep links for testing with proper Mongolian bank names matching mobile app
      const mockDeepLinks = [
        {
          name: "qPay хэтэвч",
          description: "qPay хэтэвч",
          logo: "https://qpay.mn/q/logo/qpay.png",
          link: `qpay://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Хаан банк",
          description: "Хаан банк",
          logo: "https://qpay.mn/q/logo/khanbank.png",
          link: `khanbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Төрийн банк 3.0",
          description: "Төрийн банк 3.0",
          logo: "https://qpay.mn/q/logo/statebank.png",
          link: `statebank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Хас банк",
          description: "Хас банк",
          logo: "https://qpay.mn/q/logo/xacbank.png",
          link: `xacbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "TDB online",
          description: "TDB online",
          logo: "https://qpay.mn/q/logo/tdbbank.png",
          link: `tdbbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Голомт банк",
          description: "Голомт банк",
          logo: "https://qpay.mn/q/logo/golomtbank.png",
          link: `golomtbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "МОСТ мони",
          description: "МОСТ мони",
          logo: "https://qpay.mn/q/logo/mostmoney.png",
          link: `mostmoney://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Үндэсний хөрөнгө оруулалтын банк",
          description: "Үндэсний хөрөнгө оруулалтын банк",
          logo: "https://qpay.mn/q/logo/nibank.png",
          link: `nibank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Чингис Хаан банк",
          description: "Чингис Хаан банк",
          logo: "https://qpay.mn/q/logo/chinggisbank.png",
          link: `chinggisbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Капитрон банк",
          description: "Капитрон банк",
          logo: "https://qpay.mn/q/logo/capitronbank.png",
          link: `capitronbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Богд банк",
          description: "Богд банк",
          logo: "https://qpay.mn/q/logo/bogdbank.png",
          link: `bogdbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Тээвэр хөгжлийн банк",
          description: "Тээвэр хөгжлийн банк",
          logo: "https://qpay.mn/q/logo/transbank.png",
          link: `transbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "М банк",
          description: "М банк",
          logo: "https://qpay.mn/q/logo/mbank.png",
          link: `mbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Ард Апп",
          description: "Ард Апп",
          logo: "https://qpay.mn/q/logo/ardapp.png",
          link: `ardapp://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Toki App",
          description: "Toki App",
          logo: "https://qpay.mn/q/logo/toki.png",
          link: `tokiapp://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Ариг банк",
          description: "Ариг банк",
          logo: "https://qpay.mn/q/logo/arigbank.png",
          link: `arigbank://q?qPay_QRcode=${mockQRText}`
        },
        {
          name: "Мон Пэй",
          description: "Мон Пэй",
          logo: "https://qpay.mn/q/logo/monpay.png",
          link: `monpay://q?qPay_QRcode=${mockQRText}`
        }
      ];

      return c.json({
        success: true,
        data: {
          invoice_id: mockInvoiceId,
          qr_text: mockQRText,
          qr_image: `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12">TEST QR CODE\n${mockInvoiceId}</text></svg>`).toString('base64')}`,
          qPay_shortUrl: `https://s.qpay.mn/test/${mockInvoiceId}`,
          qPay_deeplink: mockDeepLinks,
          urls: mockDeepLinks, // For backward compatibility
          amount: Math.round(amount),
          currency: currency,
          order_id: orderId,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      });
    }

    // Production QPay API call with error handling
    const qpayService = new QPayService(config);

    // Prepare invoice data
    const invoiceData: Omit<QPayInvoiceRequest, 'invoice_code'> = {
      sender_invoice_no: `SHOPIFY-${orderId}`,
      invoice_receiver_code: config.invoice_code,
      invoice_description: description || `Захиалга #${orderId} - QPay төлбөр`,
      amount: Math.round(amount), // Ensure integer amount
      callback_url: callbackUrl || `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/qpay/webhook`,
    };

    console.log('Creating QPay invoice:', {
      orderId,
      amount: invoiceData.amount,
      description: invoiceData.invoice_description,
    });

    try {
      const result = await qpayService.createInvoice(invoiceData);

      if (!result.success) {
        // If QPay fails, provide helpful error with fallback suggestion
        console.error('❌ QPay API failed:', result.error);
        return c.json(
          {
            success: false,
            error: 'QPay нэхэмжлэх үүсгэхэд алдаа гарлаа',
            details: result.error,
            suggestion: 'Please check your QPay credentials or use test mode',
          },
          500 as any
        );
      }

      // Log successful invoice creation
      console.log('✅ QPay invoice created successfully:', result.data?.invoice_id);

      return c.json({
        success: true,
        data: {
          invoice_id: result.data?.invoice_id,
          qr_text: result.data?.qr_text,
          qr_image: result.data?.qr_image,
          qPay_shortUrl: result.data?.qPay_shortUrl,
          qPay_deeplink: result.data?.qPay_deeplink || [],
          urls: result.data?.qPay_deeplink || [], // For backward compatibility
          amount: invoiceData.amount,
          currency: currency,
          order_id: orderId,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        },
      });
    } catch (authError) {
      // Handle authentication errors gracefully
      console.error('❌ QPay authentication failed:', authError);
      return c.json(
        {
          success: false,
          error: 'QPay authentication failed',
          details: authError instanceof Error ? authError.message : 'Authentication error',
          suggestion: 'Please verify your QPay credentials in the .env file',
        },
        401 as any
      );
    }
  } catch (error) {
    console.error('❌ Invoice endpoint error:', error);
    return c.json(
      {
        success: false,
        error: 'Дотоод серверийн алдаа', // Internal server error in Mongolian
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500 as any
    );
  }
});

// Get invoice status
app.get('/:invoiceId', async (c) => {
  try {
    const invoiceId = c.req.param('invoiceId');

    if (!invoiceId) {
      return c.json(
        {
          success: false,
          error: 'Нэхэмжлэхийн ID шаардлагатай', // Invoice ID required in Mongolian
        },
        400 as any
      );
    }

    const config: QPayConfig = {
      username: process.env.QPAY_USERNAME || '',
      password: process.env.QPAY_PASSWORD || '',
      invoice_code: process.env.QPAY_INVOICE_CODE || '',
      baseUrl: process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn/v2',
    };

    // Detect test mode
    const isTestMode = config.username === 'SATORI_MN' || config.username.includes('TEST') || config.username.includes('DEMO');

    if (isTestMode) {
      console.log('🧪 Test mode - returning mock payment status for:', invoiceId);

      // Return mock payment status for testing
      return c.json({
        success: true,
        data: {
          invoice_id: invoiceId,
          status: invoiceId.includes('PAID') ? 'PAID' : 'PENDING',
          amount: 10000,
          currency: 'MNT',
          paid_amount: invoiceId.includes('PAID') ? 10000 : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    // Production QPay API call for invoice status check
    const qpayService = new QPayService(config);

    try {
      const result = await qpayService.checkPayment(invoiceId);

      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Төлбөрийн мэдээлэл шалгахад алдаа гарлаа',
            details: result.error,
            suggestion: 'Please check your QPay credentials or use test mode',
          },
          500 as any
        );
      }

      return c.json({
        success: true,
        data: result.data,
      });
    } catch (authError) {
      console.error('❌ QPay status check failed:', authError);
      return c.json(
        {
          success: false,
          error: 'QPay authentication failed',
          details: authError instanceof Error ? authError.message : 'Authentication error',
          suggestion: 'Please verify your QPay credentials in the .env file',
        },
        401 as any
      );
    }
  } catch (error) {
    console.error('Invoice status error:', error);
    return c.json(
      {
        success: false,
        error: 'Дотоод серверийн алдаа', // Internal server error in Mongolian
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500 as any
    );
  }
});

// Health check for invoice endpoint
app.get('/', (c) => {
  return c.json({
    endpoint: 'QPay Invoice',
    methods: ['POST', 'GET'],
    description: 'Create and check QPay invoices',
    status: 'active',
    routes: {
      create: 'POST /',
      status: 'GET /:invoiceId',
    },
  });
});

export default app;