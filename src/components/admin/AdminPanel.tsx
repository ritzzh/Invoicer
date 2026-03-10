import React, { useEffect, useState } from 'react';
import { Shield, Users, FileText, TrendingUp, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

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

export const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

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

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
            <p className="text-xs text-zinc-400">Manage users and view platform stats</p>
          </div>
        </div>
        <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Total Users', value: users.length },
          { icon: FileText, label: 'Total Invoices', value: users.reduce((s, u) => s + u.invoiceCount, 0) },
          { icon: TrendingUp, label: 'Admin Users', value: users.filter(u => u.isAdmin).length },
        ].map(({ icon: Icon, label, value }, i) => (
          <div key={i} className={`card p-5 space-y-1 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
            <div className="flex items-center gap-2 text-zinc-400">
              <Icon size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="card hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email / Company</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-center">Invoices</th>
              <th className="px-4 py-3 text-right">Last Invoice</th>
              <th className="px-4 py-3 text-center">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading
              ? <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-400">Loading...</td></tr>
              : users.map(u => (
                <tr key={u.id} className={`hover:bg-zinc-50 transition-colors ${u.isAdmin ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">#{u.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.email}</p>
                    {u.companyName && <p className="text-xs text-zinc-400">{u.companyName}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{u.companyPhone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 font-bold text-sm">{u.invoiceCount}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 text-xs">{u.lastInvoiceDate || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleAdmin(u.id)} disabled={toggling === u.id} className={toggling === u.id ? 'opacity-50' : 'hover:opacity-80'}>
                      {u.isAdmin ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-zinc-300" />}
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {loading && <div className="card p-10 text-center text-zinc-400">Loading...</div>}
        {users.map(u => (
          <div key={u.id} className={`card p-4 ${u.isAdmin ? 'border-amber-200 bg-amber-50/30' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm">{u.email}</p>
                  {u.isAdmin && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Admin</span>}
                </div>
                {u.companyName && <p className="text-xs text-zinc-500 mt-0.5">{u.companyName}</p>}
                <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                  <span><span className="font-bold text-zinc-700">{u.invoiceCount}</span> invoices</span>
                  {u.lastInvoiceDate && <span>Last: {u.lastInvoiceDate}</span>}
                </div>
              </div>
              <button onClick={() => toggleAdmin(u.id)} disabled={toggling === u.id} className="shrink-0">
                {u.isAdmin ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-zinc-300" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
