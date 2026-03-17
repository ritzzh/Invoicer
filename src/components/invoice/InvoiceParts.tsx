import React from 'react';

// Bold, wide INVOICE heading with parallel colored lines above and below
export const InvoiceTitle = ({ themeColor }: { themeColor: string }) => (
  <div className="my-2" style={{ position: 'relative' }}>
    <div style={{ borderTop: `2px solid ${themeColor}`, marginBottom: '4px' }} />
    <span
      className="font-black tracking-[0.5em] uppercase block text-center"
      style={{ color: themeColor, letterSpacing: '0.45em', fontSize: 'clamp(1.6rem, 2.5vw, 1.8rem)', lineHeight: 1.1 }}
    >
      INVOICE
    </span>
    <div style={{ borderBottom: `2px solid ${themeColor}`, marginTop: '4px' }} />
  </div>
);

// Dynamically scales company name based on character length, with optional manual override
export const CompanyName = ({ name, themeColor, titleSize }: { name: string; themeColor: string; titleSize?: number }) => {
  const len = name?.length || 0;
  const autoSize =
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
        fontSize: titleSize && titleSize > 0 ? `${titleSize}px` : autoSize,
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
      <div className="inline-flex gap-0">
        <span className="text-[10px] text-zinc-700 font-bold leading-snug whitespace-nowrap">DL:&nbsp;</span>
        <div className="flex flex-col items-start">
          {filled.map((dl, i) => (
            <span key={i} className="text-[10px] text-zinc-700 font-bold leading-snug whitespace-nowrap">
              {dl}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
