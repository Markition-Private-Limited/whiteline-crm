"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = { value: string; label: string };

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
}

export function Select({ value, onChange, options, className = "", placeholder }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[14px] border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none hover:border-foreground/30 transition"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 min-w-full w-max max-w-xs rounded-[14px] border border-border bg-surface p-1 shadow-xl shadow-black/10">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-sm transition
                ${opt.value === value
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-foreground hover:bg-surface-muted"
                }`}
            >
              {opt.label}
              {opt.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
