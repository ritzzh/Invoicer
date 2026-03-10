import React from 'react';
import { Plus, Trash2, ChevronRight, FileText } from 'lucide-react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface InvoiceListProps {
  invoices: Invoice[];
  onNew: () => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  currency: string;
}

export const InvoiceList = ({ invoices, onNew, onView, onDelete, currency }: InvoiceListProps) => {
  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Invoices</h2>
        <button onClick={onNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block card">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <th className="px-6 py-4">Invoice #</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                onClick={() => onView(inv.id!)}
              >
                <td className="px-6 py-4 font-bold text-sm">#{inv.invoiceNumber}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium">{inv.clientName}</div>
                  <div className="text-xs text-zinc-400">{inv.clientEmail}</div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">{inv.date}</td>
                <td className="px-6 py-4 font-mono text-sm font-bold">
                  {formatCurrency(inv.total, currency)}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(inv.id!);
                      }}
                      className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-zinc-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No invoices found. Create your first one!</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {invoices.length === 0 && (
          <div className="card p-12 text-center text-zinc-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No invoices yet. Create your first one!</p>
          </div>
        )}
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="card p-4 cursor-pointer active:bg-zinc-50 transition-colors"
            onClick={() => onView(inv.id!)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-400">#{inv.invoiceNumber}</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                    Paid
                  </span>
                </div>
                <p className="font-bold text-sm truncate">{inv.clientName}</p>
                <p className="text-xs text-zinc-400 truncate">{inv.clientEmail}</p>
                <p className="text-xs text-zinc-400 mt-1">{inv.date}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-3">
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(inv.total, currency)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(inv.id!);
                    }}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-1.5"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={18} className="text-zinc-300" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
