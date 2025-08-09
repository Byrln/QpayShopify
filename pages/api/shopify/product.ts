import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product_id, variant_id, shop_domain } = req.query;

  if (!product_id || !variant_id) {
    return res.status(400).json({ 
      error: 'Missing required parameters: product_id, variant_id' 
    });
  }

  try {
    // In a real implementation, you would fetch from Shopify API
    // For now, return mock data based on the parameters
    const mockProduct: ShopifyProduct = {
      id: parseInt(product_id as string),
      title: `Product ${product_id}`,
      price: '50000', // Default price in MNT
      variant_id: parseInt(variant_id as string),
      handle: `product-${product_id}`,
      image: '/placeholder-product.jpg',
      quantity: 1,
      shop_domain: shop_domain as string
    };

    // Calculate price (you can implement dynamic pricing logic here)
    const calculatedPrice = parseFloat(mockProduct.price) * mockProduct.quantity;

    return res.status(200).json({
      ...mockProduct,
      price: calculatedPrice.toString() // Keep price as string for consistency
    });

  } catch (error) {
    console.error('Error fetching Shopify product:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch product data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}