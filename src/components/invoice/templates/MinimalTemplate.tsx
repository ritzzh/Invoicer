import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { InvoiceTitle, DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

export const MinimalTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;
  const doctorLabel = (invoice as any).doctorLabel || 'Doctor';

  return (
    <div className="invoice-wrap px-4 py-4 bg-white font-sans border border-zinc-100 flex flex-col">
      <div>
        <div className="flex justify-end mb-0.5"><DLNumbers dlNumbers={dlNumbers} /></div>
        <div className="text-center mb-3">
          <CompanyName name={settings.companyName} themeColor={themeColor} />
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-widest">{settings.companyAddress}</p>
        </div>
      </div>

      <InvoiceTitle themeColor={themeColor} />

      <div className="flex justify-between items-center border-y py-2 mb-6" style={{ borderColor: `${themeColor}20` }}>
        <div className="flex gap-3">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice</span>
          <span className="text-xs font-black">#{invoice.invoiceNumber}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Date</span>
          <span className="text-xs font-black">{invoice.date}</span>
        </div>
      </div>

      <div className="mb-6 space-y-0.5">
        <p className="text-xs font-black">
          <span className="font-bold text-zinc-400">{invoice.clientLabel}: </span>
          <span className="uppercase">{invoice.clientName}</span>
        </p>
        {(invoice as any).doctorName && (
          <p className="text-xs font-black text-zinc-700">
            <span className="font-bold text-zinc-400">{doctorLabel}: </span>
            <span className="uppercase">{(invoice as any).doctorName}</span>
          </p>
        )}
        {invoice.clientEmail && <p className="text-[10px] text-zinc-500 mt-0.5">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-[10px] text-zinc-500">✆ {invoice.clientPhone}</p>}
      </div>

      <table className="w-full text-[11px] mb-6">
        <thead>
          <tr className="text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b" style={{ borderColor: `${themeColor}10` }}>
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Unit</th>
            <th className="py-2 text-center">Batch</th>
            <th className="py-2 text-center">Expiry</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">MRP</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {invoice.items.map((item, i) => (
            <tr key={i}>
              <td className="py-1.5 font-medium">{item.description}</td>
              <td className="py-1.5 text-center text-zinc-400 text-[9px]">{item.unit || '-'}</td>
              <td className="py-1.5 text-center text-zinc-400 text-[9px]">{(item as any).batchNo || '-'}</td>
              <td className="py-1.5 text-center text-zinc-400 text-[9px]">{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
              <td className="py-1.5 text-right text-zinc-500">{item.quantity}</td>
              <td className="py-1.5 text-right text-zinc-500">{formatCurrency(item.unitPrice, settings.currency)}</td>
              <td className="py-1.5 text-right font-black" style={{ color: themeColor }}>{formatCurrency(item.total, settings.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-0.5">Amount in Words</p>
          <p className="font-bold italic text-[10px] text-zinc-600">{numberToWords(invoice.total)}</p>
        </div>
        <div className="col-span-5 space-y-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-zinc-400 uppercase tracking-widest">Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          {invoice.discountPercentage > 0 && (
            <div className="flex justify-between text-[10px] text-emerald-600">
              <span className="uppercase tracking-widest">Discount</span>
              <span className="font-bold">-{formatCurrency(discountAmount, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg pt-2 border-t" style={{ borderColor: `${themeColor}20`, color: themeColor }}>
            <span>Total</span>
            <span>{formatCurrency(invoice.total, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-zinc-900 pt-1">
            <span className="uppercase tracking-widest">Balance Due</span>
            <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold text-zinc-900 text-[9px] uppercase tracking-widest mb-1">Terms</p>
          <ul className="list-disc list-inside text-[9px] space-y-0.5 text-zinc-500">
            {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => <li key={i}>{term}</li>)}
          </ul>
        </div>
        {invoice.showSignatory && (
          <div className="flex justify-end items-end">
            <div className="w-44 text-center">
              <div className="text-center">
                <p className="text-[10px] font-semibold mb-6">
                  For, {settings.companyName}
                </p>

                <div className="border-t border-zinc-900 pt-1">
                  <p className="font-bold uppercase text-[9px] tracking-widest">
                    Authorised Signatory
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
