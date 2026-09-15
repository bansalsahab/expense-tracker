import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isChrome = /CriOS/i.test(ua);
  const isFirefox = /FxiOS/i.test(ua);
  return isIos && !isChrome && !isFirefox;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('install-banner-dismissed');
    if (!dismissed && isIosSafari() && !isStandalone()) {
      // Small delay so the app renders first
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 max-w-lg mx-auto">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          $
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Install Expense Tracker</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Tap <Share size={12} className="inline mx-0.5" /> then{' '}
            <strong>"Add to Home Screen"</strong> for the full app experience.
          </p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            sessionStorage.setItem('install-banner-dismissed', '1');
          }}
          className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
