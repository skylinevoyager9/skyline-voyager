"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { flightFieldInput, flightFieldLabel } from "@/components/flights/flight-search-ui";

export type PlaceOption = {
  iata: string;
  label: string;
  subtitle?: string;
  type: "airport" | "city";
};

type Props = {
  label: string;
  value: string;
  onChange: (iata: string) => void;
  placeholder?: string;
  required?: boolean;
  enableSuggestions?: boolean;
  className?: string;
  inputClassName?: string;
};

const IATA_RE = /^[A-Za-z]{3}$/;

type ListPosition = { top: number; left: number; width: number };

export function PlaceAutocomplete({
  label,
  value,
  onChange,
  placeholder = "City or airport",
  required,
  enableSuggestions = true,
  className = "",
  inputClassName = "",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pickingRef = useRef(false);

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<PlaceOption | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [listPos, setListPos] = useState<ListPosition | null>(null);
  const [mounted, setMounted] = useState(false);

  const committedIataRef = useRef(value);
  const fetchGenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setMounted(true), []);

  const updateListPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setListPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const hydrateFromIata = useCallback(
    async (iata: string) => {
      if (!enableSuggestions || !IATA_RE.test(iata)) {
        setQuery(iata);
        return;
      }
      try {
        const res = await fetch(`/api/flights/places?q=${encodeURIComponent(iata)}`);
        const json = (await res.json()) as {
          ok?: boolean;
          options?: PlaceOption[];
          error?: string;
        };
        if (!json.ok || !json.options?.length) {
          setQuery(iata);
          setSelection(null);
          return;
        }
        const exact =
          json.options.find((o) => o.iata === iata.toUpperCase()) ?? json.options[0]!;
        setSelection(exact);
        setQuery(exact.label);
      } catch {
        setQuery(iata);
      }
    },
    [enableSuggestions],
  );

  useEffect(() => {
    if (pickingRef.current) return;
    if (value === committedIataRef.current) return;
    committedIataRef.current = value;

    if (!value) {
      setSelection(null);
      setQuery("");
      return;
    }

    if (selection?.iata === value) return;
    void hydrateFromIata(value.toUpperCase());
  }, [value, hydrateFromIata, selection?.iata]);

  useEffect(() => {
    if (!enableSuggestions || !open) return;

    const q = query.trim();
    if (selection && query === selection.label) {
      setOptions([]);
      setLoading(false);
      setFetchError(null);
      return;
    }
    if (q.length < 2) {
      setOptions([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    const gen = ++fetchGenRef.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/flights/places?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        if (gen !== fetchGenRef.current) return;
        const json = (await res.json()) as {
          ok?: boolean;
          options?: PlaceOption[];
          error?: string;
        };
        if (json.ok && json.options) {
          setOptions(json.options);
          setHighlight(0);
          setFetchError(null);
        } else {
          setOptions([]);
          setFetchError(json.error ?? "Could not load places. Check Duffel is configured.");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (gen === fetchGenRef.current) {
          setOptions([]);
          setFetchError("Network error while searching places.");
        }
      } finally {
        if (gen === fetchGenRef.current) setLoading(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query, enableSuggestions, selection, open]);

  useEffect(() => {
    function onDocPointer(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, []);

  const q = query.trim();
  const showList =
    enableSuggestions &&
    open &&
    q.length >= 2 &&
    !(selection && query === selection.label);

  useLayoutEffect(() => {
    if (!showList) {
      setListPos(null);
      return;
    }
    updateListPosition();
    const onLayout = () => updateListPosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [showList, query, updateListPosition]);

  function pick(opt: PlaceOption) {
    pickingRef.current = false;
    setSelection(opt);
    setQuery(opt.label);
    committedIataRef.current = opt.iata;
    onChange(opt.iata);
    setOpen(false);
    setOptions([]);
    setFetchError(null);
    inputRef.current?.blur();
  }

  function commitOnBlur() {
    const trimmed = query.trim();
    if (selection && trimmed === selection.label) {
      setOpen(false);
      return;
    }
    if (IATA_RE.test(trimmed)) {
      const code = trimmed.toUpperCase();
      committedIataRef.current = code;
      onChange(code);
      void hydrateFromIata(code);
      setOpen(false);
      return;
    }
    if (selection) {
      setQuery(selection.label);
    } else if (committedIataRef.current) {
      void hydrateFromIata(committedIataRef.current);
    } else {
      setQuery("");
    }
    setOpen(false);
  }

  function onInputChange(next: string) {
    setQuery(next);
    if (selection && next !== selection.label) {
      setSelection(null);
    }
    setOpen(true);
  }

  function onFocus() {
    setOpen(true);
    if (query.trim().length >= 2) updateListPosition();
  }

  function onBlur() {
    window.setTimeout(() => {
      if (pickingRef.current) return;
      commitOnBlur();
    }, 160);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showList || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter" && options[highlight]) {
      e.preventDefault();
      pick(options[highlight]!);
    }
  }

  const listContent = showList && listPos ? (
    <ul
      ref={listRef}
      id={`${listId}-listbox`}
      role="listbox"
      style={{
        position: "fixed",
        top: listPos.top,
        left: listPos.left,
        width: listPos.width,
        zIndex: 9999,
      }}
      className="max-h-72 overflow-auto rounded-xl border border-stone-200/90 bg-white py-1.5 shadow-xl shadow-stone-900/15 ring-1 ring-stone-900/5"
    >
      {loading && options.length === 0 && !fetchError ? (
        <li className="px-4 py-3 text-sm text-stone-500">Searching places…</li>
      ) : null}
      {fetchError ? (
        <li className="px-4 py-3 text-sm text-amber-800">{fetchError}</li>
      ) : null}
      {!loading && !fetchError && options.length === 0 ? (
        <li className="px-4 py-3 text-sm text-stone-500">
          No matches for &ldquo;{q}&rdquo;. Try a 3-letter code (e.g. JFK) or another spelling.
        </li>
      ) : null}
      {options.map((opt, i) => (
        <li key={`${opt.iata}-${i}`} role="presentation">
          <button
            type="button"
            role="option"
            aria-selected={i === highlight}
            className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${
              i === highlight ? "bg-sky-50" : "hover:bg-stone-50"
            }`}
            onPointerDown={() => {
              pickingRef.current = true;
            }}
            onPointerUp={() => {
              pickingRef.current = false;
            }}
            onClick={() => pick(opt)}
            onMouseEnter={() => setHighlight(i)}
          >
            <span className="mt-0.5 shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">
              {opt.iata}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-stone-900">
                {opt.label}
              </span>
              {opt.subtitle ? (
                <span className="block truncate text-xs text-stone-500">{opt.subtitle}</span>
              ) : null}
            </span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  if (!enableSuggestions) {
    return (
      <label className={`block text-sm ${className}`}>
        <span className={flightFieldLabel}>{label}</span>
        <input
          required={required}
          maxLength={3}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className={`${flightFieldInput} uppercase tracking-wider ${inputClassName}`}
          placeholder={placeholder}
          aria-label={label}
        />
      </label>
    );
  }

  return (
    <div ref={rootRef} className={`relative z-20 block text-sm ${className}`}>
      <label htmlFor={listId} className={flightFieldLabel}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={listId}
          required={required}
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className={`${flightFieldInput} pr-9 ${inputClassName}`}
          placeholder={placeholder}
        />
        {loading ? (
          <span
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-stone-200 border-t-sky-600"
            aria-hidden
          />
        ) : (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
            aria-hidden
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </span>
        )}
      </div>

      {mounted && listContent ? createPortal(listContent, document.body) : null}
    </div>
  );
}
