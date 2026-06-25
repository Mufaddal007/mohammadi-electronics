export interface TicketSubmitPayload {
  customer_name: string;
  phone: string;
  appliance_type: string;
  issue_description: string;
}

export interface TicketResponseItem {
  id: number;
  customer_name: string;
  phone: string;
  appliance_type: string;
  issue_description: string;
  status?: string;
  created_at?: string;
}
