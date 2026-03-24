import React, { useState, useRef } from 'react';
import { Settings } from '../../types';
import { Eye, EyeOff, Upload, X, ImageIcon } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSave: (s: Settings) => void;
}

export const SettingsView = ({ settings, onSave }: SettingsViewProps) => {
  const [formData, setFormData] = useState<Settings & { emailAppPassword?: string }>({
    ...settings,
    signatureUrl: settings.signatureUrl || '',
    companyTitleSize: settings.companyTitleSize || 0,
  });
  const [sigPreview, setSigPreview] = useState<string>(settings.signatureUrl || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSigPreview(dataUrl);
      setFormData(prev => ({ ...prev, signatureUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const clearSignature = () => {
    setSigPreview('');
    setFormData(prev => ({ ...prev, signatureUrl: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Company Settings</h2>

      <div className="card p-5 sm:p-8 space-y-5 sm:space-y-6">

        {/* Company Name + Title Size */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Company Name</label>
            <input className="input" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">
              Font Size
            </label>
            <input
              type="number"
              className="input"
              min={0}
              max={120}
              placeholder="Auto"
              value={formData.companyTitleSize || ''}
              onChange={e => setFormData({ ...formData, companyTitleSize: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Logo URL</label>
          <input className="input" value={formData.logoUrl} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Address</label>
          <textarea className="input h-24" value={formData.companyAddress} onChange={e => setFormData({ ...formData, companyAddress: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Email</label>
            <input className="input" value={formData.companyEmail} onChange={e => setFormData({ ...formData, companyEmail: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Phone</label>
            <input className="input" value={formData.companyPhone} onChange={e => setFormData({ ...formData, companyPhone: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">GST Number (GSTIN)</label>
            <input className="input" placeholder="e.g. 09AGIPY4520D1ZA" value={(formData as any).gstNumber || ''} onChange={e => setFormData({ ...formData, gstNumber: e.target.value } as any)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Website</label>
            <input className="input" value={formData.companyWebsite} onChange={e => setFormData({ ...formData, companyWebsite: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">Currency</label>
            <select className="input" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        {/* Authorised Signature Upload */}
        <div className="border-t border-zinc-100 pt-5 space-y-3">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase">Authorised Signature</p>
            <p className="text-xs text-zinc-400 mt-0.5">Upload a signature image. Toggle digital signing per-invoice when creating invoices.</p>
          </div>

          {sigPreview ? (
            <div className="flex items-start gap-4">
              <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 flex items-center justify-center" style={{ minWidth: 160, height: 80 }}>
                <img src={sigPreview} alt="Signature preview" className="max-h-14 max-w-36 object-contain" />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Upload size={13} /> Replace
                </button>
                <button onClick={clearSignature} className="text-xs flex items-center gap-1.5 text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <X size={13} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-zinc-200 rounded-xl hover:border-zinc-400 hover:bg-zinc-50 transition-colors w-full text-left"
            >
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                <ImageIcon size={16} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600">Upload signature image</p>
                <p className="text-xs text-zinc-400">PNG or JPG with transparent background recommended</p>
              </div>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
        </div>

        {/* Personal / License Info */}
        <div className="border-t border-zinc-100 pt-4 space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase">Personal / License Info</p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">
              Your Name <span className="normal-case font-normal text-zinc-300">(autofills Doctor / Referred By on invoices)</span>
            </label>
            <input className="input" placeholder="e.g. Dr. Priya Sharma" value={formData.userName} onChange={e => setFormData({ ...formData, userName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase">
              DL Numbers <span className="normal-case font-normal text-zinc-300">(Drug License)</span>
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <input key={i} placeholder={`DL No. ${i + 1}`} className="input"
                  value={(formData.dlNumbers || ['', '', ''])[i] || ''}
                  onChange={e => {
                    const updated = [...(formData.dlNumbers || ['', '', ''])];
                    updated[i] = e.target.value;
                    setFormData({ ...formData, dlNumbers: updated });
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-5 space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">
            Default Terms &amp; Conditions
          </label>
          <p className="text-xs text-zinc-400">These will be pre-filled on every new invoice. You can still edit them per invoice when creating.</p>
          <textarea
            className="input h-28"
            placeholder={"1. This is an electronically generated document.\n2. All disputes are subject to seller city jurisdiction."}
            value={formData.defaultTerms || ''}
            onChange={e => setFormData({ ...formData, defaultTerms: e.target.value })}
          />
        </div>

        <button onClick={() => onSave(formData as any)} className="btn-primary w-full py-3">
          Save Settings
        </button>
      </div>
    </div>
  );
};
