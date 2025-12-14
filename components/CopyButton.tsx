import React, { useState } from 'react';

const CopyButton = ({ text, onCopy, label, title = "Copy to clipboard", className = "" }: { text?: string, onCopy?: () => string, label?: string, title?: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = onCopy ? onCopy() : text;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-zinc-500 hover:text-white transition-colors flex items-center gap-1.5 ${className}`}
      title={title}
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          {label && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Copied</span>}
        </>
      ) : (
        <>
          {label && <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100">{label}</span>}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        </>
      )}
    </button>
  );
};

export default CopyButton;
