import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { InvoiceTitle, DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

export const ClassicTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;
  const doctorLabel = (invoice as any).doctorLabel || 'Doctor';

  return (
    <div className="invoice-wrap px-3 py-3 bg-white font-serif border border-zinc-200 flex flex-col">
      <div>
        <div className="flex justify-end mb-0.5"><DLNumbers dlNumbers={dlNumbers} /></div>
        <div className="text-center border-b-2 pb-2 mb-2" style={{ borderColor: themeColor }}>
          <CompanyName name={settings.companyName} themeColor={themeColor} titleSize={(invoice as any).companyTitleSize || settings.companyTitleSize} />
          <p className="mt-0.5 text-xs text-zinc-600">{settings.companyAddress}</p>
          <div className="flex justify-center gap-4 mt-0.5 text-[10px] text-zinc-500 flex-wrap">
            {settings.companyPhone && <span>✆ {settings.companyPhone}</span>}
            {settings.companyEmail && <span>✉ {settings.companyEmail}</span>}
            {settings.companyWebsite && <span>🌐 {settings.companyWebsite}</span>}
          </div>
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

      <div className="flex justify-between items-center mb-3">
        <div className="space-y-0.5">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Number</p>
          <p className="text-base font-black">#{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Invoice Date</p>
          <p className="text-base font-black">{invoice.date}</p>
        </div>
      </div>

      <div className="mb-3 space-y-0.5">
        <h3 className="text-[9px] font-bold uppercase border-b pb-1 mb-1 text-zinc-400" style={{ borderColor: `${themeColor}30` }}>Client</h3>
        <p className="font-bold text-sm">
          <span className="text-zinc-500">{invoice.clientLabel}: </span>
          <span className="uppercase">{invoice.clientName}</span>
        </p>
        {(invoice as any).doctorName && (
          <p className="font-bold text-sm text-zinc-700">
            <span className="text-zinc-500">{doctorLabel}: </span>
            <span className="uppercase">{(invoice as any).doctorName}</span>
          </p>
        )}
        {invoice.clientEmail && <p className="text-[10px] text-zinc-500">{invoice.clientEmail}</p>}
        {invoice.clientPhone && <p className="text-[10px] text-zinc-500">✆ {invoice.clientPhone}</p>}
      </div>

      <div className="overflow-x-auto -mx-3 px-3">
        <table className="border-collapse text-[11px]" style={{ minWidth: '500px', width: '100%' }}>
          <thead>
            <tr className="border-b-2" style={{ borderColor: themeColor }}>
              <th className="p-1.5 text-left uppercase text-[9px] tracking-widest">Description</th>
              <th className="p-1.5 text-center uppercase text-[9px] tracking-widest whitespace-nowrap">Unit</th>
              <th className="p-1.5 text-center uppercase text-[9px] tracking-widest whitespace-nowrap">Batch</th>
              <th className="p-1.5 text-center uppercase text-[9px] tracking-widest whitespace-nowrap">Expiry</th>
              <th className="p-1.5 text-right uppercase text-[9px] tracking-widest whitespace-nowrap">Qty</th>
              <th className="p-1.5 text-right uppercase text-[9px] tracking-widest whitespace-nowrap">MRP</th>
              <th className="p-1.5 text-right uppercase text-[9px] tracking-widest whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="p-1.5">{item.description}</td>
                <td className="p-1.5 text-center text-[10px] text-zinc-500 whitespace-nowrap">{item.unit || '-'}</td>
                <td className="p-1.5 text-center text-[10px] text-zinc-500 whitespace-nowrap">{(item as any).batchNo || '-'}</td>
                <td className="p-1.5 text-center text-[10px] text-zinc-500 whitespace-nowrap">{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
                <td className="p-1.5 text-right whitespace-nowrap">{item.quantity}</td>
                <td className="p-1.5 text-right whitespace-nowrap">{formatCurrency(item.unitPrice, settings.currency)}</td>
                <td className="p-1.5 text-right font-bold whitespace-nowrap">{formatCurrency(item.total, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-0.5">Amount in Words</p>
          <p className="font-bold italic text-xs">{numberToWords(invoice.total)}</p>
        </div>
        <div className="col-span-5 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-red-600">
            <span>Discount ({invoice.discountPercentage}%)</span>
            <span>-{formatCurrency(discountAmount, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Round Off</span>
            <span>{formatCurrency(invoice.roundOff, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t-2 pt-2" style={{ borderColor: themeColor, color: themeColor }}>
            <span>Total</span>
            <span>{formatCurrency(invoice.total, settings.currency)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-zinc-900 pt-1">
            <span>Balance Due</span>
            <span>{formatCurrency(invoice.balanceDue || 0, settings.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold underline text-zinc-900 mb-1 text-xs">Terms and Conditions</p>
          <ul className="list-disc list-inside text-[9px] space-y-0.5 text-zinc-600">
            {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => <li key={i}>{term}</li>)}
          </ul>
        </div>
        {invoice.showSignatory && (
          <div className="flex justify-end items-end">
            <div className="w-52 text-center">
              <p className="text-[10px] font-semibold mb-3">For, {settings.companyName}</p>
              <div className="flex justify-center items-center mb-1 h-14">
                {(invoice as any).useDigitalSignature && settings.signatureUrl && (
                  <img
                    src={settings.signatureUrl}
                    alt="Authorised Signature"
                    className="max-h-14 object-contain"
                    style={{ maxWidth: 160 }}
                  />
                )}
              </div>
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
