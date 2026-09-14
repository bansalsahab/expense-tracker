import { useState } from 'react';
import { useApp } from '../context';
import type { Category } from '../types';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

const PALETTE = [
  '#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981',
  '#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7',
  '#ec4899','#f43f5e','#64748b','#475569',
];

const ICONS = ['🍔','🚗','🛍️','🎬','💊','💡','🏠','📱','📚','💅','💼','💻','📈','💰','✈️','🎮','🎵','🏋️','🐾','🍷','🎁','🏥','🎓','🔧'];

interface FormState {
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
}

const DEFAULT_FORM: FormState = { name: '', color: '#3b82f6', icon: '💸', type: 'expense' };

export default function Categories() {
  const { data, addCat, updateCat, deleteCat } = useApp();
  const { categories } = data;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const expenseCats = categories.filter(c => c.type === 'expense');
  const incomeCats = categories.filter(c => c.type === 'income');

  function openAdd() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setEditId(cat.id);
    setForm({ name: cat.name, color: cat.color, icon: cat.icon, type: cat.type });
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) {
      updateCat({ id: editId, ...form, name: form.name.trim() });
    } else {
      addCat({ ...form, name: form.name.trim() });
    }
    setShowForm(false);
  }

  function handleDelete(cat: Category) {
    const inUse = data.transactions.some(t => t.categoryId === cat.id);
    if (inUse) {
      alert(`"${cat.name}" is used by existing transactions and cannot be deleted.`);
      return;
    }
    if (window.confirm(`Delete "${cat.name}"?`)) deleteCat(cat.id);
  }

  function renderGroup(title: string, cats: Category[]) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map(cat => (
            <div key={cat.id} className="card flex items-center gap-3 px-4 py-3 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: cat.color + '25' }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-sm truncate">{cat.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-slate-400">{cat.color}</span>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {renderGroup('Expense Categories', expenseCats)}
      {renderGroup('Income Categories', incomeCats)}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-900">{editId ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Type</label>
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {(['expense', 'income'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        form.type === t
                          ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  placeholder="e.g. Groceries"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                  maxLength={40}
                />
              </div>

              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-slate-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full relative transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {form.color === color && (
                        <Check size={14} className="absolute inset-0 m-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: form.color + '25' }}>
                  {form.icon}
                </div>
                <span className="font-medium text-slate-700 text-sm">{form.name || 'Category preview'}</span>
                <div className="w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: form.color }} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  <Check size={15} /> {editId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
