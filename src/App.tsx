import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Settings as SettingsIcon, Trash2, Mail, Printer, X } from 'lucide-react';

import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar } from './components/shared/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { InvoiceList } from './components/invoice/InvoiceList';
import { InvoiceTemplate } from './components/invoice/InvoiceTemplate';
import { InvoiceEditor } from './components/editor/InvoiceEditor';
import { InventoryManager } from './components/inventory/InventoryManager';
import { SettingsView } from './components/settings/SettingsView';
import { AdminPanel } from './components/admin/AdminPanel';
import { useApp } from './hooks/useApp';
import { useToast } from './components/shared/Toast';
import { Invoice } from './types';
import { formatCurrency } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailModal, setEmailModal] = useState<{ invoice: Invoice } | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; label: string } | null>(null);

  const { success, error, warning } = useToast();

  // Listen for warning events dispatched by child components (e.g. InvoiceEditor)
  React.useEffect(() => {
    const handler = (e: Event) => warning((e as CustomEvent).detail);
    window.addEventListener('app-warning', handler);
    return () => window.removeEventListener('app-warning', handler);
  }, [warning]);

  const {
    user, setUser, loading, settings, inventory, invoices, dashboardStats, fetchData,
    handleLogout, handleSaveSettings, handleAddProduct, handleUpdateProduct,
    handleDeleteProduct, handleSaveInvoice, handleDeleteInvoice,
    handleUpdateProductPrice, handleViewInvoice,
  } = useApp();

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    setIsCreating(false);
    setSelectedInvoice(null);
    setEditingInvoice(null);
  };

  const onViewInvoice = async (id: number) => {
    const inv = await handleViewInvoice(id);
    if (inv) setSelectedInvoice(inv);
  };

  const onSaveInvoice = (invoice: Invoice) => {
    handleSaveInvoice(invoice, (saved) => {
      setIsCreating(false);
      setEditingInvoice(null);
      setActiveTab('invoices');
      if (invoice.id) setSelectedInvoice(saved);
    });
  };

  const onDeleteInvoice = (id: number) => {
    setDeleteConfirm({ id, label: `Invoice #${invoices.find(i => i.id === id)?.invoiceNumber || id}` });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    handleDeleteInvoice(deleteConfirm.id, () => {
      setSelectedInvoice(null);
      setActiveTab('invoices');
    });
    setDeleteConfirm(null);
  };

  const openEmailModal = (invoice: Invoice) => {
    setEmailRecipient(invoice.clientEmail || '');
    setEmailModal({ invoice });
  };

  const sendEmail = async () => {
    if (!emailModal) return;
    const { invoice } = emailModal;
    const to = emailRecipient.trim();
    if (!to) { warning('Please enter a recipient email.'); return; }
    setEmailSending(true);
    try {
      const subject = `Invoice ${invoice.invoiceNumber} from ${settings.companyName}`;
      const body = `Hi ${invoice.clientName},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total, settings.currency)} attached.\n\nThank you,\n${settings.companyName}`;
      const res = await fetch('/api/send-invoice-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, invoiceNumber: invoice.invoiceNumber, invoiceData: invoice, settingsData: settings }),
      });
      const data = await res.json();
      if (res.ok) {
        success(`Email sent to ${to} with PDF attached`);
        setEmailModal(null);
      } else {
        error(`Email failed: ${data.error}`);
      }
    } catch (err) {
      console.error('sendEmail error:', err);
      error('Failed to send email. Check your app password in Settings.');
    } finally {
      setEmailSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen onAuthSuccess={(u) => { setUser(u); fetchData(); }} />
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={navigateToTab} onLogout={handleLogout} isAdmin={!!user?.isAdmin} />

      <main className="flex-1 bg-zinc-50 overflow-auto pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          {isCreating || editingInvoice ? (
            <motion.div key="editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="p-4 sm:p-8 pb-0 no-print">
                <button onClick={() => { setIsCreating(false); setEditingInvoice(null); }} className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium">
                  <X size={16} /> Cancel
                </button>
              </div>
              <InvoiceEditor
                settings={settings}
                inventory={inventory}
                onSave={onSaveInvoice}
                onUpdateProductPrice={handleUpdateProductPrice}
                initialInvoice={editingInvoice || undefined}
              />
            </motion.div>
          ) : selectedInvoice ? (
            <motion.div key="viewer" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 sm:p-8">
              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
                  <button onClick={() => setSelectedInvoice(null)} className="text-zinc-500 hover:text-zinc-900 flex items-center gap-1 text-sm font-medium self-start">
                    <ChevronRight size={16} className="rotate-180" /> Back to Invoices
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setEditingInvoice(selectedInvoice)} className="btn-secondary flex items-center gap-2 flex-1 sm:flex-none justify-center">
                      <SettingsIcon size={18} />
                      <span className="hidden sm:inline">Edit / Change Type</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => openEmailModal(selectedInvoice)}
                      className="btn-secondary flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <Mail size={18} /> Email
                    </button>
                    <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 flex-1 sm:flex-none justify-center">
                      <Printer size={18} /> Print
                    </button>
                    <button onClick={() => onDeleteInvoice(selectedInvoice.id!)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex-1 sm:flex-none justify-center">
                      <Trash2 size={18} /> Delete
                    </button>
                  </div>
                </div>
                <div className="bg-white shadow-xl rounded-sm">
                  <InvoiceTemplate invoice={selectedInvoice} settings={settings} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {activeTab === 'dashboard' && <Dashboard stats={dashboardStats} settings={settings} />}
              {activeTab === 'invoices' && (
                <InvoiceList invoices={invoices} onNew={() => setIsCreating(true)} onView={onViewInvoice} onDelete={onDeleteInvoice} currency={settings.currency} settings={settings} />
              )}
              {activeTab === 'inventory' && (
                <InventoryManager products={inventory} onAdd={handleAddProduct} onUpdate={handleUpdateProduct} onDelete={handleDeleteProduct} currency={settings.currency} />
              )}
              {activeTab === 'settings' && <SettingsView settings={settings} onSave={handleSaveSettings} />}
              {activeTab === 'admin' && user?.isAdmin && <AdminPanel />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-1">Send Invoice</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Send <span className="font-semibold text-zinc-700">#{emailModal.invoice.invoiceNumber}</span> to {emailModal.invoice.clientName} as a PDF attachment.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase mb-1 block">Recipient Email</label>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="recipient@email.com"
                  value={emailRecipient}
                  onChange={e => setEmailRecipient(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendEmail()}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEmailModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                <button onClick={sendEmail} disabled={emailSending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  <Mail size={15} />
                  {emailSending ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Delete Invoice</h3>
            <p className="text-sm text-zinc-500 mb-5">
              Are you sure you want to delete <span className="font-semibold text-zinc-700">{deleteConfirm.label}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 text-sm px-4 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

