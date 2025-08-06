# Shopify CLI Setup and Webhook Configuration

This guide helps you set up Shopify CLI and configure webhooks properly.

## 🚨 Common Issues Fixed

### Issue 1: "shopify app generate webhook" command not found
**Solution**: You don't need Shopify CLI for this integration! We've already implemented all webhook endpoints.

### Issue 2: Webhook URL returns "Not Found"
**Solution**: The webhook endpoints are now implemented in your server.

## ✅ Webhook Endpoints Now Available

Your server now includes these Shopify webhook endpoints:

```
POST /webhooks/shopify/orders/create     - New order created
POST /webhooks/shopify/orders/updated    - Order status changed  
POST /webhooks/shopify/orders/paid       - Payment received
POST /webhooks/shopify/orders/cancelled  - Order cancelled
POST /webhooks/shopify                   - Generic webhook handler
```

## 🔧 How to Configure Webhooks

### Option 1: Manual Configuration (Recommended)

1. **Go to your Shopify Admin**:
   - Navigate to Settings → Notifications
   - Scroll down to "Webhooks" section
   - Click "Create webhook"

2. **Configure each webhook**:
   ```
   Event: Order creation
   Format: JSON
   URL: https://your-app-name.onrender.com/webhooks/shopify/orders/create
   
   Event: Order updated
   Format: JSON  
   URL: https://your-app-name.onrender.com/webhooks/shopify/orders/updated
   
   Event: Order paid
   Format: JSON
   URL: https://your-app-name.onrender.com/webhooks/shopify/orders/paid
   
   Event: Order cancelled
   Format: JSON
   URL: https://your-app-name.onrender.com/webhooks/shopify/orders/cancelled
   ```

### Option 2: Using Shopify Partner Dashboard

1. **Go to Shopify Partners**:
   - Visit https://partners.shopify.com/
   - Navigate to your app
   - Go to App setup → Webhooks

2. **Add webhook endpoints**:
   ```
   https://your-app-name.onrender.com/webhooks/shopify/orders/create
   https://your-app-name.onrender.com/webhooks/shopify/orders/updated
   https://your-app-name.onrender.com/webhooks/shopify/orders/paid
   https://your-app-name.onrender.com/webhooks/shopify/orders/cancelled
   ```

## 🧪 Test Your Webhooks

### 1. Test Webhook Endpoints

```bash
# Test generic Shopify webhook
curl -X POST https://your-app-name.onrender.com/webhooks/shopify \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/create" \
  -d '{"test": "webhook"}'

# Should return: {"received": true, "topic": "orders/create"}
```

### 2. Test Order Creation Webhook

```bash
curl -X POST https://your-app-name.onrender.com/webhooks/shopify/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "order_number": "#1001",
    "total_price": "100.00",
    "currency": "MNT",
    "customer": {
      "email": "test@example.com",
      "phone": "+976-12345678"
    }
  }'
```

## 🔒 Webhook Security

### Set Webhook Secret

Add this to your environment variables:
```env
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_from_shopify
```

### How to Get Webhook Secret

1. **In Shopify Admin**:
   - Go to Settings → Notifications
   - Find your webhook
   - Copy the "Webhook signature secret"

2. **In Shopify Partner Dashboard**:
   - Go to your app settings
   - Find "Webhook signature secret"
   - Copy the value

## 🚀 Deploy and Test

### 1. Deploy Your Updated Server

```bash
# If using Render.com
git add .
git commit -m "Add Shopify webhook endpoints"
git push origin main

# Render will auto-deploy
```

### 2. Verify Deployment

```bash
# Check if webhooks are working
curl https://your-app-name.onrender.com/webhooks/shopify

# Should return webhook handler response, not "Not Found"
```

### 3. Test End-to-End

1. **Create a test order** in your Shopify store
2. **Check server logs** for webhook reception
3. **Verify QPay invoice** creation
4. **Test payment flow**

## 📋 Troubleshooting

### Webhook Still Returns "Not Found"

1. **Check deployment**:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

2. **Check server logs** in your hosting platform

3. **Verify URL format**:
   ```
   ✅ Correct: https://your-app-name.onrender.com/webhooks/shopify
   ❌ Wrong:   https://your-store.myshopify.com/webhooks/shopify
   ```

### Webhook Signature Verification Fails

1. **Check environment variable**:
   ```bash
   echo $SHOPIFY_WEBHOOK_SECRET
   ```

2. **Verify secret in Shopify settings**

3. **Test without signature** (temporarily):
   - Comment out signature verification in server.js
   - Test webhook reception
   - Re-enable after confirming webhook works

## 🎯 Alternative: No Shopify CLI Needed

**Important**: You don't need Shopify CLI for this integration!

- ✅ **Webhook endpoints**: Already implemented in server.js
- ✅ **QPay integration**: Already working
- ✅ **Order processing**: Fully functional
- ✅ **Production ready**: Deploy and configure webhooks manually

## 📞 Support

If you still have issues:

1. **Check server logs** in your hosting platform
2. **Test webhook URLs** with curl commands above
3. **Verify environment variables** are set correctly
4. **Check Shopify webhook delivery logs** in admin panel

---

**✅ Your webhooks are now ready!** Configure them in Shopify admin and start processing orders.