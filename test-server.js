// Test Server for QPay Shopify Integration
const express = require('express');
const path = require('path');
const testConfig = require('./test-config');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Test mode indicator
app.get('/', (req, res) => {
  res.json({
    message: 'QPay Shopify Integration - Test Environment',
    mode: 'TEST',
    endpoints: {
      createInvoice: '/api/create-invoice',
      webhook: '/api/webhook',
      orderStatus: '/api/order-status',
      qrDisplay: '/qr-display.html',
      testDashboard: '/test-dashboard'
    },
    testData: {
      orders: Object.keys(testConfig.testOrders),
      webhooks: Object.keys(testConfig.testWebhooks)
    }
  });
});

// Test Dashboard
app.get('/test-dashboard', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QPay Test Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
            .btn:hover { background: #0056b3; }
            .btn-success { background: #28a745; }
            .btn-danger { background: #dc3545; }
            .response { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; white-space: pre-wrap; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            input, select { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; width: 200px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>QPay Shopify Integration - Test Dashboard</h1>
            
            <div class="card">
                <h2>🧪 Test Environment Status</h2>
                <p><strong>Mode:</strong> TEST</p>
                <p><strong>Server:</strong> http://localhost:${PORT}</p>
                <p><strong>Database:</strong> Test Database (In-Memory)</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>📝 Create Test Invoice</h3>
                    <select id="orderSelect">
                        <option value="order1">Test Order #TEST001 (1000 MNT)</option>
                        <option value="order2">Test Order #TEST002 (5000 MNT)</option>
                    </select><br>
                    <button class="btn" onclick="createInvoice()">Create Invoice</button>
                    <div id="invoiceResponse" class="response"></div>
                </div>
                
                <div class="card">
                    <h3>🔔 Send Test Webhook</h3>
                    <select id="webhookSelect">
                        <option value="paymentSuccess">Payment Success</option>
                        <option value="paymentFailed">Payment Failed</option>
                    </select><br>
                    <input type="text" id="invoiceId" placeholder="Invoice ID" value="test_invoice_123"><br>
                    <button class="btn btn-success" onclick="sendWebhook()">Send Webhook</button>
                    <div id="webhookResponse" class="response"></div>
                </div>
                
                <div class="card">
                    <h3>📊 Check Order Status</h3>
                    <input type="text" id="statusOrderId" placeholder="Order ID" value="test_order_123"><br>
                    <button class="btn" onclick="checkStatus()">Check Status</button>
                    <div id="statusResponse" class="response"></div>
                </div>
                
                <div class="card">
                    <h3>🎯 Quick Actions</h3>
                    <button class="btn" onclick="openQRDisplay()">Open QR Display</button>
                    <button class="btn btn-danger" onclick="clearResponses()">Clear All Responses</button>
                </div>
            </div>
            
            <div class="card">
                <h3>📋 Test Data</h3>
                <h4>Available Test Orders:</h4>
                <ul>
                    <li><strong>test_order_123:</strong> #TEST001 - 1000 MNT</li>
                    <li><strong>test_order_456:</strong> #TEST002 - 5000 MNT</li>
                </ul>
                
                <h4>Test Webhook Types:</h4>
                <ul>
                    <li><strong>paymentSuccess:</strong> Simulates successful payment</li>
                    <li><strong>paymentFailed:</strong> Simulates failed payment</li>
                </ul>
            </div>
        </div>
        
        <script>
            async function createInvoice() {
                const orderKey = document.getElementById('orderSelect').value;
                const orderData = ${JSON.stringify(testConfig.testOrders)}[orderKey];
                
                try {
                    const response = await fetch('/api/create-invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });
                    const result = await response.json();
                    document.getElementById('invoiceResponse').textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    document.getElementById('invoiceResponse').textContent = 'Error: ' + error.message;
                }
            }
            
            async function sendWebhook() {
                const webhookType = document.getElementById('webhookSelect').value;
                const invoiceId = document.getElementById('invoiceId').value;
                const webhookData = ${JSON.stringify(testConfig.testWebhooks)}[webhookType];
                webhookData.invoice_id = invoiceId;
                
                try {
                    const response = await fetch('/api/webhook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookData)
                    });
                    const result = await response.json();
                    document.getElementById('webhookResponse').textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    document.getElementById('webhookResponse').textContent = 'Error: ' + error.message;
                }
            }
            
            async function checkStatus() {
                const orderId = document.getElementById('statusOrderId').value;
                
                try {
                    const response = await fetch(\`/api/order-status?orderId=\${orderId}\`);
                    const result = await response.json();
                    document.getElementById('statusResponse').textContent = JSON.stringify(result, null, 2);
                } catch (error) {
                    document.getElementById('statusResponse').textContent = 'Error: ' + error.message;
                }
            }
            
            function openQRDisplay() {
                window.open('/qr-display.html?orderId=test_order_123&invoiceId=test_invoice_123', '_blank');
            }
            
            function clearResponses() {
                document.getElementById('invoiceResponse').textContent = '';
                document.getElementById('webhookResponse').textContent = '';
                document.getElementById('statusResponse').textContent = '';
            }
        </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Mock API endpoints for testing
app.post('/api/create-invoice', async (req, res) => {
  try {
    console.log('📝 Creating test invoice:', req.body);
    
    const { orderId, amount, currency = 'MNT' } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, amount'
      });
    }
    
    // Generate QR code
    const qrText = `qpay://test_invoice_${orderId}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrText);
    
    const mockResponse = {
      success: true,
      data: {
        invoice_id: `test_invoice_${orderId}`,
        qr_text: qrText,
        qr_image: qrCodeDataURL,
        qr_code: qrCodeDataURL,
        amount: amount,
        currency: currency,
        order_id: orderId,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    };
    
    console.log('✅ Test invoice created successfully');
    res.json(mockResponse);
  } catch (error) {
    console.error('❌ Error creating test invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/webhook', (req, res) => {
  try {
    console.log('🔔 Received test webhook:', req.body);
    
    const { invoice_id, payment_status, payment_amount } = req.body;
    
    if (!invoice_id || !payment_status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required webhook fields'
      });
    }
    
    const mockResponse = {
      success: true,
      message: `Webhook processed successfully for invoice ${invoice_id}`,
      data: {
        invoice_id,
        payment_status,
        payment_amount,
        processed_at: new Date().toISOString()
      }
    };
    
    console.log(`✅ Test webhook processed: ${payment_status}`);
    res.json(mockResponse);
  } catch (error) {
    console.error('❌ Error processing test webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/order-status', (req, res) => {
  try {
    const { orderId, invoiceId } = req.query;
    
    if (!orderId && !invoiceId) {
      return res.status(400).json({
        success: false,
        error: 'Either orderId or invoiceId is required'
      });
    }
    
    console.log(`📊 Checking test order status: ${orderId || invoiceId}`);
    
    const mockResponse = {
      success: true,
      data: {
        order_id: orderId || 'test_order_123',
        invoice_id: invoiceId || 'test_invoice_123',
        payment_status: 'PENDING',
        amount: '1000',
        currency: 'MNT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    console.log('✅ Test order status retrieved');
    res.json(mockResponse);
  } catch (error) {
    console.error('❌ Error checking test order status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'TEST',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 QPay Shopify Integration - Test Server Started');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🧪 Test Dashboard: http://localhost:${PORT}/test-dashboard`);
  console.log(`💡 Health Check: http://localhost:${PORT}/health`);
  console.log('\n📋 Available Endpoints:');
  console.log('  GET  / - API Information');
  console.log('  GET  /test-dashboard - Test Dashboard');
  console.log('  POST /api/create-invoice - Create Invoice');
  console.log('  POST /api/webhook - Webhook Handler');
  console.log('  GET  /api/order-status - Check Order Status');
  console.log('  GET  /health - Health Check');
  console.log('\n🎯 Ready for testing!');
});

module.exports = app;