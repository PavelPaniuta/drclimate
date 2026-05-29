import { Order } from './types';

export interface MasterWorkboard {
  profile: MasterProfileExtended;
  stats: {
    incoming: number;
    active: number;
    completed: number;
    today: number;
    todayLimit: number;
    todayRemaining: number;
    todayEarnings: number;
    totalEarnings: string;
  };
  todayCapacity: { allowed: boolean; count: number; limit: number; remaining: number };
  weekDays: WeekDay[];
  orders: {
    incoming: Order[];
    today: Order[];
    active: Order[];
    completed: Order[];
    cancelled: Order[];
    all: Order[];
  };
}

export interface MasterProfileExtended {
  id: string;
  skills: string[];
  serviceArea: string;
  isOnline: boolean;
  bio?: string;
  maxJobsPerDay: number;
  workDayStart: number;
  workDayEnd: number;
  totalEarnings: string;
  user: { id: string; name?: string; email: string; phone?: string; city?: string };
}

export interface WeekDay {
  date: string;
  count: number;
  limit: number;
  isToday: boolean;
  orders: { id: string; status: string; serviceType: string }[];
}

export type MasterTab = 'today' | 'incoming' | 'active' | 'completed' | 'all';
