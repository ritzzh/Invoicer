export interface Settings {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  logoUrl: string;
  currency: string;
}

export interface Product {
  id?: number;
  name: string;
  description: string;
  basePrice: number;
  unit?: string;
}

export interface InvoiceItem {
  id?: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  total: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress: string;
  clientLabel: string; // e.g., "Patient Name", "Customer Name"
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
}
