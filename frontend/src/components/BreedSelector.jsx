import React, { useState, useRef, useEffect, useCallback } from "react";
import { BREED_NAMES, INDIAN_BREEDS, getBreedInfo } from "../data/breeds";

const INDIAN_BREED_NAMES = new Set(INDIAN_BREEDS.map((b) => b.name));

export default function BreedSelector({ value, onChange, placeholder = "Search breed..." }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter breeds based on query
  const filtered = query.length < 1
    ? BREED_NAMES.slice(0, 30) // show first 30 when no query
    : BREED_NAMES.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 40);

  // Group: show Indian breeds first in results
  const sortedFiltered = [
    ...filtered.filter((n) => INDIAN_BREED_NAMES.has(n)),
    ...filtered.filter((n) => !INDIAN_BREED_NAMES.has(n)),
  ];

  const handleSelect = useCallback((name) => {
    setQuery(name);
    setOpen(false);
    onChange(name);
    const info = getBreedInfo(name);
    if (info) onChange(name, info);
  }, [onChange]);

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") setHighlighted((h) => Math.min(h + 1, sortedFiltered.length - 1));
    else if (e.key === "ArrowUp") setHighlighted((h) => Math.max(h - 1, 0));
    else if (e.key === "Enter" && sortedFiltered[highlighted]) handleSelect(sortedFiltered[highlighted]);
    else if (e.key === "Escape") setOpen(false);
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlighted];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.closest(".breed-selector-root")?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const breedInfo = value ? getBreedInfo(value) : null;

  return (
    <div className="breed-selector-root" style={{ position: "relative" }}>
      {/* Search input */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "10px 36px 10px 14px",
            borderRadius: "8px",
            background: "rgba(0,0,0,0.25)",
            border: `1px solid ${open ? "rgba(99,102,241,0.6)" : "var(--border-color)"}`,
            color: "var(--text-main)",
            outline: "none",
            fontSize: "13px",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(""); onChange(""); setOpen(true); inputRef.current?.focus(); }}
            style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)",
              fontSize: "14px", padding: "0", lineHeight: 1
            }}
          >✕</button>
        )}
      </div>

      {/* Breed info badge */}
      {breedInfo && (
        <div style={{
          marginTop: "6px", padding: "6px 10px", borderRadius: "8px",
          background: INDIAN_BREED_NAMES.has(breedInfo.name)
            ? "rgba(255,153,51,0.12)" : "rgba(99,102,241,0.08)",
          border: `1px solid ${INDIAN_BREED_NAMES.has(breedInfo.name) ? "rgba(255,153,51,0.25)" : "rgba(99,102,241,0.2)"}`,
          fontSize: "11px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center"
        }}>
          {INDIAN_BREED_NAMES.has(breedInfo.name) && (
            <span style={{ color: "#ff9933", fontWeight: 700 }}>🇮🇳 Indian Breed</span>
          )}
          <span style={{ opacity: 0.7 }}>📍 {breedInfo.origin}</span>
          <span style={{ opacity: 0.7 }}>📏 {breedInfo.size}</span>
          <span style={{ opacity: 0.7 }}>💡 {breedInfo.temperament}</span>
        </div>
      )}

      {/* Dropdown */}
      {open && sortedFiltered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
          background: "rgba(15,15,25,0.97)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "10px", overflow: "hidden",
          boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          maxHeight: "260px", overflowY: "auto",
        }}>
          {/* Indian breeds header if any shown */}
          {sortedFiltered.some((n) => INDIAN_BREED_NAMES.has(n)) && (
            <div style={{
              padding: "6px 12px", fontSize: "10px", fontWeight: 700,
              color: "#ff9933", letterSpacing: "0.08em", textTransform: "uppercase",
              borderBottom: "1px solid rgba(255,153,51,0.15)",
              background: "rgba(255,153,51,0.05)"
            }}>🇮🇳 Indian Breeds</div>
          )}
          <ul ref={listRef} style={{ listStyle: "none", margin: 0, padding: "4px 0" }}>
            {sortedFiltered.map((name, i) => {
              const isIndian = INDIAN_BREED_NAMES.has(name);
              const info = getBreedInfo(name);
              // Add "All Breeds" divider
              const prevWasIndian = i > 0 && INDIAN_BREED_NAMES.has(sortedFiltered[i - 1]);
              const showDivider = !isIndian && prevWasIndian;
              return (
                <React.Fragment key={name}>
                  {showDivider && (
                    <li style={{
                      padding: "5px 12px", fontSize: "10px", fontWeight: 700,
                      color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase",
                      borderTop: "1px solid rgba(255,255,255,0.06)"
                    }}>🌍 All Breeds</li>
                  )}
                  <li
                    onMouseDown={() => handleSelect(name)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      padding: "9px 14px",
                      cursor: "pointer",
                      background: i === highlighted ? "rgba(99,102,241,0.18)" : "transparent",
                      transition: "background 0.1s",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderLeft: i === highlighted
                        ? "3px solid rgba(99,102,241,0.8)" : "3px solid transparent",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: i === highlighted ? "white" : "rgba(255,255,255,0.85)" }}>
                      {isIndian && <span style={{ marginRight: "6px", fontSize: "11px" }}>🇮🇳</span>}
                      {name}
                    </span>
                    {info && (
                      <span style={{
                        fontSize: "10px", opacity: 0.45,
                        background: "rgba(255,255,255,0.06)", borderRadius: "4px",
                        padding: "2px 6px"
                      }}>{info.size}</span>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
          {/* Type hint */}
          <div style={{
            padding: "6px 12px", fontSize: "10px", opacity: 0.35,
            borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center"
          }}>
            ↑↓ navigate · Enter select · Esc close · {BREED_NAMES.length} breeds
          </div>
        </div>
      )}
    </div>
  );
}
