import { useState, useEffect } from 'react';
import { Invoice, Product, Settings } from '../types';

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
};

export const useApp = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
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
        const res = await fetch(url, { credentials: 'include' });
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
        currency: data.currency || 'INR',
        dlNumbers: Array.isArray(data.dlNumbers) ? data.dlNumbers : ['', '', ''],
        userName: data.userName || '',
      });
    });

    safeFetch('/api/products', (data) => {
      setInventory(
        data.map((p: any) => ({
          ...p,
          description: p.description || '',
          unit: p.unit || 'pcs',
          batchNo: p.batchNo || '',
          expiryDate: p.expiryDate || '',
        }))
      );
    });

    safeFetch('/api/invoices', setInvoices);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    await fetch('/api/settings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    setSettings(newSettings);
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) {
        const data = await res.json();
        setInventory((prev) => [
          ...prev,
          {
            ...data,
            description: data.description || '',
            unit: data.unit || 'pcs',
            batchNo: data.batchNo || '',
            expiryDate: data.expiryDate || '',
          },
        ]);
      }
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      setInventory(inventory.map((p) => (p.id === product.id ? product : p)));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
    setInventory(inventory.filter((p) => p.id !== id));
  };

  const handleSaveInvoice = async (
    invoice: Invoice,
    onSuccess: (saved: Invoice) => void
  ) => {
    try {
      const method = invoice.id ? 'PUT' : 'POST';
      const url = invoice.id ? `/api/invoices/${invoice.id}` : '/api/invoices';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      if (res.ok) {
        const data = await res.json();
        if (invoice.id) {
          setInvoices(invoices.map((inv) => (inv.id === invoice.id ? data : inv)));
        } else {
          setInvoices([data, ...invoices]);
        }
        onSuccess(data);
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
    }
  };

  const handleDeleteInvoice = async (id: number, onSuccess: () => void) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
    setInvoices(invoices.filter((inv) => inv.id !== id));
    onSuccess();
  };

  const handleUpdateProductPrice = async (id: number, price: number) => {
    await fetch(`/api/products/${id}/price`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price }),
    });
    setInventory(inventory.map((p) => (p.id === id ? { ...p, basePrice: price } : p)));
  };

  const handleViewInvoice = async (id: number): Promise<Invoice | null> => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          return {
            ...data,
            clientLabel: data.clientLabel || 'Patient',
            balanceDue: data.balanceDue || 0,
            doctorName: data.doctorName || '',
            dlNumbers: data.dlNumbers || ['', '', ''],
          };
        }
      }
    } catch (err) {
      console.error('Error viewing invoice:', err);
    }
    return null;
  };

  return {
    user,
    setUser,
    loading,
    settings,
    inventory,
    invoices,
    fetchData,
    handleLogout,
    handleSaveSettings,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleSaveInvoice,
    handleDeleteInvoice,
    handleUpdateProductPrice,
    handleViewInvoice,
  };
};
