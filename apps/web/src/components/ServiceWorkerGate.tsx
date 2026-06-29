import { useEffect } from 'react';

const ENABLED = (import.meta.env.VITE_SW_CACHE ?? 'false') === 'true';

export function ServiceWorkerGate() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (!ENABLED) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister().catch(() => {});
      }).catch(() => {});
      if (location.reload.length === 0) {
        // noop to avoid linter warning
      }
      return;
    }
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }, []);
  return null;
}
