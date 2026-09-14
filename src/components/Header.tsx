import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/expenses': 'Transactions',
  '/categories': 'Categories',
  '/budgets': 'Budgets',
  '/reports': 'Reports',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Expense Tracker';

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700 p-1 -ml-1"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-lg font-semibold text-slate-900 flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
