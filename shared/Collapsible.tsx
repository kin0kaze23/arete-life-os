import React, { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="rounded-xl bg-white/5 border border-white/5 overflow-hidden backdrop-filter backdrop-blur">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
        aria-expanded={open}
        aria-controls={contentId}
      >
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-600 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      <div
        id={contentId}
        className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden default-open`}
        aria-hidden={!open}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
};
