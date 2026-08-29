"use client";

import { useMemo, useState } from "react";

export type SelectOption = { id: number; label: string };

export function SearchableSelect({
  name,
  label,
  options,
  placeholder = "輸入或揀一個…",
  allowCreate = false,
  defaultValue = "",
}: {
  /** Base field name. Emits `<name>Id` and `<name>Name` hidden inputs. */
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  /** When true, a typed name that matches nothing becomes a new library entry. */
  allowCreate?: boolean;
  defaultValue?: string;
}) {
  const [text, setText] = useState(defaultValue);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const matches = useMemo(() => {
    const query = text.trim().toLowerCase();
    if (!query) return options;
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, text]);

  const exactMatch = options.find((o) => o.label.toLowerCase() === text.trim().toLowerCase());
  const showCreate = allowCreate && text.trim().length > 0 && !exactMatch;

  // Typing after a selection means the user is redirecting — drop the stale id.
  function handleType(value: string) {
    setText(value);
    setSelectedId(null);
  }

  function handlePick(option: SelectOption) {
    setText(option.label);
    setSelectedId(option.id);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${name}-input`} className="text-sm font-caption font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={`${name}-input`}
        type="text"
        autoComplete="off"
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleType(e.target.value)}
        className="rounded-sm border border-border-input px-3 py-2 text-base sm:text-sm"
      />

      <input type="hidden" name={`${name}Id`} value={selectedId ?? ""} />
      <input
        type="hidden"
        name={`${name}Name`}
        value={selectedId === null ? text.trim() : ""}
      />

      <ul role="listbox" className="max-h-48 overflow-y-auto rounded-sm border border-border">
        {matches.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              role="option"
              aria-selected={selectedId === option.id}
              onClick={() => handlePick(option)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-surface-mist"
            >
              {option.label}
            </button>
          </li>
        ))}

        {matches.length === 0 && !showCreate && (
          <li className="px-3 py-1.5 text-sm font-caption text-ink-faint">冇符合嘅選項</li>
        )}

        {showCreate && (
          <li className="px-3 py-1.5 text-sm font-caption text-accent">新增「{text.trim()}」</li>
        )}
      </ul>
    </div>
  );
}
