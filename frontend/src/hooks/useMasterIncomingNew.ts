'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStoredUser, getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import {
  loadAcknowledgedIncoming,
  saveAcknowledgedIncoming,
  sortIncomingOrders,
} from '@/lib/master-incoming-new';
import { Order } from '@/lib/types';
import { playNewOrderSound } from '@/lib/notifications';

export function useMasterIncomingNew(incomingOrders: Order[], onReload?: () => void) {
  const userId = getStoredUser()?.id ?? '';
  const [acknowledged, setAcknowledged] = useState<Set<string>>(() =>
    userId ? loadAcknowledgedIncoming(userId) : new Set(),
  );
  const [pulseIds, setPulseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    setAcknowledged(loadAcknowledgedIncoming(userId));
  }, [userId]);

  const persistAck = useCallback(
    (next: Set<string>) => {
      setAcknowledged(next);
      if (userId) saveAcknowledgedIncoming(userId, next);
    },
    [userId],
  );

  const isNew = useCallback(
    (orderId: string) => incomingOrders.some((o) => o.id === orderId) && !acknowledged.has(orderId),
    [incomingOrders, acknowledged],
  );

  const newCount = useMemo(
    () => incomingOrders.filter((o) => isNew(o.id)).length,
    [incomingOrders, isNew],
  );

  const markSeen = useCallback(
    (orderId: string) => {
      if (!orderId) return;
      persistAck(new Set(acknowledged).add(orderId));
      setPulseIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    },
    [acknowledged, persistAck],
  );

  const markAllIncomingSeen = useCallback(() => {
    const next = new Set(acknowledged);
    for (const o of incomingOrders) {
      next.add(o.id);
    }
    persistAck(next);
    setPulseIds(new Set());
  }, [incomingOrders, acknowledged, persistAck]);

  const registerNewOrder = useCallback(
    (orderId: string) => {
      if (!orderId) return;
      setPulseIds((prev) => new Set(prev).add(orderId));
      const next = new Set(acknowledged);
      next.delete(orderId);
      persistAck(next);
    },
    [acknowledged, persistAck],
  );

  const onReloadRef = useRef(onReload);
  onReloadRef.current = onReload;

  useEffect(() => {
    const token = getToken();
    if (!token || !userId) return;

    const socket = getSocket(token);
    const onNewOrder = (order: Order) => {
      if (!order?.id) return;
      playNewOrderSound();
      registerNewOrder(order.id);
      onReloadRef.current?.();
    };

    socket.on('new_order', onNewOrder);
    return () => {
      socket.off('new_order', onNewOrder);
    };
  }, [userId, registerNewOrder]);

  const sortedIncoming = useMemo(
    () => sortIncomingOrders(incomingOrders, (id) => isNew(id) || pulseIds.has(id)),
    [incomingOrders, isNew, pulseIds],
  );

  const isHighlighted = useCallback(
    (orderId: string) => isNew(orderId) || pulseIds.has(orderId),
    [isNew, pulseIds],
  );

  return {
    newCount,
    sortedIncoming,
    isNew: isHighlighted,
    markSeen,
    markAllIncomingSeen,
  };
}
