# Shopify Product Integration with Next.js Vercel App

## Overview
This guide explains how to fetch product information from Shopify and integrate it with your Next.js application deployed on Vercel.

## Integration Methods

### Method 1: Shopify Storefront API (Recommended)
The Storefront API allows you to fetch product data directly from your frontend.

#### Setup Steps:

1. **Create a Private App in Shopify Admin**
   - Go to Settings → Apps and sales channels → Develop apps
   - Click "Create an app"
   - Configure Storefront API access with these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_read_product_inventory`
     - `unauthenticated_read_product_tags`

2. **Get API Credentials**
   - Note your Storefront access token
   - Note your shop domain (e.g., `your-shop.myshopify.com`)

3. **Add Environment Variables**
   ```env
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
   SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
   ```

#### Implementation:

**Create Shopify API Client (`lib/shopify.ts`):**
```typescript
const SHOPIFY_ENDPOINT = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/api/2023-10/graphql.json`;

export async function shopifyFetch(query: string, variables = {}) {
  const response = await fetch(SHOPIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}

// Get single product
export async function getProduct(handle: string) {
  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        handle
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  const { data } = await shopifyFetch(query, { handle });
  return data.product;
}

// Get multiple products
export async function getProducts(first = 10) {
  const query = `
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const { data } = await shopifyFetch(query, { first });
  return data.products.edges.map(edge => edge.node);
}
```

**API Route (`pages/api/shopify/products.ts`):**
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { getProducts, getProduct } from '../../../lib/shopify';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { handle, limit } = req.query;
      
      if (handle) {
        // Get single product
        const product = await getProduct(handle as string);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        return res.json(product);
      } else {
        // Get multiple products
        const products = await getProducts(parseInt(limit as string) || 10);
        return res.json(products);
      }
    } catch (error) {
      console.error('Shopify API error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
```

### Method 2: Shopify Admin API
For more advanced operations and admin-level access.

#### Setup:
1. Create a private app with Admin API access
2. Configure required scopes: `read_products`, `read_inventory`
3. Get Admin API access token

#### Environment Variables:
```env
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com
```

#### Implementation (`lib/shopify-admin.ts`):
```typescript
const ADMIN_ENDPOINT = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2023-10`;

export async function shopifyAdminFetch(endpoint: string) {
  const response = await fetch(`${ADMIN_ENDPOINT}${endpoint}`, {
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}

export async function getProductsAdmin() {
  return shopifyAdminFetch('/products.json');
}

export async function getProductAdmin(id: string) {
  return shopifyAdminFetch(`/products/${id}.json`);
}
```

## Integration with Your Checkout Flow

### Update Checkout Page
Modify your checkout page to fetch real product data:

```typescript
// In pages/checkout.tsx
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { product: productHandle, variant: variantId, total } = query;
  
  let productData = null;
  
  if (productHandle) {
    try {
      // Fetch product from Shopify
      const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/shopify/products?handle=${productHandle}`);
      if (response.ok) {
        productData = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  }
  
  return {
    props: {
      productHandle: productHandle as string || '',
      variantId: variantId as string || '',
      total: parseInt(total as string) || 0,
      productData: productData || null,
    },
  };
};
```

### Real-time Product Updates
For real-time inventory and price updates, consider:

1. **Webhooks** - Set up Shopify webhooks to notify your app of changes
2. **Polling** - Periodically fetch updated product data
3. **Client-side fetching** - Fetch fresh data when users visit product pages

## Webhook Integration (Optional)

### Setup Webhooks in Shopify:
1. Go to Settings → Notifications
2. Create webhooks for:
   - Product creation
   - Product updates
   - Inventory updates

### Webhook Handler (`pages/api/webhooks/shopify.ts`):
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

function verifyWebhook(data: string, signature: string) {
  const hmac = crypto.createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET!);
  hmac.update(data, 'utf8');
  const hash = hmac.digest('base64');
  return hash === signature;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const signature = req.headers['x-shopify-hmac-sha256'] as string;
  const body = JSON.stringify(req.body);

  if (!verifyWebhook(body, signature)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { topic } = req.headers;
  
  switch (topic) {
    case 'products/create':
    case 'products/update':
      // Handle product updates
      console.log('Product updated:', req.body);
      break;
    case 'inventory_levels/update':
      // Handle inventory updates
      console.log('Inventory updated:', req.body);
      break;
  }

  res.status(200).json({ received: true });
}
```

## Usage Examples

### Fetch Products in Component:
```typescript
import { useEffect, useState } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/shopify/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);
  
  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.title}</h3>
          <p>{product.description}</p>
          <p>Price: {product.variants.edges[0]?.node.price.amount}</p>
        </div>
      ))}
    </div>
  );
}
```

### Update Cart Integration:
Modify your cart drawer to use real product data:

```liquid
<!-- In cart-drawer.liquid -->
<script>
function redirectToCheckout() {
  const cartItems = {{ cart.items | json }};
  const productHandles = cartItems.map(item => item.product.handle).join(',');
  const variantIds = cartItems.map(item => item.variant_id).join(',');
  const total = {{ cart.total_price }};
  
  const checkoutUrl = `https://satorimn.vercel.app/checkout?products=${productHandles}&variants=${variantIds}&total=${total}`;
  window.open(checkoutUrl, '_blank');
}
</script>
```

## Environment Variables Summary
Add these to your Vercel deployment:

```env
# Shopify Storefront API
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
SHOPIFY_SHOP_DOMAIN=your-shop.myshopify.com

# Shopify Admin API (optional)
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token

# Webhooks (optional)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
```

## Testing
1. Test product fetching: `GET /api/shopify/products`
2. Test single product: `GET /api/shopify/products?handle=product-handle`
3. Test checkout with real data: `/checkout?product=product-handle&variant=variant-id&total=amount`

## Next Steps
1. Set up Shopify app and get API credentials
2. Add environment variables to Vercel
3. Implement the API routes
4. Update your checkout flow to use real product data
5. Test the integration end-to-end

This integration will allow your Vercel app to access real-time product information from your Shopify store!