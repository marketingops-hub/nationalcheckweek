"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { MAX_TAGS, addTags, suggest, type KnownTag } from "@/lib/vault/tags";

/* One shared request for every tag box on a page. */
let cache: Promise<KnownTag[]> | null = null;

function loadKnownTags(): Promise<KnownTag[]> {
  if (!cache) {
    cache = adminFetch("/api/admin/vault/tags")
      .then(async (res) => ((await res.json()) as { tags?: KnownTag[] }).tags ?? [])
      .catch(() => {
        cache = null; // try again next time
        return [];
      });
  }
  return cache;
}

/** Call after a document is saved so newly added tags appear as suggestions. */
export function invalidateVaultTags() {
  cache = null;
}

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Tag picker: choose from tags already used in the vault, or type a new one
 * and press Enter or comma. Typed text is also kept when you click away.
 */
export default function VaultTagInput({ value, onChange, disabled, placeholder }: Props) {
  const listId = useId();
  const [known, setKnown] = useState<KnownTag[]>([]);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    loadKnownTags().then((tags) => {
      if (!cancelled) setKnown(tags);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => suggest(known, value, text), [known, value, text]);
  const full = value.length >= MAX_TAGS;

  function commit(raw: string) {
    const next = addTags(value, raw, known.map((k) => k.tag));
    if (next !== value) onChange(next);
    setText("");
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      if (open && active >= 0 && options[active]) {
        e.preventDefault();
        commit(options[active].tag);
      } else if (text.trim()) {
        e.preventDefault(); // add the tag instead of submitting the form
        commit(text);
      }
    } else if (e.key === ",") {
      e.preventDefault();
      commit(text);
    } else if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          padding: "6px 8px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 4px 2px 10px",
              borderRadius: 99, background: "#EEF2FF", color: "#3730A3", fontSize: 12, fontWeight: 600,
            }}
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              disabled={disabled}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              style={{ border: 0, background: "transparent", cursor: "pointer", color: "inherit", fontSize: 14, lineHeight: 1, padding: "0 4px", width: "auto" }}
            >
              ×
            </button>
          </span>
        ))}
        {!full && (
          <input
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            value={text}
            disabled={disabled}
            placeholder={value.length === 0 ? (placeholder ?? "Choose a tag or type a new one") : "Add another…"}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              if (text.trim()) commit(text);
              setOpen(false);
            }}
            onKeyDown={onKeyDown}
            style={{ flex: "1 1 140px", minWidth: 120, width: "auto", border: 0, outline: "none", padding: "4px 2px", fontSize: 14, background: "transparent" }}
          />
        )}
      </div>

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: "absolute", zIndex: 30, left: 0, right: 0, top: "100%", marginTop: 4, padding: 4,
            listStyle: "none", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: 220, overflowY: "auto",
          }}
        >
          {options.map((o, i) => (
            <li
              key={o.tag}
              role="option"
              aria-selected={i === active}
              // mouse-down (not click) so the input keeps focus and doesn't also trigger its blur handler
              onMouseDown={(e) => {
                e.preventDefault();
                commit(o.tag);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 10px", borderRadius: 6,
                cursor: "pointer", fontSize: 13, background: i === active ? "#F3F4F6" : "transparent",
              }}
            >
              <span>{o.tag}</span>
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>{o.count}</span>
            </li>
          ))}
        </ul>
      )}

      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
        {full
          ? `Maximum of ${MAX_TAGS} tags.`
          : "Pick an existing tag or type a new one, then press Enter or comma."}
      </div>
    </div>
  );
}
