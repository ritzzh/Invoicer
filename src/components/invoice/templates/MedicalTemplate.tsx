import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { InvoiceTitle, DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

export const MedicalTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;
  const doctorLabel = (invoice as any).doctorLabel || 'Doctor';

  return (
    <div className="invoice-wrap px-3 py-3 bg-white font-sans text-[11px] border border-zinc-300 flex flex-col">
      <div className="text-center space-y-0.5 mb-1">
        <div className="flex justify-end mb-0.5">
          <DLNumbers dlNumbers={dlNumbers} />
        </div>
        <CompanyName name={settings.companyName} themeColor={themeColor} titleSize={(invoice as any).companyTitleSize || settings.companyTitleSize} />
        <p className="font-bold text-zinc-600 text-xs">{settings.companyAddress}</p>
        <div className="flex justify-center gap-4 text-[10px] text-zinc-500 flex-wrap">
          {settings.companyPhone && <p>✆ {settings.companyPhone}</p>}
          {settings.companyEmail && <p>✉ {settings.companyEmail}</p>}
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

      <div className="flex justify-between items-center border-y border-zinc-200 py-1 mb-2">
        <div className="flex gap-2">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Invoice No:</span>
          <span className="font-black text-[10px]">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Date:</span>
          <span className="font-black text-[10px]">{invoice.date}</span>
        </div>
      </div>

      <div className="mb-2 space-y-0.5">
        <p className="font-black text-xs">
          <span className="text-zinc-500 font-bold">{invoice.clientLabel}: </span>
          <span className="uppercase">{invoice.clientName}</span>
        </p>
        {(invoice as any).doctorName && (
          <p className="font-black text-xs text-zinc-700">
            <span className="font-bold text-zinc-500">{doctorLabel}: </span>
            <span className="uppercase">{(invoice as any).doctorName}</span>
          </p>
        )}
        {invoice.clientPhone && <p className="text-[10px] text-zinc-500">✆ {invoice.clientPhone}</p>}
      </div>

      <div className="overflow-x-auto -mx-3 px-3 mb-2">
        <table className="border-collapse border border-zinc-400" style={{ minWidth: '500px', width: '100%' }}>
          <thead>
            <tr className="border-b border-zinc-400 bg-zinc-50">
              <th className="border-r border-zinc-400 py-[2px] px-1 w-5 text-center whitespace-nowrap">Sr.</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 text-left">Product</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 w-10 text-center whitespace-nowrap">Unit</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 w-14 text-center whitespace-nowrap">Batch</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 w-12 text-center whitespace-nowrap">Expiry</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 w-8 text-center whitespace-nowrap">Qty</th>
              <th className="border-r border-zinc-400 py-[2px] px-1 w-16 text-right whitespace-nowrap">MRP</th>
              <th className="py-[2px] px-1 w-16 text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="border-r border-zinc-400 py-[1px] px-1 text-center">{i + 1}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1">{item.description}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1 text-center text-[9px] whitespace-nowrap">{item.unit || '-'}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1 text-center text-[9px] whitespace-nowrap">{(item as any).batchNo || '-'}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1 text-center text-[9px] whitespace-nowrap">{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1 text-center whitespace-nowrap">{item.quantity}</td>
                <td className="border-r border-zinc-400 py-[1px] px-1 text-right whitespace-nowrap">{item.unitPrice.toFixed(2)}</td>
                <td className="py-[1px] px-1 text-right font-bold whitespace-nowrap">{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-50 font-bold border-t border-zinc-400">
              <td colSpan={5} className="border-r border-zinc-400 py-[2px] px-1 text-right text-zinc-500 text-[10px]">Total</td>
              <td className="border-r border-zinc-400 py-[2px] px-1 text-center whitespace-nowrap">{invoice.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td className="border-r border-zinc-400 py-[2px] px-1"></td>
              <td className="py-[2px] px-1 text-right whitespace-nowrap">{subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid grid-cols-12 border border-zinc-400">
        <div className="col-span-7 px-2 py-1.5 border-r border-zinc-400">
          <p className="font-bold uppercase text-[9px] text-zinc-500">Total Invoice Amount in Words</p>
          <p className="font-black text-xs italic">{numberToWords(invoice.total)}</p>
        </div>
        <div className="col-span-5 divide-y divide-zinc-200">
          <div className="flex justify-between px-2 py-0.5">
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Subtotal</span>
            <span className="font-bold">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5">
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Disc ({invoice.discountPercentage}%)</span>
            <span className="font-bold text-red-500">-{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5">
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Round Off</span>
            <span className="font-bold">{invoice.roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5 font-black text-sm" style={{ backgroundColor: `${themeColor}12`, color: themeColor }}>
            <span>Total</span>
            <span>{invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between px-2 py-0.5">
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Balance Due</span>
            <span className="font-bold">{invoice.balanceDue?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="font-bold underline text-zinc-900 mb-1 text-[10px]">Terms and Conditions</p>
          <ul className="list-disc list-inside text-[9px] space-y-0.5 text-zinc-600">
            {invoice.terms?.split('\n').filter(t => t.trim()).map((term, i) => <li key={i}>{term}</li>)}
          </ul>
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
