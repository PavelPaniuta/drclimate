import { OrderSettlement } from './settlement';

export type Role = 'CLIENT' | 'MASTER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  city?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Order {
  id: string;
  serviceType: string;
  description: string;
  address: string;
  city: string;
  preferredTime?: string;
  scheduledAt?: string;
  masterNotes?: string | null;
  status: string;
  price?: number;
  createdAt: string;
  updatedAt?: string;
  client?: { id: string; name?: string; email: string; phone?: string };
  master?: { id: string; name?: string; email: string; phone?: string };
  comments?: OrderComment[];
  settlement?: OrderSettlement;
}

export interface OrderComment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name?: string; role: string };
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name?: string; role: string };
}

export interface MasterProfile {
  id: string;
  skills: string[];
  serviceArea: string;
  isOnline: boolean;
  bio?: string;
  totalEarnings: string;
  user: { id: string; name?: string; email: string; phone?: string; city?: string };
}
