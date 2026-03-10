import React from 'react';

// Bold, wide INVOICE heading — no outer box, just typography
export const InvoiceTitle = ({ themeColor }: { themeColor: string }) => (
  <div className="text-center my-3">
    <span
      className="text-2xl font-black tracking-[0.5em] uppercase"
      style={{ color: themeColor, letterSpacing: '0.45em', fontSize: 'clamp(1.4rem, 2vw, 1.5rem)' }}
    >
      INVOICE
    </span>
  </div>
);

// Dynamically scales company name based on character length
export const CompanyName = ({ name, themeColor }: { name: string; themeColor: string }) => {
  const len = name?.length || 0;
  // Progressively reduce font as name gets longer
  const fontSize =
    len <= 12 ? 'clamp(2.2rem, 5vw, 3.2rem)' :
    len <= 20 ? 'clamp(1.6rem, 4vw, 2.4rem)' :
    len <= 30 ? 'clamp(1.2rem, 3vw, 1.8rem)' :
                'clamp(0.9rem, 2.5vw, 1.4rem)';

  return (
    <h1
      className="font-black uppercase leading-tight"
      style={{
        color: themeColor,
        letterSpacing: len > 20 ? '0.06em' : '0.12em',
        fontSize,
        lineHeight: 1.2,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }}
    >
      {name}
    </h1>
  );
};

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
