export interface ApiKey {
  _id: string;
  name: string;
  key?: string;
  expiresAt: number;
  createdAt: number;
  userId: string;
  role: 'admin' | 'user' | 'read-only';
  userIsActive: boolean;
  active: boolean;
}
