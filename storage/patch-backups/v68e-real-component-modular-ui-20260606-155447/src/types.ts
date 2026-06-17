export type Theme = 'halloween' | 'storm';

export type Category = {
  slug: string;
  name: string;
};

export type Product = {
  id?: string;
  productId?: string;
  sku?: string;
  buyerSkuCode?: string;
  buyer_sku_code?: string;
  name?: string;
  productName?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  categorySlug?: string;
  price?: number;
  sellingPrice?: number;
  selling_price?: number;
};

export type PaymentMethod = {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  provider?: string;
};

export type Order = Record<string, any>;
