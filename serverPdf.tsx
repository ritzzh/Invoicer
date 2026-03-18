import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, pdf, Image,
} from '@react-pdf/renderer';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function numberToWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ',
    'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ',
    'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if ((num = Math.floor(num)).toString().length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += +n[1] ? (a[+n[1]] || b[n[1][0]] + ' ' + a[+n[1][1]]) + 'crore ' : '';
  str += +n[2] ? (a[+n[2]] || b[n[2][0]] + ' ' + a[+n[2][1]]) + 'lakh ' : '';
  str += +n[3] ? (a[+n[3]] || b[n[3][0]] + ' ' + a[+n[3][1]]) + 'thousand ' : '';
  str += +n[4] ? (a[+n[4]] || b[n[4][0]] + ' ' + a[+n[4][1]]) + 'hundred ' : '';
  str += +n[5] ? ((str ? 'and ' : '') + (a[+n[5]] || b[n[5][0]] + ' ' + a[+n[5][1]])) : '';
  return str.toUpperCase() + 'RUPEES ONLY';
}

function formatExpiry(date?: string, mode?: string): string {
  if (!date) return '-';
  if (mode === 'monthyear') {
    const d = new Date(date);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return date;
}

function dynFontSize(name: string, override?: number): number {
  if (override && override > 0) return override;
  const l = name?.length || 0;
  // Scale down aggressively for long names to stay on one line in A4
  if (l <= 10) return 26;
  if (l <= 15) return 22;
  if (l <= 20) return 18;
  if (l <= 25) return 15;
  if (l <= 32) return 13;
  if (l <= 40) return 11;
  return 9;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, paddingHorizontal: 20, paddingVertical: 22, backgroundColor: '#ffffff' },
  row:    { flexDirection: 'row' },
  bold:   { fontFamily: 'Helvetica-Bold' },
  right:  { textAlign: 'right' },
  center: { textAlign: 'center' },
  muted:  { color: '#27272a' },
  tiny:   { fontSize: 8 },
  small:  { fontSize: 9 },
});

// ── Shared sub-components ─────────────────────────────────────────────────────

