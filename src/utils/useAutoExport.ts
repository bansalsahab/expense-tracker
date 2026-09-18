import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../types';
import { exportToExcel } from './exportExcel';

/**
 * Watches AppData for changes and automatically re-exports to Excel whenever any
 * field the workbook renders changes (all transaction fields + category names —
 * not just count/amount). Uses a debounce so rapid edits only trigger one export.
 */
export function useAutoExport(data: AppData, enabled: boolean) {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous serialised snapshot to avoid exporting on unrelated re-renders.
  // Serialise every field the export reads so edits to category/date/type/notes/
  // paymentMethod — and any budget or category change — are all detected.
  const prevSnapshotRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    const snapshot = JSON.stringify({
      transactions: data.transactions.map(t =>
        [t.id, t.amount, t.description, t.type, t.categoryId, t.date, t.paymentMethod ?? '', t.notes ?? ''].join('|')
      ),
      // Only category name is rendered in the export (via catMap[id].name), so
      // that's all we track — icon/color/budget edits don't change the workbook.
      categories: data.categories.map(c => [c.id, c.name].join('|')),
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
