import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import PaymentPage from '../components/PaymentPage';

interface ShopifyProduct {
  id: number;
  title: string;
  price: string;
  variant_id: number;
  handle: string;
  image: string;
  quantity: number;
  shop_domain: string;
}

interface PaymentPageProps {
  orderId: string;
  amount: number;
  currency?: string;
  orderNumber?: string;
  itemCount?: string;
  product?: ShopifyProduct;
  return_url?: string;
  shop_domain?: string;
}

const Payment: React.FC<PaymentPageProps> = (props) => {
  // Calculate description for the payment
  const description = props.product ? 
    `${props.product.title} (${props.product.quantity}x)` : 
    `Order #${props.orderId}`;

  return (
    <>
      <Head>
        <title>Payment - QPay Integration</title>
        <meta name="description" content="Complete your payment using QPay" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <PaymentPage
        orderId={props.orderId}
        amount={props.amount}
        currency={props.currency || 'MNT'}
        description={description}
        product={props.product}
        return_url={props.return_url}
        shop_domain={props.shop_domain}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { orderId, amount, currency, orderNumber, itemCount, product, variant, return_url, shop_domain, shopify_product_id, shopify_variant_id } = context.query;
  
  // Debug logs removed - payment page working correctly

  // Handle Shopify product data from JSON
  let parsedProduct: ShopifyProduct | undefined;
  if (product && typeof product === 'string') {
    try {
      // Only try to parse as JSON if it looks like a JSON object (starts with {)
       if (product.startsWith('{')) {
         parsedProduct = JSON.parse(product);
       }
    } catch (e) {
        console.error('Failed to parse product data:', e);
      }
  }

  // Handle Shopify product/variant parameters with JSON data
  if (parsedProduct) {
    const productAmount = parseFloat(parsedProduct.price) * parsedProduct.quantity;
    return {
      props: {
        orderId: `shopify-${parsedProduct.variant_id}-${Date.now()}`,
        amount: productAmount,
        currency: (currency as string) || 'MNT',
        orderNumber: `#SHOPIFY-${parsedProduct.id}`,
        itemCount: `${parsedProduct.quantity} item(s)`,
        product: parsedProduct,
        ...(return_url && { return_url: return_url as string }),
        shop_domain: (shop_domain as string) || undefined,
      },
    };
  }

  // Handle Shopify product/variant IDs - use fallback data
  if (shopify_product_id && shopify_variant_id && shop_domain) {
    console.log('Using fallback data for shopify_product_id/shopify_variant_id:', shopify_product_id, shopify_variant_id);
    return {
      props: {
        orderId: `shopify-${shopify_variant_id}-${Date.now()}`,
        amount: 50000, // Default amount in MNT
        currency: (currency as string) || 'MNT',
        orderNumber: `#SHOPIFY-${shopify_product_id}`,
        itemCount: '1 item',
        product: {
          id: parseInt(shopify_product_id as string),
          title: `Product ${shopify_product_id}`,
          price: '50000',
          variant_id: parseInt(shopify_variant_id as string),
          handle: `product-${shopify_product_id}`,
          image: '/placeholder-product.jpg',
          quantity: 1,
          shop_domain: shop_domain as string
        },
        ...(return_url && { return_url: return_url as string }),
        shop_domain: shop_domain as string,
      },
    };
  }

  // Handle legacy Shopify product/variant parameters - use direct product data
  if (product && variant) {
    
    // Create mock product data directly (same as API endpoint)
    const mockProduct = {
      id: parseInt(product as string),
      title: `Product ${product}`,
      price: '50000', // Default price in MNT
      variant_id: parseInt(variant as string),
      handle: `product-${product}`,
      image: '/placeholder-product.jpg',
      quantity: 1,
      shop_domain: (shop_domain as string) || 'default.myshopify.com'
    };
    
    const calculatedPrice = parseFloat(mockProduct.price) * mockProduct.quantity;
    
    return {
      props: {
        orderId: `shopify-${variant}-${Date.now()}`,
        amount: calculatedPrice,
        currency: (currency as string) || 'MNT',
        orderNumber: `#SHOPIFY-${product}`,
        itemCount: `${mockProduct.quantity} item(s)`,
        product: {
          id: mockProduct.id,
          title: mockProduct.title,
          price: mockProduct.price,
          variant_id: mockProduct.variant_id,
          handle: mockProduct.handle,
          image: mockProduct.image,
          quantity: mockProduct.quantity,
          shop_domain: mockProduct.shop_domain
        },
        ...(return_url && { return_url: return_url as string }),
        shop_domain: mockProduct.shop_domain,
      },
    };
  }

  // Handle direct payment parameters
  if (orderId && amount) {
    return {
      props: {
        orderId: orderId as string,
        amount: parseFloat(amount as string),
        currency: (currency as string) || 'MNT',
        orderNumber: (orderNumber as string) || '#1001',
        itemCount: (itemCount as string) || '1 item',
      },
    };
  }

  // If no valid parameters found, return 404
  return {
    notFound: true,
  };
};

export default Payment;