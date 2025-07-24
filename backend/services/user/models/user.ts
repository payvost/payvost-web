export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  role: 'user' | 'admin';
  kycStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
