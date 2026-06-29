export interface OrderPlacementRequest {
  customer_name: string;
  phone: string;
  email: string;
  shipping_address: string;
  product_id: number;
  quantity: number;
  total_price: number;
}

export interface AdminOrderItem {
  order_id: number;
  customer_name: string;
  phone: string;
  email: string;
  shipping_address: string;
  quantity: number;
  total_price: number;
  order_status: string;
  created_at: string;
  product_name: string;
  image_url: string;
}
