import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, pdf,
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

function dynFontSize(name: string): number {
  const l = name?.length || 0;
  return l <= 12 ? 24 : l <= 20 ? 20 : l <= 30 ? 16 : 13;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:   { fontFamily: 'Helvetica', fontSize: 10, padding: 24, backgroundColor: '#ffffff' },
  row:    { flexDirection: 'row' },
  bold:   { fontFamily: 'Helvetica-Bold' },
  right:  { textAlign: 'right' },
  center: { textAlign: 'center' },
  muted:  { color: '#71717a' },
  tiny:   { fontSize: 8 },
  small:  { fontSize: 9 },
});

// ── Shared sub-components ─────────────────────────────────────────────────────

const DLRow = ({ dlNumbers }: { dlNumbers?: string[] }) => {
  const filled = (dlNumbers || []).filter((d: string) => d?.trim());
  if (!filled.length) return null;
  return (
    <View style={{ alignItems: 'flex-end', marginBottom: 2 }}>
      {filled.map((d: string, i: number) => (
        <Text key={i} style={[S.tiny, S.muted]}>DL: {d}</Text>
      ))}
    </View>
  );
};

const CompanyHeader = ({ settings, theme }: { settings: any; theme: string }) => (
  <View style={{ alignItems: 'center', marginBottom: 6 }}>
    <Text style={[S.bold, { fontSize: dynFontSize(settings.companyName), color: theme, letterSpacing: 1.5, textTransform: 'uppercase' }]}>
      {settings.companyName}
    </Text>
    {settings.companyAddress
      ? <Text style={[S.small, S.muted, { marginTop: 2 }]}>{settings.companyAddress}</Text>
      : null}
    <View style={[S.row, { marginTop: 2, gap: 12 }]}>
      {settings.companyPhone ? <Text style={[S.tiny, S.muted]}>{settings.companyPhone}</Text> : null}
      {settings.companyEmail ? <Text style={[S.tiny, S.muted]}>{settings.companyEmail}</Text> : null}
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
          <Text style={[S.small, S.muted]}>Subtotal</Text>
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
          <Text style={[S.bold, { fontSize: 13 }]}>Total</Text>
          <Text style={[S.bold, { fontSize: 13, color: theme }]}>{fmt(invoice.total, currency)}</Text>
        </View>
        {(invoice.balanceDue ?? 0) > 0 && (
          <View style={[S.row, { justifyContent: 'space-between', paddingVertical: 2 }]}>
            <Text style={[S.small, S.muted]}>Balance Due</Text>
            <Text style={S.small}>{invoice.balanceDue.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const TermsBlock = ({ terms, showSignatory, companyName }: { terms?: string; showSignatory?: boolean; companyName: string }) => (
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
        <Text style={[S.tiny, S.muted, { marginBottom: 28 }]}>For, {companyName}</Text>
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
  const headers = ['Sr.', 'Product', 'Unit', 'Batch', 'Expiry', 'Qty', 'MRP', 'Amount'];

  return (
    <Page size="A4" style={S.page}>
      <DLRow dlNumbers={dlNumbers} />
      <CompanyHeader settings={settings} theme={theme} />

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[S.bold, { fontSize: 18, color: theme, letterSpacing: 4, textTransform: 'uppercase' }]}>INVOICE</Text>
        <Text style={[S.tiny, S.muted]}>ORIGINAL FOR RECIPIENT</Text>
      </View>

      <View style={[S.row, { justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#a1a1aa', paddingVertical: 4, marginBottom: 8 }]}>
        <Text style={S.small}><Text style={[S.bold, S.muted]}>Invoice No: </Text>{invoice.invoiceNumber}</Text>
        <Text style={S.small}><Text style={[S.bold, S.muted]}>Date: </Text>{invoice.date}</Text>
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text style={[S.bold, { fontSize: 11 }]}>
          <Text style={{ fontFamily: 'Helvetica', color: '#71717a' }}>{invoice.clientLabel || 'Patient'}: </Text>
          {(invoice.clientName || '').toUpperCase()}
        </Text>
        {invoice.doctorName ? (
          <Text style={[S.bold, { fontSize: 10, marginTop: 2 }]}>
            <Text style={{ fontFamily: 'Helvetica', color: '#71717a' }}>{doctorLabel}: </Text>
            {invoice.doctorName.toUpperCase()}
          </Text>
        ) : null}
        {invoice.clientPhone ? <Text style={[S.tiny, S.muted, { marginTop: 2 }]}>Tel: {invoice.clientPhone}</Text> : null}
      </View>

      {/* Items table */}
      <View style={{ borderWidth: 1, borderColor: '#a1a1aa', marginBottom: 8 }}>
        <View style={[S.row, { backgroundColor: '#f4f4f5', borderBottomWidth: 1, borderBottomColor: '#a1a1aa' }]}>
          {headers.map((h, i) => (
            <Text key={i} style={[S.bold, S.tiny, { width: colW[i], padding: 4, textTransform: 'uppercase', textAlign: i === 0 ? 'center' : i >= 5 ? 'right' : 'left' }]}>{h}</Text>
          ))}
        </View>
        {invoice.items.map((item: any, idx: number) => (
          <View key={idx} style={[S.row, { borderBottomWidth: 0.5, borderBottomColor: '#e4e4e7' }]}>
            <Text style={[S.tiny, { width: colW[0], padding: 3, textAlign: 'center' }]}>{idx + 1}</Text>
            <Text style={[S.tiny, { width: colW[1], padding: 3 }]}>{item.description}</Text>
            <Text style={[S.tiny, { width: colW[2], padding: 3, textAlign: 'center' }]}>{item.unit || '-'}</Text>
            <Text style={[S.tiny, { width: colW[3], padding: 3, textAlign: 'center' }]}>{item.batchNo || '-'}</Text>
            <Text style={[S.tiny, { width: colW[4], padding: 3, textAlign: 'center' }]}>{formatExpiry(item.expiryDate, item.expiryMode)}</Text>
            <Text style={[S.tiny, { width: colW[5], padding: 3, textAlign: 'right' }]}>{item.quantity}</Text>
            <Text style={[S.tiny, { width: colW[6], padding: 3, textAlign: 'right' }]}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={[S.bold, S.tiny, { width: colW[7], padding: 3, textAlign: 'right' }]}>{item.total.toFixed(2)}</Text>
          </View>
        ))}
        <View style={[S.row, { backgroundColor: '#f4f4f5', borderTopWidth: 1, borderTopColor: '#a1a1aa' }]}>
          <Text style={[S.bold, S.tiny, { width: '63%', padding: 4, textAlign: 'right', color: '#71717a' }]}>Total</Text>
          <Text style={[S.bold, S.tiny, { width: '8%', padding: 4, textAlign: 'right' }]}>{invoice.items.reduce((s: number, i: any) => s + i.quantity, 0)}</Text>
          <Text style={[S.tiny, { width: '14%', padding: 4 }]}></Text>
          <Text style={[S.bold, S.tiny, { width: '15%', padding: 4, textAlign: 'right' }]}>{subtotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={[S.row, { borderWidth: 1, borderColor: '#a1a1aa', marginBottom: 12 }]}>
        <View style={{ flex: 7, padding: 8, borderRightWidth: 1, borderRightColor: '#a1a1aa' }}>
          <Text style={[S.bold, S.tiny, { textTransform: 'uppercase', color: '#71717a', marginBottom: 3 }]}>Total Amount in Words</Text>
          <Text style={[S.bold, { fontSize: 10 }]}>{numberToWords(invoice.total)}</Text>
        </View>
        <View style={{ flex: 5 }}>
          {([['SUBTOTAL', subtotal.toFixed(2), false], [`DISC (${invoice.discountPercentage}%)`, `-${disc.toFixed(2)}`, true], ['ROUND OFF', invoice.roundOff.toFixed(2), false]] as [string, string, boolean][]).map(([label, val, red], i) => (
            <View key={i} style={[S.row, { justifyContent: 'space-between', padding: 3, borderBottomWidth: 0.5, borderBottomColor: '#e4e4e7' }]}>
              <Text style={[S.bold, S.tiny, S.muted]}>{label}</Text>
              <Text style={[S.bold, S.tiny, red ? { color: '#ef4444' } : {}]}>{val}</Text>
            </View>
          ))}
          <View style={[S.row, { justifyContent: 'space-between', padding: 4, borderBottomWidth: 0.5, borderBottomColor: '#e4e4e7', backgroundColor: `${theme}18` }]}>
            <Text style={[S.bold, { fontSize: 12, color: theme }]}>TOTAL</Text>
            <Text style={[S.bold, { fontSize: 12, color: theme }]}>{invoice.total.toFixed(2)}</Text>
          </View>
          <View style={[S.row, { justifyContent: 'space-between', padding: 3 }]}>
            <Text style={[S.bold, S.tiny, S.muted]}>BALANCE DUE</Text>
            <Text style={[S.bold, S.tiny]}>{(invoice.balanceDue ?? 0).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <TermsBlock terms={invoice.terms} showSignatory={invoice.showSignatory} companyName={settings.companyName} />
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
      <CompanyHeader settings={settings} theme={theme} />

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={[S.bold, { fontSize: 18, color: theme, letterSpacing: 4, textTransform: 'uppercase' }]}>INVOICE</Text>
        <Text style={[S.tiny, S.muted]}>ORIGINAL FOR RECIPIENT</Text>
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
          <Text style={{ fontFamily: 'Helvetica', color: '#71717a' }}>{invoice.clientLabel || 'Client'}: </Text>
          {(invoice.clientName || '').toUpperCase()}
        </Text>
        {invoice.doctorName ? (
          <Text style={[S.bold, { fontSize: 11, marginTop: 2 }]}>
            <Text style={{ fontFamily: 'Helvetica', color: '#71717a' }}>{doctorLabel}: </Text>
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
      <TermsBlock terms={invoice.terms} showSignatory={invoice.showSignatory} companyName={settings.companyName} />
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
