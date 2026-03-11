import React from 'react';
import { FileText, TrendingUp, DollarSign, Package, Award, TrendingDown, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { format, parse } from 'date-fns';
import { formatCurrency } from '../../lib/utils';
import { Settings } from '../../types';
import { DashboardStats } from '../../hooks/useApp';

interface DashboardProps {
  stats: DashboardStats | null;
  settings: Settings;
}

// Fill in months that have no invoices so the chart always shows 6 bars
function buildChartData(raw: { month: string; revenue: number; count: number }[]) {
  const result: { label: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const found = raw.find(r => r.month === key);
    result.push({
      label: format(d, 'MMM yy'),
      revenue: found?.revenue ?? 0,
      count:   found?.count   ?? 0,
    });
  }
  return result;
}

const PALETTE = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export const Dashboard = ({ stats, settings }: DashboardProps) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { summary, recentInvoices, productSales, inventoryStatus } = stats;
  const chartData = buildChartData(stats.monthlyChart);

  // top 5 / bottom 5 from inventoryStatus (already sorted by soldQty DESC from server)
  const topSellers    = inventoryStatus.slice(0, 5);
  const bottomSellers = [...inventoryStatus].sort((a, b) => a.soldQty - b.soldQty).slice(0, 5);
  const maxQty        = topSellers[0]?.soldQty || 1;

  return (
    <div className="p-4 sm:p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <span className="text-sm text-zinc-400 font-medium">{format(new Date(), 'MMMM yyyy')}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue',    value: formatCurrency(summary.totalRevenue,   settings.currency), icon: DollarSign,  bg: 'bg-zinc-900',    fg: 'text-white' },
          { label: 'Monthly Revenue',  value: formatCurrency(summary.monthlyRevenue, settings.currency), icon: TrendingUp,  bg: 'bg-emerald-500', fg: 'text-white' },
          { label: 'Total Invoices',   value: String(summary.totalInvoices),                             icon: FileText,    bg: 'bg-blue-500',    fg: 'text-white' },
          { label: 'This Month',       value: String(summary.monthlyInvoices) + ' invoices',             icon: BarChart2,   bg: 'bg-violet-500',  fg: 'text-white' },
        ].map(({ label, value, icon: Icon, bg, fg }) => (
          <div key={label} className="card p-5 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} ${fg}`}>
              <Icon size={17} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black mt-0.5 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Recent invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        <div className="card p-5 lg:col-span-3">
          <h3 className="text-sm font-bold mb-5">Revenue — Last 6 Months</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}
                  formatter={(v: number, _, p) => [
                    `${formatCurrency(v, settings.currency)}  (${p.payload.count} inv.)`,
                    'Revenue',
                  ]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-bold mb-4">Recent Invoices</h3>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-zinc-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{inv.clientName || '—'}</p>
                      <p className="text-[10px] text-zinc-400">#{inv.invoiceNumber} · {inv.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black ml-2 shrink-0">{formatCurrency(inv.total, settings.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory Insights ───────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Package size={17} className="text-zinc-400" />
          <h3 className="text-base font-bold">Inventory Insights</h3>
        </div>

        {inventoryStatus.length === 0 ? (
          <div className="card p-6 flex items-center gap-4 border-dashed border-2 border-zinc-100">
            <Package size={28} className="text-zinc-300 shrink-0" />
            <div>
              <p className="font-bold text-zinc-600">No inventory products yet</p>
              <p className="text-xs text-zinc-400 mt-0.5">Add products in Inventory, then link them when creating invoices to see usage stats here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Full inventory table */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <BarChart2 size={15} className="text-zinc-400" />
                <h4 className="text-sm font-bold">All Products — Sales Summary</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50">
                      <th className="text-left px-5 py-3">Product</th>
                      <th className="text-center px-4 py-3">Unit</th>
                      <th className="text-right px-4 py-3">Qty Sold</th>
                      <th className="text-right px-4 py-3">Revenue</th>
                      <th className="text-right px-4 py-3">Invoices</th>
                      <th className="text-right px-5 py-3">Base Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {inventoryStatus.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                            />
                            <span className="font-medium text-zinc-800">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-400 text-xs">{row.unit || '—'}</td>
                        <td className="px-4 py-3 text-right font-black text-zinc-900">{row.soldQty}</td>
                        <td className="px-4 py-3 text-right font-bold text-zinc-700">{formatCurrency(row.soldRevenue, settings.currency)}</td>
                        <td className="px-4 py-3 text-right text-zinc-400">{row.invoiceCount}</td>
                        <td className="px-5 py-3 text-right text-zinc-400">{formatCurrency(row.basePrice, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top / Bottom side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Top Sellers */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={15} className="text-emerald-500" />
                  <h4 className="text-sm font-bold">Top Sellers</h4>
                </div>
                <div className="space-y-3">
                  {topSellers.map((p, i) => {
                    const pct = Math.round((p.soldQty / maxQty) * 100);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-zinc-300 w-4 shrink-0">#{i + 1}</span>
                            <span className="text-xs font-bold text-zinc-800 truncate">{p.name}</span>
                          </div>
                          <div className="shrink-0 ml-3 text-right">
                            <span className="text-xs font-black text-zinc-900">{p.soldQty} {p.unit || 'units'}</span>
                            <span className="text-[10px] text-zinc-400 ml-1">· {formatCurrency(p.soldRevenue, settings.currency)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slow Movers */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={15} className="text-amber-500" />
                  <h4 className="text-sm font-bold">Slow Movers</h4>
                </div>
                <div className="space-y-3">
                  {bottomSellers.map((p, i) => {
                    const pct = Math.max(3, Math.round((p.soldQty / maxQty) * 100));
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black text-zinc-300 w-4 shrink-0">#{i + 1}</span>
                            <span className="text-xs font-bold text-zinc-800 truncate">{p.name}</span>
                          </div>
                          <div className="shrink-0 ml-3 text-right">
                            <span className="text-xs font-black text-zinc-900">{p.soldQty} {p.unit || 'units'}</span>
                            <span className="text-[10px] text-zinc-400 ml-1">· {formatCurrency(p.soldRevenue, settings.currency)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-100 rounded-full h-1.5">
                          <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bar chart — all products */}
            {inventoryStatus.length >= 2 && (
              <div className="card p-5">
                <h4 className="text-sm font-bold mb-5">Units Sold per Product</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inventoryStatus.map(r => ({ name: r.name, qty: r.soldQty, rev: r.soldRevenue, unit: r.unit }))}
                      margin={{ top: 4, right: 8, left: 0, bottom: inventoryStatus.length > 5 ? 48 : 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                      <XAxis
                        dataKey="name"
                        axisLine={false} tickLine={false}
                        tick={{ fontSize: 10, fill: '#a1a1aa' }}
                        interval={0}
                        angle={inventoryStatus.length > 5 ? -35 : 0}
                        textAnchor={inventoryStatus.length > 5 ? 'end' : 'middle'}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}
                        formatter={(v: number, _, p) => [
                          `${v} ${p.payload.unit || 'units'}  ·  ${formatCurrency(p.payload.rev, settings.currency)}`,
                          'Sold',
                        ]}
                      />
                      <Bar dataKey="qty" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {inventoryStatus.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
