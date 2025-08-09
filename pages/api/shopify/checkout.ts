import { NextApiRequest, NextApiResponse } from 'next';

interface ShopifyCheckoutRequest {
  product_id: number;
  variant_id: number;
  quantity: number;
  shop_domain: string;
  payment_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_id, variant_id, quantity, shop_domain, payment_id }: ShopifyCheckoutRequest = req.body;

    if (!product_id || !variant_id || !quantity || !shop_domain) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create Shopify checkout URL
    // Format: https://shop-domain.myshopify.com/cart/variant_id:quantity
    const checkoutUrl = `https://${shop_domain}/cart/${variant_id}:${quantity}`;

    // Log the successful payment for tracking
    console.log('Shopify checkout redirect:', {
      product_id,
      variant_id,
      quantity,
      shop_domain,
      payment_id,
      checkout_url: checkoutUrl,
      timestamp: new Date().toISOString()
    });

    // Return the checkout URL
    res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      message: 'Checkout URL generated successfully'
    });

  } catch (error) {
    console.error('Error creating Shopify checkout:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}