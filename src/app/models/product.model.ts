import { Category } from './category.model';

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

export let globalCategories: Category[] = [
  { id: 1, name: 'Home Appliances', slug: 'home-appliances', description: 'Fans, water heaters, air coolers, and kitchen appliances' },
  { id: 2, name: 'Inverter Batteries', slug: 'inverter-batteries', description: 'Tubular, flat plate, and solar batteries' },
  { id: 3, name: 'Inverters & UPS', slug: 'inverters-ups', description: 'Home inverters, commercial UPS systems, and power backups' },
  { id: 4, name: 'Solar Solutions', slug: 'solar-solutions', description: 'Solar panels, charge controllers, and hybrid systems' },
  { id: 5, name: 'Spare Parts & Accessories', slug: 'spares-accessories', description: 'Connectors, circuit boards, cables, and battery stands' },
  { id: 6, name: 'Voltage Stabilizers', slug: 'voltage-stabilizers', description: 'Mainline, AC, TV, and refrigerator stabilizers' },
  { id: 7, name: 'Smart Home Automation', slug: 'smart-home-automation', description: 'Define smart automated workflows for appliances' }
];

export function setGlobalCategories(categories: Category[]) {
  if (categories && categories.length > 0) {
    globalCategories = categories;
  }
}

export function getCategoryId(category: string): number {
  if (!category) return 1;
  const normalized = category.toLowerCase().trim();
  const match = globalCategories.find(c => 
    c.name.toLowerCase() === normalized || 
    c.slug.toLowerCase() === normalized ||
    (normalized === 'coolers' && c.id === 1) || 
    (normalized === 'fans' && c.id === 1) || 
    (normalized === 'batteries' && c.id === 2) || 
    (normalized === 'inverters' && c.id === 3) || 
    (normalized === 'stabilizers' && c.id === 6) || 
    (normalized === 'spares' && c.id === 5)
  );
  return match ? match.id : 1;
}

export function getCategoryNameById(id: number | null | undefined): string {
  if (id === null || id === undefined) return 'Home Appliances';
  const match = globalCategories.find(c => c.id === id);
  return match ? match.name : 'Home Appliances';
}
