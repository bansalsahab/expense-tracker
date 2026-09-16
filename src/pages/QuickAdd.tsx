import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { Transaction, Category } from '../types';

const todayStr = () => new Date().toISOString().slice(0, 10);

type Screen = 'form' | 'saving' | 'success' | 'error';

// Light haptic tap via vibration API (works on Android; silent no-op on iOS PWA)
function haptic(pattern: number | number[] = 8) {
  try { navigator.vibrate?.(pattern); } catch { /* ignored */ }
}

// ── Category chip ─────────────────────────────────────────────────────────────
function CatChip({ cat, selected, onSelect }: {
  cat: Category; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => { haptic(); onSelect(); }}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-medium
        transition-all duration-150 touch-manipulation select-none
        ${selected
          ? 'text-white shadow-sm scale-[0.97]'
          : 'bg-white/60 text-slate-700 border border-slate-200'
        }`}
      style={selected ? { backgroundColor: cat.color } : {}}
    >
      <span>{cat.icon}</span>
      <span className="whitespace-nowrap">{cat.name}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuickAdd() {
  const { data, addTx } = useApp();
  const navigate = useNavigate();

  const [txType, setTxType]         = useState<'expense' | 'income'>('expense');
  const [amount, setAmount]         = useState('');
  const [description, setDesc]      = useState('');
  const [categoryId, setCatId]      = useState('');
  const [date, setDate]             = useState(todayStr());
  const [screen, setScreen]         = useState<Screen>('form');
  const [errMsg, setErrMsg]         = useState('');
  const [sheetVisible, setSheetVis] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const filtered = data.categories.filter(c => c.type === txType);
  const effectiveCatId = filtered.find(c => c.id === categoryId)?.id ?? filtered[0]?.id ?? '';

  // Slide-in animation on mount
  useEffect(() => {
    const t = setTimeout(() => setSheetVis(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-focus amount input after sheet animates in
  useEffect(() => {
    if (sheetVisible) {
      const t = setTimeout(() => amountRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [sheetVisible]);

  function switchType(t: 'expense' | 'income') {
    haptic();
    setTxType(t);
    const first = data.categories.find(c => c.type === t);
    if (first) setCatId(first.id);
  }

  function dismiss() {
    setSheetVis(false);
    setTimeout(() => navigate('/'), 300);
  }

  async function handleSave() {
    const num = parseFloat(amount);
    if (!num || num <= 0) { amountRef.current?.focus(); return; }
    if (!description.trim()) return;
    if (!effectiveCatId) return;

    haptic(12);
    setScreen('saving');

    const payload: Omit<Transaction, 'id'> = {
      type: txType,
      amount: Math.round(num * 100) / 100,
      description: description.trim(),
      categoryId: effectiveCatId,
      date,
    };

    try {
      await addTx(payload);
      haptic([10, 50, 10]); // double-tap success haptic
      setScreen('success');
      setTimeout(dismiss, 1200);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : 'Failed to save');
      setScreen('error');
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
        <div className="flex flex-col items-center gap-3 animate-[quickZoomIn_0.3s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-white text-xl font-semibold">Saved!</p>
          <p className="text-white/60 text-sm">
            ${parseFloat(amount).toFixed(2)} • {data.categories.find(c => c.id === effectiveCatId)?.name}
          </p>
        </div>
      </div>
    );
  }

  const isExpense = txType === 'expense';
  const accentColor = isExpense ? '#ef4444' : '#10b981';
  const canSave = parseFloat(amount) > 0 && description.trim().length > 0 && effectiveCatId;

  // ── Sheet ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{
        background: sheetVisible ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
        backdropFilter: sheetVisible ? 'blur(4px)' : 'none',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
      onClick={dismiss}
    >
      {/* Sheet panel */}
      <div
        className="w-full rounded-t-[28px] overflow-hidden flex flex-col"
        style={{
          background: '#f2f2f7', // iOS system grouped background
          transform: sheetVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          maxHeight: '92dvh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-black/20" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 pt-1">
            <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              Quick Add
            </h2>
            <button
              onClick={dismiss}
              className="w-8 h-8 rounded-full flex items-center justify-center touch-manipulation"
              style={{ background: 'rgba(0,0,0,0.08)' }}
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Type toggle — iOS segmented style */}
          <div
            className="flex rounded-[10px] p-0.5 mb-5 flex-shrink-0"
            style={{ background: 'rgba(0,0,0,0.08)' }}
          >
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className="flex-1 py-2 rounded-[8px] text-sm font-semibold transition-all duration-200 touch-manipulation"
                style={txType === t ? {
                  background: t === 'expense' ? '#ef4444' : '#10b981',
                  color: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                } : { color: '#555' }}
              >
                {t === 'expense' ? '💸  Expense' : '💰  Income'}
              </button>
            ))}
          </div>

          {/* Amount — large iOS-style input */}
          <div
            className="rounded-2xl mb-3 overflow-hidden"
            style={{ background: '#fff' }}
          >
            <div className="px-4 pt-3 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Amount</p>
              <div className="flex items-center">
                <span className="text-3xl font-light text-gray-400 mr-1">$</span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="flex-1 text-3xl font-semibold bg-transparent outline-none border-none"
                  style={{
                    color: accentColor,
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    caretColor: accentColor,
                    fontSize: '28px', // explicit to avoid iOS zoom
                  }}
                />
              </div>
            </div>
            <div className="h-px mx-4" style={{ background: '#e5e5ea' }} />
            {/* Description */}
            <div className="px-4 pt-3 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Note</p>
              <input
                type="text"
                placeholder="What was it for?"
                value={description}
                onChange={e => setDesc(e.target.value)}
                maxLength={100}
                className="w-full bg-transparent outline-none border-none text-base text-gray-900"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">Category</p>
            <div className="flex flex-wrap gap-2">
              {filtered.map(c => (
                <CatChip
                  key={c.id}
                  cat={c}
                  selected={effectiveCatId === c.id}
                  onSelect={() => setCatId(c.id)}
                />
              ))}
            </div>
          </div>

          {/* Date — compact */}
          <div
            className="rounded-2xl px-4 py-3 mb-4"
            style={{ background: '#fff' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Date</p>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="text-sm font-medium text-gray-700 bg-transparent outline-none border-none text-right"
                style={{ fontSize: '15px' }}
              />
            </div>
          </div>

          {/* Error */}
          {screen === 'error' && (
            <p className="text-sm text-red-500 text-center mb-3">{errMsg}</p>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || screen === 'saving'}
            className="w-full rounded-2xl font-semibold text-white text-base touch-manipulation transition-opacity"
            style={{
              background: canSave ? accentColor : '#c7c7cc',
              height: '54px',
              fontSize: '17px',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            {screen === 'saving' ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              `Add ${isExpense ? 'Expense' : 'Income'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
