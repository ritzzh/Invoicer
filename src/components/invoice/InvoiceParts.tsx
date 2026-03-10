import React from 'react';

// Bold, wide INVOICE heading — no outer box, just typography
export const InvoiceTitle = ({ themeColor }: { themeColor: string }) => (
  <div className="text-center my-3">
    <span
      className="text-2xl font-black tracking-[0.5em] uppercase"
      style={{ color: themeColor, letterSpacing: '0.45em' }}
    >
      INVOICE
    </span>
  </div>
);

// Company name style helper — used by templates to get bold/wide company name
export const CompanyName = ({ name, themeColor }: { name: string; themeColor: string }) => (
  <h1
    className="font-black uppercase"
    style={{
      color: themeColor,
      letterSpacing: '0.12em',   // less gap between letters
      fontSize: 'clamp(2.6rem, 6vw, 3.6rem)', // more height
      lineHeight: 1.2,           // slightly taller text block
    }}
  >
    {name}
  </h1>
);

export const DLNumbers = ({ dlNumbers }: { dlNumbers?: string[] }) => {
  const filled = (dlNumbers || []).filter((d) => d && d.trim());
  if (!filled.length) return null;
  return (
    <div className="text-right">
      {filled.map((dl, i) => (
        <p key={i} className="text-[8px] text-zinc-500 font-medium leading-tight">
          DL: {dl}
        </p>
      ))}
    </div>
  );
};
