'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getSocket } from '@/lib/socket';
import { getToken } from '@/lib/auth';
import { requestNotificationPermission, showNewOrderNotification } from '@/lib/notifications';
import { Order } from '@/lib/types';

type Options = {
  enabled: boolean;
};

/** Desktop notifications only — sound is handled in useMasterIncomingNew. */
export function useMasterNotifications({ enabled }: Options) {
  const t = useTranslations('master');

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    void requestNotificationPermission();

    const socket = getSocket(token);
    const handler = (order: Order) => {
      showNewOrderNotification(
        t('newOrderTitle'),
        order?.description?.slice(0, 80) || t('newOrderBody'),
      );
    };

    socket.on('new_order', handler);
    return () => {
      socket.off('new_order', handler);
    };
  }, [enabled, t]);
}
