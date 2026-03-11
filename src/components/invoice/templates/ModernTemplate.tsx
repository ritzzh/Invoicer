import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { InvoiceTitle, DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

export const ModernTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;
  const doctorLabel = (invoice as any).doctorLabel || 'Doctor';

  return (
    <div className="invoice-wrap px-3 py-3 bg-white font-sans border border-zinc-100 flex flex-col">
      <div>
        <div className="flex justify-end mb-0.5"><DLNumbers dlNumbers={dlNumbers} /></div>
        <div className="text-center mb-2">
          <CompanyName name={settings.companyName} themeColor={themeColor} titleSize={(invoice as any).companyTitleSize || settings.companyTitleSize} />
          <p className="text-zinc-500 text-[10px] mt-0.5 max-w-sm mx-auto">{settings.companyAddress}</p>
          <div className="flex justify-center gap-4 mt-0.5 text-[10px] text-zinc-400 flex-wrap">
            {settings.companyPhone && <span>{settings.companyPhone}</span>}
            {settings.companyPhone && settings.companyEmail && <span>•</span>}
            {settings.companyEmail && <span>{settings.companyEmail}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-0.5 mb-2">
        <InvoiceTitle themeColor={themeColor} />
        <span className="text-[8px] font-semibold tracking-wider text-zinc-500 uppercase">ORIGINAL FOR RECIPIENT</span>
      </div>

      <div className="flex justify-between items-center bg-zinc-50 px-4 py-2 rounded-xl mb-4">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Number</p>
          <p className="text-base font-black" style={{ color: themeColor }}>#{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Date</p>
          <p className="text-base font-black">{invoice.date}</p>
        </div>
      </div>

      <div className="mb-4 space-y-0.5">
        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Bill To</p>
        <h3 className="text-base font-black">
          <span className="text-zinc-500 font-bold text-sm">{invoice.clientLabel}: </span>
          <span className="uppercase">{invoice.clientName}</span>
        </h3>
        {(invoice as any).doctorName && (
          <p className="text-sm font-black text-zinc-700">
            <span className="text-zinc-500 font-bold text-xs">{doctorLabel}: </span>
            <span className="uppercase">{(invoice as any).doctorName}</span>
          </p>
        )}
        {invoice.clientEmail && <p className="text-zinc-400 text-[10px] mt-0.5">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-zinc-400 text-[10px]">✆ {invoice.clientPhone}</p>}
      </div>

      <div className="mb-4 overflow-x-auto -mx-3 px-3">
        <div style={{ minWidth: '500px' }}>
          <div className="grid grid-cols-12 bg-zinc-900 text-white px-3 py-2 rounded-t-xl text-[9px] font-bold uppercase tracking-widest">
            <div className="col-span-3">Description</div>
            <div className="col-span-1 text-center">Unit</div>
            <div className="col-span-2 text-center">Batch / Expiry</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">MRP</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <div className="divide-y divide-zinc-100 border-x border-zinc-100 text-[11px]">
            {invoice.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 px-3 py-1.5">
                <div className="col-span-3 font-bold text-zinc-900">{item.description}</div>
                <div className="col-span-1 text-center text-[10px] text-zinc-400">{item.unit || '-'}</div>
                <div className="col-span-2 text-center text-[10px] text-zinc-400">
                  {(item as any).batchNo && <div>{(item as any).batchNo}</div>}
                  {(item as any).expiryDate && <div>{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</div>}
                  {!(item as any).batchNo && !(item as any).expiryDate && <span>-</span>}
                </div>
                <div className="col-span-2 text-right text-zinc-500">{item.quantity}</div>
                <div className="col-span-2 text-right text-zinc-500">{formatCurrency(item.unitPrice, settings.currency)}</div>
                <div className="col-span-2 text-right font-black" style={{ color: themeColor }}>{formatCurrency(item.total, settings.currency)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7">
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Amount in Words</p>
          <p className="text-xs font-black italic text-zinc-900">{numberToWords(invoice.total)}</p>
        </div>
        <div className="col-span-5 bg-zinc-50 px-4 py-3 rounded-2xl space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span className="text-zinc-900">{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          {invoice.discountPercentage > 0 && (
            <div className="flex justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              <span>Discount ({invoice.discountPercentage}%)</span>
              <span>-{formatCurrency(discountAmount, settings.currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black pt-3 border-t border-zinc-200" style={{ color: themeColor }}>
            <span>Total</span>
            <span>{formatCurrency(invoice.total, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-zinc-900 pt-1 uppercase tracking-widest">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 grid grid-cols-2 gap-8">
        <div>
          <p className="font-black text-zinc-900 text-[9px] uppercase tracking-widest mb-1 underline decoration-2" style={{ textDecorationColor: themeColor }}>Terms & Conditions</p>
          <ul className="list-disc list-inside text-[9px] space-y-0.5 text-zinc-500">
            {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => <li key={i}>{term}</li>)}
          </ul>
        </div>
        {invoice.showSignatory && (
          <div className="flex justify-end items-end">
            <div className="w-52 text-center">
              {(invoice as any).useDigitalSignature && settings.signatureUrl ? (
                <img
                  src={settings.signatureUrl}
                  alt="Authorised Signature"
                  className="mx-auto mb-1 max-h-14 object-contain"
                  style={{ maxWidth: 160 }}
                />
              ) : (
                <p className="text-[10px] font-semibold mb-6">For, {settings.companyName}</p>
              )}
              <div className="border-t border-zinc-900 pt-1">
                <p className="font-bold uppercase text-[9px] tracking-widest">Authorised Signatory</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
