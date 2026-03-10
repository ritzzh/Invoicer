import React, { useState } from 'react';
import { Settings } from '../../types';
import { Eye, EyeOff } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSave: (s: Settings) => void;
}

export const SettingsView = ({ settings, onSave }: SettingsViewProps) => {
  const [formData, setFormData] = useState<Settings & { emailAppPassword?: string }>(settings);

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Company Settings</h2>

      <div className="card p-5 sm:p-8 space-y-5 sm:space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase">Company Name</label>
          <input className="input" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
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
              DL Numbers <span className="normal-case font-normal text-zinc-300">(Drug License — shared across all invoices)</span>
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

        <button onClick={() => onSave(formData as any)} className="btn-primary w-full py-3">Save Settings</button>
      </div>
    </div>
  );
};
