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
    <div className="invoice-wrap px-3 py-3 bg-white font-sans flex flex-col">
      <div>
        <div className="flex justify-end mb-0.5"><DLNumbers dlNumbers={dlNumbers} /></div>
        <div className="text-center mb-2">
          <CompanyName name={settings.companyName} themeColor={themeColor} titleSize={(invoice as any).companyTitleSize || settings.companyTitleSize} />
          <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-widest">{settings.companyAddress}</p>
        </div>
      </div>

      <div className="relative mb-3">
        <div className="text-center">
          <InvoiceTitle themeColor={themeColor} />
        </div>

        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-semibold tracking-wider text-zinc-500 uppercase">
          ORIGINAL FOR RECIPIENT
        </span>
      </div>

      <div className="flex justify-between items-center border-y py-2 mb-4" style={{ borderColor: `${themeColor}20` }}>
        <div className="flex gap-3">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice</span>
          <span className="text-xs font-black">#{invoice.invoiceNumber}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Date</span>
          <span className="text-xs font-black">{invoice.date}</span>
        </div>
      </div>

      <div className="mb-4 space-y-0.5">
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

      <div className="overflow-x-auto -mx-3 px-3 mb-4">
        <table className="text-[11px]" style={{ minWidth: '500px', width: '100%' }}>
          <thead>
            <tr className="text-left text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b" style={{ borderColor: `${themeColor}10` }}>
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center whitespace-nowrap">Unit</th>
              <th className="py-2 text-center whitespace-nowrap">Batch</th>
              <th className="py-2 text-center whitespace-nowrap">Expiry</th>
              <th className="py-2 text-right whitespace-nowrap">Qty</th>
              <th className="py-2 text-right whitespace-nowrap">MRP</th>
              <th className="py-2 text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="py-1.5 font-medium">{item.description}</td>
                <td className="py-1.5 text-center text-zinc-400 text-[9px] whitespace-nowrap">{item.unit || '-'}</td>
                <td className="py-1.5 text-center text-zinc-400 text-[9px] whitespace-nowrap">{(item as any).batchNo || '-'}</td>
                <td className="py-1.5 text-center text-zinc-400 text-[9px] whitespace-nowrap">{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
                <td className="py-1.5 text-right text-zinc-500 whitespace-nowrap">{item.quantity}</td>
                <td className="py-1.5 text-right text-zinc-500 whitespace-nowrap">{formatCurrency(item.unitPrice, settings.currency)}</td>
                <td className="py-1.5 text-right font-black whitespace-nowrap" style={{ color: themeColor }}>{formatCurrency(item.total, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      <div className="mt-auto pt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold underline text-zinc-900 mb-1 text-[10px]">
            Terms and Conditions
          </p>

          <div className="font-bold text-[9px] space-y-0.5 text-zinc-800">
            {invoice.terms
              ?.split('\n')
              .filter(t => t.trim())
              .map((term, i) => (
                <p key={i}>{term}</p>
              ))}
          </div>
        </div>
        {invoice.showSignatory && (
          <div className="flex justify-end items-end">
            <div className="w-52 text-center">
              <p className="text-[10px] font-semibold mb-3">For, {settings.companyName}</p>
              {(invoice as any).useDigitalSignature && settings.signatureUrl ? (
                <img
                  src={settings.signatureUrl}
                  alt="Authorised Signature"
                  className="mx-auto mb-1 max-h-14 object-contain"
                  style={{ maxWidth: 160 }}
                />
              ) : (
                <></>
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
