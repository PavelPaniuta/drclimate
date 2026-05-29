import { getStoredUser } from '@/lib/auth';

/** True if the message was sent by the current logged-in user. */
export function isOwnChatMessage(senderId: string | undefined): boolean {
  if (!senderId) return false;
  const user = getStoredUser();
  return Boolean(user?.id && user.id === senderId);
}
