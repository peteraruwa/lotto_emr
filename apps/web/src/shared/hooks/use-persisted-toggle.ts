/**
 * usePersistedToggle
 *
 * Boolean toggle persisted in sessionStorage (not localStorage).
 *
 * sessionStorage is scoped to the browser tab and is wiped when the tab
 * closes or the user logs out and opens a fresh tab.  This gives us:
 *   - All panels collapsed on every new login / fresh tab  ✓
 *   - Panel state remembered while navigating within the same session  ✓
 *   - SSR-safe: storage is only accessed inside the lazy state initialiser
 *     which runs on the client only  ✓
 */

'use client';

import { useState } from 'react';

export function usePersistedToggle(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function toggle() {
    setValue((prev) => {
      const next = !prev;
      try { sessionStorage.setItem(storageKey, String(next)); } catch { /* private mode / quota */ }
      return next;
    });
  }

  return [value, toggle] as const;
}
