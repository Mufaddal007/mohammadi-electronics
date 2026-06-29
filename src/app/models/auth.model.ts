export interface UserSignUp {
  username: string;
  full_name: string;
  email: string;
  password?: string;
  mobile_number: string;
}

export interface RegisteredUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: 'admin' | 'user';
  created_at: string;
}
