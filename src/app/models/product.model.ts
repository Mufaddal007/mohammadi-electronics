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

export function getCategoryId(category: string): number {
  switch (category.toLowerCase()) {
    case 'inverters': return 1;
    case 'batteries': return 2;
    case 'coolers': return 3;
    case 'fans': return 4;
    case 'stabilizers': return 5;
    default: return 1;
  }
}

export function getCategoryNameById(id: number | null | undefined): string {
  switch (id) {
    case 1: return 'Inverters';
    case 2: return 'Batteries';
    case 3: return 'Coolers';
    case 4: return 'Fans';
    case 5: return 'Stabilizers';
    default: return 'Inverters';
  }
}
