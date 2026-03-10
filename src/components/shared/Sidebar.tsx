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
        <h1 className="text-xl font-bold tracking-tight">Invoicer</h1>
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

      <div className="pt-6 border-t border-zinc-100">
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

        <div className="pt-6 border-t border-zinc-100">
          <button onClick={() => { onLogout(); setMobileOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
};
