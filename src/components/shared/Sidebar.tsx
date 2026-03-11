import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, Package,
  Settings as SettingsIcon, LogOut, Menu, X, Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

const baseTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar = ({ activeTab, setActiveTab, onLogout, isAdmin }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const tabs = isAdmin
    ? [...baseTabs, { id: 'admin', label: 'Admin', icon: Shield }]
    : baseTabs;

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 mb-10 px-2">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tight">IO</div>
        <h1 className="text-xl font-bold tracking-tight">InvoiceOk</h1>
      </div>

      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id
                ? tab.id === 'admin' ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-white'
                : tab.id === 'admin' ? 'text-amber-600 hover:bg-amber-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-zinc-100 space-y-2">
        <a
          href="https://github.com/ritzzh"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="shrink-0">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span>Built by <span className="font-semibold text-zinc-500">ritzzh</span></span>
        </a>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r border-zinc-200 h-screen sticky top-0 flex-col p-6 no-print">
        <NavContent />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-[10px] tracking-tight">IO</div>
          <span className="text-lg font-bold tracking-tight">Invoicer</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)} />}

      <div className={cn('md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white p-6 flex flex-col transition-transform duration-300', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black text-xs tracking-tight">IO</div>
            <h1 className="text-xl font-bold tracking-tight">Invoicer</h1>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"><X size={18} /></button>
        </div>

        <nav className="space-y-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? tab.id === 'admin' ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-white'
                  : tab.id === 'admin' ? 'text-amber-600 hover:bg-amber-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-zinc-100 space-y-2">
          <a
            href="https://github.com/ritzzh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="shrink-0">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span>Built by <span className="font-semibold text-zinc-500">ritzzh</span></span>
          </a>
          <button onClick={() => { onLogout(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
