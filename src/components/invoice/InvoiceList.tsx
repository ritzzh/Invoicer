import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, FileText, Mail, Send } from 'lucide-react';
import { Invoice } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface InvoiceListProps {
  invoices: Invoice[];
  onNew: () => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  currency: string;
  settings?: any;
}

export const InvoiceList = ({ invoices, onNew, onView, onDelete, currency, settings }: InvoiceListProps) => {
  const [sendingAll, setSendingAll] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEmail, setBulkEmail] = useState('');

  const handleSendAllInvoices = async () => {
    if (!bulkEmail.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }
    setSendingAll(true);
    try {
      const invoiceSummary = invoices.map(inv =>
        `  • #${inv.invoiceNumber} — ${inv.clientName} — ${formatCurrency(inv.total, currency)} (${inv.date})`
      ).join('\n');
      const subject = `All Invoices Summary — ${settings?.companyName || 'Invoicer'}`;
      const body = `Hi,\n\nPlease find below a summary of all ${invoices.length} invoice(s):\n\n${invoiceSummary}\n\nThank you,\n${settings?.companyName || 'Invoicer'}`;
      const res = await fetch('/api/send-bulk-invoice-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: bulkEmail,
          subject,
          body,
          invoicesData: invoices,
          settingsData: settings,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Email sent to ${bulkEmail} with ${invoices.length} PDF(s) attached ✓`);
        setShowBulkModal(false);
        setBulkEmail('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Failed to send email. Check your app password in Settings.');
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">Invoices</h2>
        <div className="flex items-center gap-2 shrink-0">
          {invoices.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm"
              title="Send all invoices summary via email"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send All</span>
            </button>
          )}
          <button onClick={onNew} className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Send All Invoices</h3>
            <p className="text-sm text-zinc-500 mb-4">Send a summary of all {invoices.length} invoices to a recipient.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Recipient Email</label>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="recipient@email.com"
                  value={bulkEmail}
                  onChange={e => setBulkEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendAllInvoices()}
                  autoFocus
                />
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-500 max-h-40 overflow-y-auto">
                <p className="font-semibold text-zinc-700 mb-1">{invoices.length} Invoices</p>
                {invoices.slice(0, 6).map(inv => (
                  <p key={inv.id} className="truncate">• #{inv.invoiceNumber} — <span style={{ fontSize: inv.clientName.length > 20 ? '10px' : undefined }}>{inv.clientName}</span> — {formatCurrency(inv.total, currency)}</p>
                ))}
                {invoices.length > 6 && <p className="text-zinc-400 mt-1">…and {invoices.length - 6} more</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowBulkModal(false); setBulkEmail(''); }} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={handleSendAllInvoices} disabled={sendingAll} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Mail size={15} />
                  {sendingAll ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block card overflow-x-auto">
        <table className="w-full text-left min-w-[480px]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <th className="px-3 md:px-6 py-4">Invoice #</th>
              <th className="px-3 md:px-6 py-4">Client</th>
              <th className="px-3 md:px-6 py-4 hidden md:table-cell">Date</th>
              <th className="px-3 md:px-6 py-4">Total</th>
              <th className="px-3 md:px-6 py-4 hidden lg:table-cell">Status</th>
              <th className="px-3 md:px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer" onClick={() => onView(inv.id!)}>
                <td className="px-3 md:px-6 py-3 md:py-4 font-bold text-xs md:text-sm">
                  <span className="truncate block max-w-[70px] md:max-w-none">#{inv.invoiceNumber}</span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 max-w-[110px] md:max-w-[180px] lg:max-w-[240px]">
                  <div
                    className="font-medium truncate"
                    style={{ fontSize: inv.clientName.length > 20 ? 'clamp(9px, 1.5vw, 12px)' : 'clamp(11px, 1.5vw, 14px)' }}
                  >{inv.clientName}</div>
                  <div className="text-[10px] text-zinc-400 truncate hidden md:block">{inv.clientEmail}</div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-xs text-zinc-500 hidden md:table-cell whitespace-nowrap">{inv.date}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs md:text-sm font-bold whitespace-nowrap">{formatCurrency(inv.total, currency)}</td>
                <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Paid</span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(inv.id!); }} className="text-zinc-300 hover:text-red-500 transition-colors p-1"><Trash2 size={13} /></button>
                    <button className="text-zinc-400 group-hover:text-zinc-900 transition-colors"><ChevronRight size={17} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-20 text-center text-zinc-400"><FileText size={48} className="mx-auto mb-4 opacity-20" /><p>No invoices found. Create your first one!</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">
        {invoices.length === 0 && (
          <div className="card p-10 text-center text-zinc-400"><FileText size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">No invoices yet. Create your first one!</p></div>
        )}
        {invoices.map((inv) => (
          <div key={inv.id} className="card p-3 cursor-pointer active:bg-zinc-50 transition-colors" onClick={() => onView(inv.id!)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-zinc-400">#{inv.invoiceNumber}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase">Paid</span>
                </div>
                <p
                  className="font-bold leading-snug"
                  style={{ fontSize: inv.clientName.length > 24 ? 'clamp(9px, 3vw, 12px)' : 'clamp(11px, 3.5vw, 14px)', wordBreak: 'break-word' }}
                >{inv.clientName}</p>
                {inv.clientEmail && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{inv.clientEmail}</p>}
                <p className="text-[10px] text-zinc-400 mt-0.5">{inv.date}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
                <span className="font-mono font-bold text-sm whitespace-nowrap">{formatCurrency(inv.total, currency)}</span>
                <div className="flex items-center gap-0">
                  <button onClick={(e) => { e.stopPropagation(); onDelete(inv.id!); }} className="text-zinc-300 hover:text-red-500 transition-colors p-1.5"><Trash2 size={12} /></button>
                  <ChevronRight size={15} className="text-zinc-300" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
