import { MasterWorkPhoto, Role } from '@/lib/types';

export interface AdminUserListItem {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  telegram?: string | null;
  city?: string | null;
  isBanned: boolean;
  createdAt: string;
  masterProfile?: {
    isOnline: boolean;
    serviceArea: string;
    totalEarnings: string | number;
    avatarUrl?: string | null;
  } | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  updatedAt: string;
  masterProfile?: {
    id: string;
    skills: string[];
    serviceArea: string;
    isOnline: boolean;
    bio?: string | null;
    avatarUrl?: string | null;
    maxJobsPerDay: number;
    workDayStart: number;
    workDayEnd: number;
    totalEarnings: string | number;
    workPhotos: MasterWorkPhoto[];
  } | null;
  _count?: { clientOrders: number; masterOrders: number };
}

export type AdminUserUpdatePayload = {
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  telegram?: string;
  city?: string;
  isBanned?: boolean;
  masterProfile?: {
    serviceArea?: string;
    bio?: string;
    skills?: string[];
    isOnline?: boolean;
    maxJobsPerDay?: number;
    workDayStart?: number;
    workDayEnd?: number;
  };
};
