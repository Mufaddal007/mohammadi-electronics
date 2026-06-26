export interface UserSignUp {
  username: string;
  password?: string;
}

export interface RegisteredUser {
  id: number;
  username: string;
  role: 'admin' | 'user';
}
