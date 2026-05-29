'use client';

import { AdminCreateOrderForm } from '@/components/admin/AdminCreateOrderForm';
import { useRequireAuth } from '@/hooks/useAuthRedirect';

export default function AdminCreateOrderPage() {
  useRequireAuth('ADMIN');
  return <AdminCreateOrderForm />;
}
