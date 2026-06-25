export interface ProductSpec {
  spec_key: string;
  spec_value: string;
}

export interface ProductCatalogItem {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  is_active: number;
  created_at: string;
  category_name: string;
  stock_qty: number;
  low_stock_threshold: number;
  specs: ProductSpec[];
}

export interface ProductSaveRequest {
  id?: number | null;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  stock_qty: number;
  low_stock_threshold: number;
  specs: ProductSpec[];
}
