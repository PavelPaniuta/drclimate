import { MasterChatMessage } from '@/lib/types';

/** Append message once (API + WebSocket may deliver the same id). */
export function appendChatMessage(
  prev: MasterChatMessage[],
  message: MasterChatMessage | null | undefined,
): MasterChatMessage[] {
  if (!message?.id) return prev;
  return prev.some((m) => m.id === message.id) ? prev : [...prev, message];
}

export function parseMasterChatPayload(
  payload: MasterChatMessage | { masterId?: string; message?: MasterChatMessage },
): MasterChatMessage | null {
  if ('message' in payload && payload.message?.id) return payload.message;
  if ('id' in payload && payload.id) return payload as MasterChatMessage;
  return null;
}
