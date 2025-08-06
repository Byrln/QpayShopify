# 🚀 QPay Shopify Integration - Production Deployment Guide

## 📋 Overview

This guide covers the complete process of deploying your QPay Shopify integration to production, including server deployment, Shopify configuration, and testing.

## 🏗️ Production Deployment Steps

### 1. 🌐 Deploy Your Server to Production

#### Option A: Deploy to Render (Recommended)

**Step 1: Prepare for Deployment**
```bash
# Ensure all dependencies are installed
npm install

# Test locally first
node check-qpay-integration.js
```

**Step 2: Deploy to Render**
1. **Create Render Account**: Go to [render.com](https://render.com)
2. **Connect GitHub**: Link your repository
3. **Create Web Service**:
   - **Name**: `qpay-shopify-integration`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Choose appropriate plan

**Step 3: Configure Environment Variables**
```env
# Required QPay Credentials
QPAY_USERNAME=your_production_username
QPAY_PASSWORD=your_production_password
QPAY_INVOICE_CODE=your_production_invoice_code
QPAY_API_URL=https://merchant.qpay.mn/v2

# Database (if using)
DATABASE_URL=your_production_database_url

# Security (Recommended)
QPAY_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production

# Shopify (if using webhooks)
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
```

#### Option B: Deploy to Other Platforms

**Heroku:**
```bash
# Install Heroku CLI
heroku create qpay-shopify-app
heroku config:set QPAY_USERNAME=your_username
heroku config:set QPAY_PASSWORD=your_password
# ... add other env vars
git push heroku main
```

**Vercel:**
```bash
npm i -g vercel
vercel
# Follow prompts and add environment variables
```

**DigitalOcean/AWS/GCP:**
- Use Docker with the provided configuration
- Set up environment variables in your hosting platform
- Ensure Node.js runtime is available

### 2. 🛍️ Configure Shopify Integration

#### Step 1: Create Shopify App (if not done)

1. **Go to Shopify Partners**: [partners.shopify.com](https://partners.shopify.com)
2. **Create App**:
   - **App Name**: "QPay Payment Gateway"
   - **App URL**: `https://your-domain.com`
   - **Allowed redirection URLs**: `https://your-domain.com/auth/callback`

#### Step 2: Configure Webhooks

**In Shopify Admin:**
1. **Go to**: Settings → Notifications
2. **Add Webhook**:
   - **Event**: `Order creation`
   - **Format**: `JSON`
   - **URL**: `https://your-domain.com/api/webhook/shopify`
   - **API Version**: Latest

**Or via Shopify CLI:**
```bash
shopify app generate webhook
# Select: orders/create
# URL: https://your-domain.com/api/webhook/shopify
```

#### Step 3: Set Up Payment Gateway (Optional)

If creating a custom payment gateway:

1. **Create Payment App**:
   ```bash
   shopify app generate extension
   # Select: Checkout UI Extension
   ```

2. **Configure Payment Processing**:
   - Add QPay payment option in checkout
   - Handle payment redirects
   - Process payment confirmations

### 3. 🔧 QPay Production Configuration

#### Step 1: Get Production Credentials

1. **Contact QPay Support**:
   - Email: support@qpay.mn
   - Request production credentials
   - Provide your business information

2. **Receive Credentials**:
   ```
   Production Username: PROD_USERNAME
   Production Password: PROD_PASSWORD
   Production Invoice Code: PROD_INVOICE_CODE
   ```

#### Step 2: Configure Webhooks with QPay

1. **Provide Webhook URL** to QPay:
   ```
   Webhook URL: https://your-domain.com/api/webhook/qpay
   ```

2. **Set Webhook Secret** (if provided by QPay):
   ```env
   QPAY_WEBHOOK_SECRET=secret_from_qpay
   ```

### 4. 🧪 Production Testing

#### Step 1: Test Server Health

```bash
# Test health endpoint
curl https://your-domain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "services": {
    "qpay": "connected",
    "database": "connected"
  }
}
```

#### Step 2: Test QPay Integration

```bash
# Test invoice creation
curl -X POST https://your-domain.com/api/create-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Test Order",
    "customer": {
      "email": "test@example.com",
      "name": "Test Customer"
    }
  }'
```

#### Step 3: Test Shopify Webhooks

1. **Create Test Order** in Shopify
2. **Check Logs** for webhook processing
3. **Verify** QPay invoice creation

### 5. 📊 Monitoring & Logging

#### Set Up Monitoring

**Application Monitoring:**
```javascript
// Add to server.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

**Error Tracking:**
```javascript
// Add error tracking service (e.g., Sentry)
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

**Health Checks:**
- Monitor `/health` endpoint
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure alerts for downtime

## 🔒 Security Checklist

### ✅ Pre-Production Security

- [ ] **Environment Variables**: All secrets in environment variables
- [ ] **HTTPS**: SSL certificate configured
- [ ] **Webhook Signatures**: Signature verification enabled
- [ ] **Rate Limiting**: Protection against abuse
- [ ] **Input Validation**: All inputs validated
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Logging**: Comprehensive logging without secrets

### 🛡️ Production Security

```env
# Security headers
NODE_ENV=production
QPAY_WEBHOOK_SECRET=strong_secret_here
SHOPIFY_WEBHOOK_SECRET=shopify_secret_here

# Database security
DATABASE_URL=secure_connection_string
DATABASE_SSL=true
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] **Server deployed** and accessible
- [ ] **Environment variables** configured
- [ ] **QPay credentials** working in production
- [ ] **Shopify webhooks** configured
- [ ] **Health checks** passing
- [ ] **Test transactions** completed
- [ ] **Monitoring** set up
- [ ] **Error tracking** configured

### Launch Day
- [ ] **Monitor logs** for errors
- [ ] **Test first real transaction**
- [ ] **Verify webhook processing**
- [ ] **Check payment confirmations**
- [ ] **Monitor performance**

### Post-Launch
- [ ] **Daily monitoring** for 1 week
- [ ] **Performance optimization** if needed
- [ ] **User feedback** collection
- [ ] **Documentation** updates

## 🔧 Troubleshooting

### Common Issues

**1. QPay Authentication Fails**
```bash
# Check credentials
node test-qpay-token.js

# Verify environment variables
echo $QPAY_USERNAME
echo $QPAY_PASSWORD
```

**2. Webhooks Not Received**
```bash
# Check webhook URL accessibility
curl https://your-domain.com/api/webhook/qpay

# Verify webhook secret
echo $QPAY_WEBHOOK_SECRET
```

**3. Shopify Integration Issues**
```bash
# Test Shopify webhook
curl -X POST https://your-domain.com/api/webhook/shopify \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Debug Commands

```bash
# Check integration status
node check-qpay-integration.js

# Test token refresh
node test-token-refresh.js

# Start test server
node start-test-server.js
```

## 📞 Support Contacts

**QPay Support:**
- Email: support@qpay.mn
- Phone: +976-xxxx-xxxx
- Documentation: https://merchant.qpay.mn/docs

**Shopify Support:**
- Partners Help: https://partners.shopify.com/help
- Developer Documentation: https://shopify.dev

## 🎉 Success!

Once all steps are completed, your QPay Shopify integration will be live in production! 🚀

**Key URLs:**
- **Health Check**: `https://your-domain.com/health`
- **QPay Webhook**: `https://your-domain.com/api/webhook/qpay`
- **Shopify Webhook**: `https://your-domain.com/api/webhook/shopify`
- **Invoice Creation**: `https://your-domain.com/api/create-invoice`

**Remember:**
- Monitor logs regularly
- Keep credentials secure
- Test thoroughly before major changes
- Maintain regular backups