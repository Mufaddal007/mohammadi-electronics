export interface DemandSubmitPayload {
  customer_name: string;
  contact_info: string;
  requested_item_name: string;
  specifications: string;
}

export interface DemandResponseItem {
  id: number;
  customer_name: string;
  contact_info: string;
  requested_item_name: string;
  specifications: string;
  status?: string;
  created_at?: string;
}
