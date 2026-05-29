import { mediaUrl } from '@/lib/media';

export type ContactPerson = {
  id?: string;
  name?: string | null;
  email?: string;
  phone?: string | null;
  address?: string | null;
  telegram?: string | null;
  city?: string | null;
  masterProfile?: {
    avatarUrl?: string | null;
    bio?: string | null;
    workPhotos?: { id: string; url: string; caption?: string | null }[];
  } | null;
};

export function telegramLink(handle?: string | null): string | null {
  if (!handle?.trim()) return null;
  const h = handle.trim().replace(/^@/, '');
  return `https://t.me/${h}`;
}

export function formatTelegramDisplay(handle?: string | null): string | null {
  if (!handle?.trim()) return null;
  const h = handle.trim();
  return h.startsWith('@') ? h : `@${h}`;
}

export function masterAvatarUrl(person?: ContactPerson | null): string | null {
  return mediaUrl(person?.masterProfile?.avatarUrl);
}
