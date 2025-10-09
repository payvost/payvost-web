export interface User {
  id: string;
  email: string;
  username?: string;
  passwordHash: string;
  name?: string;
  role: 'user' | 'admin';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
