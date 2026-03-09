import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Save, Printer, Package, Settings as SettingsIcon, FileText, ChevronRight, X, LayoutDashboard, LogOut, TrendingUp, DollarSign, Users, ArrowUpRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn, formatCurrency, numberToWords } from './lib/utils';
import { Invoice, InvoiceItem, Product, Settings } from './types';

// --- Components ---

const AuthScreen = ({ onAuthSuccess }: { onAuthSuccess: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { email, password } : { email, password, companyName };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || 'Authentication failed');
      }
      
      const data = await res.json();
      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">I</div>
          <h1 className="text-2xl font-bold tracking-tight">Invoicer</h1>
          <p className="text-zinc-500 text-sm mt-1">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-400 uppercase">Company Name</label>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <button type="submit" className="btn-primary w-full py-3 mt-4">
            {isLogin ? 'Sign In' : 'Get Started'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-zinc-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-zinc-900 font-bold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ invoices, settings }: { invoices: Invoice[], settings: Settings }) => {
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const thisMonth = invoices.filter(inv => {
      const date = parseISO(inv.date);
      return isWithinInterval(date, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
    });
    const monthlyRevenue = thisMonth.reduce((sum, inv) => sum + inv.total, 0);
    
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    const chartData = last6Months.map(month => {
      const monthStr = format(month, 'MMM');
      const monthInvoices = invoices.filter(inv => {
        const date = parseISO(inv.date);
        return isWithinInterval(date, { start: startOfMonth(month), end: endOfMonth(month) });
      });
      return {
        name: monthStr,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
      };
    });

    return { totalRevenue, monthlyRevenue, chartData, invoiceCount: invoices.length };
  }, [invoices]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="text-sm text-zinc-500 font-medium">
          {format(new Date(), 'MMMM yyyy')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Monthly Revenue</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue, settings.currency)}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Invoices</p>
            <h3 className="text-2xl font-bold mt-1">{stats.invoiceCount}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-between">
          <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div className="mt-4">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Revenue</p>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue, settings.currency)}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-bold mb-6">Revenue Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a1a1aa' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value: number) => [formatCurrency(value, settings.currency), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {invoices.slice(0, 5).map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-xl transition-colors">
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
                  <p className="text-sm font-bold">{formatCurrency(inv.total, settings.currency)}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Paid</p>
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

