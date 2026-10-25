"use client";

import type { CSSProperties } from "react";
import { UPLOAD_CATEGORIES } from "@/lib/vault/categories";

interface Props {
  value: string;
  onChange: (value: string) => void;
  style?: CSSProperties;
  disabled?: boolean;
  id?: string;
}

/**
 * Category dropdown for vault documents: NCIW or General. A document that was
 * stored under an older category keeps it, shown as an extra option, so
 * opening it never silently changes the category.
 */
export default function VaultCategorySelect({ value, onChange, style, disabled, id }: Props) {
  const known = UPLOAD_CATEGORIES.some((c) => c.value === value);
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {UPLOAD_CATEGORIES.map((c) => (
        <option key={c.value} value={c.value}>{c.label}</option>
      ))}
      {!known && value && <option value={value}>{value}</option>}
    </select>
  );
}
