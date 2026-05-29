import { OrderSettlement } from './settlement';

export type Role = 'CLIENT' | 'MASTER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
  phone?: string;
  address?: string;
  telegram?: string;
  city?: string;
}

export interface UserContact {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  telegram?: string | null;
  city?: string | null;
}

export interface MasterWorkPhoto {
  id: string;
  url: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface MasterPublicProfile {
  avatarUrl?: string | null;
  bio?: string | null;
  workPhotos?: MasterWorkPhoto[];
}

export type OrderParty = UserContact & {
  masterProfile?: MasterPublicProfile | null;
};

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
  client?: OrderParty;
  master?: OrderParty;
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

export interface OrderAuditEntry {
  id: string;
  action: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name?: string; email: string; role: string };
}

export interface MasterListItem {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  telegram?: string;
  city?: string;
  masterProfile?: {
    isOnline: boolean;
    serviceArea: string;
    totalEarnings: string | number;
    avatarUrl?: string | null;
    bio?: string | null;
    workPhotos?: MasterWorkPhoto[];
  };
  masterChatThread?: {
    updatedAt: string;
    messages: Array<{
      id: string;
      content: string;
      createdAt: string;
      sender: { id: string; name?: string; role: string };
    }>;
  };
  _count?: { masterOrders: number };
  unreadCount?: number;
}

export interface MasterChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name?: string; role: string; email?: string };
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
