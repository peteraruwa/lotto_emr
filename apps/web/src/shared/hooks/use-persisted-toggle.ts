/**
 * usePersistedToggle
 *
 * A boolean toggle whose value is persisted in localStorage under `storageKey`.
 * - On first visit the value equals `defaultValue`.
 * - Subsequent visits (including navigating away and back) restore the last
 *   value the user set.
 * - SSR-safe: localStorage is only accessed inside the lazy initialiser which
 *   runs on the client only.
 */

'use client';

import { useState } from 'react';

export function usePersistedToggle(storageKey: string, defaultValue: boolean) {
  const [value, setValue] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored === 'true' : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  function toggle() {
    setValue((prev) => {
      const next = !prev;
      try { localStorage.setItem(storageKey, String(next)); } catch { /* quota / private mode */ }
      return next;
    });
  }

  return [value, toggle] as const;
}