const Sidebar = ({ activeTab, setActiveTab, onLogout }: { activeTab: string, setActiveTab: (tab: string) => void, onLogout: () => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-white border-r border-zinc-200 h-screen sticky top-0 flex flex-col p-6 no-print">
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">I</div>
        <h1 className="text-xl font-bold tracking-tight">Invoicer</h1>
      </div>
      
      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id 
                ? "bg-zinc-900 text-white" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-zinc-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const InvoiceEditor = ({ 
  settings, 
  inventory, 
  onSave,
  onUpdateProductPrice,
  initialInvoice
}: { 
  settings: Settings, 
  inventory: Product[], 
  onSave: (invoice: Invoice) => void,
  onUpdateProductPrice: (id: number, price: number) => void,
  initialInvoice?: Invoice
}) => {
  const [invoice, setInvoice] = useState<Invoice>(initialInvoice || {
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientLabel: 'Patient',
    doctorName: '',
    dlNumbers: ['', '', ''],
    date: format(new Date(), 'yyyy-MM-dd'),
    discountPercentage: 0,
    roundOff: 0,
    total: 0,
    balanceDue: 0,
    items: [{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs', total: 0 }],
    template: 'modern',
    themeColor: '#000000',
    terms: '1. This is an electronically generated document.\n2. All disputes are subject to seller city jurisdiction.',
    showSignatory: true
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (invoice.discountPercentage / 100);
    const actualTotal = subtotal - discountAmount;
    const roundedTotal = Math.round(actualTotal);
    const roundOff = roundedTotal - actualTotal;
    
    setInvoice(prev => ({ 
      ...prev, 
      total: roundedTotal, 
      roundOff: Number(roundOff.toFixed(2)),
      balanceDue: Number(actualTotal.toFixed(2))
    }));
  }, [invoice.items, invoice.discountPercentage]);

  const addItem = () => {
    if (invoice.items.length >= 20) {
      alert('Maximum 20 items allowed per invoice to ensure single-page layout.');
      return;
    }
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoice.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = Number((item.quantity * item.unitPrice).toFixed(2));
    }
    
    newItems[index] = item;
    setInvoice(prev => ({ ...prev, items: newItems }));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = inventory.find(p => p.id === productId);
    if (product) {
      const newItems = [...invoice.items];
      newItems[index] = {
        ...newItems[index],
        description: product.name,
        unitPrice: product.basePrice,
        unit: product.unit || 'pcs',
        productId: product.id,
        batchNo: product.batchNo || '',
        expiryDate: product.expiryDate || '',
        total: Number((newItems[index].quantity * product.basePrice).toFixed(2))
      };
      setInvoice(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleSendEmail = () => {
    const subject = `Invoice ${invoice.invoiceNumber} from ${settings.companyName}`;
    const body = `Hi ${invoice.clientName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total, settings.currency)}.\n\nThank you,\n${settings.companyName}`;
    window.location.href = `mailto:${invoice.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8">
      {/* Editor Form */}
      <div className="flex-1 space-y-8 no-print">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Create Invoice</h2>
          <div className="flex gap-2">
            <button onClick={() => onSave(invoice)} className="btn-primary flex items-center gap-2">
              <Save size={18} /> Save
            </button>
            <button onClick={handleSendEmail} className="btn-secondary flex items-center gap-2">
              <Mail size={18} /> Email
            </button>
            <button onClick={() => handlePrint()} className="btn-secondary flex items-center gap-2">
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Invoice Number</label>
              <input 
                className="input" 
                value={invoice.invoiceNumber} 
                onChange={e => setInvoice({...invoice, invoiceNumber: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Template</label>
              <select 
                className="input" 
                value={invoice.template}
                onChange={e => setInvoice({...invoice, template: e.target.value as any})}
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="medical">Medical (Grid)</option>
              </select>
            </div>
          </div>

          {/* Date + DL Numbers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Invoice Date</label>
              <input 
                type="date"
                className="input" 
                value={invoice.date} 
                onChange={e => setInvoice({...invoice, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">DL Numbers <span className="normal-case text-zinc-300">(up to 3, optional)</span></label>
              {[0, 1, 2].map(i => (
                <input
                  key={i}
                  placeholder={`DL No. ${i + 1}`}
                  className="input mb-1"
                  value={(invoice.dlNumbers || ['', '', ''])[i] || ''}
                  onChange={e => {
                    const updated = [...(invoice.dlNumbers || ['', '', ''])];
                    updated[i] = e.target.value;
                    setInvoice({...invoice, dlNumbers: updated});
                  }}
                />
              ))}
            </div>
          </div>

          {/* Theme + Discount */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Theme Color</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" 
                  value={invoice.themeColor || '#000000'}
                  onChange={e => setInvoice({...invoice, themeColor: e.target.value})}
                />
                <input 
                  className="input text-xs font-mono uppercase" 
                  value={invoice.themeColor || '#000000'}
                  onChange={e => setInvoice({...invoice, themeColor: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Discount (%)</label>
              <input 
                type="number"
                className="input" 
                value={invoice.discountPercentage} 
                onChange={e => setInvoice({...invoice, discountPercentage: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          {/* Terms + Signatory */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Terms & Conditions (One per line)</label>
              <textarea 
                className="input h-24" 
                value={invoice.terms} 
                onChange={e => setInvoice({...invoice, terms: e.target.value})}
                placeholder="Enter terms and conditions..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="showSignatory"
                checked={invoice.showSignatory} 
                onChange={e => setInvoice({...invoice, showSignatory: e.target.checked})}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              />
              <label htmlFor="showSignatory" className="text-xs font-semibold text-zinc-500 uppercase cursor-pointer">Show Authorized Signatory Line</label>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold border-b border-zinc-100 pb-2">Client Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Label (e.g. Patient)</label>
                <input 
                  placeholder="e.g. Patient" 
                  className="input py-1 text-xs" 
                  value={invoice.clientLabel}
                  onChange={e => setInvoice({...invoice, clientLabel: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Name</label>
                <input 
                  placeholder="Client Name" 
                  className="input" 
                  value={invoice.clientName}
                  onChange={e => setInvoice({...invoice, clientName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Email</label>
                <input 
                  placeholder="Client Email" 
                  className="input" 
                  value={invoice.clientEmail}
                  onChange={e => setInvoice({...invoice, clientEmail: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone Number</label>
                <input 
                  placeholder="Client Phone" 
                  className="input" 
                  value={invoice.clientPhone}
                  onChange={e => setInvoice({...invoice, clientPhone: e.target.value})}
                />
              </div>
            </div>
            {/* Doctor Name - Optional */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Doctor Name <span className="normal-case text-zinc-300">(optional)</span></label>
              <input 
                placeholder="Dr. Name (leave blank to hide)" 
                className="input" 
                value={invoice.doctorName || ''}
                onChange={e => setInvoice({...invoice, doctorName: e.target.value})}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Line Items</h3>
              <button onClick={addItem} className="text-zinc-900 hover:text-zinc-600 flex items-center gap-1 text-xs font-bold">
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="border border-zinc-100 rounded-xl p-3 space-y-2 bg-zinc-50/50">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <select 
                          className="input text-xs w-48"
                          onChange={(e) => handleProductSelect(idx, parseInt(e.target.value))}
                          value={item.productId || ''}
                        >
                          <option value="">Select Product</option>
                          {inventory.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input 
                          placeholder="Description" 
                          className="input flex-1" 
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="w-20">
                      <input 
                        type="number" 
                        placeholder="Qty" 
                        className="input" 
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-28">
                      <input 
                        type="number" 
                        placeholder="Price" 
                        className="input" 
                        value={item.unitPrice}
                        onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-28 pt-2 text-right font-mono text-sm">
                      {formatCurrency(item.total, settings.currency)}
                    </div>
                    <div className="flex flex-col gap-1 pt-1">
                      <button onClick={() => removeItem(idx)} className="text-zinc-400 hover:text-red-500 p-1">
                        <Trash2 size={16} />
                      </button>
                      {item.productId && inventory.find(p => p.id === item.productId)?.basePrice !== item.unitPrice && (
                        <button 
                          title="Update inventory price permanently"
                          onClick={() => onUpdateProductPrice(item.productId!, item.unitPrice)} 
                          className="text-emerald-500 hover:text-emerald-700 p-1"
                        >
                          <Save size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Batch + Expiry inline */}
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Batch No</label>
                      <input 
                        placeholder="Batch No" 
                        className="input py-1 text-xs" 
                        value={item.batchNo || ''}
                        onChange={e => updateItem(idx, 'batchNo', e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Expiry Date</label>
                      <input 
                        type="date"
                        className="input py-1 text-xs" 
                        value={item.expiryDate || ''}
                        onChange={e => updateItem(idx, 'expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-6 border-t border-zinc-100 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-500">Discount %</label>
                <input 
                  type="number" 
                  className="input w-20 py-1 text-right" 
                  value={invoice.discountPercentage}
                  onChange={e => setInvoice({...invoice, discountPercentage: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-500">Round Off</label>
                <span className="font-mono text-sm">{invoice.roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-500">Balance Due</label>
                <span className="font-mono text-sm">{invoice.balanceDue?.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total, settings.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden lg:block w-[500px] sticky top-8 h-fit no-print">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Live Preview</h2>
        <div className="bg-white shadow-2xl rounded-sm overflow-hidden scale-[0.6] origin-top-left w-[800px]">
           <InvoiceTemplate invoice={invoice} settings={settings} />
        </div>
      </div>

      {/* Hidden Print Container */}
      <div className="hidden">
        <div ref={printRef} className="print-container">
          <InvoiceTemplate invoice={invoice} settings={settings} />
        </div>
      </div>
    </div>
  );
};

// ---- INVOICE TITLE + DL NUMBERS HEADER ----
const InvoiceTitle = ({ themeColor }: { themeColor: string }) => (
  <div className="text-center my-3">
    <div className="inline-block px-8 py-1 border-2 font-black text-sm tracking-[0.3em] uppercase" style={{ borderColor: themeColor, color: themeColor }}>
      INVOICE
    </div>
  </div>
);

const DLNumbers = ({ dlNumbers }: { dlNumbers?: string[] }) => {
  const filled = (dlNumbers || []).filter(d => d && d.trim());
  if (!filled.length) return null;
  return (
    <div className="text-right">
      {filled.map((dl, i) => (
        <p key={i} className="text-[9px] text-zinc-400 font-medium leading-tight">DL: {dl}</p>
      ))}
    </div>
  );
};

const InvoiceTemplate = ({ invoice, settings }: { invoice: Invoice, settings: Settings }) => {
  const { template, themeColor = '#000000' } = invoice;

  if (template === 'medical') {
    const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
    const discountAmount = subtotal * (invoice.discountPercentage / 100);
    
    return (
      <div className="px-6 py-6 bg-white min-h-[1000px] font-sans text-xs border border-zinc-300 flex flex-col">

        {/* Header */}
        <div className="text-center space-y-1 mb-2">
          <div className="flex justify-end mb-1">
            <DLNumbers dlNumbers={invoice.dlNumbers} />
          </div>
          <h1 className="text-3xl font-black uppercase" style={{ color: themeColor, letterSpacing: "0.15em" }}>
            {settings.companyName}
          </h1>
          <p className="font-bold text-zinc-600">{settings.companyAddress}</p>
          <div className="flex justify-center gap-4 text-zinc-500">
            <p>✆ {settings.companyPhone}</p>
            <p>✉ {settings.companyEmail}</p>
          </div>
        </div>

        {/* INVOICE Title */}
        <InvoiceTitle themeColor={themeColor} />

        {/* Invoice Info Bar */}
        <div className="flex justify-between items-center border-y border-zinc-200 py-2 mb-4">
          <div className="flex gap-2">
            <span className="font-bold text-zinc-500 uppercase tracking-wider">Invoice No:</span>
            <span className="font-black">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-zinc-500 uppercase tracking-wider">Date:</span>
            <span className="font-black">{invoice.date}</span>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-black">
              <span className="text-zinc-500 font-bold">{invoice.clientLabel}: </span>
              <span className="uppercase">{invoice.clientName}</span>
            </p>
            {invoice.doctorName && (
              <p className="text-sm font-black text-zinc-700">
                <span className="font-bold text-zinc-500">Doctor: </span>
                <span className="uppercase">{invoice.doctorName}</span>
              </p>
            )}
          </div>
          {invoice.clientEmail && <p className="text-zinc-500 mt-1">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-zinc-500">✆ {invoice.clientPhone}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse border border-zinc-400 mb-3">
          <thead>
            <tr className="border-b border-zinc-400">
              <th className="border-r border-zinc-400 py-[3px] px-1 w-8 text-center">Sr.</th>
              <th className="border-r border-zinc-400 py-[3px] px-1 text-left">Product Name</th>
              <th className="border-r border-zinc-400 py-[3px] px-1 w-20 text-center">Batch No</th>
              <th className="border-r border-zinc-400 py-[3px] px-1 w-20 text-center">Expiry</th>
              <th className="border-r border-zinc-400 py-[3px] px-1 w-12 text-center">Qty</th>
              <th className="border-r border-zinc-400 py-[3px] px-1 w-20 text-right">MRP</th>
              <th className="py-[3px] px-1 w-24 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-zinc-200">
                <td className="border-r border-zinc-400 py-[3px] px-1 text-center">{i + 1}</td>
                <td className="border-r border-zinc-400 py-[3px] px-1">{item.description}</td>
                <td className="border-r border-zinc-400 py-[3px] px-1 text-center text-[10px]">{item.batchNo || '-'}</td>
                <td className="border-r border-zinc-400 py-[3px] px-1 text-center text-[10px]">{item.expiryDate || '-'}</td>
                <td className="border-r border-zinc-400 py-[3px] px-1 text-center">{item.quantity}</td>
                <td className="border-r border-zinc-400 py-[3px] px-1 text-right">{item.unitPrice.toFixed(2)}</td>
                <td className="py-[3px] px-1 text-right font-bold">{item.total.toFixed(2)}</td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-zinc-100">
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="border-r border-zinc-400 py-[3px] px-1"></td>
                <td className="py-[3px] px-1"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f8fafc] font-bold border-t border-zinc-400">
              <td colSpan={3} className="border-r border-zinc-400 py-[3px] px-1 text-right">Total</td>
              <td className="border-r border-zinc-400 py-[3px] px-1 text-center">
                {invoice.items.reduce((s, i) => s + i.quantity, 0)}
              </td>
              <td className="border-r border-zinc-400 py-[3px] px-1"></td>
              <td className="py-[3px] px-1 text-right">{subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Summary */}
        <div className="grid grid-cols-12 border border-zinc-400">
          <div className="col-span-7 px-3 py-2 border-r border-zinc-400">
            <p className="font-bold uppercase text-[10px] text-zinc-500">Total Invoice Amount in Words</p>
            <p className="font-black text-sm italic">{numberToWords(invoice.total)}</p>
          </div>
          <div className="col-span-5 divide-y divide-zinc-200">
            <div className="flex justify-between px-3 py-1">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Subtotal</span>
              <span className="font-bold">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-3 py-1">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Discount ({invoice.discountPercentage}%)</span>
              <span className="font-bold text-red-500">-{discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-3 py-1">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Round Off</span>
              <span className="font-bold">{invoice.roundOff.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-3 py-1 font-black text-base" style={{ backgroundColor: `${themeColor}10`, color: themeColor }}>
              <span>Total</span>
              <span>{invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-3 py-1">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Balance Due</span>
              <span className="font-bold text-zinc-900">{invoice.balanceDue?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="font-bold underline text-zinc-900 mb-2">Terms and Conditions</p>
            <ul className="list-disc list-inside text-[10px] space-y-1 text-zinc-600">
              {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
          {invoice.showSignatory && (
            <div className="flex justify-end items-end">
              <div className="w-64 text-center">
                <div className="border-t border-zinc-900 pt-2">
                  <p className="font-bold uppercase text-[10px] tracking-widest">Authorised Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (template === 'classic') {
    const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
    const discountAmount = subtotal * (invoice.discountPercentage / 100);

    return (
      <div className="p-12 bg-white min-h-[1000px] font-serif border border-zinc-200 flex flex-col">
        {/* Header */}
        <div>
          <div className="flex justify-end mb-1">
            <DLNumbers dlNumbers={invoice.dlNumbers} />
          </div>
          <div className="text-center border-b-2 pb-4 mb-2" style={{ borderColor: themeColor }}>
            <h1 className="text-4xl font-black uppercase" style={{ color: themeColor, letterSpacing: "0.12em" }}>{settings.companyName}</h1>
            <p className="mt-2 text-sm text-zinc-600">{settings.companyAddress}</p>
            <div className="flex justify-center gap-6 mt-2 text-xs text-zinc-500">
              <span>✆ {settings.companyPhone}</span>
              <span>✉ {settings.companyEmail}</span>
              {settings.companyWebsite && <span>🌐 {settings.companyWebsite}</span>}
            </div>
          </div>
        </div>

        {/* INVOICE Title */}
        <InvoiceTitle themeColor={themeColor} />

        {/* Invoice Info Bar */}
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Invoice Number</p>
            <p className="text-xl font-black">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Invoice Date</p>
            <p className="text-xl font-black">{invoice.date}</p>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xs font-bold uppercase border-b pb-1 mb-3 text-zinc-400" style={{ borderColor: `${themeColor}30` }}>Client</h3>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-bold text-base">
              <span className="text-zinc-500">{invoice.clientLabel}: </span>
              <span className="uppercase">{invoice.clientName}</span>
            </p>
            {invoice.doctorName && (
              <p className="font-bold text-base text-zinc-700">
                <span className="text-zinc-500">Doctor: </span>
                <span className="uppercase">{invoice.doctorName}</span>
              </p>
            )}
          </div>
          {invoice.clientEmail && <p className="text-sm text-zinc-500 mt-1">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-sm text-zinc-500">✆ {invoice.clientPhone}</p>}
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2" style={{ borderColor: themeColor }}>
              <th className="p-3 text-left uppercase text-xs tracking-widest">Description</th>
              <th className="p-3 text-center uppercase text-xs tracking-widest">Batch</th>
              <th className="p-3 text-center uppercase text-xs tracking-widest">Expiry</th>
              <th className="p-3 text-right uppercase text-xs tracking-widest">Qty</th>
              <th className="p-3 text-right uppercase text-xs tracking-widest">MRP</th>
              <th className="p-3 text-right uppercase text-xs tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="p-3 text-sm">{item.description}</td>
                <td className="p-3 text-center text-xs text-zinc-500">{item.batchNo || '-'}</td>
                <td className="p-3 text-center text-xs text-zinc-500">{item.expiryDate || '-'}</td>
                <td className="p-3 text-right text-sm">{item.quantity}</td>
                <td className="p-3 text-right text-sm">{formatCurrency(item.unitPrice, settings.currency)}</td>
                <td className="p-3 text-right text-sm font-bold">{formatCurrency(item.total, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-10 grid grid-cols-12 gap-8">
          <div className="col-span-7">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Amount in Words</p>
                <p className="font-bold italic text-sm">{numberToWords(invoice.total)}</p>
              </div>
            </div>
          </div>
          <div className="col-span-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Discount ({invoice.discountPercentage}%)</span>
              <span>-{formatCurrency(discountAmount, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Round Off</span>
              <span>{formatCurrency(invoice.roundOff, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t-2 pt-4" style={{ borderColor: themeColor, color: themeColor }}>
              <span>Total</span>
              <span>{formatCurrency(invoice.total, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-zinc-900 pt-2">
              <span>Balance Due</span>
              <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold underline text-zinc-900 mb-2">Terms and Conditions</p>
            <ul className="list-disc list-inside text-[10px] space-y-1 text-zinc-600">
              {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
          {invoice.showSignatory && (
            <div className="flex justify-end items-end">
              <div className="w-64 text-center">
                <div className="border-t border-zinc-900 pt-2">
                  <p className="font-bold uppercase text-[10px] tracking-widest">Authorised Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
    const discountAmount = subtotal * (invoice.discountPercentage / 100);

    return (
      <div className="p-16 bg-white min-h-[1000px] font-sans border border-zinc-100 flex flex-col">
        {/* Header */}
        <div>
          <div className="flex justify-end mb-1">
            <DLNumbers dlNumbers={invoice.dlNumbers} />
          </div>
          <div className="text-center mb-4">
            <h1 className="text-4xl font-black uppercase" style={{ color: themeColor, letterSpacing: "0.15em" }}>{settings.companyName}</h1>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">{settings.companyAddress}</p>
          </div>
        </div>

        {/* INVOICE Title */}
        <InvoiceTitle themeColor={themeColor} />

        {/* Info Bar */}
        <div className="flex justify-between items-center border-y py-4 mb-10" style={{ borderColor: `${themeColor}20` }}>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice</span>
            <span className="text-sm font-black">#{invoice.invoiceNumber}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date</span>
            <span className="text-sm font-black">{invoice.date}</span>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-black">
              <span className="font-bold text-zinc-400">{invoice.clientLabel}: </span>
              <span className="uppercase">{invoice.clientName}</span>
            </p>
            {invoice.doctorName && (
              <p className="text-sm font-black text-zinc-700">
                <span className="font-bold text-zinc-400">Doctor: </span>
                <span className="uppercase">{invoice.doctorName}</span>
              </p>
            )}
          </div>
          {invoice.clientEmail && <p className="text-sm text-zinc-500 mt-1">{invoice.clientEmail}</p>}
          {invoice.clientPhone && <p className="text-sm text-zinc-500 mt-1">✆ {invoice.clientPhone}</p>}
        </div>

        <table className="w-full mb-10">
          <thead>
            <tr className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b" style={{ borderColor: `${themeColor}10` }}>
              <th className="py-3">Item Description</th>
              <th className="py-3 text-center">Batch</th>
              <th className="py-3 text-center">Expiry</th>
              <th className="py-3 text-right">Qty</th>
              <th className="py-3 text-right">MRP</th>
              <th className="py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {invoice.items.map((item, i) => (
              <tr key={i} className="text-sm">
                <td className="py-4 font-medium">{item.description}</td>
                <td className="py-4 text-center text-zinc-400 text-xs">{item.batchNo || '-'}</td>
                <td className="py-4 text-center text-zinc-400 text-xs">{item.expiryDate || '-'}</td>
                <td className="py-4 text-right text-zinc-500">{item.quantity}</td>
                <td className="py-4 text-right text-zinc-500">{formatCurrency(item.unitPrice, settings.currency)}</td>
                <td className="py-4 text-right font-black" style={{ color: themeColor }}>{formatCurrency(item.total, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Amount in Words</p>
              <p className="font-bold italic text-xs text-zinc-600">{numberToWords(invoice.total)}</p>
            </div>
          </div>
          <div className="col-span-5 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 uppercase tracking-widest">Subtotal</span>
              <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            {invoice.discountPercentage > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span className="uppercase tracking-widest">Discount</span>
                <span className="font-bold">-{formatCurrency(discountAmount, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xl pt-4 border-t" style={{ borderColor: `${themeColor}20`, color: themeColor }}>
              <span>Total</span>
              <span>{formatCurrency(invoice.total, settings.currency)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-zinc-900 pt-2">
              <span className="uppercase tracking-widest">Balance Due</span>
              <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold text-zinc-900 text-xs uppercase tracking-widest mb-2">Terms</p>
            <ul className="list-disc list-inside text-[10px] space-y-1 text-zinc-500">
              {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
          {invoice.showSignatory && (
            <div className="flex justify-end items-end">
              <div className="w-48 text-center">
                <div className="h-12 border-b border-zinc-200 mb-2"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Authorized Signatory</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modern Template (Default)
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);

  return (
    <div className="p-16 bg-white min-h-[1000px] font-sans border border-zinc-100 flex flex-col">
      {/* Company Header */}
      <div>
        <div className="flex justify-end mb-1">
          <DLNumbers dlNumbers={invoice.dlNumbers} />
        </div>
        <div className="text-center mb-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-4" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-2xl" style={{ backgroundColor: themeColor }}>
              {settings.companyName.charAt(0)}
            </div>
          )}
          <h1 className="text-4xl font-black uppercase" style={{ color: themeColor, letterSpacing: "0.15em" }}>{settings.companyName}</h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-md mx-auto">{settings.companyAddress}</p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-zinc-400">
            <span>{settings.companyPhone}</span>
            <span>•</span>
            <span>{settings.companyEmail}</span>
          </div>
        </div>
      </div>

      {/* INVOICE Title */}
      <InvoiceTitle themeColor={themeColor} />

      {/* Invoice Details Bar */}
      <div className="flex justify-between items-center bg-zinc-50 p-6 rounded-2xl mb-10">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Number</p>
          <p className="text-lg font-black" style={{ color: themeColor }}>#{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Date</p>
          <p className="text-lg font-black">{invoice.date}</p>
        </div>
      </div>

      <div className="mb-12">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Bill To</p>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-lg font-black">
            <span className="text-zinc-500 font-bold text-base">{invoice.clientLabel}: </span>
            <span className="uppercase">{invoice.clientName}</span>
          </h3>
          {invoice.doctorName && (
            <p className="text-lg font-black text-zinc-700">
              <span className="text-zinc-500 font-bold text-base">Doctor: </span>
              <span className="uppercase">{invoice.doctorName}</span>
            </p>
          )}
        </div>
        {invoice.clientEmail && <p className="text-zinc-400 text-sm mt-1">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-zinc-400 text-sm mt-1">✆ {invoice.clientPhone}</p>}
      </div>

      <div className="mb-10">
        <div className="grid grid-cols-12 bg-zinc-900 text-white p-4 rounded-t-2xl text-[10px] font-bold uppercase tracking-widest">
          <div className="col-span-4">Description</div>
          <div className="col-span-2 text-center">Batch / Expiry</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">MRP</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <div className="divide-y divide-zinc-100 border-x border-zinc-100">
          {invoice.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 p-4 text-sm hover:bg-zinc-50 transition-colors">
              <div className="col-span-4 font-bold text-zinc-900">{item.description}</div>
              <div className="col-span-2 text-center text-xs text-zinc-400">
                {item.batchNo && <div>{item.batchNo}</div>}
                {item.expiryDate && <div>{item.expiryDate}</div>}
                {!item.batchNo && !item.expiryDate && <span>-</span>}
              </div>
              <div className="col-span-2 text-right text-zinc-500">{item.quantity}</div>
              <div className="col-span-2 text-right text-zinc-500">{formatCurrency(item.unitPrice, settings.currency)}</div>
              <div className="col-span-2 text-right font-black" style={{ color: themeColor }}>{formatCurrency(item.total, settings.currency)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-7 space-y-8">
          <div>
            <p className="text-[10px] font-bold uppercase text-zinc-400 mb-2">Amount in Words</p>
            <p className="text-sm font-black italic text-zinc-900">{numberToWords(invoice.total)}</p>
          </div>
        </div>
        <div className="col-span-5 bg-zinc-50 p-8 rounded-3xl space-y-4">
          <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="text-zinc-900">{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          {invoice.discountPercentage > 0 && (
            <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase tracking-widest">
              <span>Discount ({invoice.discountPercentage}%)</span>
              <span>-{formatCurrency(discountAmount, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black pt-6 border-t border-zinc-200" style={{ color: themeColor }}>
            <span>Total</span>
            <span>{formatCurrency(invoice.total, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-zinc-900 pt-2 uppercase tracking-widest">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-10 grid grid-cols-2 gap-12">
        <div>
          <p className="font-black text-zinc-900 text-xs uppercase tracking-widest mb-3 underline decoration-2" style={{ textDecorationColor: themeColor }}>Terms & Conditions</p>
          <ul className="list-disc list-inside text-[10px] space-y-2 text-zinc-500">
            {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </div>
        {invoice.showSignatory && (
          <div className="flex justify-end items-end">
            <div className="w-64 text-center">
              <div className="border-t-2 border-zinc-900 pt-3">
                <p className="font-black uppercase text-[10px] tracking-widest">Authorised Signatory</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InventoryManager = ({ products, onAdd, onUpdate, onDelete, currency }: { products: Product[], onAdd: (p: Product) => void, onUpdate: (p: Product) => void, onDelete: (id: number) => void, currency: string }) => {
  const [newProduct, setNewProduct] = useState<Product>({ name: '', description: '', basePrice: 0, batchNo: '', expiryDate: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSave = () => {
    if (!newProduct.name || newProduct.basePrice <= 0) {
      alert('Please provide product name and base price.');
      return;
    }

    if (editingId) {
      onUpdate({ ...newProduct, id: editingId });
      setEditingId(null);
    } else {
      onAdd(newProduct);
    }
    setNewProduct({ name: '', description: '', basePrice: 0, batchNo: '', expiryDate: '' });
  };

  const startEdit = (p: Product) => {
    setNewProduct(p);
    setEditingId(p.id!);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card p-6 h-fit space-y-4">
          <h3 className="font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Product Name</label>
            <input 
              placeholder="e.g. Paracetamol" 
              className="input" 
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Base Price ({currency})</label>
            <input 
              type="number" 
              placeholder="0.00" 
              className="input" 
              value={newProduct.basePrice}
              onChange={e => setNewProduct({...newProduct, basePrice: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Batch No <span className="normal-case text-zinc-300">(optional)</span></label>
            <input 
              placeholder="e.g. B2024-01" 
              className="input" 
              value={newProduct.batchNo || ''}
              onChange={e => setNewProduct({...newProduct, batchNo: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase">Expiry Date <span className="normal-case text-zinc-300">(optional)</span></label>
            <input 
              type="date"
              className="input" 
              value={newProduct.expiryDate || ''}
              onChange={e => setNewProduct({...newProduct, expiryDate: e.target.value})}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="btn-primary flex-1">
              {editingId ? 'Update Product' : 'Add to Inventory'}
            </button>
            {editingId && (
              <button 
                onClick={() => {
                  setEditingId(null);
                  setNewProduct({ name: '', description: '', basePrice: 0, batchNo: '', expiryDate: '' });
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
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
                    <td className="px-4 py-3 text-zinc-500">{p.batchNo || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-zinc-500">{p.expiryDate || <span className="text-zinc-300">—</span>}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => startEdit(p)} className="text-zinc-400 hover:text-zinc-900">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => onDelete(p.id!)} className="text-zinc-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">No products yet. Add your first item!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ settings, onSave }: { settings: Settings, onSave: (s: Settings) => void }) => {
  const [formData, setFormData] = useState<Settings>(settings);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold tracking-tight">Company Settings</h2>
      
      <div className="card p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Company Name</label>
          <input className="input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Logo URL</label>
          <input className="input" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Address</label>
          <textarea className="input h-24" value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
            <input className="input" value={formData.companyEmail} onChange={e => setFormData({...formData, companyEmail: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Phone</label>
            <input className="input" value={formData.companyPhone} onChange={e => setFormData({...formData, companyPhone: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Website</label>
            <input className="input" value={formData.companyWebsite} onChange={e => setFormData({...formData, companyWebsite: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Currency</label>
            <select className="input" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        <button onClick={() => onSave(formData)} className="btn-primary w-full py-3">
          Save Settings
        </button>
      </div>
    </div>
  );
};

const InvoiceList = ({ invoices, onNew, onView, onDelete, currency }: { invoices: Invoice[], onNew: () => void, onView: (id: number) => void, onDelete: (id: number) => void, currency: string }) => {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <button onClick={onNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <div className="card">
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
            {invoices.map(inv => (
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
                <td className="px-6 py-4 font-mono text-sm font-bold">{formatCurrency(inv.total, currency)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(inv.id!); }}
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
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    logoUrl: '',
    currency: 'INR'
  });
  const [inventory, setInventory] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: "include"
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    const safeFetch = async (url: string, setter: (data: any) => void) => {
      try {
        const res = await fetch(url, {credentials: "include"});
        if (res.ok) {
          const data = await res.json();
          if (data) setter(data);
        }
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
      }
    };

    safeFetch('/api/settings', (data) => {
      setSettings({
        companyName: data.companyName || '',
        companyAddress: data.companyAddress || '',
        companyEmail: data.companyEmail || '',
        companyPhone: data.companyPhone || '',
        companyWebsite: data.companyWebsite || '',
        logoUrl: data.logoUrl || '',
        currency: data.currency || 'INR'
      });
    });
    safeFetch('/api/products', (data) => {
      setInventory(data.map((p: any) => ({
        ...p,
        description: p.description || '',
        unit: p.unit || 'pcs',
        batchNo: p.batchNo || '',
        expiryDate: p.expiryDate || '',
      })));
    });
    safeFetch('/api/invoices', setInvoices);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: "include" });
    setUser(null);
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    await fetch('/api/settings', {
      method: 'POST',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    setSettings(newSettings);
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(prev => [...prev, { ...data, description: data.description || '', unit: data.unit || 'pcs', batchNo: data.batchNo || '', expiryDate: data.expiryDate || '' }]);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (res.ok) {
      setInventory(inventory.map(p => p.id === product.id ? product : p));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: "include" });
    setInventory(inventory.filter(p => p.id !== id));
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      const method = invoice.id ? 'PUT' : 'POST';
      const url = invoice.id ? `/api/invoices/${invoice.id}` : '/api/invoices';
      
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      });
      if (res.ok) {
        const data = await res.json();
        if (invoice.id) {
          setInvoices(invoices.map(inv => inv.id === invoice.id ? data : inv));
          setSelectedInvoice(data);
        } else {
          setInvoices([data, ...invoices]);
        }
        setIsCreating(false);
        setEditingInvoice(null);
        setActiveTab('invoices');
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE', credentials: "include" });
    setInvoices(invoices.filter(inv => inv.id !== id));
    setSelectedInvoice(null);
    setActiveTab('invoices');
  };

  const handleUpdateProductPrice = async (id: number, price: number) => {
    await fetch(`/api/products/${id}/price`, {
      method: 'PATCH',
      credentials: "include",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price })
    });
    setInventory(inventory.map(p => p.id === id ? { ...p, basePrice: price } : p));
  };

  const handleViewInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {credentials: "include"});
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSelectedInvoice({
            ...data,
            clientLabel: data.clientLabel || 'Patient',
            balanceDue: data.balanceDue || 0,
            doctorName: data.doctorName || '',
            dlNumbers: data.dlNumbers || ['', '', ''],
          });
        }
      }
    } catch (err) {
      console.error('Error viewing invoice:', err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <AuthScreen onAuthSuccess={(u) => { setUser(u); fetchData(); }} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsCreating(false); setSelectedInvoice(null); }} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 bg-zinc-50 overflow-auto">
        <AnimatePresence mode="wait">
          {isCreating || editingInvoice ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="p-8 pb-0 no-print">
                <button 
                  onClick={() => { setIsCreating(false); setEditingInvoice(null); }} 
                  className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium"
                >
                  <X size={16} /> Cancel
                </button>
              </div>
              <InvoiceEditor 
                settings={settings} 
                inventory={inventory} 
                onSave={handleSaveInvoice} 
                onUpdateProductPrice={handleUpdateProductPrice}
                initialInvoice={editingInvoice || undefined}
              />
            </motion.div>
          ) : selectedInvoice ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-8"
            >
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between no-print">
                  <button onClick={() => setSelectedInvoice(null)} className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium">
                    <ChevronRight size={16} className="rotate-180" /> Back to Invoices
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingInvoice(selectedInvoice)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <SettingsIcon size={18} /> Edit / Change Type
                    </button>
                    <button 
                      onClick={() => {
                        const subject = `Invoice ${selectedInvoice.invoiceNumber} from ${settings.companyName}`;
                        const body = `Hi ${selectedInvoice.clientName},\n\nPlease find attached invoice ${selectedInvoice.invoiceNumber} for ${formatCurrency(selectedInvoice.total, settings.currency)}.\n\nThank you,\n${settings.companyName}`;
                        window.location.href = `mailto:${selectedInvoice.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }} 
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Mail size={18} /> Email
                    </button>
                    <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                      <Printer size={18} /> Print
                    </button>
                    <button 
                      onClick={() => handleDeleteInvoice(selectedInvoice.id!)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                </div>
                <div className="bg-white shadow-xl rounded-sm overflow-hidden">
                  <InvoiceTemplate invoice={selectedInvoice} settings={settings} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard invoices={invoices} settings={settings} />}
              {activeTab === 'invoices' && <InvoiceList invoices={invoices} onNew={() => setIsCreating(true)} onView={handleViewInvoice} onDelete={handleDeleteInvoice} currency={settings.currency} />}
              {activeTab === 'inventory' && <InventoryManager products={inventory} onAdd={handleAddProduct} onUpdate={handleUpdateProduct} onDelete={handleDeleteProduct} currency={settings.currency} />}
              {activeTab === 'settings' && <SettingsView settings={settings} onSave={handleSaveSettings} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
