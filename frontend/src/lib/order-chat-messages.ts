import { Message } from '@/lib/types';

export function appendOrderMessage(
  prev: Message[],
  message: Message | null | undefined,
): Message[] {
  if (!message?.id) return prev;
  return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
}
