export interface Settings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  logoUrl: string;
  currency: string;
  dlNumbers: string[];      // shared DL numbers stored in user profile
  userName: string;         // user's own name (autofills doctor name)
  signatureUrl: string;     // base64 or URL of authorised signature image
  companyTitleSize?: number; // font size override for company title on invoices
}

export interface Product {
  id?: number;
  name: string;
  description: string;
  basePrice: number;
  unit: string;             // free-form string e.g. "Kg", "4 x 10 sheet"
  batchNo?: string;
  expiryDate?: string;
  expiryMode?: 'full' | 'monthyear'; // how expiry is entered/displayed
}

export interface InvoiceItem {
  id?: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;             // free-form unit string
  batchNo?: string;
  expiryDate?: string;
  expiryMode?: 'full' | 'monthyear';
  total: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  clientLabel: string;      // e.g., "Patient Name", "Customer Name"
  doctorName?: string;
  doctorLabel?: string;     // editable label for doctor field, e.g. "Doctor", "Referred By"
  dlNumbers?: string[];
  date: string;
  dueDate: string;
  discountPercentage: number;
  roundOff: number;
  total: number;
  balanceDue?: number;
  items: InvoiceItem[];
  template: 'modern' | 'classic' | 'minimal' | 'medical';
  themeColor?: string;
  terms?: string;
  showSignatory?: boolean;
  useDigitalSignature?: boolean; // whether to embed the signature image from settings
  companyTitleSize?: number;     // per-invoice font size override for company name
}
