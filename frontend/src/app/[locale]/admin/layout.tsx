import { AdminChatUnreadProvider } from '@/contexts/AdminChatUnreadContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminChatUnreadProvider>{children}</AdminChatUnreadProvider>;
}
