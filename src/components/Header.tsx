import { Menu, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/expenses': 'Transactions',
  '/categories': 'Categories',
  '/budgets': 'Budgets',
  '/reports': 'Reports',
  '/quick-add': 'Quick Add',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const title = PAGE_TITLES[pathname] ?? 'Expense Tracker';

  const initials = user?.user_metadata?.['full_name']
    ? String(user.user_metadata['full_name']).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      {/* Hamburger — desktop sidebar trigger + mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700 p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-base font-semibold text-slate-900 flex-1">{title}</h1>

      {/* User avatar + logout */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <span className="hidden sm:block text-sm text-slate-600 max-w-[120px] truncate">
          {user?.user_metadata?.['full_name'] ?? user?.email ?? ''}
        </span>
        <button
          onClick={signOut}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
