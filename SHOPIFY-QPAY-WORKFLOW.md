# Shopify + QPay Integration Workflow

This document outlines the complete workflow for integrating QPay payments with Shopify product pages.

## Workflow Overview

```
Shopify Product Page → QPay Button → Payment Page → QPay Processing → Shopify Checkout
```

### Step-by-Step Process

1. **Customer visits Shopify product page**
2. **Customer clicks "QPay-ээр төлөх" button**
3. **System redirects to Vercel payment page with product data**
4. **Payment page displays QR code and 10-minute timer**
5. **Customer scans QR code and pays via banking app**
6. **System checks payment status every 3 seconds**
7. **On successful payment: redirect to Shopify checkout**
8. **On timeout/cancellation: show error and retry option**

## Implementation Files

### 1. Shopify Integration (`shopify-integration/qpay-button.liquid`)

**Purpose**: Add QPay payment button to Shopify product pages

**Installation**:
1. Copy the liquid code to your Shopify theme
2. Add to `sections/product-form.liquid` or `templates/product.liquid`
3. Place after the regular "Add to Cart" button

**Features**:
- Extracts product data (ID, title, price, variant, quantity)
- Creates checkout return URL
- Redirects to Vercel payment page with all necessary data

### 2. Payment Processing (`pages/payment.tsx`)

**Purpose**: Handle QPay payment flow with timeout and status checking

**Features**:
- 10-minute payment timeout
- Real-time payment status checking (every 3 seconds)
- QR code display for mobile banking apps
- Automatic redirect on successful payment
- Error handling for failed/cancelled payments

**Key Components**:
- Timer countdown display
- QPay QR code generation
- Payment status monitoring
- Shopify product information display

### 3. API Endpoints

#### `/api/shopify/checkout.ts`
**Purpose**: Generate Shopify checkout URLs after successful payment

**Usage**:
```javascript
POST /api/shopify/checkout
{
  "product_id": 123,
  "variant_id": 456,
  "quantity": 2,
  "shop_domain": "your-shop.myshopify.com",
  "payment_id": "qpay_payment_id"
}
```

## URL Parameters

### Payment Page URL Structure
```
https://your-vercel-app.vercel.app/payment?product={product_data}&return_url={shopify_checkout}&shop_domain={domain}
```

### Required Parameters
- `product`: JSON string containing product data
- `return_url`: Shopify checkout URL to redirect after payment
- `shop_domain`: Shopify store domain

### Product Data Structure
```json
{
  "id": 123,
  "title": "Product Name",
  "price": "29.99",
  "variant_id": 456,
  "handle": "product-handle",
  "image": "https://cdn.shopify.com/image.jpg",
  "quantity": 1,
  "shop_domain": "your-shop.myshopify.com"
}
```

## Payment Flow States

### 1. Loading State
- Shows spinner while initializing QPay invoice
- Creates QPay payment request
- Generates QR code

### 2. Pending State
- Displays QR code for scanning
- Shows 10-minute countdown timer
- Checks payment status every 3 seconds
- Customer scans QR with banking app

### 3. Success State
- Shows success message with checkmark
- Redirects to Shopify checkout URL
- Adds product to Shopify cart automatically

### 4. Cancelled/Timeout State
- Shows error message
- Provides "Try Again" button
- Logs cancellation reason

## Shopify Checkout Integration

### Automatic Cart Addition
After successful payment, the system redirects to:
```
https://your-shop.myshopify.com/cart/VARIANT_ID:QUANTITY
```

This automatically:
- Adds the paid product to Shopify cart
- Redirects to checkout page
- Preserves product selection and quantity

### Example URLs
```
# Single item
https://shop.myshopify.com/cart/12345:1

# Multiple items
https://shop.myshopify.com/cart/12345:2

# Multiple products
https://shop.myshopify.com/cart/12345:1,67890:3
```

## Environment Variables

Add these to your Vercel deployment:

```env
# QPay Configuration
QPAY_USERNAME=your_qpay_username
QPAY_PASSWORD=your_qpay_password
QPAY_INVOICE_CODE=your_invoice_code
QPAY_API_URL=https://merchant.qpay.mn/v2

# Shopify Configuration (optional for enhanced features)
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
SHOPIFY_API_VERSION=2023-10
```

## Testing the Integration

### 1. Test Payment Flow
1. Add QPay button to a Shopify product page
2. Click the button to initiate payment
3. Verify redirect to payment page with correct product data
4. Test QR code generation and display
5. Verify timer countdown functionality

### 2. Test Payment Success
1. Complete a test payment via QPay
2. Verify automatic redirect to Shopify checkout
3. Confirm product is added to cart correctly
4. Complete Shopify checkout process

### 3. Test Payment Timeout
1. Initiate payment but don't complete it
2. Wait for 10-minute timeout
3. Verify cancellation message appears
4. Test "Try Again" functionality

## Security Considerations

### 1. Payment Validation
- Always verify payment status with QPay API
- Never trust client-side payment confirmations
- Log all payment attempts for audit trail

### 2. Data Protection
- Product data is passed via URL parameters
- Sensitive payment data handled server-side only
- No payment credentials stored in browser

### 3. Timeout Protection
- 10-minute payment window prevents abandoned sessions
- Automatic cleanup of expired payment requests
- Clear error messaging for timeout scenarios

## Troubleshooting

### Common Issues

1. **QR Code Not Displaying**
   - Check QPay API credentials
   - Verify invoice creation response
   - Check network connectivity

2. **Payment Status Not Updating**
   - Verify payment status API endpoint
   - Check polling interval (3 seconds)
   - Ensure invoice ID is correct

3. **Shopify Redirect Failing**
   - Verify shop domain format
   - Check variant ID validity
   - Ensure quantity is positive integer

4. **Timer Not Working**
   - Check JavaScript execution
   - Verify useEffect dependencies
   - Ensure component state updates

### Debug Mode

Enable debug logging by adding to your environment:
```env
NODE_ENV=development
DEBUG_QPAY=true
```

## Production Deployment

### 1. Vercel Configuration
```json
{
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "QPAY_USERNAME": "@qpay-username",
    "QPAY_PASSWORD": "@qpay-password",
    "QPAY_INVOICE_CODE": "@qpay-invoice-code"
  }
}
```

### 2. Shopify Theme Updates
1. Backup your current theme
2. Add QPay button liquid code
3. Test in preview mode first
4. Deploy to live theme

### 3. Monitoring
- Set up payment success/failure alerts
- Monitor QPay API response times
- Track conversion rates
- Log payment attempts and outcomes

## Next Steps

1. **Enhanced Features**
   - Multiple payment methods
   - Discount code support
   - Inventory checking
   - Customer account integration

2. **Analytics Integration**
   - Payment conversion tracking
   - Abandonment analysis
   - Revenue reporting
   - Customer behavior insights

3. **Mobile Optimization**
   - Deep linking to banking apps
   - Progressive Web App features
   - Offline payment queuing
   - Push notifications

## Support

For technical support:
- Check QPay API documentation
- Review Shopify Liquid documentation
- Monitor Vercel deployment logs
- Test in development environment first