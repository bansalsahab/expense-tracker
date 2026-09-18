import { Database, ExternalLink, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

export default function SetupScreen() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const sql = `-- Expense Tracker schema — paste into Supabase SQL Editor and run

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3b82f6',
  icon        text not null default '💸',
  type        text not null check (type in ('expense','income')),
  created_at  timestamptz not null default now()
);
alter table categories enable row level security;
create policy "Users see own categories"
  on categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  description     text not null,
  category_id     uuid references categories(id) on delete set null,
  date            date not null,
  type            text not null check (type in ('expense','income')),
  payment_method  text check (payment_method is null or payment_method in ('Cash','Card','UPI','Other')),
  notes           text,
  created_at      timestamptz not null default now()
);
alter table transactions enable row level security;
-- If you set up before payment methods existed, add the column:
alter table transactions add column if not exists payment_method text
  check (payment_method is null or payment_method in ('Cash','Card','UPI','Other'));
create policy "Users see own transactions"
  on transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category_id   uuid references categories(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  month         text not null,
  created_at    timestamptz not null default now(),
  unique (user_id, category_id, month)
);
alter table budgets enable row level security;
create policy "Users see own budgets"
  on budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable real-time subscriptions
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table budgets;`;

  const steps = [
    {
      num: 1,
      title: 'Create a free Supabase project',
      desc: 'Go to supabase.com → New project. Choose any region. Free tier is plenty.',
      link: { href: 'https://supabase.com/dashboard', label: 'Open Supabase Dashboard' },
    },
    {
      num: 2,
      title: 'Run the database migration',
      desc: 'In your project → SQL Editor → New query. Paste and run the SQL below.',
      copyKey: 'sql',
      copyValue: sql,
    },
    {
      num: 3,
      title: 'Enable Email auth',
      desc: 'Authentication → Providers → Email → Enable. Optionally enable Google OAuth too.',
    },
    {
      num: 4,
      title: 'Copy your project URL and anon key',
      desc: 'Settings → API → Project URL and anon/public key.',
    },
    {
      num: 5,
      title: 'Add environment variables',
      desc: 'Create a .env file in the project root (copy .env.example), then fill in your values.',
      copyKey: 'env',
      copyValue: 'VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here',
    },
    {
      num: 6,
      title: 'Restart the dev server',
      desc: 'Stop (Ctrl+C) and rerun: npm run dev — the app will load normally.',
      copyKey: 'cmd',
      copyValue: 'npm run dev',
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-start px-4 py-10 pb-safe">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Almost ready! This app needs a Supabase backend to store your data securely in the cloud.
          Follow these steps to get started in ~5 minutes.
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-lg flex flex-col gap-4">
        {steps.map((step) => (
          <div key={step.num} className="card p-4 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {step.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
              {step.link && (
                <a
                  href={step.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {step.link.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {step.copyKey && step.copyValue && (
                <button
                  onClick={() => copy(step.copyValue!, step.copyKey!)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 touch-manipulation"
                >
                  {copied === step.copyKey ? (
                    <><CheckCheck className="w-3 h-3 text-green-600" /><span className="text-green-600">Copied!</span></>
                  ) : (
                    <><Copy className="w-3 h-3" />Copy {step.copyKey === 'sql' ? 'SQL' : step.copyKey === 'env' ? '.env template' : 'command'}</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* For Vercel deploys */}
      <div className="w-full max-w-lg mt-4 card p-4 border-l-4 border-amber-400">
        <p className="text-xs font-semibold text-gray-700 mb-1">Deploying to Vercel?</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Add <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
          <code className="bg-gray-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your Vercel
          project → Settings → Environment Variables, then redeploy.
        </p>
      </div>

      <p className="mt-6 text-xs text-gray-400">Supabase free tier • 500 MB storage • unlimited auth users</p>
    </div>
  );
}
