// Shopify GraphQL API Types

export interface ShopifyImage {
  id: string;
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ShopifyPrice {
  amount: string;
  currencyCode: string;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable?: number;
  price: ShopifyPrice;
  compareAtPrice?: ShopifyPrice;
  selectedOptions: ShopifySelectedOption[];
  image?: ShopifyImage;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyPrice;
  maxVariantPrice: ShopifyPrice;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  images: {
    edges: {
      node: ShopifyImage;
    }[];
  };
  variants: {
    edges: {
      node: ShopifyProductVariant;
    }[];
  };
  priceRange: ShopifyPriceRange;
  compareAtPriceRange?: ShopifyPriceRange;
}

export interface ShopifyPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
  pageInfo: ShopifyPageInfo;
}

// Simplified Product type for our application
export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  price: number; // in MNT
  compareAtPrice?: number; // in MNT
  image: string;
  images: string[];
  availableForSale: boolean;
  variants: ProductVariant[];
  vendor: string;
  productType: string;
  tags: string[];
}

export interface ProductVariant {
  id: string;
  title: string;
  price: number; // in MNT
  compareAtPrice?: number; // in MNT
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  image?: string;
}

// Cart item type
export interface CartItem {
  id: string;
  title: string;
  variant: string;
  quantity: number;
  price: number; // in MNT
  image: string;
  handle: string;
  variantId: string;
  availableForSale: boolean;
}

// Shopify Webhook types
export interface ShopifyWebhookProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyWebhookVariant[];
  options: ShopifyWebhookOption[];
  images: ShopifyWebhookImage[];
  image: ShopifyWebhookImage;
}

export interface ShopifyWebhookVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string;
  fulfillment_service: string;
  inventory_management: string;
  option1: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  image_id?: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyWebhookOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyWebhookImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

// Collection types
export interface ShopifyCollection {
  id: string;
  title: string;
  description: string;
  handle: string;
  image?: ShopifyImage;
  products: {
    edges: {
      node: ShopifyProduct;
    }[];
  };
}

// Search and filter types
export interface ProductFilters {
  available?: boolean;
  productType?: string;
  vendor?: string;
  tags?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export interface ProductSearchParams {
  query?: string;
  filters?: ProductFilters;
  sortKey?: 'TITLE' | 'PRICE' | 'CREATED_AT' | 'UPDATED_AT' | 'BEST_SELLING' | 'RELEVANCE';
  reverse?: boolean;
  first?: number;
  after?: string;
}