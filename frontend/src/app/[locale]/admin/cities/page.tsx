'use client';

import { AdminCitiesManager } from '@/components/admin/AdminCitiesManager';
import { useRequireAuth } from '@/hooks/useAuthRedirect';

export default function AdminCitiesPage() {
  useRequireAuth('ADMIN');
  return <AdminCitiesManager />;
}
