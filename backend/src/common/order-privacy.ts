import { OrderStatus } from '@prisma/client';

type OrderWithClient = {
  masterId: string | null;
  status: OrderStatus | string;
  client?: unknown;
};

export function canMasterSeeClientContacts(
  order: Pick<OrderWithClient, 'masterId' | 'status'>,
  masterUserId: string,
): boolean {
  return (
    order.masterId === masterUserId &&
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.CREATED
  );
}

/** Hide client phone/email/telegram until the master has accepted the job. */
export function redactClientContactsForMaster<T extends OrderWithClient>(
  order: T,
  masterUserId: string,
): T {
  if (!order.client || canMasterSeeClientContacts(order, masterUserId)) {
    return order;
  }
  return { ...order, client: null };
}

export function redactOrdersForMaster<T extends OrderWithClient>(
  orders: T[],
  masterUserId: string,
): T[] {
  return orders.map((o) => redactClientContactsForMaster(o, masterUserId));
}
