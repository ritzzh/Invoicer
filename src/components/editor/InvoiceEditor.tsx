import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Invoice, InvoiceItem, Product, Settings } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { InvoiceTemplate } from '../invoice/InvoiceTemplate';
import { ExpiryInput } from '../shared/ExpiryInput';

interface InvoiceEditorProps {
  settings: Settings;
  inventory: Product[];
  onSave: (invoice: Invoice) => void;
  onUpdateProductPrice: (id: number, price: number) => void;
  initialInvoice?: Invoice;
}

export const InvoiceEditor = ({
  settings,
  inventory,
  onSave,
  onUpdateProductPrice,
  initialInvoice,
}: InvoiceEditorProps) => {
  const [invoice, setInvoice] = useState<Invoice>(
    initialInvoice || {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      clientLabel: 'Patient Name',
      doctorName: settings.userName || '',
      doctorLabel: 'Doctor',
      dlNumbers: settings.dlNumbers || ['', '', ''],
      doctorRegistrationNo: (settings as any).doctorRegistrationNo || '',
      gstNumber: (settings as any).gstNumber || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      discountPercentage: 0,
      roundOff: 0,
      total: 0,
      balanceDue: 0,
      items: [{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs', total: 0, expiryMode: 'full' }],
      template: 'medical-landscape',
      themeColor: '#000000',
      terms: settings.defaultTerms || '1. This is an electronically generated document.\n2. All disputes are subject to seller city jurisdiction.',
      showSignatory: true,
      useDigitalSignature: false,
      companyTitleSize: settings.companyTitleSize || 0,
    } as any
  );

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (invoice.discountPercentage / 100);
    const actualTotal = subtotal - discountAmount;
    const roundedTotal = Math.round(actualTotal);
    const roundOff = roundedTotal - actualTotal;

    setInvoice((prev) => ({
      ...prev,
      total: roundedTotal,
      roundOff: Number(roundOff.toFixed(2)),
      balanceDue: Number(actualTotal.toFixed(2)),
    }));
  }, [invoice.items, invoice.discountPercentage]);

  // New items added to the TOP (index 0)
  const addItem = () => {
    if (invoice.items.length >= 20) {
      // Max items reached — the parent will show a toast via the useToast hook
      // but since editor is standalone, we use window-level alert as fallback
      // This will be improved when the editor gets its own toast context
      window.dispatchEvent(new CustomEvent('app-warning', { detail: 'Maximum 20 items allowed per invoice to ensure single-page layout.' }));
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, unit: 'pcs', total: 0, expiryMode: 'full' }],    }));
  };

  const removeItem = (index: number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem | string, value: any) => {
    const newItems = [...invoice.items];
    const item = { ...newItems[index], [field]: value } as any;
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = Number((item.quantity * item.unitPrice).toFixed(2));
    }
    newItems[index] = item;
    setInvoice((prev) => ({ ...prev, items: newItems }));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const product = inventory.find((p) => p.id === productId);
    if (!product) return;

    // Check if this product is already in another row
    const alreadyUsed = invoice.items.some(
      (item, i) => i !== index && (item as any).productId === productId
    );
    if (alreadyUsed) {
      window.dispatchEvent(new CustomEvent('app-warning', { detail: `"${product.name}" is already in the invoice. Increase the quantity on the existing row instead.` }));
      return;
    }
      const newItems = [...invoice.items];
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      unitPrice: product.basePrice,
      unit: product.unit || 'pcs',
      productId: product.id,
      batchNo: (product as any).batchNo || '',
      expiryDate: (product as any).expiryDate || '',
      expiryMode: (product as any).expiryMode || 'full',
      hsn: (product as any).hsn || '',
      total: Number((newItems[index].quantity * product.basePrice).toFixed(2)),
    } as any;
    setInvoice((prev) => ({ ...prev, items: newItems }));
  };


  return (
    <div className="flex-1 flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-8 p-3 sm:p-5 md:p-8">
      {/* Editor Form */}
      <div className="flex-1 space-y-6 sm:space-y-8 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {initialInvoice ? 'Edit Invoice' : 'Create Invoice'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onSave({ ...invoice, items: invoice.items })} className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center">
              <Save size={18} /> Save
            </button>
<button onClick={() => handlePrint()} className="btn-secondary flex items-center gap-2 flex-1 sm:flex-none justify-center">
              <Printer size={18} /> Print
            </button>
          </div>
        </div>

        <div className="card p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Invoice Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Invoice Number</label>
              <input className="input" value={invoice.invoiceNumber} onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Template</label>
              <select className="input" value={invoice.template} onChange={e => setInvoice({ ...invoice, template: e.target.value as any })}>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="medical">Medical (Grid)</option>
                <option value="medical-landscape">Medical Landscape</option>
              </select>
            </div>
          </div>

          {/* Date + Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Invoice Date</label>
              <input type="date" className="input" value={invoice.date} onChange={e => setInvoice({ ...invoice, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Theme Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" value={invoice.themeColor || '#000000'} onChange={e => setInvoice({ ...invoice, themeColor: e.target.value })} />
                <input className="input text-xs font-mono uppercase" value={invoice.themeColor || '#000000'} onChange={e => setInvoice({ ...invoice, themeColor: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Discount + Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Discount (%)</label>
              <input type="number" className="input" value={invoice.discountPercentage} onChange={e => setInvoice({ ...invoice, discountPercentage: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Terms & Conditions</label>
              <textarea className="input h-20" value={invoice.terms} onChange={e => setInvoice({ ...invoice, terms: e.target.value })} placeholder="One per line..." />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showSignatory" checked={invoice.showSignatory} onChange={e => setInvoice({ ...invoice, showSignatory: e.target.checked })} className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
              <label htmlFor="showSignatory" className="text-xs font-semibold text-zinc-500 uppercase cursor-pointer">Show Signatory</label>
            </div>
            {invoice.showSignatory && settings.signatureUrl && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="useDigitalSignature" checked={(invoice as any).useDigitalSignature || false} onChange={e => setInvoice({ ...invoice, useDigitalSignature: e.target.checked } as any)} className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                <label htmlFor="useDigitalSignature" className="text-xs font-semibold text-zinc-500 uppercase cursor-pointer flex items-center gap-1">
                  <span>Digitally Signed</span>
                  <span className="text-[9px] font-normal normal-case text-zinc-400">(embed signature from settings)</span>
                </label>
              </div>
            )}
            {settings.signatureUrl && !invoice.showSignatory && (
              <p className="text-[10px] text-zinc-400">Enable signatory to use digital signature</p>
            )}
            {!settings.signatureUrl && (
              <p className="text-[10px] text-zinc-400">Upload a signature in Settings to enable digital signing</p>
            )}
          </div>

          {/* Company Title Size override */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 uppercase">
                Company Title Size <span className="normal-case text-zinc-300">(px, 0 = auto)</span>
              </label>
              <input
                type="number"
                className="input"
                min={0}
                max={120}
                placeholder={`Auto (from settings: ${settings.companyTitleSize || 'auto'})`}
                value={(invoice as any).companyTitleSize || ''}
                onChange={e => setInvoice({ ...invoice, companyTitleSize: parseInt(e.target.value) || 0 } as any)}
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold border-b border-zinc-100 pb-2">Client Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Client Label</label>
                <input placeholder="e.g. Patient" className="input py-1 text-xs" value={invoice.clientLabel} onChange={e => setInvoice({ ...invoice, clientLabel: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Name</label>
                <input placeholder="Client Name" className="input" value={invoice.clientName} onChange={e => setInvoice({ ...invoice, clientName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Email</label>
                <input placeholder="Client Email" className="input" value={invoice.clientEmail} onChange={e => setInvoice({ ...invoice, clientEmail: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Phone</label>
                <input placeholder="Client Phone" className="input" value={invoice.clientPhone} onChange={e => setInvoice({ ...invoice, clientPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Address</label>
              <textarea placeholder="Client Address" className="input h-16" value={invoice.clientAddress} onChange={e => setInvoice({ ...invoice, clientAddress: e.target.value })} />
            </div>
            {/* Doctor row — label is editable */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Doctor Label</label>
                <input placeholder="e.g. Doctor" className="input py-1 text-xs" value={(invoice as any).doctorLabel || 'Doctor'} onChange={e => setInvoice({ ...invoice, doctorLabel: e.target.value } as any)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Doctor Name <span className="normal-case text-zinc-300">(optional)</span></label>
                <input placeholder="Leave blank to hide" className="input" value={(invoice as any).doctorName || ''} onChange={e => setInvoice({ ...invoice, doctorName: e.target.value } as any)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase">Doctor Registration No. <span className="normal-case text-zinc-300">(from settings)</span></label>
              <input placeholder="Leave blank to hide" className="input" value={(invoice as any).doctorRegistrationNo || ''} onChange={e => setInvoice({ ...invoice, doctorRegistrationNo: e.target.value } as any)} />
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
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start">
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          className="input text-xs w-full sm:w-44"
                          onChange={e => handleProductSelect(idx, parseInt(e.target.value))}
                          value={(item as any).productId || ''}
                        >
                          <option value="">Select Product</option>
                          {inventory.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input placeholder="Description" className="input flex-1" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="flex-1 sm:w-16">
                        <input type="number" placeholder="Qty" className="input w-full" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="flex-1 sm:w-24">
                        <input type="number" placeholder="Price" className="input w-full" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="w-20 pt-2 text-right font-mono text-sm shrink-0">
                        {formatCurrency(item.total, settings.currency)}
                      </div>
                      <div className="flex flex-col gap-1 pt-1 shrink-0">
                        <button onClick={() => removeItem(idx)} className="text-zinc-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                        {(item as any).productId && inventory.find(p => p.id === (item as any).productId)?.basePrice !== item.unitPrice && (
                          <button title="Update inventory price permanently" onClick={() => onUpdateProductPrice((item as any).productId!, item.unitPrice)} className="text-emerald-500 hover:text-emerald-700 p-1">
                            <Save size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Unit + Batch + HSN + Expiry */}
                  <div className="grid grid-cols-4 xs:grid-cols-4 gap-1.5 sm:gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Unit</label>
                      <input placeholder="e.g. Kg, pcs, sheet" className="input py-1 text-xs" value={item.unit || ''} onChange={e => updateItem(idx, 'unit', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Batch No</label>
                      <input placeholder="Batch No" className="input py-1 text-xs" value={(item as any).batchNo || ''} onChange={e => updateItem(idx, 'batchNo', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">HSN</label>
                      <input placeholder="HSN Code" className="input py-1 text-xs" value={(item as any).hsn || ''} onChange={e => updateItem(idx, 'hsn', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase">Expiry
                        <span className="text-zinc-300 ml-1 font-normal normal-case">
                          {(item as any).expiryMode === 'monthyear' ? '(M/Y)' : '(Full)'}
                        </span>
                      </label>
                      <ExpiryInput
                        value={(item as any).expiryDate || ''}
                        mode={(item as any).expiryMode || 'full'}
                        onValueChange={v => updateItem(idx, 'expiryDate', v)}
                        onModeChange={m => updateItem(idx, 'expiryMode', m)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-6 border-t border-zinc-100 flex justify-end">
            <div className="w-full xs:w-56 sm:w-64 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-500">Discount %</label>
                <input type="number" className="input w-20 py-1 text-right" value={invoice.discountPercentage} onChange={e => setInvoice({ ...invoice, discountPercentage: parseFloat(e.target.value) || 0 })} />
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

      {/* Preview Panel (Desktop only) */}
      <div className="hidden xl:block w-[420px] shrink-0 sticky top-8 h-fit no-print">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Live Preview</h2>
        <div className="bg-white shadow-2xl rounded-sm overflow-hidden" style={{transform:'scale(0.55)', transformOrigin:'top left', width:'760px'}}>
          <InvoiceTemplate invoice={invoice} settings={settings} />
        </div>
      </div>

      {/* Hidden print container for react-to-print */}
      <div className="hidden">
        <div ref={printRef} className="print-container">
          <InvoiceTemplate invoice={invoice} settings={settings} />
        </div>
      </div>
    </div>
  );
};
