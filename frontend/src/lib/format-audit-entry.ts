import { OrderAuditEntry } from '@/lib/types';
import { isOrderStatus, OrderStatusValue } from '@/lib/order-status';

type StatusTranslator = (status: OrderStatusValue) => string;
type ActionTranslator = (action: string) => string;

export function formatAuditEntrySummary(
  entry: OrderAuditEntry,
  tAction: ActionTranslator,
  tStatus: StatusTranslator,
): string {
  const actionLabel = tAction(entry.action);
  const details = entry.details as Record<string, unknown> | null | undefined;

  if (!details) return actionLabel;

  if (typeof details.from === 'string' && typeof details.to === 'string') {
    const from = isOrderStatus(details.from) ? tStatus(details.from) : details.from;
    const to = isOrderStatus(details.to) ? tStatus(details.to) : details.to;
    return `${actionLabel}: ${from} → ${to}`;
  }

  const changes = details.changes as Record<string, unknown> | undefined;
  if (changes && typeof changes.status === 'string') {
    const st = changes.status as { from?: string; to?: string };
    if (st.from && st.to) {
      const from = isOrderStatus(st.from) ? tStatus(st.from) : st.from;
      const to = isOrderStatus(st.to) ? tStatus(st.to) : st.to;
      return `${actionLabel}: ${from} → ${to}`;
    }
  }

  return actionLabel;
}
