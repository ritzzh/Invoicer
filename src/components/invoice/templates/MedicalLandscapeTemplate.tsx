import React from 'react';
import { Invoice, Settings } from '../../../types';
import { numberToWords } from '../../../lib/utils';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

const B = '1px solid #000';
const N = 'none';
const T = '1px solid #aaa';

const MIN_ROWS = 15;

const TableHead = () => (
  <thead>
    <tr style={{ backgroundColor: '#f2f2f2' }}>
      {([
        ['SN.', '18px'],
        ['PRODUCT NAME', 'auto'],
        ['PACK', '55px'],
        ['BATCH', '55px'],
        ['HSN', '55px'],
        ['EXP.', '55px'],
        ['QTY', '35px'],
        ['M.R.P.', '55px'],
        ['AMOUNT', '55px'],
      ] as [string, string][]).map(([label, w]) => (
        <th
          key={label}
          style={{
            borderLeft: B,
            borderRight: B,
            borderTop: N,
            borderBottom: N,
            padding: '2px 3px',
            fontSize: '8px',
            fontWeight: 800,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            width: w === 'auto' ? undefined : w,
          }}
        >
          {label}
        </th>
      ))}
    </tr>
  </thead>
);

export const MedicalLandscapeTemplate = ({ invoice, settings }: TemplateProps) => {
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = ((invoice as any).dlNumbers || settings.dlNumbers || []).filter(Boolean);
  const doctorLabel = (invoice as any).doctorLabel || 'Dr Name';
  const gstNumber = (settings as any).gstNumber || '';
  const dateFormatted = invoice.date ? invoice.date.split('-').reverse().join('-') : '';

  // Side-only border style for data cells
  const sideBorder: React.CSSProperties = {
    borderLeft: B,
    borderRight: B,
    borderTop: N,
    borderBottom: N,
  };

  // Filler rows to always show MIN_ROWS rows total
  const fillerCount = Math.max(0, MIN_ROWS - invoice.items.length);

  return (
    <div
      className="invoice-wrap bg-white font-sans"
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '5px 8px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ROW 1: Company (left) | Patient/Doctor/Invoice (right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: B }}>
          <div style={{ borderRight: B, padding: '4px 6px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontWeight: 900,
              fontSize: 'clamp(0.72rem, 2.2vw, 1rem)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}>
              {settings.companyName}
            </div>
            {settings.companyAddress && (
              <div style={{ fontSize: '7.5px', fontWeight: 600, marginTop: '2px', lineHeight: 1.3 }}>
                {settings.companyAddress}
              </div>
            )}
            <div style={{ fontSize: '7.5px', fontWeight: 600, marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {settings.companyPhone && <span>✆ {settings.companyPhone}</span>}
              {settings.companyEmail && <span>✉ {settings.companyEmail}</span>}
            </div>
          </div>

          <div style={{ padding: '4px 6px', fontSize: '8px' }}>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: 700 }}>{invoice.clientLabel}: </span>
              <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{invoice.clientName}</span>
            </div>
            <div style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: 700 }}>Patient Address: </span>
              <span style={{ fontWeight: 600 }}>{invoice.clientAddress}</span>
            </div>
            {(invoice as any).doctorName && (
              <div style={{ marginBottom: '2px' }}>
                <span style={{ fontWeight: 700 }}>{doctorLabel}: </span>
                <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{(invoice as any).doctorName}</span>
              </div>
            )}
            <div style={{ marginBottom: '2px' }}>
              <span style={{ fontWeight: 700 }}>Dr Reg No.: </span>
              <span style={{ fontWeight: 600 }}>{''}</span>
            </div>
          </div>
        </div>

        {/* ROW 2: 3-column strip — DL/GSTIN | GST INVOICE | Invoice No/Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: B, borderTop: 'none' }}>
          <div style={{ display: 'flex',flexDirection: 'column' ,borderRight: B, padding: '3px 5px', fontSize: '7.5px', fontWeight: 700, lineHeight: 1.5 }}>
            <span>GSTIN: {gstNumber && <div>{gstNumber}</div>}</span>
            <span>DL: {dlNumbers.join(', ')}</span>
          </div>
          <div style={{
            borderRight: B,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px 4px',
            fontWeight: 900,
            fontSize: '11px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            backgroundColor: '#f5f5f5',
          }}>
            GST INVOICE
          </div>
          <div style={{ display: 'flex',flexDirection: 'row', justifyContent: 'space-between' ,padding: '3px 5px', fontSize: '7.5px', lineHeight: 1.6 }}>
            <div>
              <span style={{ fontWeight: 700 }}>Invoice No.: </span>
              <span style={{ fontWeight: 900 }}>{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span style={{ fontWeight: 700 }}>Date: </span>
              <span style={{ fontWeight: 900 }}>{dateFormatted}</span>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE — side borders only on data cells, MIN_ROWS always */}
        <div>
          <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            tableLayout: 'fixed',
            border: B,
            borderTop: 'none',
          }}>
            <TableHead />
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px' }}>{i + 1}</td>
                  <td style={{ ...sideBorder, padding: '1px 4px', fontSize: '8px', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>
                    {item.description}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px', whiteSpace: 'nowrap' }}>
                    {item.unit || '-'}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px', whiteSpace: 'nowrap' }}>
                    {(item as any).batchNo || '-'}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px', whiteSpace: 'nowrap' }}>
                    {(item as any).hsn || '-'}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px', whiteSpace: 'normal' }}>
                    {formatExpiry((item as any).expiryDate, (item as any).expiryMode)}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 3px', textAlign: 'center', fontSize: '8px' }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 4px', textAlign: 'right', fontSize: '8px', whiteSpace: 'nowrap' }}>
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ ...sideBorder, padding: '1px 4px', textAlign: 'right', fontSize: '8px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Filler rows to reach MIN_ROWS */}
              {Array.from({ length: fillerCount }).map((_, i) => (
                <tr key={`f${i}`}>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 4px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 3px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 4px', fontSize: '8px' }}>&nbsp;</td>
                  <td style={{ ...sideBorder, padding: '1px 4px', fontSize: '8px' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 700 }}>
                <td colSpan={6} style={{ border: B, padding: '1px 4px', textAlign: 'right', fontSize: '8px' }}>Total</td>
                <td style={{ border: B, padding: '1px 3px', textAlign: 'center', fontSize: '8px' }}>
                  {invoice.items.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td style={{ border: B, padding: '1px 3px' }} />
                <td style={{ border: B, padding: '1px 4px', textAlign: 'right', fontSize: '8px' }}>
                  {subtotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BOTTOM BOX */}
        <div style={{
          border: B,
          borderTop: 'none',
          display: 'grid',
          gridTemplateColumns: '7fr 3fr',
          minHeight: '26mm',
        }}>
          {/* LEFT: Terms + Amount in Words + Signatory */}
          <div style={{
            borderRight: B,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'end',
            padding: '4px 6px',
          }}>
            <div>
              {invoice.terms && (
                <>
                  <div style={{ fontSize: '7.5px', fontWeight: 800, textDecoration: 'underline', marginBottom: '2px', textTransform: 'uppercase' }}>
                    Terms &amp; Conditions
                  </div>
                  <div style={{ fontSize: '7.5px', fontWeight: 600, lineHeight: 1.45 }}>
                    {invoice.terms.split('\n').filter(t => t.trim()).map((term, i) => (
                      <div key={i}>{term}</div>
                    ))}
                  </div>
                </>
              )}
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase' }}>Amount in Words: </span>
                <span style={{ fontSize: '8px', fontWeight: 900, fontStyle: 'italic' }}>{numberToWords(invoice.total)}</span>
              </div>
            </div>

            {invoice.showSignatory && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '7.5px', fontWeight: 700, marginBottom: '2px' }}>
                    For, {settings.companyName}
                  </div>
                  {(invoice as any).useDigitalSignature && settings.signatureUrl ? (
                    <img
                      src={settings.signatureUrl}
                      alt="Authorised Signature"
                      style={{ maxHeight: '24px', maxWidth: '90px', objectFit: 'contain', margin: '0 auto 2px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ height: '22px' }} />
                  )}
                  <div style={{ borderTop: B, paddingTop: '2px' }}>
                    <div style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Authorised Signatory
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sub Total / Discount / Grand Total */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: T, fontSize: '8px', fontWeight: 700 }}>
                <span>SUB TOTAL</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 6px', borderBottom: T, fontSize: '8px', fontWeight: 700 }}>
                <span>DISCOUNT</span>
                <span style={{ color: discountAmount > 0 ? '#aa0000' : '#000' }}>
                  {discountAmount > 0 ? `-${discountAmount.toFixed(2)}` : '0.00'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: '#000', color: '#fff', fontSize: '9px', fontWeight: 900, letterSpacing: '0.03em' }}>
              <span>GRAND TOTAL</span>
              <span>{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
