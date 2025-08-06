# Shopify App Setup Guide for QPay Integration

This guide walks you through setting up your Shopify app and configuring webhooks for the QPay payment integration.

## 🏪 Shopify Partner Account Setup

### 1. Create Shopify Partner Account
1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Sign up for a free partner account
3. Verify your email and complete profile setup

### 2. Create Development Store (Optional)
1. In Partner Dashboard → Stores → Add store
2. Choose "Development store"
3. Fill in store details
4. Use this for testing before going live

## 📱 Create Shopify App

### 1. Create New App
1. In Partner Dashboard → Apps → Create app
2. Choose "Create app manually"
3. Fill in app details:
   - **App name**: QPay Payment Integration
   - **App URL**: `https://your-domain.com` (your deployed server)
   - **Allowed redirection URLs**: `https://your-domain.com/auth/callback`

### 2. Configure App Settings

#### App Setup Tab:
- **App URL**: Your deployed server URL
- **Allowed redirection URLs**: Add your auth callback URLs
- **Webhook endpoints**: `https://your-domain.com/webhooks/shopify`

#### App Permissions:
Request these scopes for your app:
```
read_orders
write_orders
read_products
read_customers
write_payment_gateways
```

## 🔗 Webhook Configuration

### 1. Configure Webhooks in Shopify

In your Shopify app settings, add these webhook endpoints:

| Event | Endpoint | Purpose |
|-------|----------|----------|
| `orders/create` | `/webhooks/shopify/orders/create` | New order created |
| `orders/updated` | `/webhooks/shopify/orders/updated` | Order status changed |
| `orders/paid` | `/webhooks/shopify/orders/paid` | Payment received |
| `orders/cancelled` | `/webhooks/shopify/orders/cancelled` | Order cancelled |

### 2. Webhook URL Format
```
https://your-domain.com/webhooks/shopify/{event}
```

### 3. Webhook Security
- Enable webhook verification
- Note down the webhook secret for environment variables

## 🔧 Environment Variables Setup

Add these to your production environment:

```env
# Shopify App Credentials
SHOPIFY_API_KEY=your_api_key_from_app_settings
SHOPIFY_API_SECRET=your_api_secret_from_app_settings
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOPIFY_API_VERSION=2023-10

# Store-specific (for private apps)
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token
```

## 🚀 Deployment Steps

### 1. Deploy to Render.com

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `qpay-shopify-integration`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Start with Free (upgrade for production)

3. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   QPAY_USERNAME=your_qpay_username
   QPAY_PASSWORD=your_qpay_password
   QPAY_INVOICE_CODE=your_invoice_code
   QPAY_API_URL=https://merchant.qpay.mn/v2
   QPAY_WEBHOOK_SECRET=your_qpay_webhook_secret
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your app URL: `https://your-app-name.onrender.com`

### 2. Alternative: Deploy to Heroku

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   heroku create qpay-shopify-integration
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set QPAY_USERNAME=your_username
   heroku config:set QPAY_PASSWORD=your_password
   heroku config:set QPAY_INVOICE_CODE=your_code
   heroku config:set QPAY_API_URL=https://merchant.qpay.mn/v2
   heroku config:set QPAY_WEBHOOK_SECRET=your_secret
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

## 🔄 Update Shopify App URLs

After deployment, update your Shopify app with the production URLs:

1. **App URL**: `https://your-domain.com`
2. **Webhook endpoints**: `https://your-domain.com/webhooks/shopify`
3. **Allowed redirection URLs**: `https://your-domain.com/auth/callback`

## 🧪 Testing Your Integration

### 1. Test Webhook Endpoints

```bash
# Test health check
curl https://your-domain.com/health

# Test QPay webhook (with proper signature)
curl -X POST https://your-domain.com/webhooks/qpay \
  -H "Content-Type: application/json" \
  -H "X-QPay-Signature: your_signature" \
  -d '{"invoice_id":"test","status":"PAID"}'
```

### 2. Test Shopify Webhooks

1. Create a test order in your development store
2. Check server logs for webhook reception
3. Verify QPay invoice creation

### 3. End-to-End Test

1. **Create Test Order**:
   - Add products to cart in development store
   - Proceed to checkout
   - Select QPay as payment method

2. **Verify QPay Invoice**:
   - Check if invoice is created in QPay
   - Verify invoice details match order

3. **Test Payment Flow**:
   - Pay invoice in QPay system
   - Verify webhook triggers
   - Check order status update in Shopify

## 📊 Monitoring and Logs

### 1. Server Logs

**Render.com**:
- Go to your service dashboard
- Click "Logs" tab
- Monitor real-time logs

**Heroku**:
```bash
heroku logs --tail
```

### 2. Webhook Monitoring

- Monitor webhook delivery in Shopify admin
- Check QPay webhook logs
- Set up error alerting

## 🔒 Security Checklist

- [ ] All environment variables are set
- [ ] Webhook signatures are verified
- [ ] HTTPS is enabled
- [ ] API keys are not exposed in code
- [ ] Rate limiting is configured
- [ ] Error handling is implemented

## 🚨 Troubleshooting

### Common Issues:

1. **Webhook Not Receiving**:
   - Check URL is publicly accessible
   - Verify webhook endpoint configuration
   - Check server logs for errors

2. **Authentication Errors**:
   - Verify QPay credentials
   - Check API URL is correct
   - Ensure token refresh is working

3. **Shopify Integration Issues**:
   - Verify app permissions
   - Check webhook secret configuration
   - Ensure proper signature verification

### Debug Commands:

```bash
# Test QPay connection
node -e "const QPayClient = require('./lib/qpay'); new QPayClient().authenticate().then(console.log)"

# Check environment variables
node -e "console.log(process.env)"

# Test server health
curl https://your-domain.com/health
```

## 📞 Support

- **QPay Support**: Contact QPay for API issues
- **Shopify Support**: Use Shopify Partner support
- **Server Issues**: Check hosting platform documentation

---

**Next Steps**: After completing this setup, your QPay Shopify integration will be live and ready to process payments!