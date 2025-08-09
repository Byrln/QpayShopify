# QPay Shopify Integration

A minimal Node.js server for integrating QPay payments with Shopify stores.

## Project Structure

```
├── lib/                    # Core modules
│   ├── database.js        # Database operations
│   ├── qpay.js           # QPay API integration
│   └── shopify.js        # Shopify API integration
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema definition
├── public/               # Static files
│   ├── qpay-payment.html # Payment page template
│   └── payment-success.html # Success page template
├── server.js             # Main server file
├── index.js              # Entry point
├── package.json          # Dependencies
├── render.yaml           # Deployment configuration
├── .env.example          # Environment variables template
└── .env.production       # Production environment variables
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Environment Variables

```env
# QPay Configuration
QPAY_CLIENT_ID=your_qpay_client_id
QPAY_CLIENT_SECRET=your_qpay_client_secret
QPAY_MERCHANT_ID=your_merchant_id
QPAY_INVOICE_CODE=your_invoice_code

# Shopify Configuration
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

# Database
DATABASE_URL=your_database_url

# Server
PORT=3000
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/create-qpay-invoice` - Create QPay invoice
- `POST /api/qpay-webhook` - QPay payment webhook
- `POST /webhooks/shopify/orders/paid` - Shopify order webhook

## Deployment

The project is configured for deployment on Render.com using the included `render.yaml` file.

## License

MIT