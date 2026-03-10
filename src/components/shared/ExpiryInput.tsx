import React from 'react';

interface ExpiryInputProps {
  value: string;
  mode: 'full' | 'monthyear';
  onValueChange: (val: string) => void;
  onModeChange: (mode: 'full' | 'monthyear') => void;
  className?: string;
}

// Format for monthyear: "YYYY-MM" stored, displayed as "MM/YYYY"
export const ExpiryInput = ({ value, mode, onValueChange, onModeChange, className = '' }: ExpiryInputProps) => {
  const handleModeToggle = () => {
    const newMode = mode === 'full' ? 'monthyear' : 'full';
    // Convert stored value when switching modes
    if (newMode === 'monthyear' && value && value.length >= 7) {
      // full date "YYYY-MM-DD" → strip to "YYYY-MM"
      onValueChange(value.slice(0, 7));
    } else if (newMode === 'full' && value && value.length === 7) {
      // "YYYY-MM" → append -01 to make a valid date input
      onValueChange(value + '-01');
    }
    onModeChange(newMode);
  };

  if (mode === 'monthyear') {
    // Split "YYYY-MM" for separate selects
    const [year, month] = value ? value.split('-') : ['', ''];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear + i);
    const months = [
      { v: '01', l: 'Jan' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' },
      { v: '04', l: 'Apr' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun' },
      { v: '07', l: 'Jul' }, { v: '08', l: 'Aug' }, { v: '09', l: 'Sep' },
      { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' },
    ];

    return (
      <div className={`flex gap-1 items-center ${className}`}>
        <select
          className="input py-1 text-xs flex-1"
          value={month || ''}
          onChange={e => onValueChange(`${year || currentYear}-${e.target.value}`)}
        >
          <option value="">MM</option>
          {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select
          className="input py-1 text-xs flex-1"
          value={year || ''}
          onChange={e => onValueChange(`${e.target.value}-${month || '01'}`)}
        >
          <option value="">YYYY</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          type="button"
          title="Switch to full date"
          onClick={handleModeToggle}
          className="text-[9px] font-bold text-zinc-400 hover:text-zinc-700 px-1 whitespace-nowrap"
        >
          📅
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-1 items-center ${className}`}>
      <input
        type="date"
        className="input py-1 text-xs flex-1"
        value={value || ''}
        onChange={e => onValueChange(e.target.value)}
      />
      <button
        type="button"
        title="Switch to Month/Year only"
        onClick={handleModeToggle}
        className="text-[9px] font-bold text-zinc-400 hover:text-zinc-700 px-1 whitespace-nowrap"
      >
        MY
      </button>
    </div>
  );
};

/** Format expiry for display in invoice template */
export function formatExpiry(value?: string, mode?: string): string {
  if (!value) return '-';
  if (mode === 'monthyear' && value.length >= 7) {
    const [year, month] = value.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx] || month}/${year}`;
  }
  return value;
}
