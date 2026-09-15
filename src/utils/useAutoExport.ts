import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../types';
import { exportToExcel } from './exportExcel';

/**
 * Watches AppData for changes and automatically re-exports to Excel
 * whenever transactions, categories, or budgets change.
 * Uses a debounce so rapid edits only trigger one export.
 */
export function useAutoExport(data: AppData, enabled: boolean) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous serialised snapshot to avoid exporting on unrelated re-renders
  const prevSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const snapshot = JSON.stringify({
      t: data.transactions.length,
      ids: data.transactions.map(t => t.id + t.amount).join(','),
    });

    if (snapshot === prevSnapshotRef.current) return;
    prevSnapshotRef.current = snapshot;

    // Debounce: wait 800ms after the last change before exporting
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus('exporting');
      try {
        await exportToExcel(data);
        setStatus('done');
        // Reset to idle after 2s so the indicator doesn't linger
        setTimeout(() => setStatus('idle'), 2000);
      } catch {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled]);

  return status;
}
