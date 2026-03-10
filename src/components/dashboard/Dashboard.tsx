import React, { useMemo } from 'react';
import { FileText, TrendingUp, DollarSign } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { formatCurrency } from '../../lib/utils';
import { Invoice, Settings } from '../../types';

interface DashboardProps {
  invoices: Invoice[];
  settings: Settings;
}

export const Dashboard = ({ invoices, settings }: DashboardProps) => {
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

    const thisMonth = invoices.filter((inv) => {
      const date = parseISO(inv.date);
      return isWithinInterval(date, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      });
    });
    const monthlyRevenue = thisMonth.reduce((sum, inv) => sum + inv.total, 0);

    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const chartData = last6Months.map((month) => {
      const monthStr = format(month, 'MMM');
      const monthInvoices = invoices.filter((inv) => {
        const date = parseISO(inv.date);
        return isWithinInterval(date, {
          start: startOfMonth(month),
          end: endOfMonth(month),
        });
      });
      return {
        name: monthStr,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      };
    });

    return { totalRevenue, monthlyRevenue, chartData, invoiceCount: invoices.length };
  }, [invoices]);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-zinc-500 font-medium">{format(new Date(), 'MMMM yyyy')}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card p-5 sm:p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Monthly Revenue
            </p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">
              {formatCurrency(stats.monthlyRevenue, settings.currency)}
            </h3>
          </div>
        </div>

        <div className="card p-5 sm:p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Total Invoices
            </p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">{stats.invoiceCount}</h3>
          </div>
        </div>

        <div className="card p-5 sm:p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Total Revenue
            </p>
            <h3 className="text-xl sm:text-2xl font-bold mt-1">
              {formatCurrency(stats.totalRevenue, settings.currency)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-bold mb-6">Revenue Overview</h3>
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => [
                    formatCurrency(value, settings.currency),
                    'Revenue',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-bold mb-6">Recent Activity</h3>
          <div className="space-y-3 sm:space-y-4">
            {invoices.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{inv.clientName}</p>
                    <p className="text-[10px] text-zinc-400">Invoice #{inv.invoiceNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {formatCurrency(inv.total, settings.currency)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Paid
                  </p>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-10 text-zinc-400 text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
