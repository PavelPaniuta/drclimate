'use client';

import { useEffect } from 'react';

/** Registers service worker for installable PWA (master dashboard). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW optional
    });
  }, []);

  return null;
}
