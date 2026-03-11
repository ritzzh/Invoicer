import { useState, useEffect } from 'react';
import { Invoice, Product, Settings } from '../types';
import { useToast } from '../components/shared/Toast';

const DEFAULT_SETTINGS: Settings = {
  companyName: '',
  companyAddress: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  logoUrl: '',
  currency: 'INR',
  dlNumbers: ['', '', ''],
  userName: '',
  signatureUrl: '',
};

export interface ProductSalesStat {
  productId: number | null;
  name: string;
  inventoryUnit: string | null;
  invoiceUnit: string;
  basePrice: number;
  totalQty: number;
  totalRevenue: number;
  invoiceCount: number;
  firstSold: string;
  lastSold: string;
}

export interface InventoryStatusRow {
  id: number;
  name: string;
  basePrice: number;
  unit: string;
  batchNo: string | null;
  expiryDate: string | null;
  soldQty: number;
  soldRevenue: number;
  invoiceCount: number;
}

export interface DashboardStats {
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalInvoices: number;
    monthlyInvoices: number;
  };
  monthlyChart: { month: string; revenue: number; count: number }[];
  recentInvoices: {
    id: number;
    invoiceNumber: string;
    clientName: string;
    total: number;
    date: string;
  }[];
  productSales: ProductSalesStat[];
  inventoryStatus: InventoryStatusRow[];
}

export const useApp = () => {
  const [user, setUser]                     = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [settings, setSettings]             = useState<Settings>(DEFAULT_SETTINGS);
  const [inventory, setInventory]           = useState<Product[]>([]);
  const [invoices, setInvoices]             = useState<Invoice[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const { success, error } = useToast();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (res.ok) setDashboardStats(await res.json());
    } catch (e) {
      console.error('fetchDashboardStats', e);
    }
  };

  const fetchData = async () => {
    const safe = async (url: string, cb: (d: any) => void) => {
      try {
        const r = await fetch(url, { credentials: 'include' });
        if (r.ok) { const d = await r.json(); if (d) cb(d); }
      } catch (e) { console.error(url, e); }
    };

    safe('/api/settings', (d) => setSettings({
      companyName:      d.companyName      || '',
      companyAddress:   d.companyAddress   || '',
      companyEmail:     d.companyEmail     || '',
      companyPhone:     d.companyPhone     || '',
      companyWebsite:   d.companyWebsite   || '',
      logoUrl:          d.logoUrl          || '',
      currency:         d.currency         || 'INR',
      dlNumbers:        Array.isArray(d.dlNumbers) ? d.dlNumbers : ['', '', ''],
      userName:         d.userName         || '',
      signatureUrl:     d.signatureUrl     || '',
      companyTitleSize: d.companyTitleSize  || undefined,
    }));

    safe('/api/products', (d) => setInventory(d.map((p: any) => ({
      ...p,
      description: p.description || '',
      unit:        p.unit        || 'pcs',
      batchNo:     p.batchNo     || '',
      expiryDate:  p.expiryDate  || '',
    }))));

    safe('/api/invoices', setInvoices);
    fetchDashboardStats();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const handleSaveSettings = async (s: Settings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      if (res.ok) { setSettings(s); success('Settings saved'); }
      else         error('Failed to save settings');
    } catch { error('Failed to save settings'); }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const d = await res.json();
        setInventory(prev => [...prev, { ...d, description: d.description || '', unit: d.unit || 'pcs', batchNo: d.batchNo || '', expiryDate: d.expiryDate || '' }]);
        success('Product added');
        fetchDashboardStats();
      }
    } catch { error('Failed to add product'); }
  };

  const handleUpdateProduct = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      setInventory(prev => prev.map(p => p.id === product.id ? product : p));
      success('Product updated');
      fetchDashboardStats();
    }
  };

  const handleDeleteProduct = async (id: number) => {
    await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
    setInventory(prev => prev.filter(p => p.id !== id));
    success('Product deleted');
    fetchDashboardStats();
  };

  const handleSaveInvoice = async (invoice: Invoice, onSuccess: (saved: Invoice) => void) => {
    try {
      const method = invoice.id ? 'PUT' : 'POST';
      const url    = invoice.id ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const res    = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      if (res.ok) {
        const d = await res.json();
        setInvoices(prev => invoice.id ? prev.map(i => i.id === invoice.id ? d : i) : [d, ...prev]);
        success(invoice.id ? 'Invoice updated' : 'Invoice created');
        fetchDashboardStats();
        onSuccess(d);
      }
    } catch { error('Failed to save invoice'); }
  };

  const handleDeleteInvoice = async (id: number, onSuccess: () => void) => {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
    setInvoices(prev => prev.filter(i => i.id !== id));
    success('Invoice deleted');
    fetchDashboardStats();
    onSuccess();
  };

  const handleUpdateProductPrice = async (id: number, price: number) => {
    await fetch(`/api/products/${id}/price`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    setInventory(prev => prev.map(p => p.id === id ? { ...p, basePrice: price } : p));
    success('Price updated in inventory');
    fetchDashboardStats();
  };

  const handleViewInvoice = async (id: number): Promise<Invoice | null> => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        if (d) return {
          ...d,
          clientLabel: d.clientLabel || 'Patient',
          balanceDue:  d.balanceDue  || 0,
          doctorName:  d.doctorName  || '',
          dlNumbers:   d.dlNumbers   || ['', '', ''],
        };
      }
    } catch (e) { console.error(e); }
    return null;
  };

  return {
    user, setUser, loading,
    settings, inventory, invoices, dashboardStats,
    fetchData, fetchDashboardStats,
    handleLogout, handleSaveSettings,
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleSaveInvoice, handleDeleteInvoice,
    handleUpdateProductPrice, handleViewInvoice,
  };
};
