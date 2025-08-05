// Test Configuration for QPay Shopify Integration

module.exports = {
  // Test environment settings
  testMode: true,
  
  // Mock QPay API responses
  mockQPayResponses: {
    auth: {
      access_token: 'test_token_123',
      expires_in: 3600
    },
    createInvoice: {
      invoice_id: 'test_invoice_123',
      qr_text: 'qpay://test_qr_code_data',
      qr_image: 'https://api.qpay.mn/qr/test_invoice_123.png',
      urls: {
        name: 'Test Payment',
        description: 'Test Order Payment',
        logo: 'https://merchant.qpay.mn/logo.png'
      }
    },
    checkStatus: {
      payment_status: 'PAID',
      payment_amount: '1000',
      payment_currency: 'MNT',
      payment_id: 'test_txn_123',
      paid_date: new Date().toISOString()
    }
  },
  
  // Test order data
  testOrders: {
    order1: {
      orderId: 'test_order_123',
      orderNumber: '#TEST001',
      amount: '1000',
      currency: 'MNT',
      customerEmail: 'test@example.com',
      customerPhone: '+976-99887766'
    },
    order2: {
      orderId: 'test_order_456',
      orderNumber: '#TEST002',
      amount: '5000',
      currency: 'MNT',
      customerEmail: 'customer@test.com',
      customerPhone: '+976-88776655'
    }
  },
  
  // Mock Shopify API responses
  mockShopifyResponses: {
    getOrder: {
      order: {
        id: 'test_order_123',
        name: '#TEST001',
        total_price: '1000.00',
        currency: 'MNT',
        financial_status: 'pending',
        customer: {
          email: 'test@example.com',
          phone: '+976-99887766'
        }
      }
    },
    createTransaction: {
      transaction: {
        id: 'test_transaction_123',
        kind: 'capture',
        status: 'success',
        amount: '1000.00',
        currency: 'MNT',
        gateway: 'QPay'
      }
    },
    updateOrder: {
      order: {
        id: 'test_order_123',
        financial_status: 'paid'
      }
    }
  },
  
  // Test webhook payloads
  testWebhooks: {
    paymentSuccess: {
      invoice_id: 'test_invoice_123',
      payment_status: 'PAID',
      payment_amount: '1000',
      payment_currency: 'MNT',
      sender_invoice_no: 'test_order_123',
      payment_id: 'test_txn_123',
      paid_date: new Date().toISOString()
    },
    paymentFailed: {
      invoice_id: 'test_invoice_123',
      payment_status: 'FAILED',
      payment_amount: '1000',
      payment_currency: 'MNT',
      sender_invoice_no: 'test_order_123',
      payment_id: null,
      paid_date: null
    }
  },
  
  // Test API endpoints
  testEndpoints: {
    baseUrl: 'http://localhost:3000',
    createInvoice: '/api/create-invoice',
    webhook: '/api/webhook',
    orderStatus: '/api/order-status',
    qrDisplay: '/public/qr-display.html'
  },
  
  // Database test settings
  testDatabase: {
    // Use in-memory SQLite for testing
    url: 'file:./test.db',
    resetOnStart: true
  }
};