/** All order statuses (API values). */
export const ORDER_STATUSES = [
  'CREATED',
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** Statuses shown in admin filters (excludes rare CREATED if desired — include all). */
export const ORDER_STATUS_FILTER_LIST: OrderStatusValue[] = [...ORDER_STATUSES];

/** Default sort / group order on admin dashboard. */
export const ORDER_STATUS_SORT_ORDER: OrderStatusValue[] = [
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'CREATED',
];

export function isOrderStatus(value: string): value is OrderStatusValue {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
