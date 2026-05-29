import { getStoredUser } from '@/lib/auth';
import { Order } from '@/lib/types';

export function canMasterSeeClientContacts(order: Order): boolean {
  const user = getStoredUser();
  if (!user || user.role !== 'MASTER') return true;
  return (
    order.masterId === user.id &&
    order.status !== 'PENDING' &&
    order.status !== 'CREATED'
  );
}

export function applyMasterOrderPrivacy(order: Order): Order {
  if (canMasterSeeClientContacts(order)) return order;
  return { ...order, client: undefined };
}
