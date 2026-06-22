"use client";

import { useEffect, useState } from "react";

// A textarea that holds local state and commits on change, keeping the
// store the source of truth while staying responsive to typing.
export function MonoTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  mono = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  return (
    <textarea
      value={local}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
      className={`w-full bg-ink-900 border border-ink-600 rounded-lg p-3 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none resize-y ${
        mono ? "font-mono text-sm" : "font-body text-sm"
      }`}
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnter?: () => void;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className="w-full bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none font-body text-sm"
    />
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left"
    >
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
          checked
            ? "bg-hazard border-hazard text-ink"
            : "border-ink-500 text-transparent"
        }`}
      >
        ✓
      </span>
      <span className="text-sm text-bone/90">{label}</span>
    </button>
  );
}

export function ActionButton({
  onClick,
  children,
  variant = "default",
  disabled,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "accent" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "text-xs font-mono px-3 py-2 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "accent"
      ? "bg-hazard text-ink hover:bg-hazard/80"
      : variant === "danger"
        ? "border border-red-500/60 text-red-400 hover:bg-red-500/10"
        : "border border-ink-500 text-bone/80 hover:bg-ink-600";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}
