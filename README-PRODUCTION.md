# QPay Shopify Integration - Production Deployment

🚀 **Ready for Production!** This guide will help you deploy your QPay Shopify integration to production in minutes.

## 🎯 Quick Start

### 1. Check Production Readiness
```bash
npm run check:production
```

### 2. Deploy to Your Platform
```bash
# Deploy to Render.com (Recommended)
npm run deploy:render

# Or deploy to Heroku
npm run deploy:heroku

# Or deploy to Vercel
npm run deploy:vercel
```

### 3. Configure Environment Variables
Set these in your hosting platform:
```env
NODE_ENV=production
QPAY_USERNAME=your_qpay_username
QPAY_PASSWORD=your_qpay_password
QPAY_INVOICE_CODE=your_invoice_code
QPAY_API_URL=https://merchant.qpay.mn/v2
QPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Set Up Shopify App
Follow the [Shopify App Setup Guide](./SHOPIFY-APP-SETUP.md)

## 📋 What's Included

✅ **Complete QPay Integration**
- Automatic token refresh with retry logic
- Invoice creation and status tracking
- Webhook handling with signature verification
- Rate limiting and security middleware

✅ **Production-Ready Features**
- Token-based authentication (no IP whitelisting needed)
- Comprehensive error handling
- Request logging and monitoring
- Health check endpoints

✅ **Deployment Tools**
- Production readiness checker
- Quick deployment scripts
- Platform-specific configurations
- Environment variable templates

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shopify       │    │   Your Server   │    │     QPay        │
│   Store         │    │   (Node.js)     │    │   Gateway       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Order Created      │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Create Invoice     │
         │                       ├──────────────────────►│
         │                       │                       │
         │                       │ 3. Invoice Created    │
         │                       │◄──────────────────────┤
         │ 4. Payment URL        │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │                       │ 5. Payment Webhook   │
         │                       │◄──────────────────────┤
         │ 6. Order Updated      │                       │
         │◄──────────────────────┤                       │
```

## 🚀 Deployment Platforms

### Render.com (Recommended)
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Built-in SSL
- ✅ Easy environment variable management

### Heroku
- ✅ Popular and reliable
- ✅ Extensive add-on ecosystem
- ⚠️ No free tier (paid plans start at $7/month)

### Vercel
- ✅ Excellent for serverless
- ✅ Fast global CDN
- ⚠️ Better for frontend apps

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server |
| `npm run check:integration` | Check QPay integration |
| `npm run check:production` | Check production readiness |
| `npm run test:token-refresh` | Test automatic token refresh |
| `npm run deploy:render` | Deploy to Render.com |
| `npm run deploy:heroku` | Deploy to Heroku |
| `npm run deploy:vercel` | Deploy to Vercel |

## 📁 Project Structure

```
qpay-shopify-integration/
├── 📄 server.js                     # Main server file
├── 📁 lib/
│   ├── 📄 qpay.js                   # QPay client with auto-refresh
│   ├── 📄 shopify.js                # Shopify integration
│   └── 📄 database.js               # Database operations
├── 📁 middleware/
│   └── 📄 qpay-security.js          # Security & rate limiting
├── 📁 routes/
│   ├── 📄 webhooks.js               # Webhook handlers
│   └── 📄 api.js                    # API endpoints
├── 📄 deploy-to-production.js       # Production readiness checker
├── 📄 quick-deploy.js               # Quick deployment script
├── 📄 render.yaml                   # Render.com configuration
├── 📄 package.json                  # Dependencies & scripts
└── 📄 .env.production               # Environment template
```

## 🔒 Security Features

- **Token-Based Authentication**: Secure OAuth 2.0 with automatic refresh
- **Webhook Signature Verification**: Validates incoming webhooks
- **Rate Limiting**: Prevents API abuse
- **Request Logging**: Monitors all QPay requests
- **Environment Variable Protection**: Secrets never exposed in code

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```
GET /health
```
Returns server status and QPay connectivity.

### Webhook Status
```
GET /webhooks/status
```
Returns webhook processing statistics.

### QPay Connection Test
```
GET /api/qpay/test
```
Tests QPay authentication and token refresh.

## 🐛 Troubleshooting

### Common Issues

1. **QPay Authentication Failed**
   ```bash
   # Check credentials
   npm run check:integration
   ```

2. **Webhook Not Receiving**
   ```bash
   # Test webhook endpoint
   curl https://your-domain.com/health
   ```

3. **Token Refresh Issues**
   ```bash
   # Test token refresh
   npm run test:token-refresh
   ```

### Debug Commands

```bash
# Check all environment variables
node -e "console.log(process.env)"

# Test QPay connection
node -e "const QPayClient = require('./lib/qpay'); new QPayClient().authenticate().then(console.log)"

# Check server health
curl https://your-domain.com/health
```

## 📞 Support

- **QPay API Issues**: Contact QPay support
- **Shopify Integration**: Check Shopify Partner documentation
- **Deployment Issues**: Check your hosting platform docs

## 🎉 Success Checklist

After deployment, verify these work:

- [ ] Health check returns 200 OK
- [ ] QPay authentication succeeds
- [ ] Webhooks receive and process correctly
- [ ] Test order creates QPay invoice
- [ ] Payment webhook updates order status
- [ ] All environment variables are set
- [ ] HTTPS is enabled
- [ ] Monitoring is configured

## 🚀 Go Live!

Once everything is tested and working:

1. **Update Shopify App URLs** with your production domain
2. **Configure QPay Webhooks** to point to your server
3. **Test with Real Transactions** in a controlled environment
4. **Monitor Logs** for the first few transactions
5. **Set Up Alerts** for errors and failures

---

**🎊 Congratulations!** Your QPay Shopify integration is now live and ready to process payments!

For detailed guides, see:
- [Production Deployment Guide](./PRODUCTION-DEPLOYMENT-GUIDE.md)
- [Shopify App Setup](./SHOPIFY-APP-SETUP.md)
- [Token-Based Authentication](./TOKEN-BASED-AUTHENTICATION.md)