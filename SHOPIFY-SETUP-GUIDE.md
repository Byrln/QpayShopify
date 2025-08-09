# Shopify Product Integration Setup Guide

This guide will help you integrate Shopify products with your QPay Next.js application deployed on Vercel.

## Prerequisites

- A Shopify store (Partner account or paid plan)
- Vercel account for deployment
- Basic knowledge of Next.js and React

## Step 1: Create Shopify App

### Option A: Using Shopify Partner Dashboard (Recommended)

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create a partner account if you don't have one
3. Navigate to "Apps" → "Create app"
4. Choose "Create app manually"
5. Fill in app details:
   - App name: "QPay Integration"
   - App URL: `https://your-app.vercel.app`
   - Allowed redirection URLs: `https://your-app.vercel.app/auth/callback`

### Option B: Using Shopify CLI

```bash
npm install -g @shopify/cli @shopify/theme
shopify app create
```

## Step 2: Configure API Permissions

### Admin API Permissions (for order management)

In your Shopify app settings, request these scopes:

```
read_products
write_products
read_orders
write_orders
read_customers
write_customers
read_inventory
write_inventory
```

### Storefront API (for product display)

1. In your Shopify admin, go to "Apps" → "Manage private apps"
2. Create a private app or use existing
3. Enable "Storefront API access"
4. Grant these permissions:
   - Read products, variants, and collections
   - Read customer tags
   - Read and modify checkouts

## Step 3: Get API Credentials

### Admin API Token

1. In Shopify admin → "Apps" → "App and sales channel settings"
2. Click "Develop apps" → "Create an app"
3. Configure Admin API access with required scopes
4. Install the app and copy the access token

### Storefront API Token

1. In Shopify admin → "Apps" → "Manage private apps"
2. Create or edit your private app
3. Enable "Storefront API access"
4. Copy the Storefront access token

## Step 4: Environment Variables

Add these to your Vercel environment variables:

```env
# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_STOREFRONT_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2023-10

# QPay Configuration (existing)
QPAY_USERNAME=your_qpay_username
QPAY_PASSWORD=your_qpay_password
QPAY_INVOICE_CODE=your_invoice_code
QPAY_API_URL=https://merchant.qpay.mn/v2
```

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each variable with appropriate values
5. Redeploy your application

## Step 5: Test the Integration

### 1. Test Product Fetching

```bash
# Test products API
curl https://your-app.vercel.app/api/products

# Test single product
curl https://your-app.vercel.app/api/products/your-product-handle
```

### 2. Test Product Pages

- Visit: `https://your-app.vercel.app/products`
- Click on any product to view details
- Test the "Buy Now" functionality

### 3. Test Complete Workflow

1. Browse products: `/products`
2. Select a product: `/products/[handle]`
3. Proceed to checkout: `/checkout`
4. Complete payment: `/payment`
5. View confirmation: `/thank-you`

## Step 6: Shopify Store Setup

### Add Test Products

1. In Shopify admin → "Products" → "Add product"
2. Fill in product details:
   - Title
   - Description
   - Images
   - Pricing
   - Inventory
   - SEO handle (URL)

### Configure Variants

1. Add product options (Size, Color, etc.)
2. Set pricing for each variant
3. Manage inventory levels
4. Upload variant-specific images

### Set Up Collections

1. Go to "Products" → "Collections"
2. Create collections to organize products
3. Add products to relevant collections

## Step 7: Advanced Configuration

### Webhooks (Optional)

Set up webhooks to sync product updates:

1. In Shopify admin → "Settings" → "Notifications"
2. Scroll to "Webhooks" section
3. Add webhook endpoints:
   - Product creation: `https://your-app.vercel.app/api/webhooks/products/create`
   - Product update: `https://your-app.vercel.app/api/webhooks/products/update`
   - Product deletion: `https://your-app.vercel.app/api/webhooks/products/delete`

### Currency Conversion

The integration automatically converts USD to MNT using a fixed rate (1 USD = 2800 MNT). To use dynamic rates:

1. Sign up for a currency API (e.g., exchangerate-api.com)
2. Update the `convertToMNT` function in `lib/shopify.ts`
3. Add the API key to environment variables

## Step 8: Production Deployment

### 1. Update Environment Variables

```env
NODE_ENV=production
BASE_URL=https://your-app.vercel.app
```

### 2. Deploy to Vercel

```bash
# Deploy
vercel --prod

# Or push to main branch if auto-deployment is enabled
git push origin main
```

### 3. Update Shopify App URLs

1. Update app URL in Shopify Partner dashboard
2. Update webhook URLs if configured
3. Test all functionality in production

## Troubleshooting

### Common Issues

1. **"Access denied" errors**
   - Check API permissions and scopes
   - Verify access tokens are correct
   - Ensure app is installed on the store

2. **"Product not found" errors**
   - Verify product handles are correct
   - Check if products are published
   - Ensure Storefront API access is enabled

3. **CORS errors**
   - Add your domain to Shopify app settings
   - Check allowed redirection URLs

4. **Environment variable issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Redeploy after adding variables

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

### Testing Locally

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your credentials

# Run development server
npm run dev
```

## API Endpoints

### Products

- `GET /api/products` - List all products
- `GET /api/products?query=search` - Search products
- `GET /api/products/[handle]` - Get single product

### Orders (Existing)

- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Webhooks**: Verify webhook signatures
3. **Rate Limiting**: Implement rate limiting for API calls
4. **HTTPS**: Always use HTTPS in production
5. **Input Validation**: Validate all user inputs

## Performance Optimization

1. **Caching**: Implement Redis caching for product data
2. **Image Optimization**: Use Shopify's image transformation API
3. **Pagination**: Implement proper pagination for large product catalogs
4. **CDN**: Use Vercel's CDN for static assets

## Next Steps

1. Implement product search and filtering
2. Add shopping cart functionality
3. Set up inventory management
4. Implement customer accounts
5. Add product reviews and ratings
6. Set up analytics and tracking

## Support

For issues and questions:

1. Check Shopify API documentation
2. Review Vercel deployment logs
3. Test API endpoints directly
4. Check environment variables

## Resources

- [Shopify API Documentation](https://shopify.dev/api)
- [Shopify Storefront API](https://shopify.dev/api/storefront)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)