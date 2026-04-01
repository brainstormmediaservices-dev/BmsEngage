import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
}

/**
 * Styled select that works in both dark and light mode.
 * Replaces all raw <select> elements across the app.
 */
export const Select = ({ label, options, className, ...props }: SelectProps) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">{label}</label>}
    <div className="relative">
      <select
        {...props}
        className={cn(
          // Base
          'w-full h-11 appearance-none rounded-xl px-4 pr-10 text-sm font-medium outline-none transition-all cursor-pointer',
          // Colors — explicit so they work in both themes
          'bg-[var(--color-card,#16161C)] text-[var(--color-text,#F0F0F5)]',
          'border border-[var(--color-border,rgba(255,255,255,0.1))]',
          'focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
          // Option styling via CSS custom properties
          '[&>option]:bg-[var(--color-card,#16161C)] [&>option]:text-[var(--color-text,#F0F0F5)]',
          className
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
    </div>
  </div>
);
