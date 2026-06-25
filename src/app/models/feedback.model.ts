export interface FeedbackSubmitPayload {
  name: string;
  email: string;
  message: string;
}

export interface FeedbackResponseItem {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}
