/** Browser notifications + sound for new orders (master). */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

/** ~1.4s ascending alert — easy to hear on site. */
export function playNewOrderSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const pattern: { freq: number; at: number; duration: number; volume: number }[] = [
    { freq: 523.25, at: 0, duration: 0.28, volume: 0.22 },
    { freq: 659.25, at: 0.32, duration: 0.28, volume: 0.24 },
    { freq: 783.99, at: 0.64, duration: 0.32, volume: 0.26 },
    { freq: 1046.5, at: 1.0, duration: 0.55, volume: 0.28 },
  ];

  for (const { freq, at, duration, volume } of pattern) {
    const start = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showNewOrderNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  try {
    new Notification(title, { body, tag: 'drclimate-new-order' });
  } catch {
    // ignore
  }
}
