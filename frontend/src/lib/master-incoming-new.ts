const STORAGE_PREFIX = 'drclimate_master_ack_incoming_';
const MAX_STORED_IDS = 400;

export function loadAcknowledgedIncoming(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveAcknowledgedIncoming(userId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  const arr = Array.from(ids).slice(-MAX_STORED_IDS);
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(arr));
}

export function sortIncomingOrders<T extends { id: string; createdAt: string }>(
  orders: T[],
  isNew: (id: string) => boolean,
): T[] {
  return [...orders].sort((a, b) => {
    const aNew = isNew(a.id) ? 1 : 0;
    const bNew = isNew(b.id) ? 1 : 0;
    if (bNew !== aNew) return bNew - aNew;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
