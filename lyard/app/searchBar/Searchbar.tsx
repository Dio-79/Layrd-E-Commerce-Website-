"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { searchItems, type SearchItem } from "@/lib/Search/search";
import { getSearchItems } from "@/lib/Search/Searchindex";
import { ROUTES } from "@/lib/Routes/Routes";
import styles from "./SearchBar.module.css";

const MAX_SUGGESTIONS = 6;
const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Header search: a magnifier button that opens a search box with live suggestions.
 * Arrow keys move through the suggestions, Enter opens one (or the full results page),
 * Escape closes.
 */
export default function SearchBar() {
  const router = useRouter();
  const uid = useId();
  const panelId = `${uid}-panel`;
  const listId = `${uid}-list`;
  const optionId = (i: number) => `${uid}-option-${i}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);

  const items = useMemo(() => getSearchItems(), []);
  const results = useMemo(() => searchItems(items, query, MAX_SUGGESTIONS), [items, query]);

  const trimmed = query.trim();
  // The suggestions plus a final "see all results" row
  const rowCount = trimmed ? results.length + 1 : 0;

  const close = (returnFocus = false) => {
    setOpen(false);
    setActive(-1);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close when clicking anywhere outside the search box
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const goToItem = (item: SearchItem) => {
    router.push(item.href);
    close();
  };

  const goToResultsPage = () => {
    if (!trimmed) return;
    router.push(`${ROUTES.search}?q=${encodeURIComponent(trimmed)}`);
    close();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowCount) setActive((a) => (a + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (rowCount) setActive((a) => (a <= 0 ? rowCount - 1 : a - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (active >= 0 && active < results.length) goToItem(results[active]);
    else goToResultsPage();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-label="Search"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {open && (
        <div id={panelId} className={styles.panel}>
          <form role="search" onSubmit={onSubmit} className={styles.form}>
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              className={styles.input}
              aria-label="Search the store"
              aria-expanded={rowCount > 0}
              aria-controls={trimmed ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? optionId(active) : undefined}
              placeholder="Search products…"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
            />
            <button type="submit" className={styles.go} disabled={!trimmed}>
              Search
            </button>
          </form>

          {trimmed && (
            <ul id={listId} role="listbox" aria-label="Search suggestions" className={styles.list}>
              {results.map((item, i) => (
                <li
                  key={item.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={active === i}
                  className={styles.option}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToItem(item)}
                >
                  <span className={styles.thumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : null}
                  </span>
                  <span className={styles.optionText}>
                    <span className={styles.optionName}>{item.name}</span>
                    <span className={styles.optionMeta}>
                      {item.category}
                      {item.price !== undefined ? ` · ${money(item.price)}` : ""}
                    </span>
                  </span>
                </li>
              ))}

              <li
                id={optionId(results.length)}
                role="option"
                aria-selected={active === results.length}
                className={`${styles.option} ${styles.seeAll}`}
                onMouseEnter={() => setActive(results.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToResultsPage}
              >
                {results.length > 0 ? `See all results for “${trimmed}”` : `No quick matches for “${trimmed}”. Search the full store`}
              </li>
            </ul>
          )}

          <p className={styles.srOnly} aria-live="polite">
            {trimmed ? `${results.length} suggestion${results.length === 1 ? "" : "s"} available` : ""}
          </p>
        </div>
      )}
    </div>
  );
}