const DLRow = ({ dlNumbers }: { dlNumbers?: string[] }) => {
  const filled = (dlNumbers || []).filter((d: string) => d?.trim());
  if (!filled.length) return null;
  return (
    <View style={{ alignItems: 'flex-end', marginBottom: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={[S.tiny, S.bold, { marginRight: 2 }]}>DL:</Text>
        <View>
          {filled.map((d: string, i: number) => (
            <Text key={i} style={[S.tiny, S.bold]}>{d}</Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const CompanyHeader = ({ settings, theme, invoiceTitleSize }: { settings: any; theme: string; invoiceTitleSize?: number }) => (
  <View style={{ alignItems: 'center', marginBottom: 6 }}>
    <Text
      style={[S.bold, {
        fontSize: dynFontSize(settings.companyName, invoiceTitleSize || settings.companyTitleSize),
        color: theme,
        textTransform: 'uppercase',
        textAlign: 'center',
      }]}
      numberOfLines={1}
    >
      {settings.companyName}
    </Text>
    {settings.companyAddress
      ? <Text style={[S.small, S.bold, S.muted, { marginTop: 2, textAlign: 'center' }]}>{settings.companyAddress}</Text>
      : null}
    <View style={[S.row, { marginTop: 3, gap: 14, justifyContent: 'center' }]}>
      {settings.companyPhone ? <Text style={[{ fontSize: 9.5 }, S.bold, S.muted]}>✆ {settings.companyPhone}</Text> : null}
      {settings.companyEmail ? <Text style={[{ fontSize: 9.5 }, S.bold, S.muted]}>✉ {settings.companyEmail}</Text> : null}
    </View>
  </View>
);

const TotalsBlock = ({ invoice, currency, theme }: { invoice: any; currency: string; theme: string }) => {
  const subtotal = invoice.items.reduce((s: number, i: any) => s + i.total, 0);
  const disc = subtotal * (invoice.discountPercentage / 100);
  return (
    <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
      <View style={{ width: 200 }}>
        <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
          <Text style={[S.small, S.muted]}>Sub Total</Text>
          <Text style={S.small}>{subtotal.toFixed(2)}</Text>
        </View>
        {invoice.discountPercentage > 0 && (
          <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
            <Text style={[S.small, S.muted]}>Discount ({invoice.discountPercentage}%)</Text>
            <Text style={[S.small, { color: '#ef4444' }]}>-{disc.toFixed(2)}</Text>
          </View>
        )}
        <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
          <Text style={[S.small, S.muted]}>Round Off</Text>
          <Text style={S.small}>{invoice.roundOff.toFixed(2)}</Text>
        </View>
        <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1.5, borderTopColor: '#18181b', marginTop: 2 }]}>
          <Text style={[S.bold, { fontSize: 13 }]}> Grand Total</Text>
          <Text style={[S.bold, { fontSize: 13, color: theme }]}>{fmt(invoice.total, currency)}</Text>
        </View>
      </View>
    </View>
  );
};

const TermsBlock = ({ terms, showSignatory, companyName, useDigitalSignature, signatureUrl }: { terms?: string; showSignatory?: boolean; companyName: string; useDigitalSignature?: boolean; signatureUrl?: string }) => (
  <View style={[S.row, { marginTop: 16, justifyContent: 'space-between' }]}>
    {terms ? (
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={[S.bold, S.tiny, { textDecoration: 'underline', textTransform: 'uppercase', marginBottom: 3 }]}>Terms and Conditions</Text>
        {terms.split('\n').filter((t: string) => t.trim()).map((t: string, i: number) => (
          <Text key={i} style={[S.tiny, S.muted, { marginBottom: 1 }]}>• {t}</Text>
        ))}
      </View>
    ) : <View />}
    {showSignatory && (
      <View style={{ width: 140, alignItems: 'center' }}>
        <Text style={[S.tiny, S.bold, { marginBottom: 4 }]}>For, {companyName}</Text>
        {useDigitalSignature && signatureUrl ? (
          <Image src={signatureUrl} style={{ width: 120, height: 40, objectFit: 'contain', marginBottom: 4 }} />
        ) : (
          <View style={{ height: 40 }} />
        )}
        <View style={{ borderTopWidth: 1, borderTopColor: '#18181b', width: '100%', paddingTop: 3, alignItems: 'center' }}>
          <Text style={[S.bold, S.tiny, { textTransform: 'uppercase', letterSpacing: 1 }]}>Authorised Signatory</Text>
        </View>
      </View>
    )}
  </View>
);

// ── Medical Template ──────────────────────────────────────────────────────────

const MedicalPDF = ({ invoice, settings }: { invoice: any; settings: any }) => {
  const theme = invoice.themeColor || '#000000';
  const currency = settings.currency || 'INR';
  const subtotal = invoice.items.reduce((s: number, i: any) => s + i.total, 0);
  const disc = subtotal * (invoice.discountPercentage / 100);
  const dlNumbers = invoice.dlNumbers?.length ? invoice.dlNumbers : settings.dlNumbers;
  const doctorLabel = invoice.doctorLabel || 'Doctor';
  const colW = ['5%', '28%', '8%', '12%', '10%', '8%', '14%', '15%'];
  const headers = ['Sr.', 'Product Name', 'Pack', 'Batch', 'Expiry', 'Qty', 'MRP', 'Amount'];

  // Format date as DD-MM-YYYY
  const formattedDate = invoice.date ? invoice.date.split('-').reverse().join('-') : '';

  const bdrColor = '#52525b';
  const bdrWidth = 1.5;
  const thinBdrColor = '#a1a1aa';

  return (
    <Page size="A4" style={S.page}>
      <DLRow dlNumbers={dlNumbers} />
      <CompanyHeader settings={settings} theme={theme} invoiceTitleSize={invoice.companyTitleSize} />

      {/* INVOICE title row with full box border and ORIGINAL FOR RECIPIENT at right */}
      <View style={{ marginVertical: 4, borderWidth: 2, borderColor: theme, flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#f5f5f5' }}>
        <View style={{ flex: 1 }} />
        <Text style={[S.bold, { fontSize: 20, color: theme, letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center' }]}>INVOICE</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[{ fontSize: 7.5 }, S.muted, { textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'right' }]}>ORIGINAL FOR RECIPIENT</Text>
        </View>
      </View>

      {/* Invoice No + Date */}
      <View style={[S.row, { justifyContent: 'space-between', borderWidth: bdrWidth, borderColor: bdrColor, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8 }]}>
        <Text style={S.small}><Text style={[S.bold, { color: '#27272a' }]}>Invoice No: </Text>{invoice.invoiceNumber}</Text>
        <Text style={S.small}><Text style={[S.bold, { color: '#27272a' }]}>Date: </Text>{formattedDate}</Text>
      </View>

      {/* Client info */}
      <View style={{ marginBottom: 8 }}>
        <Text style={[S.bold, { fontSize: 11 }]}>
          <Text style={{ fontFamily: 'Helvetica', color: '#27272a' }}>{invoice.clientLabel || 'Patient'}: </Text>
          {(invoice.clientName || '').toUpperCase()}
        </Text>
        {invoice.doctorName ? (
          <Text style={[S.bold, { fontSize: 10, marginTop: 2 }]}>
            <Text style={{ fontFamily: 'Helvetica', color: '#27272a' }}>{doctorLabel}: </Text>
            {invoice.doctorName.toUpperCase()}
          </Text>
        ) : null}
        {invoice.clientPhone ? <Text style={[S.tiny, S.muted, { marginTop: 2 }]}>Tel: {invoice.clientPhone}</Text> : null}
      </View>

      {/* Items table with bold borders */}
      <View style={{ borderWidth: bdrWidth, borderColor: bdrColor, marginBottom: 8 }}>
        {/* Header row */}
        <View style={[S.row, { backgroundColor: '#f4f4f5', borderBottomWidth: bdrWidth, borderBottomColor: bdrColor }]}>
          {headers.map((h, i) => (
            <Text key={i} style={[S.bold, S.tiny, {
              width: colW[i], padding: 4, textTransform: 'uppercase',
              textAlign: i === 0 ? 'center' : i >= 5 ? 'right' : 'left',
              borderRightWidth: i < headers.length - 1 ? bdrWidth : 0,
              borderRightColor: bdrColor,
            }]}>{h}</Text>
          ))}
        </View>
        {/* Item rows */}
        {invoice.items.map((item: any, idx: number) => (
          <View key={idx} style={[S.row, { borderBottomWidth: 0.5, borderBottomColor: thinBdrColor }]}>
            <Text style={[S.tiny, { width: colW[0], padding: 3, textAlign: 'center', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{idx + 1}</Text>
            <Text style={[S.tiny, { width: colW[1], padding: 3, borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{item.description}</Text>
            <Text style={[S.tiny, { width: colW[2], padding: 3, textAlign: 'center', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{item.unit || '-'}</Text>
            <Text style={[S.tiny, { width: colW[3], padding: 3, textAlign: 'center', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{item.batchNo || '-'}</Text>
            <Text style={[S.tiny, { width: colW[4], padding: 3, textAlign: 'center', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{formatExpiry(item.expiryDate, item.expiryMode)}</Text>
            <Text style={[S.tiny, { width: colW[5], padding: 3, textAlign: 'right', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{item.quantity}</Text>
            <Text style={[S.tiny, { width: colW[6], padding: 3, textAlign: 'right', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={[S.bold, S.tiny, { width: colW[7], padding: 3, textAlign: 'right' }]}>{item.total.toFixed(2)}</Text>
          </View>
        ))}
        {/* Footer total row */}
        <View style={[S.row, { backgroundColor: '#f4f4f5', borderTopWidth: bdrWidth, borderTopColor: bdrColor }]}>
          <Text style={[S.bold, S.tiny, { width: '63%', padding: 4, textAlign: 'right', color: '#27272a', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>Total</Text>
          <Text style={[S.bold, S.tiny, { width: '8%', padding: 4, textAlign: 'right', borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}>{invoice.items.reduce((s: number, i: any) => s + i.quantity, 0)}</Text>
          <Text style={[S.tiny, { width: '14%', padding: 4, borderRightWidth: bdrWidth, borderRightColor: bdrColor }]}></Text>
          <Text style={[S.bold, S.tiny, { width: '15%', padding: 4, textAlign: 'right' }]}>{subtotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Summary block */}
      <View style={[S.row, { borderWidth: bdrWidth, borderColor: bdrColor, marginBottom: 12 }]}>
        <View style={{ flex: 7, padding: 8, borderRightWidth: bdrWidth, borderRightColor: bdrColor }}>
          <Text style={[S.bold, S.tiny, { textTransform: 'uppercase', color: '#27272a', marginBottom: 3 }]}>Total Amount in Words</Text>
          <Text style={[S.bold, { fontSize: 10 }]}>{numberToWords(invoice.total)}</Text>
        </View>
        <View style={{ flex: 5 }}>
          {([['SUB TOTAL', subtotal.toFixed(2), false], [`DISC (${invoice.discountPercentage}%)`, `-${disc.toFixed(2)}`, true], ['ROUND OFF', invoice.roundOff.toFixed(2), false]] as [string, string, boolean][]).map(([label, val, red], i) => (
            <View key={i} style={[S.row, { justifyContent: 'space-between', padding: 3, borderBottomWidth: 0.5, borderBottomColor: thinBdrColor }]}>
              <Text style={[S.bold, S.tiny, S.muted]}>{label}</Text>
              <Text style={[S.bold, S.tiny, red ? { color: '#ef4444' } : {}]}>{val}</Text>
            </View>
          ))}
          <View style={[S.row, { justifyContent: 'space-between', padding: 4, borderBottomWidth: 0.5, borderBottomColor: thinBdrColor, backgroundColor: `${theme}18` }]}>
            <Text style={[S.bold, { fontSize: 12, color: theme }]}>GRAND TOTAL</Text>
            <Text style={[S.bold, { fontSize: 12, color: theme }]}>{invoice.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <TermsBlock terms={invoice.terms} showSignatory={invoice.showSignatory} companyName={settings.companyName} useDigitalSignature={invoice.useDigitalSignature} signatureUrl={settings.signatureUrl} />
    </Page>
  );
};

// ── Modern / Classic / Minimal Template ──────────────────────────────────────

const ModernPDF = ({ invoice, settings }: { invoice: any; settings: any }) => {
  const theme = invoice.themeColor || '#000000';
  const currency = settings.currency || 'INR';
  const dlNumbers = invoice.dlNumbers?.length ? invoice.dlNumbers : settings.dlNumbers;
  const doctorLabel = invoice.doctorLabel || 'Doctor';
  const isMinimal = invoice.template === 'minimal';
  const headerBg = isMinimal ? '#ffffff' : '#18181b';
  const headerColor = isMinimal ? '#18181b' : '#ffffff';
  const colW = ['30%', '9%', '18%', '11%', '14%', '18%'];
  const headers = ['Description', 'Unit', 'Batch / Expiry', 'Qty', 'MRP', 'Amount'];

  return (
    <Page size="A4" style={S.page}>
      <DLRow dlNumbers={dlNumbers} />
      <CompanyHeader settings={settings} theme={theme} invoiceTitleSize={invoice.companyTitleSize} />

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[S.bold, { fontSize: 18, color: theme, letterSpacing: 4, textTransform: 'uppercase' }]}>INVOICE</Text>
        <Text style={[S.tiny, S.muted, { textAlign: 'center' }]}>ORIGINAL FOR RECIPIENT</Text>
      </View>

      <View style={[S.row, { justifyContent: 'space-between', backgroundColor: '#f4f4f5', padding: 10, borderRadius: 6, marginBottom: 12 }]}>
        <View>
          <Text style={[S.tiny, S.muted, { textTransform: 'uppercase', letterSpacing: 1 }]}>Invoice Number</Text>
          <Text style={[S.bold, { fontSize: 13, color: theme }]}>#{invoice.invoiceNumber}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[S.tiny, S.muted, { textTransform: 'uppercase', letterSpacing: 1 }]}>Invoice Date</Text>
          <Text style={[S.bold, { fontSize: 13 }]}>{invoice.date}</Text>
        </View>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={[S.tiny, S.muted, { textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }]}>Bill To</Text>
        <Text style={[S.bold, { fontSize: 12 }]}>
          <Text style={{ fontFamily: 'Helvetica', color: '#27272a' }}>{invoice.clientLabel || 'Client'}: </Text>
          {(invoice.clientName || '').toUpperCase()}
        </Text>
        {invoice.doctorName ? (
          <Text style={[S.bold, { fontSize: 11, marginTop: 2 }]}>
            <Text style={{ fontFamily: 'Helvetica', color: '#27272a' }}>{doctorLabel}: </Text>
            {invoice.doctorName.toUpperCase()}
          </Text>
        ) : null}
        {invoice.clientEmail ? <Text style={[S.tiny, S.muted, { marginTop: 2 }]}>{invoice.clientEmail}</Text> : null}
        {invoice.clientPhone ? <Text style={[S.tiny, S.muted]}>Tel: {invoice.clientPhone}</Text> : null}
      </View>

      <View style={{ marginBottom: 8 }}>
        <View style={[S.row, { backgroundColor: headerBg, borderRadius: 4, paddingVertical: 6 }]}>
          {headers.map((h, i) => (
            <Text key={i} style={[S.bold, S.tiny, { width: colW[i], paddingHorizontal: 6, color: headerColor, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: i >= 3 ? 'right' : 'left' }]}>{h}</Text>
          ))}
        </View>
        {invoice.items.map((item: any, idx: number) => (
          <View key={idx} style={[S.row, { borderBottomWidth: 0.5, borderBottomColor: '#e4e4e7', paddingVertical: 5 }]}>
            <Text style={[S.small, { width: colW[0], paddingHorizontal: 6 }]}>{item.description}</Text>
            <Text style={[S.tiny, { width: colW[1], paddingHorizontal: 6, textAlign: 'center' }]}>{item.unit || '-'}</Text>
            <Text style={[S.tiny, { width: colW[2], paddingHorizontal: 6, textAlign: 'center' }]}>{item.batchNo || '-'} / {formatExpiry(item.expiryDate, item.expiryMode)}</Text>
            <Text style={[S.small, { width: colW[3], paddingHorizontal: 6, textAlign: 'right' }]}>{item.quantity}</Text>
            <Text style={[S.small, { width: colW[4], paddingHorizontal: 6, textAlign: 'right' }]}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={[S.bold, S.small, { width: colW[5], paddingHorizontal: 6, textAlign: 'right' }]}>{item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <TotalsBlock invoice={invoice} currency={currency} theme={theme} />
      <TermsBlock terms={invoice.terms} showSignatory={invoice.showSignatory} companyName={settings.companyName} useDigitalSignature={invoice.useDigitalSignature} signatureUrl={settings.signatureUrl} />
    </Page>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────

export async function buildInvoicePdfBuffer(invoice: any, settings: any): Promise<Buffer> {
  // Ensure items is always an array
  const safeInvoice = { ...invoice, items: Array.isArray(invoice.items) ? invoice.items : [] };
  const doc = (
    <Document>
      {safeInvoice.template === 'medical'
        ? <MedicalPDF invoice={safeInvoice} settings={settings} />
        : <ModernPDF invoice={safeInvoice} settings={settings} />}
    </Document>
  );
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
