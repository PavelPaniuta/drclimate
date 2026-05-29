import { ServiceRequest } from '@prisma/client';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getOrderWorkDate(order: Pick<ServiceRequest, 'scheduledAt' | 'preferredTime' | 'updatedAt'>): Date {
  if (order.scheduledAt) return order.scheduledAt;
  if (order.preferredTime) return order.preferredTime;
  return order.updatedAt;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function defaultScheduleTime(date: Date, workDayStart: number): Date {
  const d = startOfDay(date);
  d.setHours(workDayStart, 0, 0, 0);
  return d;
}
