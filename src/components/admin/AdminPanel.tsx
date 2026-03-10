import React, { useEffect, useState } from 'react';
import { Shield, Users, FileText, TrendingUp, RefreshCw, ToggleLeft, ToggleRight, ChevronRight, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface AdminUser {
  id: number;
  email: string;
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  isAdmin: number;
  invoiceCount: number;
  totalRevenue: number;
  lastInvoiceDate: string | null;
}

interface AdminInvoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  date: string;
  total: number;
  template: string;
  companyName: string;
  userEmail: string;
  currency?: string;
}

interface AdminInvoiceDetail extends AdminInvoice {
  clientAddress: string;
  clientPhone: string;
  clientLabel: string;
  doctorName: string;
  doctorLabel: string;
  dlNumbers: string[];
  dueDate: string;
  discountPercentage: number;
  roundOff: number;
  balanceDue: number;
  themeColor: string;
  terms: string;
  showSignatory: number;
  items: any[];
  companyAddress: string;
  companyPhone: string;
  userCompanyEmail: string;
  logoUrl: string;
}

type Tab = 'users' | 'invoices';

export const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [allInvoices, setAllInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<AdminInvoiceDetail | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices', { credentials: 'include' });
      if (res.ok) setAllInvoices(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchData = () => {
    fetchUsers();
    fetchAllInvoices();
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAdmin = async (userId: number) => {
    if (!confirm('Toggle admin status for this user?')) return;
    setToggling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, { method: 'PATCH', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: data.isAdmin ? 1 : 0 } : u));
      }
    } finally { setToggling(null); }
  };

  const openInvoice = async (id: number) => {
    setInvoiceLoading(true);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, { credentials: 'include' });
      if (res.ok) setViewingInvoice(await res.json());
    } catch (e) { console.error(e); } finally { setInvoiceLoading(false); }
  };

  const filteredInvoices = allInvoices.filter(inv => {
    const q = searchQuery.toLowerCase();
    return !q || inv.clientName.toLowerCase().includes(q) || inv.invoiceNumber.toLowerCase().includes(q) || (inv.companyName || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Admin Panel</h2>
            <p className="text-xs text-zinc-400 hidden sm:block">Manage users and view platform data</p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 text-xs sm:text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { icon: Users, label: 'Total Users', value: users.length },
          { icon: FileText, label: 'Total Invoices', value: allInvoices.length },
          { icon: TrendingUp, label: 'Admin Users', value: users.filter(u => u.isAdmin).length },
        ].map(({ icon: Icon, label, value }, i) => (
          <div key={i} className={`card p-4 sm:p-5 space-y-1 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="flex items-center gap-2 text-zinc-400">
              <Icon size={14} />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {(['users', 'invoices'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {tab === 'users' ? `Users (${users.length})` : `All Invoices (${allInvoices.length})`}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          {/* Desktop Table */}
          <div className="card hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[550px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Email / Company</th>
                  <th className="px-4 py-3 hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-center">Invoices</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Last Invoice</th>
                  <th className="px-4 py-3 text-center">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Loading...</td></tr>
                  : users.map(u => (
                    <tr key={u.id} className={`hover:bg-zinc-50 transition-colors ${u.isAdmin ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 font-mono text-zinc-400 text-xs">#{u.id}</td>
                      <td className="px-4 py-3 max-w-[160px] md:max-w-none">
                        <p className="font-medium text-sm truncate" style={{ fontSize: u.email.length > 30 ? '11px' : undefined }}>{u.email}</p>
                        {u.companyName && <p className="text-xs text-zinc-400 truncate">{u.companyName}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{u.companyPhone || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 font-bold text-sm">{u.invoiceCount}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 text-xs hidden lg:table-cell">{u.lastInvoiceDate || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleAdmin(u.id)} disabled={toggling === u.id} className={toggling === u.id ? 'opacity-50' : 'hover:opacity-80'}>
                          {u.isAdmin ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-zinc-300" />}
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Mobile User Cards */}
          <div className="sm:hidden space-y-2.5">
            {loading && <div className="card p-10 text-center text-zinc-400">Loading...</div>}
            {users.map(u => (
              <div key={u.id} className={`card p-3.5 ${u.isAdmin ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate" style={{ fontSize: u.email.length > 28 ? '11px' : undefined }}>{u.email}</p>
                      {u.isAdmin && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Admin</span>}
                    </div>
                    {u.companyName && <p className="text-xs text-zinc-500 mt-0.5 truncate">{u.companyName}</p>}
                    <div className="flex gap-4 mt-1.5 text-xs text-zinc-400">
                      <span><span className="font-bold text-zinc-700">{u.invoiceCount}</span> invoices</span>
                      {u.lastInvoiceDate && <span>Last: {u.lastInvoiceDate}</span>}
                    </div>
                  </div>
                  <button onClick={() => toggleAdmin(u.id)} disabled={toggling === u.id} className="shrink-0">
                    {u.isAdmin ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-zinc-300" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* All Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1 text-sm"
              placeholder="Search by client, invoice #, or company…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Desktop Table */}
          <div className="card hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 hidden md:table-cell">Company</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading
                  ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Loading...</td></tr>
                  : filteredInvoices.length === 0
                    ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">{searchQuery ? 'No matching invoices.' : 'No invoices found.'}</td></tr>
                    : filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer" onClick={() => openInvoice(inv.id)}>
                      <td className="px-4 py-3 font-bold text-xs md:text-sm">#{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 max-w-[130px] md:max-w-[200px]">
                        <p className="font-medium truncate" style={{ fontSize: inv.clientName.length > 20 ? '11px' : undefined }}>{inv.clientName}</p>
                        {inv.clientEmail && <p className="text-[10px] text-zinc-400 truncate">{inv.clientEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 hidden md:table-cell truncate max-w-[120px]">{inv.companyName || inv.userEmail}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{inv.date}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-xs md:text-sm">{formatCurrency(inv.total, 'INR')}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-zinc-400 group-hover:text-zinc-900 transition-colors"><ChevronRight size={17} /></button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Mobile Invoice Cards */}
          <div className="sm:hidden space-y-2">
            {loading && <div className="card p-10 text-center text-zinc-400">Loading...</div>}
            {!loading && filteredInvoices.length === 0 && (
              <div className="card p-8 text-center text-zinc-400 text-sm">{searchQuery ? 'No matching invoices.' : 'No invoices found.'}</div>
            )}
            {filteredInvoices.map(inv => (
              <div key={inv.id} className="card p-3 cursor-pointer active:bg-zinc-50 transition-colors" onClick={() => openInvoice(inv.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400">#{inv.invoiceNumber}</span>
                    <p className="font-bold text-sm leading-snug mt-0.5" style={{ fontSize: inv.clientName.length > 22 ? '11px' : undefined, wordBreak: 'break-word' }}>{inv.clientName}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{inv.companyName || inv.userEmail}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{inv.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <span className="font-mono font-bold text-sm">{formatCurrency(inv.total, 'INR')}</span>
                    <ChevronRight size={15} className="text-zinc-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Invoice View Modal */}
      {(viewingInvoice || invoiceLoading) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100">
              <div>
                <h3 className="font-bold text-base">
                  {invoiceLoading ? 'Loading…' : `Invoice #${viewingInvoice?.invoiceNumber}`}
                </h3>
                {viewingInvoice && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    By: {viewingInvoice.companyName || viewingInvoice.userEmail}
                  </p>
                )}
              </div>
              <button onClick={() => setViewingInvoice(null)} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {invoiceLoading && <div className="p-12 text-center text-zinc-400">Loading invoice details…</div>}

            {viewingInvoice && !invoiceLoading && (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Client Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">{viewingInvoice.clientLabel || 'Client'}</p>
                    <p className="font-bold" style={{ fontSize: viewingInvoice.clientName.length > 25 ? '12px' : '14px', wordBreak: 'break-word' }}>{viewingInvoice.clientName}</p>
                    {viewingInvoice.clientEmail && <p className="text-xs text-zinc-500 truncate">{viewingInvoice.clientEmail}</p>}
                    {viewingInvoice.clientPhone && <p className="text-xs text-zinc-500">{viewingInvoice.clientPhone}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Invoice Date</p>
                    <p className="font-semibold text-sm">{viewingInvoice.date}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2 mb-0.5">Template</p>
                    <p className="text-xs capitalize text-zinc-600">{viewingInvoice.template}</p>
                  </div>
                </div>

                {/* Items */}
                {viewingInvoice.items?.length > 0 && (
                  <div className="border border-zinc-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100">
                          <th className="px-3 py-2 text-left font-bold text-zinc-500 uppercase">Description</th>
                          <th className="px-3 py-2 text-center font-bold text-zinc-500 uppercase hidden sm:table-cell">Qty</th>
                          <th className="px-3 py-2 text-right font-bold text-zinc-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {viewingInvoice.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-zinc-700">{item.description}</td>
                            <td className="px-3 py-1.5 text-center text-zinc-500 hidden sm:table-cell">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">{formatCurrency(item.total, 'INR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="space-y-1 text-sm w-48">
                    {viewingInvoice.discountPercentage > 0 && (
                      <div className="flex justify-between text-zinc-500">
                        <span>Discount</span><span>{viewingInvoice.discountPercentage}%</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-zinc-100 pt-2 mt-2">
                      <span>Total</span>
                      <span className="font-mono">{formatCurrency(viewingInvoice.total, 'INR')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1 border-t border-zinc-100">
                  <p className="text-[10px] text-zinc-400">View-only mode — this invoice belongs to {viewingInvoice.companyName || viewingInvoice.userEmail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
