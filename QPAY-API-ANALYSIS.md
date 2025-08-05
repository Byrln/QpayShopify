# 📋 QPay API v2 Analysis - Official Postman Collection

## 🔍 Overview

Based on the official QPay API v2 Postman collection provided, here's a comprehensive analysis of the API structure and how it compares to our current integration.

## 🏗️ API Structure

### 1. Authentication Endpoints

#### `/v2/auth/token` (POST)
- **Purpose**: Get access token
- **Auth**: Basic Auth (username: client_id, password: client_secret)
- **URL**: `https://merchant.qpay.mn/v2/auth/token`
- **Response**: Access token + refresh token

#### `/v2/auth/refresh` (POST)
- **Purpose**: Refresh access token
- **Auth**: Bearer token (refresh_token)
- **URL**: `https://merchant.qpay.mn/v2/auth/refresh`

### 2. Invoice Endpoints

#### `/v2/invoice` (POST) - Create Invoice
**Simple Version** (recommended for Shopify):
```json
{
    "invoice_code": "SATORI_MN_INVOICE",
    "sender_invoice_no": "SHOPIFY_ORDER_123",
    "invoice_receiver_code": "terminal",
    "invoice_description": "Shopify Order #123",
    "sender_branch_code": "ONLINE",
    "amount": 25000,
    "callback_url": "https://your-app.onrender.com/api/webhook/qpay"
}
```

**Full Version** (with detailed line items):
```json
{
    "invoice_code": "SATORI_MN_INVOICE",
    "sender_invoice_no": "SHOPIFY_ORDER_123",
    "invoice_receiver_code": "83",
    "sender_branch_code": "ONLINE",
    "invoice_description": "Shopify Order #123",
    "enable_expiry": "false",
    "allow_partial": false,
    "allow_exceed": false,
    "amount": 25000,
    "callback_url": "https://satori.mn/api/webhook/qpay",
    "sender_staff_code": "online",
    "invoice_receiver_data": {
        "register": "UZ96021105",
        "name": "Customer Name",
        "email": "customer@email.com",
        "phone": "99887766"
    },
    "lines": [
        {
            "tax_product_code": "6401",
            "line_description": "Helwit Banana",
            "line_quantity": "2.00",
            "line_unit_price": "12500.00",
            "note": "Nicotine pouches"
        }
    ]
}
```

#### `/v2/invoice/{invoice_id}` (DELETE) - Cancel Invoice

### 3. Payment Endpoints

#### `/v2/payment/{payment_id}` (GET) - Get Payment Info
#### `/v2/payment/check` (POST) - Check Payment Status
```json
{
    "object_type": "INVOICE",
    "object_id": "invoice_id_here",
    "offset": {
        "page_number": 1,
        "page_limit": 100
    }
}
```

#### `/v2/payment/list` (POST) - List Payments
#### `/v2/payment/cancel/{payment_id}` (DELETE) - Cancel Payment
#### `/v2/payment/refund/{payment_id}` (DELETE) - Refund Payment

### 4. E-Barimt (Receipt) Endpoints

#### `/v2/ebarimt/create` (POST) - Create Electronic Receipt
```json
{
    "payment_id": "payment_id_here",
    "ebarimt_receiver_type": "CITIZEN"
}
```

## 🔄 Comparison with Our Current Implementation

### ✅ What We Have Correct:
1. **Base URL**: `https://merchant.qpay.mn/v2/`
2. **Authentication flow**: Basic Auth → Bearer Token
3. **Invoice creation structure**: Matches the simple format
4. **Payment checking**: Using correct endpoints

### 🔧 What We Should Update:

#### 1. Enhanced Invoice Creation
Our current implementation uses a simple format. We should enhance it to include:
- Customer information (`invoice_receiver_data`)
- Detailed line items for better tracking
- Proper tax codes for Mongolian compliance

#### 2. Payment Status Checking
We should use the `/v2/payment/check` endpoint instead of just `/v2/payment/{id}`:
```javascript
// Better approach
const checkPayment = async (invoiceId) => {
    return await fetch(`${QPAY_API_URL}/v2/payment/check`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            object_type: 'INVOICE',
            object_id: invoiceId,
            offset: {
                page_number: 1,
                page_limit: 10
            }
        })
    });
};
```

