import React from 'react';
import { Invoice, Settings } from '../../types';
import { MedicalTemplate } from './templates/MedicalTemplate';
import { MedicalLandscapeTemplate } from './templates/MedicalLandscapeTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { ModernTemplate } from './templates/ModernTemplate';

interface InvoiceTemplateProps {
  invoice: Invoice;
  settings: Settings;
}

export const InvoiceTemplate = ({ invoice, settings }: InvoiceTemplateProps) => {
  switch (invoice.template) {
    case 'medical':
      return <MedicalTemplate invoice={invoice} settings={settings} />;
    case 'medical-landscape':
      return <MedicalLandscapeTemplate invoice={invoice} settings={settings} />;
    case 'classic':
      return <ClassicTemplate invoice={invoice} settings={settings} />;
    case 'minimal':
      return <MinimalTemplate invoice={invoice} settings={settings} />;
    default:
      return <ModernTemplate invoice={invoice} settings={settings} />;
  }
};
