import { Product, ShopifyProduct, ShopifyProductsResponse } from '../types/shopify';

const SHOPIFY_ENDPOINT = `https://${process.env.SHOPIFY_SHOP_DOMAIN}/api/2023-10/graphql.json`;

export async function shopifyFetch(query: string, variables = {}) {
  try {
    const response = await fetch(SHOPIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Shopify fetch error:', error);
    throw error;
  }
}

// Get single product by handle
export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        handle
        productType
        vendor
        tags
        availableForSale
        createdAt
        updatedAt
        images(first: 10) {
          edges {
            node {
              id
              url
              altText
              width
              height
            }
          }
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
              image {
                id
                url
                altText
              }
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  try {
    const response: any = await shopifyFetch(query, { handle });
    const { data, errors } = response;
    
    if (errors) {
      console.error('GraphQL errors:', errors);
      return null;
    }
    
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Get multiple products
export async function getProducts(first = 20, after?: string): Promise<ShopifyProductsResponse> {
  const query = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          cursor
          node {
            id
            title
            handle
            description
            productType
            vendor
            tags
            availableForSale
            createdAt
            updatedAt
            images(first: 3) {
              edges {
                node {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  quantityAvailable
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response: any = await shopifyFetch(query, { first, after });
    const { data, errors } = response;
    
    if (errors) {
      console.error('GraphQL errors:', errors);
      return { products: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: '', endCursor: '' } };
    }
    
    return {
      products: data.products.edges.map((edge: any) => edge.node),
      pageInfo: data.products.pageInfo
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: '', endCursor: '' } };
  }
}

// Search products
export async function searchProducts(query: string, first = 20): Promise<ShopifyProduct[]> {
  const searchQuery = `
    query searchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            vendor
            availableForSale
            images(first: 1) {
              edges {
                node {
                  id
                  url
                  altText
                }
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response: any = await shopifyFetch(searchQuery, { query, first });
    const { data, errors } = response;
    
    if (errors) {
      console.error('GraphQL errors:', errors);
      return [];
    }
    
    return data.products.edges.map((edge: any) => edge.node);
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Get product by variant ID
export async function getProductByVariantId(variantId: string): Promise<ShopifyProduct | null> {
  const query = `
    query getProductByVariant($variantId: ID!) {
      productVariant(id: $variantId) {
        product {
          id
          title
          description
          handle
          productType
          vendor
          availableForSale
          images(first: 5) {
            edges {
              node {
                id
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
                availableForSale
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response: any = await shopifyFetch(query, { variantId });
    const { data, errors } = response;
    
    if (errors || !data.productVariant) {
      console.error('GraphQL errors:', errors);
      return null;
    }
    
    return data.productVariant.product;
  } catch (error) {
    console.error('Error fetching product by variant:', error);
    return null;
  }
}

// Convert Shopify price to MNT (assuming USD to MNT conversion)
export function convertToMNT(amount: string, currencyCode: string): number {
  const price = parseFloat(amount);
  
  if (currencyCode === 'MNT') {
    return Math.round(price);
  }
  
  // Convert USD to MNT (approximate rate: 1 USD = 2800 MNT)
  if (currencyCode === 'USD') {
    return Math.round(price * 2800);
  }
  
  // Default conversion for other currencies
  return Math.round(price * 2800);
}

// Format product for checkout
export function formatProductForCheckout(product: ShopifyProduct, variantId?: string) {
  const selectedVariant = variantId 
    ? product.variants.edges.find(edge => edge.node.id === variantId)?.node
    : product.variants.edges[0]?.node;

  if (!selectedVariant) {
    throw new Error('No variant found for product');
  }

  return {
    id: product.id,
    title: product.title,
    variant: selectedVariant.title,
    quantity: 1,
    price: convertToMNT(selectedVariant.price.amount, selectedVariant.price.currencyCode),
    image: product.images.edges[0]?.node.url || '',
    handle: product.handle,
    variantId: selectedVariant.id,
    availableForSale: selectedVariant.availableForSale
  };
}