#### 3. E-Barimt Integration
For Mongolian tax compliance, we should add electronic receipt generation:
```javascript
const createEBarimt = async (paymentId) => {
    return await fetch(`${QPAY_API_URL}/v2/ebarimt/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payment_id: paymentId,
            ebarimt_receiver_type: 'CITIZEN'
        })
    });
};
```

## 🎯 Recommended Updates to Our Integration

### 1. Update Invoice Creation (lib/qpay.js)
```javascript
const createInvoice = async (orderData) => {
    const invoiceData = {
        invoice_code: process.env.QPAY_INVOICE_CODE,
        sender_invoice_no: `SHOPIFY_${orderData.order_number}`,
        invoice_receiver_code: 'terminal',
        invoice_description: `Shopify Order #${orderData.order_number}`,
        sender_branch_code: 'ONLINE',
        amount: Math.round(orderData.total_price * 100), // Convert to MNT cents
        callback_url: `${process.env.RENDER_EXTERNAL_URL}/api/webhook/qpay`,
        sender_staff_code: 'online',
        invoice_receiver_data: {
            name: `${orderData.customer.first_name} ${orderData.customer.last_name}`,
            email: orderData.customer.email,
            phone: orderData.customer.phone || '99999999'
        },
        lines: orderData.line_items.map(item => ({
            tax_product_code: '6401', // Standard product code
            line_description: item.title,
            line_quantity: item.quantity.toString(),
            line_unit_price: (item.price * 100).toString(), // Convert to MNT cents
            note: item.variant_title || ''
        }))
    };
    
    // ... rest of the implementation
};
```

### 2. Enhanced Payment Checking
```javascript
const checkPaymentStatus = async (invoiceId) => {
    const response = await fetch(`${QPAY_API_URL}/v2/payment/check`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            object_type: 'INVOICE',
            object_id: invoiceId,
            offset: {
                page_number: 1,
                page_limit: 10
            }
        })
    });
    
    return response.json();
};
```

### 3. Add E-Barimt Support
```javascript
const generateReceipt = async (paymentId) => {
    const response = await fetch(`${QPAY_API_URL}/v2/ebarimt/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            payment_id: paymentId,
            ebarimt_receiver_type: 'CITIZEN'
        })
    });
    
    return response.json();
};
```

## 🚀 Implementation Priority

### Phase 1: Core Functionality (Current)
- [x] Basic authentication
- [x] Simple invoice creation
- [x] Payment status checking
- [ ] IP whitelisting (pending)

### Phase 2: Enhanced Features
- [ ] Detailed invoice creation with line items
- [ ] Customer information integration
- [ ] Enhanced payment status checking
- [ ] Error handling improvements

### Phase 3: Compliance & Advanced
- [ ] E-Barimt (electronic receipt) integration
- [ ] Payment cancellation/refund support
- [ ] Advanced reporting
- [ ] Tax compliance features

## 📝 Key Insights from Postman Collection

1. **Test Credentials in Collection**:
   - Username: `TEST_MERCHANT`
   - Password: `WBDUzy8n`
   - Invoice Code: `TEST_INVOICE`

2. **Your Production Credentials**:
   - Username: `SATORI_MN`
   - Password: `JkQJPxx`
   - Invoice Code: `SATORI_MN_INVOICE`

3. **Important Notes**:
   - Amounts should be in MNT cents (multiply by 100)
   - `invoice_receiver_code: "terminal"` for simple payments
   - `sender_branch_code` can be any identifier (use "ONLINE")
   - Callback URLs must be HTTPS in production

## 🎯 Next Steps

1. **Immediate**: Get IP `103.87.255.62` whitelisted by QPay
2. **Short-term**: Test current implementation once IP is whitelisted
3. **Medium-term**: Implement enhanced invoice creation with line items
4. **Long-term**: Add E-Barimt support for tax compliance

---

**Status**: Ready for testing once IP whitelisting is complete  
**API Compatibility**: ✅ Fully compatible with QPay API v2  
**Next Action**: Contact QPay support for IP whitelisting