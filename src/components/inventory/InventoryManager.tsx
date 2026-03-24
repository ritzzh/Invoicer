import React, { useState } from 'react';
import { Trash2, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { ExpiryInput } from '../shared/ExpiryInput';

interface InventoryManagerProps {
  products: Product[];
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: number) => void;
  currency: string;
}

const EMPTY: Product = { name: '', description: '', basePrice: 0, unit: 'pcs', batchNo: '', expiryDate: '', expiryMode: 'full', hsn: '' } as any;

export const InventoryManager = ({ products, onAdd, onUpdate, onDelete, currency }: InventoryManagerProps) => {
  const [form, setForm] = useState<Product>({ ...EMPTY });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSave = () => {
    if (!form.name || form.basePrice <= 0) {
      alert('Please provide product name and base price.');
      return;
    }
    if (editingId) {
      onUpdate({ ...form, id: editingId });
      setEditingId(null);
    } else {
      onAdd(form);
    }
    setForm({ ...EMPTY });
  };

  const startEdit = (p: Product) => {
    setForm(p);
    setEditingId(p.id!);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inventory</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form */}
        <div className="card p-5 sm:p-6 h-fit space-y-4">
          <h3 className="font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Product Name</label>
            <input placeholder="e.g. Paracetamol" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Base Price ({currency})</label>
              <input type="number" placeholder="0.00" className="input" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Unit</label>
              <input placeholder="e.g. Kg, pcs, 4x10" className="input" value={form.unit || ''} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Batch No <span className="normal-case text-zinc-300">(optional)</span></label>
            <input placeholder="e.g. B2024-01" className="input" value={(form as any).batchNo || ''} onChange={e => setForm({ ...form, batchNo: e.target.value } as any)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">HSN Code <span className="normal-case text-zinc-300">(optional)</span></label>
            <input placeholder="e.g. 330490" className="input" value={(form as any).hsn || ''} onChange={e => setForm({ ...form, hsn: e.target.value } as any)} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">
              Expiry Date
              <span className="normal-case font-normal text-zinc-300 ml-1">
                {(form as any).expiryMode === 'monthyear' ? '(Month/Year)' : '(Full Date)'}
              </span>
            </label>
            <ExpiryInput
              value={(form as any).expiryDate || ''}
              mode={(form as any).expiryMode || 'full'}
              onValueChange={v => setForm({ ...form, expiryDate: v } as any)}
              onModeChange={m => setForm({ ...form, expiryMode: m } as any)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn-primary flex-1">
              {editingId ? 'Update Product' : 'Add to Inventory'}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm({ ...EMPTY }); }} className="btn-secondary">Cancel</button>
            )}
          </div>
        </div>

        {/* Product Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop Table */}
          <div className="card overflow-x-auto hidden sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">HSN</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(p.basePrice, currency)}</td>
                    <td className="px-4 py-3 text-zinc-500">{p.unit || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{(p as any).hsn || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500">{(p as any).batchNo || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500">{(p as any).expiryDate || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => startEdit(p)} className="text-zinc-400 hover:text-zinc-900"><ChevronRight size={16} /></button>
                      <button onClick={() => onDelete(p.id!)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-400 text-sm">No products yet. Add your first item!</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {products.length === 0 && (
              <div className="card p-10 text-center text-zinc-400 text-sm">No products yet. Add your first item!</div>
            )}
            {products.map(p => (
              <div key={p.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="font-mono text-sm text-zinc-600 mt-0.5">{formatCurrency(p.basePrice, currency)}</p>
                    {p.unit && <p className="text-xs text-zinc-400 mt-1">Unit: {p.unit}</p>}
                    {(p as any).hsn && <p className="text-xs text-zinc-400">HSN: {(p as any).hsn}</p>}
                    {(p as any).batchNo && <p className="text-xs text-zinc-400">Batch: {(p as any).batchNo}</p>}
                    {(p as any).expiryDate && <p className="text-xs text-zinc-400">Expires: {(p as any).expiryDate}</p>}
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button onClick={() => startEdit(p)} className="text-zinc-400 hover:text-zinc-900 p-1.5"><ChevronRight size={16} /></button>
                    <button onClick={() => onDelete(p.id!)} className="text-zinc-400 hover:text-red-500 p-1.5"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
