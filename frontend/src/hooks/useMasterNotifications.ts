'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getSocket } from '@/lib/socket';
import { getToken } from '@/lib/auth';
import {
  playNewOrderSound,
  requestNotificationPermission,
  showNewOrderNotification,
} from '@/lib/notifications';
import { Order } from '@/lib/types';

type Options = {
  enabled: boolean;
  onNewOrder?: () => void;
};

export function useMasterNotifications({ enabled, onNewOrder }: Options) {
  const t = useTranslations('master');

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    void requestNotificationPermission();

    const socket = getSocket(token);
    const handler = (order: Order) => {
      playNewOrderSound();
      showNewOrderNotification(
        t('newOrderTitle'),
        order?.description?.slice(0, 80) || t('newOrderBody'),
      );
      onNewOrder?.();
    };

    socket.on('new_order', handler);
    return () => {
      socket.off('new_order', handler);
    };
  }, [enabled, onNewOrder, t]);
}
