import React from 'react';
import { Invoice, Settings } from '../../../types';
import { formatCurrency, numberToWords } from '../../../lib/utils';
import { DLNumbers, CompanyName } from '../InvoiceParts';
import { formatExpiry } from '../../shared/ExpiryInput';

interface TemplateProps { invoice: Invoice; settings: Settings; }

const MIN_ROWS = 15;

export const MedicalTemplate = ({ invoice, settings }: TemplateProps) => {
  const { themeColor = '#000000' } = invoice;
  const subtotal = invoice.items.reduce((s, i) => s + i.total, 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = (invoice as any).dlNumbers || settings.dlNumbers;

  const outer = '1.5px solid #000';
  const col = '1px solid #000';

  const fillerCount = Math.max(0, MIN_ROWS - invoice.items.length);

  // Side-only borders for data cells
  const cellBase: React.CSSProperties = {
    borderLeft: col,
    borderRight: col,
    borderTop: 'none',
    borderBottom: 'none',
    padding: '1px 2px',
    fontSize: '9px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  };

  return (
    <div
      className="invoice-wrap bg-white font-sans"
      style={{
        width: '100%',
        maxWidth: '794px',
        aspectRatio: '794 / 561',
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '10px',
        lineHeight: 1.3,
        overflow: 'hidden',
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
        <div style={{ fontSize: '8.5px', fontWeight: 700, minWidth: '140px' }}>
          <DLNumbers dlNumbers={dlNumbers} />
        </div>
        <div style={{ textAlign: 'center', flex: 1, padding: '0 6px' }}>
          <CompanyName
            name={settings.companyName}
            themeColor={themeColor}
            titleSize={(invoice as any).companyTitleSize || settings.companyTitleSize}
          />
          <div style={{ fontWeight: 700, fontSize: '9.5px' }}>{settings.companyAddress}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '9px', fontWeight: 600 }}>
            {settings.companyPhone && <span>Phone {settings.companyPhone}</span>}
            {settings.companyEmail && <span>{settings.companyEmail}</span>}
          </div>
        </div>
        <div style={{ minWidth: '140px' }} />
      </div>

      {/* GSTIN / DL.No */}
      <div style={{ fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>
        {(settings as any).gstin && <span>GSTIN : {(settings as any).gstin}&nbsp;&nbsp;&nbsp;</span>}
        {dlNumbers && Array.isArray(dlNumbers) && dlNumbers.filter((d: string) => d).map((dl: string, i: number) => (
          <span key={i}>D.L.No. : {dl}&nbsp;&nbsp;&nbsp;</span>
        ))}
      </div>

      {/* GST INVOICE title */}
      <div style={{ border: outer, textAlign: 'center', padding: '1px 0' }}>
        <span style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          GST INVOICE
        </span>
      </div>

      {/* Patient info + Invoice No/Date */}
      <div style={{ border: outer, borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <div style={{ padding: '3px 6px', borderRight: col }}>
          <div style={{ fontWeight: 900, fontSize: '10.5px' }}>
            <span style={{ fontWeight: 700 }}>Patient Name : </span>
            <span style={{ textTransform: 'uppercase' }}>{invoice.clientName}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '9.5px' }}>Patient Address :</div>
          {(invoice as any).doctorName && (
            <div style={{ fontWeight: 700, fontSize: '9.5px' }}>
              Dr Name : <span style={{ textTransform: 'uppercase' }}>{(invoice as any).doctorName}</span>
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: '9.5px' }}>Dr Reg No.</div>
        </div>
        <div style={{ padding: '3px 8px', minWidth: '170px' }}>
          <div style={{ fontWeight: 700, fontSize: '9.5px', marginBottom: '2px' }}>
            Invoice No. : &nbsp;<span style={{ fontWeight: 900 }}>{invoice.invoiceNumber}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: '9.5px' }}>
            Date: {invoice.date ? invoice.date.split('-').reverse().join('-') : ''}
          </div>
        </div>
      </div>

      {/* ITEMS TABLE — side borders only, MIN_ROWS always shown */}
      <div style={{ border: outer, borderTop: 'none', flex: 1, overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22px' }} />
            <col style={{ width: '38px' }} />
            <col />{/* product — flexible */}
            <col style={{ width: '30px' }} />
            <col style={{ width: '48px' }} />
            <col style={{ width: '40px' }} />{/* expiry — wider */}
            <col style={{ width: '24px' }} />
            <col style={{ width: '54px' }} />
            <col style={{ width: '56px' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: col }}>
              {[
                ['SN.', 'center'],
                ['HSN', 'center'],
                ['PRODUCT NAME', 'left'],
                ['PACK', 'center'],
                ['BATCH', 'center'],
                ['EXP.', 'center'],
                ['QTY', 'center'],
                ['M.R.P.', 'right'],
                ['AMOUNT', 'right'],
              ].map(([label, align], i, arr) => (
                <th
                  key={label}
                  style={{
                    borderRight: i < arr.length - 1 ? col : 'none',
                    padding: '2px 2px',
                    textAlign: align as any,
                    fontWeight: 800,
                    fontSize: '8.5px',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td style={{ ...cellBase, borderLeft: 'none', textAlign: 'center' }}>{i + 1}.</td>
                <td style={{ ...cellBase, textAlign: 'center', fontSize: '8.5px' }}>{(item as any).hsn || ''}</td>
                <td style={{ ...cellBase, padding: '1px 4px', whiteSpace: 'normal' }}>{item.description}</td>
                <td style={{ ...cellBase, textAlign: 'center', fontSize: '8.5px' }}>{item.unit || ''}</td>
                <td style={{ ...cellBase, textAlign: 'center', fontSize: '8.5px' }}>{(item as any).batchNo || ''}</td>
                <td style={{ ...cellBase, textAlign: 'center', fontSize: '8.5px', whiteSpace: 'normal' }}>{formatExpiry((item as any).expiryDate, (item as any).expiryMode)}</td>
                <td style={{ ...cellBase, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...cellBase, textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                <td style={{ ...cellBase, borderRight: 'none', textAlign: 'right', fontWeight: 700 }}>{item.total.toFixed(2)}</td>
              </tr>
            ))}
            {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`f${i}`}>
                <td style={{ ...cellBase, borderLeft: 'none' }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase, padding: '1px 4px' }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase }}>&nbsp;</td>
                <td style={{ ...cellBase, borderRight: 'none' }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUB TOTAL / DISCOUNT / GRAND TOTAL */}
      <div style={{ border: outer, borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <div style={{ borderRight: col, padding: '2px 6px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '9px', fontWeight: 700 }}>
            <span>SUB TOTAL</span>
            <span style={{ minWidth: '55px', textAlign: 'right' }}>{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '9px', fontWeight: 700 }}>
            <span>DISCOUNT</span>
            <span style={{ minWidth: '55px', textAlign: 'right' }}>{discountAmount.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '155px' }}>
          <span style={{ fontWeight: 900, fontSize: '10.5px', letterSpacing: '0.04em' }}>GRAND TOTAL</span>
          <span style={{ fontWeight: 900, fontSize: '10.5px' }}>{invoice.total.toFixed(2)}</span>
        </div>
      </div>

      {/* GST / Terms / Signatory */}
      <div style={{ border: outer, borderTop: 'none', display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <div style={{ borderRight: col, padding: '3px 6px' }}>
          <div style={{ fontSize: '8px', fontWeight: 600, marginBottom: '2px' }}>
            GST {subtotal.toFixed(2)}*2.5+2.5%={(subtotal * 0.025).toFixed(2)}SGST+{(subtotal * 0.025).toFixed(2)}CGST,
            &nbsp;&nbsp;** GET WELL SOON **
          </div>
          <div style={{ fontWeight: 800, fontSize: '8.5px', marginBottom: '1px', textDecoration: 'underline' }}>Terms &amp; Conditions</div>
          <div style={{ fontSize: '8px', color: '#222', lineHeight: 1.4 }}>
            {invoice.terms
              ? invoice.terms.split('\n').filter(t => t.trim()).map((term, i) => <div key={i}>{term}</div>)
              : (
                <>
                  <div>Goods once sold will not be taken back or exchanged.</div>
                  <div>Bills not paid due date will attract 24% interest.</div>
                  <div>All disputes subject to Jurisdiction only.</div>
                  <div>Prescribed Sales Tax declaration will be given.</div>
                </>
              )
            }
          </div>
          <div style={{ fontWeight: 800, fontSize: '9px', marginTop: '2px' }}>Remark :</div>
          <div style={{ fontWeight: 900, fontSize: '9px', marginTop: '2px' }}>
            Rs. {numberToWords(invoice.total)} only
          </div>
        </div>
        <div style={{ padding: '3px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', minWidth: '140px' }}>
          <div style={{ flex: 1 }}>
            {invoice.showSignatory && (invoice as any).useDigitalSignature && settings.signatureUrl && (
              <img
                src={settings.signatureUrl}
                alt="Authorised Signature"
                style={{ maxHeight: '36px', maxWidth: '110px', objectFit: 'contain' }}
              />
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: '9px', textAlign: 'right' }}>
            Authorised Signatory
          </div>
        </div>
      </div>
    </div>
  );
};
