import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

export const MedicalTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;
  const doctorLabel = (invoice as any).doctorLabel || 'Doctor';

  const bdr = '1.5px solid #52525b';
  const thinBdr = '1px solid #a1a1aa';

  return (
    <div className="invoice-wrap bg-white font-sans text-[11px] flex flex-col" style={{ border: '2.5px solid #27272a', padding: '10px' }}>
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
        <div style={{ borderTop: `2px solid ${themeColor}`, marginBottom: '4px' }} />
        <div className="flex items-center justify-between">
          <div style={{ width: '150px' }} />
          <span
            className="font-black tracking-[0.5em] uppercase"
            style={{ color: themeColor, letterSpacing: '0.45em', fontSize: 'clamp(1.6rem, 2.5vw, 1.8rem)', lineHeight: 1.1 }}
          >
            INVOICE
          </span>
          <span style={{ width: '150px', textAlign: 'right', fontSize: '8px', fontWeight: 600, letterSpacing: '0.05em', color: '#71717a', textTransform: 'uppercase' }}>
            ORIGINAL FOR RECIPIENT
          </span>
        </div>
        <div style={{ borderBottom: `2px solid ${themeColor}`, marginTop: '4px' }} />
      </div>

      <div className="flex justify-between items-center border-y border-zinc-200 py-1 mb-2">
        <div className="flex gap-2">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Invoice No:</span>
          <span className="font-black text-[10px]">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Date:</span>
          <span className="font-black text-[10px]">{invoice.date ? invoice.date.split('-').reverse().join('-') : ''}</span>
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

      <div className="overflow-x-auto -mx-[10px] px-[10px] mb-2">
        <table style={{ borderCollapse: 'collapse', border: bdr, minWidth: '500px', width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: bdr, backgroundColor: '#f9f9f9' }}>
              <th style={{ border: bdr, padding: '2px 4px', width: '20px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sr.</th>
              <th style={{ border: bdr, padding: '2px 4px', textAlign: 'left' }}>Product Name</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '40px', textAlign: 'center', whiteSpace: 'nowrap' }}>Pack</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '56px', textAlign: 'center', whiteSpace: 'nowrap' }}>Batch</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '48px', textAlign: 'center', whiteSpace: 'nowrap' }}>Expiry</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '32px', textAlign: 'center', whiteSpace: 'nowrap' }}>Qty</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '64px', textAlign: 'right', whiteSpace: 'nowrap' }}>MRP</th>
              <th style={{ border: bdr, padding: '2px 4px', width: '64px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: thinBdr }}>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: bdr, padding: '1px 4px' }}>{item.description}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'center', fontSize: '9px', whiteSpace: 'nowrap' }}>{item.unit || '-'}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'center', fontSize: '9px', whiteSpace: 'nowrap' }}>{(item as any).batchNo || '-'}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'center', fontSize: '9px', whiteSpace: 'nowrap' }}>{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>{item.quantity}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{item.unitPrice.toFixed(2)}</td>
                <td style={{ border: bdr, padding: '1px 4px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 'bold', borderTop: bdr }}>
              <td colSpan={5} style={{ border: bdr, padding: '2px 4px', textAlign: 'right', color: '#71717a', fontSize: '10px' }}>Total</td>
              <td style={{ border: bdr, padding: '2px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}>{invoice.items.reduce((s, i) => s + i.quantity, 0)}</td>
              <td style={{ border: bdr, padding: '2px 4px' }}></td>
              <td style={{ border: bdr, padding: '2px 4px', textAlign: 'right', whiteSpace: 'nowrap' }}>{subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', border: bdr }}>
        <div style={{ padding: '6px 8px', borderRight: bdr }}>
          <p className="font-bold uppercase text-[9px] text-zinc-500">Total Invoice Amount in Words</p>
          <p className="font-black text-xs italic">{numberToWords(invoice.total)}</p>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px', borderBottom: thinBdr }}>
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Subtotal</span>
            <span className="font-bold">{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px', borderBottom: thinBdr }}>
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Disc ({invoice.discountPercentage}%)</span>
            <span className="font-bold text-red-500">-{discountAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px', borderBottom: thinBdr }}>
            <span className="font-bold text-zinc-500 uppercase text-[9px]">Round Off</span>
            <span className="font-bold">{invoice.roundOff.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px', borderBottom: thinBdr, backgroundColor: `${themeColor}12`, color: themeColor }} className="font-black text-sm">
            <span>Total</span>
            <span>{invoice.total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 8px' }}>
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
              <p className="text-[10px] font-semibold mb-1">For, {settings.companyName}</p>
              {(invoice as any).useDigitalSignature && settings.signatureUrl ? (
                <img
                  src={settings.signatureUrl}
                  alt="Authorised Signature"
                  className="mx-auto mb-1 max-h-14 object-contain"
                  style={{ maxWidth: 160 }}
                />
              ) : (
                <div style={{ height: '48px' }} />
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
