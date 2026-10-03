import { useEffect } from 'react';

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const combo = mod ? `mod+${key}` : key;

      const isException = mod || key === 'escape';
      if (isTypingTarget(e.target) && !isException) return;

      const fn = map[combo] ?? map[key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [map]);
}
